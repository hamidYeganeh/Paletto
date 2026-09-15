import { authenticate } from "../lib/platform/service"
import { transaction } from "../lib/platform/store"
const email = process.env.PALETTO_ADMIN_EMAIL
const password = process.env.PALETTO_ADMIN_PASSWORD
if (!email || !password)
  throw new Error(
    "Set PALETTO_ADMIN_EMAIL and PALETTO_ADMIN_PASSWORD securely in the process environment."
  )
const existing = await transaction((s) =>
  s.users.find((u) => u.email === email.toLowerCase())
)
const user =
  existing ||
  (
    await authenticate("register", {
      email,
      password,
      name: "مدیر پالتو",
      role: "enthusiast",
    })
  ).user
await transaction((s) => {
  s.users.find((u) => u.id === user.id)!.role = "admin"
  s.sessions = s.sessions.filter((x) => x.userId !== user.id)
  s.audit.push({
    actorId: "bootstrap-cli",
    action: "admin.provisioned",
    targetId: user.id,
    at: new Date().toISOString(),
  })
})
console.log(
  "Administrator provisioned. Sign in using the configured credentials."
)
