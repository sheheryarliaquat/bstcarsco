import BookingDetail from "./BookingDetail"

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return <BookingDetail params={params} />
}
