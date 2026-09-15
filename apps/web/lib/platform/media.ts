import { resolve } from "node:path"
export const mediaRoot = () => {
  if (process.env.NODE_ENV === "production" && !process.env.PALETTO_MEDIA_ROOT)
    throw new Error(
      "PALETTO_MEDIA_ROOT must point to persistent storage in production"
    )
  return resolve(process.env.PALETTO_MEDIA_ROOT || ".data/uploads")
}
