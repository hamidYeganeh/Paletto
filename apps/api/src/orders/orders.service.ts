import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { Model, Types } from "mongoose"
import {
  Artwork,
  ArtworkDocument,
  Event,
  EventDocument,
} from "@/catalog/schemas/entity.schemas"
import { Order, OrderDocument } from "./schemas/order.schema"
import {
  Membership,
  MembershipDocument,
} from "@/teams/schemas/membership.schema"
import { AuditService } from "@/audit/audit.service"
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/common/errors/domain.errors"

const ACTIVE = ["pending", "confirmed", "refund_requested"] as const

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    @InjectModel(Event.name) private readonly events: Model<EventDocument>,
    @InjectModel(Artwork.name)
    private readonly artworks: Model<ArtworkDocument>,
    @InjectModel(Membership.name)
    private readonly memberships: Model<MembershipDocument>,
    private readonly audit: AuditService
  ) {}

  /** Sum of active quantities held against a resource. */
  private async usedCount(resourceId: Types.ObjectId): Promise<number> {
    const [row] = await this.orders
      .aggregate<{ total: number }>([
        {
          $match: {
            resourceId,
            status: { $in: [...ACTIVE] },
          },
        },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ])
      .limit(1)
    return row?.total ?? 0
  }

  async reserve(
    user: { id: string },
    input: {
      resourceId: string
      kind: "event" | "artwork"
      quantity: number
      idempotencyKey: string
      code?: string
      delivery?: {
        recipient: string
        phone: string
        address: string
        postalCode: string
      }
    },
    campaign?: { id: string; percent: number } | null
  ): Promise<OrderDocument> {
    if (input.kind === "artwork" && !input.delivery) {
      throw new ValidationError("اطلاعات گیرنده و نشانی ارسال را وارد کنید.")
    }

    // Idempotency: same user + same key returns the original order.
    const previous = await this.orders.findOne({
      userId: new Types.ObjectId(user.id),
      idempotencyKey: input.idempotencyKey,
    })
    if (previous) return previous

    const resourceId = new Types.ObjectId(input.resourceId)
    const resource =
      input.kind === "event"
        ? await this.events.findById(resourceId)
        : await this.artworks.findById(resourceId)
    if (!resource || resource.status !== "published") {
      throw new NotFoundError("این مورد قابل رزرو نیست.")
    }
    if (input.kind === "event") {
      const event = resource as EventDocument
      if (event.admission === "open") {
        throw new ValidationError("بازدید آزاد به بلیت نیاز ندارد.")
      }
      if (new Date(event.startsAt).getTime() <= Date.now()) {
        throw new ConflictError("مهلت رزرو تمام شده است.")
      }
    } else {
      const artwork = resource as ArtworkDocument
      if (artwork.availability !== "sale") {
        throw new ValidationError("این اثر برای فروش عرضه نشده است.")
      }
    }

    const capacity =
      input.kind === "event"
        ? (resource as EventDocument).capacity
        : (resource as ArtworkDocument).stock
    const used = await this.usedCount(resourceId)
    if (used + input.quantity > capacity) {
      throw new ConflictError("ظرفیت کافی باقی نمانده است.")
    }

    const price = (resource as EventDocument).price
    const total = Math.floor(
      (price * input.quantity * (100 - (campaign?.percent ?? 0))) / 100
    )
    const token = (await import("node:crypto")).randomBytes(24).toString("hex")

    const order = await this.orders.create({
      userId: new Types.ObjectId(user.id),
      resourceId,
      ownerId: resource.ownerId,
      kind: input.kind,
      quantity: input.quantity,
      total,
      status: total === 0 ? "confirmed" : "pending",
      expiresAt: new Date(Date.now() + 15 * 60000),
      token,
      checkedIn: false,
      idempotencyKey: input.idempotencyKey,
      campaignId: campaign?.id,
      delivery: input.kind === "artwork" ? input.delivery : undefined,
      fulfillment: input.kind === "artwork" ? "processing" : undefined,
    })
    await this.audit.record(user.id, "order.reserve", String(order._id))
    return order
  }

  async cancel(actor: { id: string; role: string }, orderId: string) {
    const order = await this.orders.findById(orderId)
    if (!order) throw new NotFoundError("سفارش پیدا نشد.")
    if (order.userId !== new Types.ObjectId(actor.id) && actor.role !== "admin") {
      throw new ForbiddenError("دسترسی ندارید.")
    }
    if (
      !["pending", "confirmed"].includes(order.status) ||
      order.checkedIn ||
      ["shipped", "delivered"].includes(order.fulfillment ?? "")
    ) {
      throw new ConflictError("این سفارش قابل لغو نیست.")
    }
    if (order.status === "confirmed" && order.total > 0) {
      const event = await this.events.findById(order.resourceId)
      if (
        event &&
        Date.now() >
          new Date(event.startsAt).getTime() - event.refundHours * 3600000
      ) {
        throw new ConflictError("مهلت لغو این رویداد گذشته است.")
      }
    }
    order.status =
      order.status === "confirmed" && order.total > 0
        ? "refund_requested"
        : "cancelled"
    await order.save()
    await this.audit.record(actor.id, "order.cancel", String(order._id))
    return order
  }

  async ship(actor: { id: string; role: string }, input: { id: string; trackingCode: string }) {
    const order = await this.orders.findOne({
      _id: input.id,
      kind: "artwork",
    })
    if (!order) throw new NotFoundError("سفارش اثر پیدا نشد.")
    const isOwnerOrAdmin =
      actor.role === "admin" || String(order.ownerId) === actor.id
    if (!isOwnerOrAdmin) throw new ForbiddenError("دسترسی ندارید.")
    if (order.status !== "confirmed" || order.fulfillment !== "processing") {
      throw new ConflictError("فقط سفارش پرداخت‌شده و آماده ارسال قابل ثبت است.")
    }
    order.fulfillment = "shipped"
    order.trackingCode = input.trackingCode
    await order.save()
    await this.audit.record(actor.id, "artwork.ship", String(order._id))
    return order
  }

  async receive(userId: string, orderId: string) {
    const order = await this.orders.findOne({
      _id: orderId,
      userId: new Types.ObjectId(userId),
    })
    if (!order) throw new NotFoundError("سفارش پیدا نشد.")
    if (order.status !== "confirmed" || order.fulfillment !== "shipped") {
      throw new ConflictError("سفارش هنوز ارسال نشده است.")
    }
    order.fulfillment = "delivered"
    await order.save()
    await this.audit.record(userId, "artwork.receive", String(order._id))
    return order
  }

  async checkin(
    actor: { id: string; role: string },
    token: string
  ): Promise<{ title: string; quantity: number; checkedIn: true }> {
    const order = await this.orders.findOne({ token, kind: "event" })
    if (!order) throw new NotFoundError("بلیت معتبر پیدا نشد.")
    const event = await this.events.findById(order.resourceId)
    if (!event) throw new NotFoundError("رویداد پیدا نشد.")
    const isDoorStaff =
      String(order.ownerId) === actor.id ||
      actor.role === "admin" ||
      (await this.memberships.exists({
        eventId: event._id,
        userId: new Types.ObjectId(actor.id),
      })) !== null
    if (!isDoorStaff) {
      throw new ForbiddenError("این بلیت متعلق به رویداد شما نیست.")
    }
    if (order.status !== "confirmed" || order.checkedIn) {
      throw new ConflictError("بلیت لغو شده یا قبلاً استفاده شده است.")
    }
    const now = Date.now()
    const start = new Date(event.startsAt).getTime()
    const end = new Date(event.endsAt).getTime()
    if (now < start - 3600000 || now > end) {
      throw new ConflictError(
        "پذیرش از یک ساعت قبل از شروع تا پایان رویداد باز است."
      )
    }
    order.checkedIn = true
    await order.save()
    await this.audit.record(actor.id, "ticket.checkin", String(order._id))
    return { title: event.title, quantity: order.quantity, checkedIn: true }
  }

  async expireStale(): Promise<number> {
    const result = await this.orders.updateMany(
      { status: "pending", expiresAt: { $lt: new Date() } },
      { $set: { status: "cancelled" } }
    )
    return result.modifiedCount
  }

  async listForUser(userId: string) {
    return this.orders.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(200)
  }

  async findOwn(orderId: string, userId: string): Promise<OrderDocument> {
    const order = await this.orders.findOne({
      _id: orderId,
      userId: new Types.ObjectId(userId),
    })
    if (!order) throw new NotFoundError("سفارش پیدا نشد.")
    return order
  }

  async findByReference(authority: string): Promise<OrderDocument | null> {
    return this.orders.findOne({ paymentReference: authority })
  }

  async ownedByOrManaged(
    user: { id: string; role: string }
  ): Promise<OrderDocument[]> {
    const self = new Types.ObjectId(user.id)
    const filter =
      user.role === "admin"
        ? {}
        : { $or: [{ userId: self }, { ownerId: self }] }
    return this.orders.find(filter).sort({ createdAt: -1 }).limit(500)
  }
}
