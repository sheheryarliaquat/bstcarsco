"use client"

import { useState, useMemo, useEffect } from "react"
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
import { BOOKING_STATUSES, PAYMENT_STATUSES, UK_CITIES } from "@/constants"
import type { Booking, Operator, User as AppUser } from "@/types"
import { BookingStatus } from "@/types"
import { listenToAllBookings, updateBookingStatus } from "@/lib/services/booking-service"
import { getVehicle } from "@/lib/services/vehicle-service"
import { listenToDrivers } from "@/lib/services/driver-service"
import { getDocument } from "@/lib/firebase/firestore"

type BookingRow = Booking & { id: string }

const PAGE_SIZES = [10, 25, 50, 100]

export default function AdminBookingsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [cancelBooking, setCancelBooking] = useState<BookingRow | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [cashActionBooking, setCashActionBooking] = useState<BookingRow | null>(null)
  const [cashActionType, setCashActionType] = useState<"approve" | "reject">("approve")
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [passengerNames, setPassengerNames] = useState<Record<string, string>>({})
  const [operatorNames, setOperatorNames] = useState<Record<string, string>>({})
  const [vehicleInfoMap, setVehicleInfoMap] = useState<Record<string, string>>({})
  const [driverNames, setDriverNames] = useState<Record<string, string>>({})

  useEffect(() => {
    const unsubscribe = listenToDrivers(
      (drivers) =>
        setDriverNames(Object.fromEntries(drivers.map((d) => [d.uid, `${d.firstName} ${d.lastName}`]))),
      () => setDriverNames({})
    )
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const unsubscribe = listenToAllBookings(
      (data) => setBookings(data as BookingRow[]),
      () => setBookings([])
    )
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const passengerIds = [...new Set(bookings.map((b) => b.passengerId).filter(Boolean))]
    const operatorIds = [...new Set(bookings.map((b) => b.operatorId).filter(Boolean))]
    const vehicleIds = [...new Set(bookings.map((b) => b.vehicleId).filter(Boolean))]

    Promise.all(
      passengerIds.map((id) =>
        id.startsWith("guest-") || id.length < 20
          ? Promise.resolve(null)
          : getDocument<AppUser>("users", id).catch(() => null)
      )
    ).then((results) => {
      const map: Record<string, string> = {}
      results.forEach((u, i) => {
        map[passengerIds[i]] = u ? `${u.firstName} ${u.lastName}` : "Guest"
      })
      setPassengerNames(map)
    })

    Promise.all(operatorIds.map((id) => getDocument<Operator>("users", id).catch(() => null))).then(
      (results) => {
        const map: Record<string, string> = {}
        results.forEach((o, i) => {
          map[operatorIds[i]] = o?.companyName ?? "Unknown"
        })
        setOperatorNames(map)
      }
    )

    Promise.all(vehicleIds.map((id) => getVehicle(id).catch(() => null))).then((results) => {
      const map: Record<string, string> = {}
      results.forEach((v, i) => {
        map[vehicleIds[i]] = v ? `${v.make} ${v.model}` : "Unknown"
      })
      setVehicleInfoMap(map)
    })
  }, [bookings])

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

  const getPassengerName = (passengerId: string) => passengerNames[passengerId] ?? "Loading..."

  const getOperatorName = (operatorId: string) => {
    if (!operatorId) return "Unassigned"
    return operatorNames[operatorId] ?? "Loading..."
  }

  const getDriverName = (driverId: string) => {
    if (!driverId) return "Unassigned"
    return driverNames[driverId] ?? "Unknown"
  }

  // Download the bookings currently shown by the filters as a CSV for record keeping.
  function exportCsv() {
    const header = [
      "Booking ref", "Booked at", "Pick-up date", "Pick-up time", "Passenger", "Pick-up", "Drop-off",
      "Car type", "Passengers", "Luggage", "Flight", "Driver", "Vehicle", "Fare (GBP)", "Payment method",
      "Payment status", "Booking status", "Cancellation reason",
    ]
    const statusLabel = (v: string) => BOOKING_STATUSES.find((s) => s.value === v)?.label ?? v
    const rows = filtered.map((b) => [
      b.bookingNumber, b.createdAt, b.date, b.pickupTime, getPassengerName(b.passengerId),
      b.pickup?.formattedAddress, b.destination?.formattedAddress, b.vehicleType, b.passengers, b.luggage,
      b.specialRequirements?.flightNumber ?? "", getDriverName(b.driverId), b.vehicleId ? getVehicleInfo(b.vehicleId) : "",
      (b.total ?? 0).toFixed(2), b.paymentMethod ?? "", b.paymentStatus, statusLabel(b.bookingStatus),
      b.cancellationReason ?? "",
    ])
    const escape = (v: unknown) => {
      const t = String(v ?? "")
      // Prefix formula-like cells so spreadsheets don't execute them.
      const safe = /^[=+\-@]/.test(t) ? `'${t}` : t
      return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
    }
    const csv = [header, ...rows].map((r) => r.map(escape).join(",")).join("\r\n")
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getVehicleInfo = (vehicleId: string) => {
    if (!vehicleId) return "-"
    return vehicleInfoMap[vehicleId] ?? "Loading..."
  }

  function handleViewBooking(booking: BookingRow) {
    setSelectedBooking(booking)
    setDetailOpen(true)
  }

  function handleCashAction(booking: BookingRow, action: "approve" | "reject") {
    setCashActionBooking(booking)
    setCashActionType(action)
  }

  async function confirmCashAction() {
    if (!cashActionBooking) return
    const status = cashActionType === "approve" ? BookingStatus.Confirmed : BookingStatus.CancelledByAdmin
    const paymentStatus = cashActionType === "approve" ? ("pending" as const) : ("refunded" as const)
    await updateBookingStatus(cashActionBooking.id, status, { paymentStatus })
    setCashActionBooking(null)
  }

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "bookingNumber",
      header: "Booking ID",
      sortable: true,
      className: "font-mono text-xs",
      render: (row) => (
        <span className="font-mono text-xs font-medium text-[#0F1B2D]">
          {row.bookingNumber as string}
        </span>
      ),
    },
    {
      key: "passenger",
      header: "Passenger",
      sortable: true,
      render: (row) => (
        <span className="text-[#0F1B2D]">{getPassengerName(row.passengerId as string)}</span>
      ),
    },
    {
      key: "pickup",
      header: "Pickup",
      render: (row) => {
        const b = row as unknown as Booking
        return (
          <span className="max-w-[140px] truncate text-[#5B6577]">
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
          <span className="max-w-[140px] truncate text-[#5B6577]">
            {b.destination.formattedAddress.split(",")[0]}
          </span>
        )
      },
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (row) => <span className="text-[#5B6577]">{row.date as string}</span>,
    },
    {
      key: "pickupTime",
      header: "Time",
      render: (row) => <span className="text-[#5B6577]">{row.pickupTime as string}</span>,
    },
    {
      key: "operatorId",
      header: "Operator",
      render: (row) => (
        <span className="text-[#0F1B2D]">{getOperatorName(row.operatorId as string)}</span>
      ),
    },
    {
      key: "driverId",
      header: "Driver",
      render: (row) => {
        const name = getDriverName(row.driverId as string)
        return (
          <span className={cn("text-sm", name === "Unassigned" ? "italic text-[#5B6577]" : "text-[#0F1B2D]")}>
            {name}
          </span>
        )
      },
    },
    {
      key: "vehicleId",
      header: "Vehicle",
      render: (row) => (
        <span className="text-[#5B6577]">{getVehicleInfo(row.vehicleId as string)}</span>
      ),
    },
    {
      key: "total",
      header: "Price",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-[#0F1B2D]">
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
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Bookings</h1>
          <p className="text-sm text-[#5B6577]">
            Manage all platform bookings ({filtered.length} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-[#E2E6EC]"
            onClick={exportCsv}
            disabled={filtered.length === 0}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-[#E2E6EC] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6577]" />
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
            className="h-9 rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]"
          >
            <option value="all">All Statuses</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]"
          >
            <option value="all">All Payments</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            className="border-[#E2E6EC]"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            More Filters
            {showFilters ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
          </Button>
        </div>

        {showFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#F4F6F9] pt-3">
            <select className="h-9 rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]">
              <option value="all">All Pickup Areas</option>
              {UK_CITIES.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            <select className="h-9 rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]">
              <option value="all">All Destination Areas</option>
              {UK_CITIES.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            <input
              type="date"
              className="h-9 rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]"
            />
            <span className="text-xs text-[#5B6577]">to</span>
            <input
              type="date"
              className="h-9 rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]"
            />
            <select className="h-9 rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]">
              <option value="all">All Operators</option>
              {Object.entries(operatorNames).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-[#E2E6EC] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E2E6EC] bg-[#F4F6F9]">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]" />
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
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-[#5B6577]">
                    No bookings found
                  </td>
                </tr>
              ) : (
                paginated.map((booking) => {
                  const isExpanded = expandedRow === booking.bookingNumber
                  return (
                    <React.Fragment key={booking.bookingNumber}>
                      <tr
                        className="border-b border-[#F4F6F9] transition-colors last:border-0 hover:bg-[#F4F6F9]/50 cursor-pointer"
                        onClick={() => setExpandedRow(isExpanded ? null : booking.bookingNumber)}
                      >
                        <td className="px-4 py-3">
                          <button className="text-[#5B6577] hover:text-[#0F1B2D]">
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
                          <td colSpan={columns.length + 1} className="bg-[#F4F6F9]/30 px-8 py-4">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase text-[#5B6577]">Pickup Details</p>
                                <div className="flex items-start gap-2">
                                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1F4FD8]" />
                                  <p className="text-sm text-[#0F1B2D]">{booking.pickup.formattedAddress}</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase text-[#5B6577]">Destination Details</p>
                                <div className="flex items-start gap-2">
                                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                                  <p className="text-sm text-[#0F1B2D]">{booking.destination.formattedAddress}</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase text-[#5B6577]">Journey Info</p>
                                <p className="text-sm text-[#0F1B2D]">Distance: {booking.distanceMiles} miles</p>
                                <p className="text-sm text-[#0F1B2D]">Duration: {booking.estimatedDuration} mins</p>
                                <p className="text-sm text-[#0F1B2D]">Passengers: {booking.passengers}</p>
                                <p className="text-sm text-[#0F1B2D]">Luggage: {booking.luggage}</p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase text-[#5B6577]">Pricing</p>
                                <p className="text-sm text-[#0F1B2D]">Subtotal: £{booking.price.toFixed(2)}</p>
                                {booking.discount > 0 && (
                                  <p className="text-sm text-green-600">Discount: -£{booking.discount.toFixed(2)}</p>
                                )}
                                <p className="text-sm text-[#0F1B2D]">Tax: £{booking.tax.toFixed(2)}</p>
                                <p className="text-sm font-bold text-[#0F1B2D]">Total: £{booking.total.toFixed(2)}</p>
                              </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2 border-t border-[#E5E7EB] pt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-[#E2E6EC]"
                                onClick={(e) => { e.stopPropagation(); handleViewBooking(booking) }}
                              >
                                <Eye className="mr-1 h-3.5 w-3.5" />
                                View Full Details
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-[#E2E6EC]"
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E6EC] px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#5B6577]">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="h-7 rounded border border-[#E2E6EC] bg-white px-2 text-xs text-[#0F1B2D]"
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
            <span className="px-2 text-sm font-medium text-[#0F1B2D]">{page} / {totalPages || 1}</span>
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
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Passenger</p>
                <p className="text-sm font-medium text-[#0F1B2D]">
                  {getPassengerName(selectedBooking.passengerId)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Operator</p>
                <p className="text-sm font-medium text-[#0F1B2D]">
                  {getOperatorName(selectedBooking.operatorId)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Pickup</p>
                <p className="text-sm text-[#0F1B2D]">{selectedBooking.pickup.formattedAddress}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Destination</p>
                <p className="text-sm text-[#0F1B2D]">{selectedBooking.destination.formattedAddress}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Date & Time</p>
                <p className="text-sm text-[#0F1B2D]">{selectedBooking.date} at {selectedBooking.pickupTime}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Vehicle Type</p>
                <p className="text-sm text-[#0F1B2D] capitalize">{selectedBooking.vehicleType.replace("_", " ")}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 border-t border-[#F4F6F9] pt-4">
              <div>
                <p className="text-xs text-[#5B6577]">Status</p>
                <StatusBadge status={selectedBooking.bookingStatus} type="booking" />
              </div>
              <div>
                <p className="text-xs text-[#5B6577]">Payment</p>
                <StatusBadge status={selectedBooking.paymentStatus} type="payment" />
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-[#5B6577]">Total</p>
                <p className="text-lg font-bold text-[#0F1B2D]">£{selectedBooking.total.toFixed(2)}</p>
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
