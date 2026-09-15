"use client"
/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { api, usePlatform, Empty, Loading } from "./client"
import { roles, taxonomy, money, date } from "./types"
import { ContactForm } from "./Detail"
export function Login() {
  const [register, setRegister] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const { reload } = usePlatform()
  const router = useRouter()
  return (
    <main id="main-content" className="pt-main">
      <div className="pt-auth">
        <div className="pt-page-heading">
          <span className="pt-kicker">جای شما در جهان هنر</span>
          <h1>{register ? "عضو پالتو شو." : "خوش برگشتی."}</h1>
          <p>آثار محبوب، بلیت‌ها و فضای کاری‌ات در یک حساب.</p>
        </div>
        <form
          className="pt-form"
          onSubmit={async (e) => {
            e.preventDefault()
            setError("")
            setBusy(true)
            const data = Object.fromEntries(new FormData(e.currentTarget))
            try {
              await api(register ? "register" : "login", data)
              await reload()
              router.push(
                register &&
                  data.role !== "enthusiast" &&
                  data.role !== "collector"
                  ? "/studio"
                  : "/account"
              )
            } catch (e) {
              setError((e as Error).message)
            } finally {
              setBusy(false)
            }
          }}
        >
          {register && (
            <>
              <label className="pt-field">
                نام و نام خانوادگی
                <input name="name" autoComplete="name" required minLength={2} />
              </label>
              <label className="pt-field">
                نقش اصلی شما
                <select name="role">
                  {Object.entries(roles)
                    .filter(([r]) => r !== "admin")
                    .map(([r, l]) => (
                      <option value={r} key={r}>
                        {l}
                      </option>
                    ))}
                </select>
              </label>
            </>
          )}
          <label className="pt-field">
            ایمیل
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              dir="ltr"
            />
          </label>
          <label className="pt-field">
            رمز عبور (حداقل ۱۰ کاراکتر)
            <input
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={10}
              maxLength={128}
            />
          </label>
          {error && (
            <p className="pt-error" role="alert">
              {error}
            </p>
          )}
          <button className="pt-button" disabled={busy}>
            {busy ? "در حال بررسی…" : register ? "ساخت حساب" : "ورود"}
          </button>
          <button
            className="pt-button pt-button-ghost"
            type="button"
            onClick={() => {
              setRegister(!register)
              setError("")
            }}
          >
            {register ? "قبلاً حساب ساخته‌ام" : "حساب ندارم؛ ثبت‌نام"}
          </button>
        </form>
      </div>
    </main>
  )
}
const orderStatus = {
  pending: "منتظر پرداخت",
  confirmed: "تأییدشده",
  cancelled: "لغوشده",
  refund_requested: "در انتظار استرداد",
  refunded: "مستردشده",
}
export function Account() {
  const { dashboard, catalog, loading, reload, notify } = usePlatform()
  const [tab, setTab] = useState("orders")
  const [busy, setBusy] = useState("")
  const router = useRouter()
  if (loading) return <Loading />
  if (!dashboard)
    return (
      <main id="main-content" className="pt-main">
        <Empty title="حساب شما منتظر شماست">
          <Link className="pt-button" href="/login">
            ورود یا عضویت
          </Link>
        </Empty>
      </main>
    )
  const user = dashboard.user
  const orders = dashboard.orders.filter((o) => o.userId === user.id)
  const act = async (action: string, data: unknown) => {
    setBusy(action)
    try {
      const result = await api<{ url?: string }>(action, data)
      await reload()
      if (result.url) window.location.assign(result.url)
      else notify("تغییرات ثبت شد.")
    } catch (e) {
      notify((e as Error).message)
    } finally {
      setBusy("")
    }
  }
  const saved = dashboard.saves
    .filter((s) => (tab === "trip" ? s.kind === "trip" : s.kind !== "trip"))
    .map((s) => ({
      save: s,
      item: [...catalog.events, ...catalog.galleries, ...catalog.artworks].find(
        (i) => i.id === s.targetId
      ),
      artist: catalog.artists.find((a) => a.id === s.targetId),
    }))
  return (
    <main id="main-content" className="pt-main">
      <div className="pt-page-heading">
        <span className="pt-kicker">{roles[user.role]}</span>
        <h1>سلام، {user.name}.</h1>
        <div className="pt-actions">
          <Link className="pt-button pt-button-ghost" href="/studio">
            فضای کاری حرفه‌ای
          </Link>
          <button
            className="pt-button pt-button-ghost"
            onClick={async () => {
              await api("logout", {})
              await reload()
              router.push("/explore")
            }}
          >
            خروج
          </button>
        </div>
      </div>
      <div className="pt-tabs">
        {[
          ["orders", "بلیت‌ها و سفارش‌ها"],
          ["activity", "تازه‌های شما"],
          ["saved", "ذخیره‌شده‌ها"],
          ["trip", "برنامه بازدید"],
          ["requests", "درخواست‌ها"],
          ["profile", "پروفایل"],
          ["security", "امنیت حساب"],
          ["support", "پشتیبانی"],
        ].map(([v, l]) => (
          <button key={v} aria-pressed={tab === v} onClick={() => setTab(v!)}>
            {l}
          </button>
        ))}
      </div>
      {tab === "activity" && (
        <section className="pt-list">
          <h2>تازه‌های گالری‌ها و هنرمندان دنبال‌شده</h2>
          {catalog.events
            .filter((e) =>
              dashboard.saves.some(
                (s) =>
                  s.kind === "follow" &&
                  (s.targetId === e.galleryId || s.targetId === e.ownerId)
              )
            )
            .map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="pt-row">
                <div>
                  <h3>{e.title}</h3>
                  <p>
                    {e.city} · {date(e.startsAt)}
                  </p>
                </div>
                <span>مشاهده برنامه ↖</span>
              </Link>
            ))}
          {catalog.artworks
            .filter((a) =>
              dashboard.saves.some(
                (s) =>
                  s.kind === "follow" &&
                  (s.targetId === a.ownerId || s.targetId === a.galleryId)
              )
            )
            .map((a) => (
              <Link key={a.id} href={`/collection/${a.id}`} className="pt-row">
                <h3>{a.title}</h3>
                <span>{a.artistName} ↖</span>
              </Link>
            ))}
          <p className="pt-micro">
            با دنبال‌کردن هنرمندان و گالری‌ها، برنامه‌ها و آثار تازه آن‌ها اینجا
            نمایش داده می‌شود.
          </p>
        </section>
      )}
      {tab === "orders" &&
        (orders.length ? (
          <div className="pt-list">
            {orders.map((o) => {
              const item = [...catalog.events, ...catalog.artworks].find(
                (i) => i.id === o.resourceId
              )
              return (
                <article className="pt-ticket" key={o.id}>
                  <div>
                    <span className="pt-tag" data-status={o.status}>
                      {orderStatus[o.status]}
                    </span>
                    <h2>{item?.title || "سفارش ثبت‌شده"}</h2>
                    <p>
                      {o.quantity} {o.kind === "event" ? "نفر" : "نسخه"} ·{" "}
                      {money(o.total)}
                    </p>
                    <p className="pt-micro">
                      {date(o.createdAt)}
                      {o.checkedIn ? " · ورود ثبت شده" : ""}
                    </p>
                    {o.trackingCode && (
                      <p className="pt-notice">
                        کد پیگیری ارسال: {o.trackingCode} ·{" "}
                        {o.fulfillment === "delivered"
                          ? "تحویل تأیید شد"
                          : "ارسال شده"}
                      </p>
                    )}
                    {o.fulfillment === "shipped" && (
                      <button
                        className="pt-button pt-button-ghost"
                        onClick={() => void act("receive", { id: o.id })}
                      >
                        تأیید دریافت اثر
                      </button>
                    )}
                    {o.status === "pending" && (
                      <p className="pt-notice">
                        مهلت پرداخت: {date(o.expiresAt)}. پس از مهلت، ظرفیت آزاد
                        می‌شود.
                      </p>
                    )}
                    <div className="pt-actions">
                      {o.status === "pending" && (
                        <button
                          className="pt-button"
                          disabled={!!busy}
                          onClick={() => void act("pay", { id: o.id })}
                        >
                          پرداخت امن
                        </button>
                      )}
                      {["pending", "confirmed"].includes(o.status) &&
                        !o.checkedIn && (
                          <button
                            className="pt-button pt-button-ghost"
                            disabled={!!busy}
                            onClick={() => {
                              if (
                                window.confirm(
                                  "این سفارش لغو شود؟ شرایط لغو رویداد اعمال می‌شود."
                                )
                              )
                                void act("cancel", { id: o.id })
                            }}
                          >
                            لغو سفارش
                          </button>
                        )}
                      {o.status === "confirmed" && (
                        <button
                          className="pt-button pt-button-ghost"
                          onClick={() => window.print()}
                        >
                          چاپ رسید
                        </button>
                      )}
                    </div>
                  </div>
                  {o.status === "confirmed" && o.kind === "event" && (
                    <div>
                      <img
                        src={`/api/platform/ticket/${o.id}`}
                        alt="کد QR بلیت ورود"
                      />
                      <code>{o.token}</code>
                      <p className="pt-micro">
                        این کد را در اختیار دیگران نگذارید.
                      </p>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        ) : (
          <Empty title="هنوز بلیتی ندارید">
            <Link href="/events">رویداد بعدی‌تان را پیدا کنید ↖</Link>
          </Empty>
        ))}
      {(tab === "saved" || tab === "trip") && (
        <>
          {tab === "trip" && (
            <p className="pt-notice">
              برنامه شخصی شما؛ قبل از حرکت ساعت و نشانی هر فضا را بررسی کنید.
              افزودن به برنامه جایگزین رزرو نیست.
            </p>
          )}
          {saved.length ? (
            <div className="pt-list">
              {saved.map(({ save, item, artist }) => (
                <div className="pt-row" key={save.targetId + save.kind}>
                  <div>
                    <h3>
                      {item?.title ||
                        artist?.name ||
                        "محتوای خارج‌شده از انتشار"}
                    </h3>
                    <p>
                      {item?.city}
                      {item && "startsAt" in item
                        ? ` · ${date(item.startsAt)}`
                        : ""}
                    </p>
                  </div>
                  <div className="pt-actions">
                    {item && (
                      <Link
                        href={`/${"startsAt" in item ? "events" : "address" in item ? "galleries" : "collection"}/${item.id}`}
                        className="pt-button pt-button-ghost"
                      >
                        مشاهده
                      </Link>
                    )}
                    {artist && (
                      <Link href={`/artists/${artist.id}`}>پروفایل هنرمند</Link>
                    )}
                    <button
                      className="pt-button pt-button-ghost"
                      onClick={() =>
                        void act("save", {
                          targetId: save.targetId,
                          kind: save.kind,
                        })
                      }
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </>
      )}
      {tab === "requests" &&
        (dashboard.requests.filter((r) => r.userId === user.id).length ? (
          <div className="pt-list">
            {dashboard.requests
              .filter((r) => r.userId === user.id)
              .map((r) => (
                <article className="pt-panel" key={r.id}>
                  <span className="pt-tag">
                    {r.status === "answered"
                      ? "پاسخ داده شده"
                      : "در انتظار پاسخ"}
                  </span>
                  <p>{r.message}</p>
                  {r.reply && (
                    <blockquote className="pt-notice">{r.reply}</blockquote>
                  )}
                </article>
              ))}
          </div>
        ) : (
          <Empty title="درخواستی ثبت نکرده‌اید" />
        ))}
      {tab === "profile" && (
        <form
          className="pt-panel pt-form"
          onSubmit={async (e) => {
            e.preventDefault()
            const f = new FormData(e.currentTarget)
            await act("profile", {
              name: f.get("name"),
              bio: f.get("bio"),
              city: f.get("city"),
              disciplines: f.getAll("disciplines"),
              marketingConsent: f.get("marketingConsent") === "on",
            })
          }}
        >
          <h2>معرفی و علاقه‌مندی‌ها</h2>
          <div className="pt-form-grid">
            <label className="pt-field">
              نام
              <input name="name" defaultValue={user.name} required />
            </label>
            <label className="pt-field">
              شهر
              <input name="city" defaultValue={user.city} />
            </label>
            <label className="pt-field wide">
              معرفی / بیوگرافی
              <textarea name="bio" defaultValue={user.bio} maxLength={4000} />
            </label>
          </div>
          <fieldset>
            <legend>رشته‌های فعالیت یا علاقه</legend>
            <div className="pt-checks">
              {taxonomy.medium.map((m) => (
                <label key={m}>
                  <input
                    type="checkbox"
                    name="disciplines"
                    value={m}
                    defaultChecked={user.disciplines.includes(m)}
                  />
                  {m}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="pt-micro">
            <input
              type="checkbox"
              name="marketingConsent"
              defaultChecked={user.marketingConsent}
            />{" "}
            مایل به دریافت خبر برنامه‌ها و پیشنهادهای هنری هستم.
          </label>
          <button className="pt-button" disabled={!!busy}>
            ذخیره پروفایل
          </button>
        </form>
      )}
      {tab === "security" && (
        <form
          className="pt-panel pt-form"
          onSubmit={async (e) => {
            e.preventDefault()
            const f = new FormData(e.currentTarget)
            await act("password", {
              currentPassword: f.get("currentPassword"),
              newPassword: f.get("newPassword"),
            })
          }}
        >
          <h2>تغییر رمز عبور</h2>
          <label className="pt-field">
            رمز فعلی
            <input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <label className="pt-field">
            رمز جدید (حداقل ۱۰ کاراکتر)
            <input
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={10}
              maxLength={128}
              required
            />
          </label>
          <p className="pt-micro">
            بعد از تغییر رمز، نشست‌های دیگر حساب بسته می‌شوند.
          </p>
          <button className="pt-button" disabled={!!busy}>
            تغییر رمز
          </button>
        </form>
      )}
      {tab === "support" && (
        <div className="pt-panel">
          <h2>درخواست پشتیبانی</h2>
          <ContactForm id="support" kind="support" />
        </div>
      )}
    </main>
  )
}
