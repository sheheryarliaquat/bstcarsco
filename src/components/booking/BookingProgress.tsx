"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  { id: "search", label: "Search" },
  { id: "quotes", label: "Quotes" },
  { id: "passenger", label: "Passenger" },
  { id: "payment", label: "Payment" },
  { id: "confirmed", label: "Confirmed" },
] as const

interface BookingProgressProps {
  currentStep: string
}

export function BookingProgress({ currentStep }: BookingProgressProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep)

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-max items-center justify-between px-2 py-4">
        {STEPS.map((step, i) => {
          const isCompleted = i < currentIndex
          const isCurrent = step.id === currentStep
          const isUpcoming = i > currentIndex

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    isCompleted &&
                      "border-[#168A55] bg-[#168A55] text-white",
                    isCurrent &&
                      "border-[#D4145A] bg-[#D4145A] text-white",
                    isUpcoming &&
                      "border-[#D9E0E8] bg-white text-[#6B7280]"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={cn(
                    "mt-1.5 text-xs font-medium",
                    (isCompleted || isCurrent) && "text-[#172033]",
                    isUpcoming && "text-[#6B7280]"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 mb-5 h-0.5 w-8 sm:w-12 lg:w-16",
                    i < currentIndex ? "bg-[#168A55]" : "bg-[#D9E0E8]"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
