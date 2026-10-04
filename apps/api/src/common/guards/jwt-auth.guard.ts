import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { IS_PUBLIC_KEY } from "../decorators/public.decorator"

/**
 * Bearer-token guard. Routes marked @Public() skip auth; routes marked
 * @OptionalAuth() attach the user when a valid token exists but never fail.
 */
export type JwtPayload = { sub: string; role: string }

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    const isOptional = this.reflector.getAllAndOverride<boolean>(
      "optionalAuth",
      [context.getHandler(), context.getClass()]
    )
    if (isPublic) return true

    const request = context.switchToHttp().getRequest()
    const header: string | undefined = request.headers["authorization"]
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined

    if (!token) {
      if (isOptional) return true
      request.user = undefined
      return false
    }
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token)
      request.user = { id: payload.sub, role: payload.role }
      return true
    } catch {
      if (isOptional) return true
      return false
    }
  }
}
