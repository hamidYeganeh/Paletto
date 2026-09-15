import { entityMetadata } from "@/lib/platform/metadata"
import { Detail } from "@/features/platform/Detail"
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ref?: string | string[] }>
}) {
  const { id } = await params
  const { ref } = await searchParams
  return (
    <Detail
      type="collection"
      id={id}
      key={`${id}:${ref || ""}`}
      referral={typeof ref === "string" ? ref : ""}
    />
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return entityMetadata("collection", (await params).id)
}
