import { Module } from "@nestjs/common"
import { AuthModule } from "@/auth/auth.module"
import { UsersModule } from "@/users/users.module"
import { OrdersModule } from "@/orders/orders.module"
import { EntitiesModule } from "@/entities/entities.module"
import { CampaignsModule } from "@/campaigns/campaigns.module"
import { RequestsModule } from "@/requests/requests.module"
import { SocialModule } from "@/social/social.module"
import { AuditModule } from "@/audit/audit.module"
import { DashboardService } from "./dashboard.service"
import { DashboardController } from "./dashboard.controller"

@Module({
  imports: [
    AuthModule,
    UsersModule,
    OrdersModule,
    EntitiesModule,
    CampaignsModule,
    RequestsModule,
    SocialModule,
    AuditModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
