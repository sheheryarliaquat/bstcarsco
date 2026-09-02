"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Car,
  Wallet,
  Calendar,
  TrendingUp,
  Star,
  CheckCircle2,
  MapPin,
  Clock,
  ArrowRight,
  Power,
  Phone,
  Users,
  Luggage,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { RatingStars } from "@/components/shared/RatingStars"
import { BookingStatus } from "@/types"

const DEMO_RECENT_TRIPS: Array<any> = []

export default function DriverDashboardPage() {
  const [isOnline, setIsOnline] = useState(true)
  const currentTrip = DEMO_RECENT_TRIPS[1]

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
          value={0}
          icon={<Car className="h-5 w-5" />}
        />
        <DashboardCard
          title="Today's Earnings"
          value="£0"
          icon={<Wallet className="h-5 w-5" />}
        />
        <DashboardCard
          title="This Week"
          value="£0"
          icon={<Calendar className="h-5 w-5" />}
        />
        <DashboardCard
          title="This Month"
          value="£0"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <DashboardCard
          title="Completed Trips"
          value={0}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <DashboardCard
          title="Rating"
          value="0.0"
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
              {currentTrip.id}
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
                    {currentTrip.from}
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
                    {currentTrip.to}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#6B7280]" />
                <span className="text-sm text-[#172F52]">
                  Passenger: <span className="font-medium">{currentTrip.passenger}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#6B7280]" />
                <span className="text-sm text-[#172F52]">
                  Pickup: <span className="font-medium">{currentTrip.time}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#6B7280]" />
                <span className="text-sm text-[#172F52]">
                  Earnings: <span className="font-bold text-green-600">{currentTrip.amount}</span>
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
              {DEMO_RECENT_TRIPS.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-[#6B7280]">No recent trips to display</p>
                </div>
              ) : (
                DEMO_RECENT_TRIPS.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[#F5F7FA]/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-[#172F52]">
                          {trip.from.split(",")[0]}
                        </p>
                        <ArrowRight className="h-3 w-3 shrink-0 text-[#6B7280]" />
                        <p className="truncate text-sm text-[#6B7280]">
                          {trip.to.split(",")[0]}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-xs text-[#6B7280]">
                          {trip.date} at {trip.time}
                        </span>
                        <span className="text-xs text-[#6B7280]">
                          {trip.passenger}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      <span className="text-sm font-bold text-[#172F52]">
                        {trip.amount}
                      </span>
                      <StatusBadge status={trip.status} type="booking" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Earnings Chart Placeholder */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h3 className="mb-4 text-base font-bold text-[#172F52]">
            Weekly Earnings
          </h3>
          <div className="space-y-3">
            {[
              { day: "Mon", amount: 68, max: 120 },
              { day: "Tue", amount: 95, max: 120 },
              { day: "Wed", amount: 42, max: 120 },
              { day: "Thu", amount: 110, max: 120 },
              { day: "Fri", amount: 87, max: 120 },
              { day: "Sat", amount: 0, max: 120 },
              { day: "Sun", amount: 0, max: 120 },
            ].map((item) => (
              <div key={item.day} className="flex items-center gap-3">
                <span className="w-8 text-xs font-medium text-[#6B7280]">
                  {item.day}
                </span>
                <div className="flex-1">
                  <div className="h-5 w-full overflow-hidden rounded-full bg-[#F5F7FA]">
                    <div
                      className="h-full rounded-full bg-[#D4145A] transition-all duration-500"
                      style={{
                        width: `${(item.amount / item.max) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="w-14 text-right text-xs font-semibold text-[#172F52]">
                  {item.amount > 0 ? `£${item.amount}` : "-"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-[#E5E7EB] pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6B7280]">This Week</span>
              <span className="text-lg font-bold text-[#172F52]">£412.30</span>
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
