import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { Model, Types } from "mongoose"
import { Membership, MembershipDocument } from "./schemas/membership.schema"
import { User, UserDocument } from "@/users/schemas/user.schema"
import { AuditService } from "@/audit/audit.service"
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/common/errors/domain.errors"
import { EventsService } from "@/entities/events-ownership.service"

@Injectable()
export class TeamsService {
  constructor(
    @InjectModel(Membership.name)
    private readonly memberships: Model<MembershipDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    private readonly events: EventsService,
    private readonly audit: AuditService
  ) {}

  async assign(
    actor: { id: string; role: string },
    input: { eventId: string; email: string }
  ): Promise<MembershipDocument> {
    await this.events.assertEventOwnership(input.eventId, actor)
    const colleague = await this.users.findOne({
      email: input.email.toLowerCase(),
    })
    if (!colleague) {
      throw new ValidationError("همکار ابتدا باید در پالتو حساب بسازد.")
    }
    const duplicate = await this.memberships.exists({
      eventId: new Types.ObjectId(input.eventId),
      userId: colleague._id,
    })
    if (duplicate) throw new ConflictError("این همکار قبلاً افزوده شده است.")
    const membership = await this.memberships.create({
      ownerId: new Types.ObjectId(actor.id),
      eventId: new Types.ObjectId(input.eventId),
      userId: colleague._id,
    })
    await this.audit.record(actor.id, "team.assign", String(membership._id))
    return membership.populate("userId", "name email")
  }

  async remove(actor: { id: string; role: string }, id: string): Promise<void> {
    const membership = await this.memberships.findById(id)
    if (!membership) throw new NotFoundError("همکار پیدا نشد.")
    if (actor.role !== "admin" && String(membership.ownerId) !== actor.id) {
      throw new NotFoundError("همکار پیدا نشد.")
    }
    await membership.deleteOne()
    await this.audit.record(actor.id, "team.remove", String(membership._id))
  }

  async forEvent(actor: { id: string; role: string }, eventId: string) {
    await this.events.assertEventOwnership(eventId, actor)
    return this.memberships.find({ eventId: new Types.ObjectId(eventId) })
  }
}
