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

const DEMO_QUOTES: QuoteWithMeta[] = [
  ...DEMO_DATA.quotes.map((q): QuoteWithMeta => ({
    ...q,
    status: "accepted",
    createdAt: "2026-08-20T14:00:00Z",
  })),
  {
    id: "qt-004",
    bookingId: "UKTB-2026-000001",
    operatorId: "op-001",
    operatorName: "Kingsley Travel",
    vehicleType: "executive",
    vehicleDescription: "Mercedes E-Class Executive",
    passengerCapacity: 3,
    luggageCapacity: 2,
    rating: 4.8,
    totalReviews: 3245,
    estimatedJourneyTime: 42,
    isElectric: false,
    isHybrid: false,
    price: 42.5,
    paymentTypes: ["card", "cash"],
    features: ["Meet and greet", "Free waiting"],
    isLowestPrice: false,
    status: "accepted",
    createdAt: "2026-08-20T14:00:00Z",
  },
  {
    id: "qt-005",
    bookingId: "UKTB-2026-000002",
    operatorId: "op-002",
    operatorName: "Northern Taxi Services",
    vehicleType: "saloon",
    vehicleDescription: "Ford Mondeo Saloon",
    passengerCapacity: 3,
    luggageCapacity: 2,
    rating: 4.6,
    totalReviews: 1890,
    estimatedJourneyTime: 18,
    isElectric: false,
    isHybrid: true,
    price: 14.5,
    paymentTypes: ["card", "cash"],
    features: ["Free waiting time"],
    isLowestPrice: false,
    status: "rejected",
    createdAt: "2026-08-24T15:30:00Z",
  },
  {
    id: "qt-006",
    bookingId: "UKTB-2026-000006",
    operatorId: "op-001",
    operatorName: "Kingsley Travel",
    vehicleType: "saloon",
    vehicleDescription: "Toyota Prius Electric",
    passengerCapacity: 3,
    luggageCapacity: 2,
    rating: 4.8,
    totalReviews: 3245,
    estimatedJourneyTime: 16,
    isElectric: true,
    isHybrid: false,
    price: 11.5,
    paymentTypes: ["card", "cash"],
    features: ["Eco-friendly", "Free waiting"],
    isLowestPrice: true,
    status: "pending",
    createdAt: "2026-08-25T12:00:00Z",
  },
  {
    id: "qt-007",
    bookingId: "UKTB-2026-000003",
    operatorId: "op-003",
    operatorName: "Capital Taxis Edinburgh",
    vehicleType: "estate",
    vehicleDescription: "Volkswagen Passat Estate",
    passengerCapacity: 3,
    luggageCapacity: 4,
    rating: 4.7,
    totalReviews: 987,
    estimatedJourneyTime: 115,
    isElectric: false,
    isHybrid: false,
    price: 98.0,
    paymentTypes: ["card", "cash", "apple_pay"],
    features: ["Large luggage space", "Flight tracking"],
    isLowestPrice: false,
    status: "accepted",
    createdAt: "2026-08-22T09:00:00Z",
  },
  {
    id: "qt-008",
    bookingId: "UKTB-2026-000004",
    operatorId: "op-001",
    operatorName: "Kingsley Travel",
    vehicleType: "saloon",
    vehicleDescription: "Hyundai Ioniq 5 Electric",
    passengerCapacity: 3,
    luggageCapacity: 2,
    rating: 4.8,
    totalReviews: 3245,
    estimatedJourneyTime: 38,
    isElectric: true,
    isHybrid: false,
    price: 35.0,
    originalPrice: 40.0,
    discountPercent: 12,
    paymentTypes: ["card", "cash"],
    features: ["Eco-friendly", "Free waiting"],
    isLowestPrice: false,
    status: "pending",
    createdAt: "2026-08-25T09:30:00Z",
  },
]

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
        <span className="font-mono text-xs font-medium text-[#172F52]">{row.id as string}</span>
      ),
    },
    {
      key: "bookingId",
      header: "Booking Ref",
      className: "font-mono text-xs",
      render: (row) => (
        <span className="font-mono text-xs text-[#6B7280]">{row.bookingId as string}</span>
      ),
    },
    {
      key: "operatorName",
      header: "Operator",
      sortable: true,
      render: (row) => (
        <span className="text-[#172F52] font-medium">{row.operatorName as string}</span>
      ),
    },
    {
      key: "vehicleType",
      header: "Vehicle Type",
      render: (row) => (
        <span className="text-[#6B7280] capitalize">{String(row.vehicleType).replace("_", " ")}</span>
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
            <span className="font-semibold text-[#172F52]">£{q.price.toFixed(2)}</span>
            {q.originalPrice && (
              <span className="ml-1.5 text-xs text-[#6B7280] line-through">
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
          <span className="text-xs text-[#6B7280]">
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
          <h1 className="text-2xl font-bold text-[#172F52]">Quotes</h1>
          <p className="text-sm text-[#6B7280]">
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

      <div className="rounded-xl border border-[#D9E0E8] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
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
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          >
            <option value="all">All Operators</option>
            {DEMO_DATA.operators.map((o) => (
              <option key={o.uid} value={o.uid}>{o.companyName}</option>
            ))}
          </select>
          <select
            value={vehicleFilter}
            onChange={(e) => { setVehicleFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          >
            <option value="all">All Vehicles</option>
            {VEHICLE_TYPES.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
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
                    No quotes found
                  </td>
                </tr>
              ) : (
                paginated.map((quote) => (
                  <tr
                    key={quote.id}
                    className="border-b border-[#F5F7FA] transition-colors last:border-0 hover:bg-[#F5F7FA]/50"
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
                        className="border-[#D9E0E8]"
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
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Booking Reference</p>
                <p className="font-mono text-sm font-medium text-[#172F52]">{selectedQuote.bookingId}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Operator</p>
                <p className="text-sm font-medium text-[#172F52]">{selectedQuote.operatorName}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Vehicle</p>
                <p className="text-sm text-[#172F52]">{selectedQuote.vehicleDescription}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Vehicle Type</p>
                <p className="text-sm text-[#172F52] capitalize">{selectedQuote.vehicleType.replace("_", " ")}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Capacity</p>
                <p className="text-sm text-[#172F52]">{selectedQuote.passengerCapacity} passengers, {selectedQuote.luggageCapacity} luggage</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Journey Time</p>
                <p className="text-sm text-[#172F52]">{selectedQuote.estimatedJourneyTime} mins</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Rating</p>
                <RatingStars rating={selectedQuote.rating} size="md" count={selectedQuote.totalReviews} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Payment Types</p>
                <p className="text-sm text-[#172F52] capitalize">{selectedQuote.paymentTypes.join(", ").replace(/_/g, " ")}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-[#6B7280]">Features</p>
              <div className="flex flex-wrap gap-2">
                {selectedQuote.features.map((f) => (
                  <span key={f} className="rounded-full bg-[#F5F7FA] px-3 py-1 text-xs font-medium text-[#172F52]">
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 border-t border-[#F5F7FA] pt-4">
              <div className="space-y-1">
                <p className="text-xs text-[#6B7280]">Status</p>
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
                <p className="text-xs text-[#6B7280]">Price</p>
                <p className="text-lg font-bold text-[#172F52]">£{selectedQuote.price.toFixed(2)}</p>
                {selectedQuote.originalPrice && (
                  <p className="text-xs text-[#6B7280] line-through">£{selectedQuote.originalPrice.toFixed(2)}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
