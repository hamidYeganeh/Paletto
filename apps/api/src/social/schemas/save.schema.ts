import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { HydratedDocument, Types } from "mongoose"

const SAVE_KINDS = ["save", "follow", "trip"] as const
export type SaveKind = (typeof SAVE_KINDS)[number]

@Schema({ collection: "saves", timestamps: true })
export class Save {
  @Prop({ required: true, index: true })
  userId!: Types.ObjectId

  @Prop({ required: true, index: true })
  targetId!: Types.ObjectId

  @Prop({ required: true, enum: SAVE_KINDS })
  kind!: SaveKind
}

export type SaveDocument = HydratedDocument<Save>
export const SaveSchema = SchemaFactory.createForClass(Save)

SaveSchema.index({ userId: 1, targetId: 1, kind: 1 }, { unique: true })
