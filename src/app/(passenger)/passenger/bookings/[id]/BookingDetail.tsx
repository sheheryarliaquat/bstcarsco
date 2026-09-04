"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  MapPin,
  Car,
  User,
  CreditCard,
  Clock,
  Phone,
  Headphones,
  XCircle,
  CheckCircle2,
  Navigation,
  CircleDot,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { BookingStatus, type Booking, type Driver, type Operator, type Vehicle } from "@/types"
import { getBookingByNumber, updateBookingStatus } from "@/lib/services/booking-service"
import { getVehicle } from "@/lib/services/vehicle-service"
import { getDriver } from "@/lib/services/driver-service"
import { getDocument } from "@/lib/firebase/firestore"

type BookingRow = Booking & { id: string }

export default function BookingDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<BookingRow | null>(null)
  const [driver, setDriver] = useState<Driver | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [operator, setOperator] = useState<Operator | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getBookingByNumber(id)
      .then(async (found) => {
        if (cancelled) return
        setBooking(found as BookingRow | null)
        if (!found) return
        const [d, v, o] = await Promise.all([
          found.driverId ? getDriver(found.driverId).catch(() => null) : null,
          found.vehicleId ? getVehicle(found.vehicleId).catch(() => null) : null,
          found.operatorId ? getDocument<Operator>("users", found.operatorId).catch(() => null) : null,
        ])
        if (cancelled) return
        setDriver(d)
        setVehicle(v)
        setOperator(o)
      })
      .catch(() => {
        if (!cancelled) setBooking(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  async function handleCancel() {
    if (!booking) return
    await updateBookingStatus(booking.id, BookingStatus.CancelledByPassenger)
    setBooking({ ...booking, bookingStatus: BookingStatus.CancelledByPassenger })
    setCancelOpen(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4145A]" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="space-y-4">
        <Link
          href="/passenger/bookings"
          className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#172F52]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Bookings
        </Link>
        <div className="rounded-xl border border-[#D9E0E8] bg-white p-12 text-center">
          <p className="text-sm text-[#6B7280]">Booking not found.</p>
        </div>
      </div>
    )
  }

  const timelineSteps = [
    {
      label: "Booking Created",
      status: "completed",
      time: booking.createdAt,
    },
    {
      label: "Payment Confirmed",
      status:
        booking.paymentStatus === "completed" ? "completed" : "pending",
      time: booking.updatedAt,
    },
    {
      label: "Driver Assigned",
      status: driver ? "completed" : "pending",
      time: driver ? booking.updatedAt : undefined,
    },
    {
      label: "Driver En Route",
      status: [
        BookingStatus.DriverEnRoute,
        BookingStatus.DriverArrived,
        BookingStatus.PassengerOnboard,
        BookingStatus.TripStarted,
        BookingStatus.TripCompleted,
      ].includes(booking.bookingStatus)
        ? "completed"
        : "pending",
    },
    {
      label: "Trip Completed",
      status:
        booking.bookingStatus === BookingStatus.TripCompleted
          ? "completed"
          : "pending",
      time:
        booking.bookingStatus === BookingStatus.TripCompleted
          ? booking.updatedAt
          : undefined,
    },
  ]

  const isCancelled = [
    BookingStatus.CancelledByPassenger,
    BookingStatus.CancelledByDriver,
    BookingStatus.CancelledByOperator,
    BookingStatus.CancelledByAdmin,
  ].includes(booking.bookingStatus)

  if (isCancelled) {
    timelineSteps[1] = {
      ...timelineSteps[1],
      status: "cancelled",
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/passenger/bookings"
        className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#172F52]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Bookings
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-[#172F52]">
          {booking.bookingNumber}
        </h1>
        <StatusBadge status={booking.bookingStatus} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Timeline */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-[#D9E0E8] bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#6B7280]">
              Booking Timeline
            </h2>
            <div className="space-y-0">
              {timelineSteps.map((step, i) => (
                <div key={step.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {step.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-[#28A745]" />
                    ) : step.status === "cancelled" ? (
                      <XCircle className="h-5 w-5 shrink-0 text-[#DC3545]" />
                    ) : (
                      <CircleDot className="h-5 w-5 shrink-0 text-[#D9E0E8]" />
                    )}
                    {i < timelineSteps.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 ${
                          step.status === "completed"
                            ? "bg-[#28A745]"
                            : "bg-[#D9E0E8]"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-6">
                    <p
                      className={`text-sm font-medium ${
                        step.status === "completed"
                          ? "text-[#172F52]"
                          : step.status === "cancelled"
                            ? "text-[#DC3545]"
                            : "text-[#ADB5BD]"
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.time && (
                      <p className="text-xs text-[#6B7280]">
                        {new Date(step.time).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Route info */}
          <div className="rounded-xl border border-[#D9E0E8] bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#D4145A]" />
              <h3 className="text-sm font-semibold text-[#172F52]">
                Route Information
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[#6B7280]">Pickup</p>
                <p className="text-sm font-medium text-[#172F52]">
                  {booking.pickup.formattedAddress}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6B7280]">Destination</p>
                <p className="text-sm font-medium text-[#172F52]">
                  {booking.destination.formattedAddress}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6B7280]">Date & Time</p>
                <p className="text-sm font-medium text-[#172F52]">
                  {booking.date} at {booking.pickupTime}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6B7280]">Distance</p>
                <p className="text-sm font-medium text-[#172F52]">
                  {booking.distanceMiles} miles (~
                  {booking.estimatedDuration} min)
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6B7280]">Passengers</p>
                <p className="text-sm font-medium text-[#172F52]">
                  {booking.passengers}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6B7280]">Luggage</p>
                <p className="text-sm font-medium text-[#172F52]">
                  {booking.luggage} bags
                </p>
              </div>
            </div>
          </div>

          {/* Vehicle info */}
          <div className="rounded-xl border border-[#D9E0E8] bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Car className="h-4 w-4 text-[#172F52]" />
              <h3 className="text-sm font-semibold text-[#172F52]">
                Vehicle Information
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[#6B7280]">Vehicle Type</p>
                <p className="text-sm font-medium capitalize text-[#172F52]">
                  {booking.vehicleType.replace(/_/g, " ")}
                </p>
              </div>
              {vehicle && (
                <>
                  <div>
                    <p className="text-xs text-[#6B7280]">Vehicle</p>
                    <p className="text-sm font-medium text-[#172F52]">
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Registration</p>
                    <p className="text-sm font-medium text-[#172F52]">
                      {vehicle.registration}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Colour</p>
                    <p className="text-sm font-medium text-[#172F52]">
                      {vehicle.colour}
                    </p>
                  </div>
                </>
              )}
              {operator && (
                <div>
                  <p className="text-xs text-[#6B7280]">Operator</p>
                  <p className="text-sm font-medium text-[#172F52]">
                    {operator.companyName}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Driver info */}
          {driver && (
            <div className="rounded-xl border border-[#D9E0E8] bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-[#172F52]" />
                <h3 className="text-sm font-semibold text-[#172F52]">
                  Driver Information
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-[#6B7280]">Name</p>
                  <p className="text-sm font-medium text-[#172F52]">
                    {driver.firstName} {driver.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Rating</p>
                  <p className="text-sm font-medium text-[#172F52]">
                    ★ {driver.rating} ({driver.totalReviews} reviews)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Phone</p>
                  <p className="text-sm font-medium text-[#172F52]">
                    {driver.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Licence</p>
                  <p className="text-sm font-medium text-[#172F52]">
                    {driver.licenceNumber}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment info */}
          <div className="rounded-xl border border-[#D9E0E8] bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#172F52]" />
              <h3 className="text-sm font-semibold text-[#172F52]">
                Payment Information
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">Base Fare</span>
                <span className="text-[#172F52]">
                  £{booking.price.toFixed(2)}
                </span>
              </div>
              {booking.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Discount</span>
                  <span className="text-[#28A745]">
                    -£{booking.discount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">Tax (VAT)</span>
                <span className="text-[#172F52]">
                  £{booking.tax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#F5F7FA] pt-2 text-sm font-bold">
                <span className="text-[#172F52]">Total</span>
                <span className="text-[#172F52]">
                  £{booking.total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">Payment Status</span>
                <StatusBadge status={booking.paymentStatus} type="payment" />
              </div>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="rounded-xl border border-[#D9E0E8] bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Navigation className="h-4 w-4 text-[#172F52]" />
              <h3 className="text-sm font-semibold text-[#172F52]">
                Route Map
              </h3>
            </div>
            <div className="flex h-48 items-center justify-center rounded-lg bg-[#F5F7FA]">
              <div className="text-center">
                <MapPin className="mx-auto mb-2 h-8 w-8 text-[#D9E0E8]" />
                <p className="text-xs text-[#6B7280]">
                  Map view —{" "}
                  {booking.pickup.formattedAddress.split(",")[0]} →{" "}
                  {booking.destination.formattedAddress.split(",")[0]}
                </p>
                <p className="mt-1 text-[10px] text-[#ADB5BD]">
                  {booking.pickup.latitude}, {booking.pickup.longitude} →{" "}
                  {booking.destination.latitude},{" "}
                  {booking.destination.longitude}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {!isCancelled &&
              booking.bookingStatus !== BookingStatus.TripCompleted && (
                <Button
                  variant="destructive"
                  onClick={() => setCancelOpen(true)}
                >
                  <XCircle className="h-4 w-4" /> Cancel Booking
                </Button>
              )}
            {driver && (
              <Button variant="outline" className="border-[#D9E0E8]">
                <Phone className="h-4 w-4" /> Contact Driver
              </Button>
            )}
            <Link href="/passenger/support">
              <Button variant="outline" className="border-[#D9E0E8]">
                <Headphones className="h-4 w-4" /> Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel Booking"
        description="Are you sure you want to cancel this booking? A cancellation fee may apply."
        confirmText="Yes, Cancel"
        onConfirm={handleCancel}
        variant="destructive"
      />
    </div>
  )
}
