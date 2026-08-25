"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Eye,
  Edit,
  UserX,
  CheckCircle,
  XCircle,
  FileText,
  Car,
  Star,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { RatingStars } from "@/components/shared/RatingStars"
import { Modal } from "@/components/shared/Modal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { DEMO_DATA } from "@/constants"
import type { Driver } from "@/types"

export default function AdminDriversPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [tab, setTab] = useState<"all" | "pending">("all")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [suspendTarget, setSuspendTarget] = useState<Driver | null>(null)

  const pendingDrivers = useMemo(() => {
    return DEMO_DATA.drivers.filter((d) => !d.isVerified)
  }, [])

  const filtered = useMemo(() => {
    const source = tab === "pending" ? pendingDrivers : DEMO_DATA.drivers
    let result = [...source]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (d) =>
          d.firstName.toLowerCase().includes(q) ||
          d.lastName.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          d.phone.includes(q)
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((d) => d.status === statusFilter)
    }

    return result
  }, [search, statusFilter, tab, pendingDrivers])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const getOperatorName = (operatorId: string) => {
    return DEMO_DATA.operators.find((o) => o.uid === operatorId)?.companyName ?? "Unknown"
  }

  const getVehicleInfo = (vehicleId: string) => {
    const v = DEMO_DATA.vehicles.find((v) => v.id === vehicleId)
    return v ? `${v.make} ${v.model}` : "Unknown"
  }

  function handleViewDriver(driver: Driver) {
    setSelectedDriver(driver)
    setDetailOpen(true)
  }

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (row) => {
        const d = row as unknown as Driver
        return (
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#172F52] text-xs font-bold text-white">
                {d.firstName[0]}{d.lastName[0]}
              </div>
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
                  d.status === "online" ? "bg-green-500" : d.status === "busy" ? "bg-amber-500" : "bg-gray-400"
                )}
              />
            </div>
            <div>
              <span className="font-medium text-[#172F52]">{d.firstName} {d.lastName}</span>
              {d.isVerified && <CheckCircle className="ml-1 inline h-3 w-3 text-green-500" />}
            </div>
          </div>
        )
      },
    },
    {
      key: "operatorId",
      header: "Operator",
      render: (row) => (
        <span className="text-[#6B7280]">{getOperatorName((row as unknown as Driver).operatorId)}</span>
      ),
    },
    {
      key: "vehicle",
      header: "Vehicle",
      render: (row) => (
        <span className="text-[#6B7280]">{getVehicleInfo((row as unknown as Driver).vehicleId)}</span>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      render: (row) => {
        const d = row as unknown as Driver
        return <RatingStars rating={d.rating} size="sm" count={d.totalReviews} />
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const d = row as unknown as Driver
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              d.status === "online" && "bg-green-50 text-green-700",
              d.status === "busy" && "bg-amber-50 text-amber-700",
              d.status === "offline" && "bg-gray-100 text-gray-500"
            )}
          >
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              d.status === "online" ? "bg-green-500" : d.status === "busy" ? "bg-amber-500" : "bg-gray-400"
            )} />
            {d.status}
          </span>
        )
      },
    },
    {
      key: "documents",
      header: "Documents",
      render: (row) => {
        const d = row as unknown as Driver
        const docs = d.documents?.length ?? 0
        return (
          <span className={cn("text-sm", docs > 0 ? "text-green-600" : "text-amber-600")}>
            {docs} docs
          </span>
        )
      },
    },
    {
      key: "onlineStatus",
      header: "Online Status",
      render: (row) => {
        const d = row as unknown as Driver
        return (
          <span className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
            d.status === "online" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
          )}>
            {d.status === "online" ? "Online" : d.status === "busy" ? "Busy" : "Offline"}
          </span>
        )
      },
    },
    {
      key: "createdAt",
      header: "Joined",
      sortable: true,
      render: (row) => {
        const date = new Date((row as unknown as Driver).createdAt)
        return <span className="text-[#6B7280]">{date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        const d = row as unknown as Driver
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); handleViewDriver(d) }}>
              <Eye className="h-3.5 w-3.5 text-[#6B7280]" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={(e) => e.stopPropagation()}>
              <Edit className="h-3.5 w-3.5 text-[#6B7280]" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); setSuspendTarget(d) }}>
              <UserX className="h-3.5 w-3.5 text-amber-600" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#172F52]">Drivers</h1>
        <p className="text-sm text-[#6B7280]">Manage all platform drivers</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-[#F5F7FA] p-1">
        <button
          onClick={() => { setTab("all"); setPage(1) }}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            tab === "all" ? "bg-white text-[#172F52] shadow-sm" : "text-[#6B7280] hover:text-[#172F52]"
          )}
        >
          All Drivers ({DEMO_DATA.drivers.length})
        </button>
        <button
          onClick={() => { setTab("pending"); setPage(1) }}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            tab === "pending" ? "bg-white text-[#172F52] shadow-sm" : "text-[#6B7280] hover:text-[#172F52]"
          )}
        >
          Pending Approvals ({pendingDrivers.length})
        </button>
      </div>

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
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          >
            <option value="all">All Statuses</option>
            <option value="online">Online</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
          </select>
          <select className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]">
            <option value="all">All Operators</option>
            {DEMO_DATA.operators.map((o) => (
              <option key={o.uid} value={o.uid}>{o.companyName}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginated as unknown as Record<string, unknown>[]}
        emptyMessage="No drivers found"
        keyExtractor={(row) => (row as unknown as Driver).uid}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#6B7280]">
          Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-xs" disabled={page === 1} onClick={() => setPage(1)}>«</Button>
          <Button variant="outline" size="icon-xs" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</Button>
          <span className="px-2 text-sm font-medium text-[#172F52]">{page} / {totalPages || 1}</span>
          <Button variant="outline" size="icon-xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</Button>
          <Button variant="outline" size="icon-xs" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</Button>
        </div>
      </div>

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
                {selectedDriver.firstName[0]}{selectedDriver.lastName[0]}
              </div>
              <div>
                <p className="text-lg font-bold text-[#172F52]">
                  {selectedDriver.firstName} {selectedDriver.lastName}
                </p>
                <div className="flex items-center gap-3">
                  <RatingStars rating={selectedDriver.rating} size="sm" count={selectedDriver.totalReviews} />
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    selectedDriver.status === "online" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                  )}>
                    {selectedDriver.status}
                  </span>
                  {selectedDriver.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                      <Shield className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Email</p>
                <p className="text-sm text-[#172F52]">{selectedDriver.email}</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Phone</p>
                <p className="text-sm text-[#172F52]">{selectedDriver.phone}</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Licence Number</p>
                <p className="font-mono text-sm text-[#172F52]">{selectedDriver.licenceNumber}</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Operator</p>
                <p className="text-sm text-[#172F52]">{getOperatorName(selectedDriver.operatorId)}</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Vehicle</p>
                <p className="text-sm text-[#172F52]">{getVehicleInfo(selectedDriver.vehicleId)}</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Joined</p>
                <p className="text-sm text-[#172F52]">
                  {new Date(selectedDriver.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Document Verification Section */}
            <div className="border-t border-[#F5F7FA] pt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Documents</p>
                {selectedDriver.documents?.length === 0 && (
                  <span className="text-xs text-amber-600">No documents uploaded</span>
                )}
              </div>
              {selectedDriver.documents && selectedDriver.documents.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {selectedDriver.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg bg-[#F5F7FA] px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#6B7280]" />
                        <div>
                          <p className="text-sm font-medium text-[#172F52]">{doc.documentType}</p>
                          <p className="text-xs text-[#6B7280]">Expires: {doc.expiryDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={doc.status} type="payment" />
                        {doc.status === "pending" && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon-xs" className="text-green-600">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon-xs" className="text-red-600">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-2 rounded-lg bg-[#F5F7FA] p-4 text-center">
                  <FileText className="mx-auto mb-2 h-6 w-6 text-[#D9E0E8]" />
                  <p className="text-sm text-[#6B7280]">No documents on file</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!suspendTarget}
        onOpenChange={(open) => { if (!open) setSuspendTarget(null) }}
        title="Suspend Driver"
        description={`Are you sure you want to suspend ${suspendTarget?.firstName} ${suspendTarget?.lastName}? They will not be able to accept new trips.`}
        confirmText="Suspend"
        variant="destructive"
        onConfirm={() => setSuspendTarget(null)}
      />
    </div>
  )
}
