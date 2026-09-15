import Link from "next/link"

export function ArchiveHeader() {
  return <header className="archive-header" dir="rtl"><Link href="/" className="archive-wordmark" aria-label="صفحه نخست پالتو">پالتو</Link><nav aria-label="ناوبری اصلی"><Link href="/works">آثار</Link><Link href="/talents">هنرمندان</Link><Link href="/space">فضاها</Link><Link href="/curatorial">مجله</Link><Link href="/explore">کشف هنر</Link><Link href="/events">رویدادها</Link></nav><Link href="/events" className="archive-ticket-link">رزرو بازدید <span aria-hidden="true">↙</span></Link></header>
}

export function ArchiveFooter() {
  return <footer className="archive-footer" dir="rtl"><div><strong>پالتو</strong><p>هنر را کشف کن، از خالقش بخر.</p></div><nav aria-label="پیوندهای حقوقی"><Link href="/imprint">درباره پالتو</Link><Link href="/accessibility">دسترس‌پذیری</Link><Link href="/data-privacy">حریم خصوصی</Link><Link href="/cookie-policy">کوکی‌ها</Link><Link href="/terms-of-use">شرایط استفاده</Link></nav><p>© ۱۴۰۵ پالتو</p></footer>
}

export function ArchiveLayout({ children }: { children: React.ReactNode }) { return <div className="archive-page"><ArchiveHeader />{children}<ArchiveFooter /></div> }

