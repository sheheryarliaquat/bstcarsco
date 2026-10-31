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
        <Loader2 className="h-8 w-8 animate-spin text-[#1F4FD8]" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="space-y-4">
        <Link
          href="/passenger/bookings"
          className="inline-flex items-center gap-1.5 text-sm text-[#5B6577] hover:text-[#0F1B2D]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Bookings
        </Link>
        <div className="rounded-xl border border-[#E2E6EC] bg-white p-12 text-center">
          <p className="text-sm text-[#5B6577]">Booking not found.</p>
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
        className="inline-flex items-center gap-1.5 text-sm text-[#5B6577] hover:text-[#0F1B2D]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Bookings
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-[#0F1B2D]">
          {booking.bookingNumber}
        </h1>
        <StatusBadge status={booking.bookingStatus} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Timeline */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-[#E2E6EC] bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#5B6577]">
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
                      <CircleDot className="h-5 w-5 shrink-0 text-[#E2E6EC]" />
                    )}
                    {i < timelineSteps.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 ${
                          step.status === "completed"
                            ? "bg-[#28A745]"
                            : "bg-[#E2E6EC]"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-6">
                    <p
                      className={`text-sm font-medium ${
                        step.status === "completed"
                          ? "text-[#0F1B2D]"
                          : step.status === "cancelled"
                            ? "text-[#DC3545]"
                            : "text-[#ADB5BD]"
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.time && (
                      <p className="text-xs text-[#5B6577]">
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
          <div className="rounded-xl border border-[#E2E6EC] bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#1F4FD8]" />
              <h3 className="text-sm font-semibold text-[#0F1B2D]">
                Route Information
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[#5B6577]">Pickup</p>
                <p className="text-sm font-medium text-[#0F1B2D]">
                  {booking.pickup.formattedAddress}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#5B6577]">Destination</p>
                <p className="text-sm font-medium text-[#0F1B2D]">
                  {booking.destination.formattedAddress}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#5B6577]">Date & Time</p>
                <p className="text-sm font-medium text-[#0F1B2D]">
                  {booking.date} at {booking.pickupTime}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#5B6577]">Distance</p>
                <p className="text-sm font-medium text-[#0F1B2D]">
                  {booking.distanceMiles} miles (~
                  {booking.estimatedDuration} min)
                </p>
              </div>
              <div>
                <p className="text-xs text-[#5B6577]">Passengers</p>
                <p className="text-sm font-medium text-[#0F1B2D]">
                  {booking.passengers}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#5B6577]">Luggage</p>
                <p className="text-sm font-medium text-[#0F1B2D]">
                  {booking.luggage} bags
                </p>
              </div>
            </div>
          </div>

          {/* Vehicle info */}
          <div className="rounded-xl border border-[#E2E6EC] bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Car className="h-4 w-4 text-[#0F1B2D]" />
              <h3 className="text-sm font-semibold text-[#0F1B2D]">
                Vehicle Information
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[#5B6577]">Vehicle Type</p>
                <p className="text-sm font-medium capitalize text-[#0F1B2D]">
                  {booking.vehicleType.replace(/_/g, " ")}
                </p>
              </div>
              {vehicle && (
                <>
                  <div>
                    <p className="text-xs text-[#5B6577]">Vehicle</p>
                    <p className="text-sm font-medium text-[#0F1B2D]">
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#5B6577]">Registration</p>
                    <p className="text-sm font-medium text-[#0F1B2D]">
                      {vehicle.registration}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#5B6577]">Colour</p>
                    <p className="text-sm font-medium text-[#0F1B2D]">
                      {vehicle.colour}
                    </p>
                  </div>
                </>
              )}
              {operator && (
                <div>
                  <p className="text-xs text-[#5B6577]">Operator</p>
                  <p className="text-sm font-medium text-[#0F1B2D]">
                    {operator.companyName}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Driver info */}
          {driver && (
            <div className="rounded-xl border border-[#E2E6EC] bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-[#0F1B2D]" />
                <h3 className="text-sm font-semibold text-[#0F1B2D]">
                  Driver Information
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-[#5B6577]">Name</p>
                  <p className="text-sm font-medium text-[#0F1B2D]">
                    {driver.firstName} {driver.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#5B6577]">Rating</p>
                  <p className="text-sm font-medium text-[#0F1B2D]">
                    ★ {driver.rating} ({driver.totalReviews} reviews)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#5B6577]">Phone</p>
                  <p className="text-sm font-medium text-[#0F1B2D]">
                    {driver.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#5B6577]">Licence</p>
                  <p className="text-sm font-medium text-[#0F1B2D]">
                    {driver.licenceNumber}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment info */}
          <div className="rounded-xl border border-[#E2E6EC] bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#0F1B2D]" />
              <h3 className="text-sm font-semibold text-[#0F1B2D]">
                Payment Information
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#5B6577]">Base Fare</span>
                <span className="text-[#0F1B2D]">
                  £{booking.price.toFixed(2)}
                </span>
              </div>
              {booking.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#5B6577]">Discount</span>
                  <span className="text-[#28A745]">
                    -£{booking.discount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[#5B6577]">Tax (VAT)</span>
                <span className="text-[#0F1B2D]">
                  £{booking.tax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#F4F6F9] pt-2 text-sm font-bold">
                <span className="text-[#0F1B2D]">Total</span>
                <span className="text-[#0F1B2D]">
                  £{booking.total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#5B6577]">Payment Status</span>
                <StatusBadge status={booking.paymentStatus} type="payment" />
              </div>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="rounded-xl border border-[#E2E6EC] bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Navigation className="h-4 w-4 text-[#0F1B2D]" />
              <h3 className="text-sm font-semibold text-[#0F1B2D]">
                Route Map
              </h3>
            </div>
            <div className="flex h-48 items-center justify-center rounded-lg bg-[#F4F6F9]">
              <div className="text-center">
                <MapPin className="mx-auto mb-2 h-8 w-8 text-[#E2E6EC]" />
                <p className="text-xs text-[#5B6577]">
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
              <Button variant="outline" className="border-[#E2E6EC]">
                <Phone className="h-4 w-4" /> Contact Driver
              </Button>
            )}
            <Link href="/passenger/support">
              <Button variant="outline" className="border-[#E2E6EC]">
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
