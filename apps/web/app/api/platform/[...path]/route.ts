import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import {
  authenticate,
  catalog,
  dashboard,
  mutate,
  ApiError,
  hash,
} from "@/lib/platform/service"
import { transaction } from "@/lib/platform/store"
import QRCode from "qrcode"
import { startPayment, verifyPayment } from "@/lib/platform/payment"
export const runtime = "nodejs"
const limits = globalThis as typeof globalThis & {
  palettoLimits?: Map<string, { count: number; until: number }>
}
function rate(key: string, max: number) {
  limits.palettoLimits ??= new Map()
  const t = Date.now()
  for (const [k, v] of limits.palettoLimits)
    if (v.until < t) limits.palettoLimits.delete(k)
  const entry = limits.palettoLimits.get(key) || { count: 0, until: t + 60000 }
  entry.count++
  limits.palettoLimits.set(key, entry)
  if (entry.count > max)
    throw new ApiError(
      429,
      "درخواست‌های زیادی ارسال شده؛ یک دقیقه دیگر امتحان کنید."
    )
}
function errorResponse(error: unknown) {
  if (error instanceof z.ZodError)
    return NextResponse.json(
      {
        error: error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("؛ "),
      },
      { status: 400 }
    )
  if (error instanceof ApiError)
    return NextResponse.json({ error: error.message }, { status: error.status })
  console.error(
    "Platform request failed",
    error instanceof Error ? error.message : "unknown"
  )
  return NextResponse.json(
    { error: "سرویس در دسترس نیست. دوباره تلاش کنید." },
    { status: 503 }
  )
}
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const path = (await context.params).path.join("/")
    const token = (await cookies()).get("paletto_session")?.value
    let data: unknown
    if (path === "payment-callback") {
      const result = await verifyPayment(
        request.nextUrl.searchParams.get("Authority") || "",
        request.nextUrl.searchParams.get("Status") || ""
      )
      return NextResponse.redirect(
        new URL(
          `/account?payment=${result.status}`,
          process.env.APP_ORIGIN || request.nextUrl.origin
        )
      )
    }
    if (path === "catalog") data = await catalog()
    else if (path === "dashboard") data = await dashboard(token)
    else if (path.startsWith("ticket/")) {
      const d = await dashboard(token)
      const order = d.orders.find(
        (o) =>
          o.id === path.split("/")[1] &&
          o.userId === d.user.id &&
          o.status === "confirmed"
      )
      if (!order) throw new ApiError(404, "بلیت پیدا نشد.")
      return new NextResponse(
        await QRCode.toString(order.token, { type: "svg", margin: 2 }),
        {
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "private, no-store",
          },
        }
      )
    } else throw new ApiError(404, "مسیر پیدا نشد.")
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const origin = request.headers.get("origin")
    const allowed = process.env.APP_ORIGIN || request.nextUrl.origin
    if (!origin || origin !== allowed)
      throw new ApiError(403, "مبدأ درخواست معتبر نیست.")
    const path = (await context.params).path.join("/")
    if (!request.headers.get("content-type")?.includes("application/json"))
      throw new ApiError(415, "JSON لازم است.")
    const raw = await request.text()
    if (Buffer.byteLength(raw) > 32000)
      throw new ApiError(413, "حجم درخواست زیاد است.")
    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch {
      throw new ApiError(400, "ساختار درخواست معتبر نیست.")
    }
    const token = (await cookies()).get("paletto_session")?.value
    rate(
      `${path}:${token ? hash(token) : "anonymous"}`,
      ["login", "register"].includes(path) ? 20 : 90
    )
    if (path === "login" || path === "register") {
      const result = await authenticate(path, data)
      const response = NextResponse.json({ user: result.user })
      response.cookies.set("paletto_session", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 86400,
      })
      return response
    }
    if (path === "track") {
      const { code } = z.object({ code: z.string().max(30) }).parse(data)
      const visitor =
        request.cookies.get("paletto_visitor")?.value || crypto.randomUUID()
      await transaction((s) => {
        const campaign = s.campaigns.find(
          (c) =>
            c.code === code.toUpperCase() && c.endsAt > new Date().toISOString()
        )
        const visitorHash = hash(visitor)
        const day = new Date().toISOString().slice(0, 10)
        if (
          campaign &&
          !s.visits.some(
            (v) =>
              v.campaignId === campaign.id &&
              v.visitorHash === visitorHash &&
              v.day === day
          )
        )
          s.visits.push({ campaignId: campaign.id, visitorHash, day })
      })
      const response = NextResponse.json({ ok: true })
      response.cookies.set("paletto_visitor", visitor, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 86400,
      })
      return response
    }
    const result =
      path === "pay"
        ? await startPayment(
            z.object({ id: z.string().uuid() }).parse(data).id,
            token
          )
        : await mutate(path, data, token)
    const response = NextResponse.json(result)
    if (path === "logout") response.cookies.delete("paletto_session")
    return response
  } catch (error) {
    return errorResponse(error)
  }
}
