"use client"

import { useState, useMemo } from "react"
import {
  Settings,
  Save,
  Calculator,
  Car,
  Moon,
  Sun,
  Plane,
  MapPin,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VEHICLE_TYPES, PRICING_DEFAULTS } from "@/constants"
import type { PricingRule } from "@/types"

interface Surcharges {
  night: number
  weekend: number
  peak: number
  airport: number
  congestion: number
}

interface CommissionSettings {
  percent: number
  flatFee: number
}

const INITIAL_VEHICLE_PRICING: Record<string, { baseFare: number; perMile: number; perMinute: number; minimumFare: number }> = {
  saloon: { baseFare: 3.5, perMile: 1.8, perMinute: 0.3, minimumFare: 5.0 },
  executive: { baseFare: 5.0, perMile: 2.2, perMinute: 0.35, minimumFare: 8.0 },
  estate: { baseFare: 3.5, perMile: 1.8, perMinute: 0.3, minimumFare: 5.5 },
  mpv: { baseFare: 4.0, perMile: 2.0, perMinute: 0.3, minimumFare: 6.0 },
  minibus: { baseFare: 5.0, perMile: 2.5, perMinute: 0.4, minimumFare: 8.0 },
  electric: { baseFare: 2.5, perMile: 1.4, perMinute: 0.2, minimumFare: 4.5 },
  wheelchair_accessible: { baseFare: 3.0, perMile: 1.5, perMinute: 0.25, minimumFare: 4.5 },
}

export default function AdminPricingPage() {
  const [commission, setCommission] = useState<CommissionSettings>({ percent: 15, flatFee: 0.5 })
  const [surcharges, setSurcharges] = useState<Surcharges>({
    night: 20,
    weekend: 10,
    peak: 25,
    airport: 5,
    congestion: 15,
  })
  const [vehiclePricing, setVehiclePricing] = useState(INITIAL_VEHICLE_PRICING)
  const [minimumFare, setMinimumFare] = useState(5.0)
  const [saved, setSaved] = useState(false)

  const [previewDistance, setPreviewDistance] = useState("")
  const [previewVehicle, setPreviewVehicle] = useState("saloon")

  const previewEstimate = useMemo(() => {
    const dist = parseFloat(previewDistance)
    if (isNaN(dist) || dist <= 0) return null
    const vp = vehiclePricing[previewVehicle]
    if (!vp) return null
    const base = vp.baseFare
    const distanceCharge = dist * vp.perMile
    const timeCharge = (dist * 3) * vp.perMinute
    let subtotal = base + distanceCharge + timeCharge
    subtotal = Math.max(subtotal, minimumFare)
    const nightCharge = subtotal * (surcharges.night / 100)
    const commissionAmount = subtotal * (commission.percent / 100) + commission.flatFee
    const total = subtotal + commissionAmount
    return { base, distanceCharge, timeCharge, subtotal, nightCharge, commissionAmount, total }
  }, [previewDistance, previewVehicle, vehiclePricing, minimumFare, surcharges, commission])

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Pricing</h1>
          <p className="text-sm text-[#6B7280]">Configure platform pricing rules and surcharges</p>
        </div>
        <Button onClick={handleSave} className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90">
          <Save className="mr-1.5 h-4 w-4" />
          {saved ? "Saved!" : "Save Settings"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Commission */}
        <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#172F52]" />
            <h3 className="text-base font-bold text-[#172F52]">Platform Commission</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Commission Percentage (%)</label>
              <Input
                type="number"
                value={commission.percent}
                onChange={(e) => setCommission({ ...commission, percent: Number(e.target.value) })}
                className="h-9"
                min={0}
                max={50}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Flat Fee Per Transaction (£)</label>
              <Input
                type="number"
                value={commission.flatFee}
                onChange={(e) => setCommission({ ...commission, flatFee: Number(e.target.value) })}
                className="h-9"
                min={0}
                step={0.25}
              />
            </div>
          </div>
        </div>

        {/* Surcharges */}
        <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#D4145A]" />
            <h3 className="text-base font-bold text-[#172F52]">Surcharge Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[#172F52]">
                  <Moon className="h-3.5 w-3.5" /> Night Surcharge (%)
                </label>
                <Input
                  type="number"
                  value={surcharges.night}
                  onChange={(e) => setSurcharges({ ...surcharges, night: Number(e.target.value) })}
                  className="h-9"
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[#172F52]">
                  <Sun className="h-3.5 w-3.5" /> Weekend Surcharge (%)
                </label>
                <Input
                  type="number"
                  value={surcharges.weekend}
                  onChange={(e) => setSurcharges({ ...surcharges, weekend: Number(e.target.value) })}
                  className="h-9"
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[#172F52]">
                  <Clock className="h-3.5 w-3.5" /> Peak Time Surcharge (%)
                </label>
                <Input
                  type="number"
                  value={surcharges.peak}
                  onChange={(e) => setSurcharges({ ...surcharges, peak: Number(e.target.value) })}
                  className="h-9"
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[#172F52]">
                  <Plane className="h-3.5 w-3.5" /> Airport Fee (£)
                </label>
                <Input
                  type="number"
                  value={surcharges.airport}
                  onChange={(e) => setSurcharges({ ...surcharges, airport: Number(e.target.value) })}
                  className="h-9"
                  min={0}
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[#172F52]">
                  <MapPin className="h-3.5 w-3.5" /> Congestion Charge (£)
                </label>
                <Input
                  type="number"
                  value={surcharges.congestion}
                  onChange={(e) => setSurcharges({ ...surcharges, congestion: Number(e.target.value) })}
                  className="h-9"
                  min={0}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Base Pricing */}
      <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Car className="h-5 w-5 text-[#172F52]" />
          <h3 className="text-base font-bold text-[#172F52]">Vehicle Category Base Pricing</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#D9E0E8] bg-[#F5F7FA]">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Vehicle Type</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Base Fare (£)</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Per Mile (£)</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Per Minute (£)</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Min Fare (£)</th>
              </tr>
            </thead>
            <tbody>
              {VEHICLE_TYPES.map((vt) => {
                const vp = vehiclePricing[vt.value]
                if (!vp) return null
                return (
                  <tr key={vt.value} className="border-b border-[#F5F7FA] last:border-0 hover:bg-[#F5F7FA]/50">
                    <td className="px-4 py-3 font-medium text-[#172F52]">
                      <span className="mr-2">{vt.icon}</span>
                      {vt.label}
                    </td>
                    {(["baseFare", "perMile", "perMinute", "minimumFare"] as const).map((field) => (
                      <td key={field} className="px-4 py-3">
                        <Input
                          type="number"
                          value={vp[field]}
                          onChange={(e) =>
                            setVehiclePricing({
                              ...vehiclePricing,
                              [vt.value]: { ...vp, [field]: Number(e.target.value) },
                            })
                          }
                          className="h-8 w-24 text-sm"
                          min={0}
                          step={0.1}
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-[#F5F7FA] pt-4">
          <span className="text-sm font-medium text-[#172F52]">Global Minimum Fare: £</span>
          <Input
            type="number"
            value={minimumFare}
            onChange={(e) => setMinimumFare(Number(e.target.value))}
            className="h-8 w-24 text-sm"
            min={0}
          />
        </div>
      </div>

      {/* Pricing Preview */}
      <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-[#D4145A]" />
          <h3 className="text-base font-bold text-[#172F52]">Pricing Preview</h3>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Distance (miles)</label>
            <Input
              type="number"
              value={previewDistance}
              onChange={(e) => setPreviewDistance(e.target.value)}
              placeholder="e.g. 15"
              className="h-9"
              min={0}
            />
          </div>
          <div className="min-w-[180px]">
            <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Vehicle Type</label>
            <select
              value={previewVehicle}
              onChange={(e) => setPreviewVehicle(e.target.value)}
              className="h-9 w-full rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
            >
              {VEHICLE_TYPES.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
        {previewEstimate && (
          <div className="mt-4 rounded-lg bg-[#F5F7FA] p-4">
            <h4 className="mb-3 text-sm font-bold text-[#172F52]">Estimated Price Breakdown</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Base Fare</span>
                <span className="text-[#172F52]">£{previewEstimate.base.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Distance ({previewDistance} miles)</span>
                <span className="text-[#172F52]">£{previewEstimate.distanceCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Time Estimate</span>
                <span className="text-[#172F52]">£{previewEstimate.timeCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-[#D9E0E8] pt-2">
                <span className="text-[#6B7280]">Subtotal</span>
                <span className="font-semibold text-[#172F52]">£{previewEstimate.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Platform Commission ({commission.percent}% + £{commission.flatFee.toFixed(2)})</span>
                <span className="text-[#172F52]">£{previewEstimate.commissionAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-[#D9E0E8] pt-2">
                <span className="font-bold text-[#172F52]">Estimated Total</span>
                <span className="text-lg font-bold text-[#D4145A]">£{previewEstimate.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
        {!previewEstimate && (
          <p className="mt-3 text-sm text-[#6B7280]">Enter a distance to see an estimated price breakdown.</p>
        )}
      </div>
    </div>
  )
}
