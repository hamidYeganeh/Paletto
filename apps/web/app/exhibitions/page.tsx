import type { Metadata } from "next"
import { ArchiveHeader } from "@/features/archive/ArchiveShell"
import Moodboard from "./Moodboard"
import styles from "./exhibitions.module.css"

export const metadata: Metadata = {
  title: "نمایشگاه‌ها | پالتو",
  description: "آرشیوی برای کشف تصویر، فضا و نگاه؛ نمایشگاه‌های پالتو.",
}

export default function ExhibitionsPage() {
  return <div className={`archive-page ${styles.page}`}>
    <ArchiveHeader />
    <main className={styles.main}>
      <header className={styles.heading}>
        <div><p>پالتو / آرشیو دیداری</p><h1>نمایشگاه‌ها<span> [۶۴]</span></h1></div>
        <p>میان تصویرها قدم بزنید.<br /><span>برای کشف بیشتر، صفحه را بکشید.</span></p>
      </header>
      <Moodboard />
    </main>
  </div>
}
