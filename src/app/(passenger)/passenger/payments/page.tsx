"use client"

import { useMemo, useState, useEffect } from "react"
import { Download, Wallet, TrendingUp, CreditCard } from "lucide-react"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { listenToPassengerBookings } from "@/lib/services/booking-service"
import type { Booking } from "@/types"

export default function PaymentsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    if (!user) {
      setBookings([])
      return
    }
    const unsub = listenToPassengerBookings(
      user.uid,
      (data) => setBookings(data),
      () => setBookings([])
    )
    return unsub
  }, [user])

  const payments = useMemo(
    () =>
      [...bookings].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [bookings]
  )

  const totalSpent = useMemo(
    () =>
      payments
        .filter((p) => p.paymentStatus === "completed")
        .reduce((sum, p) => sum + p.total, 0),
    [payments]
  )

  const thisMonth = useMemo(() => {
    const now = new Date()
    return payments
      .filter(
        (p) =>
          p.paymentStatus === "completed" &&
          new Date(p.createdAt).getMonth() === now.getMonth() &&
          new Date(p.createdAt).getFullYear() === now.getFullYear()
      )
      .reduce((sum, p) => sum + p.total, 0)
  }, [payments])

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return payments.slice(start, start + pageSize)
  }, [payments, page])

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "createdAt",
      header: "Date",
      sortable: true,
      render: (row) => {
        const p = row as unknown as Booking
        return (
          <span className="text-sm text-[#172F52]">
            {new Date(p.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        )
      },
    },
    {
      key: "bookingNumber",
      header: "Booking ID",
      render: (row) => {
        const p = row as unknown as Booking
        return (
          <span className="text-xs font-medium text-[#6B7280]">
            {p.bookingNumber}
          </span>
        )
      },
    },
    {
      key: "total",
      header: "Amount",
      sortable: true,
      render: (row) => {
        const p = row as unknown as Booking
        return (
          <span className="text-sm font-semibold text-[#172F52]">
            £{p.total.toFixed(2)}
          </span>
        )
      },
    },
    {
      key: "paymentMethod",
      header: "Payment Method",
      render: (row) => {
        const p = row as unknown as Booking
        return (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#6B7280]" />
            <span className="text-sm capitalize text-[#172F52]">
              {p.paymentMethod ?? "-"}
            </span>
          </div>
        )
      },
    },
    {
      key: "paymentStatus",
      header: "Status",
      render: (row) => {
        const p = row as unknown as Booking
        return <StatusBadge status={p.paymentStatus} type="payment" />
      },
    },
    {
      key: "receipt",
      header: "Receipt",
      render: () => (
        <Button variant="ghost" size="sm" className="gap-1.5 text-[#D4145A]" disabled>
          <Download className="h-3.5 w-3.5" /> Download
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#172F52]">Payments</h1>
        <p className="text-sm text-[#6B7280]">
          View your payment history from your bookings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DashboardCard
          title="Total Spent"
          value={`£${totalSpent.toFixed(2)}`}
          icon={<Wallet className="h-5 w-5" />}
        />
        <DashboardCard
          title="This Month"
          value={`£${thisMonth.toFixed(2)}`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <DataTable
        columns={columns}
        data={paginated as unknown as Record<string, unknown>[]}
        keyExtractor={(row) => (row as unknown as Booking).bookingNumber}
        emptyMessage="No payments yet"
        pagination={{
          page,
          pageSize,
          total: payments.length,
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
