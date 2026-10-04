import { createParamDecorator, ExecutionContext } from "@nestjs/common"

/** Extracts the raw bearer token from the Authorization header. */
export const RawToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest()
    const header: string | undefined = request.headers["authorization"]
    return header?.startsWith("Bearer ") ? header.slice(7) : undefined
  }
)
