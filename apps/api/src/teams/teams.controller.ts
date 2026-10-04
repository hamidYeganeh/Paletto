import {Body, Controller, Delete, Get, Post, Query} from "@nestjs/common"
import { z } from "zod"
import { TeamsService } from "./teams.service"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe"
import type { UserDocument } from "@/users/schemas/user.schema"

const assignSchema = z.object({
  eventId: z.string().regex(/^[a-f\d]{24}$/i),
  email: z.email().transform((v) => v.toLowerCase()),
})

@Controller("teams")
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  @Post()
  assign(
    @CurrentUser() user: UserDocument,
    @Body(new ZodValidationPipe(assignSchema)) body: z.infer<typeof assignSchema>
  ) {
    return this.teams.assign(
      { id: String(user._id), role: user.role },
      body
    )
  }

  @Delete()
  remove(@CurrentUser() user: UserDocument, @Body("id") id: string) {
    return this.teams
      .remove({ id: String(user._id), role: user.role }, String(id ?? ""))
      .then(() => ({ ok: true }))
  }

  @Get()
  list(@CurrentUser() user: UserDocument, @Query("eventId") eventId: string) {
    return this.teams.forEvent(
      { id: String(user._id), role: user.role },
      String(eventId ?? "")
    )
  }
}
