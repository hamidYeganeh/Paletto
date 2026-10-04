import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { HydratedDocument, Types } from "mongoose"

/** One row per (campaign, visitor, day); visitor is stored hashed. */
@Schema({ collection: "visits", timestamps: true })
export class Visit {
  @Prop({ required: true, index: true })
  campaignId!: Types.ObjectId

  @Prop({ required: true, index: true })
  visitorHash!: string

  @Prop({ required: true })
  day!: string
}

export type VisitDocument = HydratedDocument<Visit>
export const VisitSchema = SchemaFactory.createForClass(Visit)

VisitSchema.index(
  { campaignId: 1, visitorHash: 1, day: 1 },
  { unique: true }
)
