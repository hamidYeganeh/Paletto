import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { Model } from "mongoose"
import {
  AuditEntry,
  AuditDocument,
} from "./schemas/session.schema"

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditEntry.name) private readonly audit: Model<AuditDocument>
  ) {}

  async record(
    actorId: string,
    action: string,
    targetId: string
  ): Promise<void> {
    await this.audit.create({ actorId, action, targetId })
  }

  async recent(limit = 100) {
    return this.audit.find().sort({ createdAt: -1 }).limit(limit).lean()
  }
}
