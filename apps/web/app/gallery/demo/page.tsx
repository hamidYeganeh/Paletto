import { LightGallery } from "@/features/light-gallery/LightGallery"
import { VirtualGallery } from "@/features/platform/VirtualGallery"
import { PlatformProvider } from "@/features/platform/client"
import "@/features/platform/platform.css"
export const metadata = {
  title: "بازدید مجازی گالری | پالتو",
  description:
    "آثار را در سالن مجازی ببینید و برای بازدید حضوری برنامه‌ریزی کنید.",
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ gallery?: string | string[] }>
}) {
  const { gallery } = await searchParams
  if (typeof gallery !== "string" || !gallery) return <LightGallery />
  return (
    <PlatformProvider>
      <VirtualGallery
        key={String(gallery || "")}
        gallery={typeof gallery === "string" ? gallery : ""}
      />
    </PlatformProvider>
  )
}
