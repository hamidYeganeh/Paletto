import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { Order, OrderSchema } from "@/orders/schemas/order.schema"
import {
  Event,
  EventSchema,
  Artwork,
  ArtworkSchema,
} from "@/catalog/schemas/entity.schemas"
import { AuditModule } from "@/audit/audit.module"
import {
  PAYMENT_GATEWAY,
  ZarinpalGateway,
} from "./payment-gateway.port"
import { PaymentsService } from "./payments.service"
import { PaymentsController } from "./payments.controller"

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Event.name, schema: EventSchema },
      { name: Artwork.name, schema: ArtworkSchema },
    ]),
    AuditModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    { provide: PAYMENT_GATEWAY, useClass: ZarinpalGateway },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
