"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Search,
  Eye,
  UserX,
  UserCheck,
  Plus,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { Modal } from "@/components/shared/Modal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useAuth } from "@/hooks/useAuth"
import { listenToUsersByRole, updateUser } from "@/lib/services/user-service"
import type { User as AppUser } from "@/types"

type DriverStatusFilter = "all" | "active" | "suspended"

function formatDate(value: string | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export default function AdminDriversPage() {
  const { user } = useAuth()
  const [drivers, setDrivers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<DriverStatusFilter>("all")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  const [selectedDriver, setSelectedDriver] = useState<AppUser | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [suspendTarget, setSuspendTarget] = useState<AppUser | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" })
  const [addError, setAddError] = useState("")
  const [addLoading, setAddLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = listenToUsersByRole(
      "driver",
      (users) => {
        setDrivers(users)
        setLoading(false)
        setLoadError("")
      },
      (err) => {
        console.error("AdminDriversPage: listenToUsersByRole failed —", err)
        setLoadError("Could not load drivers from the database.")
        setLoading(false)
      }
    )
    return unsubscribe
  }, [])

  const filtered = useMemo(() => {
    let result = [...drivers]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (d) =>
          d.firstName?.toLowerCase().includes(q) ||
          d.lastName?.toLowerCase().includes(q) ||
          d.email?.toLowerCase().includes(q) ||
          d.phone?.includes(q)
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((d) => (d.status || "active") === statusFilter)
    }

    return result
  }, [drivers, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  function handleViewDriver(driver: AppUser) {
    setSelectedDriver(driver)
    setDetailOpen(true)
  }

  async function handleAddDriver(e: React.FormEvent) {
    e.preventDefault()
    setAddError("")

    if (!user) {
      setAddError("Your session has expired. Please sign in again.")
      return
    }

    setAddLoading(true)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch("/api/admin/drivers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(addForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setAddError(data.error || "Could not create the driver account.")
        return
      }
      setAddOpen(false)
      setAddForm({ firstName: "", lastName: "", email: "", phone: "", password: "" })
    } catch (err) {
      console.error("handleAddDriver failed —", err)
      setAddError("Network error — please try again.")
    } finally {
      setAddLoading(false)
    }
  }

  async function handleToggleSuspend(driver: AppUser) {
    const nextStatus = (driver.status || "active") === "suspended" ? "active" : "suspended"
    try {
      await updateUser(driver.uid, { status: nextStatus })
    } catch (err) {
      console.error("handleToggleSuspend failed —", err)
    } finally {
      setSuspendTarget(null)
    }
  }

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (row) => {
        const d = row as unknown as AppUser
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#172F52] text-xs font-bold text-white">
              {(d.firstName?.[0] ?? "?")}{(d.lastName?.[0] ?? "")}
            </div>
            <span className="font-medium text-[#172F52]">{d.firstName} {d.lastName}</span>
          </div>
        )
      },
    },
    {
      key: "email",
      header: "Email",
      render: (row) => <span className="text-[#6B7280]">{(row as unknown as AppUser).email}</span>,
    },
    {
      key: "phone",
      header: "Phone",
      render: (row) => <span className="text-[#6B7280]">{(row as unknown as AppUser).phone || "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const status = (row as unknown as AppUser).status || "active"
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              status === "suspended" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", status === "suspended" ? "bg-red-500" : "bg-green-500")} />
            {status === "suspended" ? "Suspended" : "Active"}
          </span>
        )
      },
    },
    {
      key: "createdAt",
      header: "Joined",
      sortable: true,
      render: (row) => <span className="text-[#6B7280]">{formatDate((row as unknown as AppUser).createdAt)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        const d = row as unknown as AppUser
        const isSuspended = (d.status || "active") === "suspended"
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); handleViewDriver(d) }}>
              <Eye className="h-3.5 w-3.5 text-[#6B7280]" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); setSuspendTarget(d) }}>
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
          <h1 className="text-2xl font-bold text-[#172F52]">Drivers</h1>
          <p className="text-sm text-[#6B7280]">Manage all platform drivers</p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Driver
        </Button>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {loadError}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-[#D9E0E8] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search drivers..."
              className="h-9 pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as DriverStatusFilter); setPage(1) }}
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
            emptyMessage="No drivers yet — click Add Driver to create the first one"
            keyExtractor={(row) => (row as unknown as AppUser).uid}
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

      {/* Driver Detail Modal */}
      <Modal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={selectedDriver ? `${selectedDriver.firstName} ${selectedDriver.lastName}` : "Driver Details"}
        size="lg"
      >
        {selectedDriver && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#172F52] text-lg font-bold text-white">
                {(selectedDriver.firstName?.[0] ?? "?")}{(selectedDriver.lastName?.[0] ?? "")}
              </div>
              <div>
                <p className="text-lg font-bold text-[#172F52]">
                  {selectedDriver.firstName} {selectedDriver.lastName}
                </p>
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  (selectedDriver.status || "active") === "suspended" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                )}>
                  {(selectedDriver.status || "active") === "suspended" ? "Suspended" : "Active"}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-[#6B7280]">
                  <Mail className="h-3 w-3" /> Email
                </p>
                <p className="text-sm text-[#172F52]">{selectedDriver.email}</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-[#6B7280]">
                  <Phone className="h-3 w-3" /> Phone
                </p>
                <p className="text-sm text-[#172F52]">{selectedDriver.phone || "—"}</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3 sm:col-span-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-[#6B7280]">
                  <Calendar className="h-3 w-3" /> Joined
                </p>
                <p className="text-sm text-[#172F52]">{formatDate(selectedDriver.createdAt)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Driver Modal */}
      <Modal
        open={addOpen}
        onOpenChange={(open) => { setAddOpen(open); if (!open) setAddError("") }}
        title="Add Driver"
        size="md"
      >
        <form onSubmit={handleAddDriver} className="space-y-4">
          <p className="text-sm text-[#6B7280]">
            This creates a real login the driver can use at <span className="font-medium text-[#172F52]">/driver/login</span>.
          </p>

          {addError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {addError}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                required
                className="mt-1.5 h-10"
                value={addForm.firstName}
                onChange={(e) => setAddForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last name</Label>
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
            <p className="mt-1 text-xs text-[#6B7280]">Share this with the driver — they can change it after signing in.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={addLoading} className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90">
              {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Driver"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!suspendTarget}
        onOpenChange={(open) => { if (!open) setSuspendTarget(null) }}
        title={(suspendTarget?.status || "active") === "suspended" ? "Reactivate Driver" : "Suspend Driver"}
        description={
          (suspendTarget?.status || "active") === "suspended"
            ? `Reactivate ${suspendTarget?.firstName} ${suspendTarget?.lastName}? They will be able to sign in and accept trips again.`
            : `Are you sure you want to suspend ${suspendTarget?.firstName} ${suspendTarget?.lastName}? They will not be able to accept new trips.`
        }
        confirmText={(suspendTarget?.status || "active") === "suspended" ? "Reactivate" : "Suspend"}
        variant={(suspendTarget?.status || "active") === "suspended" ? "default" : "destructive"}
        onConfirm={() => suspendTarget && handleToggleSuspend(suspendTarget)}
      />
    </div>
  )
}
