"use client"

import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Briefcase,
  Route,
  Pencil,
  Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import type { BookingSearchParams } from "./BookingSearch"

interface PriceBreakdown {
  baseFare: number
  distance: number
  fees: number
  surcharge: number
  total: number
  discount?: number
  promoCode?: string
}

interface BookingSummaryProps {
  searchParams: BookingSearchParams
  priceBreakdown?: PriceBreakdown
  onEdit?: () => void
}

export function BookingSummary({
  searchParams,
  priceBreakdown,
  onEdit,
}: BookingSummaryProps) {
  return (
    <div className="rounded-xl border border-[#D9E0E8] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#172F52]">
          Booking Summary
        </h3>
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-xs font-medium text-[#D4145A] hover:text-[#D4145A]/80"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        )}
      </div>

      <div className="mb-3 space-y-2.5">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D4145A]" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#6B7280]">From</p>
            <p className="truncate text-sm font-medium text-[#172033]">
              {searchParams.pickup?.formattedAddress || "Not set"}
            </p>
          </div>
        </div>

        <div className="ml-1.5 h-3 border-l-2 border-dashed border-[#D9E0E8]" />

        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#168A55]" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#6B7280]">To</p>
            <p className="truncate text-sm font-medium text-[#172033]">
              {searchParams.destination?.formattedAddress || "Not set"}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 rounded-lg bg-[#F5F7FA] p-3 text-sm">
        <div className="flex items-center gap-1.5 text-[#172033]">
          <Calendar className="h-3.5 w-3.5 text-[#6B7280]" />
          <span className="text-xs">
            {searchParams.date
              ? format(searchParams.date, "dd MMM yyyy")
              : "Not set"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[#172033]">
          <Clock className="h-3.5 w-3.5 text-[#6B7280]" />
          <span className="text-xs">{searchParams.time || "Not set"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#172033]">
          <Users className="h-3.5 w-3.5 text-[#6B7280]" />
          <span className="text-xs">
            {searchParams.passengers}{" "}
            {searchParams.passengers === 1 ? "Passenger" : "Passengers"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[#172033]">
          <Briefcase className="h-3.5 w-3.5 text-[#6B7280]" />
          <span className="text-xs">
            {searchParams.luggage}{" "}
            {searchParams.luggage === 1 ? "Bag" : "Bags"}
          </span>
        </div>
      </div>

      <div className="mb-3">
        <Badge variant="outline" className="text-xs">
          <Route className="mr-1 h-3 w-3" />
          {searchParams.tripType === "one_way" ? "One Way" : "Return"}
        </Badge>
      </div>

      {priceBreakdown && (
        <div className="border-t border-[#D9E0E8] pt-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
            Price Breakdown
          </h4>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-[#172033]">
              <span>Base Fare</span>
              <span>£{priceBreakdown.baseFare.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#172033]">
              <span>Distance</span>
              <span>£{priceBreakdown.distance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#172033]">
              <span>Fees</span>
              <span>£{priceBreakdown.fees.toFixed(2)}</span>
            </div>
            {priceBreakdown.surcharge > 0 && (
              <div className="flex justify-between text-[#172033]">
                <span>Surcharge</span>
                <span>£{priceBreakdown.surcharge.toFixed(2)}</span>
              </div>
            )}
            {priceBreakdown.discount && priceBreakdown.discount > 0 && (
              <div className="flex justify-between text-[#168A55]">
                <span>Discount</span>
                <span>-£{priceBreakdown.discount.toFixed(2)}</span>
              </div>
            )}
            {priceBreakdown.promoCode && (
              <div className="flex items-center gap-1.5 text-xs text-[#D4145A]">
                <Tag className="h-3 w-3" />
                Promo: {priceBreakdown.promoCode}
              </div>
            )}
          </div>
          <div className="mt-2 flex justify-between border-t border-[#D9E0E8] pt-2 text-base font-bold text-[#172F52]">
            <span>Total</span>
            <span>£{priceBreakdown.total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
