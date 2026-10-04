import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
} from "@nestjs/common"
import { z } from "zod"
import * as QRCode from "qrcode"
import { OrdersService } from "./orders.service"
import { CampaignsService } from "@/campaigns/campaigns.service"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe"
import type { UserDocument } from "@/users/schemas/user.schema"

const reserveSchema = z.object({
  resourceId: z.string().regex(/^[a-f\d]{24}$/i),
  kind: z.enum(["event", "artwork"]),
  quantity: z.number().int().min(1).max(10),
  idempotencyKey: z.string().uuid(),
  code: z.string().max(30).optional(),
  delivery: z
    .object({
      recipient: z.string().trim().min(2).max(300),
      phone: z.string().regex(/^09[0-9]{9}$/),
      address: z.string().min(15).max(1000),
      postalCode: z.string().regex(/^[0-9]{10}$/),
    })
    .optional(),
})

const trackingSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
  trackingCode: z.string().trim().min(2).max(300),
})

@Controller("orders")
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly campaigns: CampaignsService
  ) {}

  @Post("reserve")
  async reserve(
    @CurrentUser() user: UserDocument,
    @Body(new ZodValidationPipe(reserveSchema))
    body: z.infer<typeof reserveSchema>
  ) {
    const campaign = body.code
      ? await this.campaigns.resolveActive(body.code.toUpperCase(), body.resourceId)
      : null
    return this.orders.reserve(
      { id: String(user._id) },
      body,
      campaign ? { id: String(campaign._id), percent: campaign.percent } : null
    )
  }

  @Post("cancel")
  cancel(
    @CurrentUser() user: UserDocument,
    @Body("id") id: string
  ) {
    return this.orders.cancel(
      { id: String(user._id), role: user.role },
      String(id ?? "")
    )
  }

  @Post("ship")
  ship(
    @CurrentUser() user: UserDocument,
    @Body(new ZodValidationPipe(trackingSchema)) body: z.infer<typeof trackingSchema>
  ) {
    return this.orders.ship({ id: String(user._id), role: user.role }, body)
  }

  @Post("receive")
  receive(
    @CurrentUser() user: UserDocument,
    @Body("id") id: string
  ) {
    return this.orders.receive(String(user._id), String(id ?? ""))
  }

  @Post("checkin")
  checkin(
    @CurrentUser() user: UserDocument,
    @Body("token") token: string
  ) {
    return this.orders.checkin(
      { id: String(user._id), role: user.role },
      String(token ?? "")
    )
  }

  @Get("mine")
  mine(@CurrentUser() user: UserDocument) {
    return this.orders.ownedByOrManaged({
      id: String(user._id),
      role: user.role,
    })
  }

  @Get(":id/ticket")
  @Header("Content-Type", "image/svg+xml")
  @Header("Cache-Control", "private, no-store")
  async ticket(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    const order = await this.orders.findOwn(id, String(user._id))
    if (order.status !== "confirmed") {
      return this.orders.findOwn(id, String(user._id)) // will 404 above if missing
    }
    const svg = await QRCode.toString(order.token, { type: "svg", margin: 2 })
    return svg
  }
}
