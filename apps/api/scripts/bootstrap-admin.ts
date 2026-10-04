import { NestFactory } from "@nestjs/core"
import * as bcrypt from "bcryptjs"
import { AppModule } from "../src/app.module"
import { env } from "../src/config/env"

/**
 * Creates the platform admin account from environment variables.
 * Run once, then remove PALETTO_ADMIN_EMAIL / PALETTO_ADMIN_PASSWORD from env.
 */
async function main() {
  const { PALETTO_ADMIN_EMAIL, PALETTO_ADMIN_PASSWORD } = env()
  if (!PALETTO_ADMIN_EMAIL || !PALETTO_ADMIN_PASSWORD) {
    console.error(
      "Set PALETTO_ADMIN_EMAIL and PALETTO_ADMIN_PASSWORD (min 10 chars) first."
    )
    process.exitCode = 1
    return
  }
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn"],
  })
  try {
    const { getModelToken } = await import("@nestjs/mongoose")
    const { User } = await import("../src/users/schemas/user.schema")
    const users = app.get(getModelToken(User.name))
    const passwordHash = await bcrypt.hash(PALETTO_ADMIN_PASSWORD, 12)
    await users.findOneAndUpdate(
      { email: PALETTO_ADMIN_EMAIL.toLowerCase() },
      {
        $set: {
          email: PALETTO_ADMIN_EMAIL.toLowerCase(),
          passwordHash,
          role: "admin",
          name: "مدیر پالتو",
        },
      },
      { upsert: true, runValidators: true }
    )
    console.log(`Admin ready: ${PALETTO_ADMIN_EMAIL}`)
  } finally {
    await app.close()
  }
}

void main()
