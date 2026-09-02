"use client"

import { useState, useEffect, useMemo } from "react"
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
  UserX,
  XCircle,
  AlertTriangle,
  Bell,
  Loader2,
} from "lucide-react"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { BookingStatus } from "@/types"
import type { Booking, User as AppUser } from "@/types"
import { listenToAllBookings } from "@/lib/services/booking-service"
import { listenToUsersByRole, getUsersByRole } from "@/lib/services/user-service"

type BookingRow = Booking & { id: string }

const ACTIVE_TRIP_STATUSES = new Set<BookingStatus>([
  BookingStatus.DriverAssigned,
  BookingStatus.DriverAccepted,
  BookingStatus.DriverEnRoute,
  BookingStatus.DriverArrived,
  BookingStatus.PassengerOnboard,
  BookingStatus.TripStarted,
])

const CANCELLED_STATUSES = new Set<BookingStatus>([
  BookingStatus.CancelledByPassenger,
  BookingStatus.CancelledByDriver,
  BookingStatus.CancelledByOperator,
  BookingStatus.CancelledByAdmin,
])

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function toDayKey(iso: string | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [drivers, setDrivers] = useState<AppUser[]>([])
  const [passengerCount, setPassengerCount] = useState<number | null>(null)
  const [operatorCount, setOperatorCount] = useState<number | null>(null)

  useEffect(() => {
    const unsubscribe = listenToAllBookings(
      (data) => {
        setBookings(data as BookingRow[])
        setBookingsLoading(false)
      },
      (err) => {
        console.error("AdminDashboardPage: listenToAllBookings failed —", err)
        setBookingsLoading(false)
      }
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = listenToUsersByRole(
      "driver",
      (users) => setDrivers(users),
      (err) => console.error("AdminDashboardPage: listenToUsersByRole(driver) failed —", err)
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    getUsersByRole("passenger")
      .then((users) => setPassengerCount(users.length))
      .catch((err) => console.error("AdminDashboardPage: getUsersByRole(passenger) failed —", err))
  }, [])

  useEffect(() => {
    getUsersByRole("operator")
      .then((users) => setOperatorCount(users.length))
      .catch((err) => console.error("AdminDashboardPage: getUsersByRole(operator) failed —", err))
  }, [])

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const stats = useMemo(() => {
    const bookingsToday = bookings.filter((b) => toDayKey(b.createdAt) === todayKey)
    const todaysRevenue = bookingsToday.reduce((sum, b) => sum + (b.total || 0), 0)
    const activeTrips = bookings.filter((b) => ACTIVE_TRIP_STATUSES.has(b.bookingStatus)).length
    const cancelledTrips = bookings.filter((b) => CANCELLED_STATUSES.has(b.bookingStatus)).length
    const pendingApprovals = bookings.filter((b) => b.bookingStatus === BookingStatus.CashPendingApproval).length
    const unassigned = bookings.filter(
      (b) => !b.driverId && (b.bookingStatus === BookingStatus.Confirmed || b.bookingStatus === BookingStatus.DriverSearching)
    ).length
    const availableDrivers = drivers.filter((d) => (d.status || "active") === "active").length
    const suspendedDrivers = drivers.filter((d) => d.status === "suspended").length

    return { bookingsToday, todaysRevenue, activeTrips, cancelledTrips, pendingApprovals, unassigned, availableDrivers, suspendedDrivers }
  }, [bookings, drivers, todayKey])

  const last7Days = useMemo(() => {
    const days: { key: string; label: string; count: number; revenue: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      days.push({ key, label: WEEKDAY_LABELS[d.getDay()], count: 0, revenue: 0 })
    }
    for (const b of bookings) {
      const key = toDayKey(b.createdAt)
      const day = days.find((d) => d.key === key)
      if (day) {
        day.count += 1
        day.revenue += b.total || 0
      }
    }
    return days
  }, [bookings])

  const maxBookings = Math.max(1, ...last7Days.map((d) => d.count))
  const maxRevenue = Math.max(1, ...last7Days.map((d) => d.revenue))

  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 6)
  }, [bookings])

  const alerts = useMemo(() => {
    const items: { id: string; type: "warning" | "error" | "info"; message: string }[] = []
    if (stats.pendingApprovals > 0) {
      items.push({ id: "cash", type: "warning", message: `${stats.pendingApprovals} cash booking${stats.pendingApprovals === 1 ? "" : "s"} awaiting approval` })
    }
    if (stats.unassigned > 0) {
      items.push({ id: "unassigned", type: "warning", message: `${stats.unassigned} booking${stats.unassigned === 1 ? "" : "s"} awaiting driver assignment` })
    }
    if (stats.suspendedDrivers > 0) {
      items.push({ id: "suspended", type: "info", message: `${stats.suspendedDrivers} driver${stats.suspendedDrivers === 1 ? "" : "s"} currently suspended` })
    }
    if (items.length === 0) {
      items.push({ id: "none", type: "info", message: "No alerts right now — everything looks on track." })
    }
    return items
  }, [stats])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Admin Dashboard</h1>
          <p className="text-sm text-[#6B7280]">Overview of platform activity and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6B7280]">{bookingsLoading ? "Loading…" : "Live"}</span>
          <div className={`h-2 w-2 rounded-full ${bookingsLoading ? "bg-gray-300" : "bg-green-500 animate-pulse"}`} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <DashboardCard title="Today's Bookings" value={stats.bookingsToday.length} icon={<CalendarDays className="h-5 w-5" />} />
        <DashboardCard title="Today's Revenue" value={`£${stats.todaysRevenue.toFixed(2)}`} icon={<Banknote className="h-5 w-5" />} />
        <DashboardCard title="Active Trips" value={stats.activeTrips} icon={<Navigation className="h-5 w-5" />} />
        <DashboardCard title="Available Drivers" value={stats.availableDrivers} icon={<UserCheck className="h-5 w-5" />} />
        <DashboardCard title="Suspended Drivers" value={stats.suspendedDrivers} icon={<UserX className="h-5 w-5" />} />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <DashboardCard title="Total Passengers" value={passengerCount ?? "…"} icon={<Users className="h-5 w-5" />} />
        <DashboardCard title="Total Operators" value={operatorCount ?? 0} icon={<Building className="h-5 w-5" />} />
        <DashboardCard title="Cash Pending Approval" value={stats.pendingApprovals} icon={<Clock className="h-5 w-5" />} />
        <DashboardCard title="Awaiting Driver" value={stats.unassigned} icon={<Car className="h-5 w-5" />} />
        <DashboardCard title="Cancelled Trips" value={stats.cancelledTrips} icon={<XCircle className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bookings by Day */}
        <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#172F52]">Bookings by Day</h3>
            <span className="text-xs text-[#6B7280]">Last 7 days</span>
          </div>
          <div className="flex items-end gap-3 h-40">
            {last7Days.map((item) => (
              <div key={item.key} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold text-[#172F52]">{item.count}</span>
                <div className="w-full flex justify-center">
                  <div
                    className="w-full max-w-[36px] rounded-t-lg bg-[#D4145A] transition-all duration-500"
                    style={{ height: `${(item.count / maxBookings) * 120}px` }}
                  />
                </div>
                <span className="text-xs text-[#6B7280]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Day */}
        <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#172F52]">Revenue by Day</h3>
            <span className="text-xs text-[#6B7280]">Last 7 days</span>
          </div>
          <div className="flex items-end gap-3 h-40">
            {last7Days.map((item) => (
              <div key={item.key} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold text-[#172F52]">£{(item.revenue / 1000).toFixed(1)}k</span>
                <div className="w-full flex justify-center">
                  <div
                    className="w-full max-w-[36px] rounded-t-lg bg-[#172F52] transition-all duration-500"
                    style={{ height: `${(item.revenue / maxRevenue) * 120}px` }}
                  />
                </div>
                <span className="text-xs text-[#6B7280]">{item.label}</span>
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
            {bookingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-[#D4145A]" />
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#6B7280]">No bookings yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#D9E0E8] bg-[#F5F7FA]">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">ID</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Route</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Time</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Price</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-[#F5F7FA] transition-colors last:border-0 hover:bg-[#F5F7FA]/50">
                        <td className="px-4 py-3 font-mono text-xs font-medium text-[#172F52]">{booking.bookingNumber}</td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-[#6B7280]">
                          {booking.pickup?.formattedAddress?.split(",")[0]} → {booking.destination?.formattedAddress?.split(",")[0]}
                        </td>
                        <td className="px-4 py-3 text-[#6B7280]">{booking.pickupTime}</td>
                        <td className="px-4 py-3 font-semibold text-[#172F52]">£{booking.total?.toFixed(2)}</td>
                        <td className="px-4 py-3"><StatusBadge status={booking.bookingStatus} type="booking" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Drivers + Alerts */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[#D9E0E8] bg-white">
            <div className="flex items-center justify-between border-b border-[#D9E0E8] px-6 py-4">
              <h3 className="text-base font-bold text-[#172F52]">Drivers</h3>
              <Link href="/admin/drivers" className="text-xs font-medium text-[#D4145A] hover:underline">
                {drivers.length} total
              </Link>
            </div>
            <div className="divide-y divide-[#F5F7FA]">
              {drivers.length === 0 ? (
                <div className="px-6 py-6 text-center text-sm text-[#6B7280]">
                  No drivers yet — add one from the Drivers page
                </div>
              ) : (
                drivers.slice(0, 6).map((driver) => {
                  const suspended = driver.status === "suspended"
                  return (
                    <div key={driver.uid} className="flex items-center gap-3 px-6 py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#172F52] text-xs font-semibold text-white">
                        {(driver.firstName?.[0] ?? "?")}{(driver.lastName?.[0] ?? "")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#172F52]">
                          {driver.firstName} {driver.lastName}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        suspended ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                      }`}>
                        {suspended ? "Suspended" : "Active"}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Alerts */}
          <div className="rounded-xl border border-[#D9E0E8] bg-white">
            <div className="flex items-center justify-between border-b border-[#D9E0E8] px-6 py-4">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#D4145A]" />
                <h3 className="text-base font-bold text-[#172F52]">Alerts</h3>
              </div>
            </div>
            <div className="divide-y divide-[#F5F7FA]">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 px-6 py-3">
                  <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    alert.type === "error" ? "bg-red-100" : alert.type === "warning" ? "bg-amber-100" : "bg-blue-100"
                  }`}>
                    <AlertTriangle className={`h-3.5 w-3.5 ${
                      alert.type === "error" ? "text-red-600" : alert.type === "warning" ? "text-amber-600" : "text-blue-600"
                    }`} />
                  </div>
                  <p className="text-sm text-[#172F52]">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
