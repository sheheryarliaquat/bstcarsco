"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Wallet,
  CheckCircle,
  Clock,
  PoundSterling,
  Building,
  Users,
  Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
interface PayoutRecord {
  id: string
  recipientId: string
  recipientName: string
  period: string
  gross: number
  commission: number
  netAmount: number
  status: "pending" | "processing" | "completed"
  date: string
}

const OPERATOR_PAYOUTS: PayoutRecord[] = []

const DRIVER_PAYOUTS: PayoutRecord[] = []

export default function AdminPayoutsPage() {
  const [tab, setTab] = useState<"operator" | "driver">("operator")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [processTarget, setProcessTarget] = useState<PayoutRecord | null>(null)

  const payouts = tab === "operator" ? OPERATOR_PAYOUTS : DRIVER_PAYOUTS

  const filtered = useMemo(() => {
    let result = [...payouts]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.recipientName.toLowerCase().includes(q) ||
          p.period.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== "all") result = result.filter((p) => p.status === statusFilter)
    return result
  }, [payouts, search, statusFilter])

  const totalPaid = payouts.filter((p) => p.status === "completed").reduce((s, p) => s + p.netAmount, 0)
  const totalPending = payouts.filter((p) => p.status === "pending" || p.status === "processing").reduce((s, p) => s + p.netAmount, 0)
  const thisMonth = payouts.filter((p) => p.period.includes("Aug 16")).reduce((s, p) => s + p.netAmount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Payouts</h1>
          <p className="text-sm text-[#6B7280]">Manage operator and driver payouts</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-lg bg-[#F5F7FA] p-1">
        <button
          onClick={() => setTab("operator")}
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            tab === "operator"
              ? "bg-white text-[#172F52] shadow-sm"
              : "text-[#6B7280] hover:text-[#172F52]"
          )}
        >
          <Building className="h-4 w-4" />
          Operator Payouts
        </button>
        <button
          onClick={() => setTab("driver")}
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            tab === "driver"
              ? "bg-white text-[#172F52] shadow-sm"
              : "text-[#6B7280] hover:text-[#172F52]"
          )}
        >
          <Users className="h-4 w-4" />
          Driver Payouts
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <DashboardCard title="Total Paid" value={`£${totalPaid.toFixed(2)}`} icon={<CheckCircle className="h-5 w-5" />} trend="up" change={12} />
        <DashboardCard title="Pending" value={`£${totalPending.toFixed(2)}`} icon={<Clock className="h-5 w-5" />} />
        <DashboardCard title="This Period" value={`£${thisMonth.toFixed(2)}`} icon={<PoundSterling className="h-5 w-5" />} />
      </div>

      <div className="rounded-xl border border-[#D9E0E8] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${tab === "operator" ? "operators" : "drivers"}...`}
              className="h-9 pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-[#D9E0E8] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#D9E0E8] bg-[#F5F7FA]">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">ID</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Recipient</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Period</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Gross</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Commission</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Net Amount</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[#6B7280]">
                    No payouts found
                  </td>
                </tr>
              ) : (
                filtered.map((payout) => (
                  <tr
                    key={payout.id}
                    className="border-b border-[#F5F7FA] transition-colors last:border-0 hover:bg-[#F5F7FA]/50"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-[#172F52]">{payout.id}</td>
                    <td className="px-4 py-3 font-medium text-[#172F52]">{payout.recipientName}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{payout.period}</td>
                    <td className="px-4 py-3 text-[#172F52]">£{payout.gross.toFixed(2)}</td>
                    <td className="px-4 py-3 text-[#D4145A]">-£{payout.commission.toFixed(2)}</td>
                    <td className="px-4 py-3 font-semibold text-[#172F52]">£{payout.netAmount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                          payout.status === "completed" && "bg-green-50 text-green-700",
                          payout.status === "pending" && "bg-amber-50 text-amber-700",
                          payout.status === "processing" && "bg-blue-50 text-blue-700"
                        )}
                      >
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6B7280]">
                      {new Date(payout.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      {payout.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-[#168A55] text-white hover:bg-[#168A55]/90"
                          onClick={() => setProcessTarget(payout)}
                        >
                          Process
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!processTarget}
        onOpenChange={(open) => { if (!open) setProcessTarget(null) }}
        title="Process Payout"
        description={`Process payout of £${processTarget?.netAmount.toFixed(2)} to ${processTarget?.recipientName} for ${processTarget?.period}?`}
        confirmText="Process Payout"
        onConfirm={() => setProcessTarget(null)}
      />
    </div>
  )
}
