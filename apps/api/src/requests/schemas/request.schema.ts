import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { HydratedDocument, Types } from "mongoose"

const REQUEST_KINDS = ["inquiry", "submission", "commission", "support"] as const
export type RequestKind = (typeof REQUEST_KINDS)[number]

const REQUEST_STATUSES = ["open", "answered", "closed"] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

@Schema({ collection: "requests", timestamps: true })
export class RequestItem {
  @Prop({ required: true, index: true })
  userId!: Types.ObjectId

  @Prop({ required: true, index: true })
  ownerId!: Types.ObjectId

  @Prop({ required: true })
  resourceId!: Types.ObjectId

  @Prop({ required: true, enum: REQUEST_KINDS })
  kind!: RequestKind

  @Prop({ required: true, trim: true, minlength: 10, maxlength: 5000 })
  message!: string

  @Prop({ default: "", maxlength: 5000 })
  reply!: string

  @Prop({ required: true, enum: REQUEST_STATUSES, default: "open", index: true })
  status!: RequestStatus
}

export type RequestDocument = HydratedDocument<RequestItem>
export const RequestSchema = SchemaFactory.createForClass(RequestItem)
