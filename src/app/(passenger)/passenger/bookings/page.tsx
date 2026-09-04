"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  MoreHorizontal,
  Eye,
  XCircle,
  Pencil,
  Download,
  Headphones,
  Calendar,
  Search,
  Filter,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EmptyState } from "@/components/shared/EmptyState"
import { BookingStatus, type Booking, type Operator } from "@/types"
import { listenToPassengerBookings } from "@/lib/services/booking-service"
import { getDocument } from "@/lib/firebase/firestore"
import { useAuth } from "@/hooks/useAuth"

type TabFilter = "all" | "upcoming" | "active" | "completed" | "cancelled"

const upcomingStatuses = new Set([
  BookingStatus.Confirmed,
  BookingStatus.OperatorPending,
  BookingStatus.DriverSearching,
  BookingStatus.DriverAssigned,
  BookingStatus.DriverAccepted,
  BookingStatus.PendingPayment,
  BookingStatus.CashPendingApproval,
])
const activeStatuses = new Set([
  BookingStatus.DriverEnRoute,
  BookingStatus.DriverArrived,
  BookingStatus.PassengerOnboard,
  BookingStatus.TripStarted,
])
const completedStatuses = new Set([BookingStatus.TripCompleted])
const cancelledStatuses = new Set([
  BookingStatus.CancelledByPassenger,
  BookingStatus.CancelledByDriver,
  BookingStatus.CancelledByOperator,
  BookingStatus.CancelledByAdmin,
  BookingStatus.NoShow,
  BookingStatus.PaymentFailed,
])

function filterByTab(bookings: Booking[], tab: TabFilter): Booking[] {
  switch (tab) {
    case "upcoming":
      return bookings.filter((b) => upcomingStatuses.has(b.bookingStatus))
    case "active":
      return bookings.filter((b) => activeStatuses.has(b.bookingStatus))
    case "completed":
      return bookings.filter((b) => completedStatuses.has(b.bookingStatus))
    case "cancelled":
      return bookings.filter((b) => cancelledStatuses.has(b.bookingStatus))
    default:
      return bookings
  }
}

export default function BookingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabFilter>("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [operatorNames, setOperatorNames] = useState<Record<string, string>>({})
  const pageSize = 8

  useEffect(() => {
    if (!user) {
      setAllBookings([])
      return
    }
    const unsub = listenToPassengerBookings(
      user.uid,
      (data) => setAllBookings(data),
      () => setAllBookings([])
    )
    return unsub
  }, [user])

  useEffect(() => {
    const operatorIds = [...new Set(allBookings.map((b) => b.operatorId).filter(Boolean))]
    Promise.all(operatorIds.map((id) => getDocument<Operator>("users", id).catch(() => null))).then(
      (results) => {
        const map: Record<string, string> = {}
        results.forEach((o, i) => {
          map[operatorIds[i]] = o?.companyName ?? "Unknown"
        })
        setOperatorNames(map)
      }
    )
  }, [allBookings])

  const filtered = useMemo(() => {
    let result = filterByTab(allBookings, activeTab)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (b) =>
          b.bookingNumber.toLowerCase().includes(q) ||
          b.pickup.formattedAddress.toLowerCase().includes(q) ||
          b.destination.formattedAddress.toLowerCase().includes(q)
      )
    }
    return result
  }, [allBookings, activeTab, search])

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page])

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "bookingNumber",
      header: "ID",
      render: (row) => (
        <span className="text-xs font-medium text-[#6B7280]">
          {(row as unknown as Booking).bookingNumber.split("-").pop()}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (row) => {
        const b = row as unknown as Booking
        return (
          <div>
            <p className="text-sm text-[#172F52]">{b.date}</p>
            <p className="text-xs text-[#6B7280]">{b.pickupTime}</p>
          </div>
        )
      },
    },
    {
      key: "route",
      header: "From → To",
      render: (row) => {
        const b = row as unknown as Booking
        return (
          <div className="max-w-[200px]">
            <p className="truncate text-sm text-[#172F52]">
              {b.pickup.formattedAddress.split(",")[0]}
            </p>
            <p className="truncate text-xs text-[#6B7280]">
              → {b.destination.formattedAddress.split(",")[0]}
            </p>
          </div>
        )
      },
    },
    {
      key: "operatorId",
      header: "Operator",
      render: (row) => {
        const b = row as unknown as Booking
        return (
          <span className="text-sm text-[#172F52]">
            {b.operatorId ? operatorNames[b.operatorId] ?? "Loading..." : "N/A"}
          </span>
        )
      },
    },
    {
      key: "vehicleType",
      header: "Vehicle",
      render: (row) => {
        const b = row as unknown as Booking
        return (
          <span className="text-sm capitalize text-[#172F52]">
            {b.vehicleType.replace(/_/g, " ")}
          </span>
        )
      },
    },
    {
      key: "total",
      header: "Price",
      sortable: true,
      render: (row) => {
        const b = row as unknown as Booking
        return (
          <span className="text-sm font-semibold text-[#172F52]">
            £{b.total.toFixed(2)}
          </span>
        )
      },
    },
    {
      key: "bookingStatus",
      header: "Status",
      render: (row) => {
        const b = row as unknown as Booking
        return <StatusBadge status={b.bookingStatus} />
      },
    },
    {
      key: "actions",
      header: "",
      render: (row) => {
        const b = row as unknown as Booking
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="rounded-md p-1 text-[#6B7280] hover:bg-[#F5F7FA]" />
              }
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link
                  href={`/passenger/bookings/${b.bookingNumber}`}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" /> View
                </Link>
              </DropdownMenuItem>
              {upcomingStatuses.has(b.bookingStatus) && (
                <DropdownMenuItem>
                  <Pencil className="h-4 w-4" /> Modify
                </DropdownMenuItem>
              )}
              {upcomingStatuses.has(b.bookingStatus) && (
                <DropdownMenuItem variant="destructive">
                  <XCircle className="h-4 w-4" /> Cancel
                </DropdownMenuItem>
              )}
              {completedStatuses.has(b.bookingStatus) && (
                <DropdownMenuItem>
                  <Download className="h-4 w-4" /> Download Receipt
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Headphones className="h-4 w-4" /> Contact Support
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#172F52]">My Bookings</h1>
        <p className="text-sm text-[#6B7280]">
          View and manage all your taxi bookings.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as TabFilter)
          setPage(1)
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList variant="line">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by ID or destination..."
              className="h-9 w-full pl-9 sm:w-72"
            />
          </div>
        </div>

        <TabsContent value={activeTab}>
          {paginated.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-16 w-16" />}
              title="No bookings found"
              description={
                search
                  ? "Try adjusting your search terms."
                  : "You don't have any bookings in this category yet."
              }
            />
          ) : (
            <DataTable
              columns={columns}
              data={paginated as unknown as Record<string, unknown>[]}
              keyExtractor={(row) =>
                (row as unknown as Booking).bookingNumber
              }
              pagination={{
                page,
                pageSize,
                total: filtered.length,
                onPageChange: setPage,
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
