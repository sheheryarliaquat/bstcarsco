"use client"

import { useEffect, useState } from "react"
import { Baby, Repeat, Save, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DEFAULT_EXTRAS_PRICING,
  getExtrasPricing,
  saveExtrasPricing,
} from "@/lib/services/extras-service"
import type { BookingExtrasPricing } from "@/types"

const FIELDS: {
  key: keyof BookingExtrasPricing
  label: string
  hint: string
  unit: "£" | "%"
  icon: typeof Baby
}[] = [
  { key: "meetAndGreet", label: "Meet & greet", hint: "Driver waits in arrivals with a name board. Charged per journey.", unit: "£", icon: UserCheck },
  { key: "childSeat", label: "Child seat", hint: "Charged per journey.", unit: "£", icon: Baby },
  { key: "returnDiscountPercent", label: "Return trip discount", hint: "Taken off the fare when a customer books a return.", unit: "%", icon: Repeat },
]

export function ExtrasPricingEditor() {
  const [pricing, setPricing] = useState<BookingExtrasPricing>(DEFAULT_EXTRAS_PRICING)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    getExtrasPricing().then(setPricing)
  }, [])

  async function save() {
    setSaving(true)
    setStatus(null)
    try {
      await saveExtrasPricing(pricing)
      setDirty(false)
      setStatus("Saved.")
    } catch (err) {
      console.error(err)
      setStatus("Could not save. Check your connection and admin access, then try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#E2E6EC] bg-white p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#0F1B2D]">Extras customers can add</h3>
          <p className="text-xs text-[#5B6577]">Shown with the price on the booking page. Leave at 0 to offer it free.</p>
        </div>
        <Button onClick={save} disabled={!dirty || saving} className="bg-[#1F4FD8] text-white hover:bg-[#1F4FD8]/90">
          <Save className="mr-1.5 h-4 w-4" />
          {saving ? "Saving..." : dirty ? "Save extras" : "Saved"}
        </Button>
      </div>
      {status && (
        <p role="status" className={status === "Saved." ? "mb-3 text-sm text-green-700" : "mb-3 text-sm text-red-700"}>
          {status}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {FIELDS.map((f) => (
          <label key={f.key} className="block rounded-lg bg-[#F4F6F9] p-4">
            <span className="flex items-center gap-2 text-sm font-semibold text-[#0F1B2D]">
              <f.icon className="h-4 w-4 text-[#1F4FD8]" />
              {f.label} ({f.unit})
            </span>
            <Input
              type="number"
              min={0}
              max={f.unit === "%" ? 100 : undefined}
              step={f.unit === "%" ? 1 : 0.5}
              value={pricing[f.key]}
              onChange={(e) => {
                setPricing({ ...pricing, [f.key]: Math.max(0, Number(e.target.value) || 0) })
                setDirty(true)
              }}
              className="mt-2 h-9 bg-white"
            />
            <span className="mt-1.5 block text-xs text-[#5B6577]">{f.hint}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
