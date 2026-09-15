"use client"
import Link from "next/link"
import { useState } from "react"
import { api, usePlatform, Loading, Empty } from "./client"
import { EntityForm, CampaignForm } from "./Forms"
import {
  roles,
  taxonomy,
  money,
  number,
  date,
  type EntityType,
  type Gallery,
  type Event,
  type Artwork,
} from "./types"
const roleTabs: Record<string, string[]> = {
  artist: ["artworks", "fulfillment", "events", "requests", "team", "checkin"],
  gallery: [
    "galleries",
    "events",
    "artworks",
    "fulfillment",
    "requests",
    "marketing",
    "team",
    "checkin",
  ],
  organizer: ["events", "requests", "marketing", "team", "checkin"],
  curator: ["events", "requests", "marketing", "team", "checkin"],
  admin: [
    "moderation",
    "galleries",
    "events",
    "artworks",
    "fulfillment",
    "requests",
    "marketing",
    "team",
    "checkin",
    "refunds",
    "users",
    "audit",
  ],
  enthusiast: [],
  collector: [],
}
const names: Record<string, string> = {
  fulfillment: "ارسال آثار",
  team: "همکاران پذیرش",
  overview: "نمای کلی",
  galleries: "فضاهای من",
  events: "رویدادها و فراخوان‌ها",
  artworks: "آثار و موجودی",
  requests: "پیام‌ها و همکاری",
  marketing: "کمپین و بازاریابی",
  checkin: "پذیرش بلیت",
  moderation: "بررسی و انتشار",
  refunds: "استردادها",
  users: "کاربران",
  audit: "تاریخچه عملیات",
}
function exportCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return
  const columns = Object.keys(rows[0]!)
  const cell = (value: unknown) =>
    `"${String(value ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""')}"`
  const blob = new Blob(
    [
      "\uFEFF" +
        [
          columns.map(cell).join(","),
          ...rows.map((row) => columns.map((c) => cell(row[c])).join(",")),
        ].join("\n"),
    ],
    { type: "text/csv;charset=utf-8" }
  )
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
export function Studio() {
  const { dashboard, loading, reload, notify } = usePlatform()
  const [tab, setTab] = useState("overview")
  const [form, setForm] = useState(false)
  const [editing, setEditing] = useState<
    Gallery | Event | Artwork | undefined
  >()
  const [busy, setBusy] = useState(false)
  if (loading) return <Loading />
  if (!dashboard)
    return (
      <main id="main-content" className="pt-main">
        <div className="pt-page-heading">
          <h1>فضای کار هنر شما.</h1>
          <p>
            برای مدیریت نمونه‌کار، نمایشگاه، رویداد و مخاطبان وارد حساب شوید.
          </p>
        </div>
        <Link href="/login" className="pt-button">
          ورود / ثبت‌نام حرفه‌ای
        </Link>
      </main>
    )
  const user = dashboard.user
  const tabs = [
    ...new Set([
      "overview",
      ...(roleTabs[user.role] || []),
      ...(dashboard.memberships.some((m) => m.userId === user.id)
        ? ["checkin"]
        : []),
    ]),
  ]
  const ownedOrders = dashboard.orders.filter(
    (o) => o.ownerId === user.id || user.role === "admin"
  )
  const confirmed = ownedOrders.filter((o) => o.status === "confirmed")
  const entities = [
    ...dashboard.galleries.map((x) => ({ ...x, type: "galleries" as const })),
    ...dashboard.events.map((x) => ({ ...x, type: "events" as const })),
    ...dashboard.artworks.map((x) => ({ ...x, type: "artworks" as const })),
  ]
  const act = async (action: string, data: unknown) => {
    setBusy(true)
    try {
      await api(action, data)
      await reload()
      notify("عملیات با موفقیت ثبت شد.")
    } catch (e) {
      notify((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <main id="main-content" className="pt-main">
      <div className="pt-page-heading">
        <span className="pt-kicker">فضای کاری / {roles[user.role]}</span>
        <h1>هنرت را پیش ببر.</h1>
        <p>محتوا، مخاطبان و برنامه‌هایت را از همین‌جا مدیریت کن.</p>
      </div>
      <div className="pt-workspace">
        <nav className="pt-sidebar" aria-label="بخش‌های فضای کاری">
          {tabs.map((t) => (
            <button
              key={t}
              aria-current={tab === t ? "page" : undefined}
              onClick={() => {
                setTab(t)
                setForm(false)
                setEditing(undefined)
              }}
            >
              {names[t]}
            </button>
          ))}
          <Link className="pt-button pt-button-ghost" href="/account">
            حساب شخصی
          </Link>
        </nav>
        <section>
          {tab === "overview" && (
            <>
              <h2>تصویر امروز</h2>
              <div className="pt-stats">
                <div className="pt-stat">
                  <strong>
                    {number(
                      entities.filter((e) => e.status === "published").length
                    )}
                  </strong>
                  <span>محتوای منتشرشده</span>
                </div>
                <div className="pt-stat">
                  <strong>{number(confirmed.length)}</strong>
                  <span>سفارش تأییدشده</span>
                </div>
                <div className="pt-stat">
                  <strong>
                    {number(
                      dashboard.requests.filter(
                        (r) => r.status === "open" && r.ownerId === user.id
                      ).length
                    )}
                  </strong>
                  <span>درخواست منتظر پاسخ</span>
                </div>
              </div>
              <div className="pt-panel">
                <h2>
                  {[
                    "artist",
                    "gallery",
                    "organizer",
                    "curator",
                    "admin",
                  ].includes(user.role)
                    ? "گام بعدی شما"
                    : "از تماشا شروع کنید"}
                </h2>
                <p>
                  {user.role === "artist"
                    ? "پروفایل خود را تکمیل کنید، آثار را ثبت کنید و برای همکاری به گالری‌ها درخواست بفرستید."
                    : user.role === "gallery"
                      ? "فضای خود را ثبت کنید. پس از تأیید مدیر، رویدادها و آثار را به گالری متصل کنید."
                      : user.role === "organizer" || user.role === "curator"
                        ? "نمایشگاه، فراخوان، تور یا ورکشاپ بسازید؛ ظرفیت، زمان و شرایط لغو را مشخص کنید."
                        : user.role === "admin"
                          ? "محتوای منتظر بررسی، استردادها و درخواست‌های پشتیبانی را پیگیری کنید."
                          : "آثار را ذخیره کنید، هنرمندان را دنبال کنید و برنامه بازدید بسازید."}
                </p>
                <Link href="/account" className="pt-button pt-button-ghost">
                  تکمیل پروفایل
                </Link>
              </div>
              <section className="pt-section">
                <h2>گزارش فروش</h2>
                <p>
                  مجموع ناخالص سفارش‌های تأییدشده:{" "}
                  <strong>
                    {money(confirmed.reduce((s, o) => s + o.total, 0))}
                  </strong>
                </p>
                <p className="pt-micro">
                  این مبلغ گزارش فروش است و به معنای واریز یا تسویه به حساب
                  بانکی نیست.
                </p>
                <button
                  className="pt-button pt-button-ghost"
                  disabled={!ownedOrders.length}
                  onClick={() =>
                    exportCSV(
                      ownedOrders.map((o) => ({
                        شناسه: o.id,
                        نوع: o.kind,
                        تعداد: o.quantity,
                        مبلغ_تومان: o.total,
                        وضعیت: o.status,
                        زمان: o.createdAt,
                      })),
                      "paletto-orders.csv"
                    )
                  }
                >
                  خروجی سفارش‌ها CSV
                </button>
              </section>
            </>
          )}
          {["galleries", "events", "artworks"].includes(tab) && (
            <>
              <div className="pt-section-title">
                <h2>{names[tab]}</h2>
                <button
                  className="pt-button"
                  onClick={() => {
                    setEditing(undefined)
                    setForm(true)
                  }}
                >
                  ثبت مورد جدید +
                </button>
              </div>
              {form ? (
                <EntityForm
                  type={tab as EntityType}
                  item={editing}
                  onDone={() => {
                    setForm(false)
                    setEditing(undefined)
                  }}
                />
              ) : (
                <div className="pt-list">
                  {entities
                    .filter((e) => e.type === tab)
                    .map((e) => (
                      <article className="pt-row" key={e.id}>
                        <div>
                          <span className="pt-tag" data-status={e.status}>
                            {taxonomy.status[e.status]}
                          </span>
                          <h3>{e.title}</h3>
                          <p>
                            {e.city} · {e.medium}
                          </p>
                          {e.reviewNote && (
                            <p className="pt-notice">
                              نظر بررسی: {e.reviewNote}
                            </p>
                          )}
                        </div>
                        <div className="pt-actions">
                          <button
                            className="pt-button pt-button-ghost"
                            onClick={() => {
                              setEditing(e)
                              setForm(true)
                            }}
                          >
                            ویرایش
                          </button>
                          {e.status === "published" && (
                            <Link
                              href={`/${e.type === "artworks" ? "collection" : e.type}/${e.id}`}
                              className="pt-button pt-button-ghost"
                            >
                              مشاهده
                            </Link>
                          )}
                          {e.type === "events" && e.status !== "cancelled" && (
                            <button
                              className="pt-button pt-button-ghost"
                              disabled={busy}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "رویداد لغو شود؟ سفارش‌های پرداخت‌شده وارد صف استرداد می‌شوند."
                                  )
                                )
                                  void act("cancel-event", { id: e.id })
                              }}
                            >
                              لغو رویداد
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  {!entities.some((e) => e.type === tab) && (
                    <Empty title="اولین مورد خود را ثبت کنید" />
                  )}
                </div>
              )}
            </>
          )}
          {tab === "moderation" && (
            <>
              <h2>صف بررسی محتوا</h2>
              <div className="pt-list">
                {entities
                  .filter((e) => e.status === "pending")
                  .map((e) => (
                    <form
                      className="pt-panel pt-form"
                      key={e.id}
                      onSubmit={async (ev) => {
                        ev.preventDefault()
                        const f = new FormData(ev.currentTarget)
                        await act("moderate", {
                          type: e.type,
                          id: e.id,
                          status: f.get("decision"),
                          note: f.get("note"),
                        })
                      }}
                    >
                      <h3>{e.title}</h3>
                      <p>{e.description}</p>
                      <p className="pt-micro">
                        {e.city} · {e.medium} · مالک:{" "}
                        {dashboard.users.find((u) => u.id === e.ownerId)
                          ?.name || e.ownerId}
                      </p>
                      {"galleryId" in e && (
                        <p className="pt-notice">
                          گالری میزبان:{" "}
                          {dashboard.galleries.find((g) => g.id === e.galleryId)
                            ?.title || "بدون گالری"}
                          . همکاری برگزارکننده با میزبان پیش از تأیید بررسی شود.
                        </p>
                      )}
                      <label className="pt-field">
                        یادداشت بررسی
                        <textarea name="note" maxLength={2000} />
                      </label>
                      <label className="pt-field">
                        تصمیم
                        <select name="decision">
                          <option value="published">تأیید و انتشار</option>
                          <option value="rejected">بازگشت برای اصلاح</option>
                        </select>
                      </label>
                      <button className="pt-button" disabled={busy}>
                        ثبت تصمیم
                      </button>
                    </form>
                  ))}
                {!entities.some((e) => e.status === "pending") && (
                  <Empty title="موردی منتظر بررسی نیست" />
                )}
              </div>
            </>
          )}
          {tab === "requests" && (
            <>
              <h2>درخواست‌ها و همکاری‌ها</h2>
              <div className="pt-list">
                {dashboard.requests
                  .filter((r) => r.ownerId === user.id || user.role === "admin")
                  .map((r) => (
                    <form
                      className="pt-panel pt-form"
                      key={r.id}
                      onSubmit={async (e) => {
                        e.preventDefault()
                        await act("reply", {
                          id: r.id,
                          reply: new FormData(e.currentTarget).get("reply"),
                        })
                      }}
                    >
                      <span className="pt-tag">
                        {r.kind === "submission"
                          ? "درخواست همکاری"
                          : r.kind === "commission"
                            ? "سفارش ساخت اثر"
                            : r.kind === "support"
                              ? "پشتیبانی"
                              : "استعلام"}
                      </span>
                      <p>{r.message}</p>
                      <label className="pt-field">
                        پاسخ شما
                        <textarea
                          name="reply"
                          defaultValue={r.reply}
                          minLength={2}
                          maxLength={5000}
                          required
                        />
                      </label>
                      <button className="pt-button" disabled={busy}>
                        ثبت پاسخ
                      </button>
                    </form>
                  ))}
                {!dashboard.requests.some(
                  (r) => r.ownerId === user.id || user.role === "admin"
                ) && <Empty title="هنوز درخواست تازه‌ای ندارید" />}
              </div>
            </>
          )}
          {tab === "marketing" && (
            <>
              <div className="pt-section-title">
                <h2>کمپین و رشد مخاطب</h2>
                <button className="pt-button" onClick={() => setForm(!form)}>
                  کمپین جدید +
                </button>
              </div>
              <p className="pt-micro">
                با کد اختصاصی، مراجعه و رزروهای هر کمپین را اندازه بگیرید.
                بازدیدها بر اساس مرورگر در هر روز یکتا می‌شوند.
              </p>
              {form && <CampaignForm onDone={() => setForm(false)} />}
              <div className="pt-list">
                {dashboard.campaigns.map((c) => (
                  <article className="pt-panel" key={c.id}>
                    <span className="pt-kicker">{c.code}</span>
                    <h2>{c.title}</h2>
                    <p>
                      {c.percent}٪ تخفیف · {c.visits} بازدید · {c.conversions}{" "}
                      رزرو تأییدشده
                    </p>
                    <p className="pt-micro">پایان: {date(c.endsAt)}</p>
                    <button
                      className="pt-button pt-button-ghost"
                      disabled={busy}
                      onClick={() => void act("end-campaign", { id: c.id })}
                    >
                      توقف کمپین
                    </button>
                    <div className="pt-actions">
                      <button
                        className="pt-button pt-button-ghost"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              `${window.location.origin}/events/${c.eventId}?ref=${c.code}&utm_source=paletto&utm_medium=campaign&utm_campaign=${c.code}`
                            )
                            notify("پیوند کمپین کپی شد.")
                          } catch {
                            notify("کپی خودکار ممکن نشد.")
                          }
                        }}
                      >
                        کپی پیوند کمپین
                      </button>
                      <button
                        className="pt-button pt-button-ghost"
                        onClick={async () => {
                          const event = dashboard.events.find(
                            (e) => e.id === c.eventId
                          )
                          try {
                            await navigator.clipboard.writeText(
                              `${event?.title}\n${event?.city} | ${event ? date(event.startsAt) : ""}\nبا کد ${c.code}، ${c.percent}٪ تخفیف\n${window.location.origin}/events/${c.eventId}?ref=${c.code}`
                            )
                            notify("متن معرفی برای انتشار کپی شد.")
                          } catch {
                            notify("کپی خودکار ممکن نشد.")
                          }
                        }}
                      >
                        متن آماده معرفی
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <button
                className="pt-button pt-button-ghost"
                style={{ marginTop: 20 }}
                disabled={!dashboard.campaigns.length}
                onClick={() =>
                  exportCSV(
                    dashboard.campaigns.map((c) => ({
                      عنوان: c.title,
                      کد: c.code,
                      بازدید: c.visits,
                      رزرو: c.conversions,
                      تخفیف: c.percent,
                    })),
                    "paletto-campaigns.csv"
                  )
                }
              >
                دریافت گزارش کمپین‌ها
              </button>
            </>
          )}
          {tab === "team" && (
            <>
              <form
                className="pt-panel pt-form"
                onSubmit={async (e) => {
                  e.preventDefault()
                  const f = new FormData(e.currentTarget)
                  await act("assign-door", {
                    eventId: f.get("eventId"),
                    email: f.get("email"),
                  })
                }}
              >
                <h2>افزودن همکار پذیرش</h2>
                <p className="pt-micro">
                  همکار فقط می‌تواند بلیت رویداد انتخاب‌شده را پذیرش کند و به
                  فروش یا ویرایش محتوا دسترسی ندارد.
                </p>
                <label className="pt-field">
                  رویداد
                  <select name="eventId" required>
                    {dashboard.events
                      .filter(
                        (e) => e.ownerId === user.id || user.role === "admin"
                      )
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.title}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="pt-field">
                  ایمیل حساب همکار
                  <input name="email" type="email" required />
                </label>
                <button className="pt-button" disabled={busy}>
                  افزودن دسترسی پذیرش
                </button>
              </form>
              <div className="pt-list" style={{ marginTop: 24 }}>
                {dashboard.memberships
                  .filter((m) => m.ownerId === user.id || user.role === "admin")
                  .map((m) => (
                    <div className="pt-row" key={m.id}>
                      <div>
                        <h3>
                          {
                            dashboard.events.find((e) => e.id === m.eventId)
                              ?.title
                          }
                        </h3>
                        <p>شناسه همکار: {m.userId}</p>
                      </div>
                      <button
                        className="pt-button pt-button-ghost"
                        onClick={() => void act("remove-door", { id: m.id })}
                      >
                        لغو دسترسی
                      </button>
                    </div>
                  ))}
              </div>
            </>
          )}
          {tab === "checkin" && (
            <form
              className="pt-panel pt-form"
              onSubmit={async (e) => {
                e.preventDefault()
                await act("checkin", {
                  token: new FormData(e.currentTarget).get("token"),
                })
              }}
            >
              <h2>پذیرش بازدیدکننده</h2>
              <p>
                کد بلیت را با بارکدخوان وارد یا از بلیت کپی کنید. هر بلیت فقط یک
                بار برای تمام افراد همان رزرو پذیرش می‌شود.
              </p>
              <label className="pt-field">
                کد بلیت
                <input
                  name="token"
                  autoComplete="off"
                  required
                  minLength={20}
                  dir="ltr"
                />
              </label>
              <button className="pt-button" disabled={busy}>
                اعتبارسنجی و ثبت ورود
              </button>
              <p className="pt-micro">
                پذیرش از یک ساعت پیش از شروع تا پایان رویداد فعال است.
              </p>
            </form>
          )}
          {tab === "fulfillment" && (
            <div className="pt-list">
              <h2>سفارش‌های آثار</h2>
              {ownedOrders
                .filter((o) => o.kind === "artwork" && o.status === "confirmed")
                .map((o) => (
                  <form
                    className="pt-panel pt-form"
                    key={o.id}
                    onSubmit={async (e) => {
                      e.preventDefault()
                      await act("ship", {
                        id: o.id,
                        trackingCode: new FormData(e.currentTarget).get(
                          "trackingCode"
                        ),
                      })
                    }}
                  >
                    <h3>
                      {
                        dashboard.artworks.find((a) => a.id === o.resourceId)
                          ?.title
                      }
                    </h3>
                    <p>
                      {o.delivery?.recipient} · {o.delivery?.phone}
                    </p>
                    <p>
                      {o.delivery?.address} · کد پستی: {o.delivery?.postalCode}
                    </p>
                    <p className="pt-micro">
                      {o.fulfillment === "delivered"
                        ? "تحویل تأیید شده"
                        : o.fulfillment === "shipped"
                          ? `ارسال‌شده: ${o.trackingCode}`
                          : "آماده بسته‌بندی و ارسال"}
                    </p>
                    {o.fulfillment === "processing" && (
                      <>
                        <label className="pt-field">
                          شرکت حمل و شماره پیگیری
                          <input name="trackingCode" required minLength={2} />
                        </label>
                        <button className="pt-button" disabled={busy}>
                          ثبت ارسال اثر
                        </button>
                      </>
                    )}
                  </form>
                ))}
              {!ownedOrders.some(
                (o) => o.kind === "artwork" && o.status === "confirmed"
              ) && <Empty title="سفارش پرداخت‌شده‌ای برای ارسال ندارید" />}
            </div>
          )}
          {tab === "refunds" && (
            <div className="pt-list">
              {dashboard.orders
                .filter((o) => o.status === "refund_requested")
                .map((o) => (
                  <form
                    className="pt-panel pt-form"
                    key={o.id}
                    onSubmit={async (e) => {
                      e.preventDefault()
                      await act("refund", {
                        id: o.id,
                        reference: new FormData(e.currentTarget).get(
                          "reference"
                        ),
                      })
                    }}
                  >
                    <h3>استرداد {money(o.total)}</h3>
                    <p className="pt-micro">{o.id}</p>
                    <p className="pt-notice">
                      ابتدا وجه را از مسیر بانکی بازگردانید؛ سپس شماره پیگیری
                      واقعی را ثبت کنید.
                    </p>
                    <label className="pt-field">
                      شماره پیگیری استرداد
                      <input name="reference" required minLength={2} />
                    </label>
                    <button className="pt-button" disabled={busy}>
                      ثبت استرداد انجام‌شده
                    </button>
                  </form>
                ))}
              {!dashboard.orders.some(
                (o) => o.status === "refund_requested"
              ) && <Empty title="استردادی در انتظار نیست" />}
            </div>
          )}
          {tab === "users" && (
            <div className="pt-table-wrap">
              <table className="pt-table">
                <thead>
                  <tr>
                    <th>نام</th>
                    <th>نقش</th>
                    <th>ایمیل</th>
                    <th>عضویت</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{roles[u.role]}</td>
                      <td>{u.email}</td>
                      <td>{date(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === "audit" && (
            <div className="pt-table-wrap">
              <table className="pt-table">
                <thead>
                  <tr>
                    <th>عملیات</th>
                    <th>مورد</th>
                    <th>زمان</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.audit.map((a, i) => (
                    <tr key={i}>
                      <td>{a.action}</td>
                      <td>{a.targetId}</td>
                      <td>{date(a.at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
