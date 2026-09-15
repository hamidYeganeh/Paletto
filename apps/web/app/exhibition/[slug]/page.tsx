import { notFound } from "next/navigation"
import { ArchiveDetail } from "@/features/archive/ArchiveDetail"
import { exhibitions } from "@/features/archive/archive-data"

export function generateStaticParams() { return exhibitions.map(({ slug }) => ({ slug })) }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const item = exhibitions.find((entry) => entry.slug === slug); if (!item) notFound(); return <ArchiveDetail record={{ title:item.title, image:item.image, eyebrow:`${item.artist} / ${item.movement}`, meta:`${item.year} — ${item.height} × ${item.width} سانتی‌متر`, intro:item.description, body:[`این اثر در ${item.room} و در برنامه‌ی ${item.date} نمایش داده می‌شود. چیدمان با تأکید بر مقیاس، سطح و فاصله‌ی مناسب دید طراحی شده است.`,"نسخه‌ی دیجیتال اثر برای مطالعه ارائه شده و اطلاعات خرید یا امانت در زمان نمایش از طریق تیم پالتو در دسترس است."], backHref:"/works", backLabel:"بازگشت به آثار" }} /> }
