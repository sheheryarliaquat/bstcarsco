import { DEMO_DATA } from "@/constants"
import BookingDetail from "./BookingDetail"

export function generateStaticParams() {
  return DEMO_DATA.bookings.map((b) => ({ id: b.bookingNumber }))
}

export const dynamicParams = false

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return <BookingDetail params={params} />
}
