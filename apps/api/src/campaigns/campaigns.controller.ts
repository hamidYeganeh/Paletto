import {
  Body,
  Controller,
  Get,
  Post,
} from "@nestjs/common"
import { z } from "zod"
import { CampaignsService } from "./campaigns.service"
import { EventsService } from "@/entities/events-ownership.service"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe"
import type { UserDocument } from "@/users/schemas/user.schema"

const createSchema = z.object({
  title: z.string().trim().min(2).max(300),
  code: z
    .string()
    .regex(/^[A-Za-z0-9_-]{3,30}$/)
    .transform((v) => v.toUpperCase()),
  percent: z.number().int().min(0).max(90),
  limit: z.number().int().min(1).max(100000),
  eventId: z.string().regex(/^[a-f\d]{24}$/i),
  endsAt: z.iso.datetime(),
})

@Controller("campaigns")
export class CampaignsController {
  constructor(
    private readonly campaigns: CampaignsService,
    private readonly events: EventsService
  ) {}

  @Post()
  create(
    @CurrentUser() user: UserDocument,
    @Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>
  ) {
    return this.campaigns.create(
      { id: String(user._id), role: user.role },
      { ...body, endsAt: new Date(body.endsAt) },
      (eventId, actor) => this.events.assertEventOwnership(eventId, actor)
    )
  }

  @Post("end")
  end(@CurrentUser() user: UserDocument, @Body("id") id: string) {
    return this.campaigns.end(
      { id: String(user._id), role: user.role },
      String(id ?? "")
    )
  }

  @Get()
  mine(@CurrentUser() user: UserDocument) {
    return this.campaigns.statsForOwner(String(user._id))
  }

  /** UTM-style landing tracking; creates a daily unique visit. */
  @Post("track")
  track(@CurrentUser() user: UserDocument, @Body("code") code: string) {
    return this.campaigns
      .trackVisit(String(code ?? ""), String(user._id))
      .then(() => ({ ok: true }))
  }
}
