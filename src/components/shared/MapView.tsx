"use client"

import { useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"

interface MapLocation {
  lat: number
  lng: number
}

interface MapViewProps {
  pickup?: MapLocation
  destination?: MapLocation
  driverLocation?: MapLocation
  height?: string
  className?: string
}

const UK_CENTER = { lat: 52.3555, lng: -1.1743 }

export function MapView({
  pickup,
  destination,
  driverLocation,
  height = "400px",
  className,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)

  const initMap = useCallback(async () => {
    if (!mapRef.current || typeof window === "undefined") return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    try {
      const { setOptions, importLibrary } = await import(
        "@googlemaps/js-api-loader"
      )
      setOptions({ key: apiKey })
      await importLibrary("maps")

      const center = pickup || destination || UK_CENTER

      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 12,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })

      mapInstanceRef.current = map

      if (pickup) {
        new google.maps.Marker({
          position: pickup,
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#D4145A",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
          title: "Pickup",
        })
      }

      if (destination) {
        new google.maps.Marker({
          position: destination,
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#168A55",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
          title: "Destination",
        })
      }

      if (driverLocation) {
        new google.maps.Marker({
          position: driverLocation,
          map,
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: "#172F52",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            rotation: 0,
          },
          title: "Driver",
        })
      }

      if (pickup && destination) {
        const routePath = new google.maps.Polyline({
          path: [pickup, destination],
          geodesic: true,
          strokeColor: "#D4145A",
          strokeOpacity: 0.8,
          strokeWeight: 3,
          map,
        })

        const bounds = new google.maps.LatLngBounds()
        bounds.extend(pickup)
        bounds.extend(destination)
        map.fitBounds(bounds, 50)
      }
    } catch {
      // Google Maps not available - render placeholder
    }
  }, [pickup, destination, driverLocation])

  useEffect(() => {
    initMap()
  }, [initMap])

  return (
    <div
      ref={mapRef}
      style={{ height }}
      className={cn(
        "overflow-hidden rounded-xl bg-[#F5F7FA] ring-1 ring-[#D9E0E8]",
        className
      )}
    />
  )
}
