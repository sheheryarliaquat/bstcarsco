"use client"

import { useState, useMemo } from "react"
import {
  Download,
  TrendingUp,
  ClipboardList,
  DollarSign,
  XCircle,
  Star,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { RatingStars } from "@/components/shared/RatingStars"

const REPORT_PERIODS = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "This Quarter", value: "qtr" },
  { label: "This Year", value: "yr" },
] as const

const dailyData = [
  { day: "Mon", bookings: 12, revenue: 1450 },
  { day: "Tue", bookings: 15, revenue: 1820 },
  { day: "Wed", bookings: 9, revenue: 1080 },
  { day: "Thu", bookings: 18, revenue: 2160 },
  { day: "Fri", bookings: 22, revenue: 2640 },
  { day: "Sat", bookings: 16, revenue: 1920 },
  { day: "Sun", bookings: 10, revenue: 1200 },
]

const driverPerformance = [
  { name: "Mohammed Hassan", trips: 42, rating: 4.9, revenue: "£4,250", completion: "97%" },
  { name: "Sarah O'Brien", trips: 38, rating: 4.8, revenue: "£3,890", completion: "95%" },
  { name: "Linda Nguyen", trips: 35, rating: 4.9, revenue: "£3,720", completion: "96%" },
  { name: "Amit Sharma", trips: 28, rating: 4.7, revenue: "£2,980", completion: "93%" },
  { name: "Peter Davies", trips: 18, rating: 4.6, revenue: "£1,850", completion: "91%" },
]

export default function OperatorReportsPage() {
  const [period, setPeriod] = useState("7d")

  const maxBookings = Math.max(...dailyData.map((d) => d.bookings))
  const maxRevenue = Math.max(...dailyData.map((d) => d.revenue))
  const totalBookings = dailyData.reduce((sum, d) => sum + d.bookings, 0)
  const totalRevenue = dailyData.reduce((sum, d) => sum + d.revenue, 0)
  const avgBookings = Math.round(totalBookings / dailyData.length)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Reports</h1>
          <p className="text-sm text-[#6B7280]">Analytics and performance insights.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-lg border border-[#D9E0E8] bg-white p-1">
            {REPORT_PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  period === p.value
                    ? "bg-[#172F52] text-white"
                    : "text-[#6B7280] hover:bg-[#F5F7FA]"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button variant="outline" className="border-[#D9E0E8]">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" className="border-[#D9E0E8]">
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <DashboardCard
          title="Total Bookings"
          value={totalBookings}
          icon={<ClipboardList className="h-5 w-5" />}
          trend="up"
          change={12}
        />
        <DashboardCard
          title="Revenue"
          value={`£${totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          trend="up"
          change={8}
        />
        <DashboardCard
          title="Cancellations"
          value={3}
          icon={<XCircle className="h-5 w-5" />}
          trend="down"
          change={15}
        />
        <DashboardCard
          title="Avg. Rating"
          value="4.8"
          icon={<Star className="h-5 w-5" />}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bookings by Day */}
        <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
          <h3 className="mb-1 text-base font-bold text-[#172F52]">Bookings by Day</h3>
          <p className="mb-4 text-xs text-[#6B7280]">
            Average: {avgBookings} bookings/day
          </p>
          <div className="space-y-3">
            {dailyData.map((item) => (
              <div key={item.day} className="flex items-center gap-3">
                <span className="w-8 text-xs font-medium text-[#6B7280]">
                  {item.day}
                </span>
                <div className="flex-1">
                  <div className="h-6 w-full overflow-hidden rounded-md bg-[#F5F7FA]">
                    <div
                      className="h-full rounded-md bg-[#172F52] transition-all duration-500"
                      style={{
                        width: `${(item.bookings / maxBookings) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="w-10 text-right text-xs font-bold text-[#172F52]">
                  {item.bookings}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Day */}
        <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
          <h3 className="mb-1 text-base font-bold text-[#172F52]">Revenue by Day</h3>
          <p className="mb-4 text-xs text-[#6B7280]">
            Total: £{totalRevenue.toLocaleString()} this period
          </p>
          <div className="space-y-3">
            {dailyData.map((item) => (
              <div key={item.day} className="flex items-center gap-3">
                <span className="w-8 text-xs font-medium text-[#6B7280]">
                  {item.day}
                </span>
                <div className="flex-1">
                  <div className="h-6 w-full overflow-hidden rounded-md bg-[#F5F7FA]">
                    <div
                      className="h-full rounded-md bg-[#D4145A] transition-all duration-500"
                      style={{
                        width: `${(item.revenue / maxRevenue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="w-16 text-right text-xs font-bold text-[#172F52]">
                  £{item.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Driver Performance */}
      <div className="rounded-xl border border-[#D9E0E8] bg-white">
        <div className="border-b border-[#D9E0E8] px-6 py-4">
          <h3 className="text-base font-bold text-[#172F52]">Driver Performance</h3>
          <p className="text-xs text-[#6B7280]">Top performing drivers this period</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#D9E0E8] bg-[#F5F7FA]">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#6B7280]">Driver</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#6B7280]">Trips</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#6B7280]">Rating</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#6B7280]">Revenue</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#6B7280]">Completion</th>
              </tr>
            </thead>
            <tbody>
              {driverPerformance.map((driver, i) => (
                <tr
                  key={driver.name}
                  className="border-b border-[#F5F7FA] last:border-0 hover:bg-[#F5F7FA]/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#172F52]/10 text-xs font-bold text-[#172F52]">
                        {i + 1}
                      </span>
                      <span className="font-medium text-[#172F52]">{driver.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-[#172F52]">
                    {driver.trips}
                  </td>
                  <td className="px-4 py-3">
                    <RatingStars rating={driver.rating} size="sm" />
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#172F52]">
                    {driver.revenue}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-[#F5F7FA]">
                        <div
                          className="h-full rounded-full bg-[#28A745]"
                          style={{ width: driver.completion }}
                        />
                      </div>
                      <span className="text-xs font-medium text-[#172F52]">
                        {driver.completion}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
