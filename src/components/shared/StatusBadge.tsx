"use client"

import { BookingStatus, PaymentStatus } from "@/types"
import { BOOKING_STATUSES, PAYMENT_STATUSES } from "@/constants"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  type?: "booking" | "payment"
  className?: string
}

export function StatusBadge({ status, type = "booking", className }: StatusBadgeProps) {
  const statuses = type === "booking" ? BOOKING_STATUSES : PAYMENT_STATUSES
  const match = statuses.find((s) => s.value === status)

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        className
      )}
      style={{
        backgroundColor: match ? `${match.color}18` : "#F3F4F6",
        color: match?.color ?? "#6B7280",
      }}
    >
      {match?.label ?? status}
    </span>
  )
}
