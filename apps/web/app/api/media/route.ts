import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { transaction } from "@/lib/platform/store"
import { identify } from "@/lib/platform/service"
import { mediaRoot } from "@/lib/platform/media"
export const runtime = "nodejs"
export async function POST(request: NextRequest) {
  if (
    request.headers.get("origin") !==
    (process.env.APP_ORIGIN || request.nextUrl.origin)
  )
    return NextResponse.json(
      { error: "مبدأ درخواست معتبر نیست." },
      { status: 403 }
    )
  const token = (await cookies()).get("paletto_session")?.value
  const user = await transaction((s) => identify(s, token))
  if (
    !user ||
    !["artist", "gallery", "organizer", "curator", "admin"].includes(user.role)
  )
    return NextResponse.json(
      { error: "دسترسی بارگذاری ندارید." },
      { status: 403 }
    )
  const limit = 5 * 1024 * 1024
  if (Number(request.headers.get("content-length")) > limit)
    return NextResponse.json(
      { error: "حداکثر اندازه تصویر ۵ مگابایت است." },
      { status: 413 }
    )
  const reader = request.body?.getReader()
  if (!reader)
    return NextResponse.json(
      { error: "تصویری ارسال نشده است." },
      { status: 400 }
    )
  const parts: Uint8Array[] = []
  let length = 0
  while (true) {
    const next = await reader.read()
    if (next.done) break
    length += next.value.byteLength
    if (length > limit) {
      await reader.cancel()
      return NextResponse.json(
        { error: "حداکثر اندازه تصویر ۵ مگابایت است." },
        { status: 413 }
      )
    }
    parts.push(next.value)
  }
  const bytes = Buffer.concat(parts)
  const ext = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ? "png"
    : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      ? "jpg"
      : bytes.toString("ascii", 0, 4) === "RIFF" &&
          bytes.toString("ascii", 8, 12) === "WEBP"
        ? "webp"
        : null
  if (!ext)
    return NextResponse.json(
      { error: "فقط تصویر PNG، JPEG یا WebP مجاز است." },
      { status: 400 }
    )
  try {
    const root = mediaRoot()
    await mkdir(root, { recursive: true })
    const name = `${randomUUID()}.${ext}`
    await writeFile(join(root, name), bytes, { mode: 0o600, flag: "wx" })
    return NextResponse.json({ url: `/api/media/${name}` })
  } catch {
    return NextResponse.json(
      { error: "فضای ذخیره تصویر در دسترس نیست." },
      { status: 503 }
    )
  }
}
