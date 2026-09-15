import { artworks } from "@/features/artwork-detail/artworks"

export const exhibitions = artworks.map((artwork, index) => ({
  ...artwork,
  slug: artwork.id,
  category: ["نقاشی کلاسیک", "هنر مدرن", "مطالعات موزه", "مجموعه معاصر"][index % 4]!,
  date: ["۱۸—۲۴ شهریور", "۲۸ شهریور—۷ مهر", "۱۲—۱۹ مهر", "۲۵ مهر—۴ آبان", "۱۰—۲۱ آبان"][index]!,
  room: ["تالار یک", "اتاق آبی", "گالری مرکزی", "باغ نور", "تالار هندسه"][index]!,
}))

export const talents = [
  { slug: "sahar-kashani", name: "سحر کاشانی", role: "نقاش و پژوهشگر رنگ", city: "تهران", image: "/images/museum-quiet-garden.png", bio: "سحر کاشانی رابطه‌ی میان خاطره، باغ ایرانی و بدن را در نقاشی‌های لایه‌لایه‌اش دنبال می‌کند.", practice: "نقاشی، چاپ دستی و پژوهش رنگ‌دانه" },
  { slug: "arman-rad", name: "آرمان راد", role: "هنرمند چندرسانه‌ای", city: "شیراز", image: "/images/museum-azure-interruption.png", bio: "آرمان راد با نور، صدا و سطح‌های رنگی فضاهایی می‌سازد که واکنش مخاطب بخشی از اثر است.", practice: "چیدمان، ویدئو و طراحی صدا" },
  { slug: "neda-mohammadi", name: "ندا محمدی", role: "کیوریتور و نویسنده", city: "اصفهان", image: "/images/museum-architectures-memory.png", bio: "ندا محمدی بر تاریخ نمایش، معماری موزه و شیوه‌های تازه‌ی مواجهه با آرشیو تمرکز دارد.", practice: "کیوریتوری، نوشتار و طراحی نمایشگاه" },
  { slug: "pouya-davari", name: "پویا داوری", role: "مجسمه‌ساز", city: "رشت", image: "/images/artwork-gallery-industrial-v2.png", bio: "پویا داوری از فولاد، خاک و اشیای صنعتی برای ساختن حجم‌هایی درباره‌ی حافظه‌ی شهری استفاده می‌کند.", practice: "مجسمه، ماده‌پژوهی و چیدمان" },
]

export const spaces = [
  { slug: "main-gallery", name: "گالری مرکزی", code: "فضا ۰۱", area: "۸۵۰ متر مربع", image: "/images/artwork-gallery-industrial.png", description: "تالاری وسیع برای نمایش مجموعه‌های شاخص، چیدمان‌های بزرگ‌مقیاس و تجربه‌های گروهی." },
  { slug: "blue-room", name: "اتاق آبی", code: "فضا ۰۲", area: "۳۲۰ متر مربع", image: "/images/artwork-gallery-wall.png", description: "فضایی آرام و کنترل‌شده برای آثار روی کاغذ، عکس و نمایش‌های کوچک با نور دقیق." },
  { slug: "night-hall", name: "تالار شب", code: "فضا ۰۳", area: "۴۶۰ متر مربع", image: "/images/artwork-gallery-industrial-night.png", description: "محیطی تاریک برای ویدئو، هنر نور و اجراهای صوتی که نیازمند تمرکز کامل مخاطب‌اند." },
]

export const essays = [
  { slug: "the-pause-between-images", title: "مکث میان دو تصویر", author: "ندا محمدی", date: "۱۷ شهریور ۱۴۰۵", image: "/images/museum-school-of-athens.jpg", excerpt: "آیا فاصله‌ی میان آثار بخشی از تجربه‌ی دیدن است؟ یادداشتی درباره‌ی سکوت، ریتم و معماری نمایش." },
  { slug: "color-as-memory", title: "رنگ به مثابه‌ی حافظه", author: "سحر کاشانی", date: "۲۹ مرداد ۱۴۰۵", image: "/images/museum-quiet-garden.png", excerpt: "رنگ‌دانه چگونه زمان را نگه می‌دارد و چرا بعضی رنگ‌ها پیش از آن‌که دیده شوند، به یاد می‌آیند؟" },
  { slug: "museum-after-dark", title: "موزه پس از تاریکی", author: "آرمان راد", date: "۸ مرداد ۱۴۰۵", image: "/images/artwork-gallery-industrial-night.png", excerpt: "درباره‌ی نور کم، شنیدن دقیق و نمایشگاهی که تنها پس از غروب کامل می‌شود." },
]

export const faqs = [
  ["برای بازدید باید از قبل ثبت‌نام کنم؟", "برای نمایشگاه‌های عمومی نیازی به ثبت‌نام نیست. برنامه‌های محدود و گفت‌وگوها رزرو جداگانه دارند."],
  ["امکان بازدید گروهی وجود دارد؟", "بله. گروه‌های بیشتر از هشت نفر می‌توانند دست‌کم سه روز پیش از بازدید با پالتو هماهنگ کنند."],
  ["عکاسی در گالری مجاز است؟", "عکاسی بدون فلاش برای استفاده‌ی شخصی مجاز است، مگر کنار اثری که علامت محدودیت دارد."],
  ["آیا آثار برای خرید در دسترس‌اند؟", "آثاری که امکان خرید دارند در صفحه‌ی خود با وضعیت و شیوه‌ی ارتباط مشخص شده‌اند."],
] as const
