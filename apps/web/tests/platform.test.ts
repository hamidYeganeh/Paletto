import test from "node:test"
import assert from "node:assert/strict"
import { startPayment, verifyPayment } from "../lib/platform/payment"
import { randomUUID } from "node:crypto"
import {
  authenticate,
  mutate,
  catalog,
  dashboard,
  ApiError,
} from "../lib/platform/service"
import { transaction, closeStore } from "../lib/platform/store"
import type {
  Gallery,
  Event,
  Order,
  Artwork,
  Campaign,
} from "../features/platform/types"
assert.match(
  process.env.PALETTO_DATA_FILE || "",
  /^\/tmp\/paletto-test-/,
  "Tests require an isolated temporary store"
)
if (process.env.MONGODB_URI) {
  assert.match(
    process.env.MONGODB_DB || "",
    /^paletto_test_/,
    "Tests require an isolated Mongo database"
  )
}
const password = "Test-only-password-284!"
const data = {
  title: "آزمون هنر",
  description: "توضیح کامل برای آزمون مسیرهای واقعی کاربر",
  image: "/images/artwork-gallery-wall.png",
  city: "تهران",
  medium: "نقاشی",
  status: "pending",
}
const reject = async (fn: () => Promise<unknown>, status: number) =>
  assert.rejects(fn, (e) => e instanceof ApiError && e.status === status)
test("isolated role, publishing, capacity, campaign, admission and ownership journeys", async (t) => {
  t.after(closeStore)
  assert.match(
    process.env.PALETTO_DATA_FILE || "",
    /^\/tmp\/paletto-test-/,
    "Tests require an isolated temporary store"
  )
  const artist = await authenticate("register", {
    email: `artist-${randomUUID()}@test.example`,
    password,
    name: "هنرمند آزمایش",
    role: "artist",
  })
  const owner = await authenticate("register", {
    email: `gallery-${randomUUID()}@test.example`,
    password,
    name: "گالری آزمایش",
    role: "gallery",
  })
  const visitor = await authenticate("register", {
    email: `visitor-${randomUUID()}@test.example`,
    password,
    name: "مخاطب آزمایش",
    role: "enthusiast",
  })
  const admin = await authenticate("register", {
    email: `admin-${randomUUID()}@test.example`,
    password,
    name: "مدیر آزمایش",
    role: "enthusiast",
  })
  await transaction((s) => {
    s.users.find((u) => u.id === admin.user.id)!.role = "admin"
  })
  await t.test(
    "anonymous access and role escalation are rejected",
    async () => {
      await reject(() => dashboard(), 401)
      await reject(
        () =>
          mutate(
            "moderate",
            { type: "galleries", id: "x", status: "published", note: "" },
            visitor.token
          ),
        403
      )
      await assert.rejects(() =>
        authenticate("register", {
          email: "bad@test.example",
          password,
          role: "admin",
        })
      )
      await reject(
        () => mutate("entity", { type: "galleries", data: {} }, artist.token),
        403
      )
    }
  )
  const gallery = (await mutate(
    "entity",
    {
      type: "galleries",
      data: {
        ...data,
        kind: "گالری خصوصی",
        address: "نشانی آزمایش تهران",
        hours: "هر روز ۱۶ تا ۲۰",
        accessibility: "بدون پله",
      },
    },
    owner.token
  )) as Gallery
  await t.test(
    "pending records stay private and only admin publishes",
    async () => {
      assert.ok(!(await catalog()).galleries.some((g) => g.id === gallery.id))
      await mutate(
        "moderate",
        { type: "galleries", id: gallery.id, status: "published", note: "" },
        admin.token
      )
      assert.ok((await catalog()).galleries.some((g) => g.id === gallery.id))
      await reject(
        () =>
          mutate(
            "entity",
            {
              type: "galleries",
              id: gallery.id,
              data: { ...gallery, status: "pending" },
            },
            artist.token
          ),
        403
      )
    }
  )
  const eventData = {
    ...data,
    kind: "ورکشاپ",
    galleryId: gallery.id,
    admission: "free",
    startsAt: new Date(Date.now() + 1800000).toISOString(),
    endsAt: new Date(Date.now() + 5400000).toISOString(),
    capacity: 3,
    price: 0,
    refundHours: 0,
  }
  const event = (await mutate(
    "entity",
    { type: "events", data: eventData },
    owner.token
  )) as Event
  await mutate(
    "moderate",
    { type: "events", id: event.id, status: "published", note: "" },
    admin.token
  )
  await t.test(
    "concurrent reservations never exceed capacity and retries are idempotent",
    async () => {
      const results = await Promise.allSettled(
        Array.from({ length: 10 }, () =>
          mutate(
            "reserve",
            {
              kind: "event",
              resourceId: event.id,
              quantity: 1,
              idempotencyKey: randomUUID(),
            },
            visitor.token
          )
        )
      )
      assert.equal(results.filter((r) => r.status === "fulfilled").length, 3)
      assert.equal(results.filter((r) => r.status === "rejected").length, 7)
      const order = (
        results.find(
          (r) => r.status === "fulfilled"
        ) as PromiseFulfilledResult<Order>
      ).value
      const retry = (await mutate(
        "reserve",
        {
          kind: "event",
          resourceId: event.id,
          quantity: 1,
          idempotencyKey: order.idempotencyKey,
        },
        visitor.token
      )) as Order
      assert.equal(retry.id, order.id)
      assert.equal((await dashboard(visitor.token)).orders.length, 3)
      await reject(() => mutate("cancel", { id: order.id }, artist.token), 403)
      await reject(
        () => mutate("checkin", { token: order.token }, artist.token),
        403
      )
      await mutate("checkin", { token: order.token }, owner.token)
      await reject(
        () => mutate("checkin", { token: order.token }, owner.token),
        409
      )
      await reject(() => mutate("cancel", { id: order.id }, visitor.token), 409)
      const another = (await dashboard(visitor.token)).orders.find(
        (o) => !o.checkedIn
      )!
      await mutate("cancel", { id: another.id }, visitor.token)
      assert.equal(
        (await catalog()).events.find((e) => e.id === event.id)!.remaining,
        1
      )
    }
  )
  await t.test("owners cannot change sold event capacity", async () => {
    await reject(
      () =>
        mutate(
          "entity",
          { type: "events", id: event.id, data: eventData },
          owner.token
        ),
      409
    )
  })
  const paid = (await mutate(
    "entity",
    {
      type: "events",
      data: {
        ...eventData,
        title: "رویداد پولی",
        admission: "paid",
        price: 200000,
        capacity: 10,
      },
    },
    owner.token
  )) as Event
  await mutate(
    "moderate",
    { type: "events", id: paid.id, status: "published", note: "" },
    admin.token
  )
  const campaign = (await mutate(
    "campaign",
    {
      title: "کمپین آزمایش",
      code: `ART${randomUUID().slice(0, 8)}`,
      eventId: paid.id,
      percent: 25,
      limit: 1,
      endsAt: new Date(Date.now() + 86400000).toISOString(),
    },
    owner.token
  )) as Campaign
  await t.test(
    "coupon scope, amount and limits are enforced server-side",
    async () => {
      const o = (await mutate(
        "reserve",
        {
          kind: "event",
          resourceId: paid.id,
          quantity: 2,
          idempotencyKey: randomUUID(),
          code: campaign.code,
        },
        visitor.token
      )) as Order
      assert.equal(o.total, 300000)
      assert.equal(o.status, "pending")
      await reject(
        () =>
          mutate(
            "reserve",
            {
              kind: "event",
              resourceId: paid.id,
              quantity: 1,
              idempotencyKey: randomUUID(),
              code: campaign.code,
            },
            visitor.token
          ),
        409
      )
      await reject(
        () =>
          mutate(
            "reserve",
            {
              kind: "event",
              resourceId: event.id,
              quantity: 1,
              idempotencyKey: randomUUID(),
              code: campaign.code,
            },
            visitor.token
          ),
        400
      )
      await transaction((s) => {
        s.orders.find((x) => x.id === o.id)!.expiresAt =
          "2000-01-01T00:00:00.000Z"
      })
      assert.equal(
        (await dashboard(visitor.token)).orders.find((x) => x.id === o.id)!
          .status,
        "cancelled"
      )
    }
  )
  await t.test(
    "artist creates work, pending work is hidden, stock is unique",
    async () => {
      const work = (await mutate(
        "entity",
        {
          type: "artworks",
          data: {
            ...data,
            artistName: "هنرمند آزمایش",
            style: "انتزاعی",
            technique: "روغن روی بوم",
            dimensions: "۳۰ × ۴۰ سانتی‌متر",
            year: "۱۴۰۵",
            price: 1000000,
            stock: 1,
            availability: "sale",
            galleryId: "",
          },
        },
        artist.token
      )) as Artwork
      await mutate(
        "moderate",
        { type: "artworks", id: work.id, status: "published", note: "" },
        admin.token
      )
      const results = await Promise.allSettled(
        Array.from({ length: 3 }, () =>
          mutate(
            "reserve",
            {
              kind: "artwork",
              resourceId: work.id,
              quantity: 1,
              delivery: {
                recipient: "خریدار آزمون",
                phone: "09123456789",
                address: "نشانی کامل آزمایش در شهر تهران",
                postalCode: "1234567890",
              },
              idempotencyKey: randomUUID(),
            },
            visitor.token
          )
        )
      )
      assert.equal(results.filter((r) => r.status === "fulfilled").length, 1)
    }
  )
  await t.test("messages and orders are private across accounts", async () => {
    await mutate(
      "request",
      {
        resourceId: gallery.id,
        kind: "submission",
        message: "درخواست همکاری با گالری برای نمایش آثار",
      },
      artist.token
    )
    const req = (await dashboard(owner.token)).requests[0]!
    assert.ok(req)
    assert.equal((await dashboard(visitor.token)).requests.length, 0)
    await reject(
      () =>
        mutate("reply", { id: req.id, reply: "پاسخ غیرمجاز" }, visitor.token),
      403
    )
    await mutate(
      "reply",
      { id: req.id, reply: "نمونه‌کار شما دریافت شد." },
      owner.token
    )
    assert.equal(
      (await dashboard(artist.token)).requests[0]!.status,
      "answered"
    )
    assert.ok((await dashboard(owner.token)).orders.every((o) => !o.token))
    const artists = (await catalog()).artists
    assert.ok(artists.every((a) => !("email" in a) && !("password" in a)))
  })
  await t.test(
    "door staff can admit only assigned events and revocation is immediate",
    async () => {
      const door = await authenticate("register", {
        email: `door-${randomUUID()}@test.example`,
        password,
        name: "همکار پذیرش",
        role: "enthusiast",
      })
      const newOrder = (await mutate(
        "reserve",
        {
          kind: "event",
          resourceId: event.id,
          quantity: 1,
          idempotencyKey: randomUUID(),
        },
        visitor.token
      )) as Order
      await reject(
        () => mutate("checkin", { token: newOrder.token }, door.token),
        403
      )
      const membership = (await mutate(
        "assign-door",
        { eventId: event.id, email: door.user.email },
        owner.token
      )) as { id: string }
      assert.equal((await dashboard(door.token)).events.length, 1)
      assert.equal((await dashboard(door.token)).orders.length, 0)
      await mutate("checkin", { token: newOrder.token }, door.token)
      await reject(
        () => mutate("entity", { type: "events", data: eventData }, door.token),
        403
      )
      await mutate("remove-door", { id: membership.id }, owner.token)
      assert.equal((await dashboard(door.token)).events.length, 0)
    }
  )
  await t.test(
    "gateway verification uses stored amount, is idempotent and handles late payments safely",
    async () => {
      const o = (await mutate(
        "reserve",
        {
          kind: "event",
          resourceId: paid.id,
          quantity: 1,
          idempotencyKey: randomUUID(),
        },
        visitor.token
      )) as Order
      const oldFetch = globalThis.fetch
      const oldMerchant = process.env.ZARINPAL_MERCHANT_ID
      const oldOrigin = process.env.APP_ORIGIN
      delete process.env.ZARINPAL_MERCHANT_ID
      await reject(() => startPayment(o.id, visitor.token), 503)
      process.env.ZARINPAL_MERCHANT_ID = "test-only-no-network"
      process.env.APP_ORIGIN = "http://localhost:3100"
      const authority = "A" + randomUUID().replaceAll("-", "")
      globalThis.fetch = async (url, init) => {
        const body = JSON.parse(String(init?.body))
        assert.equal(body.amount, 2000000)
        return new Response(
          JSON.stringify({
            data: String(url).includes("request")
              ? { code: 100, authority }
              : { code: 100, ref_id: 123456 },
          }),
          { status: 200 }
        )
      }
      try {
        const payment = await startPayment(o.id, visitor.token)
        assert.ok(payment.url.endsWith(authority))
        const success = await verifyPayment(authority, "OK")
        assert.equal(success.status, "confirmed")
        assert.equal((await verifyPayment(authority, "OK")).status, "confirmed")
        const late = (await mutate(
          "reserve",
          {
            kind: "event",
            resourceId: paid.id,
            quantity: 1,
            idempotencyKey: randomUUID(),
          },
          visitor.token
        )) as Order
        const lateAuthority = "B" + randomUUID().replaceAll("-", "")
        await transaction((s) => {
          const x = s.orders.find((x) => x.id === late.id)!
          x.paymentReference = lateAuthority
          x.expiresAt = "2000-01-01T00:00:00.000Z"
        })
        assert.equal(
          (await verifyPayment(lateAuthority, "OK")).status,
          "refund_requested"
        )
      } finally {
        globalThis.fetch = oldFetch
        if (oldMerchant === undefined) delete process.env.ZARINPAL_MERCHANT_ID
        else process.env.ZARINPAL_MERCHANT_ID = oldMerchant
        if (oldOrigin === undefined) delete process.env.APP_ORIGIN
        else process.env.APP_ORIGIN = oldOrigin
      }
    }
  )
  await t.test("event cancellation updates all reservations", async () => {
    await mutate("cancel-event", { id: event.id }, owner.token)
    assert.ok(!(await catalog()).events.some((e) => e.id === event.id))
    assert.ok(
      (await dashboard(visitor.token)).orders
        .filter((o) => o.resourceId === event.id)
        .every((o) => o.status === "cancelled")
    )
  })
  await t.test("logout invalidates server session", async () => {
    await mutate("logout", {}, visitor.token)
    await reject(() => dashboard(visitor.token), 401)
  })
})

test("shipping authorization, receipt and password session revocation", async () => {
  const owner = await authenticate("register", {
    email: `seller-${randomUUID()}@test.example`,
    password,
    name: "فروشنده آزمون",
    role: "artist",
  })
  const buyer = await authenticate("register", {
    email: `buyer-${randomUUID()}@test.example`,
    password,
    name: "خریدار آزمون",
    role: "collector",
  })
  const orderId = randomUUID()
  await transaction((s) => {
    s.orders.push({
      id: orderId,
      ownerId: owner.user.id,
      userId: buyer.user.id,
      resourceId: "fixture-work",
      kind: "artwork",
      quantity: 1,
      total: 1000000,
      status: "confirmed",
      fulfillment: "processing",
      createdAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      token: randomUUID(),
      checkedIn: false,
      idempotencyKey: randomUUID(),
    })
  })
  await reject(
    () =>
      mutate("ship", { id: orderId, trackingCode: "POST-1234" }, buyer.token),
    403
  )
  await reject(() => mutate("receive", { id: orderId }, buyer.token), 409)
  await mutate("ship", { id: orderId, trackingCode: "POST-1234" }, owner.token)
  await reject(() => mutate("cancel", { id: orderId }, buyer.token), 409)
  await mutate("receive", { id: orderId }, buyer.token)
  assert.equal(
    (await dashboard(buyer.token)).orders[0]!.fulfillment,
    "delivered"
  )
  const second = await authenticate("login", {
    email: buyer.user.email,
    password,
  })
  await mutate(
    "password",
    { currentPassword: password, newPassword: "Updated-password-286!" },
    buyer.token
  )
  await reject(() => dashboard(second.token), 401)
  await reject(
    () => authenticate("login", { email: buyer.user.email, password }),
    401
  )
  assert.ok(await dashboard(buyer.token))
  await closeStore()
})
