"use client"

import { useEffect, useMemo, useState } from "react"
import { Wallet, Calendar, TrendingUp, ArrowUpRight } from "lucide-react"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { useAuth } from "@/hooks/useAuth"
import { listenToDriverBookings } from "@/lib/services/booking-service"
import { BookingStatus, type Booking } from "@/types"

interface DaySummary {
  date: string
  trips: number
  gross: number
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function DriverEarningsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    if (!user) {
      setBookings([])
      return
    }
    const unsub = listenToDriverBookings(user.uid, setBookings, () => setBookings([]))
    return unsub
  }, [user])

  const completed = useMemo(
    () => bookings.filter((b) => b.bookingStatus === BookingStatus.TripCompleted),
    [bookings]
  )

  const now = useMemo(() => new Date(), [])
  const weekStart = useMemo(() => {
    const d = new Date(now)
    d.setDate(d.getDate() - d.getDay())
    d.setHours(0, 0, 0, 0)
    return d
  }, [now])

  const today = completed.filter((b) => isSameDay(new Date(b.date), now))
  const thisWeek = completed.filter((b) => new Date(b.date) >= weekStart)
  const thisMonth = completed.filter(
    (b) => new Date(b.date).getMonth() === now.getMonth() && new Date(b.date).getFullYear() === now.getFullYear()
  )

  const todayTotal = today.reduce((sum, b) => sum + b.total, 0)
  const weekTotal = thisWeek.reduce((sum, b) => sum + b.total, 0)
  const monthTotal = thisMonth.reduce((sum, b) => sum + b.total, 0)
  const allTimeTotal = completed.reduce((sum, b) => sum + b.total, 0)

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const weeklyChart = weekdayLabels.map((label, i) => ({
    day: label,
    amount: thisWeek.filter((b) => new Date(b.date).getDay() === i).reduce((sum, b) => sum + b.total, 0),
  }))
  const maxAmount = Math.max(...weeklyChart.map((d) => d.amount), 1)

  const history: DaySummary[] = useMemo(() => {
    const byDate = new Map<string, DaySummary>()
    for (const b of completed) {
      const key = b.date
      const existing = byDate.get(key) ?? { date: key, trips: 0, gross: 0 }
      existing.trips += 1
      existing.gross += b.total
      byDate.set(key, existing)
    }
    return [...byDate.values()].sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [completed])

  const historyColumns: Column<Record<string, unknown>>[] = [
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-[#172F52]">
          {new Date((row as unknown as DaySummary).date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "trips",
      header: "Trips",
      sortable: true,
      render: (row) => <span className="text-[#172F52]">{(row as unknown as DaySummary).trips}</span>,
    },
    {
      key: "gross",
      header: "Earnings",
      sortable: true,
      render: (row) => (
        <span className="font-bold text-green-600">£{(row as unknown as DaySummary).gross.toFixed(2)}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#172F52]">Earnings</h1>
        <p className="text-sm text-[#6B7280]">Track your completed trip earnings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <DashboardCard title="Today" value={`£${todayTotal.toFixed(2)}`} icon={<Wallet className="h-5 w-5" />} />
        <DashboardCard title="This Week" value={`£${weekTotal.toFixed(2)}`} icon={<Calendar className="h-5 w-5" />} />
        <DashboardCard title="This Month" value={`£${monthTotal.toFixed(2)}`} icon={<TrendingUp className="h-5 w-5" />} />
        <DashboardCard title="All Time" value={`£${allTimeTotal.toFixed(2)}`} icon={<ArrowUpRight className="h-5 w-5" />} />
      </div>

      {/* Weekly Bar Chart */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-[#E5E7EB]">
        <h3 className="mb-6 text-base font-bold text-[#172F52]">This Week</h3>
        <div className="flex items-end gap-4" style={{ height: 200 }}>
          {weeklyChart.map((item) => (
            <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs font-semibold text-[#172F52]">
                {item.amount > 0 ? `£${item.amount.toFixed(0)}` : ""}
              </span>
              <div
                className="w-full rounded-t-lg bg-[#D4145A] transition-all duration-500"
                style={{
                  height: `${(item.amount / maxAmount) * 150}px`,
                  minHeight: item.amount > 0 ? "4px" : "0px",
                }}
              />
              <span className="text-xs font-medium text-[#6B7280]">{item.day}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-[#E5E7EB] pt-4">
          <span className="text-sm text-[#6B7280]">Week Total</span>
          <span className="text-xl font-bold text-[#172F52]">£{weekTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Earnings History Table */}
      <div>
        <h3 className="mb-4 text-base font-bold text-[#172F52]">Earnings History</h3>
        <DataTable
          columns={historyColumns}
          data={history as unknown as Record<string, unknown>[]}
          searchable
          searchPlaceholder="Search by date..."
          keyExtractor={(row) => (row as unknown as DaySummary).date}
          emptyMessage="No completed trips yet"
          pagination={{
            page: 1,
            pageSize: 10,
            total: history.length,
            onPageChange: () => {},
          }}
        />
      </div>
    </div>
  )
}
