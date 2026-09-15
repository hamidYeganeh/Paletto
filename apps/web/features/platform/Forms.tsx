"use client"
import { useState, useRef, type FormEvent } from "react"
import { api, usePlatform } from "./client"
import {
  taxonomy,
  type EntityType,
  type Gallery,
  type Event,
  type Artwork,
} from "./types"
const labels: Record<string, string> = {
  opensAt: "ساعت بازشدن",
  closesAt: "ساعت بسته‌شدن",
  title: "عنوان",
  description: "توضیحات",
  image: "تصویر",
  city: "شهر",
  medium: "رشته هنری",
  kind: "نوع",
  address: "نشانی دقیق",
  hours: "روزها و ساعت بازدید",
  accessibility: "امکانات و دسترس‌پذیری",
  latitude: "عرض جغرافیایی (اختیاری)",
  longitude: "طول جغرافیایی (اختیاری)",
  galleryId: "گالری میزبان",
  admission: "شیوه ورود",
  startsAt: "شروع برنامه",
  endsAt: "پایان برنامه",
  capacity: "ظرفیت",
  price: "قیمت به تومان",
  refundHours: "مهلت لغو (ساعت پیش از شروع)",
  artistName: "نام هنرمند",
  style: "سبک",
  technique: "تکنیک و جنس",
  dimensions: "ابعاد و واحد اندازه‌گیری",
  year: "سال خلق",
  stock: "تعداد نسخه قابل عرضه",
  availability: "وضعیت عرضه",
}
const fields: Record<EntityType, string[]> = {
  galleries: [
    "title",
    "kind",
    "city",
    "medium",
    "address",
    "hours",
    "opensAt",
    "closesAt",
    "accessibility",
    "latitude",
    "longitude",
    "image",
    "description",
  ],
  events: [
    "title",
    "kind",
    "city",
    "medium",
    "galleryId",
    "admission",
    "startsAt",
    "endsAt",
    "capacity",
    "price",
    "refundHours",
    "image",
    "description",
  ],
  artworks: [
    "title",
    "artistName",
    "city",
    "medium",
    "style",
    "technique",
    "dimensions",
    "year",
    "availability",
    "stock",
    "price",
    "galleryId",
    "image",
    "description",
  ],
}
export function EntityForm({
  type,
  item,
  onDone,
}: {
  type: EntityType
  item?: Gallery | Event | Artwork
  onDone: () => void
}) {
  const imageInput = useRef<HTMLInputElement>(null)
  const { catalog, dashboard, reload } = usePlatform()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const defaults: Record<string, unknown> = {
    opensAt: "16:00",
    closesAt: "20:00",
    title: "",
    description: "",
    city: dashboard?.user.city || "",
    medium: taxonomy.medium[0],
    image: "/images/artwork-gallery-wall.png",
    kind: type === "galleries" ? taxonomy.gallery[0] : taxonomy.event[0],
    galleryId: catalog.galleries[0]?.id || "",
    admission: "free",
    capacity: 30,
    price: 0,
    refundHours: 24,
    stock: 1,
    availability: "display",
    artistName: dashboard?.user.name || "",
    style: taxonomy.style[0],
    ...item,
  }
  const numeric = [
    "latitude",
    "longitude",
    "capacity",
    "price",
    "refundHours",
    "stock",
  ]
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    setError("")
    try {
      const form = new FormData(e.currentTarget)
      const values: Record<string, unknown> = Object.fromEntries(form.entries())
      if (type === "galleries")
        values.closedDays = form.getAll("closedDays").map(Number)
      for (const name of numeric)
        if (name in values) {
          if (values[name] === "" && ["latitude", "longitude"].includes(name))
            delete values[name]
          else values[name] = Number(values[name])
        }
      for (const name of ["startsAt", "endsAt"])
        if (values[name])
          values[name] = new Date(String(values[name])).toISOString()
      await api("entity", { type, id: item?.id, data: values })
      await reload()
      onDone()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const options = (name: string): [string, string][] | undefined =>
    name === "medium"
      ? taxonomy.medium.map((v) => [v, v])
      : name === "style"
        ? taxonomy.style.map((v) => [v, v])
        : name === "kind"
          ? (type === "galleries" ? taxonomy.gallery : taxonomy.event).map(
              (v) => [v, v]
            )
          : name === "admission"
            ? Object.entries(taxonomy.admission)
            : name === "availability"
              ? [
                  ["display", "صرفاً نمایشی"],
                  ["inquiry", "قیمت با استعلام"],
                  ["sale", "قابل فروش"],
                ]
              : name === "galleryId"
                ? [
                    ...(type === "artworks"
                      ? [["", "بدون گالری"] as [string, string]]
                      : []),
                    ...catalog.galleries
                      .filter(
                        (g) =>
                          type !== "artworks" ||
                          g.ownerId === dashboard?.user.id ||
                          dashboard?.user.role === "admin"
                      )
                      .map((g) => [g.id, g.title] as [string, string]),
                  ]
                : undefined
  return (
    <form className="pt-panel pt-form" onSubmit={submit}>
      <h2>
        {item ? "ویرایش" : "ثبت"}{" "}
        {type === "galleries" ? "گالری" : type === "events" ? "رویداد" : "اثر"}
      </h2>
      <p className="pt-micro">
        محتوا بعد از بررسی مدیر منتشر می‌شود. برای چند سانس، هر سانس را با زمان
        و ظرفیت مستقل ثبت کنید. زمان‌ها مطابق منطقه زمانی دستگاه شما هستند.
      </p>
      <label className="pt-field">
        بارگذاری تصویر از دستگاه (حداکثر ۵ مگابایت)
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            setBusy(true)
            setError("")
            try {
              const response = await fetch("/api/media", {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
              })
              const result = await response.json()
              if (!response.ok) throw new Error(result.error)
              if (imageInput.current) imageInput.current.value = result.url
            } catch (error) {
              setError((error as Error).message)
            } finally {
              setBusy(false)
            }
          }}
        />
      </label>
      <div className="pt-form-grid">
        {fields[type].map((name) => {
          const opts = options(name)
          let value = String(defaults[name] ?? "")
          if (["startsAt", "endsAt"].includes(name) && value) {
            const d = new Date(value)
            value = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16)
          }
          return (
            <label
              key={name}
              className={`pt-field ${["description", "image"].includes(name) ? "wide" : ""}`}
            >
              {labels[name]}
              {opts ? (
                <select
                  name={name}
                  defaultValue={value}
                  required={!(name === "galleryId" && type === "artworks")}
                >
                  {opts.map(([v, l]) => (
                    <option value={v} key={v}>
                      {l}
                    </option>
                  ))}
                </select>
              ) : name === "description" ? (
                <textarea
                  name={name}
                  defaultValue={value}
                  required
                  minLength={10}
                  maxLength={6000}
                />
              ) : (
                <input
                  ref={name === "image" ? imageInput : undefined}
                  name={name}
                  defaultValue={value}
                  type={
                    ["opensAt", "closesAt"].includes(name)
                      ? "time"
                      : numeric.includes(name)
                        ? "number"
                        : ["startsAt", "endsAt"].includes(name)
                          ? "datetime-local"
                          : "text"
                  }
                  step={
                    ["latitude", "longitude"].includes(name) ? "any" : undefined
                  }
                  required={!["latitude", "longitude"].includes(name)}
                  maxLength={name === "image" ? 1500 : 300}
                />
              )}
            </label>
          )
        })}
        {type === "galleries" && (
          <fieldset className="wide">
            <legend>روزهای تعطیل هفتگی</legend>
            <div className="pt-checks">
              {[
                ["6", "شنبه"],
                ["0", "یکشنبه"],
                ["1", "دوشنبه"],
                ["2", "سه‌شنبه"],
                ["3", "چهارشنبه"],
                ["4", "پنجشنبه"],
                ["5", "جمعه"],
              ].map(([v, l]) => (
                <label key={v}>
                  <input
                    type="checkbox"
                    name="closedDays"
                    value={v}
                    defaultChecked={
                      !!(
                        item &&
                        "closedDays" in item &&
                        item.closedDays?.includes(Number(v))
                      )
                    }
                  />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <label className="pt-field">
          وضعیت
          <select name="status" defaultValue="pending">
            <option value="pending">ارسال برای بررسی</option>
            <option value="draft">ذخیره پیش‌نویس</option>
          </select>
        </label>
      </div>
      {error && (
        <div role="alert" className="pt-error">
          {error}
        </div>
      )}
      <div className="pt-actions">
        <button className="pt-button" disabled={busy}>
          {busy ? "در حال ذخیره…" : "ذخیره"}
        </button>
        <button
          type="button"
          className="pt-button pt-button-ghost"
          onClick={onDone}
        >
          بستن فرم
        </button>
      </div>
    </form>
  )
}
export function CampaignForm({ onDone }: { onDone: () => void }) {
  const { dashboard, reload } = usePlatform()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  return (
    <form
      className="pt-panel pt-form"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError("")
        const f = new FormData(e.currentTarget)
        try {
          await api("campaign", {
            title: f.get("title"),
            code: f.get("code"),
            eventId: f.get("eventId"),
            percent: Number(f.get("percent")),
            limit: Number(f.get("limit")),
            endsAt: new Date(String(f.get("endsAt"))).toISOString(),
          })
          await reload()
          onDone()
        } catch (e) {
          setError((e as Error).message)
        } finally {
          setBusy(false)
        }
      }}
    >
      <h2>کمپین تازه</h2>
      <div className="pt-form-grid">
        <label className="pt-field">
          عنوان کمپین
          <input name="title" required minLength={2} />
        </label>
        <label className="pt-field">
          کد اختصاصی
          <input
            name="code"
            required
            pattern="[A-Za-z0-9_-]{3,30}"
            placeholder="ARTWEEK"
          />
        </label>
        <label className="pt-field">
          رویداد
          <select name="eventId" required>
            {dashboard?.events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </label>
        <label className="pt-field">
          درصد تخفیف
          <input
            name="percent"
            type="number"
            min={0}
            max={90}
            defaultValue={10}
          />
        </label>
        <label className="pt-field">
          تعداد استفاده مجاز
          <input
            name="limit"
            type="number"
            min={1}
            max={100000}
            defaultValue={50}
          />
        </label>
        <label className="pt-field">
          پایان کمپین
          <input name="endsAt" type="datetime-local" required />
        </label>
      </div>
      {error && (
        <p role="alert" className="pt-error">
          {error}
        </p>
      )}
      <button className="pt-button" disabled={busy}>
        {busy ? "در حال ثبت…" : "ساخت کمپین"}
      </button>
    </form>
  )
}
