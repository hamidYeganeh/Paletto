import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose"

/**
 * Server-side session record. Only the SHA-256 hash of the bearer token is
 * stored, so a database leak cannot mint sessions. Documents expire via TTL.
 */
@Schema({ collection: "sessions", timestamps: true })
export class Session {
  @Prop({ required: true, unique: true })
  tokenHash!: string

  @Prop({ required: true, index: true, type: MongooseSchema.Types.ObjectId })
  userId!: Types.ObjectId

  @Prop({ required: true })
  expiresAt!: Date
}

export type SessionDocument = HydratedDocument<Session>
export const SessionSchema = SchemaFactory.createForClass(Session)

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

/** Append-only staff/user action log. */
@Schema({ collection: "audit", timestamps: true })
export class AuditEntry {
  /** ObjectId for users, or a literal like "payment-provider" for systems. */
  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  actorId!: Types.ObjectId | string

  @Prop({ required: true, maxlength: 200 })
  action!: string

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  targetId!: Types.ObjectId | string
}

export type AuditDocument = HydratedDocument<AuditEntry>
export const AuditSchema = SchemaFactory.createForClass(AuditEntry)

AuditSchema.index({ createdAt: -1 })
