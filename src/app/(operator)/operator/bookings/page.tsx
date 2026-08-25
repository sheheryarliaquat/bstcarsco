"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  UserPlus,
  ClipboardList,
  Calendar,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { Modal } from "@/components/shared/Modal"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { DEMO_DATA } from "@/constants"
import { BookingStatus } from "@/types"

const TABS = ["All", "Pending", "Active", "Completed", "Cancelled"] as const

type Tab = (typeof TABS)[number]

function getBookingCategory(status: BookingStatus): Tab {
  if (
    status === BookingStatus.PendingPayment ||
    status === BookingStatus.OperatorPending
  )
    return "Pending"
  if (
    status === BookingStatus.DriverEnRoute ||
    status === BookingStatus.DriverArrived ||
    status === BookingStatus.TripStarted ||
    status === BookingStatus.DriverAssigned ||
    status === BookingStatus.DriverAccepted ||
    status === BookingStatus.PassengerOnboard
  )
    return "Active"
  if (status === BookingStatus.TripCompleted) return "Completed"
  if (
    status === BookingStatus.CancelledByPassenger ||
    status === BookingStatus.CancelledByDriver ||
    status === BookingStatus.CancelledByOperator ||
    status === BookingStatus.CancelledByAdmin ||
    status === BookingStatus.NoShow ||
    status === BookingStatus.PaymentFailed
  )
    return "Cancelled"
  return "All"
}

interface BookingRow {
  bookingNumber: string
  passenger: string
  from: string
  to: string
  date: string
  time: string
  driver: string
  vehicle: string
  price: string
  status: BookingStatus
}

export default function OperatorBookingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("All")
  const [search, setSearch] = useState("")
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<string>("")
  const [page, setPage] = useState(1)
  const pageSize = 5

  const rows: BookingRow[] = useMemo(() => {
    return DEMO_DATA.bookings.map((b) => {
      const passenger = DEMO_DATA.passengers.find((p) => p.uid === b.passengerId)
      const driver = DEMO_DATA.drivers.find((d) => d.uid === b.driverId)
      const vehicle = DEMO_DATA.vehicles.find((v) => v.id === b.vehicleId)
      return {
        bookingNumber: b.bookingNumber,
        passenger: passenger
          ? `${passenger.firstName} ${passenger.lastName}`
          : "Unknown",
        from: b.pickup.formattedAddress.split(",")[0],
        to: b.destination.formattedAddress.split(",")[0],
        date: new Date(b.date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        time: b.pickupTime,
        driver: driver
          ? `${driver.firstName} ${driver.lastName}`
          : "Unassigned",
        vehicle: vehicle
          ? `${vehicle.make} ${vehicle.model}`
          : b.vehicleType,
        price: `£${b.total.toFixed(2)}`,
        status: b.bookingStatus,
      }
    })
  }, [])

  const filteredRows = useMemo(() => {
    let filtered = rows
    if (activeTab !== "All") {
      filtered = rows.filter((r) => getBookingCategory(r.status) === activeTab)
    }
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.bookingNumber.toLowerCase().includes(q) ||
          r.passenger.toLowerCase().includes(q) ||
          r.from.toLowerCase().includes(q) ||
          r.to.toLowerCase().includes(q)
      )
    }
    return filtered
  }, [rows, activeTab, search])

  const totalPages = Math.ceil(filteredRows.length / pageSize)
  const paginatedRows = filteredRows.slice(
    (page - 1) * pageSize,
    page * pageSize
  )

  function handleAssignDriver(bookingId: string) {
    setSelectedBooking(bookingId)
    setAssignModalOpen(true)
  }

  function confirmAssign() {
    setAssignModalOpen(false)
    setSelectedBooking(null)
    setSelectedDriver("")
  }

  const tabCounts = useMemo(() => {
    const counts: Record<Tab, number> = {
      All: rows.length,
      Pending: 0,
      Active: 0,
      Completed: 0,
      Cancelled: 0,
    }
    rows.forEach((r) => {
      const cat = getBookingCategory(r.status)
      counts[cat]++
    })
    return counts
  }, [rows])

  const columns: Column<BookingRow>[] = [
    {
      key: "bookingNumber",
      header: "ID",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-[#172F52]">{row.bookingNumber}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
    },
    {
      key: "time",
      header: "Time",
      sortable: true,
    },
    {
      key: "passenger",
      header: "Passenger",
      sortable: true,
    },
    {
      key: "from",
      header: "Route",
      render: (row) => (
        <div className="max-w-[180px]">
          <p className="truncate text-sm text-[#172F52]">{row.from}</p>
          <p className="truncate text-xs text-[#6B7280]">→ {row.to}</p>
        </div>
      ),
    },
    {
      key: "driver",
      header: "Driver",
      sortable: true,
    },
    {
      key: "vehicle",
      header: "Vehicle",
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-[#172F52]">{row.price}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} type="booking" />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {(row.status === BookingStatus.PendingPayment ||
            row.status === BookingStatus.OperatorPending) && (
            <>
              <Button
                size="sm"
                className="h-7 bg-[#28A745] text-white hover:bg-[#28A745]/90"
              >
                <CheckCircle2 className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="destructive" className="h-7">
                <XCircle className="h-3 w-3" />
              </Button>
            </>
          )}
          {row.driver === "Unassigned" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-[#D9E0E8]"
              onClick={() => handleAssignDriver(row.bookingNumber)}
            >
              <UserPlus className="h-3 w-3" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Bookings</h1>
          <p className="text-sm text-[#6B7280]">Manage all your taxi bookings.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setPage(1)
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-[#D4145A] text-white"
                : "bg-white text-[#6B7280] hover:bg-[#F5F7FA] border border-[#D9E0E8]"
            )}
          >
            {tab}
            <span
              className={cn(
                "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                activeTab === tab
                  ? "bg-white/20 text-white"
                  : "bg-[#F5F7FA] text-[#6B7280]"
              )}
            >
              {tabCounts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search bookings..."
            className="h-9 pl-9"
          />
        </div>
        <Button variant="outline" className="border-[#D9E0E8]">
          <Calendar className="mr-2 h-4 w-4" />
          Date Range
          <ChevronDown className="ml-2 h-3 w-3" />
        </Button>
        <Button variant="outline" className="border-[#D9E0E8]">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Table */}
      {filteredRows.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-16 w-16" />}
          title="No bookings found"
          description="No bookings match your current filters."
        />
      ) : (
        <DataTable
          columns={columns}
          data={paginatedRows.map((r, i) => ({
            ...r,
            _key: r.bookingNumber,
          }))}
          keyExtractor={(row) => row._key}
          pagination={{
            page,
            pageSize,
            total: filteredRows.length,
            onPageChange: setPage,
          }}
          emptyMessage="No bookings found"
        />
      )}

      {/* Assign Driver Modal */}
      <Modal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        title="Assign Driver"
        description={`Assign a driver to booking ${selectedBooking}`}
        size="md"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#172F52]">
              Select Driver
            </label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A] focus:ring-2 focus:ring-[#D4145A]/20"
            >
              <option value="">Choose a driver...</option>
              {DEMO_DATA.drivers
                .filter((d) => d.status === "online")
                .map((d) => (
                  <option key={d.uid} value={d.uid}>
                    {d.firstName} {d.lastName} — {d.rating}★
                  </option>
                ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="border-[#D9E0E8]"
              onClick={() => setAssignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
              onClick={confirmAssign}
              disabled={!selectedDriver}
            >
              Assign Driver
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ClipboardListIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
    </svg>
  )
}
