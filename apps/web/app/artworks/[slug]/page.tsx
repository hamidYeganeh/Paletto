import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArtworkDetail } from "@/features/artwork-detail/ArtworkDetail"
import { artworks } from "@/features/artwork-detail/artworks"
import "@/features/artwork-detail/artwork-detail.css"

type Props = { params: Promise<{ slug: string }> }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const artwork = artworks.find((item) => item.id === slug)
  if (!artwork) notFound()
  return { title: `${artwork.title} — پالتو`, description: artwork.description }
}
export default async function ArtworkPage({ params }: Props) {
  const { slug } = await params
  const artwork = artworks.find((item) => item.id === slug)
  if (!artwork) notFound()
  return <ArtworkDetail key={artwork.id} artwork={artwork} />
}
