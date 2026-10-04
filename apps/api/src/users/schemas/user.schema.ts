import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { HydratedDocument } from "mongoose"

export const ROLES = [
  "enthusiast",
  "collector",
  "artist",
  "gallery",
  "organizer",
  "curator",
  "admin",
] as const
export type Role = (typeof ROLES)[number]

@Schema({ collection: "users", timestamps: true })
export class User {
  @Prop({ required: true, trim: true, maxlength: 300 })
  name!: string

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 200,
    index: true,
  })
  email!: string

  @Prop({ required: true })
  passwordHash!: string

  @Prop({ required: true, enum: ROLES, default: "enthusiast" })
  role!: Role

  @Prop({ default: "", maxlength: 4000 })
  bio!: string

  @Prop({ default: "", maxlength: 100 })
  city!: string

  @Prop({ type: [String], default: [], maxlength: 16 })
  disciplines!: string[]

  @Prop({ default: false })
  marketingConsent!: boolean

  constructor() {}
}

export type UserDocument = HydratedDocument<User>
export const UserSchema = SchemaFactory.createForClass(User)
