"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { MapPin, Plane, Train, Navigation, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Location } from "@/types"

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onLocationSelect?: (location: Location) => void
  placeholder?: string
  icon?: "MapPin" | "Plane" | "Train"
  label?: string
  className?: string
  id?: string
}

interface Suggestion {
  description: string
  placeId: string
  mainText: string
  secondaryText: string
  types: string[]
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
  id,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
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
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=gb&addressdetails=1&limit=6`
      const res = await fetch(url, {
        headers: { "User-Agent": "BlueStarCars/1.0 (bstcars.co)" },
      })
      const data = await res.json()

      setSuggestions(
        data.map((item: any) => {
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

          return {
            description: item.display_name || "",
            placeId: String(item.place_id || item.osm_id || ""),
            mainText: parts[0] || item.display_name?.split(",")[0] || "",
            secondaryText,
            types,
          }
        })
      )
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
    setShowSuggestions(true)
    debouncedFetch(val)
  }

  function selectSuggestion(suggestion: Suggestion) {
    onChange(suggestion.description)
    setShowSuggestions(false)

    const parts = suggestion.description.split(",")
    const query = parts.slice(0, 2).join(",").trim()

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=gb&limit=1`,
      { headers: { "User-Agent": "BlueStarCars/1.0 (bstcars.co)" } }
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.[0]) {
          const item = data[0]
          const addr = item.address || {}

          onLocationSelect?.({
            formattedAddress: suggestion.description,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            placeId: suggestion.placeId,
            postcode: addr.postcode || "",
            city: addr.city || addr.town || addr.village || "",
            country: addr.country || "United Kingdom",
          })
        }
      })
      .catch(() => {})
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
            onChange(formattedAddress)

            onLocationSelect?.({
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
          className="mb-1 block text-sm font-medium text-[#172033]"
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
            if (suggestions.length > 0) setShowSuggestions(true)
          }}
          placeholder={placeholder}
          className="h-11 pl-10 pr-10"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("")
              setSuggestions([])
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-[#D9E0E8] bg-white shadow-lg">
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              type="button"
              onClick={() => selectSuggestion(s)}
              className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#F5F7FA]"
            >
              <div className="mt-0.5">
                {getIconForSuggestion(s.types)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#172033]">
                  {s.mainText}
                </p>
                <p className="truncate text-xs text-[#6B7280]">
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
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-[#D9E0E8] bg-white p-4 text-center shadow-lg">
            <p className="text-sm text-[#6B7280]">No locations found</p>
          </div>
        )}

      <button
        type="button"
        onClick={handleUseMyLocation}
        disabled={geoLoading}
        className="mt-2 flex items-center gap-1.5 text-sm font-medium text-[#D4145A] hover:text-[#D4145A]/80 disabled:opacity-50"
      >
        <Navigation className="h-3.5 w-3.5" />
        {geoLoading ? "Locating..." : "Use My Location"}
      </button>
    </div>
  )
}
