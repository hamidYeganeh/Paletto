import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import {
  Artwork,
  ArtworkSchema,
  Event,
  EventSchema,
} from "@/catalog/schemas/entity.schemas"
import { Order, OrderSchema } from "./schemas/order.schema"
import { Membership, MembershipSchema } from "@/teams/schemas/membership.schema"
import { AuditModule } from "@/audit/audit.module"
import { CampaignsModule } from "@/campaigns/campaigns.module"
import { OrdersService } from "./orders.service"
import { OrdersController } from "./orders.controller"

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Event.name, schema: EventSchema },
      { name: Artwork.name, schema: ArtworkSchema },
      { name: Membership.name, schema: MembershipSchema },
    ]),
    AuditModule,
    CampaignsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
