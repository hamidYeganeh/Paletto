import type { MetadataRoute } from "next"
import { catalog } from "@/lib/platform/service"
export const dynamic = "force-dynamic"
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.APP_ORIGIN
  if (!origin || process.env.PALETTO_DEMO === "true") return []
  const data = await catalog()
  return [
    ...[
      "",
      "/explore",
      "/events",
      "/galleries",
      "/artists",
      "/collection",
      "/curatorial",
    ].map((path) => ({ url: origin + path })),
    ...data.events
      .filter((e) => !e.demo)
      .map((e) => ({
        url: `${origin}/events/${e.id}`,
        lastModified: e.createdAt,
      })),
    ...data.galleries
      .filter((e) => !e.demo)
      .map((e) => ({
        url: `${origin}/galleries/${e.id}`,
        lastModified: e.createdAt,
      })),
    ...data.artworks
      .filter((e) => !e.demo)
      .map((e) => ({
        url: `${origin}/collection/${e.id}`,
        lastModified: e.createdAt,
      })),
  ]
}
