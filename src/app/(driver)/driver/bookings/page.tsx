"use client"

import { useState, useEffect } from "react"
import { Eye, Calendar as CalendarIcon, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { BookingStatus, type Booking } from "@/types"
import { useAuth } from "@/hooks/useAuth"
import { listenToDriverBookings } from "@/lib/services/booking-service"
import Link from "next/link"

export default function DriverBookingsPage() {
  const { user } = useAuth()
  const [trips, setTrips] = useState<Booking[]>([])
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (!user) {
      setTrips([])
      return
    }
    const unsub = listenToDriverBookings(user.uid, setTrips, () => setTrips([]))
    return unsub
  }, [user])

  const filteredTrips = trips.filter((trip) => {
    switch (activeTab) {
      case "active":
        return [
          BookingStatus.DriverAccepted,
          BookingStatus.DriverEnRoute,
          BookingStatus.DriverArrived,
          BookingStatus.PassengerOnboard,
          BookingStatus.TripStarted,
        ].includes(trip.bookingStatus)
      case "completed":
        return trip.bookingStatus === BookingStatus.TripCompleted
      case "cancelled":
        return [
          BookingStatus.CancelledByDriver,
          BookingStatus.CancelledByPassenger,
          BookingStatus.CancelledByOperator,
          BookingStatus.NoShow,
        ].includes(trip.bookingStatus)
      default:
        return true
    }
  })

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (row) => {
        const b = row as unknown as Booking
        return (
          <div>
            <p className="font-medium text-[#172F52]">{b.date}</p>
            <p className="text-xs text-[#6B7280]">{b.pickupTime}</p>
          </div>
        )
      },
    },
    {
      key: "route",
      header: "Route",
      render: (row) => {
        const b = row as unknown as Booking
        return (
          <div className="max-w-[250px]">
            <p className="truncate text-sm text-[#172F52]">{b.pickup.formattedAddress.split(",")[0]}</p>
            <p className="truncate text-xs text-[#6B7280]">→ {b.destination.formattedAddress.split(",")[0]}</p>
          </div>
        )
      },
    },
    {
      key: "passengers",
      header: "Passengers",
      render: (row) => (
        <span className="text-sm text-[#172F52]">{(row as unknown as Booking).passengers}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={(row as unknown as Booking).bookingStatus} type="booking" />,
    },
    {
      key: "total",
      header: "Fare",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-[#172F52]">£{(row as unknown as Booking).total.toFixed(2)}</span>
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
            <CalendarIcon className="mr-2 h-4 w-4" />
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
            All ({trips.length})
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
              icon={<CalendarIcon className="h-16 w-16" />}
              title="No trips found"
              description="No trips match the selected filter."
            />
          ) : (
            <DataTable
              columns={columns}
              data={filteredTrips as unknown as Record<string, unknown>[]}
              searchable
              searchPlaceholder="Search trips..."
              keyExtractor={(row) => (row as unknown as Booking).bookingNumber}
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
