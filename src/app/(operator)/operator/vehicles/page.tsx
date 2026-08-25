"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Car,
  Users,
  Luggage,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/shared/Modal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { DEMO_DATA, VEHICLE_TYPES } from "@/constants"
import type { Vehicle, VehicleType } from "@/types"

const VEHICLE_TYPE_FILTERS = ["All", ...VEHICLE_TYPES.map((vt) => vt.label)] as const

export default function OperatorVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(DEMO_DATA.vehicles)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("All")
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; vehicleId: string; vehicleName: string }>({
    open: false,
    vehicleId: "",
    vehicleName: "",
  })
  const [newVehicle, setNewVehicle] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear().toString(),
    registration: "",
    colour: "",
    vehicleType: "" as VehicleType | "",
    passengerCapacity: "3",
    luggageCapacity: "2",
    features: [] as string[],
  })

  const filtered = useMemo(() => {
    let result = vehicles
    if (typeFilter !== "All") {
      const typeValue = VEHICLE_TYPES.find((vt) => vt.label === typeFilter)?.value
      if (typeValue) result = result.filter((v) => v.vehicleType === typeValue)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (v) =>
          `${v.make} ${v.model}`.toLowerCase().includes(q) ||
          v.registration.toLowerCase().includes(q) ||
          v.colour.toLowerCase().includes(q)
      )
    }
    return result
  }, [vehicles, typeFilter, search])

  function handleAddVehicle() {
    setAddModalOpen(false)
    setNewVehicle({
      make: "",
      model: "",
      year: new Date().getFullYear().toString(),
      registration: "",
      colour: "",
      vehicleType: "",
      passengerCapacity: "3",
      luggageCapacity: "2",
      features: [],
    })
  }

  function handleDelete() {
    setVehicles((prev) => prev.filter((v) => v.id !== deleteDialog.vehicleId))
    setDeleteDialog({ open: false, vehicleId: "", vehicleName: "" })
  }

  function getTypeInfo(type: VehicleType) {
    return VEHICLE_TYPES.find((vt) => vt.value === type)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Vehicles</h1>
          <p className="text-sm text-[#6B7280]">Manage your fleet vehicles.</p>
        </div>
        <Button
          className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
          onClick={() => setAddModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vehicles..."
            className="h-9 pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {VEHICLE_TYPE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                typeFilter === f
                  ? "bg-[#172F52] text-white"
                  : "bg-white text-[#6B7280] hover:bg-[#F5F7FA] border border-[#D9E0E8]"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Car className="h-16 w-16" />}
          title="No vehicles found"
          description="No vehicles match your current filters."
          action={{
            label: "Add Vehicle",
            onClick: () => setAddModalOpen(true),
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((vehicle) => {
            const typeInfo = getTypeInfo(vehicle.vehicleType)
            const driver = DEMO_DATA.drivers.find(
              (d) => d.vehicleId === vehicle.id
            )

            return (
              <div
                key={vehicle.id}
                className="rounded-xl border border-[#D9E0E8] bg-white overflow-hidden transition-shadow hover:shadow-md"
              >
                {/* Vehicle Photo Placeholder */}
                <div className="relative h-40 bg-gradient-to-br from-[#172F52]/5 to-[#D4145A]/5 flex items-center justify-center">
                  <Car className="h-16 w-16 text-[#172F52]/20" />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <Badge className="bg-[#172F52] text-white text-[10px]">
                      {typeInfo?.icon} {typeInfo?.label}
                    </Badge>
                    {vehicle.isElectric && (
                      <Badge className="bg-green-500 text-white text-[10px]">
                        <Zap className="mr-0.5 h-3 w-3" />
                        Electric
                      </Badge>
                    )}
                  </div>
                  <Badge
                    className={cn(
                      "absolute top-3 right-3 text-[10px]",
                      vehicle.isApproved
                        ? "bg-green-500/10 text-green-600 border-green-200"
                        : "bg-amber-500/10 text-amber-600 border-amber-200"
                    )}
                  >
                    {vehicle.isApproved ? "Approved" : "Pending"}
                  </Badge>
                </div>

                <div className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#172F52]">
                        {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-xs text-[#6B7280]">
                        {vehicle.year} · {vehicle.colour}
                      </p>
                    </div>
                    <span className="rounded-md bg-[#F5F7FA] px-2 py-1 text-xs font-bold text-[#172F52]">
                      {vehicle.registration}
                    </span>
                  </div>

                  <div className="mb-3 flex items-center gap-4 text-xs text-[#6B7280]">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {vehicle.passengerCapacity} seats
                    </div>
                    <div className="flex items-center gap-1">
                      <Luggage className="h-3 w-3" />
                      {vehicle.luggageCapacity} bags
                    </div>
                  </div>

                  {driver && (
                    <div className="mb-3 rounded-lg bg-[#F5F7FA] p-2">
                      <p className="text-xs text-[#6B7280]">Assigned to</p>
                      <p className="text-sm font-medium text-[#172F52]">
                        {driver.firstName} {driver.lastName}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 border-[#D9E0E8]">
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 border-[#D9E0E8]">
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() =>
                        setDeleteDialog({
                          open: true,
                          vehicleId: vehicle.id,
                          vehicleName: `${vehicle.make} ${vehicle.model}`,
                        })
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Vehicle Modal */}
      <Modal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        title="Add New Vehicle"
        description="Enter vehicle details to add it to your fleet."
        size="lg"
      >
        <div className="space-y-4 pt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Make</label>
              <Input
                value={newVehicle.make}
                onChange={(e) => setNewVehicle((p) => ({ ...p, make: e.target.value }))}
                placeholder="e.g. Toyota"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Model</label>
              <Input
                value={newVehicle.model}
                onChange={(e) => setNewVehicle((p) => ({ ...p, model: e.target.value }))}
                placeholder="e.g. Prius"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Year</label>
              <Input
                type="number"
                value={newVehicle.year}
                onChange={(e) => setNewVehicle((p) => ({ ...p, year: e.target.value }))}
                placeholder="2024"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Registration</label>
              <Input
                value={newVehicle.registration}
                onChange={(e) => setNewVehicle((p) => ({ ...p, registration: e.target.value }))}
                placeholder="LN24 TCO"
                className="uppercase"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Colour</label>
              <Input
                value={newVehicle.colour}
                onChange={(e) => setNewVehicle((p) => ({ ...p, colour: e.target.value }))}
                placeholder="White"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Vehicle Type</label>
              <select
                value={newVehicle.vehicleType}
                onChange={(e) => setNewVehicle((p) => ({ ...p, vehicleType: e.target.value as VehicleType }))}
                className="flex h-9 w-full rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A] focus:ring-2 focus:ring-[#D4145A]/20"
              >
                <option value="">Select type...</option>
                {VEHICLE_TYPES.map((vt) => (
                  <option key={vt.value} value={vt.value}>
                    {vt.icon} {vt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Passenger Capacity</label>
              <Input
                type="number"
                value={newVehicle.passengerCapacity}
                onChange={(e) => setNewVehicle((p) => ({ ...p, passengerCapacity: e.target.value }))}
                min="1"
                max="8"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Luggage Capacity</label>
              <Input
                type="number"
                value={newVehicle.luggageCapacity}
                onChange={(e) => setNewVehicle((p) => ({ ...p, luggageCapacity: e.target.value }))}
                min="0"
                max="10"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-[#F5F7FA] pt-4">
            <Button variant="outline" className="border-[#D9E0E8]" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
              onClick={handleAddVehicle}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((p) => ({ ...p, open }))}
        title="Remove Vehicle"
        description={`Are you sure you want to remove ${deleteDialog.vehicleName} from your fleet?`}
        confirmText="Remove"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
