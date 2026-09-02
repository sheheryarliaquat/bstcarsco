"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Search,
  Eye,
  UserX,
  UserCheck,
  Plus,
  Building,
  Car,
  ClipboardList,
  Banknote,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { RatingStars } from "@/components/shared/RatingStars"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { Modal } from "@/components/shared/Modal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useAuth } from "@/hooks/useAuth"
import { listenToUsersByRole, updateUser } from "@/lib/services/user-service"
import { listenToVehicles } from "@/lib/services/vehicle-service"
import { listenToAllBookings } from "@/lib/services/booking-service"
import type { Operator, User as AppUser, Vehicle, Booking } from "@/types"

type BookingRow = Booking & { id: string }

const EMPTY_ADD_FORM = {
  companyName: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  commissionPercent: "15",
  commissionFlatFee: "0",
  description: "",
}

export default function AdminOperatorsPage() {
  const { user } = useAuth()
  const [operators, setOperators] = useState<Operator[]>([])
  const [drivers, setDrivers] = useState<AppUser[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [suspendTarget, setSuspendTarget] = useState<Operator | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM)
  const [addError, setAddError] = useState("")
  const [addLoading, setAddLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = listenToUsersByRole(
      "operator",
      (users) => {
        setOperators(users as Operator[])
        setLoading(false)
        setLoadError("")
      },
      (err) => {
        console.error("AdminOperatorsPage: listenToUsersByRole(operator) failed —", err)
        setLoadError("Could not load operators from the database.")
        setLoading(false)
      }
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = listenToUsersByRole(
      "driver",
      (users) => setDrivers(users),
      (err) => console.error("AdminOperatorsPage: listenToUsersByRole(driver) failed —", err)
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = listenToVehicles(
      (data) => setVehicles(data),
      (err) => console.error("AdminOperatorsPage: listenToVehicles failed —", err)
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = listenToAllBookings(
      (data) => setBookings(data as BookingRow[]),
      (err) => console.error("AdminOperatorsPage: listenToAllBookings failed —", err)
    )
    return unsubscribe
  }, [])

  const operatorStats = useMemo(() => {
    const total = operators.length
    const totalDrivers = drivers.length
    const totalVehicles = vehicles.length
    const totalBookings = bookings.length
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.total || 0), 0)
    return { total, totalDrivers, totalVehicles, totalBookings, totalRevenue }
  }, [operators, drivers, vehicles, bookings])

  const getOperatorDrivers = (operatorId: string) => drivers.filter((d) => (d as unknown as { operatorId?: string }).operatorId === operatorId)
  const getOperatorVehicles = (operatorId: string) => vehicles.filter((v) => v.operatorId === operatorId)
  const getOperatorBookings = (operatorId: string) => bookings.filter((b) => b.operatorId === operatorId)
  const getOperatorRevenue = (operatorId: string) => getOperatorBookings(operatorId).reduce((sum, b) => sum + (b.total || 0), 0)

  const filtered = useMemo(() => {
    let result = [...operators]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (o) =>
          o.companyName?.toLowerCase().includes(q) ||
          o.firstName?.toLowerCase().includes(q) ||
          o.lastName?.toLowerCase().includes(q) ||
          o.email?.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== "all") {
      result = result.filter((o) => (o.status || "active") === statusFilter)
    }
    return result
  }, [operators, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  async function handleAddOperator(e: React.FormEvent) {
    e.preventDefault()
    setAddError("")

    if (!user) {
      setAddError("Your session has expired. Please sign in again.")
      return
    }

    setAddLoading(true)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch("/api/admin/operators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...addForm,
          commissionPercent: parseFloat(addForm.commissionPercent) || 0,
          commissionFlatFee: parseFloat(addForm.commissionFlatFee) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAddError(data.error || "Could not create the operator account.")
        return
      }
      setAddOpen(false)
      setAddForm(EMPTY_ADD_FORM)
    } catch (err) {
      console.error("handleAddOperator failed —", err)
      setAddError("Network error — please try again.")
    } finally {
      setAddLoading(false)
    }
  }

  async function handleToggleSuspend(operator: Operator) {
    const nextStatus = (operator.status || "active") === "suspended" ? "active" : "suspended"
    try {
      await updateUser(operator.uid, { status: nextStatus })
    } catch (err) {
      console.error("handleToggleSuspend failed —", err)
    } finally {
      setSuspendTarget(null)
    }
  }

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "companyName",
      header: "Company",
      sortable: true,
      render: (row) => {
        const o = row as unknown as Operator
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#172F52] text-xs font-bold text-white">
              {(o.companyName || "?").split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </div>
            <div>
              <span className="font-medium text-[#172F52]">{o.companyName}</span>
              <p className="text-xs text-[#6B7280]">{o.firstName} {o.lastName}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: "contact",
      header: "Contact",
      render: (row) => {
        const o = row as unknown as Operator
        return (
          <div>
            <p className="text-sm text-[#172F52]">{o.email}</p>
            <p className="text-xs text-[#6B7280]">{o.phone}</p>
          </div>
        )
      },
    },
    {
      key: "drivers",
      header: "Drivers",
      sortable: true,
      render: (row) => {
        const o = row as unknown as Operator
        return <span className="font-semibold text-[#172F52]">{getOperatorDrivers(o.uid).length}</span>
      },
    },
    {
      key: "vehicles",
      header: "Vehicles",
      sortable: true,
      render: (row) => {
        const o = row as unknown as Operator
        return <span className="font-semibold text-[#172F52]">{getOperatorVehicles(o.uid).length}</span>
      },
    },
    {
      key: "bookings",
      header: "Bookings",
      sortable: true,
      render: (row) => {
        const o = row as unknown as Operator
        return <span className="font-semibold text-[#172F52]">{getOperatorBookings(o.uid).length}</span>
      },
    },
    {
      key: "revenue",
      header: "Revenue",
      sortable: true,
      render: (row) => {
        const o = row as unknown as Operator
        return <span className="font-semibold text-[#172F52]">£{getOperatorRevenue(o.uid).toFixed(0)}</span>
      },
    },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      render: (row) => {
        const o = row as unknown as Operator
        return <RatingStars rating={o.rating || 0} size="sm" count={o.totalReviews || 0} />
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const o = row as unknown as Operator
        const status = o.status || "active"
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
              status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            )}
          >
            {status}
          </span>
        )
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        const o = row as unknown as Operator
        const isSuspended = (o.status || "active") === "suspended"
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); setSelectedOperator(o); setDetailOpen(true) }}>
              <Eye className="h-3.5 w-3.5 text-[#6B7280]" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); setSuspendTarget(o) }}>
              {isSuspended ? (
                <UserCheck className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <UserX className="h-3.5 w-3.5 text-amber-600" />
              )}
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
          <h1 className="text-2xl font-bold text-[#172F52]">Operators</h1>
          <p className="text-sm text-[#6B7280]">Manage all platform operators</p>
        </div>
        <Button className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Operator
        </Button>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <DashboardCard title="Total Operators" value={operatorStats.total} icon={<Building className="h-5 w-5" />} />
        <DashboardCard title="Total Drivers" value={operatorStats.totalDrivers} icon={<Users className="h-5 w-5" />} />
        <DashboardCard title="Total Vehicles" value={operatorStats.totalVehicles} icon={<Car className="h-5 w-5" />} />
        <DashboardCard title="Total Bookings" value={operatorStats.totalBookings} icon={<ClipboardList className="h-5 w-5" />} />
        <DashboardCard title="Total Revenue" value={`£${operatorStats.totalRevenue.toFixed(0)}`} icon={<Banknote className="h-5 w-5" />} />
      </div>

      <div className="rounded-xl border border-[#D9E0E8] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search operators..."
              className="h-9 pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-[#D9E0E8] bg-white py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#D4145A]" />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={paginated as unknown as Record<string, unknown>[]}
            emptyMessage="No operators yet — click Add Operator to create the first one"
            keyExtractor={(row) => (row as unknown as Operator).uid}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6B7280]">
              Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-xs" disabled={page === 1} onClick={() => setPage(1)}>«</Button>
              <Button variant="outline" size="icon-xs" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</Button>
              <span className="px-2 text-sm font-medium text-[#172F52]">{page} / {totalPages}</span>
              <Button variant="outline" size="icon-xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</Button>
              <Button variant="outline" size="icon-xs" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</Button>
            </div>
          </div>
        </>
      )}

      {/* Operator Detail Modal */}
      <Modal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={selectedOperator?.companyName ?? "Operator Details"}
        size="lg"
      >
        {selectedOperator && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#172F52] text-lg font-bold text-white">
                {(selectedOperator.companyName || "?").split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="text-lg font-bold text-[#172F52]">{selectedOperator.companyName}</p>
                <RatingStars rating={selectedOperator.rating || 0} size="sm" count={selectedOperator.totalReviews || 0} />
              </div>
            </div>

            {selectedOperator.description && (
              <p className="text-sm text-[#6B7280]">{selectedOperator.description}</p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Contact Person</p>
                <p className="text-sm text-[#172F52]">{selectedOperator.firstName} {selectedOperator.lastName}</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Phone</p>
                <p className="text-sm text-[#172F52]">{selectedOperator.phone || "—"}</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Email</p>
                <p className="text-sm text-[#172F52]">{selectedOperator.email}</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Commission</p>
                <p className="text-sm font-semibold text-[#172F52]">
                  {selectedOperator.commission?.percent ?? 0}% + £{selectedOperator.commission?.flatFee ?? 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-lg bg-[#F5F7FA] p-3 text-center">
                <p className="text-lg font-bold text-[#172F52]">{getOperatorDrivers(selectedOperator.uid).length}</p>
                <p className="text-[10px] text-[#6B7280]">Drivers</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3 text-center">
                <p className="text-lg font-bold text-[#172F52]">{getOperatorVehicles(selectedOperator.uid).length}</p>
                <p className="text-[10px] text-[#6B7280]">Vehicles</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3 text-center">
                <p className="text-lg font-bold text-[#172F52]">{getOperatorBookings(selectedOperator.uid).length}</p>
                <p className="text-[10px] text-[#6B7280]">Bookings</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3 text-center">
                <p className="text-lg font-bold text-[#172F52]">£{getOperatorRevenue(selectedOperator.uid).toFixed(0)}</p>
                <p className="text-[10px] text-[#6B7280]">Revenue</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Operator Modal */}
      <Modal
        open={addOpen}
        onOpenChange={(open) => { setAddOpen(open); if (!open) setAddError("") }}
        title="Add Operator"
        size="md"
      >
        <form onSubmit={handleAddOperator} className="space-y-4">
          <p className="text-sm text-[#6B7280]">
            This creates a real login the operator can use to manage their fleet.
          </p>

          {addError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {addError}
            </div>
          )}

          <div>
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              required
              className="mt-1.5 h-10"
              value={addForm.companyName}
              onChange={(e) => setAddForm((f) => ({ ...f, companyName: e.target.value }))}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">Contact first name</Label>
              <Input
                id="firstName"
                required
                className="mt-1.5 h-10"
                value={addForm.firstName}
                onChange={(e) => setAddForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Contact last name</Label>
              <Input
                id="lastName"
                required
                className="mt-1.5 h-10"
                value={addForm.lastName}
                onChange={(e) => setAddForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              className="mt-1.5 h-10"
              value={addForm.email}
              onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              className="mt-1.5 h-10"
              value={addForm.phone}
              onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="commissionPercent">Commission %</Label>
              <Input
                id="commissionPercent"
                type="number"
                step="0.5"
                min="0"
                max="100"
                className="mt-1.5 h-10"
                value={addForm.commissionPercent}
                onChange={(e) => setAddForm((f) => ({ ...f, commissionPercent: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="commissionFlatFee">Flat fee (£)</Label>
              <Input
                id="commissionFlatFee"
                type="number"
                step="0.1"
                min="0"
                className="mt-1.5 h-10"
                value={addForm.commissionFlatFee}
                onChange={(e) => setAddForm((f) => ({ ...f, commissionFlatFee: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Temporary password</Label>
            <Input
              id="password"
              type="text"
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="mt-1.5 h-10"
              value={addForm.password}
              onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
            />
            <p className="mt-1 text-xs text-[#6B7280]">Share this with the operator — they can change it after signing in.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={addLoading} className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90">
              {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Operator"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!suspendTarget}
        onOpenChange={(open) => { if (!open) setSuspendTarget(null) }}
        title={(suspendTarget?.status || "active") === "suspended" ? "Reactivate Operator" : "Suspend Operator"}
        description={
          (suspendTarget?.status || "active") === "suspended"
            ? `Reactivate ${suspendTarget?.companyName}? They will regain access to manage their fleet.`
            : `Are you sure you want to suspend ${suspendTarget?.companyName}? All their drivers will be affected.`
        }
        confirmText={(suspendTarget?.status || "active") === "suspended" ? "Reactivate" : "Suspend"}
        variant={(suspendTarget?.status || "active") === "suspended" ? "default" : "destructive"}
        onConfirm={() => suspendTarget && handleToggleSuspend(suspendTarget)}
      />
    </div>
  )
}
