import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Redirect,
} from "@nestjs/common"
import { z } from "zod"
import { PaymentsService } from "./payments.service"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe"
import type { UserDocument } from "@/users/schemas/user.schema"
import { Public } from "@/common/decorators/public.decorator"
import { env } from "@/config/env"

const startSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
})

@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post("start")
  start(
    @CurrentUser() user: UserDocument,
    @Body(new ZodValidationPipe(startSchema)) body: z.infer<typeof startSchema>
  ) {
    return this.payments.start({ id: String(user._id) }, body.id)
  }

  /** PSP redirect target; browser lands here after payment. */
  @Public()
  @Get("callback")
  @Redirect()
  async callback(
    @Query("Authority") authority = "",
    @Query("Status") status = ""
  ) {
    const result = await this.payments.verify(authority, status)
    return {
      url: `${env().APP_ORIGIN}/account?payment=${result.status}`,
    }
  }
}
