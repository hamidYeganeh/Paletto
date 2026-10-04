import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import {
  Campaign,
  CampaignSchema,
} from "./schemas/campaign.schema"
import { Visit, VisitSchema } from "./schemas/visit.schema"
import { Event, EventSchema } from "@/catalog/schemas/entity.schemas"
import { AuditModule } from "@/audit/audit.module"
import { EventsService } from "@/entities/events-ownership.service"
import { CampaignsService } from "./campaigns.service"
import { CampaignsController } from "./campaigns.controller"

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: Visit.name, schema: VisitSchema },
      { name: Event.name, schema: EventSchema },
    ]),
    AuditModule,
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService, EventsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
