"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { MapPin, Plane, Train, Navigation, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { UK_AIRPORTS } from "@/constants"
import { locationInPlaces, type PricedPlace } from "@/lib/services/route-fare-service"
import type { Location } from "@/types"

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onLocationSelect?: (location: Location) => void
  placeholder?: string
  icon?: "MapPin" | "Plane" | "Train"
  label?: string
  className?: string
  /** "icon" puts the use-my-location control inside the field so rows stay aligned. */
  geoButton?: "link" | "icon"
  id?: string
  /**
   * When set, only addresses inside these zones can be chosen (the zones that
   * have fixed route fares). null/undefined = any UK address.
   */
  allowedPlaces?: PricedPlace[] | null
  disabled?: boolean
}

interface Suggestion {
  description: string
  placeId: string
  mainText: string
  secondaryText: string
  types: string[]
  location: Location
}

/** Airports inside the allowed zones, offered as one-tap picks. */
function airportPicks(places: PricedPlace[]): Location[] {
  const codes = new Set(places.flatMap((p) => p.areas.map((a) => a.trim().toUpperCase())))
  return UK_AIRPORTS.filter((a) => codes.has(a.code)).map((a) => ({
    formattedAddress: `${a.name} (${a.code})`,
    latitude: a.location.latitude,
    longitude: a.location.longitude,
    placeId: `airport-${a.code}`,
    postcode: a.postcode,
    city: a.city,
    country: "United Kingdom",
  }))
}

/** Nominatim often leaves the postcode out — look it up from the coordinates (postcodes.io, one request). */
async function fillMissingPostcodes(list: Suggestion[]): Promise<void> {
  const missing = list.filter((s) => !s.location.postcode && Number.isFinite(s.location.latitude))
  if (missing.length === 0) return
  try {
    const res = await fetch("https://api.postcodes.io/postcodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        geolocations: missing.map((s) => ({
          latitude: s.location.latitude,
          longitude: s.location.longitude,
          radius: 2000,
          limit: 1,
        })),
      }),
    })
    const data: { result?: { result?: { postcode?: string }[] | null }[] } = await res.json()
    data?.result?.forEach((r, i) => {
      const pc = r?.result?.[0]?.postcode
      if (pc && missing[i]) missing[i].location.postcode = pc
    })
  } catch {
    // Without a postcode the address can still match a zone by town or airport name.
  }
}

const UK_CENTER = { lat: 52.3555, lng: -1.1743 }

export function LocationAutocomplete({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Enter pickup location",
  icon = "MapPin",
  label,
  className,
  geoButton = "link",
  id,
  allowedPlaces,
  disabled = false,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const [notCovered, setNotCovered] = useState<string | null>(null)
  const restricted = Array.isArray(allowedPlaces)
  const placesRef = useRef(allowedPlaces)
  useEffect(() => {
    placesRef.current = allowedPlaces
  }, [allowedPlaces])
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      const places = placesRef.current
      const limit = Array.isArray(places) ? 15 : 6
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=gb&addressdetails=1&limit=${limit}`
      const res = await fetch(url, {
        headers: { "User-Agent": "BlueStarCars/1.0 (bstcars.co)" },
      })
      const data = await res.json()

      const mapped: Suggestion[] = data.map((item: any) => {
          const addr = item.address || {}
          const parts: string[] = []
          if (addr.road) parts.push(addr.road)
          if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village)
          if (addr.state) parts.push(addr.state)
          if (addr.postcode) parts.push(addr.postcode)
          const secondaryText = parts.join(", ") || item.display_name?.split(",").slice(1, 3).join(",") || ""

          const types: string[] = []
          if (item.type === "aerodrome" || item.class === "aeroway") types.push("airport")
          if (item.type === "railway" || item.class === "railway") types.push("transit_station")

          const description = item.display_name || ""
          const placeId = String(item.place_id || item.osm_id || "")
          return {
            description,
            placeId,
            mainText: parts[0] || item.display_name?.split(",")[0] || "",
            secondaryText,
            types,
            location: {
              formattedAddress: description,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              placeId,
              postcode: addr.postcode || "",
              city: addr.city || addr.town || addr.village || "",
              country: addr.country || "United Kingdom",
            },
          }
        })

      if (Array.isArray(places)) {
        await fillMissingPostcodes(mapped)
        setSuggestions(mapped.filter((s) => locationInPlaces(s.location, places)).slice(0, 6))
      } else {
        setSuggestions(mapped)
      }
    } catch {
      setSuggestions([])
    }
    setLoading(false)
  }, [])

  function debouncedFetch(query: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => fetchSuggestions(query), 300)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    onChange(val)
    setNotCovered(null)
    setShowSuggestions(true)
    debouncedFetch(val)
  }

  /** Accept a location only if it is inside the allowed zones. */
  function chooseLocation(loc: Location) {
    onChange(loc.formattedAddress)
    setShowSuggestions(false)
    const places = placesRef.current
    if (Array.isArray(places) && !locationInPlaces(loc, places)) {
      setNotCovered("We don't have a fixed price for this location yet. Please choose one of the covered areas.")
      return
    }
    setNotCovered(null)
    onLocationSelect?.(loc)
  }

  function selectSuggestion(suggestion: Suggestion) {
    chooseLocation(suggestion.location)
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=18`,
          { headers: { "User-Agent": "BlueStarCars/1.0 (bstcars.co)" } }
        )
          .then((r) => r.json())
          .then((data) => {
            setGeoLoading(false)
            const addr = data.address || {}
            const formattedAddress = data.display_name || ""

            chooseLocation({
              formattedAddress,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              placeId: String(data.place_id || ""),
              postcode: addr.postcode || "",
              city: addr.city || addr.town || addr.village || "",
              country: addr.country || "United Kingdom",
            })
          })
          .catch(() => {
            setGeoLoading(false)
          })
      },
      () => {
        setGeoLoading(false)
      }
    )
  }

  function getIconForSuggestion(types: string[]) {
    if (types.some((t) => t.includes("airport")))
      return <Plane className="h-4 w-4 text-gray-400" />
    if (types.some((t) => t.includes("transit_station")))
      return <Train className="h-4 w-4 text-gray-400" />
    return <MapPin className="h-4 w-4 text-gray-400" />
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-[13px] font-semibold text-[#4A5568]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          id={id}
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            setFocused(true)
            setShowSuggestions(true)
          }}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          className={cn("h-12 rounded-[10px] pl-10 text-[15px]", geoButton === "icon" ? "pr-[4.5rem]" : "pr-10")}
        />
        {value && (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => {
              onChange("")
              setSuggestions([])
              setNotCovered(null)
            }}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600",
              geoButton === "icon" ? "right-11" : "right-3"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {geoButton === "icon" && (
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={geoLoading || disabled}
            aria-label="Use my location"
            title="Use my location"
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#1F4FD8] hover:bg-[#F4F6F9] disabled:opacity-50"
          >
            <Navigation className={cn("h-4 w-4", geoLoading && "animate-pulse")} />
          </button>
        )}
      </div>

      {showSuggestions && value.length >= 3 && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-[#E2E6EC] bg-white shadow-lg">
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              type="button"
              onClick={() => selectSuggestion(s)}
              className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#F4F6F9]"
            >
              <div className="mt-0.5">
                {getIconForSuggestion(s.types)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#0F1B2D]">
                  {s.mainText}
                </p>
                <p className="truncate text-xs text-[#5B6577]">
                  {s.secondaryText}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions &&
        value.length >= 3 &&
        suggestions.length === 0 &&
        !loading && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-[#E2E6EC] bg-white p-4 text-center shadow-lg">
            <p className="text-sm text-[#5B6577]">
              {restricted ? "No covered locations match. Try a postcode in one of the areas below." : "No locations found"}
            </p>
            {restricted && allowedPlaces!.length > 0 && (
              <p className="mt-1 text-xs text-[#5B6577]">
                {allowedPlaces!.map((p) => p.label).join(" · ")}
              </p>
            )}
          </div>
        )}

      {restricted && showSuggestions && focused && value.length < 3 && !disabled && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-[#E2E6EC] bg-white shadow-lg">
          {allowedPlaces!.length === 0 ? (
            <p className="p-4 text-center text-sm text-[#5B6577]">No fixed-price journeys from this pick-up.</p>
          ) : (
            <>
              {airportPicks(allowedPlaces!).map((loc) => (
                <button
                  key={loc.placeId}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => chooseLocation(loc)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#F4F6F9]"
                >
                  <Plane className="h-4 w-4 text-gray-400" />
                  <span className="truncate text-sm font-medium text-[#0F1B2D]">{loc.formattedAddress}</span>
                </button>
              ))}
              <div className="border-t border-[#E2E6EC] px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#5B6577]">Areas with fixed prices</p>
                <p className="mt-1 text-xs leading-relaxed text-[#0F1B2D]">
                  {allowedPlaces!.map((p) => p.label).join(" · ")}
                </p>
                <p className="mt-1 text-xs text-[#5B6577]">Type your address or postcode in one of these areas.</p>
              </div>
            </>
          )}
        </div>
      )}

      {notCovered && <p className="mt-1.5 text-xs font-medium text-[#C53030]">{notCovered}</p>}

      {geoButton === "link" && (
      <button
        type="button"
        onClick={handleUseMyLocation}
        disabled={geoLoading}
        className="mt-2 flex items-center gap-1.5 text-sm font-medium text-[#1F4FD8] hover:text-[#1F4FD8]/80 disabled:opacity-50"
      >
        <Navigation className="h-3.5 w-3.5" />
        {geoLoading ? "Locating..." : "Use My Location"}
      </button>
      )}
    </div>
  )
}
