"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeftRight, Plus, Route, Save, Search, Trash2, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VEHICLE_TYPES, UK_AIRPORTS } from "@/constants"
import {
  findRouteFare,
  getRouteFares,
  newRouteFareId,
  parseAreas,
  saveRouteFares,
} from "@/lib/services/route-fare-service"
import type { Location, RouteFare, VehicleType } from "@/types"

const UK_POSTCODE_IN_TEXT = /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i

function emptyDraft() {
  return {
    fromLabel: "",
    fromAreas: "",
    toLabel: "",
    toAreas: "",
    bothWays: true,
    prices: {} as Partial<Record<VehicleType, string>>,
  }
}

/** Turn free text ("10 Downing St, SW1A 2AA" or "LHR") into a Location we can test against routes. */
function textToLocation(text: string): Location {
  const postcode = text.match(UK_POSTCODE_IN_TEXT)?.[1]?.toUpperCase() ?? ""
  const code = text.trim().toUpperCase()
  const airport = UK_AIRPORTS.find((a) => a.code === code)
  return {
    formattedAddress: airport ? `${airport.name} (${airport.code})` : text,
    postcode: airport ? `${airport.postcode} 1AA` : postcode,
    city: "",
    country: "UK",
    latitude: 0,
    longitude: 0,
    placeId: "",
  }
}

function toPrice(v: string | undefined): number | undefined {
  if (v === undefined || v.trim() === "") return undefined
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : undefined
}

export function RouteFaresEditor() {
  const [routes, setRoutes] = useState<RouteFare[]>([])
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [draft, setDraft] = useState(emptyDraft)
  const [testFrom, setTestFrom] = useState("")
  const [testTo, setTestTo] = useState("")

  useEffect(() => {
    getRouteFares()
      .then(setRoutes)
      .finally(() => setLoading(false))
  }, [])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return routes
    return routes.filter((r) =>
      [r.fromLabel, r.toLabel, ...r.fromAreas, ...r.toAreas].some((t) => t.toLowerCase().includes(q))
    )
  }, [routes, search])

  const testResults = useMemo(() => {
    if (!testFrom.trim() || !testTo.trim()) return null
    const pickup = textToLocation(testFrom)
    const dest = textToLocation(testTo)
    return VEHICLE_TYPES.map((vt) => {
      const hit = findRouteFare(routes, pickup, dest, vt.value)
      return { label: vt.label, price: hit?.price, route: hit?.route }
    })
  }, [routes, testFrom, testTo])

  function patchRoute(id: string, patch: Partial<RouteFare>) {
    setRoutes((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    setDirty(true)
  }

  function setRoutePrice(route: RouteFare, type: VehicleType, value: string) {
    const prices = { ...route.prices }
    const n = toPrice(value)
    if (n === undefined) delete prices[type]
    else prices[type] = n
    patchRoute(route.id, { prices })
  }

  function removeRoute(id: string) {
    setRoutes((rs) => rs.filter((r) => r.id !== id))
    setDirty(true)
  }

  const draftValid =
    draft.fromLabel.trim() &&
    parseAreas(draft.fromAreas).length > 0 &&
    draft.toLabel.trim() &&
    parseAreas(draft.toAreas).length > 0 &&
    Object.values(draft.prices).some((v) => toPrice(v) !== undefined)

  function addRoute() {
    if (!draftValid) return
    const prices: Partial<Record<VehicleType, number>> = {}
    for (const [k, v] of Object.entries(draft.prices)) {
      const n = toPrice(v)
      if (n !== undefined) prices[k as VehicleType] = n
    }
    setRoutes((rs) => [
      ...rs,
      {
        id: newRouteFareId(),
        fromLabel: draft.fromLabel.trim(),
        fromAreas: parseAreas(draft.fromAreas),
        toLabel: draft.toLabel.trim(),
        toAreas: parseAreas(draft.toAreas),
        bothWays: draft.bothWays,
        active: true,
        prices,
      },
    ])
    setDraft(emptyDraft())
    setDirty(true)
  }

  async function save() {
    setSaving(true)
    setStatus(null)
    try {
      await saveRouteFares(routes)
      setDirty(false)
      setStatus("Saved. Customers now see these fares.")
    } catch (err) {
      console.error(err)
      setStatus("Could not save to the server. Check your connection and admin access, then try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#E2E6EC] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E6EC] p-5">
        <div className="flex items-center gap-2">
          <Route className="h-5 w-5 text-[#1F4FD8]" />
          <div>
            <h3 className="text-base font-bold text-[#0F1B2D]">Fixed route fares</h3>
            <p className="text-xs text-[#5B6577]">
              Set a fixed price from one point to another for each car type. Journeys that match a route use this
              price; all others use the mileage rates.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[#5B6577]" />
            <Input
              aria-label="Search routes"
              placeholder="Search routes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-56 pl-8"
            />
          </div>
          <Button
            onClick={save}
            disabled={!dirty || saving}
            className="bg-[#1F4FD8] text-white hover:bg-[#1F4FD8]/90"
          >
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? "Saving..." : dirty ? "Save route fares" : "Saved"}
          </Button>
        </div>
      </div>

      {status && (
        <p
          role="status"
          className={cn(
            "mx-5 mt-4 rounded-lg px-3 py-2 text-sm",
            status.startsWith("Saved") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}
        >
          {status}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#E2E6EC] bg-[#F4F6F9] text-xs font-semibold uppercase tracking-wider text-[#5B6577]">
              <th className="px-4 py-3">From</th>
              <th className="px-3 py-3">To</th>
              {VEHICLE_TYPES.map((vt) => (
                <th key={vt.value} className="px-2 py-3 whitespace-nowrap">
                  {vt.label} £
                </th>
              ))}
              <th className="px-2 py-3">Both ways</th>
              <th className="px-2 py-3">On</th>
              <th className="px-2 py-3">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={VEHICLE_TYPES.length + 5} className="px-4 py-6 text-center text-[#5B6577]">
                  Loading route fares...
                </td>
              </tr>
            )}
            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={VEHICLE_TYPES.length + 5} className="px-4 py-6 text-center text-[#5B6577]">
                  {routes.length === 0
                    ? "No fixed routes yet. Add your first route below, e.g. Central London to Heathrow."
                    : "No routes match your search."}
                </td>
              </tr>
            )}
            {visible.map((r) => (
              <tr key={r.id} className={cn("border-b border-[#F4F6F9] align-top", !r.active && "opacity-60")}>
                <td className="px-4 py-2">
                  <Input
                    aria-label="From name"
                    value={r.fromLabel}
                    onChange={(e) => patchRoute(r.id, { fromLabel: e.target.value })}
                    className="h-8 w-40 font-medium"
                  />
                  <Input
                    aria-label="From areas"
                    value={r.fromAreas.join(", ")}
                    onChange={(e) => patchRoute(r.id, { fromAreas: parseAreas(e.target.value) })}
                    className="mt-1 h-7 w-40 text-xs text-[#5B6577]"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    aria-label="To name"
                    value={r.toLabel}
                    onChange={(e) => patchRoute(r.id, { toLabel: e.target.value })}
                    className="h-8 w-36 font-medium"
                  />
                  <Input
                    aria-label="To areas"
                    value={r.toAreas.join(", ")}
                    onChange={(e) => patchRoute(r.id, { toAreas: parseAreas(e.target.value) })}
                    className="mt-1 h-7 w-36 text-xs text-[#5B6577]"
                  />
                </td>
                {VEHICLE_TYPES.map((vt) => (
                  <td key={vt.value} className="px-2 py-2">
                    <Input
                      aria-label={`${vt.label} fare`}
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={r.prices[vt.value] ?? ""}
                      onBlur={(e) => setRoutePrice(r, vt.value, e.target.value)}
                      placeholder="—"
                      className="h-8 w-20"
                    />
                  </td>
                ))}
                <td className="px-2 py-3">
                  <input
                    type="checkbox"
                    aria-label="Same fare both directions"
                    checked={r.bothWays}
                    onChange={(e) => patchRoute(r.id, { bothWays: e.target.checked })}
                    className="h-4 w-4 accent-[#1F4FD8]"
                  />
                </td>
                <td className="px-2 py-3">
                  <input
                    type="checkbox"
                    aria-label="Route active"
                    checked={r.active}
                    onChange={(e) => patchRoute(r.id, { active: e.target.checked })}
                    className="h-4 w-4 accent-[#1F4FD8]"
                  />
                </td>
                <td className="px-2 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove route ${r.fromLabel} to ${r.toLabel}`}
                    onClick={() => removeRoute(r.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 border-t border-[#E2E6EC] p-5 lg:grid-cols-[2fr_1fr]">
        <div>
          <h4 className="mb-3 text-sm font-bold text-[#0F1B2D]">Add a route</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-[#0F1B2D]">
              From (name)
              <Input
                value={draft.fromLabel}
                onChange={(e) => setDraft({ ...draft, fromLabel: e.target.value })}
                placeholder="Central London"
                className="mt-1 h-9"
              />
            </label>
            <label className="text-xs font-medium text-[#0F1B2D]">
              To (name)
              <Input
                value={draft.toLabel}
                onChange={(e) => setDraft({ ...draft, toLabel: e.target.value })}
                placeholder="Heathrow Airport"
                className="mt-1 h-9"
              />
            </label>
            <label className="text-xs font-medium text-[#0F1B2D]">
              From areas: postcodes, towns or airport codes
              <Input
                value={draft.fromAreas}
                onChange={(e) => setDraft({ ...draft, fromAreas: e.target.value })}
                placeholder="SW1, W1, WC1, WC2, EC"
                className="mt-1 h-9"
              />
            </label>
            <label className="text-xs font-medium text-[#0F1B2D]">
              To areas
              <Input
                value={draft.toAreas}
                onChange={(e) => setDraft({ ...draft, toAreas: e.target.value })}
                placeholder="LHR"
                className="mt-1 h-9"
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-[#5B6577]">
            Airport codes: {UK_AIRPORTS.map((a) => a.code).join(", ")}. &ldquo;SW1&rdquo; covers SW1A, SW1P etc.
            &ldquo;RG&rdquo; covers the whole RG area.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {VEHICLE_TYPES.map((vt) => (
              <label key={vt.value} className="text-xs font-medium text-[#0F1B2D]">
                {vt.label} £
                <Input
                  type="number"
                  min={0}
                  value={draft.prices[vt.value] ?? ""}
                  onChange={(e) => setDraft({ ...draft, prices: { ...draft.prices, [vt.value]: e.target.value } })}
                  className="mt-1 h-9"
                />
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-[#0F1B2D]">
              <input
                type="checkbox"
                checked={draft.bothWays}
                onChange={(e) => setDraft({ ...draft, bothWays: e.target.checked })}
                className="h-4 w-4 accent-[#1F4FD8]"
              />
              <ArrowLeftRight className="h-4 w-4" /> Same fare in both directions
            </label>
            <Button onClick={addRoute} disabled={!draftValid} className="bg-[#0F1B2D] text-white hover:bg-[#0F1B2D]/90">
              <Plus className="mr-1.5 h-4 w-4" /> Add route
            </Button>
          </div>
        </div>

        <div className="rounded-lg bg-[#F4F6F9] p-4">
          <h4 className="mb-3 text-sm font-bold text-[#0F1B2D]">Check a fare</h4>
          <div className="space-y-2">
            <Input
              aria-label="Test pick-up"
              value={testFrom}
              onChange={(e) => setTestFrom(e.target.value)}
              placeholder="Pick-up, e.g. SW1A 2AA"
              className="h-9 bg-white"
            />
            <Input
              aria-label="Test drop-off"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="Drop-off, e.g. LHR"
              className="h-9 bg-white"
            />
          </div>
          {testResults && (
            <ul className="mt-3 space-y-1 text-sm">
              {testResults.map((t) => (
                <li key={t.label} className="flex justify-between gap-2">
                  <span className="text-[#5B6577]">{t.label}</span>
                  {t.price !== undefined ? (
                    <span className="flex items-center gap-1 font-semibold text-[#0F1B2D]">
                      <CheckCircle className="h-3.5 w-3.5 text-green-600" />£{t.price.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-xs text-[#5B6577]">mileage rate</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {dirty && <p className="mt-3 text-xs text-amber-700">Unsaved changes are included in this check.</p>}
        </div>
      </div>
    </div>
  )
}
