"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { essays, exhibitions, spaces, talents } from "./archive-data"
import { ArchiveLayout } from "./ArchiveShell"

export function WorksPage() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("همه")
  const categories = ["همه", ...new Set(exhibitions.map((item) => item.category))]
  const filtered = useMemo(() => exhibitions.filter((item) => (category === "همه" || item.category === category) && `${item.title} ${item.artist}`.includes(query)), [category, query])
  return <ArchiveLayout><main className="archive-index"><IndexHero eyebrow="آرشیو پالتو / ۱۴۰۵" title={`آثار [${filtered.length}]`} intro="مجموعه‌ای زنده از نقاشی، تصویر و تجربه‌های فضایی." /><div className="archive-filters"><label>جست‌وجو <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="نام اثر یا هنرمند" /></label><div>{categories.map((item) => <button className={item === category ? "is-active" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div></div><div className="archive-work-grid">{filtered.map((item, index) => <Link href={`/exhibition/${item.slug}`} key={item.slug} className="archive-work-card"><div><Image src={item.image} alt={item.title} width={1200} height={900} /></div><span>۰{index + 1}</span><h2>{item.title}</h2><p>{item.artist} / {item.year}</p></Link>)}</div></main></ArchiveLayout>
}

export function TalentsPage() {
  const [query, setQuery] = useState("")
  const filtered = talents.filter((item) => `${item.name} ${item.role} ${item.city}`.includes(query))
  return <ArchiveLayout><main className="archive-index"><IndexHero eyebrow="هنرمندان، نویسندگان و مهمانان" title={`هنرمندان [${filtered.length}]`} intro="افرادی که پالتو را با نگاه و کار خود شکل می‌دهند." /><div className="archive-filters"><label>جست‌وجو <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="نام، زمینه یا شهر" /></label></div><div className="archive-directory">{filtered.map((item, index) => <Link href={`/talents/${item.slug}`} key={item.slug}><span>۰{index + 1}</span><div><Image src={item.image} alt="" width={640} height={480} /></div><h2>{item.name}</h2><p>{item.role}</p><small>{item.city}</small><i>↙</i></Link>)}</div></main></ArchiveLayout>
}

export function SpacesPage() { return <ArchiveLayout><main className="archive-index"><IndexHero eyebrow="معماری و تجربه نمایش" title="فضاهای پالتو" intro="هر تالار با نور، صدا و ریتم متفاوتی برای مواجهه با اثر طراحی شده است." /><div className="archive-space-grid">{spaces.map((item, index) => <Link href={`/space/${item.slug}`} key={item.slug}><div><Image src={item.image} alt={item.name} width={1200} height={800} /></div><span>{item.code}</span><h2>{item.name}</h2><p>{item.area}</p><i>۰{index + 1} ↙</i></Link>)}</div></main></ArchiveLayout> }

export function EssaysPage() { return <ArchiveLayout><main className="archive-index"><IndexHero eyebrow="یادداشت‌های کیوریتوری" title="مجله پالتو" intro="متن‌هایی برای ادامه دادن تجربه‌ی دیدن؛ پیش و پس از نمایشگاه." /><div className="archive-essay-list">{essays.map((item, index) => <Link href={`/curatorial/${item.slug}`} key={item.slug}><span>۰{index + 1}</span><div><Image src={item.image} alt="" width={640} height={480} /></div><section><small>{item.author} / {item.date}</small><h2>{item.title}</h2><p>{item.excerpt}</p></section><i>بخوانید ←</i></Link>)}</div></main></ArchiveLayout> }

function IndexHero({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) { return <header className="archive-index-hero"><p>{eyebrow}</p><h1>{title}</h1><span>{intro}</span></header> }

