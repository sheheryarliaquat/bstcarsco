"use client"

import { useMemo, useState } from "react"
import { Download, Wallet, TrendingUp, CreditCard } from "lucide-react"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { DEMO_DATA } from "@/constants"
import type { Payment } from "@/types"

const demoPayments: Payment[] = [
  {
    id: "pay-001",
    bookingId: "UKTB-2026-000001",
    userId: "pass-001",
    stripePaymentIntentId: "pi_001",
    stripeCustomerId: "cus_001",
    amount: 51.0,
    currency: "GBP",
    status: "completed",
    paymentMethod: "Visa •••• 4242",
    createdAt: "2026-08-20T14:30:00Z",
  },
  {
    id: "pay-002",
    bookingId: "UKTB-2026-000002",
    userId: "pass-001",
    stripePaymentIntentId: "pi_002",
    stripeCustomerId: "cus_001",
    amount: 11.52,
    currency: "GBP",
    status: "completed",
    paymentMethod: "Visa •••• 4242",
    createdAt: "2026-08-24T16:00:00Z",
  },
  {
    id: "pay-003",
    bookingId: "UKTB-2026-000007",
    userId: "pass-001",
    stripePaymentIntentId: "pi_003",
    stripeCustomerId: "cus_001",
    amount: 17.4,
    currency: "GBP",
    status: "completed",
    paymentMethod: "Mastercard •••• 8888",
    createdAt: "2026-08-18T10:00:00Z",
  },
  {
    id: "pay-004",
    bookingId: "UKTB-2026-000008",
    userId: "pass-001",
    stripePaymentIntentId: "pi_004",
    stripeCustomerId: "cus_001",
    amount: 41.04,
    currency: "GBP",
    status: "completed",
    paymentMethod: "Visa •••• 4242",
    createdAt: "2026-08-13T12:00:00Z",
  },
  {
    id: "pay-005",
    bookingId: "UKTB-2026-000009",
    userId: "pass-001",
    stripePaymentIntentId: "pi_005",
    stripeCustomerId: "cus_001",
    amount: 153.36,
    currency: "GBP",
    status: "completed",
    paymentMethod: "Visa •••• 4242",
    createdAt: "2026-08-08T09:00:00Z",
  },
  {
    id: "pay-006",
    bookingId: "UKTB-2026-000011",
    userId: "pass-001",
    stripePaymentIntentId: "pi_006",
    stripeCustomerId: "cus_001",
    amount: 159.84,
    currency: "GBP",
    status: "completed",
    paymentMethod: "Mastercard •••• 8888",
    createdAt: "2026-07-25T14:00:00Z",
  },
  {
    id: "pay-007",
    bookingId: "UKTB-2026-000013",
    userId: "pass-001",
    stripePaymentIntentId: "pi_007",
    stripeCustomerId: "cus_001",
    amount: 6.6,
    currency: "GBP",
    status: "completed",
    paymentMethod: "Visa •••• 4242",
    createdAt: "2026-07-14T18:00:00Z",
  },
]

export default function PaymentsPage() {
  const [page, setPage] = useState(1)
  const pageSize = 10

  const totalSpent = useMemo(
    () =>
      demoPayments
        .filter((p) => p.status === "completed")
        .reduce((sum, p) => sum + p.amount, 0),
    []
  )

  const thisMonth = useMemo(() => {
    const now = new Date()
    return demoPayments
      .filter(
        (p) =>
          p.status === "completed" &&
          new Date(p.createdAt).getMonth() === now.getMonth() &&
          new Date(p.createdAt).getFullYear() === now.getFullYear()
      )
      .reduce((sum, p) => sum + p.amount, 0)
  }, [])

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return demoPayments.slice(start, start + pageSize)
  }, [page])

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "createdAt",
      header: "Date",
      sortable: true,
      render: (row) => {
        const p = row as unknown as Payment
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
      key: "bookingId",
      header: "Booking ID",
      render: (row) => {
        const p = row as unknown as Payment
        return (
          <span className="text-xs font-medium text-[#6B7280]">
            {p.bookingId}
          </span>
        )
      },
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      render: (row) => {
        const p = row as unknown as Payment
        return (
          <span className="text-sm font-semibold text-[#172F52]">
            £{p.amount.toFixed(2)}
          </span>
        )
      },
    },
    {
      key: "paymentMethod",
      header: "Payment Method",
      render: (row) => {
        const p = row as unknown as Payment
        return (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#6B7280]" />
            <span className="text-sm text-[#172F52]">{p.paymentMethod}</span>
          </div>
        )
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const p = row as unknown as Payment
        return <StatusBadge status={p.status} type="payment" />
      },
    },
    {
      key: "receipt",
      header: "Receipt",
      render: () => (
        <Button variant="ghost" size="sm" className="gap-1.5 text-[#D4145A]">
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
          View your payment history and download receipts.
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
        keyExtractor={(row) => (row as unknown as Payment).id}
        pagination={{
          page,
          pageSize,
          total: demoPayments.length,
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
