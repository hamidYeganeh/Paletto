export const ROOM_PAGE_SIZE = 10
export function roomPage<T>(works: T[], page: number) {
  return works.slice(page * ROOM_PAGE_SIZE, (page + 1) * ROOM_PAGE_SIZE)
}
export const tourStops = [
  { x: 0, z: 7.2, lookX: -1.2, lookZ: -2.7 },
  { x: -3.8, z: 4.8, lookX: -6.8, lookZ: -0.7 },
  { x: -4.6, z: 0, lookX: -6.8, lookZ: -0.7 },
  { x: -4.6, z: -5.5, lookX: -6.8, lookZ: -5 },
  { x: 0, z: -5.5, lookX: 0, lookZ: -7 },
  { x: 4.65, z: -5.5, lookX: 6.8, lookZ: -4.5 },
  { x: 4.65, z: -9, lookX: 5.8, lookZ: -10.5 },
  { x: 4.65, z: -5.5, lookX: 6.8, lookZ: -0.2 },
  { x: 4.65, z: 4.5, lookX: 3.8, lookZ: 8 },
  { x: 0, z: 6.5, lookX: -3.8, lookZ: 8 },
  { x: 0, z: 7.2, lookX: -1.2, lookZ: -2.7 },
]
const lengths = tourStops
  .slice(1)
  .map((p, i) => Math.hypot(p.x - tourStops[i]!.x, p.z - tourStops[i]!.z))
const total = lengths.reduce((a, b) => a + b, 0)
export function sampleTour(progress: number) {
  let remaining = Math.max(0, Math.min(1, progress)) * total
  for (let i = 0; i < lengths.length; i++) {
    const length = lengths[i]!
    if (remaining <= length || i === lengths.length - 1) {
      const t = remaining / length,
        a = tourStops[i]!,
        b = tourStops[i + 1]!
      return {
        x: a.x + (b.x - a.x) * t,
        z: a.z + (b.z - a.z) * t,
        lookX: a.lookX + (b.lookX - a.lookX) * t,
        lookZ: a.lookZ + (b.lookZ - a.lookZ) * t,
      }
    }
    remaining -= length
  }
  return tourStops[0]!
}
export function nearestTourProgress(x: number, z: number) {
  let best = Infinity,
    result = 0,
    travelled = 0
  for (let i = 0; i < lengths.length; i++) {
    const a = tourStops[i]!,
      b = tourStops[i + 1]!,
      length = lengths[i]!
    const t = Math.max(
      0,
      Math.min(
        1,
        ((x - a.x) * (b.x - a.x) + (z - a.z) * (b.z - a.z)) / (length * length)
      )
    )
    const distance = Math.hypot(
      x - a.x - (b.x - a.x) * t,
      z - a.z - (b.z - a.z) * t
    )
    if (distance < best) {
      best = distance
      result = (travelled + t * length) / total
    }
    travelled += length
  }
  return result
}
export function damp(
  current: number,
  target: number,
  rate: number,
  dt: number
) {
  return target + (current - target) * Math.exp(-rate * dt)
}
