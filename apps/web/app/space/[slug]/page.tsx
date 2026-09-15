import { notFound } from "next/navigation"
import { ArchiveDetail } from "@/features/archive/ArchiveDetail"
import { spaces } from "@/features/archive/archive-data"

export function generateStaticParams() { return spaces.map(({ slug }) => ({ slug })) }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const item = spaces.find((entry) => entry.slug === slug); if (!item) notFound(); return <ArchiveDetail record={{ name:item.name, image:item.image, eyebrow:item.code, meta:item.area, intro:item.description, body:["نور هر فضا بر اساس ماهیت نمایش تغییر می‌کند و مسیر حرکت آزاد می‌ماند تا هر بازدیدکننده ریتم شخصی خود را پیدا کند.","برای پیشنهاد نمایشگاه، بازدید حرفه‌ای یا رزرو فضای رویداد می‌توانید با تیم برنامه‌ریزی پالتو در تماس باشید."], backHref:"/space", backLabel:"همه فضاها" }} /> }
