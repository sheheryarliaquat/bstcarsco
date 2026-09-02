"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  MapPin,
  ArrowUpDown,
  Calendar,
  Clock,
  Users,
  Briefcase,
  Plane,
  Baby,
  Accessibility,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
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
  compact?: boolean
}

export function BookingSearch({ onSearch, compact }: BookingSearchProps) {
  const router = useRouter()
  const [pickup, setPickup] = useState<Location | null>(null)
  const [pickupText, setPickupText] = useState("")
  const [destination, setDestination] = useState<Location | null>(null)
  const [destinationText, setDestinationText] = useState("")
  const [tripType, setTripType] = useState<TripType>("one_way")
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState("09:00")
  const [passengers, setPassengers] = useState(1)
  const [luggage, setLuggage] = useState(1)
  const [childSeat, setChildSeat] = useState(false)
  const [wheelchair, setWheelchair] = useState(false)
  const [meetGreet, setMeetGreet] = useState(false)
  const [flightNumber, setFlightNumber] = useState("")
  const [dateOpen, setDateOpen] = useState(false)

  useEffect(() => {
    setDate(new Date())
  }, [])

  const isAirport =
    destination?.formattedAddress?.toLowerCase().includes("airport") ||
    pickup?.formattedAddress?.toLowerCase().includes("airport")

  function swapLocations() {
    setPickup(destination)
    setPickupText(destinationText)
    setDestination(pickup)
    setDestinationText(pickupText)
  }

  function handleSearch() {
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
          flightNumber: isAirport ? flightNumber : undefined,
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

    router.push(`/quotes?${params.toString()}`)
  }

  return (
    <div className="w-full rounded-2xl bg-white p-4 shadow-lg ring-1 ring-black/5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-bold text-[#172F52]">
          Book Your Journey
        </h2>
      </div>

      <div className="mb-4 flex gap-2">
        <Button
          variant={tripType === "one_way" ? "default" : "outline"}
          size="sm"
          onClick={() => setTripType("one_way")}
          className={
            tripType === "one_way"
              ? "bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
              : ""
          }
        >
          One Way
        </Button>
        <Button
          variant={tripType === "return" ? "default" : "outline"}
          size="sm"
          onClick={() => setTripType("return")}
          className={
            tripType === "return"
              ? "bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
              : ""
          }
        >
          Return
        </Button>
      </div>

      <div className="relative mb-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <LocationAutocomplete
              id="pickup"
              label="Pickup Location"
              value={pickupText}
              onChange={setPickupText}
              onLocationSelect={setPickup}
              placeholder="Enter pickup address"
              icon="MapPin"
            />
          </div>
          <button
            type="button"
            onClick={swapLocations}
            className="mt-7 flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-full border border-[#D9E0E8] text-[#6B7280] transition-colors hover:bg-[#F5F7FA] hover:text-[#D4145A]"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <LocationAutocomplete
              id="destination"
              label="Destination"
              value={destinationText}
              onChange={setDestinationText}
              onLocationSelect={setDestination}
              placeholder="Enter destination"
              icon="MapPin"
            />
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#172033]">
            Date
          </label>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger
              render={
                <button className="flex h-11 w-full items-center gap-2 rounded-lg border border-[#D9E0E8] px-3 text-left text-sm transition-colors hover:border-[#172F52]/30 focus:border-[#D4145A] focus:outline-none" />
              }
            >
              <Calendar className="h-4 w-4 text-[#6B7280]" />
              <span className={date ? "text-[#172033]" : "text-[#6B7280]"}>
                {date ? format(date, "dd MMM yyyy") : "Select date"}
              </span>
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
          <label className="mb-1 block text-sm font-medium text-[#172033]">
            Time
          </label>
          <Select value={time} onValueChange={(v) => v && setTime(v)}>
            <SelectTrigger className="h-11 w-full">
              <Clock className="mr-1.5 h-4 w-4 text-[#6B7280]" />
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
          <label className="mb-1 block text-sm font-medium text-[#172033]">
            Passengers
          </label>
          <Select
            value={String(passengers)}
            onValueChange={(v) => v && setPassengers(Number(v))}
          >
            <SelectTrigger className="h-11 w-full">
              <Users className="mr-1.5 h-4 w-4 text-[#6B7280]" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} {n === 1 ? "Passenger" : "Passengers"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[#172033]">
            Luggage
          </label>
          <Select
            value={String(luggage)}
            onValueChange={(v) => v && setLuggage(Number(v))}
          >
            <SelectTrigger className="h-11 w-full">
              <Briefcase className="mr-1.5 h-4 w-4 text-[#6B7280]" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 9 }, (_, i) => i).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} {n === 1 ? "Bag" : "Bags"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isAirport && (
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-[#172033]">
            Flight Number (optional)
          </label>
          <div className="relative">
            <Plane className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              placeholder="e.g. BA117"
              className="h-11 pl-10"
            />
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-[#172033]">
          <Checkbox checked={childSeat} onCheckedChange={(c) => setChildSeat(c === true)} />
          <Baby className="h-4 w-4 text-[#6B7280]" />
          Child Seat
        </label>
        <label className="flex items-center gap-2 text-sm text-[#172033]">
          <Checkbox
            checked={wheelchair}
            onCheckedChange={(c) => setWheelchair(c === true)}
          />
          <Accessibility className="h-4 w-4 text-[#6B7280]" />
          Wheelchair
        </label>
        <label className="flex items-center gap-2 text-sm text-[#172033]">
          <Checkbox
            checked={meetGreet}
            onCheckedChange={(c) => setMeetGreet(c === true)}
          />
          <UserCheck className="h-4 w-4 text-[#6B7280]" />
          Meet &amp; Greet
        </label>
      </div>

      <Button
        onClick={handleSearch}
        disabled={!pickup || !destination}
        className="h-12 w-full bg-[#D4145A] text-base font-semibold text-white hover:bg-[#D4145A]/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MapPin className="mr-2 h-5 w-5" />
        Get Quotes
      </Button>
      {(!pickup || !destination) && (pickupText || destinationText) && (
        <p className="text-center text-xs text-[#6B7280]">
          Select a pickup and destination from the suggestions to continue.
        </p>
      )}
    </div>
  )
}
