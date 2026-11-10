"use client"

import { useState, useMemo, useEffect } from "react"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VEHICLE_TYPES } from "@/constants"
import { RouteFaresEditor } from "@/components/admin/RouteFaresEditor"
import { ExtrasPricingEditor } from "@/components/admin/ExtrasPricingEditor"
import {
  DEFAULT_PRICING_SETTINGS,
  getPricingSettings,
  savePricingSettings,
} from "@/lib/services/pricing-settings-service"
import {
  DEFAULT_VEHICLE_RATES,
  getVehicleRates,
  saveVehicleRates,
  type VehicleRate,
} from "@/lib/services/vehicle-service"

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

type RateField = "baseFare" | "perMile" | "perMinute" | "minimumFare"

/** Make sure every car type has a row, keeping saved values (and booking fees) as they are. */
function withAllVehicleTypes(saved: VehicleRate[] | null): VehicleRate[] {
  const list = saved && saved.length > 0 ? saved : DEFAULT_VEHICLE_RATES
  const byType = new Map(list.map((r) => [r.vehicleType, r]))
  const merged = VEHICLE_TYPES.map((vt) => {
    const existing = byType.get(vt.value)
    if (existing) return existing
    return DEFAULT_VEHICLE_RATES.find((d) => d.vehicleType === vt.value) ?? {
      vehicleType: vt.value,
      label: vt.label,
      baseFare: 0,
      perMile: 0,
      perMinute: 0,
      minimumFare: 0,
      bookingFee: 0,
    }
  })
  // Keep any saved rows for car types not in the list above.
  for (const r of list) if (!merged.some((m) => m.vehicleType === r.vehicleType)) merged.push(r)
  return merged
}

export default function AdminPricingPage() {
  const [commission, setCommission] = useState<CommissionSettings>(DEFAULT_PRICING_SETTINGS.commission)
  const [surcharges, setSurcharges] = useState<Surcharges>(DEFAULT_PRICING_SETTINGS.surcharges)
  const [rates, setRates] = useState<VehicleRate[]>(() => withAllVehicleTypes(null))
  const [minimumFare, setMinimumFare] = useState(DEFAULT_PRICING_SETTINGS.globalMinimumFare)
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getPricingSettings(),
      getVehicleRates().catch((err) => {
        console.error("Could not load vehicle rates", err)
        return null
      }),
    ]).then(([settings, savedRates]) => {
      if (cancelled) return
      setCommission(settings.commission)
      setSurcharges(settings.surcharges)
      setMinimumFare(settings.globalMinimumFare)
      setRates(withAllVehicleTypes(savedRates))
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Any edit marks the page as having unsaved changes.
  function edit<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v)
      setDirty(true)
      setStatus(null)
    }
  }
  const editCommission = edit(setCommission)
  const editSurcharges = edit(setSurcharges)
  const editMinimumFare = edit(setMinimumFare)

  function updateRate(vehicleType: string, field: RateField, value: number) {
    setRates((prev) => prev.map((r) => (r.vehicleType === vehicleType ? { ...r, [field]: value } : r)))
    setDirty(true)
    setStatus(null)
  }

  const vehiclePricing = useMemo(
    () => Object.fromEntries(rates.map((r) => [r.vehicleType, r])) as Record<string, VehicleRate>,
    [rates]
  )

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

  async function handleSave() {
    setSaving(true)
    setStatus(null)
    try {
      const clean = (n: number) => (Number.isFinite(n) && n >= 0 ? n : 0)
      await Promise.all([
        savePricingSettings({ commission, surcharges, globalMinimumFare: minimumFare }),
        saveVehicleRates(
          rates.map((r) => ({
            ...r,
            baseFare: clean(r.baseFare),
            perMile: clean(r.perMile),
            perMinute: clean(r.perMinute),
            minimumFare: clean(r.minimumFare),
          }))
        ),
      ])
      setDirty(false)
      setStatus({ ok: true, text: "Saved. Your changes are stored and will still be here after a refresh." })
    } catch (err) {
      console.error(err)
      setStatus({ ok: false, text: "Could not save. Check your connection and admin login, then try again." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Pricing</h1>
          <p className="text-sm text-[#5B6577]">Configure platform pricing rules and surcharges</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={loading || saving || !dirty}
          className="bg-[#1F4FD8] text-white hover:bg-[#1F4FD8]/90"
        >
          <Save className="mr-1.5 h-4 w-4" />
          {loading ? "Loading..." : saving ? "Saving..." : dirty ? "Save Settings" : "Saved"}
        </Button>
      </div>
      {status && (
        <p role="status" className={status.ok ? "text-sm text-green-700" : "text-sm text-red-700"}>
          {status.text}
        </p>
      )}

      {/* Fixed point-to-point fares per car type */}
      <RouteFaresEditor />

      {/* Optional extras (meet & greet, child seat, return discount) */}
      <ExtrasPricingEditor />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Commission */}
        <div className="rounded-xl border border-[#E2E6EC] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#0F1B2D]" />
            <h3 className="text-base font-bold text-[#0F1B2D]">Platform Commission</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F1B2D]">Commission Percentage (%)</label>
              <Input
                type="number"
                value={commission.percent}
                onChange={(e) => editCommission({ ...commission, percent: Number(e.target.value) })}
                className="h-9"
                min={0}
                max={50}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F1B2D]">Flat Fee Per Transaction (£)</label>
              <Input
                type="number"
                value={commission.flatFee}
                onChange={(e) => editCommission({ ...commission, flatFee: Number(e.target.value) })}
                className="h-9"
                min={0}
                step={0.25}
              />
            </div>
          </div>
        </div>

        {/* Surcharges */}
        <div className="rounded-xl border border-[#E2E6EC] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#1F4FD8]" />
            <h3 className="text-base font-bold text-[#0F1B2D]">Surcharge Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[#0F1B2D]">
                  <Moon className="h-3.5 w-3.5" /> Night Surcharge (%)
                </label>
                <Input
                  type="number"
                  value={surcharges.night}
                  onChange={(e) => editSurcharges({ ...surcharges, night: Number(e.target.value) })}
                  className="h-9"
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[#0F1B2D]">
                  <Sun className="h-3.5 w-3.5" /> Weekend Surcharge (%)
                </label>
                <Input
                  type="number"
                  value={surcharges.weekend}
                  onChange={(e) => editSurcharges({ ...surcharges, weekend: Number(e.target.value) })}
                  className="h-9"
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[#0F1B2D]">
                  <Clock className="h-3.5 w-3.5" /> Peak Time Surcharge (%)
                </label>
                <Input
                  type="number"
                  value={surcharges.peak}
                  onChange={(e) => editSurcharges({ ...surcharges, peak: Number(e.target.value) })}
                  className="h-9"
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[#0F1B2D]">
                  <Plane className="h-3.5 w-3.5" /> Airport Fee (£)
                </label>
                <Input
                  type="number"
                  value={surcharges.airport}
                  onChange={(e) => editSurcharges({ ...surcharges, airport: Number(e.target.value) })}
                  className="h-9"
                  min={0}
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[#0F1B2D]">
                  <MapPin className="h-3.5 w-3.5" /> Congestion Charge (£)
                </label>
                <Input
                  type="number"
                  value={surcharges.congestion}
                  onChange={(e) => editSurcharges({ ...surcharges, congestion: Number(e.target.value) })}
                  className="h-9"
                  min={0}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Base Pricing */}
      <div className="rounded-xl border border-[#E2E6EC] bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Car className="h-5 w-5 text-[#0F1B2D]" />
          <h3 className="text-base font-bold text-[#0F1B2D]">Vehicle Category Base Pricing</h3>
        </div>
        <p className="-mt-2 mb-4 text-xs text-[#5B6577]">
          These are the per-mile rates customers are charged outside the fixed London routes (same as Vehicles &amp; Rates).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E2E6EC] bg-[#F4F6F9]">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Vehicle Type</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Base Fare (£)</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Per Mile (£)</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Per Minute (£)</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Min Fare (£)</th>
              </tr>
            </thead>
            <tbody>
              {VEHICLE_TYPES.map((vt) => {
                const vp = vehiclePricing[vt.value]
                if (!vp) return null
                return (
                  <tr key={vt.value} className="border-b border-[#F4F6F9] last:border-0 hover:bg-[#F4F6F9]/50">
                    <td className="px-4 py-3 font-medium text-[#0F1B2D]">
                      <span className="mr-2">{vt.icon}</span>
                      {vt.label}
                    </td>
                    {(["baseFare", "perMile", "perMinute", "minimumFare"] as const).map((field) => (
                      <td key={field} className="px-4 py-3">
                        <Input
                          type="number"
                          value={vp[field]}
                          onChange={(e) => updateRate(vt.value, field, Number(e.target.value))}
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
        <div className="mt-4 flex items-center gap-2 border-t border-[#F4F6F9] pt-4">
          <span className="text-sm font-medium text-[#0F1B2D]">Global Minimum Fare: £</span>
          <Input
            type="number"
            value={minimumFare}
            onChange={(e) => editMinimumFare(Number(e.target.value))}
            className="h-8 w-24 text-sm"
            min={0}
          />
        </div>
      </div>

      {/* Pricing Preview */}
      <div className="rounded-xl border border-[#E2E6EC] bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-[#1F4FD8]" />
          <h3 className="text-base font-bold text-[#0F1B2D]">Pricing Preview</h3>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1.5 block text-sm font-medium text-[#0F1B2D]">Distance (miles)</label>
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
            <label className="mb-1.5 block text-sm font-medium text-[#0F1B2D]">Vehicle Type</label>
            <select
              value={previewVehicle}
              onChange={(e) => setPreviewVehicle(e.target.value)}
              className="h-9 w-full rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]"
            >
              {VEHICLE_TYPES.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
        {previewEstimate && (
          <div className="mt-4 rounded-lg bg-[#F4F6F9] p-4">
            <h4 className="mb-3 text-sm font-bold text-[#0F1B2D]">Estimated Price Breakdown</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#5B6577]">Base Fare</span>
                <span className="text-[#0F1B2D]">£{previewEstimate.base.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B6577]">Distance ({previewDistance} miles)</span>
                <span className="text-[#0F1B2D]">£{previewEstimate.distanceCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B6577]">Time Estimate</span>
                <span className="text-[#0F1B2D]">£{previewEstimate.timeCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-[#E2E6EC] pt-2">
                <span className="text-[#5B6577]">Subtotal</span>
                <span className="font-semibold text-[#0F1B2D]">£{previewEstimate.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B6577]">Platform Commission ({commission.percent}% + £{commission.flatFee.toFixed(2)})</span>
                <span className="text-[#0F1B2D]">£{previewEstimate.commissionAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-[#E2E6EC] pt-2">
                <span className="font-bold text-[#0F1B2D]">Estimated Total</span>
                <span className="text-lg font-bold text-[#1F4FD8]">£{previewEstimate.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
        {!previewEstimate && (
          <p className="mt-3 text-sm text-[#5B6577]">Enter a distance to see an estimated price breakdown.</p>
        )}
      </div>
    </div>
  )
}
