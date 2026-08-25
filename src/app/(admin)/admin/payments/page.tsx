"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Download,
  RefreshCw,
  Banknote,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Undo2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { Modal } from "@/components/shared/Modal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { PAYMENT_STATUSES } from "@/constants"
import type { PaymentStatus } from "@/types"

interface PaymentRecord {
  id: string
  bookingId: string
  passenger: string
  amount: number
  method: string
  status: PaymentStatus
  date: string
}

const DEMO_PAYMENTS: PaymentRecord[] = [
  { id: "pay-001", bookingId: "UKTB-2026-000001", passenger: "James Wilson", amount: 51.00, method: "card", status: "completed", date: "2026-08-20T14:30:00Z" },
  { id: "pay-002", bookingId: "UKTB-2026-000002", passenger: "Emma Thompson", amount: 11.52, method: "card", status: "completed", date: "2026-08-24T16:00:00Z" },
  { id: "pay-003", bookingId: "UKTB-2026-000003", passenger: "Raj Patel", amount: 102.60, method: "card", status: "completed", date: "2026-08-22T09:15:00Z" },
  { id: "pay-004", bookingId: "UKTB-2026-000004", passenger: "Sophie Clarkson", amount: 45.60, method: "card", status: "pending", date: "2026-08-25T10:00:00Z" },
  { id: "pay-005", bookingId: "UKTB-2026-000005", passenger: "David Morgan", amount: 410.40, method: "card", status: "completed", date: "2026-08-23T11:30:00Z" },
  { id: "pay-006", bookingId: "UKTB-2026-000006", passenger: "James Wilson", amount: 13.80, method: "card", status: "failed", date: "2026-08-25T12:00:00Z" },
  { id: "pay-007", bookingId: "UKTB-2026-000001", passenger: "James Wilson", amount: 51.00, method: "apple_pay", status: "completed", date: "2026-08-19T10:15:00Z" },
  { id: "pay-008", bookingId: "UKTB-2026-000003", passenger: "Raj Patel", amount: 52.50, method: "card", status: "refunded", date: "2026-08-21T14:45:00Z" },
  { id: "pay-009", bookingId: "UKTB-2026-000005", passenger: "David Morgan", amount: 410.40, method: "card", status: "processing", date: "2026-08-24T08:20:00Z" },
  { id: "pay-010", bookingId: "UKTB-2026-000002", passenger: "Emma Thompson", amount: 15.00, method: "cash", status: "completed", date: "2026-08-23T16:30:00Z" },
]

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [methodFilter, setMethodFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [refundTarget, setRefundTarget] = useState<PaymentRecord | null>(null)
  const [refundAmount, setRefundAmount] = useState("")
  const [refundReason, setRefundReason] = useState("")
  const [detailTarget, setDetailTarget] = useState<PaymentRecord | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const filtered = useMemo(() => {
    let result = [...DEMO_PAYMENTS]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.bookingId.toLowerCase().includes(q) ||
          p.passenger.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== "all") result = result.filter((p) => p.status === statusFilter)
    if (methodFilter !== "all") result = result.filter((p) => p.method === methodFilter)
    if (dateFrom) result = result.filter((p) => new Date(p.date) >= new Date(dateFrom))
    if (dateTo) result = result.filter((p) => new Date(p.date) <= new Date(dateTo))
    return result
  }, [search, statusFilter, methodFilter, dateFrom, dateTo])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const totalRevenue = DEMO_PAYMENTS.filter((p) => p.status === "completed").reduce((s, p) => s + p.amount, 0)
  const pendingAmount = DEMO_PAYMENTS.filter((p) => p.status === "pending" || p.status === "processing").reduce((s, p) => s + p.amount, 0)
  const refundedAmount = DEMO_PAYMENTS.filter((p) => p.status === "refunded").reduce((s, p) => s + p.amount, 0)
  const failedAmount = DEMO_PAYMENTS.filter((p) => p.status === "failed").reduce((s, p) => s + p.amount, 0)

  function exportCSV() {
    const headers = ["Payment ID", "Booking ID", "Passenger", "Amount", "Method", "Status", "Date"]
    const rows = filtered.map((p) => [p.id, p.bookingId, p.passenger, p.amount.toFixed(2), p.method, p.status, new Date(p.date).toISOString()])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payments-export-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "id",
      header: "Payment ID",
      sortable: true,
      className: "font-mono text-xs",
      render: (row) => (
        <span className="font-mono text-xs font-medium text-[#172F52]">{row.id as string}</span>
      ),
    },
    {
      key: "bookingId",
      header: "Booking ID",
      className: "font-mono text-xs",
      render: (row) => (
        <span className="font-mono text-xs text-[#6B7280]">{row.bookingId as string}</span>
      ),
    },
    {
      key: "passenger",
      header: "Passenger",
      sortable: true,
      render: (row) => <span className="text-[#172F52]">{row.passenger as string}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-[#172F52]">£{(row.amount as number).toFixed(2)}</span>
      ),
    },
    {
      key: "method",
      header: "Method",
      render: (row) => (
        <span className="capitalize text-[#6B7280]">{String(row.method).replace("_", " ")}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status as string} type="payment" />,
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (row) => {
        const d = new Date(row.date as string)
        return (
          <span className="text-xs text-[#6B7280]">
            {d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Payments</h1>
          <p className="text-sm text-[#6B7280]">Manage all platform payments ({filtered.length} records)</p>
        </div>
        <Button variant="outline" size="sm" className="border-[#D9E0E8]" onClick={exportCSV}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DashboardCard title="Total Revenue" value={`£${totalRevenue.toFixed(2)}`} icon={<Banknote className="h-5 w-5" />} trend="up" change={8} />
        <DashboardCard title="Pending" value={`£${pendingAmount.toFixed(2)}`} icon={<Clock className="h-5 w-5" />} />
        <DashboardCard title="Refunded" value={`£${refundedAmount.toFixed(2)}`} icon={<RefreshCw className="h-5 w-5" />} />
        <DashboardCard title="Failed" value={`£${failedAmount.toFixed(2)}`} icon={<XCircle className="h-5 w-5" />} />
      </div>

      <div className="rounded-xl border border-[#D9E0E8] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by payment ID, booking, passenger..."
              className="h-9 pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          >
            <option value="all">All Statuses</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={methodFilter}
            onChange={(e) => { setMethodFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          >
            <option value="all">All Methods</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="apple_pay">Apple Pay</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          />
          <span className="text-xs text-[#6B7280]">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#D9E0E8] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#D9E0E8] bg-[#F5F7FA]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]",
                      col.sortable && "cursor-pointer select-none hover:text-[#172F52]"
                    )}
                  >
                    {col.header}
                  </th>
                ))}
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-[#6B7280]">
                    No payments found
                  </td>
                </tr>
              ) : (
                paginated.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-[#F5F7FA] transition-colors last:border-0 hover:bg-[#F5F7FA]/50"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-sm">
                        {col.render
                          ? col.render(payment as unknown as Record<string, unknown>, 0)
                          : String((payment as unknown as Record<string, unknown>)[col.key] ?? "-")}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#D9E0E8]"
                          onClick={() => { setDetailTarget(payment); setDetailOpen(true) }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {payment.status === "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#D4145A] text-[#D4145A] hover:bg-[#D4145A]/5"
                            onClick={() => {
                              setRefundTarget(payment)
                              setRefundAmount(payment.amount.toFixed(2))
                              setRefundReason("")
                            }}
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D9E0E8] px-4 py-3">
          <span className="text-xs text-[#6B7280]">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-xs" disabled={page === 1} onClick={() => setPage(1)}>«</Button>
            <Button variant="outline" size="icon-xs" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</Button>
            <span className="px-2 text-sm font-medium text-[#172F52]">{page} / {totalPages || 1}</span>
            <Button variant="outline" size="icon-xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</Button>
            <Button variant="outline" size="icon-xs" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</Button>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      <Modal
        open={!!refundTarget}
        onOpenChange={(open) => { if (!open) { setRefundTarget(null); setRefundAmount(""); setRefundReason("") } }}
        title="Process Refund"
        size="md"
      >
        {refundTarget && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#F5F7FA] p-3">
              <p className="text-xs text-[#6B7280]">Payment ID</p>
              <p className="font-mono text-sm font-medium text-[#172F52]">{refundTarget.id}</p>
              <p className="mt-1 text-xs text-[#6B7280]">Passenger: {refundTarget.passenger}</p>
              <p className="text-sm font-semibold text-[#172F52]">Original: £{refundTarget.amount.toFixed(2)}</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Refund Amount (£)</label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="h-9"
                min={0}
                max={refundTarget.amount}
                step={0.01}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Reason</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full rounded-lg border border-[#D9E0E8] px-3 py-2 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
                rows={3}
                placeholder="Enter refund reason..."
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-[#F5F7FA] pt-4">
              <Button variant="outline" onClick={() => { setRefundTarget(null); setRefundAmount(""); setRefundReason("") }}>
                Cancel
              </Button>
              <Button
                className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
                onClick={() => { setRefundTarget(null); setRefundAmount(""); setRefundReason("") }}
              >
                Process Refund
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={`Payment ${detailTarget?.id}`}
        size="md"
      >
        {detailTarget && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Payment ID</p>
                <p className="font-mono text-sm font-medium text-[#172F52]">{detailTarget.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Booking ID</p>
                <p className="font-mono text-sm text-[#172F52]">{detailTarget.bookingId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Passenger</p>
                <p className="text-sm font-medium text-[#172F52]">{detailTarget.passenger}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Amount</p>
                <p className="text-lg font-bold text-[#172F52]">£{detailTarget.amount.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Method</p>
                <p className="text-sm text-[#172F52] capitalize">{detailTarget.method.replace("_", " ")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Status</p>
                <StatusBadge status={detailTarget.status} type="payment" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Date</p>
                <p className="text-sm text-[#172F52]">
                  {new Date(detailTarget.date).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
