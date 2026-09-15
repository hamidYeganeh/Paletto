"use client"
/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  RotateCw,
  Maximize2,
  Minimize2,
  X,
  Grid2X2,
  HelpCircle,
  ImagePlus,
  Eye,
  Home,
} from "lucide-react"
import { lightWorks, type LightWork } from "./works"
import type { SceneHandle } from "./scene"
import { ROOM_PAGE_SIZE, roomPage } from "./navigation"
import styles from "./light-gallery.module.css"

function ArtworkImage({ work }: { work: LightWork }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <p role="status">تصویر این اثر بارگذاری نشد.</p>
  if (work.crop) {
    const [x, y, w, h] = work.crop
    return (
      <div
        role="img"
        aria-label={work.title}
        className={styles.croppedArt}
        style={{
          aspectRatio: `${1672 * w} / ${941 * h}`,
          backgroundImage: `url("${work.image}")`,
          backgroundSize: `${100 / w}% ${100 / h}%`,
          backgroundPosition: `${(x / (1 - w)) * 100}% ${(y / (1 - h)) * 100}%`,
        }}
      />
    )
  }
  return (
    <img src={work.image} alt={work.title} onError={() => setFailed(true)} />
  )
}
export function LightGallery({
  initialWorks = lightWorks,
}: {
  initialWorks?: LightWork[]
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rootRef = useRef<HTMLElement>(null)
  const markerRef = useRef<HTMLSpanElement>(null)
  const sceneRef = useRef<SceneHandle | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const urls = useRef<string[]>([])
  const [works, setWorks] = useState<LightWork[]>(initialWorks)
  const [page, setPage] = useState(0)
  const [navigationMode, setNavigationMode] = useState<"scroll" | "walk">(
    "scroll"
  )
  const [uploading, setUploading] = useState(false)
  const pageCount = Math.max(1, Math.ceil(works.length / ROOM_PAGE_SIZE))
  const pageWorks = useMemo(() => roomPage(works, page), [works, page])
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [collection, setCollection] = useState(false)
  const [help, setHelp] = useState(false)
  const [full, setFull] = useState(false)
  const [notice, setNotice] = useState("")
  const openRef = useRef<(i: number) => void>(() => {})
  useEffect(() => {
    openRef.current = (i) => {
      returnFocus.current = document.activeElement as HTMLElement
      setSelected(i)
    }
  }, [])
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false,
      handle: SceneHandle | null = null
    void import("./scene")
      .then(({ createLightScene }) => {
        if (cancelled) return
        handle = createLightScene({
          canvas,
          works: pageWorks,
          onSelect: (i) => openRef.current(i),
          onHover: setHover,
          onMove(x, z, yaw) {
            if (markerRef.current) {
              markerRef.current.style.left = `${((x + 7) / 14) * 100}%`
              markerRef.current.style.top = `${((z + 12) / 20) * 100}%`
              markerRef.current.style.transform = `translate(-50%,-50%) rotate(${-yaw}rad)`
            }
            canvas.dataset.position = `${x.toFixed(3)},${z.toFixed(3)}`
          },
          onLoad: (done, total) => {
            if (!cancelled)
              setLoaded(Math.round((done / Math.max(1, total)) * 100))
          },
          onError: () => {
            if (!cancelled) setFailed(true)
          },
        })
        sceneRef.current = handle
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
      handle?.dispose()
      sceneRef.current = null
    }
  }, [pageWorks])
  useEffect(
    () => () => {
      urls.current.forEach((url) => URL.revokeObjectURL(url))
    },
    []
  )
  useEffect(() => {
    const dialog = dialogRef.current
    if (selected !== null) {
      dialog?.showModal()
    } else if (dialog?.open) {
      dialog.close()
      returnFocus.current?.focus({ preventScroll: true })
    }
    sceneRef.current?.setPaused(selected !== null || collection || help)
  }, [selected, collection, help, ready])
  useEffect(() => {
    const change = () => setFull(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", change)
    return () => document.removeEventListener("fullscreenchange", change)
  }, [])
  useEffect(() => {
    sceneRef.current?.setNavigationMode(navigationMode)
  }, [navigationMode, ready])
  function changePage(next: number) {
    if (next < 0 || next >= pageCount || next === page) return
    sceneRef.current?.clearKeys()
    setSelected(null)
    setHover(null)
    setReady(false)
    setFailed(false)
    setLoaded(0)
    setPage(next)
  }
  const current = selected === null ? null : pageWorks[selected]
  function close() {
    setSelected(null)
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await rootRef.current?.requestFullscreen()
    } catch {
      setNotice("نمای تمام‌صفحه در این مرورگر در دسترس نیست.")
    }
  }
  async function addImages(files: FileList | null) {
    if (!files?.length) return
    if (uploading) return
    setUploading(true)
    const added: LightWork[] = []
    let rejected = 0
    for (const file of Array.from(files)) {
      if (
        !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
          file.type
        ) ||
        file.size > 12 * 1024 * 1024
      ) {
        rejected++
        continue
      }
      const url = URL.createObjectURL(file)
      const valid = await new Promise<boolean>((resolve) => {
        const image = new Image()
        image.onload = () => resolve(true)
        image.onerror = () => resolve(false)
        image.src = url
      })
      if (!valid) {
        URL.revokeObjectURL(url)
        rejected++
        continue
      }
      urls.current.push(url)
      added.push({
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^.]+$/, ""),
        artist: "مجموعهٔ شخصی شما",
        image: url,
        description:
          "این تصویر فقط در همین مرورگر و تا زمان بستن یا تازه‌کردن صفحه نمایش داده می‌شود؛ به سرور ارسال نشده است.",
      })
    }
    if (added.length) {
      setReady(false)
      setLoaded(0)
      setPage(Math.floor(works.length / ROOM_PAGE_SIZE))
      setSelected(null)
      setHover(null)
      setWorks((prev) => [...prev, ...added])
      setCollection(false)
    }
    setNotice(
      `${added.length.toLocaleString("fa-IR")} تصویر به سالن اضافه شد.${rejected ? " بعضی فایل‌ها نامعتبر یا بزرگ‌تر از ۱۲ مگابایت بودند." : ""}`
    )
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ""
  }
  const moveButtons = [
    { key: "KeyW", label: "جلو", Icon: ArrowUp },
    { key: "KeyA", label: "چپ", Icon: ArrowLeft },
    { key: "KeyS", label: "عقب", Icon: ArrowDown },
    { key: "KeyD", label: "راست", Icon: ArrowRight },
    { key: "KeyQ", label: "نگاه به چپ", Icon: RotateCcw },
    { key: "KeyE", label: "نگاه به راست", Icon: RotateCw },
  ]
  return (
    <main ref={rootRef} id="main-content" className={styles.gallery}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="پالتو، صفحهٔ اصلی">
          پالتو<span>گالری نور</span>
        </Link>
        <nav aria-label="کنترل گالری">
          <button
            onClick={() => {
              setCollection(!collection)
              setHelp(false)
            }}
            aria-pressed={collection}
            aria-label="مجموعه آثار"
          >
            <Grid2X2 size={17} />
            <span>مجموعه آثار</span>
          </button>
          <button
            onClick={() => {
              setHelp(!help)
              setCollection(false)
            }}
            aria-pressed={help}
            aria-label="راهنمای گردش"
          >
            <HelpCircle size={19} />
          </button>
          <button
            onClick={fullscreen}
            aria-label={full ? "خروج از تمام‌صفحه" : "تمام‌صفحه"}
          >
            {full ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <Link href="/explore" className={styles.exit}>
            خروج <ArrowLeft size={17} />
          </Link>
        </nav>
      </header>
      <div className={styles.viewport}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          tabIndex={ready && !failed ? 0 : -1}
          aria-label="سالن سه‌بعدی قابل گردش گالری"
          aria-describedby="light-gallery-help"
          aria-busy={!ready}
          data-room-page={page + 1}
        />
        <span className={styles.crosshair} aria-hidden="true" />
        <div className={styles.intro}>
          <span>سالن {(page + 1).toLocaleString("fa-IR")}</span>
          <h1>جایی برای تماشا.</h1>
          <p>در گالری قدم بزنید و به آثار نزدیک شوید.</p>
        </div>
        {hover !== null && !collection && !help && (
          <div className={styles.hover}>
            <Eye size={15} />
            {pageWorks[hover]?.title}
            <span>برای دیدن اثر کلیک کنید</span>
          </div>
        )}
        <div
          className={styles.navigationMode}
          role="group"
          aria-label="شیوه بازدید"
        >
          <button
            aria-pressed={navigationMode === "scroll"}
            onClick={() => setNavigationMode("scroll")}
          >
            بازدید با اسکرول
          </button>
          <button
            aria-pressed={navigationMode === "walk"}
            onClick={() => setNavigationMode("walk")}
          >
            گردش آزاد
          </button>
        </div>
        <div className={styles.bottom}>
          <div className={styles.mapGroup}>
            <div className={styles.map} aria-label="نقشه موقعیت شما در سالن">
              <div className={styles.court} />
              <div className={styles.partition} />
              <div className={styles.bench} />
              <span ref={markerRef} className={styles.marker} />
            </div>
            <button
              onClick={() => {
                sceneRef.current?.home()
                canvasRef.current?.focus({ preventScroll: true })
              }}
              disabled={!ready || failed}
              aria-label="بازگشت به ورودی"
            >
              <Home size={16} />
            </button>
          </div>
          <div
            className={styles.movement}
            role="group"
            aria-label="کنترل حرکت در سالن"
          >
            {moveButtons.map(({ key, label, Icon }) => (
              <button
                key={key}
                aria-label={label}
                disabled={!ready || failed}
                onPointerDown={(e) => {
                  e.preventDefault()
                  e.currentTarget.setPointerCapture(e.pointerId)
                  sceneRef.current?.setKey(key, true)
                }}
                onPointerUp={() => sceneRef.current?.setKey(key, false)}
                onPointerCancel={() => sceneRef.current?.clearKeys()}
                onLostPointerCapture={() =>
                  sceneRef.current?.setKey(key, false)
                }
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault()
                    sceneRef.current?.setKey(key, true)
                  }
                }}
                onKeyUp={() => sceneRef.current?.setKey(key, false)}
                onBlur={() => sceneRef.current?.setKey(key, false)}
              >
                <Icon size={19} />
              </button>
            ))}
          </div>
          <p id="light-gallery-help" className={styles.hint}>
            {navigationMode === "scroll" ? (
              "اسکرول عمودی: پیشروی در سالن"
            ) : (
              <>
                حرکت با <b dir="ltr">W A S D</b>
              </>
            )}
            <span>
              {navigationMode === "scroll"
                ? "کشیدن افقی: چرخش نگاه · لمس تابلو: مشاهده"
                : "کشیدن تصویر: نگاه · لمس تابلو: مشاهده"}
            </span>
          </p>
        </div>
        {!ready && !failed && (
          <div className={styles.loading} role="status">
            <p>در حال آماده‌سازی گالری…</p>
            <span>{loaded.toLocaleString("fa-IR")}٪</span>
          </div>
        )}
        {failed && (
          <div className={styles.loading} role="alert">
            <h2>نمای سه‌بعدی در دسترس نیست</h2>
            <p>می‌توانید آثار را در نمای ساده ببینید.</p>
            <button onClick={() => setCollection(true)}>مجموعه آثار</button>
          </div>
        )}
        {help && (
          <aside className={styles.panel} aria-label="راهنمای گردش">
            <button
              className={styles.close}
              onClick={() => setHelp(false)}
              aria-label="بستن راهنما"
            >
              <X size={20} />
            </button>
            <h2>آرام قدم بزنید.</h2>
            <p>
              روی فضای گالری بزنید، سپس با W، A، S، D یا کلیدهای جهت‌نما حرکت
              کنید.
            </p>
            <p>
              تصویر را بکشید تا اطراف را ببینید. Q و E نگاه را می‌چرخانند. روی
              تابلو بزنید تا بزرگ‌تر باز شود؛ با Enter اثر روبه‌روی نشانگر را
              انتخاب کنید.
            </p>
            <p>
              در حالت بازدید با اسکرول، انگشت را به بالا بکشید تا در مسیر سالن
              پیش بروید؛ کشیدن به پایین شما را برمی‌گرداند و کشیدن افقی نگاه را
              می‌چرخاند. در حالت گردش آزاد، از دکمه‌های پایین برای حرکت استفاده
              کنید.
            </p>
            <p>Esc کنترل صفحه‌کلید یا پنجرهٔ اثر را می‌بندد.</p>
            <button
              onClick={() => {
                setHelp(false)
                canvasRef.current?.focus()
              }}
            >
              شروع گردش
            </button>
          </aside>
        )}
        {collection && (
          <aside
            className={`${styles.panel} ${styles.collection}`}
            aria-label="مجموعه آثار گالری"
          >
            <button
              className={styles.close}
              onClick={() => setCollection(false)}
              aria-label="بستن مجموعه"
            >
              <X size={20} />
            </button>
            <h2>آثار سالن {(page + 1).toLocaleString("fa-IR")}</h2>
            <p>اثری را انتخاب کنید یا تصاویر خودتان را به سالن بیاورید.</p>
            <div className={styles.works}>
              {pageWorks.map((w, i) => (
                <article key={w.id}>
                  <button
                    className={styles.thumbnail}
                    onClick={() => openRef.current(i)}
                    aria-label={`مشاهده ${w.title}`}
                  >
                    <ArtworkImage work={w} />
                  </button>
                  <h3>{w.title}</h3>
                  <span>{w.artist}</span>
                  <button
                    className={styles.locate}
                    disabled={!ready || failed}
                    onClick={() => {
                      setCollection(false)
                      sceneRef.current?.focus(i)
                      canvasRef.current?.focus()
                    }}
                  >
                    رفتن کنار اثر <ArrowLeft size={14} />
                  </button>
                </article>
              ))}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <ImagePlus size={17} />{" "}
              {uploading ? "در حال آماده‌سازی تصاویر…" : "افزودن تصویر شخصی"}
            </button>
            <p className={styles.note}>
              تصاویر شخصی موقت‌اند و به سرور ارسال نمی‌شوند. JPEG، PNG، WebP یا
              AVIF؛ حداکثر ۱۲ مگابایت برای هر تصویر. هر ۱۰ اثر در یک سالن قرار
              می‌گیرد.
            </p>
          </aside>
        )}
      </div>
      <footer className={styles.footer}>
        <nav className={styles.pagination} aria-label="صفحه‌بندی سالن‌ها">
          <button
            aria-label="سالن قبلی"
            disabled={page === 0}
            onClick={() => changePage(page - 1)}
          >
            <ArrowRight size={17} />
          </button>
          <label>
            <span className={styles.srOnly}>انتخاب سالن</span>
            <select
              aria-label="انتخاب سالن"
              value={page}
              onChange={(e) => changePage(Number(e.target.value))}
            >
              {Array.from({ length: pageCount }, (_, i) => (
                <option key={i} value={i}>
                  سالن {(i + 1).toLocaleString("fa-IR")} از{" "}
                  {pageCount.toLocaleString("fa-IR")}
                </option>
              ))}
            </select>
          </label>
          <button
            aria-label="سالن بعدی"
            disabled={page + 1 >= pageCount}
            onClick={() => changePage(page + 1)}
          >
            <ArrowLeft size={17} />
          </button>
        </nav>
        <span className={styles.pageRange} aria-live="polite">
          {works.length
            ? `آثار ${(page * ROOM_PAGE_SIZE + 1).toLocaleString("fa-IR")} تا ${(page * ROOM_PAGE_SIZE + pageWorks.length).toLocaleString("fa-IR")}`
            : "هنوز اثری اضافه نشده"}
        </span>
        <button
          onClick={() => {
            setCollection(true)
            setHelp(false)
          }}
        >
          {works.length.toLocaleString("fa-IR")} اثر برای تماشا{" "}
          <ArrowLeft size={14} />
        </button>
      </footer>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={(e) => void addImages(e.target.files)}
      />
      {notice && (
        <div className={styles.notice} role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="بستن پیام">
            <X size={16} />
          </button>
        </div>
      )}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        onCancel={(e) => {
          e.preventDefault()
          close()
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
        aria-labelledby="light-work-title"
      >
        {current && (
          <div className={styles.dialogInner}>
            <button
              autoFocus
              className={styles.close}
              onClick={close}
              aria-label="بستن اثر"
            >
              <X size={22} />
            </button>
            <div className={styles.largeArt}>
              <ArtworkImage key={current.id} work={current} />
            </div>
            <div className={styles.details}>
              <span>{current.artist}</span>
              <h2 id="light-work-title">{current.title}</h2>
              <p>{current.description}</p>
              {current.href && (
                <Link href={current.href}>
                  شناسنامهٔ کامل اثر <ArrowLeft size={16} />
                </Link>
              )}
              <div className={styles.artNav}>
                <button
                  onClick={() =>
                    setSelected(
                      ((selected ?? 0) - 1 + pageWorks.length) %
                        pageWorks.length
                    )
                  }
                  aria-label="اثر قبلی"
                >
                  <ArrowRight size={18} />
                </button>
                <span>
                  {((selected ?? 0) + 1).toLocaleString("fa-IR")} /{" "}
                  {pageWorks.length.toLocaleString("fa-IR")}
                </span>
                <button
                  onClick={() =>
                    setSelected(((selected ?? 0) + 1) % pageWorks.length)
                  }
                  aria-label="اثر بعدی"
                >
                  <ArrowLeft size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </main>
  )
}
