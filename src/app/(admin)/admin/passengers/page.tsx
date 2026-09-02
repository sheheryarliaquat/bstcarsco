"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Users,
  Eye,
  UserX,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Banknote,
  ClipboardList,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { Modal } from "@/components/shared/Modal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { DEMO_DATA } from "@/constants"
import type { Booking, Passenger } from "@/types"

const EMPTY_PASSENGERS: Passenger[] = []

export default function AdminPassengersPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [suspendTarget, setSuspendTarget] = useState<Passenger | null>(null)

  const passengerStats = useMemo(() => {
    return { total: 0, active: 0, totalBookings: 0, totalRevenue: 0 }
  }, [])

  const filtered = useMemo(() => {
    if (!search) return EMPTY_PASSENGERS
    const q = search.toLowerCase()
    return EMPTY_PASSENGERS.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.includes(q)
    )
  }, [search])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const getPassengerBookings = (passengerId: string): Booking[] => {
    return []
  }

  const getPassengerSpent = (passengerId: string) => {
    return getPassengerBookings(passengerId).reduce((sum, b) => sum + b.total, 0)
  }

  function handleViewPassenger(passenger: Passenger) {
    setSelectedPassenger(passenger)
    setDetailOpen(true)
  }

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (row) => {
        const p = row as unknown as Passenger
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#172F52] text-xs font-bold text-white">
              {p.firstName[0]}{p.lastName[0]}
            </div>
            <span className="font-medium text-[#172F52]">
              {p.firstName} {p.lastName}
            </span>
          </div>
        )
      },
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      render: (row) => <span className="text-[#6B7280]">{(row as unknown as Passenger).email}</span>,
    },
    {
      key: "phone",
      header: "Phone",
      render: (row) => <span className="text-[#6B7280]">{(row as unknown as Passenger).phone}</span>,
    },
    {
      key: "totalBookings",
      header: "Bookings",
      sortable: true,
      render: (row) => {
        const count = getPassengerBookings((row as unknown as Passenger).uid).length
        return <span className="font-semibold text-[#172F52]">{count}</span>
      },
    },
    {
      key: "totalSpent",
      header: "Total Spent",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-[#172F52]">
          £{getPassengerSpent((row as unknown as Passenger).uid).toFixed(2)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
            (row as unknown as Passenger).status === "active"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          )}
        >
          {(row as unknown as Passenger).status}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      sortable: true,
      render: (row) => {
        const date = new Date((row as unknown as Passenger).createdAt)
        return <span className="text-[#6B7280]">{date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
      },
    },
    {
      key: "lastLoginAt",
      header: "Last Active",
      sortable: true,
      render: (row) => {
        const date = new Date((row as unknown as Passenger).lastLoginAt)
        return <span className="text-[#6B7280]">{date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        const p = row as unknown as Passenger
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); handleViewPassenger(p) }}>
              <Eye className="h-3.5 w-3.5 text-[#6B7280]" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={(e) => e.stopPropagation()}>
              <ClipboardList className="h-3.5 w-3.5 text-[#6B7280]" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); setSuspendTarget(p) }}>
              <UserX className="h-3.5 w-3.5 text-amber-600" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={(e) => e.stopPropagation()}>
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#172F52]">Passengers</h1>
        <p className="text-sm text-[#6B7280]">Manage all platform passengers</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DashboardCard title="Total Passengers" value={passengerStats.total} icon={<Users className="h-5 w-5" />} trend="up" change={12} />
        <DashboardCard title="Active Passengers" value={passengerStats.active} icon={<Users className="h-5 w-5" />} />
        <DashboardCard title="Total Bookings" value={passengerStats.totalBookings} icon={<ClipboardList className="h-5 w-5" />} />
        <DashboardCard title="Total Revenue" value={`£${passengerStats.totalRevenue.toFixed(0)}`} icon={<Banknote className="h-5 w-5" />} trend="up" change={18} />
      </div>

      <div className="rounded-xl border border-[#D9E0E8] bg-white p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name, email, or phone..."
            className="h-9 pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginated as unknown as Record<string, unknown>[]}
        emptyMessage="No passengers found"
        keyExtractor={(row) => (row as unknown as Passenger).uid}
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

      {/* Passenger Detail Modal */}
      <Modal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={selectedPassenger ? `${selectedPassenger.firstName} ${selectedPassenger.lastName}` : "Passenger Details"}
        size="lg"
      >
        {selectedPassenger && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#172F52] text-lg font-bold text-white">
                {selectedPassenger.firstName[0]}{selectedPassenger.lastName[0]}
              </div>
              <div>
                <p className="text-lg font-bold text-[#172F52]">
                  {selectedPassenger.firstName} {selectedPassenger.lastName}
                </p>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    selectedPassenger.status === "active"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  )}
                >
                  {selectedPassenger.status}
                </span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-lg bg-[#F5F7FA] p-3">
                <Mail className="h-4 w-4 text-[#6B7280]" />
                <span className="text-sm text-[#172F52]">{selectedPassenger.email}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-[#F5F7FA] p-3">
                <Phone className="h-4 w-4 text-[#6B7280]" />
                <span className="text-sm text-[#172F52]">{selectedPassenger.phone}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-[#F5F7FA] p-3">
                <Calendar className="h-4 w-4 text-[#6B7280]" />
                <span className="text-sm text-[#172F52]">
                  Joined {new Date(selectedPassenger.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-[#F5F7FA] p-3">
                <Banknote className="h-4 w-4 text-[#6B7280]" />
                <span className="text-sm font-semibold text-[#172F52]">
                  £{getPassengerSpent(selectedPassenger.uid).toFixed(2)} spent
                </span>
              </div>
            </div>
            <div className="border-t border-[#F5F7FA] pt-4">
              <p className="mb-2 text-xs font-semibold uppercase text-[#6B7280]">Recent Bookings</p>
              {getPassengerBookings(selectedPassenger.uid).length === 0 ? (
                <p className="text-sm text-[#6B7280]">No bookings found</p>
              ) : (
                <div className="space-y-2">
                  {getPassengerBookings(selectedPassenger.uid).slice(0, 3).map((b) => (
                    <div key={b.bookingNumber} className="flex items-center justify-between rounded-lg bg-[#F5F7FA] px-3 py-2">
                      <div>
                        <p className="font-mono text-xs font-medium text-[#172F52]">{b.bookingNumber}</p>
                        <p className="text-xs text-[#6B7280]">
                          {b.pickup.formattedAddress.split(",")[0]} → {b.destination.formattedAddress.split(",")[0]}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#172F52]">£{b.total.toFixed(2)}</p>
                        <StatusBadge status={b.bookingStatus} type="booking" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!suspendTarget}
        onOpenChange={(open) => { if (!open) setSuspendTarget(null) }}
        title="Suspend Passenger"
        description={`Are you sure you want to suspend ${suspendTarget?.firstName} ${suspendTarget?.lastName}? They will not be able to make new bookings.`}
        confirmText="Suspend"
        variant="destructive"
        onConfirm={() => setSuspendTarget(null)}
      />
    </div>
  )
}
