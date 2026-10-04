import { z } from "zod"

/**
 * Typed runtime configuration. Parsed once at boot; the process refuses to
 * start with an invalid or missing required environment.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z.string().min(1),
  MONGODB_DB: z.string().min(1).default("paletto"),
  APP_ORIGIN: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  ZARINPAL_MERCHANT_ID: z.string().optional(),
  PALETTO_ADMIN_EMAIL: z.string().email().optional(),
  PALETTO_ADMIN_PASSWORD: z.string().min(10).optional(),
})

export type Env = z.infer<typeof envSchema>

export function parseEnv(raw: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(raw)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ")
    throw new Error(`Invalid environment configuration → ${issues}`)
  }
  return result.data
}

let cached: Env | undefined

/** Access the validated env from anywhere (modules, scripts, factories). */
export function env(): Env {
  cached ??= parseEnv(process.env)
  return cached
}
