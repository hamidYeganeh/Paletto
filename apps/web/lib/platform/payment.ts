import { transaction } from "./store"
import { ApiError, identify } from "./service"
async function gateway(method: string, payload: Record<string, unknown>) {
  const response = await fetch(
    `https://api.zarinpal.com/pg/v4/payment/${method}.json`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: process.env.ZARINPAL_MERCHANT_ID,
        ...payload,
      }),
      signal: AbortSignal.timeout(15000),
    }
  )
  if (!response.ok)
    throw new ApiError(
      502,
      "درگاه پاسخ معتبر نداد. وضعیت سفارش را دوباره بررسی کنید."
    )
  return response.json() as Promise<{
    data?: { code: number; authority?: string; ref_id?: number }
    errors?: unknown
  }>
}
export async function startPayment(orderId: string, token?: string) {
  if (!process.env.ZARINPAL_MERCHANT_ID || !process.env.APP_ORIGIN)
    throw new ApiError(
      503,
      "پرداخت آنلاین هنوز توسط پالتو فعال نشده است. رزرو شما تا پایان مهلت نگهداری می‌شود."
    )
  const order = await transaction((s) => {
    const user = identify(s, token)
    if (!user) throw new ApiError(401, "وارد حساب شوید.")
    const o = s.orders.find((x) => x.id === orderId && x.userId === user.id)
    if (
      !o ||
      o.status !== "pending" ||
      new Date(o.expiresAt).getTime() < Date.now()
    )
      throw new ApiError(409, "رزرو منقضی شده یا قابل پرداخت نیست.")
    if (
      [...s.events, ...s.artworks].some((x) => x.id === o.resourceId && x.demo)
    )
      throw new ApiError(400, "برای داده نمونه وجه واقعی دریافت نمی‌شود.")
    if (o.paymentReference === "requesting")
      throw new ApiError(409, "درخواست پرداخت قبلی در حال بررسی است.")
    if (o.paymentReference) return { ...o, existing: true }
    o.paymentReference = "requesting"
    return { ...o, existing: false }
  })
  if (order.existing)
    return {
      url: `https://www.zarinpal.com/pg/StartPay/${order.paymentReference}`,
    }
  try {
    const result = await gateway("request", {
      amount: order.total * 10,
      description: `سفارش پالتو ${order.id}`,
      callback_url: `${process.env.APP_ORIGIN}/api/platform/payment-callback`,
    })
    if (result.data?.code !== 100 || !result.data.authority)
      throw new ApiError(502, "درگاه درخواست را نپذیرفت.")
    const authority = result.data.authority
    await transaction((s) => {
      const o = s.orders.find((o) => o.id === order.id)!
      o.paymentReference = authority
    })
    return { url: `https://www.zarinpal.com/pg/StartPay/${authority}` }
  } catch (error) {
    await transaction((s) => {
      const o = s.orders.find((o) => o.id === order.id)!
      if (o.paymentReference === "requesting") o.paymentReference = undefined
    })
    throw error
  }
}
export async function verifyPayment(authority: string, status: string) {
  if (
    !process.env.ZARINPAL_MERCHANT_ID ||
    !/^[A-Za-z0-9]{20,100}$/.test(authority)
  )
    throw new ApiError(400, "اطلاعات پرداخت معتبر نیست.")
  const order = await transaction((s) =>
    s.orders.find((o) => o.paymentReference === authority)
  )
  if (!order) throw new ApiError(404, "سفارش پیدا نشد.")
  if (status !== "OK") return { status: "failed" }
  if (["confirmed", "refund_requested", "refunded"].includes(order.status))
    return { status: order.status }
  const result = await gateway("verify", {
    authority,
    amount: order.total * 10,
  })
  if (![100, 101].includes(result.data?.code || 0) || !result.data?.ref_id)
    throw new ApiError(402, "پرداخت تأیید نشد.")
  return transaction((s) => {
    const o = s.orders.find((o) => o.id === order.id)!
    if (["confirmed", "refund_requested", "refunded"].includes(o.status))
      return { status: o.status }
    const resource = [...s.events, ...s.artworks].find(
      (r) => r.id === o.resourceId
    )
    o.status =
      o.status === "pending" &&
      o.expiresAt > new Date().toISOString() &&
      resource?.status === "published"
        ? "confirmed"
        : "refund_requested"
    s.audit.push({
      actorId: "payment-provider",
      action: `payment.verified:${result.data!.ref_id}`,
      targetId: o.id,
      at: new Date().toISOString(),
    })
    return { status: o.status }
  })
}
