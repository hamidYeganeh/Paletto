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
import { Save, SaveDocument, SaveKind } from "./schemas/save.schema"
import { NotFoundError } from "@/common/errors/domain.errors"

@Injectable()
export class SocialService {
  constructor(
    @InjectModel(Save.name) private readonly saves: Model<SaveDocument>,
    @InjectModel(Gallery.name) private readonly galleries: Model<GalleryDocument>,
    @InjectModel(Event.name) private readonly events: Model<EventDocument>,
    @InjectModel(Artwork.name) private readonly artworks: Model<ArtworkDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>
  ) {}

  async toggle(
    actor: { id: string },
    input: { targetId: string; kind: SaveKind }
  ): Promise<{ saved: boolean }> {
    const target = Types.ObjectId.isValid(input.targetId)
      ? await Promise.all([
          this.galleries.exists({ _id: input.targetId }),
          this.events.exists({ _id: input.targetId }),
          this.artworks.exists({ _id: input.targetId }),
          this.users.exists({ _id: input.targetId }),
        ])
      : [false, false, false, false]
    if (!target.some(Boolean)) throw new NotFoundError("مورد پیدا نشد.")

    const filter = {
      userId: new Types.ObjectId(actor.id),
      targetId: new Types.ObjectId(input.targetId),
      kind: input.kind,
    }
    const removed = await this.saves.findOneAndDelete(filter)
    if (removed) return { saved: false }
    await this.saves.create(filter)
    return { saved: true }
  }

  async mine(userId: string) {
    return this.saves.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(500)
  }
}
