import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto"
import { z } from "zod"
import { transaction } from "./store"
import {
  taxonomy,
  type State,
  type User,
  type EntityType,
  type Order,
  type Role,
} from "@/features/platform/types"
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
  }
}
const fail = (status: number, message: string): never => {
  throw new ApiError(status, message)
}
const now = () => new Date().toISOString()
const text = z.string().trim().min(2).max(300)
const id = z.string().min(1).max(100)
const image = z
  .string()
  .max(1500)
  .refine(
    (value) =>
      /^\/(?:images|api\/media)\/[a-zA-Z0-9._/-]+$/.test(value) ||
      /^https:\/\/[^\s]+$/.test(value),
    "نشانی تصویر باید HTTPS یا تصویر محلی باشد"
  )
const common = z.object({
  title: text,
  description: z.string().trim().min(10).max(6000),
  image,
  city: text,
  medium: z.enum(taxonomy.medium),
  status: z.enum(["draft", "pending"]).default("pending"),
})
const schemas = {
  galleries: common.extend({
    opensAt: z
      .string()
      .regex(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/)
      .default("16:00"),
    closesAt: z
      .string()
      .regex(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/)
      .default("20:00"),
    closedDays: z.array(z.number().int().min(0).max(6)).max(7).default([]),
    kind: z.enum(taxonomy.gallery),
    address: text,
    hours: text,
    accessibility: text,
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }),
  events: common
    .extend({
      kind: z.enum(taxonomy.event),
      galleryId: id,
      admission: z.enum(["open", "free", "paid"]),
      startsAt: z.iso.datetime(),
      endsAt: z.iso.datetime(),
      capacity: z.number().int().min(1).max(100000),
      price: z.number().int().min(0).max(100000000),
      refundHours: z.number().int().min(0).max(720),
    })
    .refine((v) => v.endsAt > v.startsAt, "پایان باید بعد از شروع باشد")
    .refine(
      (v) => v.admission !== "paid" || v.price > 0,
      "قیمت بلیت را وارد کنید"
    ),
  artworks: common
    .extend({
      artistName: text,
      style: z.enum(taxonomy.style),
      technique: text,
      dimensions: text,
      year: text,
      price: z.number().int().min(0).max(100000000000),
      stock: z.number().int().min(1).max(1000),
      availability: z.enum(["sale", "inquiry", "display"]),
      galleryId: z.string().max(100),
    })
    .refine(
      (v) => v.availability !== "sale" || v.price > 0,
      "قیمت فروش لازم است"
    ),
}
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex")
export const publicUser = (user: User) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio,
    city: user.city,
    disciplines: user.disciplines,
    marketingConsent: user.marketingConsent,
    createdAt: user.createdAt,
  }
}
export const artistUser = (user: User) => ({
  id: user.id,
  name: user.name,
  role: user.role,
  bio: user.bio,
  city: user.city,
  disciplines: user.disciplines,
  createdAt: user.createdAt,
})
export function identify(state: State, token?: string): User | undefined {
  const session =
    token &&
    state.sessions.find((s) => s.hash === hash(token) && s.expiresAt > now())
  return session ? state.users.find((u) => u.id === session.userId) : undefined
}
function requireUser(state: State, token?: string) {
  return identify(state, token) || fail(401, "برای ادامه وارد حساب شوید.")
}
const canManage = (user: User, ownerId: string) =>
  user.id === ownerId || user.role === "admin"
const audit = (s: State, u: User, action: string, targetId: string) => {
  s.audit.push({ actorId: u.id, action, targetId, at: now() })
  if (s.audit.length > 10000) s.audit.splice(0, s.audit.length - 10000)
}
const used = (s: State, resourceId: string) =>
  s.orders
    .filter(
      (o) =>
        o.resourceId === resourceId &&
        ["pending", "confirmed", "refund_requested"].includes(o.status)
    )
    .reduce((sum, o) => sum + o.quantity, 0)
function expire(s: State) {
  for (const o of s.orders)
    if (o.status === "pending" && o.expiresAt < now()) o.status = "cancelled"
  s.sessions = s.sessions.filter((s) => s.expiresAt > now())
}
export async function catalog() {
  return transaction((s) => {
    expire(s)
    return {
      galleries: s.galleries.filter((g) => g.status === "published"),
      events: s.events
        .filter((e) => e.status === "published")
        .map((e) => ({ ...e, remaining: e.capacity - used(s, e.id) })),
      artworks: s.artworks
        .filter((a) => a.status === "published")
        .map((a) => ({ ...a, remaining: a.stock - used(s, a.id) })),
      artists: s.users
        .filter((u) => ["artist", "curator"].includes(u.role))
        .map(artistUser),
      demo: process.env.PALETTO_DEMO === "true",
    }
  })
}
export async function dashboard(token?: string) {
  return transaction((s) => {
    expire(s)
    const user = requireUser(s, token)
    const own = (v: { ownerId: string }) => canManage(user, v.ownerId)
    const campaigns = s.campaigns.filter(own).map((c) => ({
      ...c,
      visits: s.visits.filter((v) => v.campaignId === c.id).length,
      conversions: s.orders.filter(
        (o) => o.campaignId === c.id && o.status === "confirmed"
      ).length,
    }))
    return {
      user: publicUser(user),
      galleries: s.galleries.filter(own),
      events: s.events.filter(
        (e) =>
          own(e) ||
          (s.memberships || []).some(
            (m) => m.eventId === e.id && m.userId === user.id
          )
      ),
      memberships: (s.memberships || []).filter(
        (m) => own(m) || m.userId === user.id
      ),
      artworks: s.artworks.filter(own),
      orders: s.orders
        .filter((o) => o.userId === user.id || own(o))
        .map((o) => (o.userId === user.id ? o : { ...o, token: "" })),
      campaigns,
      requests: s.requests.filter((r) => r.userId === user.id || own(r)),
      saves: s.saves.filter((x) => x.userId === user.id),
      audit: user.role === "admin" ? s.audit.slice(-100).reverse() : [],
      users: user.role === "admin" ? s.users.map(publicUser) : [],
    }
  })
}
export async function authenticate(
  action: "login" | "register",
  body: unknown
) {
  const data = z
    .object({
      email: z
        .email()
        .max(200)
        .transform((v) => v.toLowerCase()),
      password: z.string().min(10).max(128),
      name: text.optional(),
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
    .parse(body)
  return transaction((s) => {
    let user = s.users.find((u) => u.email === data.email)
    if (action === "register") {
      if (user) fail(409, "این ایمیل قبلاً ثبت شده است.")
      const salt = randomBytes(16).toString("hex")
      user = {
        id: randomUUID(),
        email: data.email,
        name: data.name || "عضو پالتو",
        role: data.role || "enthusiast",
        password: `${salt}:${scryptSync(data.password, salt, 64).toString("hex")}`,
        bio: "",
        city: "",
        disciplines: [],
        marketingConsent: false,
        createdAt: now(),
      }
      s.users.push(user)
    } else {
      const [salt, expected] = (user?.password || "invalid:").split(":")
      const actual = scryptSync(data.password, salt!, 64)
      const stored = Buffer.from(expected || "00".repeat(64), "hex")
      if (
        !user ||
        actual.length !== stored.length ||
        !timingSafeEqual(actual, stored)
      )
        fail(401, "ایمیل یا رمز عبور درست نیست.")
    }
    const token = randomBytes(32).toString("hex")
    s.sessions.push({
      hash: hash(token),
      userId: user!.id,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    })
    return { user: publicUser(user!), token }
  })
}
export async function mutate(action: string, body: unknown, token?: string) {
  return transaction((s) => {
    expire(s)
    const user = requireUser(s, token)
    const input = z.record(z.string(), z.unknown()).parse(body)
    if (action === "logout") {
      s.sessions = s.sessions.filter((v) => v.hash !== hash(token!))
      return { ok: true }
    }
    if (action === "profile") {
      const profile = z
        .object({
          name: text,
          bio: z.string().max(4000),
          city: z.string().max(100),
          disciplines: z.array(z.enum(taxonomy.medium)).max(16),
          marketingConsent: z.boolean(),
        })
        .parse(input)
      Object.assign(user, profile)
      return publicUser(user)
    }
    if (action === "save") {
      const v = z
        .object({ targetId: id, kind: z.enum(["save", "follow", "trip"]) })
        .parse(input)
      if (
        ![...s.galleries, ...s.events, ...s.artworks, ...s.users].some(
          (x) => x.id === v.targetId
        )
      )
        fail(404, "مورد پیدا نشد.")
      const index = s.saves.findIndex(
        (x) =>
          x.userId === user.id && x.targetId === v.targetId && x.kind === v.kind
      )
      if (index < 0) s.saves.push({ ...v, userId: user.id })
      else s.saves.splice(index, 1)
      return { saved: index < 0 }
    }
    if (action === "entity") {
      const type = z.enum(["galleries", "events", "artworks"]).parse(input.type)
      const permitted: Record<EntityType, Role[]> = {
        galleries: ["gallery", "admin"],
        events: ["artist", "gallery", "organizer", "curator", "admin"],
        artworks: ["artist", "gallery", "admin"],
      }
      if (!permitted[type].includes(user.role))
        fail(403, "این عملیات برای نقش شما مجاز نیست.")
      const data = schemas[type].parse(input.data)
      const existing = input.id
        ? s[type].find((x) => x.id === input.id)
        : undefined
      if (input.id && !existing) fail(404, "مورد پیدا نشد.")
      if (existing && !canManage(user, existing.ownerId))
        fail(403, "فقط مالک می‌تواند ویرایش کند.")
      if (
        existing &&
        s.orders.some(
          (o) =>
            o.resourceId === existing.id &&
            ["pending", "confirmed", "refund_requested"].includes(o.status)
        )
      )
        fail(
          409,
          "این مورد سفارش فعال دارد؛ برای تغییر برنامه ابتدا فرایند لغو را انجام دهید."
        )
      if ("galleryId" in data && data.galleryId) {
        const gallery = s.galleries.find(
          (g) => g.id === data.galleryId && g.status === "published"
        )
        if (!gallery) fail(400, "یک گالری منتشرشده انتخاب کنید.")
        if (type === "artworks" && !canManage(user, gallery!.ownerId))
          fail(403, "برای انتساب اثر به این گالری، درخواست همکاری ارسال کنید.")
      }
      if ("startsAt" in data && data.startsAt < now())
        fail(400, "زمان رویداد باید در آینده باشد.")
      if ("admission" in data && data.admission !== "paid") data.price = 0
      const entity = {
        ...data,
        id: existing?.id || randomUUID(),
        ownerId: existing?.ownerId || user.id,
        createdAt: existing?.createdAt || now(),
      }
      if (existing) Object.assign(existing, entity, { reviewNote: "" })
      else (s[type] as unknown[]).push(entity)
      audit(s, user, "entity.submit", entity.id)
      return entity
    }
    if (action === "moderate") {
      if (user.role !== "admin")
        fail(403, "فقط مدیر می‌تواند انتشار را تأیید کند.")
      const v = z
        .object({
          type: z.enum(["galleries", "events", "artworks"]),
          id,
          status: z.enum(["published", "rejected"]),
          note: z.string().max(2000),
        })
        .parse(input)
      const item =
        s[v.type].find((x) => x.id === v.id) || fail(404, "مورد پیدا نشد.")
      if (item.status !== "pending")
        fail(409, "فقط موارد در انتظار بررسی قابل تأیید هستند.")
      Object.assign(item, { status: v.status, reviewNote: v.note })
      audit(s, user, `moderation.${v.status}`, item.id)
      return item
    }
    if (action === "assign-door") {
      const v = z
        .object({
          eventId: id,
          email: z.email().transform((e) => e.toLowerCase()),
        })
        .parse(input)
      const event =
        s.events.find((e) => e.id === v.eventId) ||
        fail(404, "رویداد پیدا نشد.")
      if (!canManage(user, event.ownerId))
        fail(403, "این رویداد متعلق به شما نیست.")
      const colleague =
        s.users.find((u) => u.email === v.email) ||
        fail(400, "همکار ابتدا باید در پالتو حساب بسازد.")
      s.memberships ??= []
      if (
        s.memberships.some(
          (m) => m.eventId === event.id && m.userId === colleague.id
        )
      )
        fail(409, "این همکار قبلاً افزوده شده است.")
      const membership = {
        id: randomUUID(),
        ownerId: event.ownerId,
        eventId: event.id,
        userId: colleague.id,
      }
      s.memberships.push(membership)
      audit(s, user, "team.assign", membership.id)
      return membership
    }
    if (action === "remove-door") {
      const membership =
        (s.memberships || []).find((m) => m.id === input.id) ||
        fail(404, "همکار پیدا نشد.")
      if (!canManage(user, membership.ownerId)) fail(403, "دسترسی ندارید.")
      s.memberships = s.memberships.filter((m) => m.id !== membership.id)
      audit(s, user, "team.remove", membership.id)
      return { ok: true }
    }
    if (action === "end-campaign") {
      const campaign =
        s.campaigns.find((c) => c.id === input.id) ||
        fail(404, "کمپین پیدا نشد.")
      if (!canManage(user, campaign.ownerId)) fail(403, "دسترسی ندارید.")
      campaign.endsAt = now()
      audit(s, user, "campaign.end", campaign.id)
      return campaign
    }
    if (action === "campaign") {
      if (!["gallery", "organizer", "curator", "admin"].includes(user.role))
        fail(403, "دسترسی بازاریابی ندارید.")
      const v = z
        .object({
          title: text,
          code: z
            .string()
            .regex(/^[A-Za-z0-9_-]{3,30}$/)
            .transform((v) => v.toUpperCase()),
          percent: z.number().int().min(0).max(90),
          limit: z.number().int().min(1).max(100000),
          eventId: id,
          endsAt: z.iso.datetime(),
        })
        .parse(input)
      if (v.endsAt <= now()) fail(400, "تاریخ پایان کمپین گذشته است.")
      if (
        !s.events.some((e) => e.id === v.eventId && canManage(user, e.ownerId))
      )
        fail(403, "رویداد متعلق به شما نیست.")
      if (s.campaigns.some((c) => c.code === v.code))
        fail(409, "این کد قبلاً استفاده شده است.")
      const campaign = {
        ...v,
        id: randomUUID(),
        ownerId: user.id,
        createdAt: now(),
      }
      s.campaigns.push(campaign)
      audit(s, user, "campaign.create", campaign.id)
      return campaign
    }
    if (action === "request") {
      const v = z
        .object({
          resourceId: id,
          kind: z.enum(["inquiry", "submission", "commission", "support"]),
          message: z.string().trim().min(10).max(5000),
        })
        .parse(input)
      const target = [...s.artworks, ...s.events, ...s.galleries].find(
        (x) => x.id === v.resourceId
      )
      const artist = s.users.find(
        (u) => u.id === v.resourceId && ["artist", "curator"].includes(u.role)
      )
      if (!target && !artist && v.kind !== "support")
        fail(404, "مقصد درخواست پیدا نشد.")
      const request = {
        ...v,
        ownerId: target?.ownerId || artist?.id || "admin",
        id: randomUUID(),
        userId: user.id,
        reply: "",
        status: "open" as const,
        createdAt: now(),
      }
      s.requests.push(request)
      return request
    }
    if (action === "reply") {
      const v = z
        .object({ id, reply: z.string().trim().min(2).max(5000) })
        .parse(input)
      const item =
        s.requests.find((r) => r.id === v.id) || fail(404, "درخواست پیدا نشد.")
      if (!canManage(user, item.ownerId)) fail(403, "دسترسی ندارید.")
      item.reply = v.reply
      item.status = "answered"
      return item
    }
    if (action === "reserve") {
      const v = z
        .object({
          resourceId: id,
          kind: z.enum(["event", "artwork"]),
          quantity: z.number().int().min(1).max(10),
          idempotencyKey: z.string().uuid(),
          code: z.string().max(30).optional(),
          delivery: z
            .object({
              recipient: text,
              phone: z.string().regex(/^09[0-9]{9}$/),
              address: z.string().min(15).max(1000),
              postalCode: z.string().regex(/^[0-9]{10}$/),
            })
            .optional(),
        })
        .parse(input)
      if (v.kind === "artwork" && !v.delivery)
        fail(400, "اطلاعات گیرنده و نشانی ارسال را وارد کنید.")
      const previous = s.orders.find(
        (o) => o.userId === user.id && o.idempotencyKey === v.idempotencyKey
      )
      if (previous) return previous
      const item =
        (v.kind === "event" ? s.events : s.artworks).find(
          (x) => x.id === v.resourceId && x.status === "published"
        ) || fail(404, "این مورد قابل رزرو نیست.")
      if ("startsAt" in item && item.startsAt <= now())
        fail(409, "مهلت رزرو تمام شده است.")
      if ("admission" in item && item.admission === "open")
        fail(400, "بازدید آزاد به بلیت نیاز ندارد.")
      if ("availability" in item && item.availability !== "sale")
        fail(400, "این اثر برای فروش عرضه نشده است.")
      const capacity = "capacity" in item ? item.capacity : item.stock
      if (used(s, item.id) + v.quantity > capacity)
        fail(409, "ظرفیت کافی باقی نمانده است.")
      const campaign = v.code
        ? s.campaigns.find(
            (c) =>
              c.code === v.code!.toUpperCase() &&
              c.eventId === item.id &&
              c.endsAt > now()
          )
        : undefined
      if (v.code && !campaign) fail(400, "کد تخفیف معتبر نیست.")
      if (
        campaign &&
        s.orders.filter(
          (o) =>
            o.campaignId === campaign.id &&
            ["pending", "confirmed", "refund_requested"].includes(o.status)
        ).length >= campaign.limit
      )
        fail(409, "ظرفیت کد تخفیف تمام شده است.")
      const total = Math.floor(
        (item.price * v.quantity * (100 - (campaign?.percent || 0))) / 100
      )
      const order: Order = {
        id: randomUUID(),
        userId: user.id,
        resourceId: item.id,
        ownerId: item.ownerId,
        kind: v.kind,
        quantity: v.quantity,
        total,
        status: total === 0 ? "confirmed" : "pending",
        createdAt: now(),
        expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
        token: randomBytes(24).toString("hex"),
        checkedIn: false,
        idempotencyKey: v.idempotencyKey,
        campaignId: campaign?.id,
        delivery: v.kind === "artwork" ? v.delivery : undefined,
        fulfillment: v.kind === "artwork" ? "processing" : undefined,
      }
      s.orders.push(order)
      audit(s, user, "order.reserve", order.id)
      return order
    }
    if (action === "cancel") {
      const order =
        s.orders.find((o) => o.id === input.id) || fail(404, "سفارش پیدا نشد.")
      if (order.userId !== user.id && user.role !== "admin")
        fail(403, "دسترسی ندارید.")
      if (
        !["pending", "confirmed"].includes(order.status) ||
        order.checkedIn ||
        ["shipped", "delivered"].includes(order.fulfillment || "")
      )
        fail(409, "این سفارش قابل لغو نیست.")
      const event = s.events.find((e) => e.id === order.resourceId)
      if (
        order.status === "confirmed" &&
        event &&
        Date.now() >
          new Date(event.startsAt).getTime() - event.refundHours * 3600000
      )
        fail(409, "مهلت لغو این رویداد گذشته است.")
      order.status =
        order.status === "confirmed" && order.total > 0
          ? "refund_requested"
          : "cancelled"
      audit(s, user, "order.cancel", order.id)
      return order
    }
    if (action === "ship") {
      const v = z.object({ id, trackingCode: text }).parse(input)
      const order =
        s.orders.find((o) => o.id === v.id && o.kind === "artwork") ||
        fail(404, "سفارش اثر پیدا نشد.")
      if (!canManage(user, order.ownerId)) fail(403, "دسترسی ندارید.")
      if (order.status !== "confirmed" || order.fulfillment !== "processing")
        fail(409, "فقط سفارش پرداخت‌شده و آماده ارسال قابل ثبت است.")
      order.fulfillment = "shipped"
      order.trackingCode = v.trackingCode
      audit(s, user, "artwork.ship", order.id)
      return order
    }
    if (action === "receive") {
      const order =
        s.orders.find((o) => o.id === input.id && o.userId === user.id) ||
        fail(404, "سفارش پیدا نشد.")
      if (order.status !== "confirmed" || order.fulfillment !== "shipped")
        fail(409, "سفارش هنوز ارسال نشده است.")
      order.fulfillment = "delivered"
      audit(s, user, "artwork.receive", order.id)
      return order
    }
    if (action === "password") {
      const v = z
        .object({
          currentPassword: z.string().min(1).max(128),
          newPassword: z.string().min(10).max(128),
        })
        .parse(input)
      const [salt, expected] = (user.password || "").split(":")
      if (
        !salt ||
        !expected ||
        !timingSafeEqual(
          scryptSync(v.currentPassword, salt, 64),
          Buffer.from(expected, "hex")
        )
      )
        fail(400, "رمز فعلی درست نیست.")
      const nextSalt = randomBytes(16).toString("hex")
      user.password = `${nextSalt}:${scryptSync(v.newPassword, nextSalt, 64).toString("hex")}`
      s.sessions = s.sessions.filter(
        (session) => session.userId !== user.id || session.hash === hash(token!)
      )
      audit(s, user, "account.password", user.id)
      return { ok: true }
    }
    if (action === "cancel-event") {
      const event =
        s.events.find((e) => e.id === input.id) || fail(404, "رویداد پیدا نشد.")
      if (!canManage(user, event.ownerId)) fail(403, "دسترسی ندارید.")
      event.status = "cancelled"
      for (const order of s.orders.filter((o) => o.resourceId === event.id)) {
        if (order.status === "pending") order.status = "cancelled"
        else if (order.status === "confirmed")
          order.status = order.total > 0 ? "refund_requested" : "cancelled"
      }
      audit(s, user, "event.cancel", event.id)
      return event
    }
    if (action === "refund") {
      if (user.role !== "admin")
        fail(403, "فقط مدیر می‌تواند استرداد را ثبت کند.")
      const v = z.object({ id, reference: text }).parse(input)
      const order =
        s.orders.find(
          (o) => o.id === v.id && o.status === "refund_requested"
        ) || fail(409, "سفارش منتظر استرداد پیدا نشد.")
      order.status = "refunded"
      audit(s, user, `refund.recorded:${v.reference}`, order.id)
      return order
    }
    if (action === "checkin") {
      const v = z.object({ token: z.string().min(20).max(200) }).parse(input)
      const order =
        s.orders.find((o) => o.token === v.token && o.kind === "event") ||
        fail(404, "بلیت معتبر پیدا نشد.")
      if (
        !canManage(user, order.ownerId) &&
        !(s.memberships || []).some(
          (m) => m.eventId === order.resourceId && m.userId === user.id
        )
      )
        fail(403, "این بلیت متعلق به رویداد شما نیست.")
      if (order.status !== "confirmed" || order.checkedIn)
        fail(409, "بلیت لغو شده یا قبلاً استفاده شده است.")
      const event = s.events.find((e) => e.id === order.resourceId)!
      if (
        Date.now() < new Date(event.startsAt).getTime() - 3600000 ||
        Date.now() > new Date(event.endsAt).getTime()
      )
        fail(409, "پذیرش از یک ساعت قبل از شروع تا پایان رویداد باز است.")
      order.checkedIn = true
      audit(s, user, "ticket.checkin", order.id)
      return { title: event.title, quantity: order.quantity, checkedIn: true }
    }
    fail(404, "عملیات ناشناخته است.")
  })
}
