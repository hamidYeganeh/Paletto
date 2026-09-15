import { test, expect } from "@playwright/test"
import { randomUUID } from "node:crypto"
test("discover, filter, inspect and book a free event with a new account", async ({
  page,
}) => {
  await page.goto("/explore")
  await expect(
    page.getByRole("heading", { name: "از دیدن، تا نزدیک شدن." })
  ).toBeVisible()
  await page.getByRole("link", { name: "کشف رویدادها", exact: true }).click()
  await page
    .getByRole("combobox", { name: "شهر", exact: true })
    .selectOption("تهران")
  await expect(
    page.getByRole("heading", { name: "میان رنگ و سکوت" })
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "دیدن را تمرین کنیم" })
  ).toHaveCount(0)
  await page.getByRole("heading", { name: "میان رنگ و سکوت" }).click()
  await expect(
    page.getByRole("heading", { name: "رزرو جای شما" })
  ).toBeVisible()
  await page.getByRole("button", { name: "ادامه و تأیید رزرو" }).click()
  await expect(page).toHaveURL(/login/)
  await page.getByRole("button", { name: "حساب ندارم؛ ثبت‌نام" }).click()
  await page.getByLabel("نام و نام خانوادگی").fill("هنردوست مرورگر")
  await page
    .getByLabel("ایمیل", { exact: true })
    .fill(`browser-${randomUUID()}@test.example`)
  await page.getByLabel("رمز عبور").fill("Browser-strong-pass-247!")
  await page.getByRole("button", { name: "ساخت حساب", exact: true }).click()
  await expect(page).toHaveURL(/account/)
  await page.goto("/events/demo-event-0")
  await page.getByRole("button", { name: "ادامه و تأیید رزرو" }).click()
  await expect(page).toHaveURL(/account\?order=/)
  await expect(page.getByText("تأییدشده", { exact: true })).toBeVisible()
  await expect(page.getByAltText("کد QR بلیت ورود")).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: "/tmp/paletto-account.png", fullPage: true })
})
test("artist can create and persist a draft artwork through the form", async ({
  page,
}) => {
  await page.goto("/login")
  await page.getByRole("button", { name: "حساب ندارم؛ ثبت‌نام" }).click()
  await page.getByLabel("نام و نام خانوادگی").fill("هنرمند مرورگر")
  await page.getByLabel("نقش اصلی شما").selectOption("artist")
  await page
    .getByLabel("ایمیل", { exact: true })
    .fill(`artist-${randomUUID()}@test.example`)
  await page.getByLabel("رمز عبور").fill("Browser-strong-pass-247!")
  await page.getByRole("button", { name: "ساخت حساب", exact: true }).click()
  await expect(page).toHaveURL(/studio/)
  await page.getByRole("button", { name: "آثار و موجودی", exact: true }).click()
  await page.getByRole("button", { name: "ثبت مورد جدید" }).click()
  await page.getByLabel("عنوان", { exact: true }).fill("نقاشی آزمون مرورگر")
  await page.getByLabel("شهر", { exact: true }).fill("تهران")
  await page.getByLabel("تکنیک و جنس").fill("روغن روی بوم")
  await page.getByLabel("ابعاد و واحد اندازه‌گیری").fill("۳۰ × ۴۰ سانتی‌متر")
  await page.getByLabel("سال خلق").fill("۱۴۰۵")
  await page
    .getByLabel("توضیحات", { exact: true })
    .fill("شرح کامل اثر هنری برای بررسی فرم ثبت نمونه‌کار.")
  await page
    .getByRole("combobox", { name: "وضعیت", exact: true })
    .selectOption("draft")
  await page.getByRole("button", { name: "ذخیره", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "نقاشی آزمون مرورگر" })
  ).toBeVisible()
  await expect(page.getByText("پیش‌نویس", { exact: true })).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: "/tmp/paletto-studio.png", fullPage: true })
})
test("public pages fit mobile and have working navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const route of [
    "/explore",
    "/events",
    "/galleries",
    "/artists",
    "/collection",
    "/login",
    "/design-system",
  ]) {
    await page.goto(route)
    await expect(page.locator("#main-content")).toBeVisible()
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1
        )
      )
      .toBe(true)
  }
  await page.goto("/explore")
  await page.getByRole("button", { name: "باز کردن منو" }).click()
  await page
    .getByRole("navigation", { name: "ناوبری اصلی" })
    .getByRole("link", { name: "گالری‌ها", exact: true })
    .click()
  await expect(page).toHaveURL(/galleries/)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: "/tmp/paletto-mobile.png", fullPage: true })
})
test("virtual gallery supports simple view and artwork navigation", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.goto("/gallery/demo?gallery=demo-white")
  await expect(
    page.getByRole("heading", { name: "کمی نزدیک‌تر به اثر." })
  ).toBeVisible()
  await page.getByRole("button", { name: "اثر بعدی", exact: true }).click()
  await page.getByRole("button", { name: "سالن صنعتی", exact: true }).click()
  await page.waitForTimeout(2000)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: "/tmp/paletto-gallery.png", fullPage: true })
  await page
    .getByRole("button", { name: "نمای ساده آثار", exact: true })
    .click()
  await expect(page.locator(".pt-card-image").first()).toBeVisible()
  expect(errors).toEqual([])
})
test("API rejects cross-origin changes and privileged anonymous reads", async ({
  request,
}) => {
  const anonymous = await request.get("/api/platform/dashboard")
  expect(anonymous.status()).toBe(401)
  const csrf = await request.post("/api/platform/register", {
    headers: { Origin: "https://untrusted.example" },
    data: { email: "csrf@test.example", password: "long-password-value" },
  })
  expect(csrf.status()).toBe(403)
  const invalid = await request.post("/api/platform/register", {
    headers: { Origin: "http://127.0.0.1:3100" },
    data: { email: "bad", password: "short" },
  })
  expect(invalid.status()).toBe(400)
})

test("gallery owner submits a venue and administrator approves through the UI", async ({
  page,
  browser,
}) => {
  await page.goto("/login")
  await page.getByRole("button", { name: "حساب ندارم؛ ثبت‌نام" }).click()
  await page.getByLabel("نام و نام خانوادگی").fill("گالری‌دار مرورگر")
  await page.getByLabel("نقش اصلی شما").selectOption("gallery")
  await page
    .getByLabel("ایمیل", { exact: true })
    .fill(`gallery-${randomUUID()}@test.example`)
  await page.getByLabel("رمز عبور").fill("Browser-strong-pass-247!")
  await page.getByRole("button", { name: "ساخت حساب", exact: true }).click()
  await expect(page).toHaveURL(/studio/)
  await page.getByRole("button", { name: "فضاهای من", exact: true }).click()
  await page.getByRole("button", { name: "ثبت مورد جدید" }).click()
  const title = `گالری آزمون ${randomUUID().slice(0, 8)}`
  await page.getByLabel("عنوان", { exact: true }).fill(title)
  await page.getByLabel("شهر", { exact: true }).fill("تهران")
  await page
    .getByLabel("نشانی دقیق")
    .fill("نشانی نمونه گالری برای آزمون مرورگر")
  await page.getByLabel("روزها و ساعت بازدید").fill("هر روز از ۱۶ تا ۲۰")
  await page.getByLabel("امکانات و دسترس‌پذیری").fill("ورودی بدون پله")
  await page
    .getByLabel("توضیحات", { exact: true })
    .fill("این گالری فقط برای آزمون فرایند ثبت و بررسی ایجاد شده است.")
  await page.getByRole("button", { name: "ذخیره", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: title, exact: true })
  ).toBeVisible()
  await expect(page.getByText("در انتظار بررسی", { exact: true })).toBeVisible()
  const adminContext = await browser.newContext()
  const admin = await adminContext.newPage()
  await admin.goto("http://127.0.0.1:3100/login")
  await admin.getByLabel("ایمیل", { exact: true }).fill("admin@browser.test")
  await admin.getByLabel("رمز عبور").fill("Test-fixture-only-247!")
  await admin.getByRole("button", { name: "ورود", exact: true }).click()
  await expect(admin).toHaveURL(/account/)
  await admin.goto("http://127.0.0.1:3100/studio")
  await admin
    .getByRole("button", { name: "بررسی و انتشار", exact: true })
    .click()
  const form = admin
    .locator("form")
    .filter({ has: admin.getByRole("heading", { name: title, exact: true }) })
  await form.getByRole("button", { name: "ثبت تصمیم" }).click()
  await expect(form).toHaveCount(0)
  await page.reload()
  await page.getByRole("button", { name: "فضاهای من", exact: true }).click()
  await expect(page.getByText("منتشرشده", { exact: true })).toBeVisible()
  await adminContext.close()
})

test("upload validates image type and protects anonymous writes", async ({
  request,
}) => {
  const headers = { Origin: "http://127.0.0.1:3100" }
  expect(
    (await request.post("/api/media", { headers, data: "<svg/>" })).status()
  ).toBe(403)
  const response = await request.post("/api/platform/register", {
    headers,
    data: {
      email: `upload-${randomUUID()}@test.example`,
      password: "Upload-test-password-248!",
      name: "هنرمند بارگذاری",
      role: "artist",
    },
  })
  expect(response.ok()).toBe(true)
  const invalid = await request.post("/api/media", {
    headers: { ...headers, "Content-Type": "image/svg+xml" },
    data: "<svg><script>alert(1)</script></svg>",
  })
  expect(invalid.status()).toBe(400)
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
    "base64"
  )
  const upload = await request.post("/api/media", {
    headers: { ...headers, "Content-Type": "image/png" },
    data: png,
  })
  expect(upload.ok()).toBe(true)
  const url = (await upload.json()).url
  const image = await request.get(url)
  expect(image.headers()["content-type"]).toBe("image/png")
  expect(image.headers()["x-content-type-options"]).toBe("nosniff")
})

test("homepage community links fit a narrow mobile header", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto("/")
  const header = page.locator(".museum-header")
  await expect(header).toBeVisible()
  const bounds = await header.locator(".museum-header-actions").boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(360)
  await header.getByRole("link", { name: "رویداد و بلیت" }).click()
  await expect(page).toHaveURL(/events/)
})

test("walk freely, rotate, stop on blur and respect gallery walls", async ({
  page,
}) => {
  await page.goto("/gallery/demo?gallery=demo-white")
  const canvas = page.getByLabel("سالن سه‌بعدی قابل گردش گالری", {
    exact: true,
  })
  const marker = page.locator(".pt-walk-marker")
  await expect(page.getByText("در حال آماده‌سازی سالن…")).toHaveCount(0)
  await expect(canvas).toBeVisible()
  const top = () =>
    marker.evaluate((el) => parseFloat((el as HTMLElement).style.top))
  await expect.poll(top).toBeGreaterThan(0)
  await canvas.click()
  const initial = await top()
  await page.keyboard.down("w")
  await expect.poll(top).toBeLessThan(initial - 5)
  await page.keyboard.up("w")
  const before = await marker.getAttribute("style")
  const bounds = (await canvas.boundingBox())!
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2
  )
  await page.mouse.down()
  await page.mouse.move(
    bounds.x + bounds.width / 2 + 100,
    bounds.y + bounds.height / 2,
    { steps: 8 }
  )
  await page.mouse.up()
  await expect.poll(() => marker.getAttribute("style")).not.toBe(before)
  await page
    .getByRole("button", { name: "بازگشت به ورودی", exact: true })
    .click()
  await expect.poll(top).toBeCloseTo(78, 0)
  await canvas.focus()
  await page.keyboard.down("s")
  await expect.poll(top).toBeGreaterThan(91)
  await page.waitForTimeout(400)
  expect(await top()).toBeLessThanOrEqual(92.51)
  await page
    .getByRole("button", { name: "بازگشت به ورودی", exact: true })
    .focus()
  const stopped = await top()
  await page.waitForTimeout(250)
  expect(await top()).toBeCloseTo(stopped, 2)
  await page.keyboard.up("s")
  await page.getByRole("button", { name: "شروع تور خودکار" }).click()
  await canvas.click()
  await expect(
    page.getByRole("button", { name: "شروع تور خودکار" })
  ).toBeVisible()
})

test("mobile pointer controls walk and release without drifting", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/gallery/demo?gallery=demo-white")
  await expect(page.getByText("در حال آماده‌سازی سالن…")).toHaveCount(0)
  const forward = page.getByRole("button", { name: "جلو", exact: true })
  await forward.scrollIntoViewIfNeeded()
  const marker = page.locator(".pt-walk-marker")
  const top = () =>
    marker.evaluate((el) => parseFloat((el as HTMLElement).style.top))
  await expect(forward).toBeEnabled()
  await expect.poll(top).toBeGreaterThan(0)
  const initial = await top()
  const touch = await page.context().newCDPSession(page)
  const button = (await forward.boundingBox())!
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: button.x + button.width / 2, y: button.y + button.height / 2 },
    ],
  })
  await expect.poll(top).toBeLessThan(initial - 3)
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  })
  const stopped = await top()
  await page.waitForTimeout(250)
  expect(await top()).toBeCloseTo(stopped, 2)
})
