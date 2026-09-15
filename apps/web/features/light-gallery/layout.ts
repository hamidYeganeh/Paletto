// Metres. Camera looks toward -Z; courtyard continues beyond the north doorway.
export type Rect = { x: number; z: number; w: number; d: number }
export const obstacles: Rect[] = [
  { x: -0.35, z: -2.7, w: 5.9, d: 0.3 },
  { x: 0, z: 1.8, w: 4.4, d: 0.58 },
  { x: 3.15, z: -1.1, w: 0.82, d: 0.82 },
  { x: -6.35, z: -7, w: 1.3, d: 0.25 },
  { x: -0.65, z: -7, w: 7.1, d: 0.25 },
  { x: 6.65, z: -7, w: 0.7, d: 0.25 },
  { x: 2.8, z: -9.5, w: 0.25, d: 5 },
  { x: 5.8, z: -10.55, w: 0.8, d: 0.8 },
  { x: 4.6, z: -11.2, w: 2.4, d: 0.6 },
]
export function canStand(x: number, z: number) {
  const r = 0.25
  if (x < -6.7 || x > 6.7 || z > 7.65 || z < -11.65) return false
  if (z < -7.15 && x < 3.1) return false
  return !obstacles.some(
    (o) =>
      x > o.x - o.w / 2 - r &&
      x < o.x + o.w / 2 + r &&
      z > o.z - o.d / 2 - r &&
      z < o.z + o.d / 2 + r
  )
}
export function moveWithCollision(
  x: number,
  z: number,
  dx: number,
  dz: number
) {
  // Small substeps prevent crossing thin walls even after a slow frame.
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.08))
  for (let i = 0; i < steps; i++) {
    if (canStand(x + dx / steps, z)) x += dx / steps
    if (canStand(x, z + dz / steps)) z += dz / steps
  }
  return { x, z }
}
