"use client"

import { useState } from "react"
import { Clock, Save, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SERVICE_AREAS } from "@/constants"

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
}

interface DaySchedule {
  enabled: boolean
  start: string
  end: string
}

const INITIAL_SCHEDULE: Record<string, DaySchedule> = {
  monday: { enabled: true, start: "06:00", end: "22:00" },
  tuesday: { enabled: true, start: "06:00", end: "22:00" },
  wednesday: { enabled: true, start: "06:00", end: "22:00" },
  thursday: { enabled: true, start: "06:00", end: "22:00" },
  friday: { enabled: true, start: "06:00", end: "23:00" },
  saturday: { enabled: true, start: "08:00", end: "23:00" },
  sunday: { enabled: true, start: "08:00", end: "21:00" },
}

const VEHICLE_OPTIONS = [
  { id: "saloon", label: "Saloon" },
  { id: "executive", label: "Executive" },
  { id: "estate", label: "Estate" },
  { id: "mpv", label: "MPV" },
  { id: "minibus", label: "Minibus" },
  { id: "electric", label: "Electric" },
  { id: "wheelchair_accessible", label: "Wheelchair Accessible" },
]

export default function DriverAvailabilityPage() {
  const [isOnline, setIsOnline] = useState(true)
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE)
  const [selectedAreas, setSelectedAreas] = useState<string[]>([
    "Central London",
    "Greater London",
  ])
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([
    "saloon",
    "executive",
  ])
  const [saved, setSaved] = useState(false)

  function toggleDay(day: string) {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }))
  }

  function updateTime(day: string, field: "start" | "end", value: string) {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }

  function toggleArea(area: string) {
    setSelectedAreas((prev) =>
      prev.includes(area)
        ? prev.filter((a) => a !== area)
        : [...prev, area]
    )
  }

  function toggleVehicle(id: string) {
    setSelectedVehicles((prev) =>
      prev.includes(id)
        ? prev.filter((v) => v !== id)
        : [...prev, id]
    )
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Availability</h1>
          <p className="text-sm text-[#6B7280]">
            Manage your working hours and service preferences
          </p>
        </div>
        <Button
          onClick={handleSave}
          className={cn(
            "text-white",
            saved
              ? "bg-green-600 hover:bg-green-700"
              : "bg-[#D4145A] hover:bg-[#D4145A]/90"
          )}
        >
          {saved ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Online/Offline Toggle */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-[#E5E7EB]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-3 w-3 rounded-full",
                isOnline ? "bg-green-500" : "bg-gray-400"
              )}
            />
            <div>
              <p className="text-sm font-bold text-[#172F52]">
                {isOnline ? "Currently Online" : "Currently Offline"}
              </p>
              <p className="text-xs text-[#6B7280]">
                Toggle your availability status
              </p>
            </div>
          </div>
          <Switch
            checked={isOnline}
            onCheckedChange={setIsOnline}
            className="data-[state=checked]:bg-green-500"
          />
        </div>
      </div>

      {/* Working Hours */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-[#E5E7EB]">
        <div className="mb-5 flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#172F52]" />
          <h2 className="text-base font-bold text-[#172F52]">Working Hours</h2>
        </div>

        <div className="space-y-4">
          {DAYS.map((day) => {
            const daySchedule = schedule[day]
            return (
              <div
                key={day}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between",
                  daySchedule.enabled
                    ? "border-[#E5E7EB] bg-white"
                    : "border-[#E5E7EB] bg-[#F9FAFB] opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={daySchedule.enabled}
                    onCheckedChange={() => toggleDay(day)}
                  />
                  <span className="w-24 text-sm font-semibold text-[#172F52]">
                    {DAY_LABELS[day]}
                  </span>
                </div>

                {daySchedule.enabled && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={daySchedule.start}
                      onChange={(e) =>
                        updateTime(day, "start", e.target.value)
                      }
                      className="h-9 w-32 text-sm"
                    />
                    <span className="text-sm text-[#6B7280]">to</span>
                    <Input
                      type="time"
                      value={daySchedule.end}
                      onChange={(e) =>
                        updateTime(day, "end", e.target.value)
                      }
                      className="h-9 w-32 text-sm"
                    />
                  </div>
                )}

                {!daySchedule.enabled && (
                  <Badge variant="outline" className="border-gray-300 text-gray-500">
                    Day Off
                  </Badge>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Service Areas */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-[#E5E7EB]">
        <h2 className="mb-5 text-base font-bold text-[#172F52]">
          Service Areas
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_AREAS.map((area) => (
            <label
              key={area.name}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                selectedAreas.includes(area.name)
                  ? "border-[#D4145A]/30 bg-[#D4145A]/5"
                  : "border-[#E5E7EB] hover:bg-[#F5F7FA]"
              )}
            >
              <Checkbox
                checked={selectedAreas.includes(area.name)}
                onCheckedChange={() => toggleArea(area.name)}
              />
              <div>
                <p className="text-sm font-medium text-[#172F52]">
                  {area.name}
                </p>
                <p className="text-xs text-[#6B7280]">
                  {area.postcodes.length} postcodes
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Vehicle Type Availability */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-[#E5E7EB]">
        <h2 className="mb-5 text-base font-bold text-[#172F52]">
          Vehicle Type Availability
        </h2>
        <p className="mb-4 text-sm text-[#6B7280]">
          Select which vehicle types you are available to drive
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {VEHICLE_OPTIONS.map((vehicle) => (
            <label
              key={vehicle.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                selectedVehicles.includes(vehicle.id)
                  ? "border-[#D4145A]/30 bg-[#D4145A]/5"
                  : "border-[#E5E7EB] hover:bg-[#F5F7FA]"
              )}
            >
              <Checkbox
                checked={selectedVehicles.includes(vehicle.id)}
                onCheckedChange={() => toggleVehicle(vehicle.id)}
              />
              <span className="text-sm font-medium text-[#172F52]">
                {vehicle.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
