import { artworks } from "@/features/artwork-detail/artworks"

export type LightWork = {
  id: string
  title: string
  artist: string
  image: string
  description: string
  href?: string
  crop?: [number, number, number, number]
}
const reference = "/images/light-gallery/reference.png"
export const lightWorks: LightWork[] = [
  {
    id: "red-earth",
    title: "خاکِ سرخ",
    artist: "مطالعهٔ تصویری پالتو",
    image: reference,
    crop: [0.351, 0.315, 0.151, 0.296],
    description:
      "لایه‌های زرشکی و بافت خاکی؛ تابلوی مرکزی در تصویر مرجع گالری. این اثر بخشی از تصویر مفهومی تولیدشده است.",
  },
  {
    id: "chalk",
    title: "ردِ روشن",
    artist: "مطالعهٔ تصویری پالتو",
    image: reference,
    crop: [0.559, 0.367, 0.04, 0.09],
    description:
      "سطحی روشن با ردهای ظریف و فرسوده، برگرفته از تصویر مفهومی گالری.",
  },
  {
    id: "charcoal",
    title: "سکوتِ زغالی",
    artist: "مطالعهٔ تصویری پالتو",
    image: reference,
    crop: [0.559, 0.486, 0.04, 0.083],
    description: "یک مطالعهٔ تیره و بافت‌دار، برگرفته از تصویر مفهومی گالری.",
  },
  {
    id: "mineral",
    title: "حافظهٔ سنگ",
    artist: "مطالعهٔ تصویری پالتو",
    image: reference,
    crop: [0.032, 0.299, 0.095, 0.285],
    description: "بافت روشن و فرسودهٔ تابلوی دیوار چپ در تصویر مرجع گالری.",
  },
  {
    id: "sand",
    title: "ردِ شن",
    artist: "مطالعهٔ تصویری پالتو",
    image: reference,
    crop: [0.559, 0.367, 0.04, 0.09],
    description: "مطالعهٔ بافت روشن، با استفاده از جزئیات تصویر مفهومی گالری.",
  },
  ...artworks.map((a) => ({
    id: a.id,
    title: a.title,
    artist: a.artist,
    image: a.image,
    description: a.description,
    href: `/artworks/${a.id}`,
  })),
]
