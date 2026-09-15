"use client"
/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { api, usePlatform, SaveButton, Loading, Empty } from "./client"
import { date, money, taxonomy, type Order } from "./types"
import { ArtCard } from "./Explore"
export function ContactForm({
  id,
  kind = "inquiry",
}: {
  id: string
  kind?: "inquiry" | "submission" | "commission" | "support"
}) {
  const { dashboard, notify, reload } = usePlatform()
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  return (
    <form
      className="pt-form"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!dashboard) {
          notify("ابتدا وارد حساب شوید.")
          return
        }
        setBusy(true)
        try {
          await api("request", { resourceId: id, kind, message })
          setMessage("")
          await reload()
          notify("درخواست ثبت شد. پاسخ را در حساب خود می‌بینید.")
        } catch (e) {
          notify((e as Error).message)
        } finally {
          setBusy(false)
        }
      }}
    >
      <label className="pt-field">
        {kind === "submission"
          ? "معرفی خود و پیوند نمونه‌کار"
          : kind === "commission"
            ? "شرح سفارش، ابعاد و زمان موردنظر"
            : "پیام شما"}
        <textarea
          minLength={10}
          maxLength={5000}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="جزئیات درخواست را بنویسید…"
        />
      </label>
      <button className="pt-button pt-button-ghost" disabled={busy}>
        {busy ? "در حال ثبت…" : "ارسال درخواست"}
      </button>
    </form>
  )
}
export function Detail({
  id,
  type,
  referral = "",
}: {
  id: string
  type: "events" | "galleries" | "artists" | "collection"
  referral?: string
}) {
  const { catalog, loading, dashboard, reload, notify } = usePlatform()
  const router = useRouter()
  const [delivery, setDelivery] = useState({
    recipient: "",
    phone: "",
    address: "",
    postalCode: "",
  })
  const [quantity, setQuantity] = useState(1)
  const [code, setCode] = useState(referral)
  const [busy, setBusy] = useState(false)
  const [key, setKey] = useState(() => crypto.randomUUID())
  useEffect(() => {
    if (referral) {
      void api("track", { code: referral }).catch(() => {})
    }
  }, [id, referral])
  if (loading) return <Loading />
  if (type === "artists") {
    const artist = catalog.artists.find((a) => a.id === id)
    if (!artist)
      return (
        <main id="main-content" className="pt-main">
          <Empty title="هنرمند پیدا نشد" />
        </main>
      )
    const works = catalog.artworks.filter((a) => a.ownerId === id)
    return (
      <main id="main-content" className="pt-main">
        <div className="pt-page-heading">
          <span className="pt-kicker">{artist.disciplines.join("، ")}</span>
          <h1>{artist.name}</h1>
          <p>
            {artist.city} ·{" "}
            {artist.bio || "هنرمند هنوز معرفی خود را تکمیل نکرده است."}
          </p>
          <SaveButton id={id} kind="follow" />
        </div>
        <div className="pt-grid">
          {works.map((item) => (
            <ArtCard key={item.id} item={item} type="collection" />
          ))}
        </div>
        <section className="pt-section">
          <h2>سفارش اثر به هنرمند</h2>
          <ContactForm id={id} kind="commission" />
        </section>
      </main>
    )
  }
  const item = (
    type === "events"
      ? catalog.events
      : type === "galleries"
        ? catalog.galleries
        : catalog.artworks
  ).find((x) => x.id === id)
  if (!item)
    return (
      <main id="main-content" className="pt-main">
        <Empty title="این مورد در دسترس نیست">
          ممکن است هنوز منتشر نشده یا لغو شده باشد.
        </Empty>
        <Link href="/explore" className="pt-button">
          بازگشت به کشف هنر
        </Link>
      </main>
    )
  const gallery =
    "galleryId" in item
      ? catalog.galleries.find((g) => g.id === item.galleryId)
      : undefined
  const remaining = "remaining" in item ? Number(item.remaining) : undefined
  const reservable =
    ("admission" in item && item.admission !== "open") ||
    ("availability" in item && item.availability === "sale")
  const reserve = async () => {
    if (!dashboard) {
      router.push("/login")
      return
    }
    setBusy(true)
    try {
      const order = await api<Order>("reserve", {
        resourceId: id,
        kind: type === "events" ? "event" : "artwork",
        quantity,
        delivery: type === "collection" ? delivery : undefined,
        code: code || undefined,
        idempotencyKey: key,
      })
      await reload()
      setKey(crypto.randomUUID())
      router.push(`/account?order=${order.id}`)
    } catch (e) {
      notify((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <main id="main-content" className="pt-main">
      <p className="pt-micro">
        <Link href={`/${type}`}>بازگشت به فهرست</Link> / {item.city}
      </p>
      <div className="pt-detail">
        <div>
          <img className="pt-detail-image" src={item.image} alt={item.title} />
          <section className="pt-section">
            <h2>
              درباره{" "}
              {type === "events"
                ? "رویداد"
                : type === "galleries"
                  ? "فضا"
                  : "اثر"}
            </h2>
            <p className="pt-detail-body">{item.description}</p>
          </section>
          {gallery && (
            <section className="pt-section">
              <h2>محل بازدید</h2>
              <Link href={`/galleries/${gallery.id}`}>{gallery.title} ↖</Link>
              <p>{gallery.address}</p>
              <p className="pt-micro">{gallery.accessibility}</p>
            </section>
          )}
        </div>
        <aside>
          <span className="pt-kicker">
            {"kind" in item ? item.kind : item.medium}
          </span>
          <h1>{item.title}</h1>
          <div className="pt-actions">
            <SaveButton
              id={id}
              kind={type === "galleries" ? "follow" : "save"}
            />
            {type !== "collection" && <SaveButton id={id} kind="trip" />}
          </div>
          <dl className="pt-facts">
            <div>
              <dt>شهر</dt>
              <dd>{item.city}</dd>
            </div>
            <div>
              <dt>رشته</dt>
              <dd>{item.medium}</dd>
            </div>
            {"startsAt" in item && (
              <>
                <div>
                  <dt>شروع</dt>
                  <dd>{date(item.startsAt)}</dd>
                </div>
                <div>
                  <dt>پایان</dt>
                  <dd>{date(item.endsAt)}</dd>
                </div>
                <div>
                  <dt>ظرفیت باقی‌مانده</dt>
                  <dd>
                    {remaining === undefined
                      ? "در حال بررسی"
                      : new Intl.NumberFormat("fa-IR").format(
                          Math.max(0, remaining)
                        )}
                  </dd>
                </div>
                <div>
                  <dt>ورود</dt>
                  <dd>{taxonomy.admission[item.admission]}</dd>
                </div>
                <div>
                  <dt>هزینه هر نفر</dt>
                  <dd>{money(item.price)}</dd>
                </div>
                <div>
                  <dt>لغو رزرو</dt>
                  <dd>تا {item.refundHours} ساعت قبل از شروع</dd>
                </div>
              </>
            )}
            {"address" in item && (
              <>
                <div>
                  <dt>نشانی</dt>
                  <dd>{item.address}</dd>
                </div>
                <div>
                  <dt>ساعت بازدید</dt>
                  <dd>{item.hours}</dd>
                </div>
                <div>
                  <dt>دسترس‌پذیری</dt>
                  <dd>{item.accessibility}</dd>
                </div>
              </>
            )}
            {"artistName" in item && (
              <>
                <div>
                  <dt>هنرمند</dt>
                  <dd>
                    <Link href={`/artists/${item.ownerId}`}>
                      {item.artistName}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt>تکنیک</dt>
                  <dd>{item.technique}</dd>
                </div>
                <div>
                  <dt>ابعاد</dt>
                  <dd>{item.dimensions}</dd>
                </div>
                <div>
                  <dt>سال / سبک</dt>
                  <dd>
                    {item.year} / {item.style}
                  </dd>
                </div>
                <div>
                  <dt>عرضه</dt>
                  <dd>
                    {item.availability === "sale"
                      ? money(item.price)
                      : item.availability === "inquiry"
                        ? "قیمت با استعلام"
                        : "صرفاً نمایشی"}
                  </dd>
                </div>
              </>
            )}
          </dl>
          {item.demo && (
            <p className="pt-notice">
              این محتوای نمونه است؛ مراجعه حضوری و خرید واقعی ندارد.
            </p>
          )}
          {reservable && (
            <div className="pt-panel">
              <h2>{type === "events" ? "رزرو جای شما" : "رزرو اثر"}</h2>
              <div className="pt-form">
                {type === "collection" && (
                  <>
                    {Object.entries({
                      recipient: "نام گیرنده",
                      phone: "شماره همراه (09...)",
                      address: "نشانی کامل ارسال",
                      postalCode: "کد پستی ده‌رقمی",
                    }).map(([name, label]) => (
                      <label className="pt-field" key={name}>
                        {label}
                        <input
                          value={delivery[name as keyof typeof delivery]}
                          onChange={(e) => {
                            setDelivery({ ...delivery, [name]: e.target.value })
                            setKey(crypto.randomUUID())
                          }}
                          required
                        />
                      </label>
                    ))}
                    <p className="pt-notice">
                      جزئیات بسته‌بندی و تحویل را پیش از پرداخت از فروشنده
                      استعلام کنید. هزینه‌ای خارج از مبلغ سفارش در این مسیر
                      دریافت نمی‌شود.
                    </p>
                  </>
                )}
                <label className="pt-field">
                  تعداد
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(Number(e.target.value))
                      setKey(crypto.randomUUID())
                    }}
                  />
                </label>
                {type === "events" && (
                  <label className="pt-field">
                    کد تخفیف
                    <input
                      value={code}
                      maxLength={30}
                      onChange={(e) => {
                        setCode(e.target.value)
                        setKey(crypto.randomUUID())
                      }}
                    />
                  </label>
                )}
                <p className="pt-micro">
                  مبلغ نهایی پس از اعتبارسنجی تخفیف در مرحله تأیید نمایش داده
                  می‌شود. ظرفیت رزرو پرداخت‌نشده ۱۵ دقیقه نگهداری می‌شود.
                </p>
                <button
                  className="pt-button pt-button-accent"
                  disabled={
                    busy ||
                    (remaining !== undefined && remaining < quantity) ||
                    !Number.isInteger(quantity) ||
                    quantity < 1 ||
                    quantity > 10
                  }
                  onClick={() => void reserve()}
                >
                  {busy ? "در حال رزرو…" : "ادامه و تأیید رزرو"}
                </button>
              </div>
            </div>
          )}
          {type === "galleries" && (
            <div className="pt-actions">
              <Link href={`/gallery/demo?gallery=${id}`} className="pt-button">
                پیش‌نمایش مجازی آثار
              </Link>
              {"latitude" in item &&
                item.latitude !== undefined &&
                item.longitude !== undefined &&
                !item.demo && (
                  <a
                    className="pt-button pt-button-ghost"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}#map=16/${item.latitude}/${item.longitude}`}
                  >
                    نقشه و مسیریابی
                  </a>
                )}
            </div>
          )}
        </aside>
      </div>
      {type === "galleries" && (
        <section className="pt-section">
          <div className="pt-section-title">
            <h2>برنامه‌های این گالری</h2>
          </div>
          <div className="pt-grid">
            {catalog.events
              .filter((e) => e.galleryId === id)
              .map((item) => (
                <ArtCard key={item.id} item={item} type="events" />
              ))}
          </div>
        </section>
      )}
      <section className="pt-section">
        <h2>
          {type === "galleries"
            ? "درخواست همکاری با گالری"
            : type === "events" && "kind" in item && item.kind === "فراخوان"
              ? "ارسال برای فراخوان"
              : "پرسش درباره این اثر یا رویداد"}
        </h2>
        <ContactForm
          id={id}
          kind={
            type === "galleries" || ("kind" in item && item.kind === "فراخوان")
              ? "submission"
              : "inquiry"
          }
        />
      </section>
    </main>
  )
}
