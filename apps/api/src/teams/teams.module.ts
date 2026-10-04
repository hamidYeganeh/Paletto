import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { Membership, MembershipSchema } from "./schemas/membership.schema"
import { User, UserSchema } from "@/users/schemas/user.schema"
import { Event, EventSchema } from "@/catalog/schemas/entity.schemas"
import { AuditModule } from "@/audit/audit.module"
import { EventsService } from "@/entities/events-ownership.service"
import { TeamsService } from "./teams.service"
import { TeamsController } from "./teams.controller"

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Membership.name, schema: MembershipSchema },
      { name: User.name, schema: UserSchema },
      { name: Event.name, schema: EventSchema },
    ]),
    AuditModule,
  ],
  controllers: [TeamsController],
  providers: [TeamsService, EventsService],
  exports: [TeamsService],
})
export class TeamsModule {}
