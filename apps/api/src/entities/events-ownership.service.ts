import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { Model } from "mongoose"
import { Event, EventDocument } from "@/catalog/schemas/entity.schemas"
import { ForbiddenError, NotFoundError } from "@/common/errors/domain.errors"

/** Single source of truth for "does this actor manage this event?" */
@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private readonly events: Model<EventDocument>
  ) {}

  async assertEventOwnership(
    eventId: string,
    actor: { id: string; role: string }
  ): Promise<void> {
    const event = await this.events.findById(eventId)
    if (!event) throw new NotFoundError("رویداد پیدا نشد.")
    if (actor.role !== "admin" && String(event.ownerId) !== actor.id) {
      throw new ForbiddenError("رویداد متعلق به شما نیست.")
    }
  }

  async findOwnedOrMember(
    actor: { id: string; role: string },
    membershipModel: Model<{ eventId: unknown; userId: unknown }>
  ) {
    return this.events.find({
      $or: [
        { ownerId: actor.id },
        ...(membershipModel ? [] : []),
      ],
    })
  }
}
