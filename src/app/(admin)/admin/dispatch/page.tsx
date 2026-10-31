"use client"

import { useState, useEffect, useMemo } from "react"
import {
  MapPin,
  Users,
  Clock,
  Car,
  RefreshCw,
  ArrowRight,
  Navigation,
  Star,
  Phone,
  Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/shared/Modal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { RatingStars } from "@/components/shared/RatingStars"
import { DispatchBoard, type BoardBooking } from "@/components/admin/DispatchBoard"
import { listenToAllBookings, updateBooking } from "@/lib/services/booking-service"
import { listenToDrivers, updateDriver } from "@/lib/services/driver-service"
import { getVehicle } from "@/lib/services/vehicle-service"
import { getDocument } from "@/lib/firebase/firestore"
import type { Booking, Driver, Operator, VehicleType } from "@/types"
import { BookingStatus } from "@/types"

type BookingRow = Booking & { id: string }

const VEHICLE_LABELS: Record<VehicleType, string> = {
  saloon: "Saloon",
  executive: "Executive",
  estate: "Estate",
  mpv: "MPV",
  minibus: "Minibus",
  electric: "Electric",
  wheelchair_accessible: "Wheelchair Accessible",
}

export default function AdminDispatchPage() {
  const [allBookings, setAllBookings] = useState<BookingRow[]>([])
  const [allDrivers, setAllDrivers] = useState<Driver[]>([])
  const [assignModal, setAssignModal] = useState<BookingRow | null>(null)
  const [confirmAssign, setConfirmAssign] = useState<{ booking: BookingRow; driver: Driver } | null>(null)
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null)
  const [sortByDistance, setSortByDistance] = useState(true)
  const [operatorNames, setOperatorNames] = useState<Record<string, string>>({})
  const [vehicleInfoMap, setVehicleInfoMap] = useState<Record<string, string>>({})
  const [view, setView] = useState<"board" | "map">("board")

  useEffect(() => {
    const unsubscribe = listenToAllBookings(
      (data) => setAllBookings(data as BookingRow[]),
      () => setAllBookings([])
    )
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const unsubscribe = listenToDrivers(
      (data) => setAllDrivers(data),
      () => setAllDrivers([])
    )
    return () => unsubscribe()
  }, [])

  // Awaiting a driver: submitted but nobody's been assigned yet, and it
  // isn't already cancelled.
  const queue = useMemo(
    () =>
      allBookings.filter(
        (b) =>
          !b.driverId &&
          b.bookingStatus !== BookingStatus.CancelledByPassenger &&
          b.bookingStatus !== BookingStatus.CancelledByDriver &&
          b.bookingStatus !== BookingStatus.CancelledByOperator &&
          b.bookingStatus !== BookingStatus.CancelledByAdmin &&
          b.bookingStatus !== BookingStatus.TripCompleted
      ),
    [allBookings]
  )
  const drivers = useMemo(() => allDrivers.filter((d) => d.status === "online"), [allDrivers])

  useEffect(() => {
    const operatorIds = [...new Set(queue.map((b) => b.operatorId).filter(Boolean))]
    Promise.all(operatorIds.map((id) => getDocument<Operator>("users", id).catch(() => null))).then(
      (results) => {
        const map: Record<string, string> = {}
        results.forEach((o, i) => {
          map[operatorIds[i]] = o?.companyName ?? "Unknown"
        })
        setOperatorNames(map)
      }
    )
  }, [queue])

  useEffect(() => {
    const vehicleIds = [
      ...new Set([...allDrivers.map((d) => d.vehicleId), ...allBookings.map((b) => b.vehicleId)].filter(Boolean)),
    ]
    Promise.all(vehicleIds.map((id) => getVehicle(id).catch(() => null))).then((results) => {
      const map: Record<string, string> = {}
      results.forEach((v, i) => {
        map[vehicleIds[i]] = v ? `${v.registration} ${v.make} ${v.model}` : "Unknown"
      })
      setVehicleInfoMap(map)
    })
  }, [allDrivers, allBookings])

  const sortedDrivers = sortByDistance
    ? [...drivers].sort((a, b) => {
        if (!assignModal) return 0
        const distA = Math.abs(a.lastLocation.latitude - assignModal.pickup.latitude) + Math.abs(a.lastLocation.longitude - assignModal.pickup.longitude)
        const distB = Math.abs(b.lastLocation.latitude - assignModal.pickup.latitude) + Math.abs(b.lastLocation.longitude - assignModal.pickup.longitude)
        return distA - distB
      })
    : drivers

  function handleAssign() {
    if (!assignModal || !selectedDriverId) return
    const driver = drivers.find((d) => d.uid === selectedDriverId)
    if (!driver) return
    setConfirmAssign({ booking: assignModal, driver })
  }

  async function confirmAssignment() {
    if (!confirmAssign) return
    await Promise.all([
      updateBooking(confirmAssign.booking.id, {
        driverId: confirmAssign.driver.uid,
        bookingStatus: BookingStatus.DriverAssigned,
      }),
      updateDriver(confirmAssign.driver.uid, { status: "busy" }),
    ])
    setAssignModal(null)
    setConfirmAssign(null)
    setSelectedDriverId(null)
  }

  async function boardAssign(booking: BoardBooking, driver: Driver) {
    await Promise.all([
      updateBooking(booking.id, {
        driverId: driver.uid,
        vehicleId: driver.vehicleId || booking.vehicleId || "",
        bookingStatus: BookingStatus.DriverAssigned,
      }),
      updateDriver(driver.uid, { status: "busy" }),
    ])
  }

  async function boardSetStatus(booking: BoardBooking, status: BookingStatus) {
    await updateBooking(booking.id, { bookingStatus: status })
    // A finished trip frees the driver for the next job.
    if (status === BookingStatus.TripCompleted && booking.driverId) {
      await updateDriver(booking.driverId, { status: "online" })
    }
  }

  async function boardUnassign(booking: BoardBooking) {
    const previous = booking.driverId
    await updateBooking(booking.id, { driverId: "", bookingStatus: BookingStatus.Confirmed })
    if (previous) await updateDriver(previous, { status: "online" })
  }

  function getOperatorName(operatorId: string) {
    if (!operatorId) return "Unassigned"
    return operatorNames[operatorId] ?? "Loading..."
  }

  function getDistanceEstimate(driver: Driver, booking: Booking) {
    const dist = Math.abs(driver.lastLocation.latitude - booking.pickup.latitude) + Math.abs(driver.lastLocation.longitude - booking.pickup.longitude)
    const miles = (dist * 69).toFixed(1)
    return `${miles} mi`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Dispatch</h1>
          <p className="text-sm text-[#5B6577]">
            Assign a driver and car to each booking and track it to completion
          </p>
        </div>
        <div className="ml-auto mr-2 flex gap-1 rounded-lg bg-[#EEF1F5] p-1" role="tablist" aria-label="Dispatch view">
          {(["board", "map"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
                view === v ? "bg-white text-[#0F1B2D] shadow-sm" : "text-[#5B6577]"
              )}
            >
              {v === "board" ? "Board" : "Map & queue"}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-[#E2E6EC]"
          onClick={() => {
            setAssignModal(null)
            setSelectedDriverId(null)
          }}
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {view === "board" && (
        <DispatchBoard
          bookings={allBookings}
          drivers={allDrivers}
          vehicleInfo={vehicleInfoMap}
          onAssign={boardAssign}
          onSetStatus={boardSetStatus}
          onUnassign={boardUnassign}
        />
      )}

      {view === "map" && (
      <div className="grid h-[calc(100vh-220px)] gap-4 lg:grid-cols-[1fr_2fr_1fr]">
        {/* LEFT: Booking Queue */}
        <div className="flex flex-col rounded-xl border border-[#E2E6EC] bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#E2E6EC] px-4 py-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#1F4FD8]" />
              <h3 className="text-sm font-bold text-[#0F1B2D]">Booking Queue</h3>
            </div>
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1F4FD8] px-1.5 text-[10px] font-bold text-white">
              {queue.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Car className="mb-2 h-8 w-8 text-[#E2E6EC]" />
                <p className="text-sm font-medium text-[#5B6577]">No pending bookings</p>
                <p className="text-xs text-[#5B6577]">All bookings are assigned</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F4F6F9]">
                {queue.map((booking) => (
                  <div
                    key={booking.bookingNumber}
                    className={cn(
                      "cursor-pointer px-4 py-3 transition-colors hover:bg-[#F4F6F9]/80",
                      assignModal?.bookingNumber === booking.bookingNumber && "bg-[#1F4FD8]/5 border-l-2 border-[#1F4FD8]"
                    )}
                    onClick={() => { setAssignModal(booking); setSelectedDriverId(null) }}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-[#0F1B2D]">
                        {booking.bookingNumber}
                      </span>
                      <span className="rounded-full bg-[#0F1B2D]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0F1B2D]">
                        {booking.passengers} pax
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-[#1F4FD8]" />
                        <p className="truncate text-xs text-[#5B6577]">
                          {booking.pickup.formattedAddress.split(",")[0]}
                        </p>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-green-600" />
                        <p className="truncate text-xs text-[#5B6577]">
                          {booking.destination.formattedAddress.split(",")[0]}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-[10px] text-[#5B6577]">{booking.date} {booking.pickupTime}</span>
                      <span className="rounded bg-[#F4F6F9] px-1.5 py-0.5 text-[10px] font-medium text-[#0F1B2D]">
                        {VEHICLE_LABELS[booking.vehicleType]}
                      </span>
                      <span className="text-[10px] font-semibold text-[#0F1B2D]">£{booking.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CENTER: Map Placeholder */}
        <div className="relative flex flex-col rounded-xl border border-[#E2E6EC] bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#E2E6EC] px-4 py-3">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-[#0F1B2D]" />
              <h3 className="text-sm font-bold text-[#0F1B2D]">Live Map View</h3>
            </div>
            <span className="text-xs text-[#5B6577]">Real-time driver locations</span>
          </div>
          <div className="relative flex-1 bg-gradient-to-br from-[#E8F0FE] via-[#F0F4FF] to-[#E0E8F5]">
            {/* Simulated map with grid and markers */}
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0F1B2D" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Simulated road lines */}
            <div className="absolute left-0 right-0 top-1/3 h-px bg-[#0F1B2D]/20" />
            <div className="absolute left-0 right-0 top-2/3 h-px bg-[#0F1B2D]/20" />
            <div className="absolute top-0 bottom-0 left-1/3 w-px bg-[#0F1B2D]/20" />
            <div className="absolute top-0 bottom-0 left-2/3 w-px bg-[#0F1B2D]/20" />

            {/* Driver markers */}
            {drivers.map((driver, i) => {
              const positions = [
                { top: "25%", left: "30%" },
                { top: "45%", left: "55%" },
                { top: "60%", left: "20%" },
                { top: "35%", left: "70%" },
                { top: "70%", left: "65%" },
              ]
              const pos = positions[i % positions.length]
              return (
                <div
                  key={driver.uid}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ top: pos.top, left: pos.left }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F1B2D] text-xs font-bold text-white shadow-lg ring-2 ring-white">
                    {driver.firstName[0]}
                  </div>
                  <div className="mt-0.5 rounded bg-[#0F1B2D] px-1 py-0.5 text-center text-[8px] font-semibold text-white shadow">
                    {driver.firstName}
                  </div>
                </div>
              )
            })}

            {/* Booking markers */}
            {queue.map((booking, i) => {
              const positions = [
                { top: "30%", left: "45%" },
                { top: "55%", left: "35%" },
                { top: "20%", left: "60%" },
              ]
              const pos = positions[i % positions.length]
              return (
                <div
                  key={booking.bookingNumber}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ top: pos.top, left: pos.left }}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1F4FD8] shadow-lg ring-2 ring-white">
                    <MapPin className="h-3 w-3 text-white" />
                  </div>
                </div>
              )
            })}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 rounded-lg bg-white/90 p-3 shadow-sm backdrop-blur-sm">
              <p className="mb-2 text-[10px] font-semibold uppercase text-[#5B6577]">Legend</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#0F1B2D]" />
                  <span className="text-[10px] text-[#0F1B2D]">Driver</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#1F4FD8]" />
                  <span className="text-[10px] text-[#0F1B2D]">Pickup Point</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Available Drivers */}
        <div className="flex flex-col rounded-xl border border-[#E2E6EC] bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#E2E6EC] px-4 py-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <h3 className="text-sm font-bold text-[#0F1B2D]">Available Drivers</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortByDistance(!sortByDistance)}
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-semibold transition-colors",
                  sortByDistance ? "bg-[#0F1B2D] text-white" : "bg-[#F4F6F9] text-[#5B6577]"
                )}
              >
                By Distance
              </button>
              <span className="text-xs text-[#5B6577]">{drivers.length} online</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {drivers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="mb-2 h-8 w-8 text-[#E2E6EC]" />
                <p className="text-sm font-medium text-[#5B6577]">No available drivers</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F4F6F9]">
                {sortedDrivers.map((driver) => {
                  const isSelected = selectedDriverId === driver.uid
                  return (
                    <div
                      key={driver.uid}
                      className={cn(
                        "px-4 py-3 transition-colors",
                        isSelected && "bg-[#1F4FD8]/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0F1B2D] text-xs font-bold text-white">
                            {driver.firstName[0]}{driver.lastName[0]}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[#0F1B2D]">
                            {driver.firstName} {driver.lastName}
                          </p>
                          <div className="flex items-center gap-2">
                            <RatingStars rating={driver.rating} size="sm" />
                            <span className="text-[10px] text-[#5B6577]">({driver.totalReviews})</span>
                          </div>
                        </div>
                        {assignModal && (
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "text-xs",
                              isSelected
                                ? "bg-[#1F4FD8] text-white hover:bg-[#1F4FD8]/90"
                                : "border-[#E2E6EC]"
                            )}
                            onClick={() => setSelectedDriverId(isSelected ? null : driver.uid)}
                          >
                            {isSelected ? "Selected" : "Select"}
                          </Button>
                        )}
                      </div>
                      {assignModal && (
                        <div className="mt-2 flex items-center gap-3 pl-12">
                          <span className="text-[10px] text-[#5B6577]">
                            {getDistanceEstimate(driver, assignModal)} from pickup
                          </span>
                          <span className="text-[10px] text-[#5B6577]">
                            {driver.vehicleId ? vehicleInfoMap[driver.vehicleId] ?? "Loading..." : "No vehicle"}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Assign Button */}
          {assignModal && selectedDriverId && (
            <div className="border-t border-[#E2E6EC] px-4 py-3">
              <Button
                className="w-full bg-[#1F4FD8] text-white hover:bg-[#1F4FD8]/90"
                onClick={handleAssign}
              >
                <Car className="mr-1.5 h-4 w-4" />
                Assign Driver to {assignModal.bookingNumber}
              </Button>
            </div>
          )}
        </div>
      </div>

      )}

      {/* Assignment Confirmation Modal */}
      <ConfirmDialog
        open={!!confirmAssign}
        onOpenChange={(open) => { if (!open) setConfirmAssign(null) }}
        title="Confirm Driver Assignment"
        description={
          confirmAssign
            ? `Assign ${confirmAssign.driver.firstName} ${confirmAssign.driver.lastName} to booking ${confirmAssign.booking.bookingNumber}?`
            : undefined
        }
        confirmText="Confirm Assignment"
        onConfirm={confirmAssignment}
      />
    </div>
  )
}
