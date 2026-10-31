"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  { id: "quotes", label: "Choose car" },
  { id: "passenger", label: "Your details" },
  { id: "confirmed", label: "Confirmed" },
] as const

/** Older step ids still used by some pages map onto the three steps above. */
const ALIASES: Record<string, string> = { search: "quotes", payment: "passenger" }

interface BookingProgressProps {
  currentStep: string
}

export function BookingProgress({ currentStep }: BookingProgressProps) {
  const step = ALIASES[currentStep] ?? currentStep
  const currentIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.id === step)
  )

  return (
    <ol aria-label="Booking steps" className="flex flex-wrap gap-2 sm:gap-3">
      {STEPS.map((s, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        return (
          <li
            key={s.id}
            aria-current={active ? "step" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-full border py-1.5 pl-1.5 pr-3 text-[13px] font-semibold sm:gap-2 sm:py-2 sm:pl-2 sm:pr-4 sm:text-sm",
              active ? "border-[#0F1B2D] bg-[#0F1B2D] text-white" : "border-[#E2E6EC] bg-white text-[#4A5568]"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                active ? "bg-[#F2B233] text-[#0F1B2D]" : done ? "bg-[#E6F4EC] text-[#1E6B44]" : "bg-[#EEF2F7] text-[#0F1B2D]"
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" aria-label="done" /> : i + 1}
            </span>
            {s.label}
          </li>
        )
      })}
    </ol>
  )
}
