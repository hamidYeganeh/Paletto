import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common"
import { APP_FILTER, APP_GUARD } from "@nestjs/core"
import { MongooseModule } from "@nestjs/mongoose"
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler"
import { JwtModule } from "@nestjs/jwt"
import { env } from "@/config/env"
import { JwtAuthGuard, RolesGuard } from "@/common/guards"
import { AllExceptionsFilter } from "@/common/filters/http-exception.filter"
import { OriginCheckMiddleware } from "@/common/middleware/origin-check.middleware"
import { AuthModule } from "@/auth/auth.module"
import { UsersModule } from "@/users/users.module"
import { CatalogModule } from "@/catalog/catalog.module"
import { EntitiesModule } from "@/entities/entities.module"
import { OrdersModule } from "@/orders/orders.module"
import { CampaignsModule } from "@/campaigns/campaigns.module"
import { RequestsModule } from "@/requests/requests.module"
import { TeamsModule } from "@/teams/teams.module"
import { SocialModule } from "@/social/social.module"
import { PaymentsModule } from "@/payments/payments.module"
import { DashboardModule } from "@/dashboard/dashboard.module"
import { AuditModule } from "@/audit/audit.module"
import { HealthModule } from "@/health/health.module"

@Module({
  imports: [
    MongooseModule.forRoot(env().MONGODB_URI, {
      dbName: env().MONGODB_DB,
      autoIndex: env().NODE_ENV !== "production",
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 90 }]),
    JwtModule.register({
      secret: env().JWT_SECRET,
      signOptions: { expiresIn: env().JWT_EXPIRES_IN as never },
    }),
    AuthModule,
    UsersModule,
    CatalogModule,
    EntitiesModule,
    OrdersModule,
    CampaignsModule,
    RequestsModule,
    TeamsModule,
    SocialModule,
    PaymentsModule,
    DashboardModule,
    AuditModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(OriginCheckMiddleware).forRoutes("*")
  }
}
