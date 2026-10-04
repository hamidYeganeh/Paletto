import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
} from "@nestjs/common"
import { z } from "zod"
import { UsersService } from "./users.service"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe"
import { AuthService } from "@/auth/auth.service"
import type { UserDocument } from "@/users/schemas/user.schema"
import { taxonomy } from "./taxonomy"

const profileSchema = z.object({
  name: z.string().trim().min(2).max(300),
  bio: z.string().max(4000),
  city: z.string().max(100),
  disciplines: z.array(z.enum(taxonomy.medium)).max(16),
  marketingConsent: z.boolean(),
})

@Controller("users")
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly auth: AuthService
  ) {}

  @Get("artists")
  artists() {
    return this.users.listArtists()
  }

  /** Public-ish profile lookup by id. */
  @Get(":id")
  async one(@Param("id") id: string) {
    const user = await this.users.findById(id)
    if (!user) throw new NotFoundException("کاربر پیدا نشد.")
    return this.auth.toPublic(user)
  }

  @Patch("me")
  update(
    @CurrentUser() user: UserDocument,
    @Body(new ZodValidationPipe(profileSchema))
    body: z.infer<typeof profileSchema>
  ) {
    return this.users.updateProfile(String(user._id), body)
  }
}
