"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Car,
  Building2,
  Users,
  Briefcase,
  CreditCard,
  Mail,
  Headphones,
  ArrowRight,
  Download,
  ExternalLink,
  User,
  Banknote,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookingProgress } from "@/components/booking/BookingProgress";
import { DEMO_DATA } from "@/constants";
import { format } from "date-fns";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const paymentMethod = searchParams.get("payment") || "card";
  const isCash = paymentMethod === "cash";

  const booking = DEMO_DATA.bookings[3];
  const quote = DEMO_DATA.quotes[0];

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <BookingProgress currentStep="confirmed" />

        <div className="mt-8 text-center">
          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-[#168A55]/20" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#168A55]/10">
              <CheckCircle2 className="h-10 w-10 text-[#168A55]" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#172F52]">
            {isCash ? "Booking Submitted!" : "Booking Confirmed!"}
          </h1>
          <p className="mt-2 text-[#6B7280]">
            Your booking reference is{" "}
            <span className="font-mono font-bold text-[#172F52]">
              {booking.bookingNumber}
            </span>
          </p>
          {isCash && (
            <div className="mx-auto mt-4 max-w-md rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-amber-800">
                    Awaiting Approval
                  </p>
                  <p className="mt-1 text-sm text-amber-700">
                    Your cash booking has been submitted and is awaiting admin
                    approval. You will receive a notification once your booking
                    is confirmed and a driver is assigned.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-xl border border-[#D9E0E8] bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#172F52]">
              Booking Details
            </h2>
            <Badge
              className={
                isCash
                  ? "bg-amber-100 text-amber-700"
                  : "bg-[#168A55]/10 text-[#168A55]"
              }
            >
              {isCash ? "Pending Approval" : "Confirmed"}
            </Badge>
          </div>

          <div className="mb-4 space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D4145A]" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[#6B7280]">Pickup</p>
                <p className="text-sm font-medium text-[#172033]">
                  {booking.pickup.formattedAddress}
                </p>
              </div>
            </div>
            <div className="ml-1.5 h-3 border-l-2 border-dashed border-[#D9E0E8]" />
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#168A55]" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[#6B7280]">Destination</p>
                <p className="text-sm font-medium text-[#172033]">
                  {booking.destination.formattedAddress}
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-[#6B7280]">Date & Time</p>
              <div className="mt-1 flex items-center gap-1.5 text-[#172033]">
                <Calendar className="h-3.5 w-3.5 text-[#6B7280]" />
                <span className="font-medium">
                  {format(new Date(booking.date), "dd MMM yyyy")}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[#172033]">
                <Clock className="h-3.5 w-3.5 text-[#6B7280]" />
                <span className="font-medium">{booking.pickupTime}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Vehicle</p>
              <div className="mt-1 flex items-center gap-1.5 text-[#172033]">
                <Car className="h-3.5 w-3.5 text-[#6B7280]" />
                <span className="font-medium">
                  {quote.vehicleDescription}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Operator</p>
              <div className="mt-1 flex items-center gap-1.5 text-[#172033]">
                <Building2 className="h-3.5 w-3.5 text-[#6B7280]" />
                <span className="font-medium">{quote.operatorName}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Driver</p>
              <div className="mt-1 flex items-center gap-1.5 text-[#172033]">
                <User className="h-3.5 w-3.5 text-[#6B7280]" />
                <span className="font-medium text-[#6B7280]">
                  To be assigned
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Passengers</p>
              <div className="mt-1 flex items-center gap-1.5 text-[#172033]">
                <Users className="h-3.5 w-3.5 text-[#6B7280]" />
                <span className="font-medium">
                  {booking.passengers}{" "}
                  {booking.passengers === 1 ? "Passenger" : "Passengers"}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Luggage</p>
              <div className="mt-1 flex items-center gap-1.5 text-[#172033]">
                <Briefcase className="h-3.5 w-3.5 text-[#6B7280]" />
                <span className="font-medium">
                  {booking.luggage}{" "}
                  {booking.luggage === 1 ? "Item" : "Items"}
                </span>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#6B7280]">
                {isCash ? "Amount to Pay" : "Total Paid"}
              </p>
              <p className="text-2xl font-bold text-[#172F52]">
                £{booking.total.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#6B7280]">Payment Status</p>
              <div className="mt-1 flex items-center gap-1.5">
                {isCash ? (
                  <>
                    <Banknote className="h-4 w-4 text-amber-600" />
                    <Badge className="bg-amber-100 text-amber-700">
                      Pay Cash
                    </Badge>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 text-[#168A55]" />
                    <Badge className="bg-[#168A55]/10 text-[#168A55]">
                      Paid
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Button
            variant="outline"
            className="h-auto flex-col gap-1 py-4"
            render={<Link href="/passenger/history" />}
            nativeButton={false}
          >
            <ExternalLink className="h-5 w-5 text-[#172F52]" />
            <span className="text-xs">View Booking</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-1 py-4"
            render={<Link href="#" />}
            nativeButton={false}
          >
            <Download className="h-5 w-5 text-[#172F52]" />
            <span className="text-xs">Download Receipt</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-1 py-4"
            render={<Link href="#" />}
            nativeButton={false}
          >
            <Mail className="h-5 w-5 text-[#172F52]" />
            <span className="text-xs">Email Confirmation</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-1 py-4"
            render={<Link href="/help" />}
            nativeButton={false}
          >
            <Headphones className="h-5 w-5 text-[#172F52]" />
            <span className="text-xs">Contact Support</span>
          </Button>
        </div>

        <div className="mt-8 text-center">
          <Button
            render={<Link href="/" />}
            nativeButton={false}
            size="lg"
            className="bg-[#D4145A] px-8 text-white hover:bg-[#D4145A]/90"
          >
            Book Another Journey
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#D4145A] border-t-transparent" />
            <p className="text-sm text-[#6B7280]">Loading booking details...</p>
          </div>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
