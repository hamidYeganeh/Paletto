import { test, expect } from "@playwright/test"

const canvasLabel = "سالن سه‌بعدی قابل گردش گالری"

test("light gallery renders, ray-selects art, restores focus, and browses works", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.goto("/gallery/light")
  const canvas = page.getByLabel(canvasLabel, { exact: true })
  await expect(canvas).toHaveAttribute("aria-busy", "false")
  await expect(
    page.getByRole("heading", { name: "جایی برای تماشا." })
  ).toBeVisible()
  await page.getByRole("button", { name: "مجموعه آثار", exact: true }).click()
  const collection = page.getByRole("complementary", {
    name: "مجموعه آثار گالری",
  })
  await collection
    .getByRole("button", { name: "رفتن کنار اثر" })
    .first()
    .click()
  await canvas.press("Enter")
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole("heading", { name: "خاکِ سرخ" })).toBeVisible()
  await dialog.getByRole("button", { name: "اثر بعدی" }).click()
  await expect(dialog.getByRole("heading", { name: "ردِ روشن" })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(dialog).not.toBeVisible()
  await expect(canvas).toBeFocused()
  const bounds = (await canvas.boundingBox())!
  await page.mouse.click(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2
  )
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole("heading", { name: "خاکِ سرخ" })).toBeVisible()
  expect(errors).toEqual([])
})

test("walking stops at the bench, releases on blur, and permits a route around it", async ({
  page,
}) => {
  await page.goto("/gallery/demo")
  const canvas = page.getByLabel(canvasLabel, { exact: true })
  await expect(canvas).toHaveAttribute("aria-busy", "false")
  const position = async () =>
    (await canvas.getAttribute("data-position"))!.split(",").map(Number)
  await canvas.focus()
  await page.keyboard.down("w")
  await expect
    .poll(async () => (await position())[1], { timeout: 15000 })
    .toBeLessThan(2.45)
  await page.waitForTimeout(300)
  expect((await position())[1]).toBeGreaterThanOrEqual(2.33)
  await page.keyboard.up("w")
  await page.keyboard.down("a")
  await expect
    .poll(async () => (await position())[0], { timeout: 15000 })
    .toBeLessThan(-2.7)
  await page.keyboard.up("a")
  await page.keyboard.down("w")
  await expect
    .poll(async () => (await position())[1], { timeout: 15000 })
    .toBeLessThan(0.7)
  await page
    .getByRole("button", { name: "بازگشت به ورودی", exact: true })
    .focus()
  const stopped = await position()
  await page.waitForTimeout(300)
  expect(await position()).toEqual(stopped)
  await page.keyboard.up("w")
  await page
    .getByRole("button", { name: "بازگشت به ورودی", exact: true })
    .click()
  await expect.poll(async () => (await position())[1]).toBeCloseTo(7.2, 2)
})

test("mobile touch cancel stops motion and collection fits the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/gallery/light")
  const canvas = page.getByLabel(canvasLabel, { exact: true })
  await expect(canvas).toHaveAttribute("aria-busy", "false")
  const position = () => canvas.getAttribute("data-position")
  const initial = await position()
  const button = (await page
    .getByRole("button", { name: "جلو", exact: true })
    .boundingBox())!
  const touch = await page.context().newCDPSession(page)
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: button.x + button.width / 2, y: button.y + button.height / 2 },
    ],
  })
  await expect.poll(position).not.toBe(initial)
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  })
  const stopped = await position()
  await page.waitForTimeout(250)
  expect(await position()).toBe(stopped)
  await page.getByRole("button", { name: "مجموعه آثار", exact: true }).click()
  await page.getByRole("button", { name: "مشاهده خاکِ سرخ" }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(390)
})

test("personal images stay local and failed WebGL has a usable collection", async ({
  page,
}) => {
  await page.goto("/gallery/light")
  await expect(page.getByLabel(canvasLabel, { exact: true })).toHaveAttribute(
    "aria-busy",
    "false"
  )
  await page.getByRole("button", { name: "مجموعه آثار", exact: true }).click()
  await page.locator('input[type="file"]').setInputFiles({
    name: "personal.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64"
    ),
  })
  await expect(
    page.getByRole("status").filter({ hasText: "۱ تصویر" })
  ).toBeVisible()
  await page.getByRole("button", { name: "مجموعه آثار", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "مشاهده personal" })
  ).toBeVisible()
  await page.reload()
  await page.getByRole("button", { name: "مجموعه آثار", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "مشاهده personal" })
  ).toHaveCount(0)
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.includes("webgl")) return null
      return Reflect.apply(original, this, [type, ...args])
    } as typeof original
  })
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "نمای سه‌بعدی در دسترس نیست" })
  ).toBeVisible()
  await page
    .getByRole("button", { name: "مجموعه آثار", exact: true })
    .first()
    .click()
  await page.getByRole("button", { name: "مشاهده خاکِ سرخ" }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
})

test("room pagination loads disjoint sets of ten and a partial last room", async ({
  page,
}) => {
  await page.goto("/gallery/light")
  const canvas = page.getByLabel(canvasLabel, { exact: true })
  await expect(canvas).toHaveAttribute("aria-busy", "false")
  const ids = async () =>
    JSON.parse((await canvas.getAttribute("data-artwork-ids"))!) as string[]
  const first = await ids()
  await page
    .locator('input[type="file"]')
    .setInputFiles(
      Array.from({ length: 11 }, (_, i) => ({
        name: `page-art-${i}.png`,
        mimeType: "image/png",
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
          "base64"
        ),
      }))
    )
  await expect(canvas).toHaveAttribute("data-room-page", "2")
  await expect(canvas).toHaveAttribute("aria-busy", "false")
  await expect.poll(async () => (await ids()).length).toBe(10)
  const second = await ids()
  expect(second.some((id) => first.includes(id))).toBe(false)
  await page.getByRole("button", { name: "مجموعه آثار", exact: true }).click()
  await expect(
    page
      .getByRole("complementary", { name: "مجموعه آثار گالری" })
      .locator("article")
  ).toHaveCount(10)
  await page.getByRole("button", { name: "سالن بعدی", exact: true }).click()
  await expect(canvas).toHaveAttribute("data-room-page", "3")
  await expect.poll(async () => (await ids()).length).toBe(1)
  await expect(
    page.getByRole("button", { name: "مشاهده page-art-10", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "سالن بعدی", exact: true })
  ).toBeDisabled()
  await page.getByLabel("انتخاب سالن", { exact: true }).selectOption("0")
  await expect.poll(ids).toEqual(first)
  await expect(
    page.getByRole("button", { name: "سالن قبلی", exact: true })
  ).toBeDisabled()
})

test("phone swipes scroll the tour, reverse it, and leave collection scrolling independent", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/gallery/light")
  const canvas = page.getByLabel(canvasLabel, { exact: true })
  await expect(canvas).toHaveAttribute("aria-busy", "false")
  const progress = async () =>
    Number(await canvas.getAttribute("data-tour-progress"))
  const touch = await page.context().newCDPSession(page)
  const rect = (await canvas.boundingBox())!
  async function swipe(from: number, to: number) {
    const x = rect.x + rect.width * 0.5
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y: from }],
    })
    for (let i = 1; i <= 8; i++)
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: from + ((to - from) * i) / 8 }],
      })
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    })
  }
  await swipe(rect.y + rect.height * 0.65, rect.y + rect.height * 0.36)
  await expect.poll(progress).toBeGreaterThan(0.015)
  await page.waitForTimeout(400)
  const ahead = await progress()
  await swipe(rect.y + rect.height * 0.36, rect.y + rect.height * 0.65)
  await expect.poll(progress).toBeLessThan(ahead - 0.01)
  await page.getByRole("button", { name: "مجموعه آثار", exact: true }).click()
  const stopped = await progress()
  const panel = page.getByRole("complementary", { name: "مجموعه آثار گالری" })
  await panel.hover()
  await page.mouse.wheel(0, 600)
  await expect
    .poll(() => panel.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0)
  expect(await progress()).toBe(stopped)
  await page.screenshot({
    path: "/tmp/paletto-pagination/mobile-collection.png",
  })
})

test("wheel tour pauses immediately on blur and respects reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/gallery/light")
  const canvas = page.getByLabel(canvasLabel, { exact: true })
  await expect(canvas).toHaveAttribute("aria-busy", "false")
  await canvas.hover()
  await page.mouse.wheel(0, 900)
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-tour-progress")))
    .toBeGreaterThan(0.1)
  await page
    .getByRole("button", { name: "بازگشت به ورودی", exact: true })
    .click()
  await expect(canvas).toHaveAttribute("data-position", "0.000,7.200")
})
