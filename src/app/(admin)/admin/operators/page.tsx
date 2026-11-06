"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Search,
  Eye,
  Edit,
  UserX,
  UserCheck,
  Plus,
  Building,
  Car,
  ClipboardList,
  Banknote,
  Wallet,
  Users,
  ShieldCheck,
  Save,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { RatingStars } from "@/components/shared/RatingStars"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { Modal } from "@/components/shared/Modal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { listenToOperators, updateOperator, setOperatorStatus } from "@/lib/services/operator-service"
import { listenToDrivers } from "@/lib/services/driver-service"
import { listenToVehicles } from "@/lib/services/vehicle-service"
import { listenToAllBookings } from "@/lib/services/booking-service"
import { createOperatorAccount } from "@/lib/firebase/auth"
import { BookingStatus, type Booking, type Driver, type Operator, type Vehicle } from "@/types"

// Bookings in these states never brought money in, so they don't count
// towards an operator's revenue.
const NON_REVENUE_STATUSES = new Set<string>([
  BookingStatus.PendingPayment,
  BookingStatus.PaymentFailed,
  BookingStatus.CancelledByPassenger,
  BookingStatus.CancelledByDriver,
  BookingStatus.CancelledByOperator,
  BookingStatus.CancelledByAdmin,
])

interface OperatorForm {
  companyName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  description: string
  fleetSize: string
  commissionPercent: string
  commissionFlatFee: string
  isVerified: boolean
}

const EMPTY_FORM: OperatorForm = {
  companyName: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  description: "",
  fleetSize: "0",
  commissionPercent: "15",
  commissionFlatFee: "0",
  isVerified: false,
}

interface OperatorRow {
  operator: Operator
  uid: string
  companyName: string
  drivers: number
  vehicles: number
  bookings: number
  revenue: number
  rating: number
  status: string
}

function initials(name: string) {
  return (name || "?").split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
}

function formatDate(value: unknown) {
  if (!value) return "-"
  const v = value as { toDate?: () => Date; seconds?: number }
  const date = typeof v.toDate === "function"
    ? v.toDate()
    : typeof v.seconds === "number"
      ? new Date(v.seconds * 1000)
      : new Date(value as string)
  return isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
  let pw = ""
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)]
  return pw + "!1"
}

function toNumber(value: string, fallback = 0) {
  const n = parseFloat(value)
  return isNaN(n) ? fallback : n
}

export default function AdminOperatorsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null)

  const [operators, setOperators] = useState<Operator[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [walletTarget, setWalletTarget] = useState<Operator | null>(null)
  const [statusTarget, setStatusTarget] = useState<Operator | null>(null)
  const [actionError, setActionError] = useState("")

  // Add / edit form — editingId === null means "add new"
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<OperatorForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null)

  useEffect(() => {
    const unsubs = [
      listenToOperators(
        (data) => {
          // Self-registered operators may lack company fields; normalise so
          // the table never crashes on a missing value.
          setOperators(
            data.map((o) => {
              const raw = o as Operator & { id?: string }
              return {
                ...raw,
                uid: raw.uid || raw.id || "",
                companyName: raw.companyName || `${raw.firstName ?? ""} ${raw.lastName ?? ""}`.trim() || "Unnamed operator",
                firstName: raw.firstName ?? "",
                lastName: raw.lastName ?? "",
                email: raw.email ?? "",
                phone: raw.phone ?? "",
                description: raw.description ?? "",
                rating: raw.rating ?? 0,
                totalReviews: raw.totalReviews ?? 0,
                fleetSize: raw.fleetSize ?? 0,
                isVerified: raw.isVerified ?? false,
                status: raw.status === "suspended" ? "suspended" : "active",
                commission: {
                  percent: raw.commission?.percent ?? 0,
                  flatFee: raw.commission?.flatFee ?? 0,
                },
              }
            })
          )
          setLoading(false)
        },
        (err) => {
          setOperators([])
          setLoading(false)
          setLoadError(err.message || "Could not load operators.")
        }
      ),
      listenToDrivers((data) => setDrivers(data), () => setDrivers([])),
      listenToVehicles((data) => setVehicles(data), () => setVehicles([])),
      listenToAllBookings((data) => setBookings(data), () => setBookings([])),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  // Per-operator aggregates, computed once per data change.
  const statsByOperator = useMemo(() => {
    const map: Record<string, { drivers: Driver[]; vehicles: Vehicle[]; bookings: Booking[]; revenue: number }> = {}
    const ensure = (id: string) => (map[id] ??= { drivers: [], vehicles: [], bookings: [], revenue: 0 })
    drivers.forEach((d) => d.operatorId && ensure(d.operatorId).drivers.push(d))
    vehicles.forEach((v) => v.operatorId && ensure(v.operatorId).vehicles.push(v))
    bookings.forEach((b) => {
      if (!b.operatorId) return
      const s = ensure(b.operatorId)
      s.bookings.push(b)
      if (!NON_REVENUE_STATUSES.has(b.bookingStatus)) s.revenue += Number(b.total) || 0
    })
    return map
  }, [drivers, vehicles, bookings])

  const statsFor = (uid: string) => statsByOperator[uid] ?? { drivers: [], vehicles: [], bookings: [], revenue: 0 }

  const operatorStats = useMemo(() => {
    const ids = new Set(operators.map((o) => o.uid))
    let totalDrivers = 0, totalVehicles = 0, totalBookings = 0, totalRevenue = 0
    ids.forEach((id) => {
      const s = statsByOperator[id]
      if (!s) return
      totalDrivers += s.drivers.length
      totalVehicles += s.vehicles.length
      totalBookings += s.bookings.length
      totalRevenue += s.revenue
    })
    return {
      total: operators.length,
      active: operators.filter((o) => o.status === "active").length,
      totalDrivers,
      totalVehicles,
      totalBookings,
      totalRevenue,
    }
  }, [operators, statsByOperator])

  const rows: OperatorRow[] = useMemo(() => {
    let result = operators

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (o) =>
          o.companyName.toLowerCase().includes(q) ||
          o.firstName.toLowerCase().includes(q) ||
          o.lastName.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q) ||
          o.phone.includes(q)
      )
    }
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter)
    }

    const mapped = result.map((o) => {
      const s = statsFor(o.uid)
      return {
        operator: o,
        uid: o.uid,
        companyName: o.companyName,
        drivers: s.drivers.length,
        vehicles: s.vehicles.length,
        bookings: s.bookings.length,
        revenue: s.revenue,
        rating: o.rating,
        status: o.status,
      }
    })

    if (sort) {
      const k = sort.key as keyof OperatorRow
      mapped.sort((a, b) => {
        const av = a[k] as string | number
        const bv = b[k] as string | number
        const cmp = typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv))
        return sort.dir === "asc" ? cmp : -cmp
      })
    } else {
      mapped.sort((a, b) => a.companyName.localeCompare(b.companyName))
    }
    return mapped
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operators, statsByOperator, search, statusFilter, sort])

  const totalPages = Math.ceil(rows.length / pageSize)
  const paginated = rows.slice((page - 1) * pageSize, page * pageSize)

  // ---------- actions ----------

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError("")
    setFormOpen(true)
  }

  function openEdit(o: Operator) {
    setEditingId(o.uid)
    setForm({
      companyName: o.companyName,
      firstName: o.firstName,
      lastName: o.lastName,
      email: o.email,
      phone: o.phone,
      description: o.description,
      fleetSize: String(o.fleetSize ?? 0),
      commissionPercent: String(o.commission.percent),
      commissionFlatFee: String(o.commission.flatFee),
      isVerified: o.isVerified,
    })
    setFormError("")
    setFormOpen(true)
  }

  const formValid =
    form.companyName.trim() && form.firstName.trim() && form.lastName.trim() && form.email.trim()

  async function handleSave() {
    if (!formValid) return
    const percent = toNumber(form.commissionPercent)
    if (percent < 0 || percent > 100) {
      setFormError("Commission % must be between 0 and 100.")
      return
    }
    setSaving(true)
    setFormError("")
    const company = {
      companyName: form.companyName.trim(),
      description: form.description.trim(),
      fleetSize: Math.max(0, Math.round(toNumber(form.fleetSize))),
      commission: { percent, flatFee: Math.max(0, toNumber(form.commissionFlatFee)) },
    }
    try {
      if (editingId) {
        await updateOperator(editingId, {
          ...company,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          isVerified: form.isVerified,
        })
        setFormOpen(false)
      } else {
        const email = form.email.trim()
        const password = generateTempPassword()
        await createOperatorAccount(
          email,
          password,
          { firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone: form.phone.trim() },
          company
        )
        setFormOpen(false)
        setCreatedCredentials({ email, password })
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save operator.")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus() {
    if (!statusTarget) return
    const next = statusTarget.status === "suspended" ? "active" : "suspended"
    setActionError("")
    try {
      await setOperatorStatus(statusTarget.uid, next)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update operator status.")
    } finally {
      setStatusTarget(null)
    }
  }

  // ---------- table ----------

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "companyName",
      header: "Company",
      sortable: true,
      render: (row) => {
        const o = (row as unknown as OperatorRow).operator
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F1B2D] text-xs font-bold text-white">
              {initials(o.companyName)}
            </div>
            <div>
              <span className="font-medium text-[#0F1B2D]">
                {o.companyName}
                {o.isVerified && <ShieldCheck className="ml-1 inline h-3.5 w-3.5 text-green-600" />}
              </span>
              <p className="text-xs text-[#5B6577]">{o.firstName} {o.lastName}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: "contact",
      header: "Contact",
      render: (row) => {
        const o = (row as unknown as OperatorRow).operator
        return (
          <div>
            <p className="text-sm text-[#0F1B2D]">{o.email}</p>
            <p className="text-xs text-[#5B6577]">{o.phone || "-"}</p>
          </div>
        )
      },
    },
    {
      key: "drivers",
      header: "Drivers",
      sortable: true,
      render: (row) => <span className="font-semibold text-[#0F1B2D]">{(row as unknown as OperatorRow).drivers}</span>,
    },
    {
      key: "vehicles",
      header: "Vehicles",
      sortable: true,
      render: (row) => <span className="font-semibold text-[#0F1B2D]">{(row as unknown as OperatorRow).vehicles}</span>,
    },
    {
      key: "bookings",
      header: "Bookings",
      sortable: true,
      render: (row) => <span className="font-semibold text-[#0F1B2D]">{(row as unknown as OperatorRow).bookings}</span>,
    },
    {
      key: "revenue",
      header: "Revenue",
      sortable: true,
      render: (row) => <span className="font-semibold text-[#0F1B2D]">£{(row as unknown as OperatorRow).revenue.toFixed(0)}</span>,
    },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      render: (row) => {
        const o = (row as unknown as OperatorRow).operator
        return <RatingStars rating={o.rating} size="sm" count={o.totalReviews} />
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const o = (row as unknown as OperatorRow).operator
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
        const o = (row as unknown as OperatorRow).operator
        const suspended = o.status === "suspended"
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" title="View" onClick={(e) => { e.stopPropagation(); setSelectedOperator(o); setDetailOpen(true) }}>
              <Eye className="h-3.5 w-3.5 text-[#5B6577]" />
            </Button>
            <Button variant="ghost" size="icon-xs" title="Edit" onClick={(e) => { e.stopPropagation(); openEdit(o) }}>
              <Edit className="h-3.5 w-3.5 text-[#5B6577]" />
            </Button>
            <Button variant="ghost" size="icon-xs" title={suspended ? "Reactivate" : "Suspend"} onClick={(e) => { e.stopPropagation(); setStatusTarget(o) }}>
              {suspended
                ? <UserCheck className="h-3.5 w-3.5 text-green-600" />
                : <UserX className="h-3.5 w-3.5 text-amber-600" />}
            </Button>
            <Button variant="ghost" size="icon-xs" title="Earnings" onClick={(e) => { e.stopPropagation(); setWalletTarget(o) }}>
              <Wallet className="h-3.5 w-3.5 text-[#5B6577]" />
            </Button>
          </div>
        )
      },
    },
  ]

  // Earnings breakdown for the wallet modal
  const wallet = useMemo(() => {
    if (!walletTarget) return null
    const s = statsFor(walletTarget.uid)
    const earning = s.bookings.filter((b) => !NON_REVENUE_STATUSES.has(b.bookingStatus))
    const completed = earning.filter((b) => b.bookingStatus === BookingStatus.TripCompleted)
    const gross = s.revenue
    const commission = gross * (walletTarget.commission.percent / 100) + walletTarget.commission.flatFee * earning.length
    return {
      gross,
      commission,
      net: gross - commission,
      paidBookings: earning.length,
      completed: completed.length,
      completedValue: completed.reduce((sum, b) => sum + (Number(b.total) || 0), 0),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletTarget, statsByOperator])

  const field = (key: keyof OperatorForm) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value })),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Operators</h1>
          <p className="text-sm text-[#5B6577]">Manage all platform operators</p>
        </div>
        <Button className="bg-[#1F4FD8] text-white hover:bg-[#1F4FD8]/90" onClick={openAdd}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Operator
        </Button>
      </div>

      {(loadError || actionError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError || actionError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <DashboardCard title="Total Operators" value={operatorStats.total} icon={<Building className="h-5 w-5" />} />
        <DashboardCard title="Total Drivers" value={operatorStats.totalDrivers} icon={<Users className="h-5 w-5" />} />
        <DashboardCard title="Total Vehicles" value={operatorStats.totalVehicles} icon={<Car className="h-5 w-5" />} />
        <DashboardCard title="Total Bookings" value={operatorStats.totalBookings} icon={<ClipboardList className="h-5 w-5" />} />
        <DashboardCard title="Total Revenue" value={`£${operatorStats.totalRevenue.toFixed(0)}`} icon={<Banknote className="h-5 w-5" />} />
      </div>

      <div className="rounded-xl border border-[#E2E6EC] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6577]" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by company, name, email or phone..."
              className="h-9 pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]"
          >
            <option value="all">All Statuses ({operators.length})</option>
            <option value="active">Active ({operatorStats.active})</option>
            <option value="suspended">Suspended ({operators.length - operatorStats.active})</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginated as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyMessage={search || statusFilter !== "all" ? "No operators match your filters" : "No operators yet — click Add Operator to create one"}
        keyExtractor={(row) => (row as unknown as OperatorRow).uid}
        onSort={(key, dir) => { setSort({ key, dir }); setPage(1) }}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#5B6577]">
          {rows.length === 0
            ? "Showing 0 of 0"
            : `Showing ${(page - 1) * pageSize + 1} to ${Math.min(page * pageSize, rows.length)} of ${rows.length}`}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-xs" disabled={page === 1} onClick={() => setPage(1)}>«</Button>
          <Button variant="outline" size="icon-xs" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</Button>
          <span className="px-2 text-sm font-medium text-[#0F1B2D]">{page} / {totalPages || 1}</span>
          <Button variant="outline" size="icon-xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</Button>
          <Button variant="outline" size="icon-xs" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</Button>
        </div>
      </div>

      {/* Add / Edit Operator Modal */}
      <Modal
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingId ? "Edit Operator" : "Add New Operator"}
        description={editingId ? undefined : "Creates a login for the operator. You'll get a temporary password to share with them."}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium text-[#0F1B2D]">Company Name *</Label>
              <Input {...field("companyName")} placeholder="e.g. Heathrow Executive Cars Ltd" className="mt-1 h-10" />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#0F1B2D]">Contact First Name *</Label>
              <Input {...field("firstName")} placeholder="e.g. James" className="mt-1 h-10" />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#0F1B2D]">Contact Last Name *</Label>
              <Input {...field("lastName")} placeholder="e.g. Carter" className="mt-1 h-10" />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#0F1B2D]">Email *</Label>
              <Input
                type="email"
                {...field("email")}
                disabled={!!editingId}
                placeholder="e.g. bookings@company.co.uk"
                className="mt-1 h-10"
              />
              {editingId && <p className="mt-1 text-xs text-[#5B6577]">Login email can&apos;t be changed here.</p>}
            </div>
            <div>
              <Label className="text-sm font-medium text-[#0F1B2D]">Phone</Label>
              <Input {...field("phone")} placeholder="e.g. +447700900000" className="mt-1 h-10" />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#0F1B2D]">Commission %</Label>
              <Input type="number" min={0} max={100} step="0.5" {...field("commissionPercent")} className="mt-1 h-10" />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#0F1B2D]">Flat Fee per Booking (£)</Label>
              <Input type="number" min={0} step="0.5" {...field("commissionFlatFee")} className="mt-1 h-10" />
            </div>
            <div>
              <Label className="text-sm font-medium text-[#0F1B2D]">Fleet Size</Label>
              <Input type="number" min={0} step="1" {...field("fleetSize")} className="mt-1 h-10" />
            </div>
            {editingId && (
              <label className="flex items-center gap-2 self-end pb-2 text-sm text-[#0F1B2D]">
                <input
                  type="checkbox"
                  checked={form.isVerified}
                  onChange={(e) => setForm((p) => ({ ...p, isVerified: e.target.checked }))}
                  className="h-4 w-4 rounded border-[#E2E6EC]"
                />
                Verified operator
              </label>
            )}
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium text-[#0F1B2D]">Description</Label>
              <Textarea {...field("description")} rows={3} placeholder="Short description of the company and its services" className="mt-1" />
            </div>
          </div>

          {formError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{formError}</div>}

          <div className="flex items-center justify-end gap-3 border-t border-[#E2E6EC] pt-4">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#1F4FD8] text-white hover:bg-[#1F4FD8]/90"
              onClick={handleSave}
              disabled={!formValid || saving}
            >
              {editingId ? <Save className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Operator"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Credentials Modal */}
      <Modal
        open={!!createdCredentials}
        onOpenChange={(open) => { if (!open) setCreatedCredentials(null) }}
        title="Operator Account Created"
        description="Share these login details with the operator securely — they won't be shown again. They should change their password after first login."
        size="md"
      >
        {createdCredentials && (
          <div className="space-y-3">
            <div className="rounded-lg bg-[#F4F6F9] p-3">
              <p className="text-xs font-semibold uppercase text-[#5B6577]">Email</p>
              <p className="font-mono text-sm text-[#0F1B2D]">{createdCredentials.email}</p>
            </div>
            <div className="rounded-lg bg-[#F4F6F9] p-3">
              <p className="text-xs font-semibold uppercase text-[#5B6577]">Temporary Password</p>
              <p className="font-mono text-sm text-[#0F1B2D]">{createdCredentials.password}</p>
            </div>
            <div className="flex justify-end pt-2">
              <Button className="bg-[#1F4FD8] text-white hover:bg-[#1F4FD8]/90" onClick={() => setCreatedCredentials(null)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Operator Detail Modal */}
      <Modal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={selectedOperator?.companyName ?? "Operator Details"}
        size="lg"
      >
        {selectedOperator && (() => {
          const s = statsFor(selectedOperator.uid)
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#0F1B2D] text-lg font-bold text-white">
                  {initials(selectedOperator.companyName)}
                </div>
                <div>
                  <p className="text-lg font-bold text-[#0F1B2D]">{selectedOperator.companyName}</p>
                  <div className="flex items-center gap-2">
                    <RatingStars rating={selectedOperator.rating} size="sm" count={selectedOperator.totalReviews} />
                    {selectedOperator.isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {selectedOperator.description && (
                <p className="text-sm text-[#5B6577]">{selectedOperator.description}</p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="Contact Person" value={`${selectedOperator.firstName} ${selectedOperator.lastName}`} />
                <Info label="Phone" value={selectedOperator.phone || "-"} />
                <Info label="Email" value={selectedOperator.email} />
                <Info label="Commission" value={`${selectedOperator.commission.percent}% + £${selectedOperator.commission.flatFee}`} />
                <Info label="Fleet Size (declared)" value={String(selectedOperator.fleetSize ?? 0)} />
                <Info label="Joined" value={formatDate(selectedOperator.createdAt)} />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <Stat value={s.drivers.length} label="Drivers" />
                <Stat value={s.vehicles.length} label="Vehicles" />
                <Stat value={s.bookings.length} label="Bookings" />
                <Stat value={`£${s.revenue.toFixed(0)}`} label="Revenue" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-[#5B6577]">Drivers</p>
                  {s.drivers.length === 0 ? (
                    <p className="text-sm text-[#5B6577]">No drivers assigned</p>
                  ) : (
                    <ul className="max-h-40 space-y-1 overflow-y-auto">
                      {s.drivers.map((d) => (
                        <li key={d.uid} className="flex justify-between rounded-md bg-[#F4F6F9] px-3 py-1.5 text-sm">
                          <span className="text-[#0F1B2D]">{d.firstName} {d.lastName}</span>
                          <span className="text-xs text-[#5B6577]">{d.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-[#5B6577]">Vehicles</p>
                  {s.vehicles.length === 0 ? (
                    <p className="text-sm text-[#5B6577]">No vehicles assigned</p>
                  ) : (
                    <ul className="max-h-40 space-y-1 overflow-y-auto">
                      {s.vehicles.map((v) => (
                        <li key={v.id} className="flex justify-between rounded-md bg-[#F4F6F9] px-3 py-1.5 text-sm">
                          <span className="text-[#0F1B2D]">{v.make} {v.model}</span>
                          <span className="font-mono text-xs text-[#5B6577]">{v.registration}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#E2E6EC] pt-4">
                <Button variant="outline" onClick={() => { setDetailOpen(false); openEdit(selectedOperator) }}>
                  <Edit className="mr-1.5 h-4 w-4" /> Edit
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* Earnings Modal */}
      <Modal
        open={!!walletTarget}
        onOpenChange={(open) => { if (!open) setWalletTarget(null) }}
        title={walletTarget ? `${walletTarget.companyName} — Earnings` : "Earnings"}
        description={walletTarget ? `Commission: ${walletTarget.commission.percent}% + £${walletTarget.commission.flatFee} per booking` : undefined}
        size="md"
      >
        {wallet && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Stat value={wallet.paidBookings} label="Paid bookings" />
              <Stat value={wallet.completed} label="Completed trips" />
            </div>
            <div className="space-y-2 rounded-lg bg-[#F4F6F9] p-4 text-sm">
              <Row label="Gross booking value" value={`£${wallet.gross.toFixed(2)}`} />
              <Row label="Platform commission" value={`− £${wallet.commission.toFixed(2)}`} />
              <div className="border-t border-[#E2E6EC] pt-2">
                <Row label="Operator earnings" value={`£${wallet.net.toFixed(2)}`} bold />
              </div>
              <Row label="Of which from completed trips" value={`£${wallet.completedValue.toFixed(2)}`} muted />
            </div>
            <div className="flex justify-end pt-1">
              <Button variant="outline" onClick={() => setWalletTarget(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!statusTarget}
        onOpenChange={(open) => { if (!open) setStatusTarget(null) }}
        title={statusTarget?.status === "suspended" ? "Reactivate Operator" : "Suspend Operator"}
        description={
          statusTarget?.status === "suspended"
            ? `Reactivate ${statusTarget?.companyName}? They will be able to receive bookings again.`
            : `Are you sure you want to suspend ${statusTarget?.companyName}? All their drivers will be affected.`
        }
        confirmText={statusTarget?.status === "suspended" ? "Reactivate" : "Suspend"}
        variant={statusTarget?.status === "suspended" ? "default" : "destructive"}
        onConfirm={handleToggleStatus}
      />
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#F4F6F9] p-3">
      <p className="text-xs font-semibold uppercase text-[#5B6577]">{label}</p>
      <p className="text-sm text-[#0F1B2D] break-words">{value}</p>
    </div>
  )
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg bg-[#F4F6F9] p-3 text-center">
      <p className="text-lg font-bold text-[#0F1B2D]">{value}</p>
      <p className="text-[10px] text-[#5B6577]">{label}</p>
    </div>
  )
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className={cn("flex justify-between", muted && "text-xs text-[#5B6577]")}>
      <span className={cn(!muted && "text-[#5B6577]")}>{label}</span>
      <span className={cn("text-[#0F1B2D]", bold && "font-bold")}>{value}</span>
    </div>
  )
}
