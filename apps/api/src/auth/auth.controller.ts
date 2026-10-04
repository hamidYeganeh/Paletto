import {Body, Controller, Get, Post} from "@nestjs/common"
import { z } from "zod"
import { AuthService } from "./auth.service"
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { RawToken } from "@/common/decorators/raw-token.decorator"
import { Public } from "@/common/decorators/public.decorator"
import type { UserDocument } from "@/users/schemas/user.schema"

const registerSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(10).max(128),
  name: z.string().trim().min(2).max(300).optional(),
  role: z
    .enum([
      "enthusiast",
      "collector",
      "artist",
      "gallery",
      "organizer",
      "curator",
    ])
    .optional(),
})

const loginSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(128),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(10).max(128),
})

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("register")
  register(
    @Body(new ZodValidationPipe(registerSchema))
    body: z.infer<typeof registerSchema>
  ) {
    return this.auth.register(body)
  }

  @Public()
  @Post("login")
  login(
    @Body(new ZodValidationPipe(loginSchema)) body: z.infer<typeof loginSchema>
  ) {
    return this.auth.login(body)
  }

  @Post("logout")
  logout(@RawToken() token: string) {
    return this.auth.logout(token)
  }

  @Get("me")
  me(@CurrentUser() user: UserDocument) {
    return this.auth.toPublic(user)
  }

  @Post("password")
  changePassword(
    @CurrentUser() user: UserDocument,
    @RawToken() token: string,
    @Body(new ZodValidationPipe(passwordSchema))
    body: z.infer<typeof passwordSchema>
  ) {
    return this.auth.changePassword(String(user._id), body, token)
  }
}
