import type { Metadata } from "next"
import { catalog } from "./service"
export async function entityMetadata(
  type: "events" | "galleries" | "collection" | "artists",
  id: string
): Promise<Metadata> {
  const data = await catalog()
  const item = (type === "collection" ? data.artworks : data[type]).find(
    (x) => x.id === id
  )
  if (!item)
    return {
      title: "محتوا در دسترس نیست | پالتو",
      robots: { index: false, follow: false },
    }
  const title = "title" in item ? item.title : item.name
  const description = "description" in item ? item.description : item.bio
  return {
    title: `${title} | پالتو`,
    description,
    alternates: { canonical: `/${type}/${id}` },
    openGraph: {
      title,
      description,
      ...("image" in item ? { images: [item.image] } : {}),
    },
    robots: { index: !("demo" in item && item.demo), follow: true },
  }
}
