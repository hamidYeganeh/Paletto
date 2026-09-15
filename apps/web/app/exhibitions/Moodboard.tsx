"use client"

import { useEffect, useRef, useState } from "react"
import styles from "./exhibitions.module.css"

const collection = [
  ["Neon Streets", "AFTER DARK", "1519608487953-e999c86e7455"],
  ["Desert Form", "OPEN SPACE", "1500530855697-b586d89ba3ee"],
  ["Blue Current", "OCEAN STUDY", "1507525428034-b723cf961d3e"],
  ["Studio Light", "CREATIVE SPACE", "1497366754035-f200968a6e72"],
  ["Mountain Air", "HIGH ALTITUDE", "1464822759023-fed622ff2c3b"],
  ["Concrete Wave", "ARCHITECTURE", "1487958449943-2429e8be8625"],
  ["Night Pulse", "LIVE ENERGY", "1492684223066-81342ee5ff30"],
  ["Forest Frame", "NATURAL LIGHT", "1441974231531-c6227db76b6e"],
  ["Future City", "URBAN FORM", "1486406146926-c627a92ad1ab"],
  ["Soft Altitude", "SKY JOURNAL", "1499346030926-9a72daac6c63"],
  ["Analog Mood", "SOUND CULTURE", "1461360228754-6e81c478b882"],
  ["Urban Motion", "CITY SCALE", "1477959858617-67f85cf4f1df"],
] as const
const tiles = Array.from({ length: 64 }, (_, i) => collection[(i % 8 * 5 + Math.floor(i / 8) * 7) % collection.length]!)
const source = (id: string, width = 600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=88`

export default function Moodboard() {
  const viewport = useRef<HTMLDivElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const suppressClick = useRef(false)
  const [selected, setSelected] = useState<(typeof collection)[number] | null>(null)
  const [labels, setLabels] = useState(true)

  useEffect(() => {
    const el = viewport.current!
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    let frame = 0, maxX = 0, maxY = 0, initialized = false
    let targetX = 0, targetY = 0
    let pointer: { id: number; x: number; y: number; startX: number; startY: number; time: number; vx: number; vy: number; dragged: boolean } | null = null
    const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value))
    const stop = () => { cancelAnimationFrame(frame); frame = 0 }
    const measure = () => {
      stop()
      maxX = Math.max(0, el.scrollWidth - el.clientWidth)
      maxY = Math.max(0, el.scrollHeight - el.clientHeight)
      el.scrollLeft = initialized ? clamp(el.scrollLeft, maxX) : maxX / 2
      el.scrollTop = initialized ? clamp(el.scrollTop, maxY) : maxY / 2
      targetX = el.scrollLeft; targetY = el.scrollTop; initialized = true
    }
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    observer.observe(el.firstElementChild!)
    measure()
    const down = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return
      stop(); suppressClick.current = false
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, time: performance.now(), vx: 0, vy: 0, dragged: false }
    }
    const move = (event: PointerEvent) => {
      if (!pointer || event.pointerId !== pointer.id) return
      const now = performance.now()
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y
      if (!pointer.dragged && Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > 5) {
        pointer.dragged = true; suppressClick.current = true
        el.setPointerCapture(event.pointerId); el.dataset.dragging = "true"
      }
      if (pointer.dragged) {
        const dt = Math.max(8, now - pointer.time)
        pointer.vx = -dx / dt; pointer.vy = -dy / dt
        el.scrollLeft = clamp(el.scrollLeft - dx, maxX)
        el.scrollTop = clamp(el.scrollTop - dy, maxY)
        event.preventDefault()
      }
      pointer.x = event.clientX; pointer.y = event.clientY; pointer.time = now
    }
    const up = (event: PointerEvent) => {
      if (!pointer || event.pointerId !== pointer.id) return
      const released = pointer; pointer = null; delete el.dataset.dragging
      if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId)
      if (!released.dragged || event.type !== "pointerup" || reduced.matches || performance.now() - released.time > 90) return
      let vx = released.vx, vy = released.vy, last = performance.now()
      const coast = (now: number) => {
        const dt = Math.min(32, now - last); last = now
        const x = el.scrollLeft + vx * dt, y = el.scrollTop + vy * dt
        el.scrollLeft = clamp(x, maxX); el.scrollTop = clamp(y, maxY)
        targetX = el.scrollLeft; targetY = el.scrollTop
        vx *= Math.exp(-dt / 230); vy *= Math.exp(-dt / 230)
        if (x <= 0 || x >= maxX) vx = 0
        if (y <= 0 || y >= maxY) vy = 0
        if (Math.hypot(vx, vy) > .015) frame = requestAnimationFrame(coast)
        else frame = 0
      }
      frame = requestAnimationFrame(coast)
    }
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || pointer) return
      event.preventDefault()
      if (!frame) { targetX = el.scrollLeft; targetY = el.scrollTop }
      stop()
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? el.clientHeight : 1
      targetX = clamp(targetX + (event.shiftKey ? event.deltaY + event.deltaX : event.deltaX) * unit, maxX)
      targetY = clamp(targetY + (event.shiftKey ? 0 : event.deltaY) * unit, maxY)
      if (reduced.matches) { el.scrollTo(targetX, targetY); return }
      let last = performance.now()
      const glide = (now: number) => {
        const factor = 1 - Math.exp(-(now - last) / 65); last = now
        el.scrollLeft += (targetX - el.scrollLeft) * factor
        el.scrollTop += (targetY - el.scrollTop) * factor
        if (Math.hypot(targetX - el.scrollLeft, targetY - el.scrollTop) > 1) frame = requestAnimationFrame(glide)
        else { el.scrollTo(targetX, targetY); frame = 0 }
      }
      frame = requestAnimationFrame(glide)
    }
    const key = (event: KeyboardEvent) => {
      const offsets: Record<string, [number, number]> = { ArrowLeft: [-160, 0], ArrowRight: [160, 0], ArrowUp: [0, -200], ArrowDown: [0, 200] }
      const offset = offsets[event.key]
      if (!offset) return
      event.preventDefault(); stop()
      el.scrollBy({ left: offset[0], top: offset[1], behavior: reduced.matches ? "instant" : "smooth" })
    }
    el.addEventListener("pointerdown", down)
    window.addEventListener("pointermove", move, { passive: false })
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
    el.addEventListener("wheel", wheel, { passive: false })
    el.addEventListener("keydown", key)
    return () => {
      stop(); observer.disconnect()
      el.removeEventListener("pointerdown", down)
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
      el.removeEventListener("wheel", wheel)
      el.removeEventListener("keydown", key)
    }
  }, [])

  return <section className={styles.board} aria-label="آرشیو تعاملی تصاویر">
    <div className={styles.viewport} ref={viewport} dir="ltr" tabIndex={0} aria-label="برای کاوش بکشید یا از کلیدهای جهت استفاده کنید">
      <div className={styles.grid} data-labels={labels}>
        {tiles.map((tile, index) => <button key={index} type="button" className={styles.tile} aria-label={`نمایش ${tile[0]}`} onClick={(event) => {
          if (event.detail !== 0 && suppressClick.current) return
          setSelected(tile); dialog.current?.showModal()
        }}>
          {/* Direct images retain the supplied source without a remote optimizer dependency. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={source(tile[2])} alt={tile[0]} width={190} height={240} draggable={false} loading="lazy" />
          <span className={styles.caption} lang="en"><small>{tile[1]}</small><strong>{tile[0]}</strong></span>
        </button>)}
      </div>
    </div>
    <div className={styles.vignette} />
    <div className={styles.hint} lang="en" dir="ltr"><i />Drag to explore</div>
    <button type="button" className={styles.labels} aria-pressed={labels} onClick={() => setLabels(!labels)}>{labels ? "پنهان‌کردن عنوان‌ها" : "نمایش عنوان‌ها"}</button>
    <dialog ref={dialog} className={styles.preview} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close() }}>
      {selected && <div>
        <button type="button" autoFocus onClick={() => dialog.current?.close()} aria-label="بستن تصویر">×</button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={source(selected[2], 1200)} alt={selected[0]} />
        <p lang="en" dir="ltr"><small>{selected[1]}</small><strong>{selected[0]}</strong></p>
      </div>}
    </dialog>
  </section>
}
