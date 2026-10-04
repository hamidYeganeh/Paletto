import {Body, Controller, Get, Post} from "@nestjs/common"
import { z } from "zod"
import { SocialService } from "./social.service"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe"
import type { UserDocument } from "@/users/schemas/user.schema"

const toggleSchema = z.object({
  targetId: z.string().min(1).max(100),
  kind: z.enum(["save", "follow", "trip"]),
})

@Controller("social")
export class SocialController {
  constructor(private readonly social: SocialService) {}

  @Post("toggle")
  toggle(
    @CurrentUser() user: UserDocument,
    @Body(new ZodValidationPipe(toggleSchema)) body: z.infer<typeof toggleSchema>
  ) {
    return this.social.toggle({ id: String(user._id) }, body)
  }

  @Get("mine")
  mine(@CurrentUser() user: UserDocument) {
    return this.social.mine(String(user._id))
  }
}
