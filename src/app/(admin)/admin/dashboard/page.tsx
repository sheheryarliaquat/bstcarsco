"use client"

import { useState } from "react"
import Link from "next/link"
import {
  CalendarDays,
  Banknote,
  Navigation,
  Users,
  UserCheck,
  Car,
  Building,
  Clock,
  FileWarning,
  XCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Bell,
} from "lucide-react"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { RatingStars } from "@/components/shared/RatingStars"
import { DEMO_DATA } from "@/constants"
import { BookingStatus } from "@/types"

const RECENT_BOOKINGS: Array<{ id: string; passenger: string; pickup: string; destination: string; time: string; price: string; status: string }> = []

const BOOKINGS_BY_DAY = [
  { day: "Mon", count: 0 },
  { day: "Tue", count: 0 },
  { day: "Wed", count: 0 },
  { day: "Thu", count: 0 },
  { day: "Fri", count: 0 },
  { day: "Sat", count: 0 },
  { day: "Sun", count: 0 },
]

const REVENUE_BY_DAY = [
  { day: "Mon", amount: 0 },
  { day: "Tue", amount: 0 },
  { day: "Wed", amount: 0 },
  { day: "Thu", amount: 0 },
  { day: "Fri", amount: 0 },
  { day: "Sat", amount: 0 },
  { day: "Sun", amount: 0 },
]

const ONLINE_DRIVERS: Array<{ uid: string; firstName: string; lastName: string; status: string; rating: number; totalReviews: number }> = []

const SYSTEM_ALERTS: Array<{ id: number; type: "warning" | "info" | "error"; message: string; time: string }> = []

export default function AdminDashboardPage() {
  const maxBookings = Math.max(...BOOKINGS_BY_DAY.map((d) => d.count))
  const maxRevenue = Math.max(...REVENUE_BY_DAY.map((d) => d.amount))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Admin Dashboard</h1>
          <p className="text-sm text-[#6B7280]">Overview of platform activity and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6B7280]">Last updated: Just now</span>
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <DashboardCard title="Today's Bookings" value={0} icon={<CalendarDays className="h-5 w-5" />} />
        <DashboardCard title="Today's Revenue" value="£0" icon={<Banknote className="h-5 w-5" />} />
        <DashboardCard title="Active Trips" value={0} icon={<Navigation className="h-5 w-5" />} />
        <DashboardCard title="Available Drivers" value={0} icon={<UserCheck className="h-5 w-5" />} />
        <DashboardCard title="Online Drivers" value={0} icon={<Car className="h-5 w-5" />} />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <DashboardCard title="Total Passengers" value="0" icon={<Users className="h-5 w-5" />} />
        <DashboardCard title="Total Operators" value={0} icon={<Building className="h-5 w-5" />} />
        <DashboardCard title="Pending Approvals" value={0} icon={<Clock className="h-5 w-5" />} />
        <DashboardCard title="Pending Documents" value={0} icon={<FileWarning className="h-5 w-5" />} />
        <DashboardCard title="Cancelled Trips" value={0} icon={<XCircle className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bookings by Day */}
        <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#172F52]">Bookings by Day</h3>
            <span className="text-xs text-[#6B7280]">This week</span>
          </div>
          <div className="flex items-end gap-3 h-40">
            {BOOKINGS_BY_DAY.map((item) => (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold text-[#172F52]">{item.count}</span>
                <div className="w-full flex justify-center">
                  <div
                    className="w-full max-w-[36px] rounded-t-lg bg-[#D4145A] transition-all duration-500"
                    style={{ height: `${(item.count / maxBookings) * 120}px` }}
                  />
                </div>
                <span className="text-xs text-[#6B7280]">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Day */}
        <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#172F52]">Revenue by Day</h3>
            <span className="text-xs text-[#6B7280]">This week</span>
          </div>
          <div className="flex items-end gap-3 h-40">
            {REVENUE_BY_DAY.map((item) => (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold text-[#172F52]">£{(item.amount / 1000).toFixed(1)}k</span>
                <div className="w-full flex justify-center">
                  <div
                    className="w-full max-w-[36px] rounded-t-lg bg-[#172F52] transition-all duration-500"
                    style={{ height: `${(item.amount / maxRevenue) * 120}px` }}
                  />
                </div>
                <span className="text-xs text-[#6B7280]">{item.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Bookings */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-[#D9E0E8] bg-white">
            <div className="flex items-center justify-between border-b border-[#D9E0E8] px-6 py-4">
              <h3 className="text-base font-bold text-[#172F52]">Recent Bookings</h3>
              <Link href="/admin/bookings" className="text-sm font-medium text-[#D4145A] hover:underline">
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              {RECENT_BOOKINGS.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-[#6B7280]">No recent bookings to display</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#D9E0E8] bg-[#F5F7FA]">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">ID</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Passenger</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Route</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Time</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Price</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RECENT_BOOKINGS.map((booking) => (
                      <tr key={booking.id} className="border-b border-[#F5F7FA] transition-colors last:border-0 hover:bg-[#F5F7FA]/50">
                        <td className="px-4 py-3 font-mono text-xs font-medium text-[#172F52]">{booking.id}</td>
                        <td className="px-4 py-3 text-[#172F52]">{booking.passenger}</td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-[#6B7280]">
                          {booking.pickup.split(",")[0]} → {booking.destination.split(",")[0]}
                        </td>
                        <td className="px-4 py-3 text-[#6B7280]">{booking.time}</td>
                        <td className="px-4 py-3 font-semibold text-[#172F52]">{booking.price}</td>
                        <td className="px-4 py-3"><StatusBadge status={booking.status} type="booking" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Online Drivers + Alerts */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[#D9E0E8] bg-white">
            <div className="flex items-center justify-between border-b border-[#D9E0E8] px-6 py-4">
              <h3 className="text-base font-bold text-[#172F52]">Online Drivers</h3>
              <span className="text-xs text-[#6B7280]">{ONLINE_DRIVERS.length} active</span>
            </div>
            <div className="divide-y divide-[#F5F7FA]">
              {ONLINE_DRIVERS.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-[#6B7280]">No online drivers at the moment</p>
                </div>
              ) : (
                ONLINE_DRIVERS.map((driver) => (
                  <div key={driver.uid} className="flex items-center gap-3 px-6 py-3">
                    <div className="relative">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#172F52] text-xs font-semibold text-white">
                        {driver.firstName[0]}{driver.lastName[0]}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                          driver.status === "online" ? "bg-green-500" : driver.status === "busy" ? "bg-amber-500" : "bg-gray-400"
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#172F52]">
                        {driver.firstName} {driver.lastName}
                      </p>
                      <RatingStars rating={driver.rating} size="sm" />
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      driver.status === "online" ? "bg-green-50 text-green-700" : driver.status === "busy" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {driver.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* System Alerts */}
          <div className="rounded-xl border border-[#D9E0E8] bg-white">
            <div className="flex items-center justify-between border-b border-[#D9E0E8] px-6 py-4">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#D4145A]" />
                <h3 className="text-base font-bold text-[#172F52]">System Alerts</h3>
              </div>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D4145A] text-[10px] font-bold text-white">
                {SYSTEM_ALERTS.length}
              </span>
            </div>
            <div className="divide-y divide-[#F5F7FA]">
              {SYSTEM_ALERTS.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-[#6B7280]">No system alerts</p>
                </div>
              ) : (
                SYSTEM_ALERTS.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 px-6 py-3">
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      alert.type === "error" ? "bg-red-100" : alert.type === "warning" ? "bg-amber-100" : "bg-blue-100"
                    }`}>
                      <AlertTriangle className={`h-3.5 w-3.5 ${
                        alert.type === "error" ? "text-red-600" : alert.type === "warning" ? "text-amber-600" : "text-blue-600"
                      }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[#172F52]">{alert.message}</p>
                      <p className="mt-0.5 text-xs text-[#6B7280]">{alert.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Operator Performance */}
      <div className="rounded-xl border border-[#D9E0E8] bg-white">
        <div className="flex items-center justify-between border-b border-[#D9E0E8] px-6 py-4">
          <h3 className="text-base font-bold text-[#172F52]">Operator Performance</h3>
          <Link href="/admin/operators" className="text-sm font-medium text-[#D4145A] hover:underline">
            View All
          </Link>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-full text-center py-8">
            <p className="text-sm text-[#6B7280]">No operators to display</p>
          </div>
        </div>
      </div>
    </div>
  )
}
