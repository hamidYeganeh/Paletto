"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { useLayoutEffect, useRef, type CSSProperties } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import type { Artwork } from "./artworks"

export function ArtworkDetail({ artwork }: { artwork: Artwork }) {
  const { resolvedTheme, setTheme } = useTheme()
  const hero = useRef<HTMLElement>(null)
  const details = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const media = gsap.matchMedia()
    const context = gsap.context(() => {
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: hero.current,
              pin: true,
              start: "top top",
              end: () => `+=${window.innerHeight * 1.4}`,
              scrub: 0.45,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })
          .to(
            ".ml-room, .ml-painting",
            {
              scale: () => {
                const painting =
                  hero.current?.querySelector<HTMLElement>(".ml-painting")
                if (!painting) return 1
                return (
                  Math.max(
                    window.innerWidth / painting.offsetWidth,
                    window.innerHeight / painting.offsetHeight
                  ) * 1.12
                )
              },
              duration: 1.4,
            },
            0
          )
          .to(".ad-hint", { autoAlpha: 0, duration: 0.25 }, 0)
          .to({}, { duration: 0.2 })
      })
    }, hero)
    return () => {
      media.revert()
      context.revert()
    }
  }, [])

  return (
    <main className="ml ad" dir="rtl">
      <section
        className="ml-stage"
        ref={hero}
        aria-label={`نمایش ${artwork.title}`}
      >
        <div className="ml-scene">
          <div className="ml-room" aria-hidden="true" />
          <div
            className="ml-painting"
            style={
              {
                "--artwork-aspect":
                  Number(artwork.width) / Number(artwork.height),
              } as CSSProperties
            }
          >
            {/* Native image preserves the full-resolution painting during the zoom. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artwork.image}
              alt={`${artwork.title}، ${artwork.artist}`}
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
        <header className="ml-header" dir="rtl">
          <Link href="/" className="ad-brand">
            پالتو
          </Link>
          <div className="ad-header-actions">
            <button
              type="button"
              className="ad-theme-toggle"
              aria-label="تغییر حالت روز و شب"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              <span className="ad-show-night">☾ حالت شب</span>
              <span className="ad-show-day">☀ حالت روز</span>
            </button>
            <a
              href="#artwork-details"
              className="ad-details-link"
              onClick={(event) => {
                event.preventDefault()
                details.current?.scrollIntoView({
                  behavior: "instant",
                  block: "start",
                })
              }}
            >
              اطلاعات اثر ↓
            </a>
          </div>
        </header>
        <p className="ad-hint">
          برای کشف اثر اسکرول کنید <span aria-hidden="true">↓</span>
        </p>
      </section>
      <section
        className="ad-information"
        id="artwork-details"
        ref={details}
        aria-labelledby="artwork-title"
      >
        <div className="ad-information-inner">
          <p className="ad-eyebrow">مجموعه پالتو / {artwork.movement}</p>
          <div className="ad-heading">
            <h1 id="artwork-title">{artwork.title}</h1>
            <p>
              {artwork.artist}
              <span>
                {new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(
                  Number(artwork.year)
                )}
              </span>
            </p>
          </div>
          <div className="ad-body">
            <article>
              <h2>درباره اثر</h2>
              <p>{artwork.description}</p>
            </article>
            <dl>
              <div>
                <dt>هنرمند</dt>
                <dd>{artwork.artist}</dd>
              </div>
              <div>
                <dt>سبک</dt>
                <dd>{artwork.movement}</dd>
              </div>
              <div>
                <dt>سال خلق</dt>
                <dd>
                  {new Intl.NumberFormat("fa-IR", {
                    useGrouping: false,
                  }).format(Number(artwork.year))}
                </dd>
              </div>
              <div>
                <dt>ابعاد (ارتفاع × عرض)</dt>
                <dd>
                  {new Intl.NumberFormat("fa-IR").format(
                    Number(artwork.height)
                  )}{" "}
                  ×{" "}
                  {new Intl.NumberFormat("fa-IR").format(Number(artwork.width))}{" "}
                  سانتی‌متر
                </dd>
              </div>
            </dl>
          </div>
          <footer className="ad-footer">
            <Link href="/">بازگشت به مجموعه ↗</Link>
            <button
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: window.matchMedia(
                    "(prefers-reduced-motion: reduce)"
                  ).matches
                    ? "instant"
                    : "smooth",
                })
              }
            >
              نمایش دوباره اثر ↑
            </button>
          </footer>
        </div>
      </section>
    </main>
  )
}
