"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Search,
  Eye,
  Trash2,
  Plus,
  Car,
  Users,
  Luggage,
  Zap,
  CheckCircle,
  XCircle,
  Save,
  DollarSign,
  Wrench,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { Modal } from "@/components/shared/Modal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { VEHICLE_TYPES } from "@/constants"
import { listenToVehicles, createVehicle, updateVehicle, deleteVehicle } from "@/lib/services/vehicle-service"
import { listenToUsersByRole } from "@/lib/services/user-service"
import { getPricingRates, savePricingRates, type VehicleRateMap } from "@/lib/services/pricing-rates-service"
import type { Vehicle, VehicleType, VehicleAvailabilityStatus, User as AppUser } from "@/types"

const AVAILABILITY_META: Record<
  VehicleAvailabilityStatus,
  { label: string; badgeClass: string; icon: typeof CheckCircle }
> = {
  available: { label: "Available", badgeClass: "bg-green-50 text-green-700", icon: CheckCircle },
  in_use: { label: "In Use", badgeClass: "bg-amber-50 text-amber-700", icon: Clock },
  out_of_service: { label: "Out of Service", badgeClass: "bg-red-50 text-red-700", icon: Wrench },
}

function getAvailability(v: Vehicle): VehicleAvailabilityStatus {
  return v.availabilityStatus ?? "available"
}

interface VehicleRate {
  vehicleType: VehicleType
  label: string
  baseFare: number
  perMile: number
  perMinute: number
  minimumFare: number
  bookingFee: number
}

const DEFAULT_RATES: VehicleRate[] = [
  { vehicleType: "saloon", label: "Saloon", baseFare: 3.0, perMile: 1.8, perMinute: 0.25, minimumFare: 5.0, bookingFee: 1.0 },
  { vehicleType: "executive", label: "Executive", baseFare: 5.0, perMile: 2.5, perMinute: 0.35, minimumFare: 8.0, bookingFee: 1.5 },
  { vehicleType: "estate", label: "Estate", baseFare: 3.5, perMile: 2.0, perMinute: 0.28, minimumFare: 6.0, bookingFee: 1.0 },
  { vehicleType: "mpv", label: "MPV (6 Seater)", baseFare: 5.0, perMile: 2.2, perMinute: 0.30, minimumFare: 8.0, bookingFee: 1.5 },
  { vehicleType: "minibus", label: "Minibus (8 Seater)", baseFare: 7.0, perMile: 2.8, perMinute: 0.40, minimumFare: 12.0, bookingFee: 2.0 },
  { vehicleType: "electric", label: "Electric", baseFare: 3.0, perMile: 1.6, perMinute: 0.22, minimumFare: 5.0, bookingFee: 1.0 },
  { vehicleType: "wheelchair_accessible", label: "Wheelchair Accessible", baseFare: 4.0, perMile: 2.0, perMinute: 0.28, minimumFare: 6.0, bookingFee: 1.0 },
]

interface NewVehicle {
  make: string
  model: string
  year: number
  registration: string
  colour: string
  vehicleType: VehicleType
  passengerCapacity: number
  luggageCapacity: number
  isElectric: boolean
  isHybrid: boolean
  wheelchairAccessible: boolean
  operatorId: string
}

const EMPTY_VEHICLE: NewVehicle = {
  make: "",
  model: "",
  year: new Date().getFullYear(),
  registration: "",
  colour: "",
  vehicleType: "saloon",
  passengerCapacity: 4,
  luggageCapacity: 2,
  isElectric: false,
  isHybrid: false,
  wheelchairAccessible: false,
  operatorId: "",
}

export default function AdminVehiclesPage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<Vehicle | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newVehicle, setNewVehicle] = useState<NewVehicle>(EMPTY_VEHICLE)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehiclesLoading, setVehiclesLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [drivers, setDrivers] = useState<AppUser[]>([])
  const [operators, setOperators] = useState<AppUser[]>([])
  const [rates, setRates] = useState<VehicleRate[]>(DEFAULT_RATES)
  const [rateSaved, setRateSaved] = useState(false)
  const [rateSaving, setRateSaving] = useState(false)
  const [rateError, setRateError] = useState("")

  useEffect(() => {
    const unsubscribe = listenToVehicles(
      (data) => {
        setVehicles(data)
        setVehiclesLoading(false)
        setLoadError("")
      },
      (err) => {
        console.error("AdminVehiclesPage: listenToVehicles failed —", err)
        setLoadError("Could not load vehicles from the database.")
        setVehiclesLoading(false)
      }
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = listenToUsersByRole(
      "driver",
      (users) => setDrivers(users),
      (err) => console.error("AdminVehiclesPage: listenToUsersByRole failed —", err)
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = listenToUsersByRole(
      "operator",
      (users) => setOperators(users),
      (err) => console.error("AdminVehiclesPage: listenToUsersByRole(operator) failed —", err)
    )
    return unsubscribe
  }, [])

  // Loads the admin-configured rates that /api/quotes actually prices
  // real customer quotes with — falls back to DEFAULT_RATES for any
  // vehicle type nobody has saved an override for yet.
  useEffect(() => {
    getPricingRates()
      .then((saved) => {
        setRates((prev) =>
          prev.map((r) => (saved[r.vehicleType] ? { ...r, ...saved[r.vehicleType] } : r))
        )
      })
      .catch((err) => console.error("AdminVehiclesPage: getPricingRates failed —", err))
  }, [])

  const getOperatorName = (operatorId: string) => {
    if (!operatorId) return "Unassigned"
    const o = operators.find((o) => o.uid === operatorId)
    return o ? (o as unknown as { companyName?: string }).companyName || `${o.firstName} ${o.lastName}` : "Unknown"
  }

  const getDriverName = (driverId: string) => {
    if (!driverId) return "Unassigned"
    const d = drivers.find((d) => d.uid === driverId)
    return d ? `${d.firstName} ${d.lastName}` : "Unknown"
  }

  const filtered = useMemo(() => {
    let result = [...vehicles]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (v) =>
          `${v.make} ${v.model}`.toLowerCase().includes(q) ||
          v.registration.toLowerCase().includes(q) ||
          getOperatorName(v.operatorId).toLowerCase().includes(q)
      )
    }
    if (typeFilter !== "all") {
      result = result.filter((v) => v.vehicleType === typeFilter)
    }
    if (statusFilter !== "all") {
      result = result.filter((v) => (statusFilter === "approved" ? v.isApproved : !v.isApproved))
    }
    if (availabilityFilter !== "all") {
      result = result.filter((v) => getAvailability(v) === availabilityFilter)
    }
    return result
  }, [search, typeFilter, statusFilter, availabilityFilter, vehicles])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const getTypeLabel = (type: VehicleType) => {
    return VEHICLE_TYPES.find((vt) => vt.value === type)?.label ?? type
  }

  async function handleCreateVehicle() {
    if (!newVehicle.make || !newVehicle.model || !newVehicle.registration || !newVehicle.operatorId) {
      setLoadError("Make, model, registration, and operator are all required.")
      return
    }
    const vehicle: Omit<Vehicle, "id" | "createdAt" | "updatedAt"> = {
      operatorId: newVehicle.operatorId,
      driverId: "",
      make: newVehicle.make,
      model: newVehicle.model,
      year: newVehicle.year,
      registration: newVehicle.registration.toUpperCase(),
      colour: newVehicle.colour,
      vehicleType: newVehicle.vehicleType,
      passengerCapacity: newVehicle.passengerCapacity,
      luggageCapacity: newVehicle.luggageCapacity,
      wheelchairAccessible: newVehicle.wheelchairAccessible,
      isElectric: newVehicle.isElectric,
      isHybrid: newVehicle.isHybrid,
      isApproved: false,
      availabilityStatus: "available",
    }
    try {
      await createVehicle(vehicle)
      setNewVehicle(EMPTY_VEHICLE)
      setShowCreate(false)
    } catch (err) {
      console.error("handleCreateVehicle failed —", err)
      setLoadError("Could not save the vehicle. Please try again.")
    }
  }

  async function handleDeleteVehicle() {
    if (!removeTarget) return
    try {
      await deleteVehicle(removeTarget.id)
    } catch (err) {
      console.error("handleDeleteVehicle failed —", err)
      setLoadError("Could not remove the vehicle. Please try again.")
    } finally {
      setRemoveTarget(null)
    }
  }

  async function handleApproveVehicle(vehicle: Vehicle) {
    try {
      await updateVehicle(vehicle.id, { isApproved: true })
    } catch (err) {
      console.error("handleApproveVehicle failed —", err)
    }
  }

  async function handleSetAvailability(vehicle: Vehicle, status: VehicleAvailabilityStatus) {
    const availabilityUpdatedAt = new Date().toISOString()
    // Optimistic update for the open detail modal so the click feels
    // instant — the real-time listener reconciles this from Firestore
    // moments later regardless.
    setSelectedVehicle((prev) =>
      prev && prev.id === vehicle.id ? { ...prev, availabilityStatus: status, availabilityUpdatedAt } : prev
    )
    try {
      await updateVehicle(vehicle.id, { availabilityStatus: status, availabilityUpdatedAt })
    } catch (err) {
      console.error("handleSetAvailability failed —", err)
    }
  }

  function updateRate(index: number, field: keyof VehicleRate, value: number) {
    setRates((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    )
  }

  async function saveRates() {
    setRateSaving(true)
    setRateError("")
    try {
      const rateMap: VehicleRateMap = {}
      for (const r of rates) {
        rateMap[r.vehicleType] = {
          baseFare: r.baseFare,
          perMile: r.perMile,
          perMinute: r.perMinute,
          minimumFare: r.minimumFare,
          bookingFee: r.bookingFee,
        }
      }
      await savePricingRates(rateMap)
      setRateSaved(true)
      setTimeout(() => setRateSaved(false), 2000)
    } catch (err) {
      console.error("saveRates failed —", err)
      setRateError("Could not save rates. Please try again.")
    } finally {
      setRateSaving(false)
    }
  }

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "make",
      header: "Make / Model",
      sortable: true,
      render: (row) => {
        const v = row as unknown as Vehicle
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#172F52]/10">
              <Car className="h-4 w-4 text-[#172F52]" />
            </div>
            <div>
              <span className="font-medium text-[#172F52]">{v.make} {v.model}</span>
              <p className="text-xs text-[#6B7280]">{v.year} · {v.colour}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: "registration",
      header: "Registration",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-[#172F52]">
          {(row as unknown as Vehicle).registration}
        </span>
      ),
    },
    {
      key: "vehicleType",
      header: "Type",
      render: (row) => (
        <span className="rounded-full bg-[#172F52]/10 px-2.5 py-0.5 text-xs font-semibold text-[#172F52]">
          {getTypeLabel((row as unknown as Vehicle).vehicleType)}
        </span>
      ),
    },
    {
      key: "operatorId",
      header: "Operator",
      render: (row) => (
        <span className="text-[#6B7280]">{getOperatorName((row as unknown as Vehicle).operatorId)}</span>
      ),
    },
    {
      key: "capacity",
      header: "Capacity",
      render: (row) => {
        const v = row as unknown as Vehicle
        return (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-sm text-[#6B7280]">
              <Users className="h-3.5 w-3.5" /> {v.passengerCapacity}
            </span>
            <span className="flex items-center gap-1 text-sm text-[#6B7280]">
              <Luggage className="h-3.5 w-3.5" /> {v.luggageCapacity}
            </span>
          </div>
        )
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const v = row as unknown as Vehicle
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              v.isApproved ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
            )}
          >
            {v.isApproved ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {v.isApproved ? "Approved" : "Pending"}
          </span>
        )
      },
    },
    {
      key: "availability",
      header: "Availability",
      render: (row) => {
        const v = row as unknown as Vehicle
        const current = getAvailability(v)
        const meta = AVAILABILITY_META[current]
        const Icon = meta.icon
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", meta.badgeClass)}>
              <Icon className="h-3 w-3" />
              {meta.label}
            </span>
            <select
              aria-label={`Change availability for ${v.make} ${v.model}`}
              value={current}
              onChange={(e) => handleSetAvailability(v, e.target.value as VehicleAvailabilityStatus)}
              className="h-7 rounded-md border border-[#D9E0E8] bg-white px-1.5 text-xs text-[#172F52] outline-none focus:border-[#D4145A]"
            >
              {(Object.keys(AVAILABILITY_META) as VehicleAvailabilityStatus[]).map((status) => (
                <option key={status} value={status}>
                  {AVAILABILITY_META[status].label}
                </option>
              ))}
            </select>
          </div>
        )
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        const v = row as unknown as Vehicle
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); setSelectedVehicle(v); setDetailOpen(true) }}>
              <Eye className="h-3.5 w-3.5 text-[#6B7280]" />
            </Button>
            {!v.isApproved && (
              <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); handleApproveVehicle(v) }}>
                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              </Button>
            )}
            <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); setRemoveTarget(v) }}>
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Vehicles & Rates</h1>
          <p className="text-sm text-[#6B7280]">Manage vehicles and set pricing per vehicle type</p>
        </div>
        <Button className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {loadError}
        </div>
      )}

      {/* Pricing / Rates Section */}
      <div className="rounded-xl border border-[#D9E0E8] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#D4145A]" />
            <h2 className="text-lg font-bold text-[#172F52]">Vehicle Type Rates</h2>
          </div>
          <Button size="sm" className="bg-[#168A55] text-white hover:bg-[#168A55]/90" onClick={saveRates} disabled={rateSaving}>
            {rateSaving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            {rateSaving ? "Saving..." : rateSaved ? "Saved!" : "Save Rates"}
          </Button>
        </div>
        <p className="mb-4 text-sm text-[#6B7280]">
          Set the base fare, per-mile rate, and other charges for each vehicle type. These rates are used to calculate quotes for passengers.
        </p>
        {rateError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {rateError}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#D9E0E8] text-left text-xs font-semibold uppercase text-[#6B7280]">
                <th className="pb-2 pr-4">Vehicle Type</th>
                <th className="pb-2 pr-4">Base Fare (£)</th>
                <th className="pb-2 pr-4">Per Mile (£)</th>
                <th className="pb-2 pr-4">Per Minute (£)</th>
                <th className="pb-2 pr-4">Min Fare (£)</th>
                <th className="pb-2">Booking Fee (£)</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate, idx) => (
                <tr key={rate.vehicleType} className="border-b border-[#F0F2F5]">
                  <td className="py-2.5 pr-4 font-medium text-[#172F52]">{rate.label}</td>
                  <td className="py-2.5 pr-4">
                    <Input
                      type="number"
                      step="0.10"
                      value={rate.baseFare}
                      onChange={(e) => updateRate(idx, "baseFare", parseFloat(e.target.value) || 0)}
                      className="h-8 w-24 text-sm"
                    />
                  </td>
                  <td className="py-2.5 pr-4">
                    <Input
                      type="number"
                      step="0.10"
                      value={rate.perMile}
                      onChange={(e) => updateRate(idx, "perMile", parseFloat(e.target.value) || 0)}
                      className="h-8 w-24 text-sm"
                    />
                  </td>
                  <td className="py-2.5 pr-4">
                    <Input
                      type="number"
                      step="0.05"
                      value={rate.perMinute}
                      onChange={(e) => updateRate(idx, "perMinute", parseFloat(e.target.value) || 0)}
                      className="h-8 w-24 text-sm"
                    />
                  </td>
                  <td className="py-2.5 pr-4">
                    <Input
                      type="number"
                      step="0.10"
                      value={rate.minimumFare}
                      onChange={(e) => updateRate(idx, "minimumFare", parseFloat(e.target.value) || 0)}
                      className="h-8 w-24 text-sm"
                    />
                  </td>
                  <td className="py-2.5">
                    <Input
                      type="number"
                      step="0.10"
                      value={rate.bookingFee}
                      onChange={(e) => updateRate(idx, "bookingFee", parseFloat(e.target.value) || 0)}
                      className="h-8 w-24 text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicle List Section */}
      <div className="rounded-xl border border-[#D9E0E8] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by make, model, or registration..."
              className="h-9 pl-9"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          >
            <option value="all">All Types</option>
            {VEHICLE_TYPES.map((vt) => (
              <option key={vt.value} value={vt.value}>{vt.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={availabilityFilter}
            onChange={(e) => { setAvailabilityFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          >
            <option value="all">All Availability</option>
            {(Object.keys(AVAILABILITY_META) as VehicleAvailabilityStatus[]).map((status) => (
              <option key={status} value={status}>{AVAILABILITY_META[status].label}</option>
            ))}
          </select>
        </div>
      </div>

      {vehiclesLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-[#D9E0E8] bg-white py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#D4145A]" />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={paginated as unknown as Record<string, unknown>[]}
            emptyMessage="No vehicles yet — click Add Vehicle to add the first one"
            keyExtractor={(row) => (row as unknown as Vehicle).id}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6B7280]">
              Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-xs" disabled={page === 1} onClick={() => setPage(1)}>«</Button>
              <Button variant="outline" size="icon-xs" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</Button>
              <span className="px-2 text-sm font-medium text-[#172F52]">{page} / {totalPages || 1}</span>
              <Button variant="outline" size="icon-xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</Button>
              <Button variant="outline" size="icon-xs" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</Button>
            </div>
          </div>
        </>
      )}

      {/* Create Vehicle Modal */}
      <Modal
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Add New Vehicle"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-[#172033]">Make *</Label>
              <Input
                value={newVehicle.make}
                onChange={(e) => setNewVehicle((p) => ({ ...p, make: e.target.value }))}
                placeholder="e.g. Toyota"
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#172033]">Model *</Label>
              <Input
                value={newVehicle.model}
                onChange={(e) => setNewVehicle((p) => ({ ...p, model: e.target.value }))}
                placeholder="e.g. Prius"
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#172033]">Year *</Label>
              <Input
                type="number"
                value={newVehicle.year}
                onChange={(e) => setNewVehicle((p) => ({ ...p, year: parseInt(e.target.value) || 2024 }))}
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#172033]">Registration *</Label>
              <Input
                value={newVehicle.registration}
                onChange={(e) => setNewVehicle((p) => ({ ...p, registration: e.target.value }))}
                placeholder="e.g. AB12 CDE"
                className="mt-1 h-10 uppercase"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#172033]">Colour</Label>
              <Input
                value={newVehicle.colour}
                onChange={(e) => setNewVehicle((p) => ({ ...p, colour: e.target.value }))}
                placeholder="e.g. White"
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#172033]">Operator *</Label>
              <select
                value={newVehicle.operatorId}
                onChange={(e) => setNewVehicle((p) => ({ ...p, operatorId: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-[#D9E0E8] px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
              >
                <option value="">Select an operator...</option>
                {operators.map((o) => (
                  <option key={o.uid} value={o.uid}>
                    {(o as unknown as { companyName?: string }).companyName || `${o.firstName} ${o.lastName}`}
                  </option>
                ))}
              </select>
              {operators.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No operators yet — add one on the Operators page first. A vehicle needs a real operator to show up in customer quotes.
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-[#172033]">Vehicle Type *</Label>
              <select
                value={newVehicle.vehicleType}
                onChange={(e) => setNewVehicle((p) => ({ ...p, vehicleType: e.target.value as VehicleType }))}
                className="mt-1 h-10 w-full rounded-lg border border-[#D9E0E8] px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
              >
                {VEHICLE_TYPES.map((vt) => (
                  <option key={vt.value} value={vt.value}>{vt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-[#172033]">Passenger Capacity</Label>
              <Input
                type="number"
                min={1}
                max={16}
                value={newVehicle.passengerCapacity}
                onChange={(e) => setNewVehicle((p) => ({ ...p, passengerCapacity: parseInt(e.target.value) || 4 }))}
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#172033]">Luggage Capacity</Label>
              <Input
                type="number"
                min={0}
                max={20}
                value={newVehicle.luggageCapacity}
                onChange={(e) => setNewVehicle((p) => ({ ...p, luggageCapacity: parseInt(e.target.value) || 2 }))}
                className="mt-1 h-10"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-[#172033]">
              <input
                type="checkbox"
                checked={newVehicle.isElectric}
                onChange={(e) => setNewVehicle((p) => ({ ...p, isElectric: e.target.checked }))}
                className="h-4 w-4 rounded border-[#D9E0E8] accent-[#D4145A]"
              />
              Electric
            </label>
            <label className="flex items-center gap-2 text-sm text-[#172033]">
              <input
                type="checkbox"
                checked={newVehicle.isHybrid}
                onChange={(e) => setNewVehicle((p) => ({ ...p, isHybrid: e.target.checked }))}
                className="h-4 w-4 rounded border-[#D9E0E8] accent-[#D4145A]"
              />
              Hybrid
            </label>
            <label className="flex items-center gap-2 text-sm text-[#172033]">
              <input
                type="checkbox"
                checked={newVehicle.wheelchairAccessible}
                onChange={(e) => setNewVehicle((p) => ({ ...p, wheelchairAccessible: e.target.checked }))}
                className="h-4 w-4 rounded border-[#D9E0E8] accent-[#D4145A]"
              />
              Wheelchair Accessible
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#D9E0E8] pt-4">
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
              onClick={handleCreateVehicle}
              disabled={!newVehicle.make || !newVehicle.model || !newVehicle.registration}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Vehicle
            </Button>
          </div>
        </div>
      </Modal>

      {/* Vehicle Detail Modal */}
      <Modal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : "Vehicle Details"}
        size="lg"
      >
        {selectedVehicle && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#172F52]">
                <Car className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#172F52]">
                  {selectedVehicle.make} {selectedVehicle.model}
                </p>
                <p className="font-mono text-sm text-[#6B7280]">{selectedVehicle.registration}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Year</p>
                <p className="text-sm text-[#172F52]">{selectedVehicle.year}</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Colour</p>
                <p className="text-sm text-[#172F52]">{selectedVehicle.colour}</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Type</p>
                <p className="text-sm text-[#172F52]">{getTypeLabel(selectedVehicle.vehicleType)}</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Operator</p>
                <p className="text-sm text-[#172F52]">{getOperatorName(selectedVehicle.operatorId)}</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Driver</p>
                <p className="text-sm text-[#172F52]">{getDriverName(selectedVehicle.driverId)}</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Capacity</p>
                <p className="text-sm text-[#172F52]">{selectedVehicle.passengerCapacity} passengers, {selectedVehicle.luggageCapacity} luggage</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Features</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedVehicle.isElectric && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                      <Zap className="h-3 w-3" /> Electric
                    </span>
                  )}
                  {selectedVehicle.isHybrid && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      Hybrid
                    </span>
                  )}
                  {selectedVehicle.wheelchairAccessible && (
                    <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
                      Wheelchair Accessible
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Status</p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    selectedVehicle.isApproved ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                  )}
                >
                  {selectedVehicle.isApproved ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {selectedVehicle.isApproved ? "Approved" : "Pending Approval"}
                </span>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3 sm:col-span-2">
                <p className="mb-1.5 text-xs font-semibold uppercase text-[#6B7280]">Fleet Availability</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(AVAILABILITY_META) as VehicleAvailabilityStatus[]).map((status) => {
                    const meta = AVAILABILITY_META[status]
                    const Icon = meta.icon
                    const isCurrent = getAvailability(selectedVehicle) === status
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleSetAvailability(selectedVehicle, status)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                          isCurrent
                            ? cn(meta.badgeClass, "border-transparent")
                            : "border-[#D9E0E8] bg-white text-[#6B7280] hover:bg-[#F5F7FA]"
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </button>
                    )
                  })}
                </div>
                {selectedVehicle.availabilityNote && (
                  <p className="mt-2 text-xs text-[#6B7280]">{selectedVehicle.availabilityNote}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null) }}
        title="Remove Vehicle"
        description={`Are you sure you want to remove ${removeTarget?.make} ${removeTarget?.model} (${removeTarget?.registration}) from the platform?`}
        confirmText="Remove"
        variant="destructive"
        onConfirm={handleDeleteVehicle}
      />
    </div>
  )
}
