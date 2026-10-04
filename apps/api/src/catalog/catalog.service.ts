import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { Model } from "mongoose"
import { env } from "@/config/env"
import {
  Artwork,
  ArtworkDocument,
  EntityDocument,
  Event,
  EventDocument,
  Gallery,
  GalleryDocument,
} from "@/catalog/schemas/entity.schemas"
import { Order, OrderDocument } from "@/orders/schemas/order.schema"
import { UsersService } from "@/users/users.service"

const ACTIVE = ["pending", "confirmed", "refund_requested"] as const

@Injectable()
export class CatalogService {
  constructor(
    @InjectModel(Gallery.name) private readonly galleries: Model<GalleryDocument>,
    @InjectModel(Event.name) private readonly events: Model<EventDocument>,
    @InjectModel(Artwork.name) private readonly artworks: Model<ArtworkDocument>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    private readonly users: UsersService
  ) {}

  private async usedMap(): Promise<Map<string, number>> {
    const rows = await this.orders.aggregate<{ _id: string; total: number }>([
      { $match: { status: { $in: [...ACTIVE] } } },
      { $group: { _id: "$resourceId", total: { $sum: "$quantity" } } },
    ])
    return new Map(rows.map((r) => [r._id as string, r.total]))
  }

  async catalog() {
    const used = await this.usedMap()
    const remaining = (doc: EntityDocument) => {
      const capacity =
        "capacity" in doc ? (doc as EventDocument).capacity
        : "stock" in doc ? (doc as ArtworkDocument).stock
        : undefined
      return capacity === undefined
        ? undefined
        : Math.max(0, capacity - (used.get(String(doc._id)) ?? 0))
    }
    const [galleries, events, artworks, artists] = await Promise.all([
      this.galleries.find({ status: "published" }).sort({ createdAt: -1 }).limit(500).lean(),
      this.events.find({ status: "published" }).sort({ startsAt: 1 }).limit(500).lean(),
      this.artworks.find({ status: "published" }).sort({ createdAt: -1 }).limit(500).lean(),
      this.users.listArtists(),
    ])
    return {
      galleries,
      events: events.map((e) => ({ ...e, remaining: remaining(e as never) })),
      artworks: artworks.map((a) => ({ ...a, remaining: remaining(a as never) })),
      artists,
      demo: env().NODE_ENV !== "production" && process.env.PALETTO_DEMO === "true",
    }
  }
}
