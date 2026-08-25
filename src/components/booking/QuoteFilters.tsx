"use client"

import { useState } from "react"
import { SlidersHorizontal, RotateCcw, Star, Zap, Leaf, Accessibility } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { VEHICLE_TYPES } from "@/constants"
import type { SortingType, VehicleType } from "@/types"

export interface QuoteFilterValues {
  priceRange: [number, number]
  minRating: number
  vehicleTypes: VehicleType[]
  electricOnly: boolean
  hybridOnly: boolean
  wheelchairOnly: boolean
  minPassengers: number
  minLuggage: number
  paymentMethod: string
  sortBy: SortingType
}

interface QuoteFiltersProps {
  filters: QuoteFilterValues
  onFiltersChange: (filters: QuoteFilterValues) => void
  onReset?: () => void
}

export function QuoteFilters({
  filters,
  onFiltersChange,
  onReset,
}: QuoteFiltersProps) {
  const [priceMax, setPriceMax] = useState(filters.priceRange[1])

  function update<K extends keyof QuoteFilterValues>(
    key: K,
    value: QuoteFilterValues[K]
  ) {
    onFiltersChange({ ...filters, [key]: value })
  }

  function toggleVehicleType(vt: VehicleType) {
    const current = filters.vehicleTypes
    const next = current.includes(vt)
      ? current.filter((v) => v !== vt)
      : [...current, vt]
    update("vehicleTypes", next)
  }

  return (
    <div className="rounded-xl border border-[#D9E0E8] bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#172F52]">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </h3>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#D4145A]"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[#6B7280]">
          Sort By
        </label>
        <Select
          value={filters.sortBy}
          onValueChange={(v) => v && update("sortBy", v as SortingType)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recommended">Recommended</SelectItem>
            <SelectItem value="lowest_price">Lowest Price</SelectItem>
            <SelectItem value="highest_rated">Highest Rated</SelectItem>
            <SelectItem value="fastest">Fastest</SelectItem>
            <SelectItem value="electric_first">Electric First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[#6B7280]">
          Max Price: £{priceMax}
        </label>
        <input
          type="range"
          min={0}
          max={200}
          value={priceMax}
          onChange={(e) => {
            const v = Number(e.target.value)
            setPriceMax(v)
            update("priceRange", [0, v])
          }}
          className="w-full accent-[#D4145A]"
        />
        <div className="flex justify-between text-xs text-[#6B7280]">
          <span>£0</span>
          <span>£200</span>
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[#6B7280]">
          Minimum Rating
        </label>
        <div className="flex gap-1">
          {[0, 3, 3.5, 4, 4.5].map((r) => (
            <button
              key={r}
              onClick={() => update("minRating", r)}
              className={cn(
                "flex items-center gap-0.5 rounded-lg border px-2 py-1 text-xs transition-colors",
                filters.minRating === r
                  ? "border-[#D4145A] bg-[#D4145A]/10 text-[#D4145A]"
                  : "border-[#D9E0E8] text-[#6B7280] hover:border-[#172F52]/30"
              )}
            >
              {r > 0 ? (
                <>
                  <Star className="h-3 w-3 fill-current" />
                  {r}+
                </>
              ) : (
                "Any"
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#6B7280]">
          Vehicle Type
        </label>
        <div className="flex flex-col gap-2">
          {VEHICLE_TYPES.map((vt) => (
            <label
              key={vt.value}
              className="flex items-center gap-2 text-sm text-[#172033]"
            >
              <Checkbox
                checked={filters.vehicleTypes.includes(vt.value)}
                onCheckedChange={() => toggleVehicleType(vt.value)}
              />
              <span className="mr-1">{vt.icon}</span>
              {vt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-[#172033]">
            <Zap className="h-4 w-4 text-[#168A55]" />
            Electric Only
          </label>
          <Switch
            checked={filters.electricOnly}
            onCheckedChange={(c) => update("electricOnly", c)}
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-[#172033]">
            <Leaf className="h-4 w-4 text-[#0EA5E9]" />
            Hybrid Only
          </label>
          <Switch
            checked={filters.hybridOnly}
            onCheckedChange={(c) => update("hybridOnly", c)}
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-[#172033]">
            <Accessibility className="h-4 w-4 text-[#6B7280]" />
            Wheelchair
          </label>
          <Switch
            checked={filters.wheelchairOnly}
            onCheckedChange={(c) => update("wheelchairOnly", c)}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[#6B7280]">
          Min Passengers
        </label>
        <Select
          value={String(filters.minPassengers)}
          onValueChange={(v) => v && update("minPassengers", Number(v))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n === 0 ? "Any" : `${n}+`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[#6B7280]">
          Min Luggage
        </label>
        <Select
          value={String(filters.minLuggage)}
          onValueChange={(v) => v && update("minLuggage", Number(v))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n === 0 ? "Any" : `${n}+`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[#6B7280]">
          Payment Method
        </label>
        <Select
          value={filters.paymentMethod}
          onValueChange={(v) => v && update("paymentMethod", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="apple_pay">Apple Pay</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button className="w-full bg-[#D4145A] text-white hover:bg-[#D4145A]/90">
        Apply Filters
      </Button>
    </div>
  )
}

export const DEFAULT_FILTERS: QuoteFilterValues = {
  priceRange: [0, 200],
  minRating: 0,
  vehicleTypes: [],
  electricOnly: false,
  hybridOnly: false,
  wheelchairOnly: false,
  minPassengers: 0,
  minLuggage: 0,
  paymentMethod: "any",
  sortBy: "recommended",
}
