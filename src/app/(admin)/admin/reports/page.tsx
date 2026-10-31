"use client"

import { useState, useMemo } from "react"
import {
  Download,
  FileText,
  Calendar,
  BarChart2,
  TrendingUp,
  Users,
  Building,
  Route,
  Banknote,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DashboardCard } from "@/components/shared/DashboardCard"

const BOOKING_REPORT_DATA = [
  { id: "UKTB-2026-000001", date: "2026-08-20", passenger: "James Wilson", operator: "Kingsley Travel", pickup: "London", destination: "Heathrow", status: "completed", total: 51.00 },
  { id: "UKTB-2026-000002", date: "2026-08-24", passenger: "Emma Thompson", operator: "Kingsley Travel", pickup: "London", destination: "Westminster", status: "active", total: 11.52 },
  { id: "UKTB-2026-000003", date: "2026-08-22", passenger: "Raj Patel", operator: "Northern Minicab", pickup: "Birmingham", destination: "Manchester", status: "confirmed", total: 102.60 },
  { id: "UKTB-2026-000004", date: "2026-08-25", passenger: "Sophie Clarkson", operator: "Kingsley Travel", pickup: "London", destination: "Heathrow", status: "pending", total: 45.60 },
  { id: "UKTB-2026-000005", date: "2026-08-23", passenger: "David Morgan", operator: "Capital Minicabs", pickup: "Edinburgh", destination: "Glasgow", status: "active", total: 410.40 },
  { id: "UKTB-2026-000006", date: "2026-08-25", passenger: "James Wilson", operator: "Kingsley Travel", pickup: "London", destination: "Westminster", status: "failed", total: 13.80 },
]

const REVENUE_REPORT_DATA = [
  { operator: "Kingsley Travel", bookings: 62, revenue: 12450, commission: 1867.50, net: 10582.50 },
  { operator: "Northern Minicab Services", bookings: 41, revenue: 8320, commission: 1497.60, net: 6822.40 },
  { operator: "Capital Minicabs Edinburgh", bookings: 28, revenue: 5680, commission: 681.60, net: 4998.40 },
  { operator: "City Cars Bristol", bookings: 15, revenue: 2890, commission: 346.80, net: 2543.20 },
  { operator: "Highland Minicabs", bookings: 8, revenue: 1560, commission: 249.60, net: 1310.40 },
]

const DRIVER_REPORT_DATA = [
  { name: "Mohammed Hassan", operator: "Kingsley Travel", trips: 48, revenue: 2150, rating: 4.9, status: "online" },
  { name: "Sarah O'Brien", operator: "Kingsley Travel", trips: 42, revenue: 1890, rating: 4.8, status: "online" },
  { name: "Amit Sharma", operator: "Northern Minicab", trips: 35, revenue: 1540, rating: 4.7, status: "busy" },
  { name: "Peter Davies", operator: "Northern Minicab", trips: 28, revenue: 1120, rating: 4.6, status: "offline" },
  { name: "Linda Nguyen", operator: "Capital Minicabs", trips: 38, revenue: 1780, rating: 4.9, status: "online" },
]

const OPERATOR_REPORT_DATA = [
  { name: "Kingsley Travel", drivers: 45, bookings: 62, revenue: 12450, avgRating: 4.8, responseTime: "2.1m" },
  { name: "Northern Minicab Services", drivers: 32, bookings: 41, revenue: 8320, avgRating: 4.6, responseTime: "3.2m" },
  { name: "Capital Minicabs Edinburgh", drivers: 22, bookings: 28, revenue: 5680, avgRating: 4.7, responseTime: "2.8m" },
  { name: "City Cars Bristol", drivers: 15, bookings: 15, revenue: 2890, avgRating: 4.5, responseTime: "4.1m" },
  { name: "Highland Minicabs", drivers: 10, bookings: 8, revenue: 1560, avgRating: 4.4, responseTime: "5.0m" },
]

const POPULAR_ROUTES_DATA = [
  { from: "Central London", to: "Heathrow Airport", count: 184, avgPrice: 48.50 },
  { from: "Manchester City Centre", to: "Manchester Airport", count: 126, avgPrice: 32.00 },
  { from: "Edinburgh Waverley", to: "Edinburgh Airport", count: 98, avgPrice: 24.50 },
  { from: "Central London", to: "Gatwick Airport", count: 87, avgPrice: 55.00 },
  { from: "Birmingham City Centre", to: "Birmingham Airport", count: 72, avgPrice: 22.00 },
  { from: "Liverpool ONE", to: "Liverpool John Lennon Airport", count: 54, avgPrice: 18.50 },
  { from: "Central London", to: "Stansted Airport", count: 48, avgPrice: 62.00 },
  { from: "Glasgow City Centre", to: "Glasgow Airport", count: 43, avgPrice: 20.00 },
]

const TABS = [
  { key: "bookings", label: "Bookings", icon: FileText },
  { key: "revenue", label: "Revenue", icon: Banknote },
  { key: "drivers", label: "Drivers", icon: Users },
  { key: "operators", label: "Operators", icon: Building },
  { key: "routes", label: "Popular Routes", icon: Route },
]

const REVENUE_MAX = Math.max(...REVENUE_REPORT_DATA.map((r) => r.revenue))

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState("bookings")
  const [dateFrom, setDateFrom] = useState("2026-08-01")
  const [dateTo, setDateTo] = useState("2026-08-31")

  function exportCSV(data: Record<string, unknown>[], filename: string) {
    if (data.length === 0) return
    const headers = Object.keys(data[0])
    const rows = data.map((row) => headers.map((h) => String(row[h] ?? "")))
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Reports</h1>
          <p className="text-sm text-[#5B6577]">Platform analytics and data export</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#5B6577]" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]"
          />
          <span className="text-xs text-[#5B6577]">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]"
          />
        </div>
      </div>

      <div className="flex gap-1 rounded-lg bg-[#F4F6F9] p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-white text-[#0F1B2D] shadow-sm"
                  : "text-[#5B6577] hover:text-[#0F1B2D]"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Bookings Report */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <DashboardCard title="Total Bookings" value={BOOKING_REPORT_DATA.length} icon={<FileText className="h-5 w-5" />} />
            <DashboardCard title="Completed" value={BOOKING_REPORT_DATA.filter((b) => b.status === "completed").length} icon={<TrendingUp className="h-5 w-5" />} />
            <DashboardCard title="Active" value={BOOKING_REPORT_DATA.filter((b) => b.status === "active").length} icon={<BarChart2 className="h-5 w-5" />} />
            <DashboardCard title="Total Revenue" value={`£${BOOKING_REPORT_DATA.reduce((s, b) => s + b.total, 0).toFixed(2)}`} icon={<Banknote className="h-5 w-5" />} />
          </div>
          <div className="rounded-xl border border-[#E2E6EC] bg-white">
            <div className="flex items-center justify-between border-b border-[#E2E6EC] px-6 py-4">
              <h3 className="text-base font-bold text-[#0F1B2D]">Bookings Report</h3>
              <Button variant="outline" size="sm" className="border-[#E2E6EC]" onClick={() => exportCSV(BOOKING_REPORT_DATA as unknown as Record<string, unknown>[], "bookings-report")}>
                <Download className="mr-1 h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E6EC] bg-[#F4F6F9]">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Booking ID</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Passenger</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Operator</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Route</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {BOOKING_REPORT_DATA.map((b) => (
                    <tr key={b.id} className="border-b border-[#F4F6F9] last:border-0 hover:bg-[#F4F6F9]/50">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-[#0F1B2D]">{b.id}</td>
                      <td className="px-4 py-3 text-[#5B6577]">{b.date}</td>
                      <td className="px-4 py-3 text-[#0F1B2D]">{b.passenger}</td>
                      <td className="px-4 py-3 text-[#5B6577]">{b.operator}</td>
                      <td className="px-4 py-3 text-[#5B6577]">{b.pickup} → {b.destination}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                          b.status === "completed" && "bg-green-50 text-green-700",
                          b.status === "active" && "bg-blue-50 text-blue-700",
                          b.status === "confirmed" && "bg-[#0F1B2D]/10 text-[#0F1B2D]",
                          b.status === "pending" && "bg-amber-50 text-amber-700",
                          b.status === "failed" && "bg-red-50 text-red-700"
                        )}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#0F1B2D]">£{b.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Report */}
      {activeTab === "revenue" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <DashboardCard title="Total Revenue" value={`£${REVENUE_REPORT_DATA.reduce((s, r) => s + r.revenue, 0).toLocaleString()}`} icon={<Banknote className="h-5 w-5" />} trend="up" change={12} />
            <DashboardCard title="Total Commission" value={`£${REVENUE_REPORT_DATA.reduce((s, r) => s + r.commission, 0).toLocaleString()}`} icon={<TrendingUp className="h-5 w-5" />} />
            <DashboardCard title="Operators" value={REVENUE_REPORT_DATA.length} icon={<Building className="h-5 w-5" />} />
            <DashboardCard title="Avg Revenue/Operator" value={`£${Math.round(REVENUE_REPORT_DATA.reduce((s, r) => s + r.revenue, 0) / REVENUE_REPORT_DATA.length).toLocaleString()}`} icon={<BarChart2 className="h-5 w-5" />} />
          </div>

          {/* Revenue Chart */}
          <div className="rounded-xl border border-[#E2E6EC] bg-white p-6">
            <h3 className="mb-4 text-base font-bold text-[#0F1B2D]">Revenue by Operator</h3>
            <div className="flex items-end gap-4 h-48">
              {REVENUE_REPORT_DATA.map((item) => (
                <div key={item.operator} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-[#0F1B2D]">£{(item.revenue / 1000).toFixed(1)}k</span>
                  <div
                    className="w-full max-w-[50px] rounded-t-lg bg-[#0F1B2D] transition-all duration-500"
                    style={{ height: `${(item.revenue / REVENUE_MAX) * 140}px` }}
                  />
                  <span className="text-center text-[10px] text-[#5B6577] leading-tight">{item.operator.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Table */}
          <div className="rounded-xl border border-[#E2E6EC] bg-white">
            <div className="flex items-center justify-between border-b border-[#E2E6EC] px-6 py-4">
              <h3 className="text-base font-bold text-[#0F1B2D]">Revenue Breakdown</h3>
              <Button variant="outline" size="sm" className="border-[#E2E6EC]" onClick={() => exportCSV(REVENUE_REPORT_DATA as unknown as Record<string, unknown>[], "revenue-report")}>
                <Download className="mr-1 h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E6EC] bg-[#F4F6F9]">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Operator</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Bookings</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Revenue</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Commission</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {REVENUE_REPORT_DATA.map((r) => (
                    <tr key={r.operator} className="border-b border-[#F4F6F9] last:border-0 hover:bg-[#F4F6F9]/50">
                      <td className="px-4 py-3 font-medium text-[#0F1B2D]">{r.operator}</td>
                      <td className="px-4 py-3 text-[#5B6577]">{r.bookings}</td>
                      <td className="px-4 py-3 font-semibold text-[#0F1B2D]">£{r.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-[#1F4FD8]">£{r.commission.toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold text-[#0F1B2D]">£{r.net.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Drivers Report */}
      {activeTab === "drivers" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <DashboardCard title="Total Drivers" value={DRIVER_REPORT_DATA.length} icon={<Users className="h-5 w-5" />} />
            <DashboardCard title="Total Trips" value={DRIVER_REPORT_DATA.reduce((s, d) => s + d.trips, 0)} icon={<BarChart2 className="h-5 w-5" />} />
            <DashboardCard title="Total Revenue" value={`£${DRIVER_REPORT_DATA.reduce((s, d) => s + d.revenue, 0).toLocaleString()}`} icon={<Banknote className="h-5 w-5" />} />
            <DashboardCard title="Avg Rating" value={(DRIVER_REPORT_DATA.reduce((s, d) => s + d.rating, 0) / DRIVER_REPORT_DATA.length).toFixed(1)} icon={<TrendingUp className="h-5 w-5" />} />
          </div>
          <div className="rounded-xl border border-[#E2E6EC] bg-white">
            <div className="flex items-center justify-between border-b border-[#E2E6EC] px-6 py-4">
              <h3 className="text-base font-bold text-[#0F1B2D]">Driver Performance</h3>
              <Button variant="outline" size="sm" className="border-[#E2E6EC]" onClick={() => exportCSV(DRIVER_REPORT_DATA as unknown as Record<string, unknown>[], "driver-report")}>
                <Download className="mr-1 h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E6EC] bg-[#F4F6F9]">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Driver</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Operator</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Trips</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Revenue</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Rating</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {DRIVER_REPORT_DATA.map((d) => (
                    <tr key={d.name} className="border-b border-[#F4F6F9] last:border-0 hover:bg-[#F4F6F9]/50">
                      <td className="px-4 py-3 font-medium text-[#0F1B2D]">{d.name}</td>
                      <td className="px-4 py-3 text-[#5B6577]">{d.operator}</td>
                      <td className="px-4 py-3 text-[#0F1B2D]">{d.trips}</td>
                      <td className="px-4 py-3 font-semibold text-[#0F1B2D]">£{d.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="text-amber-500">★</span> {d.rating}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                          d.status === "online" && "bg-green-50 text-green-700",
                          d.status === "busy" && "bg-amber-50 text-amber-700",
                          d.status === "offline" && "bg-gray-100 text-gray-600"
                        )}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Operators Report */}
      {activeTab === "operators" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <DashboardCard title="Total Operators" value={OPERATOR_REPORT_DATA.length} icon={<Building className="h-5 w-5" />} />
            <DashboardCard title="Total Fleet" value={OPERATOR_REPORT_DATA.reduce((s, o) => s + o.drivers, 0)} icon={<Users className="h-5 w-5" />} />
            <DashboardCard title="Total Revenue" value={`£${OPERATOR_REPORT_DATA.reduce((s, o) => s + o.revenue, 0).toLocaleString()}`} icon={<Banknote className="h-5 w-5" />} />
            <DashboardCard title="Avg Response" value={`${(OPERATOR_REPORT_DATA.reduce((s, o) => s + parseFloat(o.responseTime), 0) / OPERATOR_REPORT_DATA.length).toFixed(1)}m`} icon={<TrendingUp className="h-5 w-5" />} />
          </div>
          <div className="rounded-xl border border-[#E2E6EC] bg-white">
            <div className="flex items-center justify-between border-b border-[#E2E6EC] px-6 py-4">
              <h3 className="text-base font-bold text-[#0F1B2D]">Operator Performance</h3>
              <Button variant="outline" size="sm" className="border-[#E2E6EC]" onClick={() => exportCSV(OPERATOR_REPORT_DATA as unknown as Record<string, unknown>[], "operator-report")}>
                <Download className="mr-1 h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E6EC] bg-[#F4F6F9]">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Operator</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Drivers</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Bookings</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Revenue</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Avg Rating</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Response Time</th>
                  </tr>
                </thead>
                <tbody>
                  {OPERATOR_REPORT_DATA.map((o) => (
                    <tr key={o.name} className="border-b border-[#F4F6F9] last:border-0 hover:bg-[#F4F6F9]/50">
                      <td className="px-4 py-3 font-medium text-[#0F1B2D]">{o.name}</td>
                      <td className="px-4 py-3 text-[#0F1B2D]">{o.drivers}</td>
                      <td className="px-4 py-3 text-[#0F1B2D]">{o.bookings}</td>
                      <td className="px-4 py-3 font-semibold text-[#0F1B2D]">£{o.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="text-amber-500">★</span> {o.avgRating}
                      </td>
                      <td className="px-4 py-3 text-[#5B6577]">{o.responseTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Popular Routes */}
      {activeTab === "routes" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <DashboardCard title="Total Routes" value={POPULAR_ROUTES_DATA.length} icon={<Route className="h-5 w-5" />} />
            <DashboardCard title="Total Bookings" value={POPULAR_ROUTES_DATA.reduce((s, r) => s + r.count, 0)} icon={<BarChart2 className="h-5 w-5" />} />
            <DashboardCard title="Avg Price" value={`£${(POPULAR_ROUTES_DATA.reduce((s, r) => s + r.avgPrice, 0) / POPULAR_ROUTES_DATA.length).toFixed(2)}`} icon={<Banknote className="h-5 w-5" />} />
            <DashboardCard title="Most Popular" value="London → Heathrow" icon={<TrendingUp className="h-5 w-5" />} />
          </div>

          {/* Route Chart */}
          <div className="rounded-xl border border-[#E2E6EC] bg-white p-6">
            <h3 className="mb-4 text-base font-bold text-[#0F1B2D]">Bookings by Route</h3>
            <div className="space-y-3">
              {POPULAR_ROUTES_DATA.map((route) => {
                const maxCount = POPULAR_ROUTES_DATA[0].count
                return (
                  <div key={`${route.from}-${route.to}`} className="flex items-center gap-4">
                    <div className="w-48 shrink-0 text-right text-xs text-[#5B6577]">
                      {route.from} → {route.to}
                    </div>
                    <div className="flex-1">
                      <div className="h-6 w-full overflow-hidden rounded bg-[#F4F6F9]">
                        <div
                          className="h-full rounded bg-[#1F4FD8] transition-all duration-500"
                          style={{ width: `${(route.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-24 shrink-0 text-right">
                      <span className="text-sm font-semibold text-[#0F1B2D]">{route.count}</span>
                      <span className="ml-1 text-xs text-[#5B6577]">£{route.avgPrice.toFixed(2)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E6EC] bg-white">
            <div className="flex items-center justify-between border-b border-[#E2E6EC] px-6 py-4">
              <h3 className="text-base font-bold text-[#0F1B2D]">Popular Routes Data</h3>
              <Button variant="outline" size="sm" className="border-[#E2E6EC]" onClick={() => exportCSV(POPULAR_ROUTES_DATA as unknown as Record<string, unknown>[], "popular-routes")}>
                <Download className="mr-1 h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E6EC] bg-[#F4F6F9]">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">From</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">To</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Bookings</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Avg Price</th>
                  </tr>
                </thead>
                <tbody>
                  {POPULAR_ROUTES_DATA.map((r) => (
                    <tr key={`${r.from}-${r.to}`} className="border-b border-[#F4F6F9] last:border-0 hover:bg-[#F4F6F9]/50">
                      <td className="px-4 py-3 text-[#0F1B2D]">{r.from}</td>
                      <td className="px-4 py-3 text-[#0F1B2D]">{r.to}</td>
                      <td className="px-4 py-3 font-semibold text-[#0F1B2D]">{r.count}</td>
                      <td className="px-4 py-3 text-[#0F1B2D]">£{r.avgPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
