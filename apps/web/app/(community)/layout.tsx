import { PlatformProvider } from "@/features/platform/client"
import "@/features/platform/platform.css"
export default function Layout({ children }: { children: React.ReactNode }) {
  return <PlatformProvider>{children}</PlatformProvider>
}
