import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { HydratedDocument, Types } from "mongoose"

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
  "refund_requested",
  "refunded",
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

const FULFILLMENTS = ["processing", "shipped", "delivered"] as const
export type Fulfillment = (typeof FULFILLMENTS)[number]

@Schema({ collection: "orders", timestamps: true })
export class Order {
  @Prop({ required: true, index: true })
  userId!: Types.ObjectId

  @Prop({ required: true, index: true })
  resourceId!: Types.ObjectId

  @Prop({ required: true, index: true })
  ownerId!: Types.ObjectId

  @Prop({ required: true, enum: ["event", "artwork"] })
  kind!: "event" | "artwork"

  @Prop({ required: true, min: 1, max: 10 })
  quantity!: number

  /** Amount in Toman. Never float. */
  @Prop({ required: true, min: 0 })
  total!: number

  @Prop({ required: true, enum: ORDER_STATUSES, default: "pending", index: true })
  status!: OrderStatus

  @Prop({ required: true })
  expiresAt!: Date

  /** Ticket check-in secret; rendered as QR for the buyer. */
  @Prop({ required: true, unique: true })
  token!: string

  @Prop({ default: false, index: true })
  checkedIn!: boolean

  /** Client-supplied idempotency key; one order per key per user. */
  @Prop({ index: true })
  idempotencyKey!: string

  @Prop()
  paymentReference?: string

  @Prop()
  campaignId?: Types.ObjectId

  @Prop({ enum: FULFILLMENTS })
  fulfillment?: Fulfillment

  @Prop({ maxlength: 300 })
  trackingCode?: string

  @Prop({
    type: {
      recipient: { type: String, required: true, maxlength: 300 },
      phone: { type: String, required: true, match: /^09[0-9]{9}$/ },
      address: { type: String, required: true, minlength: 15, maxlength: 1000 },
      postalCode: { type: String, required: true, match: /^[0-9]{10}$/ },
    },
  })
  delivery?: {
    recipient: string
    phone: string
    address: string
    postalCode: string
  }
}

export type OrderDocument = HydratedDocument<Order>
export const OrderSchema = SchemaFactory.createForClass(Order)

OrderSchema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true, sparse: true }
)
