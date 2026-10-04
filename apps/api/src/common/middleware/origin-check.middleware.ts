import { Injectable, NestMiddleware } from "@nestjs/common"
import type { NextFunction, Request, Response } from "express"
import { env } from "@/config/env"

const allowed = new Set<string>()

/**
 * CSRF-style origin check for state-changing requests, mirroring the existing
 * web Route Handler behavior: browser callers must come from APP_ORIGIN.
 * Non-browser clients (server-to-server) may skip Origin and authenticate
 * with bearer tokens.
 */
@Injectable()
export class OriginCheckMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next()
    const origin = req.headers.origin
    if (!origin) return next()
    if (allowed.size === 0) allowed.add(env().APP_ORIGIN.replace(/\/$/, ""))
    if (!allowed.has(origin.replace(/\/$/, ""))) {
      res.status(403).json({
        statusCode: 403,
        error: "مبدأ درخواست معتبر نیست.",
        code: "forbidden",
      })
      return
    }
    next()
  }
}
