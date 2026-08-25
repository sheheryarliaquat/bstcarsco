"use client"

import { useState } from "react"
import { Eye, Calendar, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { BookingStatus } from "@/types"
import Link from "next/link"

interface TripRow {
  id: string
  date: string
  time: string
  from: string
  to: string
  passenger: string
  status: BookingStatus
  earnings: string
  _raw: typeof DEMO_TRIPS[number]
}

const DEMO_TRIPS = [
  {
    id: "UKTB-2026-000001",
    date: "25 Aug 2026",
    time: "06:30",
    from: "221B Baker Street, London NW1 6XE",
    to: "Heathrow Airport, Terminal 5",
    passenger: "James Wilson",
    status: BookingStatus.TripCompleted,
    earnings: "£51.00",
  },
  {
    id: "UKTB-2026-000002",
    date: "25 Aug 2026",
    time: "14:00",
    from: "1 Manchester Square, London W1U 3PH",
    to: "10 Downing Street, London SW1A 2AA",
    passenger: "Emma Thompson",
    status: BookingStatus.DriverEnRoute,
    earnings: "£11.52",
  },
  {
    id: "UKTB-2026-000005",
    date: "25 Aug 2026",
    time: "09:00",
    from: "Waverley Station, Edinburgh EH1 1BZ",
    to: "Glasgow Central Station, Glasgow G1 1AE",
    passenger: "David Morgan",
    status: BookingStatus.TripStarted,
    earnings: "£410.40",
  },
  {
    id: "UKTB-2026-000003",
    date: "27 Aug 2026",
    time: "10:00",
    from: "Birmingham New Street, Birmingham B2 4QA",
    to: "Manchester Airport, Manchester M90 1QX",
    passenger: "Raj Patel",
    status: BookingStatus.Confirmed,
    earnings: "£102.60",
  },
  {
    id: "UKTB-2026-000006",
    date: "25 Aug 2026",
    time: "18:30",
    from: "221B Baker Street, London NW1 6XE",
    to: "10 Downing Street, London SW1A 2AA",
    passenger: "James Wilson",
    status: BookingStatus.PaymentFailed,
    earnings: "£13.80",
  },
  {
    id: "UKTB-2026-000007",
    date: "24 Aug 2026",
    time: "12:15",
    from: "Liverpool ONE, Liverpool L1 8JQ",
    to: "Bristol Temple Meads, Bristol BS1 6QF",
    passenger: "Sophie Clarkson",
    status: BookingStatus.TripCompleted,
    earnings: "£98.40",
  },
  {
    id: "UKTB-2026-000008",
    date: "23 Aug 2026",
    time: "08:00",
    from: "Cardiff Central Station, Cardiff CF10 1EP",
    to: "Birmingham New Street, Birmingham B2 4QA",
    passenger: "Linda Nguyen",
    status: BookingStatus.CancelledByDriver,
    earnings: "£0.00",
  },
  {
    id: "UKTB-2026-000009",
    date: "22 Aug 2026",
    time: "16:45",
    from: "The O2 Arena, London SE10 0DX",
    to: "Heathrow Airport, Terminal 5",
    passenger: "David Morgan",
    status: BookingStatus.TripCompleted,
    earnings: "£67.50",
  },
  {
    id: "UKTB-2026-000010",
    date: "21 Aug 2026",
    time: "07:30",
    from: "221B Baker Street, London NW1 6XE",
    to: "Glasgow Central Station, Glasgow G1 1AE",
    passenger: "James Wilson",
    status: BookingStatus.TripCompleted,
    earnings: "£385.20",
  },
  {
    id: "UKTB-2026-000011",
    date: "20 Aug 2026",
    time: "15:00",
    from: "Manchester Airport, Manchester M90 1QX",
    to: "Waverley Station, Edinburgh EH1 1BZ",
    passenger: "Emma Thompson",
    status: BookingStatus.NoShow,
    earnings: "£0.00",
  },
] as const

const ALL_TRIPS: TripRow[] = DEMO_TRIPS.map((t) => ({
  ...t,
  _raw: t,
}))

export default function DriverBookingsPage() {
  const [activeTab, setActiveTab] = useState("all")

  const filteredTrips = ALL_TRIPS.filter((trip) => {
    switch (activeTab) {
      case "active":
        return [
          BookingStatus.DriverAccepted,
          BookingStatus.DriverEnRoute,
          BookingStatus.DriverArrived,
          BookingStatus.PassengerOnboard,
          BookingStatus.TripStarted,
        ].includes(trip.status)
      case "completed":
        return trip.status === BookingStatus.TripCompleted
      case "cancelled":
        return [
          BookingStatus.CancelledByDriver,
          BookingStatus.CancelledByPassenger,
          BookingStatus.CancelledByOperator,
          BookingStatus.NoShow,
        ].includes(trip.status)
      default:
        return true
    }
  })

  const columns: Column<TripRow>[] = [
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-[#172F52]">{row.date}</p>
          <p className="text-xs text-[#6B7280]">{row.time}</p>
        </div>
      ),
    },
    {
      key: "from",
      header: "Route",
      render: (row) => (
        <div className="max-w-[250px]">
          <p className="truncate text-sm text-[#172F52]">{row.from.split(",")[0]}</p>
          <p className="truncate text-xs text-[#6B7280]">→ {row.to.split(",")[0]}</p>
        </div>
      ),
    },
    {
      key: "passenger",
      header: "Passenger",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-[#172F52]">{row.passenger}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} type="booking" />,
    },
    {
      key: "earnings",
      header: "Earnings",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-[#172F52]">{row.earnings}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: () => (
        <Link href="/driver/active-trip">
          <Button variant="ghost" size="sm" className="text-[#D4145A] hover:bg-[#D4145A]/10 hover:text-[#D4145A]">
            <Eye className="mr-1 h-3.5 w-3.5" />
            View
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">My Trips</h1>
          <p className="text-sm text-[#6B7280]">View and manage all your trips</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="border-[#D9E0E8]">
            <Calendar className="mr-2 h-4 w-4" />
            Date Range
          </Button>
          <Button variant="outline" size="sm" className="border-[#D9E0E8]">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-[#E5E7EB]">
          <TabsTrigger value="all" className="data-[state=active]:bg-[#D4145A] data-[state=active]:text-white">
            All ({ALL_TRIPS.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-[#D4145A] data-[state=active]:text-white">
            Active
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-[#D4145A] data-[state=active]:text-white">
            Completed
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="data-[state=active]:bg-[#D4145A] data-[state=active]:text-white">
            Cancelled
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredTrips.length === 0 ? (
            <EmptyState
              icon={<Car className="h-16 w-16" />}
              title="No trips found"
              description="No trips match the selected filter."
            />
          ) : (
            <DataTable
              columns={columns as unknown as Column<Record<string, unknown>>[]}
              data={filteredTrips as unknown as Record<string, unknown>[]}
              searchable
              searchPlaceholder="Search trips..."
              keyExtractor={(row) => row.id as string}
              pagination={{
                page: 1,
                pageSize: 10,
                total: filteredTrips.length,
                onPageChange: () => {},
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Car(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  )
}
