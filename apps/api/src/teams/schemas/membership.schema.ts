import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { HydratedDocument, Types } from "mongoose"

/** Grants door-check-in access for one event to a colleague. */
@Schema({ collection: "memberships", timestamps: true })
export class Membership {
  @Prop({ required: true, index: true })
  ownerId!: Types.ObjectId

  @Prop({ required: true, index: true })
  eventId!: Types.ObjectId

  @Prop({ required: true, index: true })
  userId!: Types.ObjectId
}

export type MembershipDocument = HydratedDocument<Membership>
export const MembershipSchema = SchemaFactory.createForClass(Membership)

MembershipSchema.index({ eventId: 1, userId: 1 }, { unique: true })
