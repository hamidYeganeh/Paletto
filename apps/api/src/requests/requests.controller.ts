import {Body, Controller, Get, Post} from "@nestjs/common"
import { z } from "zod"
import { RequestsService } from "./requests.service"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe"
import type { UserDocument } from "@/users/schemas/user.schema"

const createSchema = z.object({
  resourceId: z.string().min(1).max(100),
  kind: z.enum(["inquiry", "submission", "commission", "support"]),
  message: z.string().trim().min(10).max(5000),
})

const replySchema = z.object({
  id: z.string().min(1).max(100),
  reply: z.string().trim().min(2).max(5000),
})

@Controller("requests")
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Post()
  create(
    @CurrentUser() user: UserDocument,
    @Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>
  ) {
    return this.requests.create({ id: String(user._id) }, body)
  }

  @Post("reply")
  reply(
    @CurrentUser() user: UserDocument,
    @Body(new ZodValidationPipe(replySchema)) body: z.infer<typeof replySchema>
  ) {
    return this.requests.reply(
      { id: String(user._id), role: user.role },
      body
    )
  }

  @Get("inbox")
  inbox(@CurrentUser() user: UserDocument) {
    return this.requests.forUser(String(user._id), user.role)
  }
}
