"use client"

import { useState } from "react"
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
  MessageSquare,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { MapView } from "@/components/shared/MapView"
import { BookingStatus } from "@/types"

type TripStatus =
  | "assigned"
  | "accepted"
  | "en_route"
  | "arrived"
  | "on_board"
  | "trip_started"
  | "completed"
  | "no_show"
  | "cancelled"

const STATUS_CONFIG: Record<
  TripStatus,
  { label: string; color: string; bg: string }
> = {
  assigned: { label: "New Trip Assigned", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  accepted: { label: "Trip Accepted", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  en_route: { label: "En Route to Pickup", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  arrived: { label: "Arrived at Pickup", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  on_board: { label: "Passenger On Board", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  trip_started: { label: "Trip In Progress", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  completed: { label: "Trip Completed", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  no_show: { label: "Passenger No Show", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  cancelled: { label: "Trip Cancelled", color: "text-red-700", bg: "bg-red-50 border-red-200" },
}

const DEMO_TRIP = {
  id: "UKTB-2026-000002",
  pickup: {
    address: "1 Manchester Square, London W1U 3PH",
    lat: 51.5141,
    lng: -0.1535,
  },
  destination: {
    address: "10 Downing Street, Westminster, London SW1A 2AA",
    lat: 51.5034,
    lng: -0.1276,
  },
  passenger: {
    name: "Emma Thompson",
    phone: "+447700900200",
  },
  passengers: 2,
  luggage: 1,
  specialRequirements: "None",
  estimatedTime: "15 min",
  estimatedDistance: "2.3 miles",
  fare: "£11.52",
}

export default function ActiveTripPage() {
  const [status, setStatus] = useState<TripStatus>("en_route")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    status: TripStatus
    label: string
  } | null>(null)

  const statusConfig = STATUS_CONFIG[status]

  function handleStatusChange(newStatus: TripStatus, label: string) {
    setPendingAction({ status: newStatus, label })
    setConfirmOpen(true)
  }

  function confirmStatusChange() {
    if (pendingAction) {
      setStatus(pendingAction.status)
      setPendingAction(null)
    }
    setConfirmOpen(false)
  }

  function getNextActions(): {
    label: string
    status: TripStatus
    color: string
    icon: React.ReactNode
  }[] {
    switch (status) {
      case "assigned":
        return [
          {
            label: "Accept Trip",
            status: "accepted",
            color: "bg-green-600 text-white hover:bg-green-700",
            icon: <CheckCircle2 className="h-4 w-4" />,
          },
          {
            label: "Decline",
            status: "cancelled",
            color: "border-2 border-red-200 text-red-600 hover:bg-red-50",
            icon: <XCircle className="h-4 w-4" />,
          },
        ]
      case "accepted":
        return [
          {
            label: "On The Way",
            status: "en_route",
            color: "bg-blue-600 text-white hover:bg-blue-700",
            icon: <Navigation className="h-4 w-4" />,
          },
        ]
      case "en_route":
        return [
          {
            label: "I Have Arrived",
            status: "arrived",
            color: "bg-amber-500 text-white hover:bg-amber-600",
            icon: <MapPin className="h-4 w-4" />,
          },
        ]
      case "arrived":
        return [
          {
            label: "Passenger On Board",
            status: "on_board",
            color: "bg-purple-600 text-white hover:bg-purple-700",
            icon: <Users className="h-4 w-4" />,
          },
          {
            label: "Passenger No Show",
            status: "no_show",
            color: "border-2 border-red-200 text-red-600 hover:bg-red-50",
            icon: <AlertTriangle className="h-4 w-4" />,
          },
        ]
      case "on_board":
        return [
          {
            label: "Start Trip",
            status: "trip_started",
            color: "bg-blue-600 text-white hover:bg-blue-700",
            icon: <Navigation className="h-4 w-4" />,
          },
        ]
      case "trip_started":
        return [
          {
            label: "Complete Trip",
            status: "completed",
            color: "bg-green-600 text-white hover:bg-green-700",
            icon: <CheckCircle2 className="h-4 w-4" />,
          },
        ]
      default:
        return []
    }
  }

  const nextActions = getNextActions()
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${DEMO_TRIP.pickup.lat},${DEMO_TRIP.pickup.lng}&destination=${DEMO_TRIP.destination.lat},${DEMO_TRIP.destination.lng}&travelmode=driving`

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div
        className={cn(
          "flex items-center justify-between rounded-xl border-2 p-4",
          statusConfig.bg
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              status === "completed" || status === "no_show" || status === "cancelled"
                ? "bg-gray-200"
                : "animate-pulse bg-green-500"
            )}
          >
            {status === "completed" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : status === "no_show" || status === "cancelled" ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : (
              <div className="h-3 w-3 rounded-full bg-white" />
            )}
          </div>
          <div>
            <p className={cn("text-sm font-bold", statusConfig.color)}>
              {statusConfig.label}
            </p>
            <p className="text-xs text-[#6B7280]">{DEMO_TRIP.id}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="border-[#D9E0E8] text-xs font-medium text-[#6B7280]"
        >
          <Clock className="mr-1 h-3 w-3" />
          Est. {DEMO_TRIP.estimatedTime}
        </Badge>
      </div>

      {/* Map */}
      <div className="overflow-hidden rounded-2xl ring-1 ring-[#E5E7EB]">
        <MapView
          pickup={{ lat: DEMO_TRIP.pickup.lat, lng: DEMO_TRIP.pickup.lng }}
          destination={{ lat: DEMO_TRIP.destination.lat, lng: DEMO_TRIP.destination.lng }}
          height="350px"
        />
      </div>

      {/* Trip Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pickup */}
        <div className="rounded-xl bg-white p-5 ring-1 ring-[#E5E7EB]">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4145A]">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Pickup
            </span>
          </div>
          <p className="text-base font-bold text-[#172F52]">
            {DEMO_TRIP.pickup.address}
          </p>
        </div>

        {/* Destination */}
        <div className="rounded-xl bg-white p-5 ring-1 ring-[#E5E7EB]">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Destination
            </span>
          </div>
          <p className="text-base font-bold text-[#172F52]">
            {DEMO_TRIP.destination.address}
          </p>
        </div>
      </div>

      {/* Trip Details */}
      <div className="rounded-xl bg-white p-5 ring-1 ring-[#E5E7EB]">
        <h3 className="mb-4 text-base font-bold text-[#172F52]">Trip Details</h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Passenger */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#172F52]/10">
              <Users className="h-4 w-4 text-[#172F52]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Passenger</p>
              <p className="text-sm font-semibold text-[#172F52]">
                {DEMO_TRIP.passenger.name}
              </p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#172F52]/10">
              <Phone className="h-4 w-4 text-[#172F52]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Phone</p>
              <p className="text-sm font-semibold text-[#172F52]">
                {DEMO_TRIP.passenger.phone}
              </p>
            </div>
          </div>

          {/* Passengers */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#172F52]/10">
              <Users className="h-4 w-4 text-[#172F52]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Passengers</p>
              <p className="text-sm font-semibold text-[#172F52]">
                {DEMO_TRIP.passengers}
              </p>
            </div>
          </div>

          {/* Luggage */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#172F52]/10">
              <Luggage className="h-4 w-4 text-[#172F52]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Luggage</p>
              <p className="text-sm font-semibold text-[#172F52]">
                {DEMO_TRIP.luggage} bag{DEMO_TRIP.luggage !== 1 && "s"}
              </p>
            </div>
          </div>

          {/* Distance */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#172F52]/10">
              <Ruler className="h-4 w-4 text-[#172F52]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Distance</p>
              <p className="text-sm font-semibold text-[#172F52]">
                {DEMO_TRIP.estimatedDistance}
              </p>
            </div>
          </div>

          {/* ETA */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#172F52]/10">
              <Clock className="h-4 w-4 text-[#172F52]" />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Est. Time</p>
              <p className="text-sm font-semibold text-[#172F52]">
                {DEMO_TRIP.estimatedTime}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#6B7280]" />
          <div>
            <p className="text-xs text-[#6B7280]">Special Requirements</p>
            <p className="text-sm font-medium text-[#172F52]">
              {DEMO_TRIP.specialRequirements}
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6B7280]">Estimated Fare</p>
            <p className="text-xl font-bold text-[#172F52]">{DEMO_TRIP.fare}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="rounded-xl bg-white p-5 ring-1 ring-[#E5E7EB]">
        <h3 className="mb-4 text-base font-bold text-[#172F52]">Actions</h3>

        {/* Navigation */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 block"
        >
          <Button
            variant="outline"
            className="w-full border-2 border-[#172F52] text-[#172F52] hover:bg-[#172F52] hover:text-white"
          >
            <Navigation className="mr-2 h-4 w-4" />
            Open Navigation
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </Button>
        </a>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <a href={`tel:${DEMO_TRIP.passenger.phone}`}>
            <Button
              variant="outline"
              className="w-full border-[#D9E0E8]"
            >
              <Phone className="mr-2 h-4 w-4" />
              Call Passenger
            </Button>
          </a>
          <Button
            variant="outline"
            className="w-full border-[#D9E0E8]"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Message
          </Button>
        </div>

        <Separator className="my-4" />

        {/* Status Action Buttons */}
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={pendingAction?.label ?? ""}
        description={`Are you sure you want to change the trip status to "${pendingAction?.label}"? This action cannot be undone.`}
        confirmText={pendingAction?.label ?? "Confirm"}
        onConfirm={confirmStatusChange}
        variant={
          pendingAction?.status === "cancelled" || pendingAction?.status === "no_show"
            ? "destructive"
            : "default"
        }
      />
    </div>
  )
}
