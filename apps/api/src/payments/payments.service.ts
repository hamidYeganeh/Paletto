import { Inject, Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { Model } from "mongoose"
import {
  Order,
  OrderDocument,
} from "@/orders/schemas/order.schema"
import {
  Event,
  EventDocument,
  Artwork,
  ArtworkDocument,
} from "@/catalog/schemas/entity.schemas"
import {
  PAYMENT_GATEWAY,
  PaymentGatewayPort,
} from "./payment-gateway.port"
import { AuditService } from "@/audit/audit.service"
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/common/errors/domain.errors"
import { env } from "@/config/env"

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PAYMENT_GATEWAY)
    private readonly gateway: PaymentGatewayPort,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    @InjectModel(Event.name) private readonly events: Model<EventDocument>,
    @InjectModel(Artwork.name)
    private readonly artworks: Model<ArtworkDocument>,
    private readonly audit: AuditService
  ) {}

  async start(actor: { id: string }, orderId: string) {
    if (!env().ZARINPAL_MERCHANT_ID) {
      throw new ConflictError(
        "پرداخت آنلاین هنوز توسط پالتو فعال نشده است. رزرو شما تا پایان مهلت نگهداری می‌شود."
      )
    }
    const order = await this.orders.findOne({
      _id: orderId,
      userId: actor.id,
    })
    if (!order) throw new NotFoundError("سفارش پیدا نشد.")
    if (
      order.status !== "pending" ||
      new Date(order.expiresAt).getTime() < Date.now()
    ) {
      throw new ConflictError("رزرو منقضی شده یا قابل پرداخت نیست.")
    }
    const resource = order.kind === "event"
      ? await this.events.findById(order.resourceId)
      : await this.artworks.findById(order.resourceId)
    if (resource?.demo) {
      throw new ValidationError(
        "برای داده نمونه وجه واقعی دریافت نمی‌شود."
      )
    }
    if (order.paymentReference === "requesting") {
      throw new ConflictError("درخواست پرداخت قبلی در حال بررسی است.")
    }
    if (order.paymentReference) {
      return {
        url: `https://www.zarinpal.com/pg/StartPay/${order.paymentReference}`,
      }
    }
    order.paymentReference = "requesting"
    await order.save()
    try {
      const { authority } = await this.gateway.request({
        amountRial: order.total * 10,
        description: `سفارش پالتو ${String(order._id)}`,
        callbackUrl: `${env().APP_ORIGIN}/api/v1/payments/callback`,
      })
      order.paymentReference = authority
      await order.save()
      return {
        url: `https://www.zarinpal.com/pg/StartPay/${authority}`,
      }
    } catch (error) {
      if (order.paymentReference === "requesting") {
        order.paymentReference = undefined
        await order.save()
      }
      throw error
    }
  }

  async verify(authority: string, status: string) {
    if (
      !env().ZARINPAL_MERCHANT_ID ||
      !/^[A-Za-z0-9]{20,100}$/.test(authority)
    ) {
      throw new ValidationError("اطلاعات پرداخت معتبر نیست.")
    }
    const order = await this.orders.findOne({ paymentReference: authority })
    if (!order) throw new NotFoundError("سفارش پیدا نشد.")
    if (status !== "OK") return { status: "failed" }
    if (["confirmed", "refund_requested", "refunded"].includes(order.status)) {
      return { status: order.status }
    }
    const { refId } = await this.gateway.verify({
      authority,
      amountRial: order.total * 10,
    })
    const resource =
      order.kind === "event"
        ? await this.events.findById(order.resourceId)
        : await this.artworks.findById(order.resourceId)
    if (
      order.status === "pending" &&
      new Date(order.expiresAt).getTime() > Date.now() &&
      resource?.status === "published"
    ) {
      order.status = "confirmed"
    } else {
      order.status = "refund_requested"
    }
    await order.save()
    await this.audit.record(
      "payment-provider",
      `payment.verified:${refId}`,
      String(order._id)
    )
    return { status: order.status }
  }
}
