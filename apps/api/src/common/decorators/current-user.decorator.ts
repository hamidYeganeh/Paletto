import { createParamDecorator, ExecutionContext } from "@nestjs/common"
import type { UserDocument } from "@/users/schemas/user.schema"

/**
 * Injects the authenticated user (populated by JwtAuthGuard) into handlers.
 * Returns undefined when the route is public.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserDocument | undefined =>
    ctx.switchToHttp().getRequest().user
)
