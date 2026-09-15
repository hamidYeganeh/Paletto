"use client"
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useMemo } from "react"
import { GalleryCanvas } from "./GalleryCanvas"
import Link from "next/link"
import { usePlatform, Empty, Loading } from "./client"
import { artworks as exhibitionArtworks } from "@/features/artwork-detail/artworks"
export function VirtualGallery({ gallery = "" }: { gallery?: string }) {
  const { catalog, loading } = usePlatform()
  const [index, setIndex] = useState(0)
  const [template, setTemplate] = useState("white")
  const [flat, setFlat] = useState(false)
  const [auto, setAuto] = useState(false)
  const works = useMemo(() => {
    const selected = catalog.artworks.filter(
      (a) => !gallery || a.galleryId === gallery
    )
    return gallery
      ? selected.map((a) => ({
          ...a,
          href: `/collection/${a.id}`,
          artist: a.artistName,
        }))
      : selected.length
        ? selected.map((a) => ({
            ...a,
            href: `/collection/${a.id}`,
            artist: a.artistName,
          }))
        : exhibitionArtworks.map((a) => ({ ...a, href: `/artworks/${a.id}` }))
  }, [catalog.artworks, gallery])
  useEffect(() => {
    if (!auto || works.length < 2) return
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % works.length),
      7000
    )
    return () => clearInterval(timer)
  }, [auto, works.length])
  if (loading) return <Loading />
  const current = works[index % Math.max(1, works.length)]
  return (
    <main id="main-content" className="pt-main">
      <div className="pt-page-heading">
        <span className="pt-kicker">بازدید مجازی</span>
        <h1>کمی نزدیک‌تر به اثر.</h1>
        <p>
          {catalog.galleries.find((g) => g.id === gallery)?.title ||
            "مجموعه نمایشی پالتو"}{" "}
          · چیدمان مجازی برای پیش‌نمایش آثار است و بازسازی دقیق ساختمان محسوب
          نمی‌شود.
        </p>
      </div>
      <div className="pt-room-controls">
        <div className="pt-tabs" aria-label="سبک سالن">
          {[
            ["white", "سالن سفید"],
            ["house", "خانه‌گالری"],
            ["industrial", "سالن صنعتی"],
            ["dark", "اتاق تاریک"],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setTemplate(v!)}
              aria-pressed={template === v}
            >
              {l}
            </button>
          ))}
        </div>
        <button
          className="pt-button pt-button-ghost"
          onClick={() => setFlat(!flat)}
        >
          {flat ? "نمای سالن" : "نمای ساده آثار"}
        </button>
      </div>
      {!works.length ? (
        <Empty title="هنوز اثری برای این سالن ثبت نشده" />
      ) : flat ? (
        <div className="pt-grid">
          {works.map((a) => (
            <Link className="pt-card" href={a.href} key={a.id}>
              <img
                className="pt-card-image"
                style={{ objectFit: "contain" }}
                src={a.image}
                alt={a.title}
              />
              <h3>{a.title}</h3>
              <p>{a.artist}</p>
            </Link>
          ))}
        </div>
      ) : (
        <>
          <GalleryCanvas
            works={works}
            index={index}
            template={template}
            onExplore={() => setAuto(false)}
          />
          <div className="pt-room-controls">
            <div className="pt-actions">
              <button
                className="pt-button pt-button-ghost"
                onClick={() =>
                  setIndex((index - 1 + works.length) % works.length)
                }
              >
                اثر قبلی
              </button>
              <button
                className="pt-button"
                onClick={() => setIndex((index + 1) % works.length)}
              >
                اثر بعدی
              </button>
              <button
                className="pt-button pt-button-ghost"
                aria-pressed={auto}
                onClick={() => setAuto(!auto)}
              >
                {auto ? "توقف تور" : "شروع تور خودکار"}
              </button>
            </div>
            <span aria-live="polite" className="pt-micro">
              {(index % works.length) + 1} از {works.length} · {current?.title}
            </span>
          </div>
          <div className="pt-tabs" aria-label="نقشه آثار سالن">
            {works.map((a, i) => (
              <button
                key={a.id}
                aria-pressed={index === i}
                onClick={() => setIndex(i)}
              >
                {i + 1}. {a.title}
              </button>
            ))}
          </div>
        </>
      )}
      {current && (
        <div className="pt-actions">
          <Link className="pt-button pt-button-ghost" href={current.href}>
            تصویر دقیق و شناسنامه اثر
          </Link>
          <Link
            className="pt-button"
            href={gallery ? `/galleries/${gallery}` : "/events"}
          >
            برنامه‌ریزی بازدید حضوری
          </Link>
        </div>
      )}
    </main>
  )
}
