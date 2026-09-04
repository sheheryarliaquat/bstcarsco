"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Car,
  Wallet,
  Calendar,
  TrendingUp,
  Star,
  CheckCircle2,
  Clock,
  ArrowRight,
  Power,
  Phone,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { BookingStatus, type Booking, type Driver } from "@/types"
import { useAuth } from "@/hooks/useAuth"
import { listenToDriverBookings } from "@/lib/services/booking-service"
import { getDriver, updateDriver } from "@/lib/services/driver-service"

const ACTIVE_STATUSES = new Set([
  BookingStatus.DriverEnRoute,
  BookingStatus.DriverArrived,
  BookingStatus.PassengerOnboard,
  BookingStatus.TripStarted,
])

function isSameDay(a: string, b: Date) {
  const d = new Date(a)
  return (
    d.getFullYear() === b.getFullYear() &&
    d.getMonth() === b.getMonth() &&
    d.getDate() === b.getDate()
  )
}

export default function DriverDashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Driver | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    if (!user) return
    const unsub = listenToDriverBookings(user.uid, setBookings, () => setBookings([]))
    return unsub
  }, [user])

  useEffect(() => {
    if (!user) return
    getDriver(user.uid).then(setProfile).catch(() => setProfile(null))
  }, [user])

  const isOnline = profile?.status === "online"

  function setIsOnline(next: boolean) {
    if (!user) return
    setProfile((p) => (p ? { ...p, status: next ? "online" : "offline" } : p))
    updateDriver(user.uid, { status: next ? "online" : "offline" }).catch(() => {})
  }

  const now = useMemo(() => new Date(), [])
  const weekStart = useMemo(() => {
    const d = new Date(now)
    d.setDate(d.getDate() - d.getDay())
    d.setHours(0, 0, 0, 0)
    return d
  }, [now])

  const todaysTrips = bookings.filter((b) => isSameDay(b.date, now))
  const todaysEarnings = todaysTrips
    .filter((b) => b.bookingStatus === BookingStatus.TripCompleted)
    .reduce((sum, b) => sum + b.total, 0)
  const thisWeekBookings = bookings.filter(
    (b) => new Date(b.date) >= weekStart && b.bookingStatus === BookingStatus.TripCompleted
  )
  const thisWeekEarnings = thisWeekBookings.reduce((sum, b) => sum + b.total, 0)
  const thisMonthEarnings = bookings
    .filter(
      (b) =>
        b.bookingStatus === BookingStatus.TripCompleted &&
        new Date(b.date).getMonth() === now.getMonth() &&
        new Date(b.date).getFullYear() === now.getFullYear()
    )
    .reduce((sum, b) => sum + b.total, 0)
  const completedCount = bookings.filter((b) => b.bookingStatus === BookingStatus.TripCompleted).length

  const currentTrip = bookings.find((b) => ACTIVE_STATUSES.has(b.bookingStatus))

  const recentTrips = [...bookings]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const weeklyChart = weekdayLabels.map((label, i) => {
    const total = thisWeekBookings
      .filter((b) => new Date(b.date).getDay() === i)
      .reduce((sum, b) => sum + b.total, 0)
    return { day: label, amount: total }
  })
  const maxDay = Math.max(...weeklyChart.map((d) => d.amount), 1)

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
        <DashboardCard
          title="Today's Trips"
          value={todaysTrips.length}
          icon={<Car className="h-5 w-5" />}
        />
        <DashboardCard
          title="Today's Earnings"
          value={`£${todaysEarnings.toFixed(2)}`}
          icon={<Wallet className="h-5 w-5" />}
        />
        <DashboardCard
          title="This Week"
          value={`£${thisWeekEarnings.toFixed(2)}`}
          icon={<Calendar className="h-5 w-5" />}
        />
        <DashboardCard
          title="This Month"
          value={`£${thisMonthEarnings.toFixed(2)}`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <DashboardCard
          title="Completed Trips"
          value={completedCount}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <DashboardCard
          title="Rating"
          value={(profile?.rating ?? 0).toFixed(1)}
          icon={<Star className="h-5 w-5" />}
        />
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
                  <p className="text-xs font-medium uppercase text-[#6B7280]">
                    Pickup
                  </p>
                  <p className="text-sm font-semibold text-[#172F52]">
                    {currentTrip.pickup.formattedAddress}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-green-500" />
                <div>
                  <p className="text-xs font-medium uppercase text-[#6B7280]">
                    Destination
                  </p>
                  <p className="text-sm font-semibold text-[#172F52]">
                    {currentTrip.destination.formattedAddress}
                  </p>
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
                  Pickup: <span className="font-medium">{currentTrip.pickupTime}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#6B7280]" />
                <span className="text-sm text-[#172F52]">
                  Fare: <span className="font-bold text-green-600">£{currentTrip.total.toFixed(2)}</span>
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
            <div className="divide-y divide-[#F5F7FA]">
              {recentTrips.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-[#6B7280]">No recent trips to display</p>
                </div>
              ) : (
                recentTrips.map((trip) => (
                  <div
                    key={trip.bookingNumber}
                    className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[#F5F7FA]/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-[#172F52]">
                          {trip.pickup.formattedAddress.split(",")[0]}
                        </p>
                        <ArrowRight className="h-3 w-3 shrink-0 text-[#6B7280]" />
                        <p className="truncate text-sm text-[#6B7280]">
                          {trip.destination.formattedAddress.split(",")[0]}
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
                        £{trip.total.toFixed(2)}
                      </span>
                      <StatusBadge status={trip.bookingStatus} type="booking" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Weekly Earnings */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h3 className="mb-4 text-base font-bold text-[#172F52]">
            Weekly Earnings
          </h3>
          <div className="space-y-3">
            {weeklyChart.map((item) => (
              <div key={item.day} className="flex items-center gap-3">
                <span className="w-8 text-xs font-medium text-[#6B7280]">
                  {item.day}
                </span>
                <div className="flex-1">
                  <div className="h-5 w-full overflow-hidden rounded-full bg-[#F5F7FA]">
                    <div
                      className="h-full rounded-full bg-[#D4145A] transition-all duration-500"
                      style={{
                        width: `${(item.amount / maxDay) * 100}%`,
                      }}
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
              <span className="text-lg font-bold text-[#172F52]">£{thisWeekEarnings.toFixed(2)}</span>
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
