import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { HydratedDocument, Types } from "mongoose"
import type { Role } from "@/users/schemas/user.schema"

const ENTITY_TYPES = ["galleries", "events", "artworks"] as const
export type EntityType = (typeof ENTITY_TYPES)[number]

const STATUSES = [
  "draft",
  "pending",
  "published",
  "rejected",
  "cancelled",
] as const
export type EntityStatus = (typeof STATUSES)[number]

/** Shared fields across galleries, events and artworks. */
@Schema({ timestamps: true })
export class Entity {
  @Prop({ required: true, index: true })
  ownerId!: Types.ObjectId

  @Prop({ required: true, trim: true, maxlength: 300 })
  title!: string

  @Prop({ required: true, trim: true, minlength: 10, maxlength: 6000 })
  description!: string

  @Prop({ required: true, maxlength: 1500 })
  image!: string

  @Prop({ required: true, trim: true, maxlength: 300, index: true })
  city!: string

  @Prop({ required: true, maxlength: 100 })
  medium!: string

  @Prop({ required: true, enum: STATUSES, default: "pending", index: true })
  status!: EntityStatus

  @Prop({ default: "", maxlength: 2000 })
  reviewNote!: string

  @Prop({ default: false })
  demo!: boolean
}

export type EntityDocument = HydratedDocument<Entity>
export const EntitySchema = SchemaFactory.createForClass(Entity)
export { ENTITY_TYPES }

/** Gallery entity — venue metadata. */
@Schema({ collection: "galleries" })
export class Gallery extends Entity {
  @Prop({ maxlength: 100 })
  opensAt?: string

  @Prop({ maxlength: 100 })
  closesAt?: string

  @Prop({ type: [Number], default: [] })
  closedDays!: number[]

  @Prop({ required: true, maxlength: 100 })
  kind!: string

  @Prop({ required: true, maxlength: 300 })
  address!: string

  @Prop({ required: true, maxlength: 300 })
  hours!: string

  @Prop({ required: true, maxlength: 300 })
  accessibility!: string

  @Prop({ min: -90, max: 90 })
  latitude?: number

  @Prop({ min: -180, max: 180 })
  longitude?: number
}

export type GalleryDocument = HydratedDocument<Gallery>
export const GallerySchema = SchemaFactory.createForClass(Gallery)

/** Event entity — a single session with its own time and capacity. */
@Schema({ collection: "events" })
export class Event extends Entity {
  @Prop({ required: true, maxlength: 100 })
  kind!: string

  @Prop({ required: true, index: true })
  galleryId!: Types.ObjectId

  @Prop({ required: true, enum: ["open", "free", "paid"] })
  admission!: "open" | "free" | "paid"

  @Prop({ required: true, index: true })
  startsAt!: Date

  @Prop({ required: true })
  endsAt!: Date

  @Prop({ required: true, min: 1, max: 100000 })
  capacity!: number

  @Prop({ required: true, min: 0, max: 100000000, default: 0 })
  price!: number

  @Prop({ required: true, min: 0, max: 720, default: 24 })
  refundHours!: number
}

export type EventDocument = HydratedDocument<Event>
export const EventSchema = SchemaFactory.createForClass(Event)

/** Artwork entity — unique physical inventory. */
@Schema({ collection: "artworks" })
export class Artwork extends Entity {
  @Prop({ required: true, maxlength: 300 })
  artistName!: string

  @Prop({ required: true, maxlength: 100 })
  style!: string

  @Prop({ required: true, maxlength: 300 })
  technique!: string

  @Prop({ required: true, maxlength: 300 })
  dimensions!: string

  @Prop({ required: true, maxlength: 100 })
  year!: string

  @Prop({ required: true, min: 0, max: 100000000000, default: 0 })
  price!: number

  @Prop({ required: true, min: 1, max: 1000 })
  stock!: number

  @Prop({ required: true, enum: ["sale", "inquiry", "display"] })
  availability!: "sale" | "inquiry" | "display"

  @Prop({ required: true, index: true })
  galleryId!: Types.ObjectId
}

export type ArtworkDocument = HydratedDocument<Artwork>
export const ArtworkSchema = SchemaFactory.createForClass(Artwork)

export const ENTITY_ROLES: Record<EntityType, Role[]> = {
  galleries: ["gallery", "admin"],
  events: ["artist", "gallery", "organizer", "curator", "admin"],
  artworks: ["artist", "gallery", "admin"],
}
