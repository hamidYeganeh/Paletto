import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import {
  Artwork,
  ArtworkSchema,
  Event,
  EventSchema,
  Gallery,
  GallerySchema,
} from "./schemas/entity.schemas"
import { Order, OrderSchema } from "@/orders/schemas/order.schema"
import { UsersModule } from "@/users/users.module"
import { CatalogService } from "./catalog.service"
import { CatalogController } from "./catalog.controller"

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Gallery.name, schema: GallerySchema },
      { name: Event.name, schema: EventSchema },
      { name: Artwork.name, schema: ArtworkSchema },
    ]),
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    UsersModule,
  ],
  providers: [CatalogService],
  controllers: [CatalogController],
  exports: [CatalogService],
})
export class CatalogModule {}
