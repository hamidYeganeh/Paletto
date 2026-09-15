import Link from "next/link"
import Image from "next/image"
import { ArchiveLayout } from "./ArchiveShell"

export type DetailRecord = { name?: string; title?: string; image: string; eyebrow: string; meta: string; intro: string; body: string[]; backHref: string; backLabel: string }

export function ArchiveDetail({ record }: { record: DetailRecord }) {
  const title = record.name ?? record.title ?? ""
  return <ArchiveLayout><main className="archive-detail"><Link className="archive-back" href={record.backHref}>→ {record.backLabel}</Link><header><p>{record.eyebrow}</p><h1>{title}</h1><span>{record.meta}</span></header><figure><Image src={record.image} alt={title} width={1600} height={1000} priority /></figure><article><p className="archive-detail-lead">{record.intro}</p>{record.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article></main></ArchiveLayout>
}

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) { return <ArchiveLayout><main className="archive-legal"><Link href="/">→ بازگشت به خانه</Link><header><p>اطلاعات پالتو</p><h1>{title}</h1><span>آخرین به‌روزرسانی: {updated}</span></header><article>{children}</article></main></ArchiveLayout> }
