import localFont from "next/font/local"
import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages, getTranslations } from "next-intl/server"

import "@workspace/ui/globals.css"
import "./studio.css"
import "./marketplace.css"
import "./archive.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"

const iranSansX = localFont({
  src: "./fonts/IRANSansXV.woff2",
  variable: "--font-iransans-x",
  display: "swap",
  weight: "100 1000",
})

const numeralFont = localFont({
  src: "./fonts/IRANSansXV.woff2",
  variable: "--font-space-grotesk",
  display: "swap",
  weight: "100 1000",
})

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta")
  const metadataBase = new URL(process.env.APP_ORIGIN || "http://localhost:3000")
  const title = t("title")
  const description = t("description")

  return {
    metadataBase,
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fa_IR",
      images: [
        {
          url: "/images/paletto-og.png",
          width: 1730,
          height: 909,
          alt: "پالتو؛ هنر را کشف کن، از خالقش بخر",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/paletto-og.png"],
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      dir="rtl"
      suppressHydrationWarning
      className={cn("antialiased", iranSansX.variable, numeralFont.variable)}
    >
      <body className={iranSansX.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider forcedTheme="light" enableSystem={false}>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
