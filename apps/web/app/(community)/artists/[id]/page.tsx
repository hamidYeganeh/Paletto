import { entityMetadata } from "@/lib/platform/metadata"
import { Detail } from "@/features/platform/Detail"
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <Detail type="artists" id={id} />
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return entityMetadata("artists", (await params).id)
}
