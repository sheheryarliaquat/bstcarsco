"use client"

import { useState, useEffect, useMemo } from "react"
import { Eye, Calendar, Filter, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { useAuth } from "@/hooks/useAuth"
import { listenToDriverBookings } from "@/lib/services/booking-service"
import { getUsersByRole } from "@/lib/services/user-service"
import { BookingStatus } from "@/types"
import type { Booking, User as AppUser } from "@/types"
import Link from "next/link"

type BookingRow = Booking & { id: string }

interface TripRow {
  id: string
  bookingNumber: string
  date: string
  time: string
  from: string
  to: string
  passenger: string
  status: BookingStatus
  earnings: number
}

export default function DriverBookingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("all")
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [passengers, setPassengers] = useState<AppUser[]>([])

  useEffect(() => {
    if (!user) return
    const unsubscribe = listenToDriverBookings(
      user.uid,
      (data) => {
        setBookings(data as BookingRow[])
        setLoading(false)
      },
      (err) => {
        console.error("DriverBookingsPage: listenToDriverBookings failed —", err)
        setLoading(false)
      }
    )
    return unsubscribe
  }, [user])

  useEffect(() => {
    getUsersByRole("passenger")
      .then(setPassengers)
      .catch((err) => console.error("DriverBookingsPage: getUsersByRole(passenger) failed —", err))
  }, [])

  const allTrips: TripRow[] = useMemo(() => {
    function getPassengerName(passengerId: string) {
      if (!passengerId) return "Unknown"
      if (passengerId.startsWith("guest-")) return "Guest"
      const p = passengers.find((p) => p.uid === passengerId)
      return p ? `${p.firstName} ${p.lastName}` : "Guest"
    }

    return bookings.map((b) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      date: b.date,
      time: b.pickupTime,
      from: b.pickup?.formattedAddress ?? "",
      to: b.destination?.formattedAddress ?? "",
      passenger: getPassengerName(b.passengerId),
      status: b.bookingStatus,
      earnings: b.total || 0,
    }))
  }, [bookings, passengers])

  const filteredTrips = allTrips.filter((trip) => {
    switch (activeTab) {
      case "active":
        return [
          BookingStatus.DriverAssigned,
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
          BookingStatus.CancelledByAdmin,
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
        <span className="font-semibold text-[#172F52]">£{row.earnings.toFixed(2)}</span>
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

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-[#D9E0E8] bg-white py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#D4145A]" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-[#E5E7EB]">
            <TabsTrigger value="all" className="data-[state=active]:bg-[#D4145A] data-[state=active]:text-white">
              All ({allTrips.length})
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
                description={
                  allTrips.length === 0
                    ? "No trips have been assigned to you yet."
                    : "No trips match the selected filter."
                }
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
      )}
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
