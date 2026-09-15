"use client"

import { useEffect, useId, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import styles from "./EditorialGallery.module.css"

// Local collection imagery keeps this section visually connected to the exhibition.
export const defaultEditorialImages = [
  "/images/museum-school-of-athens.jpg",
  "/images/museum-quiet-garden.png",
  "/images/artwork-gallery-wall.png",
  "/images/museum-architectures-memory.png",
  "/images/museum-azure-interruption.png",
  "/images/museum-death-of-socrates.jpg",
  "/images/artwork-gallery-industrial-v2.png",
  "/images/artwork-gallery-industrial.png",
  "/images/artwork-gallery-industrial-night.png",
]

export type EditorialGalleryProps = {
  mode?: "page" | "embedded"
  images?: string[]
  brand?: string
  category?: string
  headline?: string
  ctaLabel?: string
  ctaHref?: string
  footer?: string
}

export function EditorialGallery({
  mode = "page",
  images = [],
  brand = "پالتو",
  category = "هنر، از نگاه تازه",
  headline = "هنر را کشف کن، از خالقش بخر.",
  ctaLabel = "کشف آثار",
  ctaHref = "/works",
  footer = "روایت‌های تازه از هنر و آدم‌های خلاق",
}: EditorialGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const wallRef = useRef<HTMLDivElement>(null)
  const brandRef = useRef<HTMLSpanElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  const shadeRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLSpanElement>(null)
  const titleId = useId()
  const words = headline.split(/\s+/)

  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const wall = wallRef.current
    const center = centerRef.current
    if (!root || !stage || !wall || !center || !contentRef.current) return
    gsap.registerPlugin(ScrollTrigger)
    const media = gsap.matchMedia()
    media.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        const lenis = new Lenis({
          ...(mode === "embedded"
            ? { wrapper: root, content: contentRef.current! }
            : {}),
          smoothWheel: true,
          lerp: 0.1,
          anchors: true,
        })
        lenis.on("scroll", ScrollTrigger.update)
        const tick = (time: number) => lenis.raf(time * 1000)
        gsap.ticker.add(tick)
        const wordElements = Array.from(
          center.querySelectorAll<HTMLElement>("[data-word]")
        )
        const photographs = Array.from(wall.querySelectorAll("img"))
        const label = center.querySelector("[data-label]")
        const cta = center.querySelector("[data-cta]")
        const state = { progress: 0 }
        let initialScale = 3
        let brandTravel = 0
        let brandScale = 0.2
        const range = (p: number, start: number, end: number) =>
          gsap.utils.clamp(0, 1, (p - start) / (end - start))
        const measure = () => {
          initialScale = Math.max(3, (stage.clientWidth * 3) / wall.offsetWidth)
          const mark = brandRef.current!
          brandScale = Math.min(1, 42 / mark.offsetHeight)
          brandTravel = -(
            stage.clientHeight -
            parseFloat(getComputedStyle(mark).bottom) -
            28 -
            mark.offsetHeight * brandScale
          )
        }
        const render = () => {
          const p = state.progress
          const pullback = range(p, 0, 0.65)
          const scale = initialScale + (1 - initialScale) * pullback
          // Keep a restrained counter-zoom so complete artworks remain readable at the end.
          gsap.set(wall, { scale })
          gsap.set(photographs, { scale: 1 + 0.12 * pullback })
          const brandProgress = range(p, 0.04, 0.48)
          gsap.set(brandRef.current, {
            scale: 1 + (brandScale - 1) * brandProgress,
            y: brandTravel * brandProgress,
          })
          const fade = range(p, 0, 0.22)
          gsap.set(footerRef.current, {
            autoAlpha: 1 - fade,
            scale: 1 - fade * 0.14,
            filter: `blur(${fade * 10}px)`,
          })
          gsap.set(label, { autoAlpha: range(p, 0.35, 0.45) })
          wordElements.forEach((word, index) => {
            const reveal = range(
              p,
              0.39 + (index / Math.max(1, wordElements.length - 1)) * 0.22,
              0.48 + (index / Math.max(1, wordElements.length - 1)) * 0.22
            )
            gsap.set(word, {
              autoAlpha: reveal,
              y: (1 - reveal) * 24,
              filter: `blur(${(1 - reveal) * 5}px)`,
            })
          })
          gsap.set(cta, {
            autoAlpha: range(p, 0.65, 0.76),
            y: 18 * (1 - range(p, 0.65, 0.76)),
          })
          gsap.set(shadeRef.current, {
            opacity: range(p, 0.24, 0.78) * 0.82,
          })
          gsap.set(sceneRef.current, { yPercent: -8 * range(p, 0.9, 1) })
          gsap.set(progressRef.current, { scaleX: p })
        }
        measure()
        gsap.to(state, {
          progress: 1,
          ease: "none",
          onUpdate: render,
          scrollTrigger: {
            trigger: stage,
            scroller: mode === "embedded" ? root : undefined,
            start: "top top",
            end: () => `+=${stage.clientHeight * 3.4}`,
            pin: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: () => {
              measure()
              render()
            },
          },
        })
        render()
        let refreshFrame = 0
        let disposed = false
        const refresh = () => {
          cancelAnimationFrame(refreshFrame)
          refreshFrame = requestAnimationFrame(() => {
            lenis.resize()
            ScrollTrigger.refresh()
          })
        }
        const observer = new ResizeObserver(refresh)
        observer.observe(root)
        observer.observe(stage)
        void document.fonts.ready.then(() => {
          if (!disposed) refresh()
        })
        return () => {
          disposed = true
          observer.disconnect()
          cancelAnimationFrame(refreshFrame)
          gsap.ticker.remove(tick)
          lenis.off("scroll", ScrollTrigger.update)
          lenis.destroy()
        }
      },
      root
    )
    return () => media.revert()
  }, [mode, headline])

  const imageSet = defaultEditorialImages.map(
    (fallback, index) => images[index]?.trim() || fallback
  )

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${mode === "embedded" ? styles.embedded : ""}`}
      dir="rtl"
      tabIndex={mode === "embedded" ? 0 : undefined}
      aria-label={mode === "embedded" ? "پیش‌نمایش گالری پالتو" : undefined}
    >
      <div ref={contentRef}>
        <section
          ref={stageRef}
          className={styles.stage}
          aria-labelledby={titleId}
        >
          <div ref={sceneRef} className={styles.scene}>
            <div className={styles.galleryPosition} aria-hidden="true">
              <div ref={wallRef} className={styles.wall}>
                {[0, 1, 2].map((column) => (
                  <div key={column} className={styles.column}>
                    {imageSet
                      .slice(column * 3, column * 3 + 3)
                      .map((src, row) => (
                        <div key={`${column}-${row}`} className={styles.photo}>
                          <Image
                            src={src}
                            alt=""
                            width={800}
                            height={1100}
                            unoptimized={!src.startsWith("/")}
                            loading={row === 1 ? "eager" : "lazy"}
                            fetchPriority={
                              column === 1 && row === 1 ? "high" : "auto"
                            }
                            decoding="async"
                            sizes="(max-width: 640px) 100vw, 70vw"
                            onError={(event) => {
                              const img = event.currentTarget
                              if (!img.dataset.fallback) {
                                img.dataset.fallback = "true"
                                img.removeAttribute("srcset")
                                img.src = "/images/museum-quiet-garden.png"
                              }
                            }}
                          />
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
            <div ref={shadeRef} className={styles.shade} aria-hidden="true" />
            <div className={styles.grain} aria-hidden="true" />
            <div className={styles.topline}>
              <span>نگاهی مستقل به هنر معاصر</span>
              <span dir="ltr">PALETTO / SELECTED WORKS</span>
            </div>
            <span ref={brandRef} className={styles.brand}>
              {brand}
            </span>
            <div ref={footerRef} className={styles.footer}>
              <span>{footer}</span>
              <span className={styles.scrollHint}>
                برای کشف، ورق بزن <span aria-hidden="true">↓</span>
              </span>
            </div>
            <div ref={centerRef} className={styles.center}>
              <p data-label className={`studio-mono ${styles.category}`}>
                {category}
              </p>
              <h2
                id={titleId}
                className={`studio-headline ${styles.headline}`}
                aria-label={headline}
              >
                {words.map((word, index) => (
                  <span key={`${word}-${index}`} data-word aria-hidden="true">
                    {word}{" "}
                  </span>
                ))}
              </h2>
              <Link data-cta href={ctaHref} className={styles.cta}>
                {ctaLabel}
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className={styles.progress} aria-hidden="true">
              <span ref={progressRef} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
