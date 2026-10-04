import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common"

/**
 * Single JSON error envelope for every failure path:
 * { error: string, code?: string, statusCode: number }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = "سرویس در دسترس نیست. دوباره تلاش کنید."
    let code = "internal_error"

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const body = exception.getResponse()
      if (typeof body === "string") {
        message = body
      } else if (typeof body === "object" && body !== null) {
        const b = body as Record<string, unknown>
        if (Array.isArray(b.message)) {
          message = b.message.join("؛ ")
        } else if (typeof b.message === "string") {
          message = b.message
        }
        if (typeof b.code === "string") code = b.code
      }
      if (status < 500) code = code === "internal_error" ? "request_error" : code
    } else if (exception instanceof Error) {
      this.logger.error(
        `${request.method} ${request.url} failed: ${exception.message}`,
        exception.stack
      )
    }

    response.status(status).json({ statusCode: status, error: message, code })
  }
}
