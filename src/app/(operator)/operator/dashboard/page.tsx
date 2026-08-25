"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Car,
  Users,
  Wallet,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  MapPin,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { RatingStars } from "@/components/shared/RatingStars"
import { DEMO_DATA } from "@/constants"
import { BookingStatus, type Driver } from "@/types"

const recentBookings = [
  {
    id: "UKTB-2026-000002",
    passenger: "Emma Thompson",
    from: "1 Manchester Square, London W1U",
    to: "10 Downing Street, London SW1A",
    time: "14:00",
    driver: "Sarah O'Brien",
    vehicle: "Mercedes E-Class",
    amount: "£11.52",
    status: BookingStatus.DriverEnRoute,
  },
  {
    id: "UKTB-2026-000005",
    passenger: "David Morgan",
    from: "Waverley Station, Edinburgh",
    to: "Glasgow Central Station",
    time: "09:00",
    driver: "Linda Nguyen",
    vehicle: "Citroen Berlingo WAV",
    amount: "£410.40",
    status: BookingStatus.TripStarted,
  },
  {
    id: "UKTB-2026-000004",
    passenger: "Sophie Clarkson",
    from: "The O2 Arena, London SE10",
    to: "Heathrow Airport, Terminal 5",
    time: "15:30",
    driver: "Unassigned",
    vehicle: "Minibus",
    amount: "£45.60",
    status: BookingStatus.PendingPayment,
  },
  {
    id: "UKTB-2026-000003",
    passenger: "Raj Patel",
    from: "Birmingham New Street",
    to: "Manchester Airport",
    time: "10:00",
    driver: "Amit Sharma",
    vehicle: "Ford Mondeo Estate",
    amount: "£102.60",
    status: BookingStatus.Confirmed,
  },
  {
    id: "UKTB-2026-000006",
    passenger: "James Wilson",
    from: "221B Baker Street, London NW1",
    to: "10 Downing Street, London SW1A",
    time: "18:30",
    driver: "Unassigned",
    vehicle: "Saloon",
    amount: "£13.80",
    status: BookingStatus.PaymentFailed,
  },
]

const driverStatusData: { driver: Driver; tripsToday: number }[] = [
  { driver: DEMO_DATA.drivers[0], tripsToday: 5 },
  { driver: DEMO_DATA.drivers[1], tripsToday: 3 },
  { driver: DEMO_DATA.drivers[2], tripsToday: 2 },
  { driver: DEMO_DATA.drivers[3], tripsToday: 0 },
  { driver: DEMO_DATA.drivers[4], tripsToday: 4 },
]

export default function OperatorDashboardPage() {
  const [bookings, setBookings] = useState(recentBookings)

  function handleAccept(id: string) {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: BookingStatus.DriverAssigned as BookingStatus } : b
      )
    )
  }

  function handleReject(id: string) {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: BookingStatus.CancelledByOperator as BookingStatus } : b
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Dashboard</h1>
          <p className="text-sm text-[#6B7280]">Welcome back. Here&apos;s your fleet overview.</p>
        </div>
        <Link href="/operator/bookings">
          <Button className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90">
            <ClipboardList className="mr-2 h-4 w-4" />
            View Bookings
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <DashboardCard
          title="Today's Bookings"
          value={8}
          icon={<ClipboardList className="h-5 w-5" />}
          trend="up"
          change={12}
        />
        <DashboardCard
          title="Active Trips"
          value={3}
          icon={<Activity className="h-5 w-5" />}
        />
        <DashboardCard
          title="Total Drivers"
          value={12}
          icon={<Users className="h-5 w-5" />}
        />
        <DashboardCard
          title="Online Drivers"
          value={7}
          icon={<Car className="h-5 w-5" />}
          trend="up"
          change={8}
        />
        <DashboardCard
          title="Revenue Today"
          value="£1,245"
          icon={<Wallet className="h-5 w-5" />}
          trend="up"
          change={15}
        />
        <DashboardCard
          title="Monthly Revenue"
          value="£28,500"
          icon={<TrendingUp className="h-5 w-5" />}
          trend="up"
          change={7}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Bookings */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-[#D9E0E8] bg-white">
            <div className="flex items-center justify-between border-b border-[#D9E0E8] px-6 py-4">
              <h3 className="text-base font-bold text-[#172F52]">Recent Bookings</h3>
              <Link
                href="/operator/bookings"
                className="text-sm font-medium text-[#D4145A] hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#D9E0E8] bg-[#F5F7FA]">
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-[#6B7280]">Booking ID</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-[#6B7280]">Passenger</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-[#6B7280]">Route</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-[#6B7280]">Amount</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-[#6B7280]">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-[#6B7280]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-b border-[#F5F7FA] last:border-0 hover:bg-[#F5F7FA]/50"
                    >
                      <td className="px-4 py-3 font-medium text-[#172F52]">{booking.id}</td>
                      <td className="px-4 py-3 text-[#172F52]">{booking.passenger}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 max-w-[200px]">
                          <MapPin className="h-3 w-3 shrink-0 text-[#D4145A]" />
                          <span className="truncate text-[#6B7280]">
                            {booking.from.split(",")[0]} → {booking.to.split(",")[0]}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#172F52]">{booking.amount}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={booking.status} type="booking" />
                      </td>
                      <td className="px-4 py-3">
                        {booking.status === BookingStatus.PendingPayment && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleAccept(booking.id)}
                              className="h-7 bg-[#28A745] text-white hover:bg-[#28A745]/90"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(booking.id)}
                              className="h-7"
                            >
                              <XCircle className="h-3 w-3" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Driver Status Overview */}
        <div className="rounded-xl border border-[#D9E0E8] bg-white">
          <div className="flex items-center justify-between border-b border-[#D9E0E8] px-6 py-4">
            <h3 className="text-base font-bold text-[#172F52]">Driver Status</h3>
            <Link
              href="/operator/drivers"
              className="text-sm font-medium text-[#D4145A] hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="divide-y divide-[#F5F7FA]">
            {driverStatusData.map((item) => (
              <div
                key={item.driver.uid}
                className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-[#F5F7FA]/50"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#172F52]/10 text-xs font-bold text-[#172F52]">
                      {item.driver.firstName[0]}{item.driver.lastName[0]}
                    </div>
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                        item.driver.status === "online"
                          ? "bg-green-500"
                          : item.driver.status === "busy"
                          ? "bg-amber-500"
                          : "bg-gray-400"
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#172F52]">
                      {item.driver.firstName} {item.driver.lastName}
                    </p>
                    <p className="text-[11px] text-[#6B7280]">
                      {item.tripsToday} trips today
                    </p>
                  </div>
                </div>
                <Badge
                  className={cn(
                    "text-[10px] font-semibold",
                    item.driver.status === "online"
                      ? "bg-green-500/10 text-green-600"
                      : item.driver.status === "busy"
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {item.driver.status === "online"
                    ? "Online"
                    : item.driver.status === "busy"
                    ? "Busy"
                    : "Offline"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#28A745]/10">
              <CheckCircle2 className="h-5 w-5 text-[#28A745]" />
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Completion Rate</p>
              <p className="text-2xl font-bold text-[#172F52]">94.2%</p>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#F5F7FA]">
            <div className="h-full rounded-full bg-[#28A745]" style={{ width: "94.2%" }} />
          </div>
        </div>

        <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DC3545]/10">
              <XCircle className="h-5 w-5 text-[#DC3545]" />
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Cancellation Rate</p>
              <p className="text-2xl font-bold text-[#172F52]">3.8%</p>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#F5F7FA]">
            <div className="h-full rounded-full bg-[#DC3545]" style={{ width: "3.8%" }} />
          </div>
        </div>

        <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37]/10">
              <Star className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Average Rating</p>
              <p className="text-2xl font-bold text-[#172F52]">4.8</p>
            </div>
          </div>
          <RatingStars rating={4.8} size="lg" count={3245} />
        </div>
      </div>
    </div>
  )
}

function ClipboardList(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
    </svg>
  )
}
