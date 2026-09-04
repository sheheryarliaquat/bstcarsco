"use client"

import { useState, useEffect, useMemo } from "react"
import {
  MapPin,
  Navigation,
  Phone,
  Users,
  Luggage,
  AlertTriangle,
  Clock,
  Ruler,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { MapView } from "@/components/shared/MapView"
import { BookingStatus, type Booking, type User as AppUser } from "@/types"
import { useAuth } from "@/hooks/useAuth"
import { listenToDriverBookings, updateBookingStatus } from "@/lib/services/booking-service"
import { getDocument } from "@/lib/firebase/firestore"

type BookingRow = Booking & { id: string }

const ACTIVE_STATUSES = [
  BookingStatus.DriverAssigned,
  BookingStatus.DriverAccepted,
  BookingStatus.DriverEnRoute,
  BookingStatus.DriverArrived,
  BookingStatus.PassengerOnboard,
  BookingStatus.TripStarted,
]

const STATUS_CONFIG: Partial<Record<BookingStatus, { label: string; color: string; bg: string }>> = {
  [BookingStatus.DriverAssigned]: { label: "New Trip Assigned", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  [BookingStatus.DriverAccepted]: { label: "Trip Accepted", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  [BookingStatus.DriverEnRoute]: { label: "En Route to Pickup", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  [BookingStatus.DriverArrived]: { label: "Arrived at Pickup", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  [BookingStatus.PassengerOnboard]: { label: "Passenger On Board", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  [BookingStatus.TripStarted]: { label: "Trip In Progress", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  [BookingStatus.TripCompleted]: { label: "Trip Completed", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  [BookingStatus.NoShow]: { label: "Passenger No Show", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  [BookingStatus.CancelledByDriver]: { label: "Trip Cancelled", color: "text-red-700", bg: "bg-red-50 border-red-200" },
}

function getNextActions(status: BookingStatus) {
  switch (status) {
    case BookingStatus.DriverAssigned:
      return [
        { label: "Accept Trip", status: BookingStatus.DriverAccepted, color: "bg-green-600 text-white hover:bg-green-700", icon: <CheckCircle2 className="h-4 w-4" /> },
        { label: "Decline", status: BookingStatus.CancelledByDriver, color: "border-2 border-red-200 text-red-600 hover:bg-red-50", icon: <XCircle className="h-4 w-4" /> },
      ]
    case BookingStatus.DriverAccepted:
      return [{ label: "On The Way", status: BookingStatus.DriverEnRoute, color: "bg-blue-600 text-white hover:bg-blue-700", icon: <Navigation className="h-4 w-4" /> }]
    case BookingStatus.DriverEnRoute:
      return [{ label: "I Have Arrived", status: BookingStatus.DriverArrived, color: "bg-amber-500 text-white hover:bg-amber-600", icon: <MapPin className="h-4 w-4" /> }]
    case BookingStatus.DriverArrived:
      return [
        { label: "Passenger On Board", status: BookingStatus.PassengerOnboard, color: "bg-purple-600 text-white hover:bg-purple-700", icon: <Users className="h-4 w-4" /> },
        { label: "Passenger No Show", status: BookingStatus.NoShow, color: "border-2 border-red-200 text-red-600 hover:bg-red-50", icon: <AlertTriangle className="h-4 w-4" /> },
      ]
    case BookingStatus.PassengerOnboard:
      return [{ label: "Start Trip", status: BookingStatus.TripStarted, color: "bg-blue-600 text-white hover:bg-blue-700", icon: <Navigation className="h-4 w-4" /> }]
    case BookingStatus.TripStarted:
      return [{ label: "Complete Trip", status: BookingStatus.TripCompleted, color: "bg-green-600 text-white hover:bg-green-700", icon: <CheckCircle2 className="h-4 w-4" /> }]
    default:
      return []
  }
}

export default function ActiveTripPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [passenger, setPassenger] = useState<AppUser | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ status: BookingStatus; label: string } | null>(null)

  useEffect(() => {
    if (!user) {
      setBookings([])
      return
    }
    const unsub = listenToDriverBookings(user.uid, (data) => setBookings(data as BookingRow[]), () => setBookings([]))
    return unsub
  }, [user])

  const trip = useMemo(
    () => bookings.find((b) => ACTIVE_STATUSES.includes(b.bookingStatus)),
    [bookings]
  )

  useEffect(() => {
    if (!trip?.passengerId) {
      setPassenger(null)
      return
    }
    getDocument<AppUser>("users", trip.passengerId).then(setPassenger).catch(() => setPassenger(null))
  }, [trip?.passengerId])

  function handleStatusChange(newStatus: BookingStatus, label: string) {
    setPendingAction({ status: newStatus, label })
    setConfirmOpen(true)
  }

  async function confirmStatusChange() {
    if (pendingAction && trip) {
      await updateBookingStatus(trip.id, pendingAction.status)
      setPendingAction(null)
    }
    setConfirmOpen(false)
  }

  if (!trip) {
    return (
      <EmptyState
        icon={<Navigation className="h-16 w-16" />}
        title="No active trip"
        description="You don't have an active trip right now. Go online and wait for a dispatch assignment."
      />
    )
  }

  const statusConfig = STATUS_CONFIG[trip.bookingStatus] ?? {
    label: trip.bookingStatus,
    color: "text-[#172F52]",
    bg: "bg-[#F5F7FA] border-[#D9E0E8]",
  }
  const nextActions = getNextActions(trip.bookingStatus)
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${trip.pickup.latitude},${trip.pickup.longitude}&destination=${trip.destination.latitude},${trip.destination.longitude}&travelmode=driving`
  const passengerName = passenger ? `${passenger.firstName} ${passenger.lastName}` : "Guest Passenger"
  const passengerPhone = passenger?.phone ?? "N/A"

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div className={cn("flex items-center justify-between rounded-xl border-2 p-4", statusConfig.bg)}>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              [BookingStatus.TripCompleted, BookingStatus.NoShow, BookingStatus.CancelledByDriver].includes(trip.bookingStatus)
                ? "bg-gray-200"
                : "animate-pulse bg-green-500"
            )}
          >
            {trip.bookingStatus === BookingStatus.TripCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : [BookingStatus.NoShow, BookingStatus.CancelledByDriver].includes(trip.bookingStatus) ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : (
              <div className="h-3 w-3 rounded-full bg-white" />
            )}
          </div>
          <div>
            <p className={cn("text-sm font-bold", statusConfig.color)}>{statusConfig.label}</p>
            <p className="text-xs text-[#6B7280]">{trip.bookingNumber}</p>
          </div>
        </div>
        <Badge variant="outline" className="border-[#D9E0E8] text-xs font-medium text-[#6B7280]">
          <Clock className="mr-1 h-3 w-3" />
          Est. {trip.estimatedDuration} min
        </Badge>
      </div>

      {/* Map */}
      <div className="overflow-hidden rounded-2xl ring-1 ring-[#E5E7EB]">
        <MapView
          pickup={{ lat: trip.pickup.latitude, lng: trip.pickup.longitude }}
          destination={{ lat: trip.destination.latitude, lng: trip.destination.longitude }}
          height="350px"
        />
      </div>

      {/* Trip Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-5 ring-1 ring-[#E5E7EB]">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4145A]">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Pickup</span>
          </div>
          <p className="text-base font-bold text-[#172F52]">{trip.pickup.formattedAddress}</p>
        </div>

        <div className="rounded-xl bg-white p-5 ring-1 ring-[#E5E7EB]">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Destination</span>
          </div>
          <p className="text-base font-bold text-[#172F52]">{trip.destination.formattedAddress}</p>
        </div>
      </div>

      {/* Trip Details */}
      <div className="rounded-xl bg-white p-5 ring-1 ring-[#E5E7EB]">
        <h3 className="mb-4 text-base font-bold text-[#172F52]">Trip Details</h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#172F52]/10">
              <Users className="h-4 w-4 text-[#172F52]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Passenger</p>
              <p className="text-sm font-semibold text-[#172F52]">{passengerName}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#172F52]/10">
              <Phone className="h-4 w-4 text-[#172F52]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Phone</p>
              <p className="text-sm font-semibold text-[#172F52]">{passengerPhone}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#172F52]/10">
              <Users className="h-4 w-4 text-[#172F52]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Passengers</p>
              <p className="text-sm font-semibold text-[#172F52]">{trip.passengers}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#172F52]/10">
              <Luggage className="h-4 w-4 text-[#172F52]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Luggage</p>
              <p className="text-sm font-semibold text-[#172F52]">
                {trip.luggage} bag{trip.luggage !== 1 && "s"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#172F52]/10">
              <Ruler className="h-4 w-4 text-[#172F52]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Distance</p>
              <p className="text-sm font-semibold text-[#172F52]">{trip.distanceMiles} miles</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#172F52]/10">
              <Clock className="h-4 w-4 text-[#172F52]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Est. Time</p>
              <p className="text-sm font-semibold text-[#172F52]">{trip.estimatedDuration} min</p>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#6B7280]" />
          <div>
            <p className="text-xs text-[#6B7280]">Special Requirements</p>
            <p className="text-sm font-medium text-[#172F52]">
              {trip.specialRequirements?.notes || "None"}
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6B7280]">Fare</p>
            <p className="text-xl font-bold text-[#172F52]">£{trip.total.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="rounded-xl bg-white p-5 ring-1 ring-[#E5E7EB]">
        <h3 className="mb-4 text-base font-bold text-[#172F52]">Actions</h3>

        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="mb-4 block">
          <Button variant="outline" className="w-full border-2 border-[#172F52] text-[#172F52] hover:bg-[#172F52] hover:text-white">
            <Navigation className="mr-2 h-4 w-4" />
            Open Navigation
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </Button>
        </a>

        {passengerPhone !== "N/A" && (
          <a href={`tel:${passengerPhone}`} className="mb-4 block">
            <Button variant="outline" className="w-full border-[#D9E0E8]">
              <Phone className="mr-2 h-4 w-4" />
              Call Passenger
            </Button>
          </a>
        )}

        <Separator className="my-4" />

        <div className="flex flex-col gap-3 sm:flex-row">
          {nextActions.map((action) => (
            <Button
              key={action.status}
              onClick={() => handleStatusChange(action.status, action.label)}
              className={cn("flex-1 py-6 text-base font-semibold", action.color)}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={pendingAction?.label ?? ""}
        description={`Are you sure you want to change the trip status to "${pendingAction?.label}"? This action cannot be undone.`}
        confirmText={pendingAction?.label ?? "Confirm"}
        onConfirm={confirmStatusChange}
        variant={
          pendingAction?.status === BookingStatus.CancelledByDriver || pendingAction?.status === BookingStatus.NoShow
            ? "destructive"
            : "default"
        }
      />
    </div>
  )
}
