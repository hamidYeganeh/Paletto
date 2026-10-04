import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { Model, Types } from "mongoose"
import {
  Artwork,
  ArtworkDocument,
  Event,
  EventDocument,
  Gallery,
  GalleryDocument,
} from "@/catalog/schemas/entity.schemas"
import { User, UserDocument } from "@/users/schemas/user.schema"
import {
  RequestItem,
  RequestDocument,
} from "./schemas/request.schema"
import {
  ForbiddenError,
  NotFoundError,
} from "@/common/errors/domain.errors"

@Injectable()
export class RequestsService {
  constructor(
    @InjectModel(RequestItem.name)
    private readonly requests: Model<RequestDocument>,
    @InjectModel(Artwork.name) private readonly artworks: Model<ArtworkDocument>,
    @InjectModel(Event.name) private readonly events: Model<EventDocument>,
    @InjectModel(Gallery.name)
    private readonly galleries: Model<GalleryDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>
  ) {}

  async create(
    actor: { id: string },
    input: {
      resourceId: string
      kind: "inquiry" | "submission" | "commission" | "support"
      message: string
    }
  ): Promise<RequestDocument> {
    let ownerId: Types.ObjectId | string = "admin"
    const [artwork, event, gallery, artist] = await Promise.all([
      this.artworks.findById(input.resourceId),
      this.events.findById(input.resourceId),
      this.galleries.findById(input.resourceId),
      this.users.findOne({
        _id: Types.ObjectId.isValid(input.resourceId)
          ? input.resourceId
          : undefined,
        role: { $in: ["artist", "curator"] },
      }),
    ])
    const target = artwork ?? event ?? gallery
    if (target) ownerId = target.ownerId
    else if (artist) ownerId = artist._id
    else if (input.kind !== "support") {
      throw new NotFoundError("مقصد درخواست پیدا نشد.")
    }
    return this.requests.create({
      ...input,
      userId: new Types.ObjectId(actor.id),
      ownerId,
      resourceId: Types.ObjectId.isValid(input.resourceId)
        ? new Types.ObjectId(input.resourceId)
        : undefined,
    })
  }

  async reply(
    actor: { id: string; role: string },
    input: { id: string; reply: string }
  ): Promise<RequestDocument> {
    const item = await this.requests.findById(input.id)
    if (!item) throw new NotFoundError("درخواست پیدا نشد.")
    if (actor.role !== "admin" && String(item.ownerId) !== actor.id) {
      throw new ForbiddenError("دسترسی ندارید.")
    }
    item.reply = input.reply
    item.status = "answered"
    await item.save()
    return item
  }

  async forUser(userId: string, role: string) {
    const filter =
      role === "admin"
        ? {}
        : {
            $or: [
              { userId: new Types.ObjectId(userId) },
              { ownerId: new Types.ObjectId(userId) },
            ],
          }
    return this.requests.find(filter).sort({ createdAt: -1 }).limit(200)
  }
}
