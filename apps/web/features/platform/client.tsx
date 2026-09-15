"use client"
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowUpLeft, Menu, X } from "lucide-react"
import type {
  Catalog,
  User,
  Order,
  RequestItem,
  Campaign,
  State,
} from "./types"
export type Dashboard = {
  memberships: State["memberships"]
  user: User
  galleries: Catalog["galleries"]
  events: Catalog["events"]
  artworks: Catalog["artworks"]
  orders: Order[]
  requests: RequestItem[]
  campaigns: (Campaign & { visits: number; conversions: number })[]
  saves: State["saves"]
  audit: State["audit"]
  users: User[]
}
export async function api<T = unknown>(
  path: string,
  data?: unknown
): Promise<T> {
  const response = await fetch(
    `/api/platform/${path}`,
    data === undefined
      ? { cache: "no-store" }
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
  )
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || "درخواست انجام نشد.")
  return result
}
const Context = createContext<{
  catalog: Catalog
  dashboard: Dashboard | null
  loading: boolean
  error: string
  reload: () => Promise<void>
  notify: (text: string) => void
}>({
  catalog: {
    events: [],
    galleries: [],
    artworks: [],
    artists: [],
    demo: false,
  },
  dashboard: null,
  loading: true,
  error: "",
  reload: async () => {},
  notify: () => {},
})
export const usePlatform = () => useContext(Context)
export function PlatformProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog>({
    events: [],
    galleries: [],
    artworks: [],
    artists: [],
    demo: false,
  })
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const reload = useCallback(async () => {
    try {
      setCatalog(await api<Catalog>("catalog"))
      setError("")
    } catch (e) {
      setError((e as Error).message)
    }
    try {
      setDashboard(await api<Dashboard>("dashboard"))
    } catch {
      setDashboard(null)
    }
    setLoading(false)
  }, [])
  useEffect(() => {
    let active = true
    void Promise.allSettled([
      api<Catalog>("catalog"),
      api<Dashboard>("dashboard"),
    ]).then(([publicData, privateData]) => {
      if (!active) return
      if (publicData.status === "fulfilled") setCatalog(publicData.value)
      else
        setError(
          publicData.reason instanceof Error
            ? publicData.reason.message
            : "دریافت اطلاعات ناموفق بود"
        )
      setDashboard(
        privateData.status === "fulfilled" ? privateData.value : null
      )
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 5000)
      return () => clearTimeout(timer)
    }
  }, [toast])
  const links = [
    ["/explore", "کشف هنر"],
    ["/events", "رویدادها"],
    ["/galleries", "گالری‌ها"],
    ["/artists", "هنرمندان"],
    ["/collection", "آثار"],
    ["/gallery/demo", "بازدید مجازی"],
  ]
  return (
    <Context.Provider
      value={{ catalog, dashboard, loading, error, reload, notify: setToast }}
    >
      <div className="pt-app" dir="rtl">
        <a className="pt-skip" href="#main-content">
          رفتن به محتوا
        </a>
        <header className="pt-header">
          <Link href="/" className="pt-brand">
            پالتو<span>هنر، نزدیک‌تر.</span>
          </Link>
          <nav className={open ? "is-open" : ""} aria-label="ناوبری اصلی">
            {links.map(([url, label]) => (
              <Link
                key={url}
                href={url!}
                aria-current={pathname === url ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="pt-header-actions">
            <Link
              className="pt-button pt-button-small"
              href={dashboard ? "/account" : "/login"}
            >
              {dashboard ? dashboard.user.name : "ورود / عضویت"}
              <ArrowUpLeft size={16} />
            </Link>
            <button
              className="pt-menu pt-icon-button"
              aria-label={open ? "بستن منو" : "باز کردن منو"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </header>
        {catalog.demo && (
          <div className="pt-demo">
            محیط آزمایشی · مکان‌ها و رویدادهای نمونه قابل مراجعه یا پرداخت واقعی
            نیستند.
          </div>
        )}
        {error && (
          <div role="alert" className="pt-alert">
            {error} <button onClick={() => void reload()}>تلاش دوباره</button>
          </div>
        )}
        {children}
        <footer className="pt-footer">
          <Link href="/">پالتو</Link>
          <p>از تماشای یک اثر، تا بخشی از جهان هنر بودن.</p>
          <nav>
            <Link href="/studio">فضای کاری حرفه‌ای</Link>
            <Link href="/curatorial">مجله هنر</Link>
            <Link href="/design-system">راهنمای طراحی</Link>
            <Link href="/data-privacy">حریم خصوصی</Link>
            <Link href="/terms-of-use">شرایط استفاده</Link>
          </nav>
        </footer>
        {toast && (
          <div role="status" className="pt-toast">
            {toast}
          </div>
        )}
      </div>
    </Context.Provider>
  )
}
export function Empty({
  title = "هنوز چیزی اینجا نیست",
  children,
}: {
  title?: string
  children?: ReactNode
}) {
  return (
    <div className="pt-empty">
      <span aria-hidden="true">+</span>
      <h2>{title}</h2>
      <p>{children || "با تغییر فیلترها یا افزودن اولین مورد شروع کنید."}</p>
    </div>
  )
}
export function Loading() {
  return (
    <div className="pt-loading" role="status">
      در حال آماده‌سازی پالتو…
    </div>
  )
}
export function SaveButton({
  id,
  kind = "save",
}: {
  id: string
  kind?: "save" | "follow" | "trip"
}) {
  const { dashboard, reload, notify } = usePlatform()
  const [busy, setBusy] = useState(false)
  const saved = dashboard?.saves.some(
    (s) => s.targetId === id && s.kind === kind
  )
  return (
    <button
      className="pt-button pt-button-ghost"
      aria-pressed={!!saved}
      disabled={busy}
      onClick={async () => {
        if (!dashboard) {
          notify("برای ذخیره و دنبال‌کردن وارد حساب شوید.")
          return
        }
        setBusy(true)
        try {
          await api("save", { targetId: id, kind })
          await reload()
        } catch (e) {
          notify((e as Error).message)
        } finally {
          setBusy(false)
        }
      }}
    >
      {saved
        ? "✓ افزوده شده"
        : kind === "trip"
          ? "افزودن به برنامه بازدید"
          : kind === "follow"
            ? "دنبال‌کردن"
            : "ذخیره اثر"}
    </button>
  )
}
