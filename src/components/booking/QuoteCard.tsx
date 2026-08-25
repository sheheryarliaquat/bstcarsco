"use client"

import {
  Star,
  Clock,
  Users,
  Briefcase,
  Zap,
  Leaf,
  CreditCard,
  Banknote,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Quote } from "@/types"

interface QuoteCardProps {
  quote: Quote
  onSelect?: (quoteId: string) => void
}

export function QuoteCard({ quote, onSelect }: QuoteCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-[#D9E0E8] bg-white p-4 transition-shadow hover:shadow-lg sm:p-5",
        quote.isLowestPrice && "ring-2 ring-[#D4145A]"
      )}
    >
      {quote.isLowestPrice && (
        <div className="absolute -top-3 left-4 rounded-full bg-[#D4145A] px-3 py-0.5 text-xs font-bold text-white">
          LOWEST PRICE
        </div>
      )}

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {quote.operatorLogo ? (
            <img
              src={quote.operatorLogo}
              alt={quote.operatorName}
              className="h-10 w-10 rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#172F52] text-sm font-bold text-white">
              {quote.operatorName.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-[#172033]">
              {quote.operatorName}
            </h3>
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium text-[#172033]">
                {quote.rating.toFixed(1)}
              </span>
              <span className="text-xs text-[#6B7280]">
                ({quote.totalReviews.toLocaleString()} reviews)
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          {quote.discountPercent && quote.discountPercent > 0 && (
            <Badge className="mb-1 border border-[#168A55] bg-[#168A55]/10 text-[#168A55]">
              {quote.discountPercent}% OFF
            </Badge>
          )}
          <div className="flex items-baseline gap-1.5">
            {quote.originalPrice && (
              <span className="text-sm text-[#6B7280] line-through">
                £{quote.originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-2xl font-bold text-[#172F52]">
              £{quote.price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-3 rounded-lg bg-[#F5F7FA] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-[#172033]">
            {quote.vehicleDescription}
          </span>
          <Badge variant="secondary" className="text-xs">
            {quote.vehicleType}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-[#6B7280]">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {quote.passengerCapacity} seats
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" />
            {quote.luggageCapacity} bags
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            ~{quote.estimatedJourneyTime} min
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {quote.isElectric && (
            <Badge className="border border-[#168A55] bg-[#168A55]/10 text-[#168A55]">
              <Zap className="mr-0.5 h-3 w-3" />
              Electric
            </Badge>
          )}
          {quote.isHybrid && (
            <Badge className="border border-[#0EA5E9] bg-[#0EA5E9]/10 text-[#0EA5E9]">
              <Leaf className="mr-0.5 h-3 w-3" />
              Hybrid
            </Badge>
          )}
        </div>
      </div>

      {quote.features.length > 0 && (
        <div className="mb-3">
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6B7280]">
            {quote.features.map((f) => (
              <li key={f} className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-[#D4145A]" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-[#D9E0E8] pt-3">
        <div className="flex gap-1.5">
          {quote.paymentTypes.includes("card") && (
            <Badge variant="outline" className="gap-1 text-xs">
              <CreditCard className="h-3 w-3" />
              Card
            </Badge>
          )}
          {quote.paymentTypes.includes("cash") && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Banknote className="h-3 w-3" />
              Cash
            </Badge>
          )}
        </div>

        <Button
          onClick={() => onSelect?.(quote.id)}
          className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
        >
          Select
        </Button>
      </div>
    </div>
  )
}
