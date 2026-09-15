import type { MetadataRoute } from "next"
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow:
        process.env.PALETTO_DEMO === "true"
          ? "/"
          : ["/api/", "/account", "/studio", "/login", "/design-system"],
    },
    sitemap: process.env.APP_ORIGIN
      ? `${process.env.APP_ORIGIN}/sitemap.xml`
      : undefined,
  }
}
