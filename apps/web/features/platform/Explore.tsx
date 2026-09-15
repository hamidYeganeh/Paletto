"use client"
/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import { useState, useEffect } from "react"
import { ArrowUpLeft, MapPin, CalendarDays } from "lucide-react"
import { usePlatform, Loading, Empty } from "./client"
import {
  galleryOpen,
  date,
  money,
  taxonomy,
  type Event,
  type Gallery,
  type Artwork,
  type User,
} from "./types"
export type View = "explore" | "events" | "galleries" | "artists" | "collection"
const titles = {
  explore: "هنر، در جریان زندگی.",
  events: "قرار بعدی با هنر.",
  galleries: "فضاهایی برای دیدن.",
  artists: "آدم‌های پشت آثار.",
  collection: "اثری که با تو می‌ماند.",
}
export function ArtCard({
  item,
  type,
}: {
  item: Event | Gallery | Artwork
  type: "events" | "galleries" | "collection"
}) {
  return (
    <article className="pt-card">
      <Link href={`/${type}/${item.id}`}>
        <img
          className="pt-card-image"
          src={item.image}
          alt={item.title}
          loading="lazy"
        />
        <div className="pt-card-meta">
          <span>{"kind" in item ? item.kind : item.medium}</span>
          <span>
            <MapPin size={12} style={{ display: "inline" }} /> {item.city}
          </span>
        </div>
        <h3>{item.title}</h3>
        {"startsAt" in item && (
          <p>
            <CalendarDays size={13} style={{ display: "inline" }} />{" "}
            {date(item.startsAt)}
          </p>
        )}
        {"artistName" in item && (
          <p>
            {item.artistName} · {item.technique}
          </p>
        )}
        <div className="pt-card-bottom">
          <span>
            {"admission" in item
              ? taxonomy.admission[item.admission]
              : "price" in item
                ? item.availability === "sale"
                  ? money(item.price)
                  : "نمایش و آشنایی با اثر"
                : item.hours}
          </span>
          <ArrowUpLeft size={18} />
        </div>
      </Link>
    </article>
  )
}
function ArtistCard({ artist }: { artist: User }) {
  return (
    <article className="pt-card">
      <Link href={`/artists/${artist.id}`}>
        <div className="pt-artist-avatar" aria-hidden="true">
          {artist.name.slice(0, 1)}
        </div>
        <div className="pt-card-meta">
          <span>{artist.disciplines.join("، ") || "هنرمند پالتو"}</span>
          <span>{artist.city}</span>
        </div>
        <h3>{artist.name}</h3>
        <p>
          {artist.bio.slice(0, 120) ||
            "آثار و مسیر هنری را در صفحه هنرمند ببینید."}
        </p>
      </Link>
    </article>
  )
}
export function Explore({ view = "explore" }: { view?: View }) {
  const { catalog, loading } = usePlatform()
  const [openOnly, setOpenOnly] = useState(false)
  const [clock, setClock] = useState(() => Date.now())
  const [query, setQuery] = useState("")
  const [city, setCity] = useState("")
  const [medium, setMedium] = useState("")
  const [kind, setKind] = useState("")
  const [admission, setAdmission] = useState("")
  const [when, setWhen] = useState("")
  const [position, setPosition] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [geoError, setGeoError] = useState("")
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])
  if (loading) return <Loading />
  const all = [...catalog.galleries, ...catalog.events, ...catalog.artworks]
  const cities = [...new Set(all.map((x) => x.city))]
  const normalized = (s: string) =>
    s.replaceAll("ي", "ی").replaceAll("ك", "ک").toLowerCase()
  const match = (x: Event | Gallery | Artwork) =>
    (!query ||
      normalized(
        `${x.title} ${x.description} ${"artistName" in x ? x.artistName : ""}`
      ).includes(normalized(query))) &&
    (!city || x.city === city) &&
    (!medium || x.medium === medium) &&
    (!kind || ("kind" in x && x.kind === kind))
  const events = catalog.events.filter(
    (e) =>
      match(e) &&
      (!admission || e.admission === admission) &&
      (!when ||
        (new Date(e.startsAt).getTime() >= clock &&
          new Date(e.startsAt).getTime() <=
            clock + (when === "week" ? 7 : 1) * 86400000))
  )
  const distance = (g: Gallery) =>
    !position || g.latitude === undefined || g.longitude === undefined
      ? Infinity
      : Math.hypot(
          g.latitude - position.latitude,
          (g.longitude - position.longitude) *
            Math.cos((position.latitude * Math.PI) / 180)
        )
  const galleries = catalog.galleries
    .filter((g) => match(g) && (!openOnly || galleryOpen(g, clock) === true))
    .sort((a, b) => (position ? distance(a) - distance(b) : 0))
  const works = catalog.artworks.filter(match)
  const artists = catalog.artists.filter(
    (a) =>
      (!query || normalized(a.name).includes(normalized(query))) &&
      (!city || a.city === city) &&
      (!medium || a.disciplines.includes(medium))
  )
  const count =
    view === "galleries"
      ? galleries.length
      : view === "collection"
        ? works.length
        : view === "artists"
          ? artists.length
          : events.length
  return (
    <main id="main-content" className="pt-main">
      {view === "explore" ? (
        <section className="pt-hero">
          <div>
            <span className="pt-kicker">جهان هنر پالتو</span>
            <h1>
              از دیدن،
              <br />
              تا نزدیک شدن.
            </h1>
            <p>
              نمایشگاه بعدی‌ات را پیدا کن، با هنرمند آشنا شو و برای یک تجربه
              تازه جا باز کن.
            </p>
            <div className="pt-actions">
              <Link className="pt-button" href="/events">
                کشف رویدادها <ArrowUpLeft size={18} />
              </Link>
              <Link className="pt-button pt-button-ghost" href="/gallery/demo">
                قدم‌زدن در گالری
              </Link>
            </div>
          </div>
          <div>
            <img
              className="pt-hero-image"
              src="/images/artwork-gallery-industrial-v2.png"
              alt="نمای سالن نمایش آثار در پالتو"
            />
            <div className="pt-hero-caption">
              <span>پیش از رفتن، فضا را ببین.</span>
              <Link href="/galleries">گالری‌های پالتو ↖</Link>
            </div>
          </div>
        </section>
      ) : (
        <div className="pt-page-heading">
          <span className="pt-kicker">
            پالتو /{" "}
            {view === "events"
              ? "تقویم هنر"
              : view === "galleries"
                ? "گالری‌گردی"
                : view === "artists"
                  ? "جامعه هنری"
                  : "مجموعه آثار"}
          </span>
          <h1>{titles[view]}</h1>
          <p>
            انتخاب‌های خودت را پیدا کن؛ بر اساس شهر، رشته و آنچه دوست داری
            ببینی.
          </p>
        </div>
      )}
      <div className="pt-filters">
        <label className="pt-field">
          جست‌وجو
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="نام، هنرمند یا موضوع…"
            type="search"
          />
        </label>
        <label className="pt-field">
          شهر
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">همه شهرها</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="pt-field">
          رشته هنری
          <select value={medium} onChange={(e) => setMedium(e.target.value)}>
            <option value="">همه رشته‌ها</option>
            {taxonomy.medium.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        {view === "events" || view === "explore" ? (
          <label className="pt-field">
            نوع برنامه
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">همه برنامه‌ها</option>
              {taxonomy.event.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
        ) : view === "galleries" ? (
          <label className="pt-field">
            نوع فضا
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">همه فضاها</option>
              {taxonomy.gallery.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
        ) : (
          <button
            className="pt-button pt-button-ghost"
            onClick={() => {
              setQuery("")
              setCity("")
              setMedium("")
            }}
          >
            پاک‌کردن فیلترها
          </button>
        )}
      </div>
      {(view === "events" || view === "explore") && (
        <div className="pt-actions" style={{ marginBottom: 24 }}>
          <div className="pt-tabs" aria-label="شیوه ورود">
            {[["", "همه"], ...Object.entries(taxonomy.admission)].map(
              ([v, l]) => (
                <button
                  key={v}
                  aria-pressed={admission === v}
                  onClick={() => setAdmission(v!)}
                >
                  {l}
                </button>
              )
            )}
          </div>
          <div className="pt-tabs">
            {[
              ["", "همه تاریخ‌ها"],
              ["today", "۲۴ ساعت آینده"],
              ["week", "هفت روز آینده"],
            ].map(([v, l]) => (
              <button
                key={v}
                aria-pressed={when === v}
                onClick={() => setWhen(v!)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}
      {view === "galleries" && (
        <div className="pt-actions" style={{ marginBottom: 24 }}>
          <button
            className="pt-button pt-button-ghost"
            onClick={() => {
              if (!navigator.geolocation) {
                setGeoError("مکان‌یابی پشتیبانی نمی‌شود.")
                return
              }
              navigator.geolocation.getCurrentPosition(
                (p) => {
                  setPosition(p.coords)
                  setGeoError("")
                },
                () =>
                  setGeoError("دسترسی به مکان ممکن نشد؛ شهر را انتخاب کنید.")
              )
            }}
          >
            {position ? "مرتب‌شده بر اساس نزدیکی" : "گالری‌های نزدیک من"}
          </button>
          <button
            className="pt-button pt-button-ghost"
            aria-pressed={openOnly}
            onClick={() => setOpenOnly(!openOnly)}
          >
            {openOnly ? "✓ اکنون باز است" : "اکنون باز است"}
          </button>
          <span role="status" className="pt-micro">
            {geoError}
          </span>
        </div>
      )}
      <div className="pt-section-title">
        <h2>
          {view === "explore"
            ? "در تقویم هنر"
            : `${new Intl.NumberFormat("fa-IR").format(count)} انتخاب`}
        </h2>
        {view === "explore" && <Link href="/events">همه رویدادها</Link>}
      </div>
      {count === 0 ? (
        <Empty title="نتیجه‌ای پیدا نشد">
          فیلترها را تغییر بدهید. اگر هنرمند یا برگزارکننده هستید، اولین محتوای
          خود را در فضای کاری ثبت کنید.
        </Empty>
      ) : (
        <div className="pt-grid">
          {view === "galleries"
            ? galleries.map((item) => (
                <ArtCard key={item.id} item={item} type="galleries" />
              ))
            : view === "collection"
              ? works.map((item) => (
                  <ArtCard key={item.id} item={item} type="collection" />
                ))
              : view === "artists"
                ? artists.map((artist) => (
                    <ArtistCard key={artist.id} artist={artist} />
                  ))
                : events.map((item) => (
                    <ArtCard key={item.id} item={item} type="events" />
                  ))}
        </div>
      )}
      {view === "explore" && (
        <>
          <section className="pt-section">
            <div className="pt-section-title">
              <h2>یک فضا، هزار نگاه</h2>
              <Link href="/galleries">همه گالری‌ها</Link>
            </div>
            <div className="pt-grid">
              {catalog.galleries.slice(0, 3).map((item) => (
                <ArtCard key={item.id} item={item} type="galleries" />
              ))}
            </div>
          </section>
          <section className="pt-section">
            <div className="pt-section-title">
              <h2>جای تو در پالتو</h2>
            </div>
            <p>
              نمونه‌کار بساز، نمایشگاه برگزار کن، فراخوان منتشر کن یا مخاطبان
              تازه‌ای برای هنرت پیدا کن.
            </p>
            <Link href="/studio" className="pt-button">
              ورود به فضای کاری <ArrowUpLeft size={18} />
            </Link>
          </section>
        </>
      )}
    </main>
  )
}
