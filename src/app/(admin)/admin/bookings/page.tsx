"use client"

import { useState, useMemo } from "react"
import React from "react"
import {
  Search,
  Download,
  Filter,
  Eye,
  X,
  RefreshCw,
  Printer,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  User,
  Car,
  CreditCard,
  CheckCircle2,
  Banknote,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Modal } from "@/components/shared/Modal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { DEMO_DATA } from "@/constants"
import { BOOKING_STATUSES, PAYMENT_STATUSES, UK_CITIES } from "@/constants"
import type { Booking } from "@/types"
import { BookingStatus } from "@/types"

const ALL_BOOKINGS = DEMO_DATA.bookings

const PAGE_SIZES = [10, 25, 50, 100]

export default function AdminBookingsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [cashActionBooking, setCashActionBooking] = useState<Booking | null>(null)
  const [cashActionType, setCashActionType] = useState<"approve" | "reject">("approve")
  const [bookings, setBookings] = useState<Booking[]>(ALL_BOOKINGS)

  const filtered = useMemo(() => {
    let result = [...bookings]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (b) =>
          b.bookingNumber.toLowerCase().includes(q) ||
          b.pickup.formattedAddress.toLowerCase().includes(q) ||
          b.destination.formattedAddress.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((b) => b.bookingStatus === statusFilter)
    }

    if (paymentFilter !== "all") {
      result = result.filter((b) => b.paymentStatus === paymentFilter)
    }

    return result
  }, [search, statusFilter, paymentFilter])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const getPassengerName = (passengerId: string) => {
    const p = DEMO_DATA.passengers.find((p) => p.uid === passengerId)
    return p ? `${p.firstName} ${p.lastName}` : "Unknown"
  }

  const getOperatorName = (operatorId: string) => {
    const o = DEMO_DATA.operators.find((o) => o.uid === operatorId)
    return o?.companyName ?? "Unknown"
  }

  const getDriverName = (driverId: string) => {
    if (!driverId) return "Unassigned"
    const d = DEMO_DATA.drivers.find((d) => d.uid === driverId)
    return d ? `${d.firstName} ${d.lastName}` : "Unknown"
  }

  const getVehicleInfo = (vehicleId: string) => {
    if (!vehicleId) return "-"
    const v = DEMO_DATA.vehicles.find((v) => v.id === vehicleId)
    return v ? `${v.make} ${v.model}` : "Unknown"
  }

  function handleViewBooking(booking: Booking) {
    setSelectedBooking(booking)
    setDetailOpen(true)
  }

  function handleCashAction(booking: Booking, action: "approve" | "reject") {
    setCashActionBooking(booking)
    setCashActionType(action)
  }

  function confirmCashAction() {
    if (!cashActionBooking) return
    setBookings((prev) =>
      prev.map((b) =>
        b.bookingNumber === cashActionBooking.bookingNumber
          ? {
              ...b,
              bookingStatus: cashActionType === "approve" ? BookingStatus.Confirmed : BookingStatus.CancelledByAdmin,
              paymentStatus: cashActionType === "approve" ? ("pending" as const) : ("refunded" as const),
            }
          : b
      )
    )
    setCashActionBooking(null)
  }

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "bookingNumber",
      header: "Booking ID",
      sortable: true,
      className: "font-mono text-xs",
      render: (row) => (
        <span className="font-mono text-xs font-medium text-[#172F52]">
          {row.bookingNumber as string}
        </span>
      ),
    },
    {
      key: "passenger",
      header: "Passenger",
      sortable: true,
      render: (row) => (
        <span className="text-[#172F52]">{getPassengerName(row.passengerId as string)}</span>
      ),
    },
    {
      key: "pickup",
      header: "Pickup",
      render: (row) => {
        const b = row as unknown as Booking
        return (
          <span className="max-w-[140px] truncate text-[#6B7280]">
            {b.pickup.formattedAddress.split(",")[0]}
          </span>
        )
      },
    },
    {
      key: "destination",
      header: "Destination",
      render: (row) => {
        const b = row as unknown as Booking
        return (
          <span className="max-w-[140px] truncate text-[#6B7280]">
            {b.destination.formattedAddress.split(",")[0]}
          </span>
        )
      },
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (row) => <span className="text-[#6B7280]">{row.date as string}</span>,
    },
    {
      key: "pickupTime",
      header: "Time",
      render: (row) => <span className="text-[#6B7280]">{row.pickupTime as string}</span>,
    },
    {
      key: "operatorId",
      header: "Operator",
      render: (row) => (
        <span className="text-[#172F52]">{getOperatorName(row.operatorId as string)}</span>
      ),
    },
    {
      key: "driverId",
      header: "Driver",
      render: (row) => {
        const name = getDriverName(row.driverId as string)
        return (
          <span className={cn("text-sm", name === "Unassigned" ? "italic text-[#6B7280]" : "text-[#172F52]")}>
            {name}
          </span>
        )
      },
    },
    {
      key: "vehicleId",
      header: "Vehicle",
      render: (row) => (
        <span className="text-[#6B7280]">{getVehicleInfo(row.vehicleId as string)}</span>
      ),
    },
    {
      key: "total",
      header: "Price",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-[#172F52]">
          £{(row.total as number).toFixed(2)}
        </span>
      ),
    },
    {
      key: "paymentStatus",
      header: "Payment",
      render: (row) => <StatusBadge status={row.paymentStatus as string} type="payment" />,
    },
    {
      key: "bookingStatus",
      header: "Status",
      render: (row) => <StatusBadge status={row.bookingStatus as string} type="booking" />,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Bookings</h1>
          <p className="text-sm text-[#6B7280]">
            Manage all platform bookings ({filtered.length} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-[#D9E0E8]">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-[#D9E0E8] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by booking ID, passenger, location..."
              className="h-9 pl-9"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          >
            <option value="all">All Statuses</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          >
            <option value="all">All Payments</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            className="border-[#D9E0E8]"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            More Filters
            {showFilters ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
          </Button>
        </div>

        {showFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#F5F7FA] pt-3">
            <select className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]">
              <option value="all">All Pickup Areas</option>
              {UK_CITIES.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            <select className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]">
              <option value="all">All Destination Areas</option>
              {UK_CITIES.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            <input
              type="date"
              className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
            />
            <span className="text-xs text-[#6B7280]">to</span>
            <input
              type="date"
              className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
            />
            <select className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]">
              <option value="all">All Operators</option>
              {DEMO_DATA.operators.map((o) => (
                <option key={o.uid} value={o.uid}>{o.companyName}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-[#D9E0E8] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#D9E0E8] bg-[#F5F7FA]">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]" />
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
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-[#6B7280]">
                    No bookings found
                  </td>
                </tr>
              ) : (
                paginated.map((booking) => {
                  const isExpanded = expandedRow === booking.bookingNumber
                  return (
                    <React.Fragment key={booking.bookingNumber}>
                      <tr
                        className="border-b border-[#F5F7FA] transition-colors last:border-0 hover:bg-[#F5F7FA]/50 cursor-pointer"
                        onClick={() => setExpandedRow(isExpanded ? null : booking.bookingNumber)}
                      >
                        <td className="px-4 py-3">
                          <button className="text-[#6B7280] hover:text-[#172F52]">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </td>
                        {columns.map((col) => (
                          <td key={col.key} className="px-4 py-3 text-sm">
                            {col.render
                              ? col.render(booking as unknown as Record<string, unknown>, 0)
                              : String((booking as unknown as Record<string, unknown>)[col.key] ?? "-")}
                          </td>
                        ))}
                      </tr>
                      {isExpanded && (
                        <tr key={`${booking.bookingNumber}-detail`}>
                          <td colSpan={columns.length + 1} className="bg-[#F5F7FA]/30 px-8 py-4">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase text-[#6B7280]">Pickup Details</p>
                                <div className="flex items-start gap-2">
                                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D4145A]" />
                                  <p className="text-sm text-[#172F52]">{booking.pickup.formattedAddress}</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase text-[#6B7280]">Destination Details</p>
                                <div className="flex items-start gap-2">
                                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                                  <p className="text-sm text-[#172F52]">{booking.destination.formattedAddress}</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase text-[#6B7280]">Journey Info</p>
                                <p className="text-sm text-[#172F52]">Distance: {booking.distanceMiles} miles</p>
                                <p className="text-sm text-[#172F52]">Duration: {booking.estimatedDuration} mins</p>
                                <p className="text-sm text-[#172F52]">Passengers: {booking.passengers}</p>
                                <p className="text-sm text-[#172F52]">Luggage: {booking.luggage}</p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase text-[#6B7280]">Pricing</p>
                                <p className="text-sm text-[#172F52]">Subtotal: £{booking.price.toFixed(2)}</p>
                                {booking.discount > 0 && (
                                  <p className="text-sm text-green-600">Discount: -£{booking.discount.toFixed(2)}</p>
                                )}
                                <p className="text-sm text-[#172F52]">Tax: £{booking.tax.toFixed(2)}</p>
                                <p className="text-sm font-bold text-[#172F52]">Total: £{booking.total.toFixed(2)}</p>
                              </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2 border-t border-[#E5E7EB] pt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-[#D9E0E8]"
                                onClick={(e) => { e.stopPropagation(); handleViewBooking(booking) }}
                              >
                                <Eye className="mr-1 h-3.5 w-3.5" />
                                View Full Details
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-[#D9E0E8]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Printer className="mr-1 h-3.5 w-3.5" />
                                Print
                              </Button>
                              {booking.bookingStatus === ("cash_pending_approval" as string) && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                                    onClick={(e) => { e.stopPropagation(); handleCashAction(booking, "approve") }}
                                  >
                                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleCashAction(booking, "reject") }}
                                  >
                                    <X className="mr-1 h-3.5 w-3.5" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              {booking.bookingStatus !== ("cancelled_by_admin" as string) &&
                                booking.bookingStatus !== ("trip_completed" as string) &&
                                booking.bookingStatus !== ("cash_pending_approval" as string) && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); setCancelBooking(booking) }}
                                >
                                  <X className="mr-1 h-3.5 w-3.5" />
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </td>
                         </tr>
                       )}
                     </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D9E0E8] px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#6B7280]">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="h-7 rounded border border-[#D9E0E8] bg-white px-2 text-xs text-[#172F52]"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s} per page</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-xs" disabled={page === 1} onClick={() => setPage(1)}>
              «
            </Button>
            <Button variant="outline" size="icon-xs" disabled={page === 1} onClick={() => setPage(page - 1)}>
              ‹
            </Button>
            <span className="px-2 text-sm font-medium text-[#172F52]">{page} / {totalPages || 1}</span>
            <Button variant="outline" size="icon-xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              ›
            </Button>
            <Button variant="outline" size="icon-xs" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
              »
            </Button>
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      <Modal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={`Booking ${selectedBooking?.bookingNumber}`}
        size="lg"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Passenger</p>
                <p className="text-sm font-medium text-[#172F52]">
                  {getPassengerName(selectedBooking.passengerId)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Operator</p>
                <p className="text-sm font-medium text-[#172F52]">
                  {getOperatorName(selectedBooking.operatorId)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Pickup</p>
                <p className="text-sm text-[#172F52]">{selectedBooking.pickup.formattedAddress}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Destination</p>
                <p className="text-sm text-[#172F52]">{selectedBooking.destination.formattedAddress}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Date & Time</p>
                <p className="text-sm text-[#172F52]">{selectedBooking.date} at {selectedBooking.pickupTime}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Vehicle Type</p>
                <p className="text-sm text-[#172F52] capitalize">{selectedBooking.vehicleType.replace("_", " ")}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 border-t border-[#F5F7FA] pt-4">
              <div>
                <p className="text-xs text-[#6B7280]">Status</p>
                <StatusBadge status={selectedBooking.bookingStatus} type="booking" />
              </div>
              <div>
                <p className="text-xs text-[#6B7280]">Payment</p>
                <StatusBadge status={selectedBooking.paymentStatus} type="payment" />
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-[#6B7280]">Total</p>
                <p className="text-lg font-bold text-[#172F52]">£{selectedBooking.total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!cancelBooking}
        onOpenChange={(open) => { if (!open) setCancelBooking(null) }}
        title="Cancel Booking"
        description={`Are you sure you want to cancel booking ${cancelBooking?.bookingNumber}? This action cannot be undone.`}
        confirmText="Cancel Booking"
        variant="destructive"
        onConfirm={() => setCancelBooking(null)}
      />

      <ConfirmDialog
        open={!!cashActionBooking}
        onOpenChange={(open) => { if (!open) setCashActionBooking(null) }}
        title={cashActionType === "approve" ? "Approve Cash Booking" : "Reject Cash Booking"}
        description={
          cashActionType === "approve"
            ? `Are you sure you want to approve cash booking ${cashActionBooking?.bookingNumber}? The passenger will be notified and a driver can be assigned.`
            : `Are you sure you want to reject cash booking ${cashActionBooking?.bookingNumber}? The passenger will be notified of the rejection.`
        }
        confirmText={cashActionType === "approve" ? "Approve" : "Reject"}
        variant={cashActionType === "approve" ? "default" : "destructive"}
        onConfirm={confirmCashAction}
      />
    </div>
  )
}
