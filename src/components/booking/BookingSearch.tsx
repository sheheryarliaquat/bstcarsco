"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Accessibility, Baby, Calendar, Clock, Plane, UserCheck } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { LocationAutocomplete } from "./LocationAutocomplete"
import type { Location, TripType, SpecialRequirements } from "@/types"
import { format } from "date-fns"

function generateTimeOptions() {
  const times: string[] = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
    }
  }
  return times
}

const TIME_OPTIONS = generateTimeOptions()

export interface BookingSearchParams {
  pickup: Location | null
  destination: Location | null
  tripType: TripType
  date: Date | undefined
  time: string
  passengers: number
  luggage: number
  specialRequirements: SpecialRequirements
}

interface BookingSearchProps {
  onSearch?: (params: BookingSearchParams) => void
  /** Pre-fill the form, e.g. with the current search on the car selection page. */
  initial?: Partial<BookingSearchParams>
  className?: string
}

const LABEL = "mb-1.5 block text-[13px] font-semibold text-[#4A5568]"
const FIELD =
  "flex h-12 w-full items-center gap-2 rounded-[10px] border border-[#CBD2DC] bg-white px-3 text-left text-[15px] text-[#0F1B2D] transition-colors hover:border-[#0F1B2D]/40 focus:border-[#1F4FD8] focus:outline-none"

export function BookingSearch({ onSearch, initial, className }: BookingSearchProps) {
  const router = useRouter()
  const [pickup, setPickup] = useState<Location | null>(initial?.pickup ?? null)
  const [pickupText, setPickupText] = useState(initial?.pickup?.formattedAddress ?? "")
  const [destination, setDestination] = useState<Location | null>(initial?.destination ?? null)
  const [destinationText, setDestinationText] = useState(initial?.destination?.formattedAddress ?? "")
  const tripType: TripType = initial?.tripType ?? "one_way"
  const [date, setDate] = useState<Date | undefined>(() => initial?.date ?? new Date())
  const [time, setTime] = useState(initial?.time ?? "09:00")
  const [passengers, setPassengers] = useState(initial?.passengers ?? 1)
  const [luggage, setLuggage] = useState(initial?.luggage ?? 1)
  const [childSeat, setChildSeat] = useState(initial?.specialRequirements?.childSeat ?? false)
  const [wheelchair, setWheelchair] = useState(initial?.specialRequirements?.wheelchairAccessible ?? false)
  const [meetGreet, setMeetGreet] = useState(initial?.specialRequirements?.meetAndGreet ?? false)
  const [flightNumber, setFlightNumber] = useState(initial?.specialRequirements?.flightNumber ?? "")
  const [dateOpen, setDateOpen] = useState(false)

  const isAirport =
    destination?.formattedAddress?.toLowerCase().includes("airport") ||
    pickup?.formattedAddress?.toLowerCase().includes("airport")

  const ready = Boolean(pickup && destination)

  function handleSearch() {
    if (!ready) return
    if (onSearch) {
      onSearch({
        pickup,
        destination,
        tripType,
        date,
        time,
        passengers,
        luggage,
        specialRequirements: {
          childSeat,
          wheelchairAccessible: wheelchair,
          meetAndGreet: meetGreet,
          ...(isAirport && flightNumber.trim() && { flightNumber: flightNumber.trim().toUpperCase() }),
        },
      })
      return
    }

    const params = new URLSearchParams()
    if (pickup) {
      params.set("pickupAddress", pickup.formattedAddress)
      params.set("pickupLat", String(pickup.latitude))
      params.set("pickupLng", String(pickup.longitude))
      params.set("pickupPostcode", pickup.postcode || "")
    }
    if (destination) {
      params.set("destAddress", destination.formattedAddress)
      params.set("destLat", String(destination.latitude))
      params.set("destLng", String(destination.longitude))
      params.set("destPostcode", destination.postcode || "")
    }
    params.set("tripType", tripType)
    if (date) params.set("date", date.toISOString())
    params.set("time", time)
    params.set("passengers", String(passengers))
    params.set("luggage", String(luggage))
    if (childSeat) params.set("childSeat", "1")
    if (wheelchair) params.set("wheelchair", "1")
    if (meetGreet) params.set("meetGreet", "1")
    if (isAirport && flightNumber.trim()) params.set("flight", flightNumber.trim().toUpperCase())

    router.push(`/quotes?${params.toString()}`)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handleSearch()
      }}
      className={cn(
        "w-full rounded-2xl bg-white p-4 text-left shadow-[0_12px_32px_rgba(15,27,45,0.12)] sm:p-5",
        className
      )}
    >
      <div className="grid grid-cols-2 items-end gap-3.5 lg:grid-cols-6">
        <LocationAutocomplete
          id="pickup"
          label="Pick-up address or postcode"
          value={pickupText}
          onChange={setPickupText}
          onLocationSelect={setPickup}
          placeholder="e.g. SW1A 2AA or 10 Downing Street"
          icon="MapPin"
          geoButton="icon"
          className="col-span-2"
        />
        <LocationAutocomplete
          id="destination"
          label="Drop-off"
          value={destinationText}
          onChange={setDestinationText}
          onLocationSelect={setDestination}
          placeholder="e.g. Heathrow Terminal 5"
          icon="Plane"
          geoButton="icon"
          className="col-span-2"
        />

        <div>
          <span className={LABEL} id="date-label">Date</span>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger render={<button type="button" aria-labelledby="date-label" className={FIELD} />}>
              <Calendar className="h-4 w-4 shrink-0 text-[#5B6577]" />
              <span suppressHydrationWarning className={date ? "" : "text-[#5B6577]"}>{date ? format(date, "dd MMM yyyy") : "Select date"}</span>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" side="bottom">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={(d) => {
                  setDate(d)
                  setDateOpen(false)
                }}
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <span className={LABEL} id="time-label">Pick-up time</span>
          <Select value={time} onValueChange={(v) => v && setTime(v)}>
            <SelectTrigger aria-labelledby="time-label" className="h-12 w-full rounded-[10px] border-[#CBD2DC] text-[15px] data-[size=default]:h-12">
              <Clock className="mr-1.5 h-4 w-4 text-[#5B6577]" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <span className={LABEL} id="pax-label">Passengers</span>
          <Select value={String(passengers)} onValueChange={(v) => v && setPassengers(Number(v))}>
            <SelectTrigger aria-labelledby="pax-label" className="h-12 w-full rounded-[10px] border-[#CBD2DC] text-[15px] data-[size=default]:h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <span className={LABEL} id="bags-label">Suitcases</span>
          <Select value={String(luggage)} onValueChange={(v) => v && setLuggage(Number(v))}>
            <SelectTrigger aria-labelledby="bags-label" className="h-12 w-full rounded-[10px] border-[#CBD2DC] text-[15px] data-[size=default]:h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 13 }, (_, i) => i).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={isAirport ? "col-span-2" : "hidden"}>
          <label htmlFor="flight" className={LABEL}>
            Flight number (optional)
          </label>
          <div className="relative">
            <Plane className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6577]" aria-hidden="true" />
            <input
              id="flight"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              placeholder="e.g. BA 117"
              className={cn(FIELD, "pl-9 uppercase placeholder:normal-case")}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!ready}
          className={cn(
            "col-span-2 h-12 rounded-[10px] bg-[#F2B233] text-base font-bold text-[#0F1B2D] transition-colors hover:bg-[#E5A41F] disabled:cursor-not-allowed disabled:opacity-60",
            isAirport ? "lg:col-span-2" : "lg:col-span-4"
          )}
        >
          Get prices
        </button>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#0F1B2D]">
        <label className="flex items-center gap-2">
          <Checkbox checked={meetGreet} onCheckedChange={(c) => setMeetGreet(c === true)} />
          <UserCheck className="h-4 w-4 text-[#5B6577]" aria-hidden="true" />
          Meet &amp; greet
        </label>
        <label className="flex items-center gap-2">
          <Checkbox checked={childSeat} onCheckedChange={(c) => setChildSeat(c === true)} />
          <Baby className="h-4 w-4 text-[#5B6577]" aria-hidden="true" />
          Child seat
        </label>
        <label className="flex items-center gap-2">
          <Checkbox checked={wheelchair} onCheckedChange={(c) => setWheelchair(c === true)} />
          <Accessibility className="h-4 w-4 text-[#5B6577]" aria-hidden="true" />
          Wheelchair accessible
        </label>
        {!ready && (pickupText || destinationText) && (
          <span className="text-xs text-[#5B6577] sm:ml-auto">
            Choose your pick-up and drop-off from the suggestions to continue.
          </span>
        )}
      </div>
    </form>
  )
}
