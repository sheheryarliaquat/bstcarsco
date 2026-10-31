"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  CalendarClock,
  CheckCircle2,
  XCircle,
  Wallet,
  Car,
  Plane,
  ClipboardList,
  MapPin,
  Clock,
  ArrowRight,
} from "lucide-react"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { BookingStatus, type Booking } from "@/types"
import { listenToPassengerBookings } from "@/lib/services/booking-service"
import { useAuth } from "@/hooks/useAuth"

export default function PassengerDashboardPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setBookings([])
      setLoading(false)
      return
    }

    const unsub = listenToPassengerBookings(
      user.uid,
      (data) => {
        setBookings(data)
        setLoading(false)
      },
      () => {
        setBookings([])
        setLoading(false)
      }
    )
    return unsub
  }, [user])

  const passengerBookings = bookings
  const upcomingCount = passengerBookings.filter(
    (b) =>
      b.bookingStatus === BookingStatus.Confirmed ||
      b.bookingStatus === BookingStatus.DriverAssigned ||
      b.bookingStatus === BookingStatus.DriverSearching ||
      b.bookingStatus === BookingStatus.OperatorPending ||
      b.bookingStatus === BookingStatus.CashPendingApproval
  ).length
  const completedCount = passengerBookings.filter(
    (b) => b.bookingStatus === BookingStatus.TripCompleted
  ).length
  const cancelledCount = passengerBookings.filter(
    (b) =>
      b.bookingStatus === BookingStatus.CancelledByPassenger ||
      b.bookingStatus === BookingStatus.CancelledByDriver ||
      b.bookingStatus === BookingStatus.CancelledByOperator ||
      b.bookingStatus === BookingStatus.CancelledByAdmin ||
      b.bookingStatus === BookingStatus.NoShow
  ).length
  const totalSpent = passengerBookings
    .filter((b) => b.paymentStatus === "completed")
    .reduce((sum, b) => sum + b.total, 0)

  const stats = [
    {
      title: "Upcoming Trips",
      value: upcomingCount,
      icon: <CalendarClock className="h-5 w-5" />,
    },
    {
      title: "Completed Trips",
      value: completedCount,
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
      title: "Cancelled Trips",
      value: cancelledCount,
      icon: <XCircle className="h-5 w-5" />,
    },
    {
      title: "Total Spent",
      value: `£${totalSpent.toFixed(2)}`,
      icon: <Wallet className="h-5 w-5" />,
    },
  ]

  const upcomingBooking = passengerBookings.find(
    (b) =>
      b.bookingStatus === BookingStatus.Confirmed ||
      b.bookingStatus === BookingStatus.DriverAssigned ||
      b.bookingStatus === BookingStatus.DriverSearching ||
      b.bookingStatus === BookingStatus.CashPendingApproval
  )

  const recentBookings = passengerBookings.slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1F4FD8] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1B2D]">Dashboard</h1>
        <p className="text-sm text-[#5B6577]">
          Welcome back. Here&apos;s your travel overview.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <DashboardCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/">
          <div className="flex items-center gap-3 rounded-xl border border-[#E2E6EC] bg-white p-4 transition-colors hover:border-[#1F4FD8]/30 hover:shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1F4FD8]/10 text-[#1F4FD8]">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F1B2D]">
                Book a Car
              </p>
              <p className="text-xs text-[#5B6577]">Get a quote now</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-[#5B6577]" />
          </div>
        </Link>
        <Link href="/airport-transfers">
          <div className="flex items-center gap-3 rounded-xl border border-[#E2E6EC] bg-white p-4 transition-colors hover:border-[#1F4FD8]/30 hover:shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F1B2D]/10 text-[#0F1B2D]">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F1B2D]">
                Airport Transfer
              </p>
              <p className="text-xs text-[#5B6577]">All major UK airports</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-[#5B6577]" />
          </div>
        </Link>
        <Link href="/passenger/bookings">
          <div className="flex items-center gap-3 rounded-xl border border-[#E2E6EC] bg-white p-4 transition-colors hover:border-[#1F4FD8]/30 hover:shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F1B2D]/10 text-[#0F1B2D]">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F1B2D]">
                View Bookings
              </p>
              <p className="text-xs text-[#5B6577]">Manage your trips</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-[#5B6577]" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming booking */}
        <div className="lg:col-span-1">
          <h2 className="mb-3 text-lg font-semibold text-[#0F1B2D]">
            Upcoming Booking
          </h2>
          {upcomingBooking ? (
            <div className="rounded-xl border border-[#E2E6EC] bg-white p-5">
              <div className="mb-3 flex items-start justify-between">
                <p className="text-xs font-medium text-[#5B6577]">
                  {upcomingBooking.bookingNumber}
                </p>
                <StatusBadge status={upcomingBooking.bookingStatus} />
              </div>
              <div className="mb-4 space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1F4FD8]" />
                  <div>
                    <p className="text-xs text-[#5B6577]">From</p>
                    <p className="text-sm font-medium text-[#0F1B2D]">
                      {upcomingBooking.pickup.formattedAddress.split(",")[0]}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0F1B2D]" />
                  <div>
                    <p className="text-xs text-[#5B6577]">To</p>
                    <p className="text-sm font-medium text-[#0F1B2D]">
                      {upcomingBooking.destination.formattedAddress.split(",")[0]}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#F4F6F9] pt-3">
                <div className="flex items-center gap-1.5 text-xs text-[#5B6577]">
                  <Clock className="h-3.5 w-3.5" />
                  {upcomingBooking.date} at {upcomingBooking.pickupTime}
                </div>
                <p className="text-sm font-bold text-[#0F1B2D]">
                  £{upcomingBooking.total.toFixed(2)}
                </p>
              </div>
              <Link
                href={`/ings/${upcomingBooking.bookingNumber}`}
                className="mt-3 block"
              >
                <Button
                  variant="outline"
                  className="w-full border-[#E2E6EC] text-[#0F1B2D]"
                >
                  View Details
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-[#E2E6EC] bg-white p-8 text-center">
              <CalendarClock className="mx-auto mb-3 h-10 w-10 text-[#E2E6EC]" />
              <p className="text-sm font-medium text-[#5B6577]">
                No upcoming bookings
              </p>
              <Link href="/">
                <Button className="mt-3 bg-[#1F4FD8] text-white hover:bg-[#1F4FD8]/90">
                  Book Now
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent bookings table */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#0F1B2D]">
              Recent Bookings
            </h2>
            <Link
              href="/ings"
              className="text-xs font-medium text-[#1F4FD8] hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-[#E2E6EC] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E6EC] bg-[#F4F6F9]">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">
                      ID
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">
                      Route
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">
                      Date
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">
                      Price
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr
                      key={booking.bookingNumber}
                      className="border-b border-[#F4F6F9] last:border-0 hover:bg-[#F4F6F9]/50"
                    >
                      <td className="px-4 py-3 text-xs font-medium text-[#5B6577]">
                        {booking.bookingNumber.split("-").pop()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-[#0F1B2D]">
                          {booking.pickup.formattedAddress.split(",")[0]}
                        </p>
                        <p className="text-xs text-[#5B6577]">
                          →{" "}
                          {booking.destination.formattedAddress.split(",")[0]}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#5B6577]">
                        {booking.date}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#0F1B2D]">
                        £{booking.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={booking.bookingStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
