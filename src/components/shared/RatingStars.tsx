"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingStarsProps {
  rating: number
  maxStars?: number
  size?: "sm" | "md" | "lg"
  interactive?: boolean
  onRate?: (rating: number) => void
  count?: number
  className?: string
}

const sizeMap = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
}

export function RatingStars({
  rating,
  maxStars = 5,
  size = "md",
  interactive = false,
  onRate,
  count,
  className,
}: RatingStarsProps) {
  const starSize = sizeMap[size]

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starIndex = i + 1
        const filled = starIndex <= Math.floor(rating)
        const halfFilled = !filled && starIndex - 0.5 <= rating

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(starIndex)}
            className={cn(
              "relative",
              interactive && "cursor-pointer hover:scale-110",
              !interactive && "cursor-default"
            )}
          >
            <Star
              className={cn(
                starSize,
                "transition-colors",
                filled
                  ? "fill-amber-400 text-amber-400"
                  : halfFilled
                    ? "fill-amber-400/50 text-amber-400"
                    : "fill-gray-200 text-gray-200"
              )}
            />
          </button>
        )
      })}
      {count !== undefined && (
        <span
          className={cn(
            "ml-1 text-[#6B7280]",
            size === "sm" && "text-[10px]",
            size === "md" && "text-xs",
            size === "lg" && "text-sm"
          )}
        >
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  )
}
