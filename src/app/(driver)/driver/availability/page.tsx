"use client"

import { useState, useEffect } from "react"
import { Clock, Save, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { getDriver, updateDriver } from "@/lib/services/driver-service"
import type { DriverAvailability } from "@/types"

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

const EMPTY_AVAILABILITY: DriverAvailability = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
}

export default function DriverAvailabilityPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(false)
  const [availability, setAvailability] = useState<DriverAvailability>(EMPTY_AVAILABILITY)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    getDriver(user.uid)
      .then((profile) => {
        setIsOnline(profile?.status === "online")
        if (profile?.availability) setAvailability(profile.availability)
      })
      .finally(() => setLoading(false))
  }, [user])

  function toggleDay(day: (typeof DAYS)[number]) {
    setAvailability((prev) => ({
      ...prev,
      [day]: prev[day].length > 0 ? [] : [{ start: "06:00", end: "22:00" }],
    }))
  }

  function updateTime(day: (typeof DAYS)[number], field: "start" | "end", value: string) {
    setAvailability((prev) => {
      const slot = prev[day][0] ?? { start: "06:00", end: "22:00" }
      return { ...prev, [day]: [{ ...slot, [field]: value }] }
    })
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      await updateDriver(user.uid, {
        availability,
        status: isOnline ? "online" : "offline",
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4145A]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Availability</h1>
          <p className="text-sm text-[#6B7280]">
            Manage your working hours and online status
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "text-white",
            saved ? "bg-green-600 hover:bg-green-700" : "bg-[#D4145A] hover:bg-[#D4145A]/90"
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
              {saving ? "Saving..." : "Save Settings"}
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
            const slot = availability[day][0]
            const enabled = availability[day].length > 0
            return (
              <div
                key={day}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between",
                  enabled ? "border-[#E5E7EB] bg-white" : "border-[#E5E7EB] bg-[#F9FAFB] opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  <Switch checked={enabled} onCheckedChange={() => toggleDay(day)} />
                  <span className="w-24 text-sm font-semibold text-[#172F52]">
                    {DAY_LABELS[day]}
                  </span>
                </div>

                {enabled && slot && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={slot.start}
                      onChange={(e) => updateTime(day, "start", e.target.value)}
                      className="h-9 w-32 text-sm"
                    />
                    <span className="text-sm text-[#6B7280]">to</span>
                    <Input
                      type="time"
                      value={slot.end}
                      onChange={(e) => updateTime(day, "end", e.target.value)}
                      className="h-9 w-32 text-sm"
                    />
                  </div>
                )}

                {!enabled && (
                  <Badge variant="outline" className="border-gray-300 text-gray-500">
                    Day Off
                  </Badge>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
