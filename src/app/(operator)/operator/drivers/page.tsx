"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Plus,
  Edit,
  Eye,
  XCircle,
  Clock,
  Car,
  Phone,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/shared/Modal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { RatingStars } from "@/components/shared/RatingStars"
import { EmptyState } from "@/components/shared/EmptyState"
import { DEMO_DATA } from "@/constants"
import type { Driver, DriverStatus } from "@/types"

const STATUS_FILTERS = ["All", "Online", "Offline", "Busy"] as const

type StatusFilter = (typeof STATUS_FILTERS)[number]

export default function OperatorDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>(DEMO_DATA.drivers)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All")
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; driverId: string; driverName: string }>({
    open: false,
    driverId: "",
    driverName: "",
  })
  const [newDriver, setNewDriver] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    licenceNumber: "",
    vehicleId: "",
  })

  const filtered = useMemo(() => {
    let result = drivers
    if (statusFilter !== "All") {
      const s = statusFilter.toLowerCase() as DriverStatus
      result = result.filter((d) => d.status === s)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (d) =>
          `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          d.licenceNumber.toLowerCase().includes(q)
      )
    }
    return result
  }, [drivers, statusFilter, search])

  function handleAddDriver() {
    setAddModalOpen(false)
    setNewDriver({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      licenceNumber: "",
      vehicleId: "",
    })
  }

  function handleSuspend() {
    setDrivers((prev) =>
      prev.map((d) =>
        d.uid === suspendDialog.driverId
          ? { ...d, status: "offline" as DriverStatus }
          : d
      )
    )
    setSuspendDialog({ open: false, driverId: "", driverName: "" })
  }

  function getDocStatus(driver: Driver) {
    if (!driver.isVerified) return { label: "Pending", color: "bg-amber-500/10 text-amber-600" }
    return { label: "Verified", color: "bg-green-500/10 text-green-600" }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Drivers</h1>
          <p className="text-sm text-[#6B7280]">Manage your fleet drivers and their documents.</p>
        </div>
        <Button
          className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
          onClick={() => setAddModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Driver
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drivers..."
            className="h-9 pl-9"
          />
        </div>
        <div className="flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === f
                  ? "bg-[#172F52] text-white"
                  : "bg-white text-[#6B7280] hover:bg-[#F5F7FA] border border-[#D9E0E8]"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Driver Cards Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="h-16 w-16" />}
          title="No drivers found"
          description="No drivers match your current filters."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((driver) => {
            const vehicle = DEMO_DATA.vehicles.find(
              (v) => v.driverId === driver.uid
            )
            const docStatus = getDocStatus(driver)
            const tripsToday = driver.status === "online" ? Math.floor(Math.random() * 6) + 1 : 0

            return (
              <div
                key={driver.uid}
                className="rounded-xl border border-[#D9E0E8] bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#172F52] text-sm font-bold text-white">
                        {driver.firstName[0]}{driver.lastName[0]}
                      </div>
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white",
                          driver.status === "online"
                            ? "bg-green-500"
                            : driver.status === "busy"
                            ? "bg-amber-500"
                            : "bg-gray-400"
                        )}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#172F52]">
                        {driver.firstName} {driver.lastName}
                      </p>
                      <RatingStars rating={driver.rating} size="sm" count={driver.totalReviews} />
                    </div>
                  </div>
                  <Badge className={docStatus.color}>{docStatus.label}</Badge>
                </div>

                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{driver.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{driver.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <Car className="h-3.5 w-3.5" />
                    <span>
                      {vehicle
                        ? `${vehicle.make} ${vehicle.model} (${vehicle.registration})`
                        : "No vehicle assigned"}
                    </span>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-4 border-t border-[#F5F7FA] pt-3">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      className={cn(
                        "text-[10px]",
                        driver.status === "online"
                          ? "bg-green-500/10 text-green-600"
                          : driver.status === "busy"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {driver.status === "online"
                        ? "Online"
                        : driver.status === "busy"
                        ? "Busy"
                        : "Offline"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                    <Clock className="h-3 w-3" />
                    <span>{tripsToday} trips today</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 border-[#D9E0E8]">
                    <Eye className="mr-1 h-3 w-3" />
                    Profile
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
                      setSuspendDialog({
                        open: true,
                        driverId: driver.uid,
                        driverName: `${driver.firstName} ${driver.lastName}`,
                      })
                    }
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Driver Modal */}
      <Modal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        title="Add New Driver"
        description="Enter driver details to add them to your fleet."
        size="lg"
      >
        <div className="space-y-4 pt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#172F52]">First Name</label>
              <Input
                value={newDriver.firstName}
                onChange={(e) => setNewDriver((p) => ({ ...p, firstName: e.target.value }))}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Last Name</label>
              <Input
                value={newDriver.lastName}
                onChange={(e) => setNewDriver((p) => ({ ...p, lastName: e.target.value }))}
                placeholder="Enter last name"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Email Address</label>
            <Input
              type="email"
              value={newDriver.email}
              onChange={(e) => setNewDriver((p) => ({ ...p, email: e.target.value }))}
              placeholder="driver@email.co.uk"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Phone Number</label>
            <Input
              type="tel"
              value={newDriver.phone}
              onChange={(e) => setNewDriver((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+447700000000"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Licence Number</label>
            <Input
              value={newDriver.licenceNumber}
              onChange={(e) => setNewDriver((p) => ({ ...p, licenceNumber: e.target.value }))}
              placeholder="e.g. MOH1234567890"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Assign Vehicle</label>
            <select
              value={newDriver.vehicleId}
              onChange={(e) => setNewDriver((p) => ({ ...p, vehicleId: e.target.value }))}
              className="flex h-9 w-full rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A] focus:ring-2 focus:ring-[#D4145A]/20"
            >
              <option value="">Select a vehicle...</option>
              {DEMO_DATA.vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} ({v.registration})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 border-t border-[#F5F7FA] pt-4">
            <Button variant="outline" className="border-[#D9E0E8]" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
              onClick={handleAddDriver}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Driver
            </Button>
          </div>
        </div>
      </Modal>

      {/* Suspend Confirmation */}
      <ConfirmDialog
        open={suspendDialog.open}
        onOpenChange={(open) =>
          setSuspendDialog((p) => ({ ...p, open }))
        }
        title="Suspend Driver"
        description={`Are you sure you want to suspend ${suspendDialog.driverName}? They will not be able to receive bookings.`}
        confirmText="Suspend"
        variant="destructive"
        onConfirm={handleSuspend}
      />
    </div>
  )
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
