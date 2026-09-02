"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  Car,
  Wallet,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  Power,
  Phone,
  Users,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useAuth } from "@/hooks/useAuth"
import { listenToDriverBookings } from "@/lib/services/booking-service"
import { BookingStatus } from "@/types"
import type { Booking } from "@/types"

type BookingRow = Booking & { id: string }

const ACTIVE_TRIP_STATUSES = new Set<BookingStatus>([
  BookingStatus.DriverAssigned,
  BookingStatus.DriverAccepted,
  BookingStatus.DriverEnRoute,
  BookingStatus.DriverArrived,
  BookingStatus.PassengerOnboard,
  BookingStatus.TripStarted,
])

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function toDayKey(iso: string | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

export default function DriverDashboardPage() {
  const { user } = useAuth()
  const [isOnline, setIsOnline] = useState(true)
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsubscribe = listenToDriverBookings(
      user.uid,
      (data) => {
        setBookings(data as BookingRow[])
        setLoading(false)
      },
      (err) => {
        console.error("DriverDashboardPage: listenToDriverBookings failed —", err)
        setLoading(false)
      }
    )
    return unsubscribe
  }, [user])

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const currentTrip = useMemo(
    () => bookings.find((b) => ACTIVE_TRIP_STATUSES.has(b.bookingStatus)) ?? null,
    [bookings]
  )

  const stats = useMemo(() => {
    const completed = bookings.filter((b) => b.bookingStatus === BookingStatus.TripCompleted)
    const completedToday = completed.filter((b) => toDayKey(b.createdAt) === todayKey)

    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(now.getDate() - 7)
    const monthAgo = new Date(now)
    monthAgo.setDate(now.getDate() - 30)

    const earningsSince = (since: Date) =>
      completed
        .filter((b) => {
          const d = new Date(b.createdAt || 0)
          return !Number.isNaN(d.getTime()) && d >= since
        })
        .reduce((sum, b) => sum + (b.total || 0), 0)

    const todaysTrips = bookings.filter((b) => toDayKey(b.createdAt) === todayKey).length

    return {
      todaysTrips,
      todaysEarnings: completedToday.reduce((sum, b) => sum + (b.total || 0), 0),
      weekEarnings: earningsSince(weekAgo),
      monthEarnings: earningsSince(monthAgo),
      completedCount: completed.length,
      assignedCount: bookings.length,
    }
  }, [bookings, todayKey])

  const recentTrips = useMemo(() => {
    return [...bookings]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 6)
  }, [bookings])

  const last7Days = useMemo(() => {
    const days: { key: string; label: string; amount: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({ key: d.toISOString().slice(0, 10), label: WEEKDAY_LABELS[d.getDay()], amount: 0 })
    }
    for (const b of bookings) {
      if (b.bookingStatus !== BookingStatus.TripCompleted) continue
      const key = toDayKey(b.createdAt)
      const day = days.find((d) => d.key === key)
      if (day) day.amount += b.total || 0
    }
    return days
  }, [bookings])

  const maxDayAmount = Math.max(1, ...last7Days.map((d) => d.amount))
  const weekTotal = last7Days.reduce((sum, d) => sum + d.amount, 0)

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#D4145A]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Online/Offline Toggle */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl",
                isOnline ? "bg-green-500" : "bg-gray-400"
              )}
            >
              <Power className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#172F52]">
                {isOnline ? "You are Online" : "You are Offline"}
              </h2>
              <p className="text-sm text-[#6B7280]">
                {isOnline
                  ? "You are available to receive trip requests"
                  : "Go online to start receiving trip requests"}
              </p>
            </div>
          </div>
          <Switch
            checked={isOnline}
            onCheckedChange={setIsOnline}
            className="data-[state=checked]:bg-green-500"
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <DashboardCard title="Today's Trips" value={stats.todaysTrips} icon={<Car className="h-5 w-5" />} />
        <DashboardCard title="Today's Earnings" value={`£${stats.todaysEarnings.toFixed(2)}`} icon={<Wallet className="h-5 w-5" />} />
        <DashboardCard title="Last 7 Days" value={`£${stats.weekEarnings.toFixed(2)}`} icon={<Calendar className="h-5 w-5" />} />
        <DashboardCard title="Last 30 Days" value={`£${stats.monthEarnings.toFixed(2)}`} icon={<TrendingUp className="h-5 w-5" />} />
        <DashboardCard title="Completed Trips" value={stats.completedCount} icon={<CheckCircle2 className="h-5 w-5" />} />
        <DashboardCard title="Assigned Trips" value={stats.assignedCount} icon={<Users className="h-5 w-5" />} />
      </div>

      {/* Current Trip */}
      {isOnline && currentTrip && (
        <div className="rounded-2xl border-2 border-[#D4145A]/20 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-pulse rounded-full bg-green-500" />
              <h3 className="text-lg font-bold text-[#172F52]">Current Trip</h3>
            </div>
            <Badge className="bg-[#D4145A]/10 text-[#D4145A]">
              {currentTrip.bookingNumber}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[#D4145A]" />
                <div>
                  <p className="text-xs font-medium uppercase text-[#6B7280]">Pickup</p>
                  <p className="text-sm font-semibold text-[#172F52]">{currentTrip.pickup?.formattedAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-green-500" />
                <div>
                  <p className="text-xs font-medium uppercase text-[#6B7280]">Destination</p>
                  <p className="text-sm font-semibold text-[#172F52]">{currentTrip.destination?.formattedAddress}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#6B7280]" />
                <span className="text-sm text-[#172F52]">
                  Passengers: <span className="font-medium">{currentTrip.passengers}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#6B7280]" />
                <span className="text-sm text-[#172F52]">
                  Pickup: <span className="font-medium">{currentTrip.date} at {currentTrip.pickupTime}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#6B7280]" />
                <span className="text-sm text-[#172F52]">
                  Fare: <span className="font-bold text-green-600">£{currentTrip.total?.toFixed(2)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/driver/active-trip">
              <Button className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90">
                <Navigation className="mr-2 h-4 w-4" />
                View Active Trip
              </Button>
            </Link>
            <Button variant="outline" className="border-[#D9E0E8]">
              <Phone className="mr-2 h-4 w-4" />
              Call Passenger
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Trips */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
              <h3 className="text-base font-bold text-[#172F52]">Recent Trips</h3>
              <Link
                href="/driver/bookings"
                className="text-sm font-medium text-[#D4145A] hover:underline"
              >
                View All
              </Link>
            </div>
            {recentTrips.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-[#6B7280]">
                No trips assigned to you yet
              </div>
            ) : (
              <div className="divide-y divide-[#F5F7FA]">
                {recentTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[#F5F7FA]/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-[#172F52]">
                          {trip.pickup?.formattedAddress?.split(",")[0]}
                        </p>
                        <ArrowRight className="h-3 w-3 shrink-0 text-[#6B7280]" />
                        <p className="truncate text-sm text-[#6B7280]">
                          {trip.destination?.formattedAddress?.split(",")[0]}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-xs text-[#6B7280]">
                          {trip.date} at {trip.pickupTime}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      <span className="text-sm font-bold text-[#172F52]">
                        £{trip.total?.toFixed(2)}
                      </span>
                      <StatusBadge status={trip.bookingStatus} type="booking" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Earnings Chart */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h3 className="mb-4 text-base font-bold text-[#172F52]">
            Weekly Earnings
          </h3>
          <div className="space-y-3">
            {last7Days.map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                <span className="w-8 text-xs font-medium text-[#6B7280]">
                  {item.label}
                </span>
                <div className="flex-1">
                  <div className="h-5 w-full overflow-hidden rounded-full bg-[#F5F7FA]">
                    <div
                      className="h-full rounded-full bg-[#D4145A] transition-all duration-500"
                      style={{ width: `${(item.amount / maxDayAmount) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="w-14 text-right text-xs font-semibold text-[#172F52]">
                  {item.amount > 0 ? `£${item.amount.toFixed(0)}` : "-"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-[#E5E7EB] pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6B7280]">This Week</span>
              <span className="text-lg font-bold text-[#172F52]">£{weekTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Navigation(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  )
}
