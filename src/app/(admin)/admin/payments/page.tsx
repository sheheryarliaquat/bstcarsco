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

const DEMO_PAYMENTS: PaymentRecord[] = []

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
        <span className="font-mono text-xs font-medium text-[#0F1B2D]">{row.id as string}</span>
      ),
    },
    {
      key: "bookingId",
      header: "Booking ID",
      className: "font-mono text-xs",
      render: (row) => (
        <span className="font-mono text-xs text-[#5B6577]">{row.bookingId as string}</span>
      ),
    },
    {
      key: "passenger",
      header: "Passenger",
      sortable: true,
      render: (row) => <span className="text-[#0F1B2D]">{row.passenger as string}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-[#0F1B2D]">£{(row.amount as number).toFixed(2)}</span>
      ),
    },
    {
      key: "method",
      header: "Method",
      render: (row) => (
        <span className="capitalize text-[#5B6577]">{String(row.method).replace("_", " ")}</span>
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
          <span className="text-xs text-[#5B6577]">
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
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Payments</h1>
          <p className="text-sm text-[#5B6577]">Manage all platform payments ({filtered.length} records)</p>
        </div>
        <Button variant="outline" size="sm" className="border-[#E2E6EC]" onClick={exportCSV}>
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

      <div className="rounded-xl border border-[#E2E6EC] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6577]" />
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
            className="h-9 rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]"
          >
            <option value="all">All Statuses</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={methodFilter}
            onChange={(e) => { setMethodFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]"
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
            className="h-9 rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]"
          />
          <span className="text-xs text-[#5B6577]">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]"
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#E2E6EC] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E2E6EC] bg-[#F4F6F9]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]",
                      col.sortable && "cursor-pointer select-none hover:text-[#0F1B2D]"
                    )}
                  >
                    {col.header}
                  </th>
                ))}
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-[#5B6577]">
                    No payments found
                  </td>
                </tr>
              ) : (
                paginated.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-[#F4F6F9] transition-colors last:border-0 hover:bg-[#F4F6F9]/50"
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
                          className="border-[#E2E6EC]"
                          onClick={() => { setDetailTarget(payment); setDetailOpen(true) }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {payment.status === "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#1F4FD8] text-[#1F4FD8] hover:bg-[#1F4FD8]/5"
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E6EC] px-4 py-3">
          <span className="text-xs text-[#5B6577]">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-xs" disabled={page === 1} onClick={() => setPage(1)}>«</Button>
            <Button variant="outline" size="icon-xs" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</Button>
            <span className="px-2 text-sm font-medium text-[#0F1B2D]">{page} / {totalPages || 1}</span>
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
            <div className="rounded-lg bg-[#F4F6F9] p-3">
              <p className="text-xs text-[#5B6577]">Payment ID</p>
              <p className="font-mono text-sm font-medium text-[#0F1B2D]">{refundTarget.id}</p>
              <p className="mt-1 text-xs text-[#5B6577]">Passenger: {refundTarget.passenger}</p>
              <p className="text-sm font-semibold text-[#0F1B2D]">Original: £{refundTarget.amount.toFixed(2)}</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F1B2D]">Refund Amount (£)</label>
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
              <label className="mb-1.5 block text-sm font-medium text-[#0F1B2D]">Reason</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full rounded-lg border border-[#E2E6EC] px-3 py-2 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]"
                rows={3}
                placeholder="Enter refund reason..."
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-[#F4F6F9] pt-4">
              <Button variant="outline" onClick={() => { setRefundTarget(null); setRefundAmount(""); setRefundReason("") }}>
                Cancel
              </Button>
              <Button
                className="bg-[#1F4FD8] text-white hover:bg-[#1F4FD8]/90"
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
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Payment ID</p>
                <p className="font-mono text-sm font-medium text-[#0F1B2D]">{detailTarget.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Booking ID</p>
                <p className="font-mono text-sm text-[#0F1B2D]">{detailTarget.bookingId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Passenger</p>
                <p className="text-sm font-medium text-[#0F1B2D]">{detailTarget.passenger}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Amount</p>
                <p className="text-lg font-bold text-[#0F1B2D]">£{detailTarget.amount.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Method</p>
                <p className="text-sm text-[#0F1B2D] capitalize">{detailTarget.method.replace("_", " ")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Status</p>
                <StatusBadge status={detailTarget.status} type="payment" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Date</p>
                <p className="text-sm text-[#0F1B2D]">
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
