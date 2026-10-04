import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { Model, Types } from "mongoose"
import { createHash } from "node:crypto"
import {
  Campaign,
  CampaignDocument,
} from "./schemas/campaign.schema"
import { Visit, VisitDocument } from "./schemas/visit.schema"
import { AuditService } from "@/audit/audit.service"
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/common/errors/domain.errors"

@Injectable()
export class CampaignsService {
  constructor(
    @InjectModel(Campaign.name)
    private readonly campaigns: Model<CampaignDocument>,
    @InjectModel(Visit.name) private readonly visits: Model<VisitDocument>,
    private readonly audit: AuditService
  ) {}

  async create(
    actor: { id: string; role: string },
    input: {
      title: string
      code: string
      percent: number
      limit: number
      eventId: string
      endsAt: Date
    },
    assertEventOwnership: (eventId: string, actor: { id: string; role: string }) => Promise<void>
  ): Promise<CampaignDocument> {
    if (!["gallery", "organizer", "curator", "admin"].includes(actor.role)) {
      throw new ForbiddenError("دسترسی بازاریابی ندارید.")
    }
    if (input.endsAt.getTime() <= Date.now()) {
      throw new ValidationError("تاریخ پایان کمپین گذشته است.")
    }
    await assertEventOwnership(input.eventId, actor)
    const duplicate = await this.campaigns.exists({ code: input.code })
    if (duplicate) throw new ConflictError("این کد قبلاً استفاده شده است.")
    const campaign = await this.campaigns.create({
      ...input,
      ownerId: new Types.ObjectId(actor.id),
    })
    await this.audit.record(actor.id, "campaign.create", String(campaign._id))
    return campaign
  }

  async end(actor: { id: string; role: string }, id: string) {
    const campaign = await this.campaigns.findById(id)
    if (!campaign) throw new NotFoundError("کمپین پیدا نشد.")
    if (actor.role !== "admin" && String(campaign.ownerId) !== actor.id) {
      throw new ForbiddenError("دسترسی ندارید.")
    }
    campaign.endsAt = new Date()
    await campaign.save()
    await this.audit.record(actor.id, "campaign.end", String(campaign._id))
    return campaign
  }

  /** Resolve an active discount code for a specific event, or null. */
  async resolveActive(
    code: string,
    eventId: string
  ): Promise<CampaignDocument | null> {
    return this.campaigns.findOne({
      code: code.toUpperCase(),
      eventId: new Types.ObjectId(eventId),
      endsAt: { $gt: new Date() },
    })
  }

  async trackVisit(code: string, visitorId: string): Promise<void> {
    const campaign = await this.campaigns.findOne({
      code: code.toUpperCase(),
      endsAt: { $gt: new Date() },
    })
    if (!campaign) return
    const visitorHash = createHash("sha256").update(visitorId).digest("hex")
    const day = new Date().toISOString().slice(0, 10)
    await this.visits.updateOne(
      { campaignId: campaign._id, visitorHash, day },
      { $setOnInsert: { campaignId: campaign._id, visitorHash, day } },
      { upsert: true }
    )
  }

  /** Campaign stats: unique visits and confirmed conversions. */
  async statsForOwner(ownerId: string) {
    return this.campaigns
      .aggregate([
        { $match: { ownerId: new Types.ObjectId(ownerId) } },
        {
          $lookup: {
            from: "visits",
            localField: "_id",
            foreignField: "campaignId",
            as: "visitRows",
          },
        },
        {
          $lookup: {
            from: "orders",
            let: { cid: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$campaignId", "$$cid"] },
                  status: "confirmed",
                },
              },
              { $count: "conversions" },
            ],
            as: "conversionRows",
          },
        },
        {
          $addFields: {
            visits: { $size: "$visitRows" },
            conversions: {
              $ifNull: [
                { $first: "$conversionRows.conversions" },
                0,
              ],
            },
          },
        },
        { $project: { visitRows: 0, conversionRows: 0 } },
      ])
      .exec()
  }
}
