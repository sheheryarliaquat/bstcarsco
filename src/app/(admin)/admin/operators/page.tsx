"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Eye,
  Edit,
  UserX,
  Plus,
  Building,
  Car,
  ClipboardList,
  Banknote,
  Star,
  Wallet,
  Mail,
  Phone,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { RatingStars } from "@/components/shared/RatingStars"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { Modal } from "@/components/shared/Modal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { DEMO_DATA } from "@/constants"
import type { Operator } from "@/types"

export default function AdminOperatorsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [suspendTarget, setSuspendTarget] = useState<Operator | null>(null)

  const operatorStats = useMemo(() => {
    const total = DEMO_DATA.operators.length
    const totalDrivers = DEMO_DATA.drivers.length
    const totalVehicles = DEMO_DATA.vehicles.length
    const totalBookings = DEMO_DATA.bookings.length
    const totalRevenue = DEMO_DATA.bookings.reduce((sum, b) => sum + b.total, 0)
    return { total, totalDrivers, totalVehicles, totalBookings, totalRevenue }
  }, [])

  const getOperatorDrivers = (operatorId: string) => {
    return DEMO_DATA.drivers.filter((d) => d.operatorId === operatorId)
  }

  const getOperatorVehicles = (operatorId: string) => {
    return DEMO_DATA.vehicles.filter((v) => v.operatorId === operatorId)
  }

  const getOperatorBookings = (operatorId: string) => {
    return DEMO_DATA.bookings.filter((b) => b.operatorId === operatorId)
  }

  const getOperatorRevenue = (operatorId: string) => {
    return getOperatorBookings(operatorId).reduce((sum, b) => sum + b.total, 0)
  }

  const filtered = useMemo(() => {
    if (!search) return DEMO_DATA.operators
    const q = search.toLowerCase()
    return DEMO_DATA.operators.filter(
      (o) =>
        o.companyName.toLowerCase().includes(q) ||
        o.firstName.toLowerCase().includes(q) ||
        o.lastName.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q)
    )
  }, [search])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

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
              {o.companyName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
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
        return <RatingStars rating={o.rating} size="sm" count={o.totalReviews} />
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const o = row as unknown as Operator
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
              o.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            )}
          >
            {o.status}
          </span>
        )
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        const o = row as unknown as Operator
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); setSelectedOperator(o); setDetailOpen(true) }}>
              <Eye className="h-3.5 w-3.5 text-[#6B7280]" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={(e) => e.stopPropagation()}>
              <Edit className="h-3.5 w-3.5 text-[#6B7280]" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); setSuspendTarget(o) }}>
              <UserX className="h-3.5 w-3.5 text-amber-600" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={(e) => e.stopPropagation()}>
              <Wallet className="h-3.5 w-3.5 text-[#6B7280]" />
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
        <Button className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Operator
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <DashboardCard title="Total Operators" value={operatorStats.total} icon={<Building className="h-5 w-5" />} />
        <DashboardCard title="Total Drivers" value={operatorStats.totalDrivers} icon={<Users className="h-5 w-5" />} />
        <DashboardCard title="Total Vehicles" value={operatorStats.totalVehicles} icon={<Car className="h-5 w-5" />} />
        <DashboardCard title="Total Bookings" value={operatorStats.totalBookings} icon={<ClipboardList className="h-5 w-5" />} />
        <DashboardCard title="Total Revenue" value={`£${operatorStats.totalRevenue.toFixed(0)}`} icon={<Banknote className="h-5 w-5" />} trend="up" change={10} />
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

      <DataTable
        columns={columns}
        data={paginated as unknown as Record<string, unknown>[]}
        emptyMessage="No operators found"
        keyExtractor={(row) => (row as unknown as Operator).uid}
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
                {selectedOperator.companyName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="text-lg font-bold text-[#172F52]">{selectedOperator.companyName}</p>
                <RatingStars rating={selectedOperator.rating} size="sm" count={selectedOperator.totalReviews} />
              </div>
            </div>

            <p className="text-sm text-[#6B7280]">{selectedOperator.description}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Contact Person</p>
                <p className="text-sm text-[#172F52]">{selectedOperator.firstName} {selectedOperator.lastName}</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Phone</p>
                <p className="text-sm text-[#172F52]">{selectedOperator.phone}</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Email</p>
                <p className="text-sm text-[#172F52]">{selectedOperator.email}</p>
              </div>
              <div className="rounded-lg bg-[#F5F7FA] p-3">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Commission</p>
                <p className="text-sm font-semibold text-[#172F52]">{selectedOperator.commission.percent}% + £{selectedOperator.commission.flatFee}</p>
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

      <ConfirmDialog
        open={!!suspendTarget}
        onOpenChange={(open) => { if (!open) setSuspendTarget(null) }}
        title="Suspend Operator"
        description={`Are you sure you want to suspend ${suspendTarget?.companyName}? All their drivers will be affected.`}
        confirmText="Suspend"
        variant="destructive"
        onConfirm={() => setSuspendTarget(null)}
      />
    </div>
  )
}
