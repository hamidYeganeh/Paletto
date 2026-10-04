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
import { User, UserSchema } from "@/users/schemas/user.schema"
import { RequestItem, RequestSchema } from "./schemas/request.schema"
import { RequestsService } from "./requests.service"
import { RequestsController } from "./requests.controller"

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RequestItem.name, schema: RequestSchema },
      { name: Artwork.name, schema: ArtworkSchema },
      { name: Event.name, schema: EventSchema },
      { name: Gallery.name, schema: GallerySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
