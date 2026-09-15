import type { State, Event, Gallery, Artwork } from "@/features/platform/types"
export function seed(): State {
  const now = new Date().toISOString()
  const base = {
    ownerId: "demo-curator",
    status: "published" as const,
    createdAt: now,
    demo: true,
    medium: "نقاشی",
  }
  const galleries: Gallery[] = [
    {
      ...base,
      id: "demo-white",
      title: "سالن سپید پالتو",
      description:
        "فضای نمونه برای تجربه محصول؛ این مکان گالری واقعی یا شریک تجاری پالتو نیست.",
      image: "/images/artwork-gallery-wall.png",
      city: "تهران",
      kind: "گالری خصوصی",
      opensAt: "16:00",
      closesAt: "20:00",
      closedDays: [6],
      address: "نشانی نمونه؛ قابل مراجعه نیست",
      hours: "۱۶ تا ۲۰",
      accessibility: "مسیر بدون پله در نمونه",
      latitude: 35.715,
      longitude: 51.405,
    },
    {
      ...base,
      id: "demo-courtyard",
      title: "خانه هنر و حیاط",
      description: "نمونه یک خانه‌گالری با نمایش آثار و برنامه‌های گفتگو.",
      image: "/images/museum-quiet-garden.png",
      city: "اصفهان",
      kind: "خانه‌گالری",
      address: "نشانی نمونه؛ قابل مراجعه نیست",
      hours: "۱۰ تا ۱۸",
      accessibility: "نیازمند هماهنگی",
    },
    {
      ...base,
      id: "demo-industrial",
      title: "فضای هنر معاصر",
      description: "نمونه سالن صنعتی برای چیدمان و هنرهای چندرسانه‌ای.",
      image: "/images/artwork-gallery-industrial-v2.png",
      city: "شیراز",
      kind: "فضای مستقل",
      address: "نشانی نمونه؛ قابل مراجعه نیست",
      hours: "۱۵ تا ۲۱",
      accessibility: "ورودی هم‌سطح",
    },
  ]
  const events: Event[] = ["نمایشگاه گروهی", "ورکشاپ", "نشست با هنرمند"].map(
    (kind, i) => ({
      ...base,
      id: `demo-event-${i}`,
      title: ["میان رنگ و سکوت", "دیدن را تمرین کنیم", "گفتگو در امتداد اثر"][
        i
      ]!,
      description:
        "این رویداد نمونه است و رزرو آن صرفاً برای آزمایش مسیر کاربری انجام می‌شود. برای رویداد واقعی، برگزارکننده باید اطلاعات را ثبت و مدیر تأیید کند.",
      image: galleries[i]!.image,
      city: galleries[i]!.city,
      kind,
      galleryId: galleries[i]!.id,
      admission: i === 1 ? "paid" : "free",
      startsAt: new Date(Date.now() + (i + 7) * 86400000).toISOString(),
      endsAt: new Date(Date.now() + (i + 7) * 86400000 + 7200000).toISOString(),
      capacity: 25,
      price: i === 1 ? 180000 : 0,
      refundHours: 24,
    })
  )
  const artworks: Artwork[] = [
    {
      ...base,
      id: "demo-art-1",
      title: "وقفه آبی",
      description:
        "تصویر نمونه از مجموعه نمایشی پالتو؛ برای فروش واقعی عرضه نشده است.",
      image: "/images/museum-azure-interruption.png",
      city: "تهران",
      artistName: "مجموعه نمایشی پالتو",
      style: "انتزاعی",
      technique: "تصویر دیجیتال",
      dimensions: "۷۰ × ۱۰۰ سانتی‌متر",
      year: "۱۴۰۵",
      price: 0,
      stock: 1,
      availability: "display",
      galleryId: galleries[0]!.id,
    },
    {
      ...base,
      id: "demo-art-2",
      title: "حافظه معماری",
      description: "اثر نمونه برای بررسی چیدمان و مشاهده ابعاد در گالری مجازی.",
      image: "/images/museum-architectures-memory.png",
      city: "شیراز",
      artistName: "مجموعه نمایشی پالتو",
      style: "معاصر",
      technique: "تصویر دیجیتال",
      dimensions: "۸۰ × ۱۲۰ سانتی‌متر",
      year: "۱۴۰۵",
      price: 0,
      stock: 1,
      availability: "display",
      galleryId: galleries[2]!.id,
    },
  ]
  return {
    memberships: [],
    users: [],
    galleries,
    events,
    artworks,
    orders: [],
    campaigns: [],
    requests: [],
    sessions: [],
    saves: [],
    visits: [],
    audit: [],
  }
}
