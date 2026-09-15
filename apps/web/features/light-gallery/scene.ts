import * as T from "three"
import { moveWithCollision } from "./layout"
import {
  ROOM_PAGE_SIZE,
  sampleTour,
  nearestTourProgress,
  damp,
} from "./navigation"
import type { LightWork } from "./works"

export type SceneHandle = {
  home: () => void
  focus: (index: number) => void
  setPaused: (paused: boolean) => void
  setKey: (key: string, down: boolean) => void
  setNavigationMode: (mode: "scroll" | "walk") => void
  clearKeys: () => void
  dispose: () => void
}
type Options = {
  canvas: HTMLCanvasElement
  works: LightWork[]
  onSelect: (index: number) => void
  onHover: (index: number | null) => void
  onMove: (x: number, z: number, yaw: number) => void
  onLoad: (done: number, total: number) => void
  onError: () => void
}
export function createLightScene({
  canvas,
  works,
  onSelect,
  onHover,
  onMove,
  onLoad,
  onError,
}: Options): SceneHandle {
  let dead = false,
    dirty = true,
    paused = false,
    raf = 0
  let yaw = 0,
    pitch = 0.035,
    last = performance.now(),
    hover: number | null = null
  const keys = new Set<string>()
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches
  let targetYaw = yaw,
    targetPitch = pitch,
    velocityX = 0,
    velocityZ = 0
  let navigationMode: "scroll" | "walk" = "scroll"
  let tourActive = false,
    tourProgress = 0,
    tourTarget = 0,
    tourLookOffset = 0,
    joiningTour = false
  const stopMotion = () => {
    velocityX = velocityZ = 0
    tourTarget = tourProgress
    targetYaw = yaw
    targetPitch = pitch
  }
  const manual = () => {
    tourActive = false
  }
  canvas.dataset.artworkIds = JSON.stringify(
    works.slice(0, ROOM_PAGE_SIZE).map((work) => work.id)
  )
  const scene = new T.Scene()
  scene.background = new T.Color("#eeeae2")
  const camera = new T.PerspectiveCamera(55, 1, 0.05, 80)
  camera.rotation.order = "YXZ"
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6))
  renderer.outputColorSpace = T.SRGBColorSpace
  renderer.toneMapping = T.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.12
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = T.PCFShadowMap
  const textures: T.Texture[] = []
  const geometries: T.BufferGeometry[] = []
  const materials: T.Material[] = []
  const pickables: T.Object3D[] = []
  const artGroups: T.Group[] = []
  const positions: {
    x: number
    y: number
    z: number
    angle: number
    w: number
    h: number
  }[] = [
    { x: -1.2, y: 2.06, z: -2.515, angle: 0, w: 2.55, h: 2.6 },
    { x: 1.66, y: 2.65, z: -2.515, angle: 0, w: 0.75, h: 0.93 },
    { x: 1.66, y: 1.51, z: -2.515, angle: 0, w: 0.75, h: 0.88 },
    { x: -6.82, y: 2.1, z: -0.7, angle: Math.PI / 2, w: 2.85, h: 2.35 },
    { x: 6.82, y: 2.15, z: -0.2, angle: -Math.PI / 2, w: 2.6, h: 2.2 },
    { x: -6.82, y: 2.15, z: -5, angle: Math.PI / 2, w: 2, h: 2.2 },
    { x: -0.5, y: 2.1, z: -6.82, angle: 0, w: 2.6, h: 2.1 },
    { x: 3.8, y: 2.1, z: 7.83, angle: Math.PI, w: 2.5, h: 2.2 },
    { x: -3.8, y: 2.1, z: 7.83, angle: Math.PI, w: 2.5, h: 2.2 },
    { x: 6.82, y: 2.15, z: -4.5, angle: -Math.PI / 2, w: 2.5, h: 2.2 },
    { x: -0.4, y: 2.1, z: -2.88, angle: Math.PI, w: 2.5, h: 2.2 },
    { x: 6.82, y: 2.1, z: -9, angle: -Math.PI / 2, w: 1.6, h: 1.8 },
  ]
  const maxSlots = Math.min(ROOM_PAGE_SIZE, positions.length)
  // Seeded surface detail is deterministic and independent of frame rate.
  let seed = 7301
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  function surface(base: number, variation: number, wood = false) {
    const c = document.createElement("canvas")
    c.width = c.height = 512
    const ctx = c.getContext("2d")!
    const data = ctx.createImageData(512, 512)
    for (let y = 0; y < 512; y++)
      for (let x = 0; x < 512; x++) {
        const n = (random() - 0.5) * variation
        const grain = wood
          ? Math.sin(y * 0.85 + Math.sin(x * 0.014) * 2) * 3
          : 0
        const v = base + n + grain,
          i = (y * 512 + x) * 4
        data.data[i] = v
        data.data[i + 1] = wood ? v * 0.76 : v * 0.985
        data.data[i + 2] = wood ? v * 0.51 : v * 0.95
        data.data[i + 3] = 255
      }
    ctx.putImageData(data, 0, 0)
    if (!wood && variation > 8) {
      for (let i = 0; i < 75; i++) {
        const x = random() * 512,
          y = random() * 512,
          r = 25 + random() * 100
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
        gradient.addColorStop(
          0,
          i % 2 ? "rgba(105,101,95,.07)" : "rgba(238,232,221,.09)"
        )
        gradient.addColorStop(1, "rgba(190,187,180,0)")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 512, 512)
      }
    }
    const texture = new T.CanvasTexture(c)
    texture.colorSpace = T.SRGBColorSpace
    texture.wrapS = texture.wrapT = T.RepeatWrapping
    texture.repeat.set(wood ? 2 : 5, wood ? 1 : 5)
    textures.push(texture)
    return texture
  }
  const makeMat = (opts: T.MeshStandardMaterialParameters) => {
    const m = new T.MeshStandardMaterial(opts)
    materials.push(m)
    return m
  }
  const plasterMap = surface(235, 8),
    concreteMap = surface(190, 9),
    woodMap = surface(150, 14, true)
  const plaster = makeMat({
    map: plasterMap,
    roughness: 0.94,
    bumpMap: plasterMap,
    bumpScale: 0.002,
  })
  const concrete = makeMat({
    map: concreteMap,
    roughness: 0.68,
    bumpMap: concreteMap,
    bumpScale: 0.003,
  })
  const wood = makeMat({
    map: woodMap,
    roughness: 0.69,
    bumpMap: woodMap,
    bumpScale: 0.009,
  })
  const stone = makeMat({
    color: "#c9bfaa",
    map: plasterMap,
    roughness: 0.88,
    bumpMap: concreteMap,
    bumpScale: 0.045,
  })
  const rail = makeMat({ color: "#302e29", roughness: 0.62 })
  const frame = makeMat({ color: "#4c3829", roughness: 0.75 })
  function mesh(
    geo: T.BufferGeometry,
    mat: T.Material,
    x: number,
    y: number,
    z: number,
    parent: T.Object3D = scene
  ) {
    geometries.push(geo)
    const m = new T.Mesh(geo, mat)
    m.position.set(x, y, z)
    m.castShadow = true
    m.receiveShadow = true
    parent.add(m)
    return m
  }
  function box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat: T.Material = plaster,
    selectable = true,
    parent: T.Object3D = scene
  ) {
    const m = mesh(new T.BoxGeometry(w, h, d), mat, x, y, z, parent)
    if (mat.transparent) m.castShadow = false
    if (selectable) pickables.push(m)
    return m
  }
  box(14, 0.2, 20, 0, -0.11, -2, concrete)
  box(0.28, 3.85, 15, -7, 1.925, 0.5)
  box(0.28, 0.25, 15, -7, 5.08, 0.5)
  box(0.28, 5.2, 20, 7, 2.6, -2)
  box(14, 5.2, 0.25, 0, 2.6, 8)
  box(14, 0.22, 15, 0, 5.3, 0.5)
  box(5.9, 3.9, 0.3, -0.35, 1.95, -2.7)
  // Rear openings: left passage and a tall courtyard opening on the right.
  box(1.3, 5.2, 0.25, -6.35, 2.6, -7)
  box(7.1, 5.2, 0.25, -0.65, 2.6, -7)
  box(0.7, 5.2, 0.25, 6.65, 2.6, -7)
  box(1.5, 2.35, 0.25, -4.95, 4.025, -7)
  box(3.4, 1.75, 0.25, 4.6, 4.325, -7)
  // Left opening is a shallow side gallery, with a visible rear wall.
  box(3, 3, 0.25, -4.9, 1.5, -8.2)
  box(0.25, 3, 1.2, -6.3, 1.5, -7.6)
  box(0.25, 3, 1.2, -3.5, 1.5, -7.6)
  box(0.25, 4.2, 5, 2.8, 2.1, -9.5)
  box(4.2, 4.2, 0.25, 4.9, 2.1, -12)
  const glass = new T.MeshBasicMaterial({
    color: "#e8f2f0",
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: T.DoubleSide,
  })
  materials.push(glass)
  for (let z = -6.1; z < 8; z += 2.05) {
    box(0.07, 1.18, 0.055, -6.95, 4.46, z, rail, false)
    box(0.045, 1.08, 1.98, -6.97, 4.47, z + 0.99, glass, false)
  }
  box(0.25, 0.08, 15, -6.87, 3.86, 0.5, stone, false)
  // Oak bench from the reference: a single slab and two flush end legs.
  box(4.4, 0.14, 0.58, 0, 0.54, 1.8, wood)
  box(0.16, 0.47, 0.58, -2.12, 0.235, 1.8, wood)
  box(0.16, 0.47, 0.58, 2.12, 0.235, 1.8, wood)
  box(0.82, 0.88, 0.82, 3.15, 0.44, -1.1, stone)
  const sculpture = mesh(
    new T.SphereGeometry(0.49, 48, 32),
    stone,
    3.15,
    1.35,
    -1.1
  )
  const pa = sculpture.geometry.getAttribute("position")
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i),
      y = pa.getY(i),
      z = pa.getZ(i),
      f = 1 + 0.1 * Math.sin(x * 7 + y * 5) + 0.07 * Math.cos(z * 9)
    pa.setXYZ(i, x * f * 0.76, y * f * 1.2, z * f * 0.78)
  }
  sculpture.geometry.computeVertexNormals()
  sculpture.rotation.z = -0.18
  box(2.4, 0.15, 0.6, 4.6, 0.58, -11.2, stone)
  box(0.2, 0.5, 0.6, 3.5, 0.25, -11.2, stone)
  box(0.2, 0.5, 0.6, 5.7, 0.25, -11.2, stone)
  // Two restrained black ceiling tracks.
  for (const x of [-4.25, 3.9]) {
    box(0.045, 0.04, 13, x, 5.13, 0.4, rail, false)
    for (let z = -5; z < 7; z += 3) {
      const lamp = mesh(
        new T.CylinderGeometry(0.055, 0.075, 0.23, 12),
        rail,
        x,
        4.97,
        z
      )
      lamp.rotation.z = x < 0 ? -0.5 : 0.5
      const lit = makeMat({
        color: "#fff3d6",
        emissive: "#fff3d6",
        emissiveIntensity: 2,
      })
      mesh(
        new T.SphereGeometry(0.04, 8, 6),
        lit,
        x + (x < 0 ? -0.045 : 0.045),
        4.86,
        z
      )
    }
  }
  // Diffuse skylight plus a single shadow-casting sun through the clerestory.
  scene.add(new T.HemisphereLight("#fff8ec", "#aca496", 1.6))
  const sun = new T.DirectionalLight("#fff0d6", 3.1)
  sun.position.set(-10, 5.7, 1)
  sun.target.position.set(2, 0, -1)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, {
    left: -16,
    right: 16,
    top: 16,
    bottom: -16,
    near: 0.5,
    far: 40,
  })
  sun.shadow.bias = -0.00025
  sun.shadow.normalBias = 0.035
  scene.add(sun, sun.target)
  const fill = new T.DirectionalLight("#e7f0ff", 0.65)
  fill.position.set(3, 4, 7)
  scene.add(fill)
  const courtyardLight = new T.PointLight("#fff7e5", 38, 12, 2)
  courtyardLight.position.set(5.3, 4, -9)
  scene.add(courtyardLight)
  // Contact shadows add grounding while keeping realtime shadow cost bounded.
  const shadowCanvas = document.createElement("canvas")
  shadowCanvas.width = shadowCanvas.height = 128
  const sc = shadowCanvas.getContext("2d")!,
    g = sc.createRadialGradient(64, 64, 8, 64, 64, 64)
  g.addColorStop(0, "rgba(45,36,24,.42)")
  g.addColorStop(1, "rgba(45,36,24,0)")
  sc.fillStyle = g
  sc.fillRect(0, 0, 128, 128)
  const st = new T.CanvasTexture(shadowCanvas)
  textures.push(st)
  const sm = new T.MeshBasicMaterial({
    map: st,
    transparent: true,
    depthWrite: false,
  })
  materials.push(sm)
  for (const [x, z, w, d] of [
    [0, 1.8, 5.7, 2.3],
    [3.15, -1.1, 2.2, 2.2],
    [-0.35, -2.7, 7, 1.6],
    [-6.85, 0.4, 1.2, 15],
    [6.85, 0.4, 1.2, 15],
  ]) {
    const m = mesh(new T.PlaneGeometry(w, d), sm, x!, 0.004, z!)
    m.rotation.x = -Math.PI / 2
    m.castShadow = false
  }
  // An open courtyard with a branching olive tree and individually oriented leaves.
  const bark = makeMat({
    color: "#776851",
    roughness: 1,
    bumpMap: concreteMap,
    bumpScale: 0.035,
  })
  const leaf = makeMat({
    color: "#778168",
    roughness: 0.86,
    side: T.DoubleSide,
  })
  function branch(a: T.Vector3, b: T.Vector3, r: number) {
    const delta = b.clone().sub(a),
      m = mesh(
        new T.CylinderGeometry(r * 0.5, r, delta.length(), 8),
        bark,
        ...(a.clone().add(b).multiplyScalar(0.5).toArray() as [
          number,
          number,
          number,
        ])
      )
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize())
  }
  const root = new T.Vector3(5.8, 0, -10.55),
    fork = new T.Vector3(5.5, 1.8, -10.4)
  branch(root, fork, 0.1)
  const leafGeo = new T.PlaneGeometry(0.14, 0.045)
  geometries.push(leafGeo)
  const leaves = new T.InstancedMesh(leafGeo, leaf, 950)
  leaves.castShadow = true
  scene.add(leaves)
  const dummy = new T.Object3D()
  for (let j = 0; j < 12; j++) {
    const angle = j * 2.4,
      tip = new T.Vector3(
        5.5 + Math.cos(angle) * (1 + random() * 0.6),
        2.6 + random() * 1.4,
        -10.4 + Math.sin(angle) * (1 + random() * 0.5)
      )
    branch(fork, tip, 0.035)
    for (let k = 0; k < 79; k++) {
      const t = random(),
        i = j * 79 + k
      dummy.position
        .copy(fork)
        .lerp(tip, 0.4 + t * 0.6)
        .add(
          new T.Vector3(
            (random() - 0.5) * 1.35,
            (random() - 0.5) * 0.85,
            (random() - 0.5) * 1.1
          )
        )
      dummy.rotation.set(
        random() * Math.PI,
        random() * Math.PI,
        random() * Math.PI
      )
      dummy.updateMatrix()
      leaves.setMatrixAt(i, dummy.matrix)
    }
  }
  leaves.count = 948
  leaves.instanceMatrix.needsUpdate = true
  for (let i = 0; i < 18; i++) {
    const m = mesh(
      new T.IcosahedronGeometry(0.22 + random() * 0.12, 1),
      leaf,
      3.25 + random() * 3.3,
      0.2,
      -11.65 + random() * 0.3
    )
    m.scale.y = 0.6
  }
  const loader = new T.TextureLoader()
  const total = Math.min(works.length, maxSlots)
  let loaded = 0
  function done() {
    loaded++
    onLoad(loaded, total)
    dirty = true
  }
  works.slice(0, maxSlots).forEach((work, i) => {
    const p = positions[i]!,
      group = new T.Group()
    group.position.set(p.x, p.y, p.z)
    group.rotation.y = p.angle
    scene.add(group)
    artGroups.push(group)
    const backing = box(
      p.w + 0.06,
      p.h + 0.06,
      0.055,
      0,
      0,
      0,
      frame,
      true,
      group
    )
    const artMat = makeMat({ color: "#c9c0ae", roughness: 0.92 })
    const painting = mesh(
      new T.PlaneGeometry(p.w, p.h),
      artMat,
      0,
      0,
      0.032,
      group
    )
    painting.userData.workIndex = i
    backing.userData.workIndex = i
    pickables.push(painting)
    loader.load(
      work.image,
      (texture) => {
        if (dead) {
          texture.dispose()
          return
        }
        textures.push(texture)
        texture.colorSpace = T.SRGBColorSpace
        texture.anisotropy = Math.min(
          8,
          renderer.capabilities.getMaxAnisotropy()
        )
        let aspect: number
        if (work.crop) {
          const [x, y, w, h] = work.crop
          texture.repeat.set(w, h)
          texture.offset.set(x, 1 - y - h)
          aspect = (1672 * w) / (941 * h)
        } else {
          const image = texture.image as { width: number; height: number }
          aspect = image.width / image.height
        }
        const h = Math.min(p.h, p.w / aspect),
          w = h * aspect
        painting.scale.set(w / p.w, h / p.h, 1)
        backing.scale.set(
          (w + 0.06) / (p.w + 0.06),
          (h + 0.06) / (p.h + 0.06),
          1
        )
        artMat.map = texture
        artMat.color.set("#ffffff")
        artMat.needsUpdate = true
        done()
      },
      undefined,
      () => {
        painting.userData.loadFailed = true
        done()
      }
    )
    // Small real label beneath each work; large details remain accessible in HTML.
    const labelCanvas = document.createElement("canvas")
    labelCanvas.width = 512
    labelCanvas.height = 128
    const ctx = labelCanvas.getContext("2d")!
    ctx.fillStyle = "#eae6dd"
    ctx.fillRect(0, 0, 512, 128)
    ctx.direction = "rtl"
    ctx.textAlign = "right"
    ctx.fillStyle = "#39342c"
    ctx.font = "25px sans-serif"
    ctx.fillText(work.title, 486, 48)
    ctx.font = "18px sans-serif"
    ctx.fillText(work.artist, 486, 87)
    const tx = new T.CanvasTexture(labelCanvas)
    textures.push(tx)
    const mat = new T.MeshBasicMaterial({ map: tx })
    materials.push(mat)
    mesh(
      new T.PlaneGeometry(0.44, 0.11),
      mat,
      p.w * 0.5 - 0.2,
      -p.h * 0.5 - 0.18,
      0.036,
      group
    )
  })
  const home = () => {
    keys.clear()
    camera.position.set(0, 1.68, 7.2)
    yaw = 0
    pitch = 0.035
    tourActive = false
    tourProgress = tourTarget = tourLookOffset = 0
    stopMotion()
    dirty = true
  }
  home()
  const resize = () => {
    const w = canvas.clientWidth,
      h = canvas.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / Math.max(h, 1)
    camera.updateProjectionMatrix()
    dirty = true
  }
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  resize()
  const raycaster = new T.Raycaster(),
    pointer = new T.Vector2()
  const pick = (x: number, y: number) => {
    const r = canvas.getBoundingClientRect()
    pointer.set(
      ((x - r.left) / r.width) * 2 - 1,
      (-(y - r.top) / r.height) * 2 + 1
    )
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects(pickables, false)[0]
    return hit && typeof hit.object.userData.workIndex === "number"
      ? (hit.object.userData.workIndex as number)
      : null
  }
  let drag: {
    id: number
    x: number
    y: number
    distance: number
    touch: boolean
    axis: "x" | "y" | null
  } | null = null
  const scrollTour = (delta: number) => {
    if (paused || navigationMode !== "scroll") return
    if (!tourActive) {
      const previousPoint = sampleTour(tourProgress)
      if (
        Math.hypot(
          camera.position.x - previousPoint.x,
          camera.position.z - previousPoint.z
        ) > 0.03
      ) {
        tourProgress = tourTarget = nearestTourProgress(
          camera.position.x,
          camera.position.z
        )
      }
      const entry = sampleTour(tourProgress)
      joiningTour =
        Math.hypot(camera.position.x - entry.x, camera.position.z - entry.z) >
        0.03
      tourLookOffset = 0
      tourActive = true
    }
    keys.clear()
    velocityX = velocityZ = 0
    tourTarget = T.MathUtils.clamp(tourTarget + delta * 0.00018, 0, 1)
    dirty = true
  }
  const wheel = (e: WheelEvent) => {
    if (paused || navigationMode !== "scroll" || e.ctrlKey) return
    e.preventDefault()
    const scale =
      e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? canvas.clientHeight : 1
    scrollTour(e.deltaY * scale)
  }
  const down = (e: PointerEvent) => {
    if (paused || e.button !== 0 || drag) return
    canvas.focus({ preventScroll: true })
    canvas.setPointerCapture(e.pointerId)
    drag = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      distance: 0,
      touch: e.pointerType === "touch",
      axis: null,
    }
  }
  const move = (e: PointerEvent) => {
    if (paused) return
    if (drag && e.pointerId === drag.id) {
      const dx = e.clientX - drag.x,
        dy = e.clientY - drag.y
      drag.distance += Math.abs(dx) + Math.abs(dy)
      if (!drag.axis && drag.distance >= 7)
        drag.axis = Math.abs(dy) > Math.abs(dx) ? "y" : "x"
      if (drag.touch && navigationMode === "scroll") {
        if (drag.axis === "y") scrollTour(-dy)
        else if (drag.axis === "x") {
          if (tourActive) tourLookOffset -= dx * 0.004
          else targetYaw -= dx * 0.004
        }
      } else {
        manual()
        targetYaw -= dx * 0.003
        targetPitch = T.MathUtils.clamp(targetPitch - dy * 0.003, -1.15, 1.15)
      }
      drag.x = e.clientX
      drag.y = e.clientY
      dirty = true
    } else if (!drag) {
      const next = pick(e.clientX, e.clientY)
      if (next !== hover) {
        hover = next
        onHover(next)
        canvas.style.cursor = next === null ? "grab" : "pointer"
      }
    }
  }
  const up = (e: PointerEvent) => {
    if (drag?.id !== e.pointerId) return
    if (drag.distance < 7 && !paused) {
      const hit = pick(e.clientX, e.clientY)
      if (hit !== null) {
        keys.clear()
        stopMotion()
        onSelect(hit)
      }
    }
    drag = null
  }
  const clear = () => {
    manual()
    keys.clear()
    drag = null
    stopMotion()
  }
  const lostCapture = () => {
    if (drag) clear()
  }
  const codes = new Set([
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
    if (paused) return
    if (codes.has(e.code)) {
      e.preventDefault()
      manual()
      keys.add(e.code)
    }
    if (e.code === "Escape") {
      clear()
      canvas.blur()
    }
    if (e.code === "Enter") {
      e.preventDefault()
      const r = canvas.getBoundingClientRect(),
        hit = pick(r.left + r.width / 2, r.top + r.height / 2)
      if (hit !== null) onSelect(hit)
    }
  }
  const keyup = (e: KeyboardEvent) => keys.delete(e.code)
  const lost = (e: Event) => {
    e.preventDefault()
    clear()
    onError()
  }
  canvas.addEventListener("pointerdown", down)
  canvas.addEventListener("pointermove", move)
  canvas.addEventListener("pointerup", up)
  canvas.addEventListener("pointercancel", clear)
  canvas.addEventListener("lostpointercapture", lostCapture)
  canvas.addEventListener("wheel", wheel, { passive: false })
  canvas.addEventListener("keydown", keydown)
  canvas.addEventListener("blur", clear)
  canvas.addEventListener("webglcontextlost", lost)
  window.addEventListener("keyup", keyup)
  window.addEventListener("blur", clear)
  document.addEventListener("visibilitychange", clear)
  function tick(now: number) {
    if (dead) return
    raf = requestAnimationFrame(tick)
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    if (document.hidden || paused) return
    const f =
      Number(keys.has("KeyW") || keys.has("ArrowUp")) -
      Number(keys.has("KeyS") || keys.has("ArrowDown"))
    const r =
      Number(keys.has("KeyD") || keys.has("ArrowRight")) -
      Number(keys.has("KeyA") || keys.has("ArrowLeft"))
    const turn = Number(keys.has("KeyQ")) - Number(keys.has("KeyE"))
    if (tourActive && joiningTour) {
      const entry = sampleTour(tourProgress)
      const dx = entry.x - camera.position.x,
        dz = entry.z - camera.position.z,
        distance = Math.hypot(dx, dz)
      const step = reducedMotion
        ? 1
        : Math.min(1, (3 * dt) / Math.max(0.001, distance))
      const pos = moveWithCollision(
        camera.position.x,
        camera.position.z,
        dx * step,
        dz * step
      )
      camera.position.x = pos.x
      camera.position.z = pos.z
      joiningTour = Math.hypot(entry.x - pos.x, entry.z - pos.z) > 0.015
      dirty = true
    }
    if (tourActive) {
      const previous = tourProgress
      const eased = joiningTour
        ? tourProgress
        : reducedMotion
          ? tourTarget
          : damp(tourProgress, tourTarget, 9, dt)
      tourProgress += reducedMotion
        ? eased - tourProgress
        : T.MathUtils.clamp(eased - tourProgress, -dt * 0.09, dt * 0.09)
      if (Math.abs(tourProgress - tourTarget) < 0.00001)
        tourProgress = tourTarget
      // Follow every corner rather than cutting through walls on a large swipe.
      const steps = Math.max(
        1,
        Math.ceil(Math.abs(tourProgress - previous) / 0.002)
      )
      for (let i = 1; !joiningTour && i <= steps; i++) {
        const point = sampleTour(
          previous + ((tourProgress - previous) * i) / steps
        )
        const pos = moveWithCollision(
          camera.position.x,
          camera.position.z,
          point.x - camera.position.x,
          point.z - camera.position.z
        )
        camera.position.x = pos.x
        camera.position.z = pos.z
      }
      const point = sampleTour(tourProgress)
      const look =
        Math.atan2(
          camera.position.x - point.lookX,
          camera.position.z - point.lookZ
        ) + tourLookOffset
      targetYaw = yaw + Math.atan2(Math.sin(look - yaw), Math.cos(look - yaw))
      targetPitch = Math.atan2(
        0.35,
        Math.max(
          2,
          Math.hypot(
            point.lookX - camera.position.x,
            point.lookZ - camera.position.z
          )
        )
      )
      if (previous !== tourProgress) dirty = true
    } else {
      targetYaw += turn * dt * 1.4
      const speed = 2.7 / Math.max(1, Math.hypot(f, r))
      const desiredX = (r * Math.cos(yaw) - f * Math.sin(yaw)) * speed
      const desiredZ = (-f * Math.cos(yaw) - r * Math.sin(yaw)) * speed
      const response = f || r ? 12 : 20
      velocityX = reducedMotion
        ? desiredX
        : damp(velocityX, desiredX, response, dt)
      velocityZ = reducedMotion
        ? desiredZ
        : damp(velocityZ, desiredZ, response, dt)
      if (Math.abs(velocityX) < 0.003) velocityX = 0
      if (Math.abs(velocityZ) < 0.003) velocityZ = 0
      if (velocityX || velocityZ) {
        const pos = moveWithCollision(
          camera.position.x,
          camera.position.z,
          velocityX * dt,
          velocityZ * dt
        )
        camera.position.x = pos.x
        camera.position.z = pos.z
        dirty = true
      }
    }
    if (
      Math.abs(targetYaw - yaw) > 0.00005 ||
      Math.abs(targetPitch - pitch) > 0.00005
    ) {
      yaw = reducedMotion ? targetYaw : damp(yaw, targetYaw, 18, dt)
      pitch = reducedMotion ? targetPitch : damp(pitch, targetPitch, 18, dt)
      dirty = true
    }
    if (dirty) {
      camera.rotation.set(pitch, yaw, 0)
      camera.updateMatrixWorld()
      renderer.render(scene, camera)
      canvas.dataset.tourProgress = tourProgress.toFixed(5)
      canvas.dataset.look = `${yaw.toFixed(5)},${pitch.toFixed(5)}`
      onMove(camera.position.x, camera.position.z, yaw)
      dirty = false
    }
  }
  tick(performance.now())
  return {
    home,
    focus(i) {
      const p = positions[i]
      if (!p || i >= works.length || i >= ROOM_PAGE_SIZE) return
      clear()
      manual()
      camera.position.set(
        p.x + Math.sin(p.angle) * 3.2,
        1.68,
        p.z + Math.cos(p.angle) * 3.2
      )
      yaw = p.angle
      pitch = Math.atan2(p.y - 1.68, 3.2)
      stopMotion()
      dirty = true
    },
    setPaused(value) {
      paused = value
      clear()
      dirty = true
    },
    setKey(key, down) {
      if (down && !paused) {
        manual()
        keys.add(key)
      } else keys.delete(key)
    },
    setNavigationMode(mode) {
      navigationMode = mode
      clear()
      manual()
    },
    clearKeys: clear,
    dispose() {
      dead = true
      clear()
      cancelAnimationFrame(raf)
      observer.disconnect()
      canvas.removeEventListener("pointerdown", down)
      canvas.removeEventListener("pointermove", move)
      canvas.removeEventListener("pointerup", up)
      canvas.removeEventListener("pointercancel", clear)
      canvas.removeEventListener("lostpointercapture", lostCapture)
      canvas.removeEventListener("wheel", wheel)
      canvas.removeEventListener("keydown", keydown)
      canvas.removeEventListener("blur", clear)
      canvas.removeEventListener("webglcontextlost", lost)
      window.removeEventListener("keyup", keyup)
      window.removeEventListener("blur", clear)
      document.removeEventListener("visibilitychange", clear)
      textures.forEach((t) => t.dispose())
      geometries.forEach((g) => g.dispose())
      materials.forEach((m) => m.dispose())
      leaves.dispose()
      renderer.dispose()
    },
  }
}
