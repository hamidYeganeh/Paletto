import { authenticate } from "../lib/platform/service"
import { transaction, closeStore } from "../lib/platform/store"
if (process.env.PALETTO_DATA_FILE !== "/tmp/paletto-test-browser.json")
  throw new Error("Browser fixture requires isolated test store")
const email = "admin@browser.test"
const exists = await transaction((s) => s.users.some((u) => u.email === email))
if (!exists)
  await authenticate("register", {
    email,
    password: "Test-fixture-only-247!",
    name: "مدیر آزمون مرورگر",
    role: "enthusiast",
  })
await transaction((s) => {
  s.users.find((u) => u.email === email)!.role = "admin"
})
await closeStore()
