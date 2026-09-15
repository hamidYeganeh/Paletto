import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { mediaRoot } from "@/lib/platform/media"
export const runtime = "nodejs"
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!/^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(id))
    return new Response("Not found", { status: 404 })
  try {
    const data = await readFile(join(mediaRoot(), id))
    return new Response(data, {
      headers: {
        "Content-Type": id.endsWith(".png")
          ? "image/png"
          : id.endsWith(".webp")
            ? "image/webp"
            : "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
