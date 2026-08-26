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
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadGoogleMaps = useCallback(async () => {
    if (typeof window === "undefined") return
    if (window.google?.maps?.places?.AutocompleteService) {
      if (!autocompleteServiceRef.current) {
        autocompleteServiceRef.current =
          new window.google.maps.places.AutocompleteService()
        geocoderRef.current = new window.google.maps.Geocoder()
      }
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyCptLq80ZFFeBZNl1l1uJjR4IHeO4j41Xw"
    if (!apiKey) return

    // Module-level singleton promise to ensure setOptions is called only once
    if (!(window as any).__googleMapsPromise) {
      ;(window as any).__googleMapsPromise = (async () => {
        const { setOptions, importLibrary } = await import("@googlemaps/js-api-loader")
        setOptions({ key: apiKey })
        await importLibrary("places")
      })()
    }
    await (window as any).__googleMapsPromise

    if (window.google?.maps?.places?.AutocompleteService) {
      autocompleteServiceRef.current =
        new window.google.maps.places.AutocompleteService()
      geocoderRef.current = new window.google.maps.Geocoder()
    }
  }, [])

  useEffect(() => {
    loadGoogleMaps()
  }, [loadGoogleMaps])

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

  const fetchSuggestions = useCallback((query: string) => {
    if (!autocompleteServiceRef.current || query.length < 3) {
      setSuggestions([])
      return
    }

    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request: any = {
      input: query,
      componentRestrictions: { country: "gb" },
      types: ["geocode", "establishment"],
    }
    autocompleteServiceRef.current.getQueryPredictions(
      request,
      (results, status) => {
        setLoading(false)
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          results
        ) {
          setSuggestions(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            results.map((r: any) => ({
              description: r.description ?? "",
              placeId: r.place_id ?? "",
              mainText:
                r.structured_formatting?.main_text ?? "",
              secondaryText:
                r.structured_formatting?.secondary_text ?? "",
              types: r.types ?? [],
            }))
          )
        } else {
          setSuggestions([])
        }
      }
    )
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

    if (geocoderRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const request: any = { placeId: suggestion.placeId }
      geocoderRef.current.geocode(request, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const r = results[0]
          const loc = r.geometry?.location
          const components = r.address_components ?? []
          const postcode =
            components.find((c) => c.types.includes("postal_code"))
              ?.long_name ?? ""
          const city =
            components.find((c) => c.types.includes("locality"))
              ?.long_name ?? ""
          const country =
            components.find((c) => c.types.includes("country"))
              ?.long_name ?? "United Kingdom"

          onLocationSelect?.({
            formattedAddress: r.formatted_address ?? suggestion.description,
            latitude: loc?.lat() ?? UK_CENTER.lat,
            longitude: loc?.lng() ?? UK_CENTER.lng,
            placeId: suggestion.placeId,
            postcode,
            city,
            country,
          })
        }
      })
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false)
        if (geocoderRef.current) {
          const latlng = new google.maps.LatLng(
            pos.coords.latitude,
            pos.coords.longitude
          )
          geocoderRef.current.geocode(
            { location: latlng },
            (results, status) => {
              if (status === "OK" && results?.[0]) {
                const r = results[0]
                const components = r.address_components ?? []
                const postcode =
                  components.find((c) => c.types.includes("postal_code"))
                    ?.long_name ?? ""
                const city =
                  components.find((c) => c.types.includes("locality"))
                    ?.long_name ?? ""
                const country =
                  components.find((c) => c.types.includes("country"))
                    ?.long_name ?? "United Kingdom"

                const addr = r.formatted_address ?? ""
                onChange(addr)
                onLocationSelect?.({
                  formattedAddress: addr,
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  placeId: r.place_id ?? "",
                  postcode,
                  city,
                  country,
                })
              }
            }
          )
        }
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
