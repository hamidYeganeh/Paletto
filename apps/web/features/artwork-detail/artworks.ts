export type Artwork = {
  id: string
  title: string
  titleLines: string[]
  artist: string
  movement: string
  year: string
  height: string
  width: string
  image: string
  position: string
  description: string
}

export const artworks: Artwork[] = [
  {
    id: "school-of-athens",
    title: "مکتب آتن",
    titleLines: ["مکتب", "آتن"],
    artist: "رافائل",
    movement: "رنسانس عالی ایتالیا",
    year: "1511",
    height: "500",
    width: "770",
    image: "/images/museum-school-of-athens.jpg",
    position: "center 46%",
    description:
      "رافائل اندیشمندان بزرگ جهان باستان را در تالاری آرمانی گرد هم آورده است؛ افلاطون و ارسطو در مرکز این روایت ایستاده‌اند.",
  },
  {
    id: "death-of-socrates",
    title: "مرگ سقراط",
    titleLines: ["مرگ", "سقراط"],
    artist: "ژاک-لویی داوید",
    movement: "نئوکلاسیسیسم فرانسه",
    year: "1787",
    height: "130",
    width: "196",
    image: "/images/museum-death-of-socrates.jpg",
    position: "center center",
    description:
      "سقراط که به نوشیدن شوکران محکوم شده، آرام دستش را به سوی جام دراز می‌کند و در آخرین لحظه نیز به شاگردانش می‌آموزد.",
  },
  {
    id: "azure-interruption",
    title: "گسست لاجوردی",
    titleLines: ["گسست", "لاجوردی"],
    artist: "استودیوی پالتو",
    movement: "بیان انتزاعی",
    year: "2024",
    height: "180",
    width: "180",
    image: "/images/museum-azure-interruption.png",
    position: "center center",
    description:
      "میدانی لاجوردی با حرکتی نارنجی شکافته می‌شود؛ تعادلی میان سکون تصویر و ضربه‌ای ناگهانی از حرکت.",
  },
  {
    id: "quiet-garden",
    title: "باغ خاموش",
    titleLines: ["باغ", "خاموش"],
    artist: "مجموعه پالتو",
    movement: "فیگوراتیو معاصر",
    year: "2025",
    height: "161",
    width: "160",
    image: "/images/museum-quiet-garden.png",
    position: "center center",
    description:
      "پیکری تنها در کنار باغی سرشار از گل، روایتی آرام و صمیمی از رنگ، سکوت و خاطره می‌سازد.",
  },
  {
    id: "architectures-of-memory",
    title: "معماری خاطره",
    titleLines: ["معماری", "خاطره"],
    artist: "استودیوی پالتو",
    movement: "هندسه مدرن",
    year: "2026",
    height: "180",
    width: "180",
    image: "/images/museum-architectures-memory.png",
    position: "center center",
    description:
      "قوس‌های لایه‌لایه و فرم‌های مدور، فضایی خیالی را به یادمانی دقیق و رؤیاگونه از مکان‌های به‌یادمانده تبدیل می‌کنند.",
  },
]
