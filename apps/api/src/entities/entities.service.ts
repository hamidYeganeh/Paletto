import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { Model, Types } from "mongoose"
import {
  Artwork,
  ArtworkDocument,
  ENTITY_ROLES,
  EntityType,
  Event,
  EventDocument,
  Gallery,
  GalleryDocument,
} from "@/catalog/schemas/entity.schemas"
import { Order, OrderDocument } from "@/orders/schemas/order.schema"
import { AuditService } from "@/audit/audit.service"
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/common/errors/domain.errors"

type EntityDoc = GalleryDocument | EventDocument | ArtworkDocument
type AnyId = string | Types.ObjectId

const ACTIVE = ["pending", "confirmed", "refund_requested"] as const

@Injectable()
export class EntitiesService {
  constructor(
    @InjectModel(Gallery.name) private readonly galleries: Model<GalleryDocument>,
    @InjectModel(Event.name) private readonly events: Model<EventDocument>,
    @InjectModel(Artwork.name) private readonly artworks: Model<ArtworkDocument>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    private readonly audit: AuditService
  ) {}

  private static canManage(
    role: string,
    userId: string,
    ownerId: AnyId
  ): boolean {
    return userId === String(ownerId) || role === "admin"
  }

  private async findDoc(
    type: EntityType,
    id: string
  ): Promise<EntityDoc | null> {
    if (!Types.ObjectId.isValid(id)) return null
    switch (type) {
      case "galleries":
        return this.galleries.findById(id)
      case "events":
        return this.events.findById(id)
      case "artworks":
        return this.artworks.findById(id)
    }
  }

  async submit(
    actor: { id: string; role: string },
    input: {
      type: EntityType
      id?: string
      data: Record<string, unknown>
    }
  ): Promise<EntityDoc> {
    if (!ENTITY_ROLES[input.type].includes(actor.role as never)) {
      throw new ForbiddenError("این عملیات برای نقش شما مجاز نیست.")
    }
    const existing = input.id
      ? await this.findDoc(input.type, input.id)
      : null
    if (input.id && !existing) throw new NotFoundError("مورد پیدا نشد.")
    if (
      existing &&
      !EntitiesService.canManage(actor.role, actor.id, existing.ownerId)
    ) {
      throw new ForbiddenError("فقط مالک می‌تواند ویرایش کند.")
    }
    if (existing) {
      const hasActiveOrders = await this.orders.exists({
        resourceId: existing._id,
        status: { $in: [...ACTIVE] },
      })
      if (hasActiveOrders) {
        throw new ConflictError(
          "این مورد سفارش فعال دارد؛ برای تغییر برنامه ابتدا فرایند لغو را انجام دهید."
        )
      }
    }

    // Reset review state on edit; new submissions enter the moderation queue.
    const create = async (): Promise<EntityDoc> => {
      if (input.type === "galleries")
        return this.galleries.create({
          ...(input.data as object),
          ownerId: actor.id,
          status: "pending",
        })
      if (input.type === "events")
        return this.events.create({
          ...(input.data as object),
          ownerId: actor.id,
          status: "pending",
        })
      return this.artworks.create({
        ...(input.data as object),
        ownerId: actor.id,
        status: "pending",
      })
    }
    const update = async (): Promise<EntityDoc | null> => {
      const patch = { ...input.data, status: "pending", reviewNote: "" }
      if (input.type === "galleries")
        return this.galleries.findByIdAndUpdate(input.id, { $set: patch }, { new: true })
      if (input.type === "events")
        return this.events.findByIdAndUpdate(input.id, { $set: patch }, { new: true })
      return this.artworks.findByIdAndUpdate(input.id, { $set: patch }, { new: true })
    }

    const doc = existing ? await update() : await create()
    if (!doc) throw new NotFoundError("مورد پیدا نشد.")
    await this.audit.record(actor.id, "entity.submit", String(doc._id))
    return doc
  }

  async moderate(
    actorId: string,
    input: {
      type: EntityType
      id: string
      status: "published" | "rejected"
      note: string
    }
  ): Promise<EntityDoc> {
    const item = await this.findDoc(input.type, input.id)
    if (!item) throw new NotFoundError("مورد پیدا نشد.")
    if (item.status !== "pending") {
      throw new ConflictError("فقط موارد در انتظار بررسی قابل تأیید هستند.")
    }
    item.status = input.status
    item.reviewNote = input.note
    await item.save()
    await this.audit.record(actorId, `moderation.${input.status}`, input.id)
    return item
  }

  async pendingQueue(type?: EntityType): Promise<EntityDoc[]> {
    const filter = { status: "pending" as const }
    const [galleries, events, artworks] = await Promise.all([
      this.galleries.find(filter).lean(),
      this.events.find(filter).lean(),
      this.artworks.find(filter).lean(),
    ])
    const all = [...galleries, ...events, ...artworks] as EntityDoc[]
    if (type) {
      return all.filter((d) =>
        type === "galleries"
          ? "address" in d
          : type === "events"
            ? "startsAt" in d
            : "artistName" in d
      )
    }
    return all
  }

  async mine(actor: { id: string; role: string }) {
    const own = (doc: EntityDoc) =>
      String(doc.ownerId) === actor.id || actor.role === "admin"
    const [galleries, events, artworks] = await Promise.all([
      this.galleries.find().limit(500),
      this.events.find().limit(500),
      this.artworks.find().limit(500),
    ])
    return {
      galleries: galleries.filter(own),
      events: events.filter(own),
      artworks: artworks.filter(own),
    }
  }

  async byId(type: EntityType, id: string): Promise<EntityDoc> {
    const doc = await this.findDoc(type, id)
    if (!doc) throw new NotFoundError("مورد پیدا نشد.")
    return doc
  }

  /** Valid published gallery assignment; also enforces ownership for artworks. */
  async assertGalleryAssignable(
    actor: { id: string; role: string },
    galleryId: string
  ): Promise<void> {
    if (!Types.ObjectId.isValid(galleryId)) {
      throw new ValidationError("یک گالری منتشرشده انتخاب کنید.")
    }
    const gallery = await this.galleries.findById(galleryId)
    if (!gallery || gallery.status !== "published") {
      throw new ValidationError("یک گالری منتشرشده انتخاب کنید.")
    }
    if (!EntitiesService.canManage(actor.role, actor.id, gallery.ownerId)) {
      throw new ForbiddenError(
        "برای انتساب اثر به این گالری، درخواست همکاری ارسال کنید."
      )
    }
  }
}
