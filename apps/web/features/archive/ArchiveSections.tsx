"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { essays, exhibitions, faqs, talents } from "./archive-data"

export function ArchiveSections() {
  const [activeArtist, setActiveArtist] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const artist = talents[activeArtist]!
  return <div className="archive-sections" dir="rtl">
    <section className="archive-manifesto"><p className="archive-eyebrow">مجله پالتو / شماره ۰۱</p><div className="archive-manifesto-grid"><h2>دیدن، یک<br />عملِ فعال است.</h2><div><p>پالتو جایی برای مکث کنار هنر است؛ جایی که اثر، هنرمند و مخاطب در یک روایت مشترک به هم می‌رسند.</p><Link href="/curatorial">خواندن مجله <span aria-hidden="true">←</span></Link></div></div><div className="archive-editorial-strip">{essays.map((essay, index) => <span key={essay.slug}>۰{index + 1} — {essay.title}</span>)}</div></section>
    <section className="archive-calendar" id="calendar"><div className="archive-section-heading"><p className="archive-eyebrow">تقویم نمایش / پاییز ۱۴۰۵</p><h2>این روزها<br />در پالتو</h2><Link href="/works">همه آثار</Link></div><div className="archive-calendar-list">{exhibitions.slice(0, 4).map((item, index) => <Link href={`/exhibition/${item.slug}`} key={item.slug} className="archive-calendar-row"><span>۰{index + 1}</span><h3>{item.title}</h3><p>{item.date}</p><p>{item.room}</p><span aria-hidden="true">↙</span></Link>)}</div></section>
    <section className="archive-talents" id="talents"><div className="archive-section-heading archive-section-heading--light"><p className="archive-eyebrow">هنرمندان منتخب / ۰۴</p><h2>صداهای<br />این مجموعه</h2><Link href="/talents">همه هنرمندان</Link></div><div className="archive-talent-stage"><Link href={`/talents/${artist.slug}`} className="archive-featured-talent"><Image src={artist.image} alt={`اثر منتخب از ${artist.name}`} width={1200} height={1000} /><div><p>{artist.role}</p><h3>{artist.name}</h3><span>{artist.city} ↙</span></div></Link><div className="archive-talent-tabs">{talents.map((item, index) => <button key={item.slug} onClick={() => setActiveArtist(index)} aria-pressed={index === activeArtist}><span>۰{index + 1}</span><strong>{item.name}</strong><small>{item.practice}</small></button>)}</div></div></section>
    <section className="archive-faq"><div className="archive-section-heading"><p className="archive-eyebrow">راهنمای بازدید</p><h2>پیش از<br />آمدن</h2></div><div className="archive-faq-list">{faqs.map(([question, answer], index) => <div className="archive-faq-item" key={question}><button onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}><span>۰{index + 1}</span><strong>{question}</strong><i>{openFaq === index ? "−" : "+"}</i></button><div className={openFaq === index ? "is-open" : ""}><p>{answer}</p></div></div>)}</div></section>
    <section className="archive-tickets" id="tickets"><div className="archive-ticket-intro"><p className="archive-eyebrow">بازدید حضوری و رویدادهای هنر</p><h2>زمانی برای<br />تماشای دقیق.</h2><p>گالری، برنامه و زمان مناسب خود را انتخاب کنید.<br />بازدید آزاد، رزرو رایگان یا بلیت رویداد.</p></div><div className="archive-passes"><Link href="/events">دیدن رویدادها و رزرو بازدید ↖</Link><Link href="/galleries">آشنایی با گالری‌ها ↖</Link><Link href="/account">بلیت‌ها و برنامه من ↖</Link></div></section>
  </div>
}
