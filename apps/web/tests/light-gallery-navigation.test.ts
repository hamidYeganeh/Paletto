import { test } from "node:test"
import assert from "node:assert/strict"
import { canStand, moveWithCollision } from "../features/light-gallery/layout"

test("large motion cannot tunnel through the display wall or bench", () => {
  const bench = moveWithCollision(0, 7.2, 0, -20)
  assert.ok(bench.z >= 2.33 && bench.z < 2.5)
  const wall = moveWithCollision(0, 0, 0, -20)
  assert.ok(wall.z > -2.31)
})
test("a continuous route goes around the partition into the courtyard", () => {
  let p = moveWithCollision(0, 7.2, 4.7, 0)
  p = moveWithCollision(p.x, p.z, 0, -16)
  assert.ok(p.z < -8.5)
  assert.ok(canStand(p.x, p.z))
  p = moveWithCollision(p.x, p.z, -20, 0)
  assert.ok(p.x > 3.1)
})
test("external boundaries contain the camera at any large displacement", () => {
  const p = moveWithCollision(0, 7.2, 100, 100)
  assert.ok(p.x <= 6.7 && p.z <= 7.65)
})

import {
  roomPage,
  sampleTour,
  damp,
} from "../features/light-gallery/navigation"
test("pages partition an arbitrary collection without repeats or omitted works", () => {
  const works = Array.from({ length: 27 }, (_, i) => ({ id: i }))
  const pages = [roomPage(works, 0), roomPage(works, 1), roomPage(works, 2)]
  assert.deepEqual(
    pages.map((p) => p.length),
    [10, 10, 7]
  )
  assert.deepEqual(pages.flat(), works)
  assert.deepEqual(roomPage([], 0), [])
})
test("the entire scroll route clears walls and furniture in both directions", () => {
  let last = sampleTour(0)
  for (let i = 1; i <= 2000; i++) {
    const next = sampleTour(i / 2000)
    assert.ok(canStand(next.x, next.z), `blocked at progress ${i / 2000}`)
    const actual = moveWithCollision(
      last.x,
      last.z,
      next.x - last.x,
      next.z - last.z
    )
    assert.ok(Math.hypot(actual.x - next.x, actual.z - next.z) < 0.00001)
    last = next
  }
})
test("smoothing has the same response at different frame rates", () => {
  let a = 0,
    b = 0
  for (let i = 0; i < 60; i++) a = damp(a, 2.7, 12, 1 / 60)
  for (let i = 0; i < 30; i++) b = damp(b, 2.7, 12, 1 / 30)
  assert.ok(Math.abs(a - b) < 1e-10)
  assert.ok(damp(0, 2.7, 12, 1 / 60) > 0 && damp(0, 2.7, 12, 1 / 60) < 2.7)
})
