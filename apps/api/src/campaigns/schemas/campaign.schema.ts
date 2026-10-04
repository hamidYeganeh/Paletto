import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { HydratedDocument, Types } from "mongoose"

@Schema({ collection: "campaigns", timestamps: true })
export class Campaign {
  @Prop({ required: true, index: true })
  ownerId!: Types.ObjectId

  @Prop({ required: true, trim: true, maxlength: 300 })
  title!: string

  @Prop({ required: true, unique: true, uppercase: true, match: /^[A-Za-z0-9_-]{3,30}$/ })
  code!: string

  @Prop({ required: true, min: 0, max: 90 })
  percent!: number

  @Prop({ required: true, min: 1, max: 100000 })
  limit!: number

  @Prop({ required: true, index: true })
  eventId!: Types.ObjectId

  @Prop({ required: true })
  endsAt!: Date
}

export type CampaignDocument = HydratedDocument<Campaign>
export const CampaignSchema = SchemaFactory.createForClass(Campaign)
