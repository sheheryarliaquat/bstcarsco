"use client"

import {
  Wallet,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"

const EARNINGS_HISTORY = [
  { date: "25 Aug 2026", trips: 3, gross: "£87.50", commission: "£13.13", net: "£74.37", payout: "pending" },
  { date: "24 Aug 2026", trips: 5, gross: "£142.30", commission: "£21.35", net: "£120.95", payout: "completed" },
  { date: "23 Aug 2026", trips: 4, gross: "£98.60", commission: "£14.79", net: "£83.81", payout: "completed" },
  { date: "22 Aug 2026", trips: 6, gross: "£178.20", commission: "£26.73", net: "£151.47", payout: "completed" },
  { date: "21 Aug 2026", trips: 2, gross: "£45.80", commission: "£6.87", net: "£38.93", payout: "completed" },
  { date: "20 Aug 2026", trips: 7, gross: "£203.40", commission: "£30.51", net: "£172.89", payout: "completed" },
  { date: "19 Aug 2026", trips: 4, gross: "£112.50", commission: "£16.88", net: "£95.63", payout: "completed" },
]

const WEEKLY_DATA = [
  { day: "Mon", amount: 68 },
  { day: "Tue", amount: 95 },
  { day: "Wed", amount: 42 },
  { day: "Thu", amount: 110 },
  { day: "Fri", amount: 87 },
  { day: "Sat", amount: 0 },
  { day: "Sun", amount: 0 },
]

const MAX_AMOUNT = Math.max(...WEEKLY_DATA.map((d) => d.amount))

const historyColumns: Column<typeof EARNINGS_HISTORY[number]>[] = [
  {
    key: "date",
    header: "Date",
    sortable: true,
    render: (row) => (
      <span className="font-medium text-[#172F52]">{row.date}</span>
    ),
  },
  {
    key: "trips",
    header: "Trips",
    sortable: true,
    render: (row) => (
      <span className="text-[#172F52]">{row.trips}</span>
    ),
  },
  {
    key: "gross",
    header: "Gross",
    sortable: true,
    render: (row) => (
      <span className="font-medium text-[#172F52]">{row.gross}</span>
    ),
  },
  {
    key: "commission",
    header: "Commission",
    render: (row) => (
      <span className="text-red-600">-{row.commission}</span>
    ),
  },
  {
    key: "net",
    header: "Net",
    sortable: true,
    render: (row) => (
      <span className="font-bold text-green-600">{row.net}</span>
    ),
  },
  {
    key: "payout",
    header: "Payout",
    render: (row) => (
      <StatusBadge
        status={row.payout}
        type="payment"
      />
    ),
  },
]

export default function DriverEarningsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#172F52]">Earnings</h1>
        <p className="text-sm text-[#6B7280]">Track your earnings and payouts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <DashboardCard
          title="Today"
          value="£87.50"
          icon={<Wallet className="h-5 w-5" />}
          trend="up"
          change={12}
        />
        <DashboardCard
          title="This Week"
          value="£412.30"
          icon={<Calendar className="h-5 w-5" />}
          trend="up"
          change={8}
        />
        <DashboardCard
          title="This Month"
          value="£1,650"
          icon={<TrendingUp className="h-5 w-5" />}
          trend="up"
          change={15}
        />
        <DashboardCard
          title="All Time"
          value="£12,480"
          icon={<ArrowUpRight className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Earnings Breakdown */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-[#E5E7EB]">
          <h3 className="mb-4 text-base font-bold text-[#172F52]">
            Earnings Breakdown
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6B7280]">Gross Earnings</span>
              <span className="text-sm font-bold text-[#172F52]">£1,890.50</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6B7280]">Commission (15%)</span>
              <span className="text-sm font-bold text-red-600">-£283.58</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#172F52]">Net Earnings</span>
              <span className="text-lg font-bold text-green-600">£1,606.92</span>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="rounded-xl bg-[#F5F7FA] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4145A]/10">
                <CreditCard className="h-5 w-5 text-[#D4145A]" />
              </div>
              <div>
                <p className="text-xs text-[#6B7280]">Next Payout</p>
                <p className="text-sm font-bold text-[#172F52]">
                  £468.23 on 26 Aug 2026
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Bar Chart */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-[#E5E7EB] lg:col-span-2">
          <h3 className="mb-6 text-base font-bold text-[#172F52]">
            Last 7 Days
          </h3>
          <div className="flex items-end gap-4" style={{ height: 200 }}>
            {WEEKLY_DATA.map((item) => (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold text-[#172F52]">
                  {item.amount > 0 ? `£${item.amount}` : ""}
                </span>
                <div
                  className="w-full rounded-t-lg bg-[#D4145A] transition-all duration-500"
                  style={{
                    height: `${(item.amount / MAX_AMOUNT) * 150}px`,
                    minHeight: item.amount > 0 ? "4px" : "0px",
                  }}
                />
                <span className="text-xs font-medium text-[#6B7280]">
                  {item.day}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-[#E5E7EB] pt-4">
            <span className="text-sm text-[#6B7280]">Week Total</span>
            <span className="text-xl font-bold text-[#172F52]">£412.30</span>
          </div>
        </div>
      </div>

      {/* Earnings History Table */}
      <div>
        <h3 className="mb-4 text-base font-bold text-[#172F52]">
          Earnings History
        </h3>
        <DataTable
          columns={historyColumns as unknown as Column<Record<string, unknown>>[]}
          data={EARNINGS_HISTORY as unknown as Record<string, unknown>[]}
          searchable
          searchPlaceholder="Search by date..."
          keyExtractor={(row) => row.date as string}
          pagination={{
            page: 1,
            pageSize: 10,
            total: EARNINGS_HISTORY.length,
            onPageChange: () => {},
          }}
        />
      </div>
    </div>
  )
}
