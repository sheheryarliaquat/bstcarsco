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
import { DEMO_DATA } from "@/constants"
import { BookingStatus, type Booking } from "@/types"
import { listenToPassengerBookings } from "@/lib/services/booking-service"

type TabFilter = "all" | "upcoming" | "active" | "completed" | "cancelled"

const extraBookings: Booking[] = [
  {
    bookingNumber: "UKTB-2026-000007",
    passengerId: "pass-001",
    operatorId: "op-001",
    driverId: "drv-001",
    vehicleId: "veh-001",
    tripType: "one_way",
    pickup: DEMO_DATA.locations[0],
    destination: DEMO_DATA.locations[5],
    viaStops: [],
    date: "2026-08-20",
    pickupTime: "09:00",
    passengers: 1,
    luggage: 1,
    vehicleType: "saloon",
    distanceMiles: 5.2,
    estimatedDuration: 22,
    price: 14.5,
    discount: 0,
    tax: 2.9,
    total: 17.4,
    currency: "GBP",
    paymentStatus: "completed",
    bookingStatus: BookingStatus.TripCompleted,
    createdAt: "2026-08-18T10:00:00Z",
    updatedAt: "2026-08-20T09:45:00Z",
  },
  {
    bookingNumber: "UKTB-2026-000008",
    passengerId: "pass-001",
    operatorId: "op-001",
    driverId: "drv-002",
    vehicleId: "veh-002",
    tripType: "one_way",
    pickup: DEMO_DATA.locations[3],
    destination: DEMO_DATA.locations[1],
    viaStops: [],
    date: "2026-08-15",
    pickupTime: "14:00",
    passengers: 1,
    luggage: 2,
    vehicleType: "executive",
    distanceMiles: 16.8,
    estimatedDuration: 42,
    price: 38.0,
    discount: 3.8,
    tax: 6.84,
    total: 41.04,
    currency: "GBP",
    paymentStatus: "completed",
    bookingStatus: BookingStatus.TripCompleted,
    createdAt: "2026-08-13T12:00:00Z",
    updatedAt: "2026-08-15T15:10:00Z",
  },
  {
    bookingNumber: "UKTB-2026-000009",
    passengerId: "pass-001",
    operatorId: "op-001",
    driverId: "",
    vehicleId: "",
    tripType: "one_way",
    pickup: DEMO_DATA.locations[11],
    destination: DEMO_DATA.locations[7],
    viaStops: [],
    date: "2026-08-10",
    pickupTime: "08:00",
    passengers: 2,
    luggage: 1,
    vehicleType: "saloon",
    distanceMiles: 117.0,
    estimatedDuration: 130,
    price: 142.0,
    discount: 14.2,
    tax: 25.56,
    total: 153.36,
    currency: "GBP",
    paymentStatus: "completed",
    bookingStatus: BookingStatus.TripCompleted,
    createdAt: "2026-08-08T09:00:00Z",
    updatedAt: "2026-08-10T10:30:00Z",
  },
  {
    bookingNumber: "UKTB-2026-000010",
    passengerId: "pass-001",
    operatorId: "op-001",
    driverId: "",
    vehicleId: "",
    tripType: "return",
    pickup: DEMO_DATA.locations[11],
    destination: DEMO_DATA.locations[0],
    viaStops: [],
    date: "2026-08-27",
    pickupTime: "10:00",
    returnDate: "2026-08-28",
    returnTime: "16:00",
    passengers: 1,
    luggage: 0,
    vehicleType: "saloon",
    distanceMiles: 3.1,
    estimatedDuration: 18,
    price: 11.5,
    discount: 0,
    tax: 2.3,
    total: 13.8,
    currency: "GBP",
    paymentStatus: "completed",
    bookingStatus: BookingStatus.Confirmed,
    createdAt: "2026-08-25T08:00:00Z",
    updatedAt: "2026-08-25T08:00:00Z",
  },
  {
    bookingNumber: "UKTB-2026-000011",
    passengerId: "pass-001",
    operatorId: "op-002",
    driverId: "drv-003",
    vehicleId: "veh-003",
    tripType: "one_way",
    pickup: DEMO_DATA.locations[5],
    destination: DEMO_DATA.locations[4],
    viaStops: [],
    date: "2026-07-28",
    pickupTime: "11:00",
    passengers: 1,
    luggage: 2,
    vehicleType: "estate",
    distanceMiles: 120.5,
    estimatedDuration: 140,
    price: 148.0,
    discount: 14.8,
    tax: 26.64,
    total: 159.84,
    currency: "GBP",
    paymentStatus: "completed",
    bookingStatus: BookingStatus.TripCompleted,
    createdAt: "2026-07-25T14:00:00Z",
    updatedAt: "2026-07-28T13:20:00Z",
  },
  {
    bookingNumber: "UKTB-2026-000012",
    passengerId: "pass-001",
    operatorId: "op-001",
    driverId: "",
    vehicleId: "",
    tripType: "one_way",
    pickup: DEMO_DATA.locations[11],
    destination: DEMO_DATA.locations[3],
    viaStops: [],
    date: "2026-07-20",
    pickupTime: "15:00",
    passengers: 1,
    luggage: 0,
    vehicleType: "saloon",
    distanceMiles: 1.2,
    estimatedDuration: 8,
    price: 6.5,
    discount: 0,
    tax: 1.3,
    total: 7.8,
    currency: "GBP",
    paymentStatus: "completed",
    bookingStatus: BookingStatus.CancelledByPassenger,
    createdAt: "2026-07-20T14:30:00Z",
    updatedAt: "2026-07-20T14:45:00Z",
    cancellationReason: "changed_mind",
  },
  {
    bookingNumber: "UKTB-2026-000013",
    passengerId: "pass-001",
    operatorId: "op-001",
    driverId: "drv-001",
    vehicleId: "veh-006",
    tripType: "one_way",
    pickup: DEMO_DATA.locations[3],
    destination: DEMO_DATA.locations[10],
    viaStops: [],
    date: "2026-07-15",
    pickupTime: "07:30",
    passengers: 1,
    luggage: 1,
    vehicleType: "electric",
    distanceMiles: 0.8,
    estimatedDuration: 5,
    price: 5.5,
    discount: 0,
    tax: 1.1,
    total: 6.6,
    currency: "GBP",
    paymentStatus: "completed",
    bookingStatus: BookingStatus.TripCompleted,
    createdAt: "2026-07-14T18:00:00Z",
    updatedAt: "2026-07-15T07:40:00Z",
  },
]

const demoBookings = [...extraBookings]

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
  const [activeTab, setActiveTab] = useState<TabFilter>("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [allBookings, setAllBookings] = useState<Booking[]>(demoBookings)
  const pageSize = 8

  useEffect(() => {
    const stored = localStorage.getItem("bstcars_user")
    const userId = stored ? JSON.parse(stored).uid : null
    if (!userId) return

    const unsub = listenToPassengerBookings(
      userId,
      (firestoreBookings) => {
        const merged = [...firestoreBookings, ...extraBookings]
        const deduped = merged.filter(
          (b, i, arr) =>
            arr.findIndex((x) => x.bookingNumber === b.bookingNumber) === i
        )
        setAllBookings(deduped)
      },
      () => {
        setAllBookings(demoBookings)
      }
    )
    return unsub
  }, [])

  const filtered = useMemo(() => {
    let result = filterByTab(demoBookings, activeTab)
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
  }, [activeTab, search])

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
        const op = DEMO_DATA.operators.find((o) => o.uid === b.operatorId)
        return (
          <span className="text-sm text-[#172F52]">
            {op?.companyName ?? "N/A"}
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
