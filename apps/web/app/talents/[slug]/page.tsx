import { notFound } from "next/navigation"
import { ArchiveDetail } from "@/features/archive/ArchiveDetail"
import { talents } from "@/features/archive/archive-data"

export function generateStaticParams() { return talents.map(({ slug }) => ({ slug })) }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const item = talents.find((entry) => entry.slug === slug); if (!item) notFound(); return <ArchiveDetail record={{ name:item.name, image:item.image, eyebrow:item.role, meta:`${item.city} / ${item.practice}`, intro:item.bio, body:["هر پروژه برای او از مشاهده‌ی آرام و ثبت جزئیات روزمره آغاز می‌شود. تصویر نهایی نه بازنمایی یک لحظه، بلکه حاصل انباشته شدن زمان است.","آثار این هنرمند در برنامه‌ی پاییز پالتو همراه با یادداشت‌ها، طرح‌های اولیه و گفت‌وگویی درباره‌ی فرآیند شکل‌گیری مجموعه نمایش داده می‌شوند."], backHref:"/talents", backLabel:"همه هنرمندان" }} /> }
