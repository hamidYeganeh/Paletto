"use client"
import { useEffect, useRef, useState } from "react"
import type * as THREE from "three"
type Work = {
  id: string
  image: string
  title: string
  artist: string
  year: string
}
export function GalleryCanvas({
  works,
  index,
  template,
  onExplore,
}: {
  works: Work[]
  index: number
  template: string
  onExplore: () => void
}) {
  const exploreRef = useRef(onExplore)
  useEffect(() => {
    exploreRef.current = onExplore
  }, [onExplore])
  const markerRef = useRef<HTMLSpanElement>(null)
  const held = useRef(new Set<string>())
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controls = useRef<{
    focus: (i: number) => void
    theme: (name: string) => void
    home: () => void
    manual: () => void
  } | null>(null)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    let dispose: (() => void) | undefined
    void import("three")
      .then((T) => {
        if (cancelled) return
        const renderer = new T.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: false,
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
        renderer.outputColorSpace = T.SRGBColorSpace
        renderer.toneMapping = T.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.25
        const scene = new T.Scene()
        const camera = new T.PerspectiveCamera(48, 1, 0.1, 200)
        const length = Math.max(14, works.length * 4.5 + 4)
        const wall = new T.MeshStandardMaterial({
          color: "#f0ede5",
          roughness: 0.92,
        })
        const floor = new T.MeshStandardMaterial({
          color: "#bab3a6",
          roughness: 0.8,
        })
        const ceiling = new T.MeshStandardMaterial({
          color: "#e2ded4",
          roughness: 1,
        })
        const frameMaterial = new T.MeshStandardMaterial({
          color: "#443b2f",
          roughness: 0.7,
        })
        const railMaterial = new T.MeshStandardMaterial({
          color: "#35342f",
          roughness: 0.5,
        })
        const geometries: THREE.BufferGeometry[] = []
        const materials: THREE.Material[] = [
          wall,
          floor,
          ceiling,
          frameMaterial,
          railMaterial,
        ]
        const textures: THREE.Texture[] = []
        const box = (
          w: number,
          h: number,
          d: number,
          x: number,
          y: number,
          z: number,
          material: THREE.Material
        ) => {
          const geometry = new T.BoxGeometry(w, h, d)
          geometries.push(geometry)
          const mesh = new T.Mesh(geometry, material)
          mesh.position.set(x, y, z)
          scene.add(mesh)
          return mesh
        }
        box(length, 0.15, 12, 0, -0.1, 0, floor)
        box(length, 5, 0.2, 0, 2.5, -4.1, wall)
        box(length, 5, 0.2, 0, 2.5, 5.9, wall)
        box(0.2, 5, 12, -length / 2, 2.5, 0, wall)
        box(0.2, 5, 12, length / 2, 2.5, 0, wall)
        box(length, 0.15, 12, 0, 5, 0, ceiling)
        box(length, 0.05, 0.07, 0, 4.85, -1.6, railMaterial)
        box(length, 0.08, 0.07, 0, 0.06, -3.94, ceiling)
        for (let x = -length / 2; x < length / 2; x += 1.2)
          box(0.009, 0.003, 12, x, -0.02, 0, ceiling)
        scene.add(new T.HemisphereLight("#fffaf0", "#676258", 2.6))
        const light = new T.DirectionalLight("#fff9ed", 2)
        light.position.set(2, 5, 4)
        scene.add(light)
        const loader = new T.TextureLoader()
        let targetX = 0
        let yaw = 0
        let pitch = 0
        let guided = true
        let lastTime = performance.now()
        camera.rotation.order = "YXZ"
        const manual = () => {
          exploreRef.current()
          guided = false
        }
        const home = () => {
          held.current.clear()
          camera.position.set(positionFor(0), 1.8, 3.8)
          yaw = 0
          pitch = 0
          guided = false
          exploreRef.current()
          dirty = true
        }
        let animation = 0
        let visible = true
        let dirty = true
        const positionFor = (i: number) => (i - (works.length - 1) / 2) * 4.5
        const show = (i: number) => {
          targetX = positionFor(i)
          guided = true
          held.current.clear()
          dirty = true
        }
        const theme = (name: string) => {
          const palette =
            name === "dark"
              ? ["#292a28", "#353630", "#262724"]
              : name === "industrial"
                ? ["#aba79e", "#87877d", "#8e8b84"]
                : name === "house"
                  ? ["#e7d9c0", "#ab8961", "#ded0b6"]
                  : ["#f0ede5", "#bab3a6", "#e2ded4"]
          wall.color.set(palette[0]!)
          floor.color.set(palette[1]!)
          ceiling.color.set(palette[2]!)
          scene.background = new T.Color(palette[0]!)
          dirty = true
        }
        for (const [i, work] of works.entries()) {
          const x = positionFor(i)
          const backing = box(2.45, 1.85, 0.08, x, 2, -3.94, frameMaterial)
          const artMaterial = new T.MeshBasicMaterial({ color: "#eeece5" })
          materials.push(artMaterial)
          const art = box(2.31, 1.71, 0.012, x, 2, -3.88, artMaterial)
          loader.load(
            work.image,
            (texture) => {
              if (cancelled) {
                texture.dispose()
                return
              }
              textures.push(texture)
              texture.colorSpace = T.SRGBColorSpace
              const image = texture.image as { width: number; height: number }
              const aspect = image.width / image.height
              const h = Math.min(2.5, 2.7 / aspect)
              const w = h * aspect
              backing.scale.set((w + 0.14) / 2.45, (h + 0.14) / 1.85, 1)
              art.scale.set(w / 2.31, h / 1.71, 1)
              artMaterial.map = texture
              artMaterial.color.set("#ffffff")
              artMaterial.needsUpdate = true
              dirty = true
            },
            undefined,
            () => {
              dirty = true
            }
          )
          const lamp = box(0.12, 0.15, 0.3, x, 4.75, -1.6, railMaterial)
          lamp.rotation.x = -0.5
          const plaqueCanvas = document.createElement("canvas")
          plaqueCanvas.width = 640
          plaqueCanvas.height = 200
          const ctx = plaqueCanvas.getContext("2d")!
          ctx.fillStyle = "#f8f6ef"
          ctx.fillRect(0, 0, 640, 200)
          ctx.fillStyle = "#272622"
          ctx.textAlign = "right"
          ctx.direction = "rtl"
          ctx.font = "bold 38px sans-serif"
          ctx.fillText(work.title, 605, 70)
          ctx.font = "28px sans-serif"
          ctx.fillText(`${work.artist} · ${work.year}`, 605, 125)
          const plaqueTexture = new T.CanvasTexture(plaqueCanvas)
          textures.push(plaqueTexture)
          const plaqueMaterial = new T.MeshBasicMaterial({ map: plaqueTexture })
          materials.push(plaqueMaterial)
          box(0.85, 0.265, 0.012, x + 1.6, 1.15, -3.96, plaqueMaterial)
        }
        camera.position.set(positionFor(0), 1.8, 3.8)
        const resize = () => {
          const width = canvas.clientWidth
          const height = canvas.clientHeight
          renderer.setSize(width, height, false)
          camera.aspect = width / Math.max(height, 1)
          camera.updateProjectionMatrix()
          dirty = true
        }
        const observer = new ResizeObserver(resize)
        observer.observe(canvas)
        resize()
        const intersection = new IntersectionObserver(([entry]) => {
          visible = !!entry?.isIntersecting
          dirty = true
        })
        intersection.observe(canvas)
        let drag: { id: number; x: number; y: number } | null = null
        const down = (e: PointerEvent) => {
          if (e.button !== 0) return
          canvas.focus({ preventScroll: true })
          canvas.setPointerCapture(e.pointerId)
          drag = { id: e.pointerId, x: e.clientX, y: e.clientY }
          manual()
        }
        const pointer = (e: PointerEvent) => {
          if (!drag || drag.id !== e.pointerId) return
          yaw -= (e.clientX - drag.x) * 0.004
          pitch = T.MathUtils.clamp(
            pitch - (e.clientY - drag.y) * 0.004,
            -1.15,
            1.15
          )
          drag.x = e.clientX
          drag.y = e.clientY
          dirty = true
        }
        const up = () => {
          drag = null
        }
        const movementKeys = new Set([
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "KeyQ",
          "KeyE",
        ])
        const keydown = (e: KeyboardEvent) => {
          if (e.code === "Escape") {
            held.current.clear()
            canvas.blur()
            return
          }
          if (!movementKeys.has(e.code)) return
          e.preventDefault()
          manual()
          held.current.add(e.code)
        }
        const keyup = (e: KeyboardEvent) => {
          held.current.delete(e.code)
        }
        const clear = () => {
          held.current.clear()
          drag = null
        }
        canvas.addEventListener("pointerdown", down)
        canvas.addEventListener("pointermove", pointer)
        canvas.addEventListener("pointerup", up)
        canvas.addEventListener("pointercancel", up)
        canvas.addEventListener("lostpointercapture", up)
        canvas.addEventListener("keydown", keydown)
        canvas.addEventListener("blur", clear)
        window.addEventListener("keyup", keyup)
        window.addEventListener("blur", clear)
        document.addEventListener("visibilitychange", clear)
        const reduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
        const tick = () => {
          if (cancelled) return
          animation = requestAnimationFrame(tick)
          const now = performance.now()
          const dt = Math.min((now - lastTime) / 1000, 0.05)
          lastTime = now
          if (!visible || document.hidden) {
            held.current.clear()
            return
          }
          if (guided) {
            const blend = reduced ? 1 : 1 - Math.exp(-7 * dt)
            camera.position.x += (targetX - camera.position.x) * blend
            camera.position.z += (3.8 - camera.position.z) * blend
            yaw += (0 - yaw) * blend
            pitch += (0 - pitch) * blend
            dirty = true
          } else {
            const keys = held.current
            const forward =
              Number(keys.has("KeyW") || keys.has("ArrowUp")) -
              Number(keys.has("KeyS") || keys.has("ArrowDown"))
            const right =
              Number(keys.has("KeyD") || keys.has("ArrowRight")) -
              Number(keys.has("KeyA") || keys.has("ArrowLeft"))
            const turn = Number(keys.has("KeyQ")) - Number(keys.has("KeyE"))
            yaw += turn * dt * 1.6
            const speed = (2.4 * dt) / Math.max(1, Math.hypot(forward, right))
            camera.position.x = T.MathUtils.clamp(
              camera.position.x +
                (right * Math.cos(yaw) - forward * Math.sin(yaw)) * speed,
              -length / 2 + 0.5,
              length / 2 - 0.5
            )
            camera.position.z = T.MathUtils.clamp(
              camera.position.z +
                (-forward * Math.cos(yaw) - right * Math.sin(yaw)) * speed,
              -3.35,
              5.25
            )
            if (forward || right || turn) dirty = true
          }
          if (dirty) {
            camera.rotation.set(pitch, yaw, 0, "YXZ")
            renderer.render(scene, camera)
            if (markerRef.current) {
              markerRef.current.style.left = `${(camera.position.x / length + 0.5) * 100}%`
              markerRef.current.style.top = `${(camera.position.z + 4) * 10}%`
              markerRef.current.style.transform = `translate(-50%, -50%) rotate(${-yaw}rad)`
            }
            dirty = false
          }
        }
        controls.current = { focus: show, theme, home, manual }
        show(0)
        theme("white")
        tick()
        setReady(true)
        dispose = () => {
          cancelAnimationFrame(animation)
          observer.disconnect()
          intersection.disconnect()
          canvas.removeEventListener("pointermove", pointer)
          canvas.removeEventListener("pointerdown", down)
          canvas.removeEventListener("pointerup", up)
          canvas.removeEventListener("pointercancel", up)
          canvas.removeEventListener("lostpointercapture", up)
          canvas.removeEventListener("keydown", keydown)
          canvas.removeEventListener("blur", clear)
          window.removeEventListener("keyup", keyup)
          window.removeEventListener("blur", clear)
          document.removeEventListener("visibilitychange", clear)
          held.current.clear()
          geometries.forEach((g) => g.dispose())
          materials.forEach((m) => m.dispose())
          textures.forEach((t) => t.dispose())
          renderer.dispose()
          controls.current = null
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
      dispose?.()
    }
  }, [works])
  useEffect(() => {
    controls.current?.focus(index)
  }, [index, ready])
  useEffect(() => {
    controls.current?.theme(template)
  }, [template, ready])
  if (failed)
    return (
      <div className="pt-empty">
        <h2>نمای سه‌بعدی روی این دستگاه در دسترس نیست.</h2>
        <p>از دکمه «نمای ساده آثار» برای دیدن همه آثار استفاده کنید.</p>
      </div>
    )
  return (
    <div className="pt-walk-room">
      <p id="gallery-walk-help" className="pt-walk-help">
        برای گردش، روی سالن بزنید. حرکت: W A S D یا کلیدهای جهت‌نما · چرخش نگاه:
        کشیدن تصویر یا Q و E · خروج از کنترل: Esc
      </p>
      <canvas
        ref={canvasRef}
        tabIndex={ready ? 0 : -1}
        aria-busy={!ready}
        aria-describedby="gallery-walk-help"
        style={{
          width: "100%",
          height: "min(65vh,600px)",
          minHeight: 350,
          display: "block",
          touchAction: "none",
          cursor: ready ? "grab" : "wait",
          pointerEvents: ready ? "auto" : "none",
        }}
        aria-label="سالن سه‌بعدی قابل گردش گالری"
      />
      <div className="pt-walk-hud">
        <div className="pt-walk-map" aria-label="نقشه موقعیت شما در سالن">
          <span className="pt-walk-map-title">شما در سالن</span>
          <span ref={markerRef} className="pt-walk-marker" />
        </div>
        <button
          className="pt-button pt-button-ghost"
          disabled={!ready}
          onClick={() => controls.current?.home()}
        >
          بازگشت به ورودی
        </button>
      </div>
      <div className="pt-walk-pad" role="group" aria-label="کنترل حرکت در سالن">
        {[
          ["KeyW", "جلو", "↑"],
          ["KeyA", "چپ", "←"],
          ["KeyS", "عقب", "↓"],
          ["KeyD", "راست", "→"],
          ["KeyQ", "نگاه به چپ", "↶"],
          ["KeyE", "نگاه به راست", "↷"],
        ].map(([code, label, symbol]) => (
          <button
            key={code}
            disabled={!ready}
            className="pt-button pt-button-ghost"
            aria-label={label}
            onPointerDown={(e) => {
              e.preventDefault()
              e.currentTarget.setPointerCapture(e.pointerId)
              controls.current?.manual()
              held.current.add(code!)
            }}
            onPointerUp={() => held.current.delete(code!)}
            onPointerCancel={() => held.current.delete(code!)}
            onLostPointerCapture={() => held.current.delete(code!)}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault()
                controls.current?.manual()
                held.current.add(code!)
              }
            }}
            onKeyUp={() => held.current.delete(code!)}
            onBlur={() => held.current.delete(code!)}
          >
            {symbol}
            <span>{label}</span>
          </button>
        ))}
      </div>
      {!ready && (
        <div className="pt-loading" role="status">
          در حال آماده‌سازی سالن…
        </div>
      )}
    </div>
  )
}
