import { notFound } from "next/navigation"
import { ArchiveDetail } from "@/features/archive/ArchiveDetail"
import { essays } from "@/features/archive/archive-data"

export function generateStaticParams() { return essays.map(({ slug }) => ({ slug })) }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const item = essays.find((entry) => entry.slug === slug); if (!item) notFound(); return <ArchiveDetail record={{ title:item.title, image:item.image, eyebrow:"یادداشت کیوریتوری", meta:`${item.author} / ${item.date}`, intro:item.excerpt, body:["نمایشگاه تنها مجموعه‌ای از اشیا نیست. فاصله‌ها، نور، مسیر حرکت و حتی لحظه‌ای که نگاه از یک اثر جدا می‌شود، متن پنهان نمایش را می‌سازند.","در پالتو تلاش می‌کنیم این متن پنهان خوانا باشد، بی‌آن‌که پاسخ را از پیش تعیین کند. مخاطب باید بتواند مکث کند، بازگردد و روایت خودش را بسازد."], backHref:"/curatorial", backLabel:"همه یادداشت‌ها" }} /> }
