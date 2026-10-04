import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import {
  Artwork,
  ArtworkSchema,
  Event,
  EventSchema,
  Gallery,
  GallerySchema,
} from "@/catalog/schemas/entity.schemas"
import { Order, OrderSchema } from "@/orders/schemas/order.schema"
import { AuditModule } from "@/audit/audit.module"
import { EntitiesService } from "./entities.service"
import { EntitiesController } from "./entities.controller"

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Gallery.name, schema: GallerySchema },
      { name: Event.name, schema: EventSchema },
      { name: Artwork.name, schema: ArtworkSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    AuditModule,
  ],
  controllers: [EntitiesController],
  providers: [EntitiesService],
  exports: [EntitiesService],
})
export class EntitiesModule {}
