"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Eye,
  Star,
  Car,
  Clock,
  Filter,
  TrendingUp,
  Users,
  PoundSterling,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { RatingStars } from "@/components/shared/RatingStars"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { Modal } from "@/components/shared/Modal"
import { DEMO_DATA, VEHICLE_TYPES } from "@/constants"
import type { Quote } from "@/types"

type QuoteWithMeta = Quote & { status: string; createdAt: string }

const DEMO_QUOTES: QuoteWithMeta[] = []

export default function AdminQuotesPage() {
  const [search, setSearch] = useState("")
  const [operatorFilter, setOperatorFilter] = useState<string>("all")
  const [vehicleFilter, setVehicleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedQuote, setSelectedQuote] = useState<QuoteWithMeta | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const filtered = useMemo(() => {
    let result = [...DEMO_QUOTES]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (qt) =>
          qt.id.toLowerCase().includes(q) ||
          qt.bookingId.toLowerCase().includes(q) ||
          qt.operatorName.toLowerCase().includes(q) ||
          qt.vehicleDescription.toLowerCase().includes(q)
      )
    }

    if (operatorFilter !== "all") {
      result = result.filter((qt) => qt.operatorId === operatorFilter)
    }

    if (vehicleFilter !== "all") {
      result = result.filter((qt) => qt.vehicleType === vehicleFilter)
    }

    if (statusFilter !== "all") {
      result = result.filter((qt) => qt.status === statusFilter)
    }

    return result
  }, [search, operatorFilter, vehicleFilter, statusFilter])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const avgPrice = useMemo(() => {
    if (filtered.length === 0) return 0
    return filtered.reduce((sum, q) => sum + q.price, 0) / filtered.length
  }, [filtered])

  const conversionRate = useMemo(() => {
    const accepted = DEMO_QUOTES.filter((q) => q.status === "accepted").length
    return DEMO_QUOTES.length > 0 ? Math.round((accepted / DEMO_QUOTES.length) * 100) : 0
  }, [])

  const popularVehicle = useMemo(() => {
    const counts: Record<string, number> = {}
    DEMO_QUOTES.forEach((q) => {
      counts[q.vehicleType] = (counts[q.vehicleType] || 0) + 1
    })
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    return sorted.length > 0
      ? VEHICLE_TYPES.find((v) => v.value === sorted[0][0])?.label ?? sorted[0][0]
      : "N/A"
  }, [])

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "id",
      header: "Quote ID",
      sortable: true,
      className: "font-mono text-xs",
      render: (row) => (
        <span className="font-mono text-xs font-medium text-[#0F1B2D]">{row.id as string}</span>
      ),
    },
    {
      key: "bookingId",
      header: "Booking Ref",
      className: "font-mono text-xs",
      render: (row) => (
        <span className="font-mono text-xs text-[#5B6577]">{row.bookingId as string}</span>
      ),
    },
    {
      key: "operatorName",
      header: "Operator",
      sortable: true,
      render: (row) => (
        <span className="text-[#0F1B2D] font-medium">{row.operatorName as string}</span>
      ),
    },
    {
      key: "vehicleType",
      header: "Vehicle Type",
      render: (row) => (
        <span className="text-[#5B6577] capitalize">{String(row.vehicleType).replace("_", " ")}</span>
      ),
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (row) => {
        const q = row as unknown as typeof DEMO_QUOTES[0]
        return (
          <div>
            <span className="font-semibold text-[#0F1B2D]">£{q.price.toFixed(2)}</span>
            {q.originalPrice && (
              <span className="ml-1.5 text-xs text-[#5B6577] line-through">
                £{q.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      render: (row) => (
        <RatingStars rating={row.rating as number} size="sm" count={row.totalReviews as number} />
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const statusColors: Record<string, string> = {
          pending: "bg-amber-50 text-amber-700",
          accepted: "bg-green-50 text-green-700",
          rejected: "bg-red-50 text-red-700",
        }
        const status = row.status as string
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
              statusColors[status] ?? "bg-gray-100 text-gray-600"
            )}
          >
            {status}
          </span>
        )
      },
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      render: (row) => {
        const date = new Date(row.createdAt as string)
        return (
          <span className="text-xs text-[#5B6577]">
            {date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Quotes</h1>
          <p className="text-sm text-[#5B6577]">
            Manage all platform quotes ({filtered.length} total)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DashboardCard title="Total Quotes" value={DEMO_QUOTES.length} icon={<PoundSterling className="h-5 w-5" />} />
        <DashboardCard title="Average Price" value={`£${avgPrice.toFixed(2)}`} icon={<TrendingUp className="h-5 w-5" />} />
        <DashboardCard title="Conversion Rate" value={`${conversionRate}%`} icon={<Users className="h-5 w-5" />} />
        <DashboardCard title="Popular Vehicle" value={popularVehicle} icon={<Car className="h-5 w-5" />} />
      </div>

      <div className="rounded-xl border border-[#E2E6EC] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6577]" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by quote ID, booking ref, operator..."
              className="h-9 pl-9"
            />
          </div>
          <select
            value={operatorFilter}
            onChange={(e) => { setOperatorFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]"
          >
            <option value="all">All Operators</option>
            {DEMO_DATA.operators.map((o) => (
              <option key={o.uid} value={o.uid}>{o.companyName}</option>
            ))}
          </select>
          <select
            value={vehicleFilter}
            onChange={(e) => { setVehicleFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]"
          >
            <option value="all">All Vehicles</option>
            {VEHICLE_TYPES.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
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
                    No quotes found
                  </td>
                </tr>
              ) : (
                paginated.map((quote) => (
                  <tr
                    key={quote.id}
                    className="border-b border-[#F4F6F9] transition-colors last:border-0 hover:bg-[#F4F6F9]/50"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-sm">
                        {col.render
                          ? col.render(quote as unknown as Record<string, unknown>, 0)
                          : String((quote as unknown as Record<string, unknown>)[col.key] ?? "-")}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#E2E6EC]"
                        onClick={() => { setSelectedQuote(quote); setDetailOpen(true) }}
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        View
                      </Button>
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

      <Modal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={`Quote ${selectedQuote?.id}`}
        size="lg"
      >
        {selectedQuote && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Booking Reference</p>
                <p className="font-mono text-sm font-medium text-[#0F1B2D]">{selectedQuote.bookingId}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Operator</p>
                <p className="text-sm font-medium text-[#0F1B2D]">{selectedQuote.operatorName}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Vehicle</p>
                <p className="text-sm text-[#0F1B2D]">{selectedQuote.vehicleDescription}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Vehicle Type</p>
                <p className="text-sm text-[#0F1B2D] capitalize">{selectedQuote.vehicleType.replace("_", " ")}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Capacity</p>
                <p className="text-sm text-[#0F1B2D]">{selectedQuote.passengerCapacity} passengers, {selectedQuote.luggageCapacity} luggage</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Journey Time</p>
                <p className="text-sm text-[#0F1B2D]">{selectedQuote.estimatedJourneyTime} mins</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Rating</p>
                <RatingStars rating={selectedQuote.rating} size="md" count={selectedQuote.totalReviews} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Payment Types</p>
                <p className="text-sm text-[#0F1B2D] capitalize">{selectedQuote.paymentTypes.join(", ").replace(/_/g, " ")}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-[#5B6577]">Features</p>
              <div className="flex flex-wrap gap-2">
                {selectedQuote.features.map((f) => (
                  <span key={f} className="rounded-full bg-[#F4F6F9] px-3 py-1 text-xs font-medium text-[#0F1B2D]">
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 border-t border-[#F4F6F9] pt-4">
              <div className="space-y-1">
                <p className="text-xs text-[#5B6577]">Status</p>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                    selectedQuote.status === "accepted" && "bg-green-50 text-green-700",
                    selectedQuote.status === "rejected" && "bg-red-50 text-red-700",
                    selectedQuote.status === "pending" && "bg-amber-50 text-amber-700"
                  )}
                >
                  {selectedQuote.status}
                </span>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-[#5B6577]">Price</p>
                <p className="text-lg font-bold text-[#0F1B2D]">£{selectedQuote.price.toFixed(2)}</p>
                {selectedQuote.originalPrice && (
                  <p className="text-xs text-[#5B6577] line-through">£{selectedQuote.originalPrice.toFixed(2)}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
