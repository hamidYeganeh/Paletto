import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { ForbiddenError } from "../errors/domain.errors"

export const ROLES_KEY = "roles"
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)

/**
 * Role gate reading @Roles() metadata. Runs after JwtAuthGuard, which
 * guarantees `request.user` exists on protected routes.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    )
    if (!required || required.length === 0) return true
    const { user } = context.switchToHttp().getRequest()
    if (!user) return false
    if (!required.includes(user.role)) {
      throw new ForbiddenError("این عملیات برای نقش شما مجاز نیست.")
    }
    return true
  }
}
