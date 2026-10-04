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
import { Save, SaveSchema } from "./schemas/save.schema"
import { SocialService } from "./social.service"
import { SocialController } from "./social.controller"

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Save.name, schema: SaveSchema },
      { name: Gallery.name, schema: GallerySchema },
      { name: Event.name, schema: EventSchema },
      { name: Artwork.name, schema: ArtworkSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
