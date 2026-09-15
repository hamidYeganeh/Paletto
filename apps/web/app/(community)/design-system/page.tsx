export const metadata = { title: "دیزاین سیستم | پالتو" }
export default function Page() {
  return (
    <main id="main-content" className="pt-main">
      <div className="pt-page-heading">
        <span className="pt-kicker">زبان بصری پالتو</span>
        <h1>
          هنر در مرکز.
          <br />
          رابط در خدمت.
        </h1>
        <p>
          سیستم مشترک صفحات عمومی و فضای کاری، برگرفته از تایپوگرافی و رنگ‌های
          صفحه اصلی.
        </p>
      </div>
      <section className="pt-section">
        <h2>رنگ‌های معنایی</h2>
        <div className="pt-palette">
          {[
            ["کاغذ", "var(--pt-paper)", "#141413"],
            ["جوهر", "var(--pt-ink)", "#fff"],
            ["تأکید", "var(--pt-accent)", "#fff"],
            ["سطح", "var(--pt-surface)", "#141413"],
            ["متن ثانویه", "var(--pt-muted)", "#fff"],
          ].map(([n, c, t]) => (
            <div
              className="pt-swatch"
              style={{ background: c, color: t }}
              key={n}
            >
              {n}
            </div>
          ))}
        </div>
        <p>
          نارنجی اصلی برای متن و دکمه‌ها تیره‌تر شده تا کنتراست خوانا بماند.
        </p>
      </section>
      <section className="pt-section">
        <h2>تایپوگرافی</h2>
        <p style={{ fontSize: 44, fontWeight: 900 }}>
          دیدن، آغاز یک رابطه است.
        </p>
        <p style={{ fontSize: 20 }}>
          ایران‌سنس متغیر، راست‌به‌چپ و با فاصله سطر مناسب فارسی.
        </p>
        <p className="pt-micro">
          متن کمکی ۱۲ پیکسل · متن اصلی ۱۵ تا ۱۶ پیکسل · عنوان ۳۸ تا ۸۲ پیکسل
        </p>
      </section>
      <section className="pt-section">
        <h2>کنترل‌ها و وضعیت‌ها</h2>
        <div className="pt-actions">
          <button className="pt-button">عمل اصلی</button>
          <button className="pt-button pt-button-ghost">عمل ثانویه</button>
          <button className="pt-button pt-button-accent">رزرو بازدید</button>
          <button className="pt-button" disabled>
            در حال ثبت
          </button>
          <span className="pt-tag" data-status="published">
            منتشرشده
          </span>
          <span className="pt-tag" data-status="cancelled">
            لغوشده
          </span>
        </div>
        <div className="pt-form-grid" style={{ marginTop: 24 }}>
          <label className="pt-field">
            برچسب همیشه قابل مشاهده
            <input placeholder="متن راهنما" />
          </label>
          <label className="pt-field">
            انتخاب
            <select>
              <option>گزینه نمونه</option>
            </select>
          </label>
        </div>
      </section>
      <section className="pt-section">
        <h2>قواعد دسترس‌پذیری</h2>
        <p>
          فوکوس واضح، هدف لمسی حداقل ۴۴ پیکسل، وضعیت همراه متن، نمای سبک آثار،
          پشتیبانی کاهش حرکت و چیدمان واکنش‌گرا.
        </p>
      </section>
    </main>
  )
}
