export const roles = {
  enthusiast: "هنردوست",
  collector: "خریدار و مجموعه‌دار",
  artist: "هنرمند",
  gallery: "گالری‌دار",
  organizer: "برگزارکننده",
  curator: "کیوریتور",
  admin: "مدیر پلتفرم",
} as const
export type Role = keyof typeof roles
export const taxonomy = {
  gallery: [
    "گالری خصوصی",
    "فضای مستقل",
    "بنیاد هنری",
    "موزه هنری",
    "خانه‌موزه",
    "نگارخانه فرهنگی",
    "گالری دانشگاهی",
    "خانه‌گالری",
    "کافه‌گالری",
    "آرت‌شاپ",
    "پاپ‌آپ",
  ],
  medium: [
    "نقاشی",
    "طراحی",
    "عکاسی",
    "مجسمه",
    "چاپ دستی",
    "خوشنویسی",
    "نقاشی‌خط",
    "نگارگری",
    "تذهیب",
    "تصویرسازی",
    "سرامیک",
    "هنر الیاف",
    "هنر دیجیتال",
    "ویدئوآرت",
    "چیدمان",
    "هنر صدا",
  ],
  style: [
    "واقع‌گرا",
    "انتزاعی",
    "سوررئال",
    "اکسپرسیونیستی",
    "مینیمال",
    "مفهومی",
    "سقاخانه",
    "سنتی",
    "معاصر",
  ],
  event: [
    "نمایشگاه انفرادی",
    "نمایشگاه گروهی",
    "افتتاحیه",
    "تور گالری‌گردی",
    "ورکشاپ",
    "نشست با هنرمند",
    "پرفورمنس",
    "فراخوان",
    "نمایش فیلم هنری",
  ],
  admission: { open: "بازدید آزاد", free: "رزرو رایگان", paid: "بلیت پولی" },
  status: {
    draft: "پیش‌نویس",
    pending: "در انتظار بررسی",
    published: "منتشرشده",
    rejected: "نیازمند اصلاح",
    cancelled: "لغوشده",
  },
} as const
export type Status = keyof typeof taxonomy.status
export type EntityType = "galleries" | "events" | "artworks"
export type User = {
  id: string
  name: string
  email: string
  role: Role
  bio: string
  city: string
  disciplines: string[]
  marketingConsent: boolean
  password?: string
  createdAt: string
}
export type Entity = {
  id: string
  ownerId: string
  title: string
  description: string
  image: string
  city: string
  medium: string
  status: Status
  createdAt: string
  reviewNote?: string
  demo?: boolean
}
export type Gallery = Entity & {
  opensAt?: string
  closesAt?: string
  closedDays?: number[]
  kind: string
  address: string
  hours: string
  accessibility: string
  latitude?: number
  longitude?: number
}
export type Event = Entity & {
  kind: string
  galleryId: string
  admission: "open" | "free" | "paid"
  startsAt: string
  endsAt: string
  capacity: number
  price: number
  refundHours: number
}
export type Artwork = Entity & {
  artistName: string
  style: string
  technique: string
  dimensions: string
  year: string
  price: number
  stock: number
  availability: "sale" | "inquiry" | "display"
  galleryId: string
}
export type Order = {
  delivery?: {
    recipient: string
    phone: string
    address: string
    postalCode: string
  }
  fulfillment?: "processing" | "shipped" | "delivered"
  trackingCode?: string
  id: string
  userId: string
  resourceId: string
  ownerId: string
  kind: "event" | "artwork"
  quantity: number
  total: number
  status:
    "pending" | "confirmed" | "cancelled" | "refund_requested" | "refunded"
  createdAt: string
  expiresAt: string
  token: string
  checkedIn: boolean
  idempotencyKey: string
  paymentReference?: string
  campaignId?: string
}
export type Campaign = {
  id: string
  ownerId: string
  title: string
  code: string
  percent: number
  limit: number
  eventId: string
  endsAt: string
  createdAt: string
}
export type RequestItem = {
  id: string
  userId: string
  ownerId: string
  resourceId: string
  kind: "inquiry" | "submission" | "commission" | "support"
  message: string
  reply: string
  status: "open" | "answered" | "closed"
  createdAt: string
}
export type Membership = {
  id: string
  ownerId: string
  eventId: string
  userId: string
}
export type State = {
  memberships: Membership[]
  users: User[]
  galleries: Gallery[]
  events: Event[]
  artworks: Artwork[]
  orders: Order[]
  campaigns: Campaign[]
  requests: RequestItem[]
  sessions: { hash: string; userId: string; expiresAt: string }[]
  saves: {
    userId: string
    targetId: string
    kind: "save" | "follow" | "trip"
  }[]
  visits: { campaignId: string; visitorHash: string; day: string }[]
  audit: { actorId: string; action: string; targetId: string; at: string }[]
}
export type Catalog = {
  galleries: Gallery[]
  events: Event[]
  artworks: Artwork[]
  artists: User[]
  demo: boolean
}
export const number = (value: number) =>
  new Intl.NumberFormat("fa-IR").format(value)
export const money = (value: number) =>
  value === 0 ? "رایگان" : `${number(value)} تومان`
export const date = (value: string) =>
  new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  }).format(new Date(value))

export function galleryOpen(gallery: Gallery, at: number): boolean | null {
  if (!gallery.opensAt || !gallery.closesAt) return null
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at)
  const get = (type: string) => parts.find((p) => p.type === type)?.value || ""
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    get("weekday")
  )
  const time = `${get("hour")}:${get("minute")}`
  const overnight = gallery.closesAt < gallery.opensAt
  const openingDay = overnight && time < gallery.closesAt ? (day + 6) % 7 : day
  if (gallery.closedDays?.includes(openingDay)) return false
  return overnight
    ? time >= gallery.opensAt || time < gallery.closesAt
    : time >= gallery.opensAt && time < gallery.closesAt
}
