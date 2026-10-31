"use client"

import { useState } from "react"
import {
  Wallet,
  CreditCard,
  Building2,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Save,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { StatusBadge } from "@/components/shared/StatusBadge"

const payoutHistory = [
  {
    id: "PAY-2026-001",
    period: "18 Aug - 24 Aug 2026",
    gross: 3250.0,
    commission: 487.5,
    net: 2762.5,
    status: "completed",
    date: "25 Aug 2026",
  },
  {
    id: "PAY-2026-002",
    period: "11 Aug - 17 Aug 2026",
    gross: 2980.0,
    commission: 447.0,
    net: 2533.0,
    status: "completed",
    date: "18 Aug 2026",
  },
  {
    id: "PAY-2026-003",
    period: "04 Aug - 10 Aug 2026",
    gross: 3520.0,
    commission: 528.0,
    net: 2992.0,
    status: "completed",
    date: "11 Aug 2026",
  },
  {
    id: "PAY-2026-004",
    period: "28 Jul - 03 Aug 2026",
    gross: 2750.0,
    commission: 412.5,
    net: 2337.5,
    status: "completed",
    date: "04 Aug 2026",
  },
  {
    id: "PAY-2026-005",
    period: "21 Jul - 27 Jul 2026",
    gross: 3100.0,
    commission: 465.0,
    net: 2635.0,
    status: "completed",
    date: "28 Jul 2026",
  },
]

export default function OperatorPayoutsPage() {
  const [bankDetails, setBankDetails] = useState({
    accountName: "Kingsley Travel Ltd",
    sortCode: "40-47-84",
    accountNumber: "12345678",
    bankName: "Barclays",
  })
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1B2D]">Payouts</h1>
        <p className="text-sm text-[#5B6577]">Track your earnings and payout history.</p>
      </div>

      {/* Next Payout + Earnings Summary */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border-2 border-[#1F4FD8]/20 bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1F4FD8]/10">
              <Clock className="h-5 w-5 text-[#1F4FD8]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#5B6577]">Next Payout</p>
              <p className="text-lg font-bold text-[#0F1B2D]">26 Aug 2026</p>
            </div>
          </div>
          <div className="rounded-lg bg-[#F4F6F9] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5B6577]">Net Amount</span>
              <span className="text-xl font-bold text-[#0F1B2D]">£1,845.00</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[#5B6577]">
              <span>Gross: £2,170.00</span>
              <span>Commission: £325.00</span>
            </div>
          </div>
          <Button className="mt-4 w-full bg-[#1F4FD8] text-white hover:bg-[#1F4FD8]/90">
            <Wallet className="mr-2 h-4 w-4" />
            View Details
          </Button>
        </div>

        <div className="rounded-xl border border-[#E2E6EC] bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-[#0F1B2D]">Earnings Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#5B6577]" />
                <span className="text-sm text-[#5B6577]">This Week</span>
              </div>
              <span className="text-sm font-bold text-[#0F1B2D]">£2,170.00</span>
            </div>
            <div className="h-px bg-[#F4F6F9]" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#5B6577]" />
                <span className="text-sm text-[#5B6577]">This Month</span>
              </div>
              <span className="text-sm font-bold text-[#0F1B2D]">£8,450.00</span>
            </div>
            <div className="h-px bg-[#F4F6F9]" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#5B6577]" />
                <span className="text-sm text-[#5B6577]">This Quarter</span>
              </div>
              <span className="text-sm font-bold text-[#0F1B2D]">£24,850.00</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E6EC] bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-[#0F1B2D]">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5B6577]">Total Paid Out</span>
              <span className="text-sm font-bold text-[#0F1B2D]">£52,400.00</span>
            </div>
            <div className="h-px bg-[#F4F6F9]" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5B6577]">Commission Rate</span>
              <span className="text-sm font-bold text-[#0F1B2D]">15%</span>
            </div>
            <div className="h-px bg-[#F4F6F9]" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5B6577]">Payout Frequency</span>
              <span className="text-sm font-bold text-[#0F1B2D]">Weekly</span>
            </div>
            <div className="h-px bg-[#F4F6F9]" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5B6577]">Avg. per Payout</span>
              <span className="text-sm font-bold text-[#0F1B2D]">£2,650.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payout History */}
      <div className="rounded-xl border border-[#E2E6EC] bg-white">
        <div className="border-b border-[#E2E6EC] px-6 py-4">
          <h3 className="text-base font-bold text-[#0F1B2D]">Payout History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E2E6EC] bg-[#F4F6F9]">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#5B6577]">Period</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#5B6577]">Gross Amount</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#5B6577]">Commission</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#5B6577]">Net Amount</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#5B6577]">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#5B6577]">Paid Date</th>
              </tr>
            </thead>
            <tbody>
              {payoutHistory.map((payout) => (
                <tr
                  key={payout.id}
                  className="border-b border-[#F4F6F9] last:border-0 hover:bg-[#F4F6F9]/50"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-[#0F1B2D]">{payout.period}</p>
                      <p className="text-xs text-[#5B6577]">{payout.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-[#0F1B2D]">
                    £{payout.gross.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-[#DC3545]">
                    -£{payout.commission.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-bold text-[#0F1B2D]">
                    £{payout.net.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="bg-green-500/10 text-green-600">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Completed
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[#5B6577]">{payout.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Settings */}
      <div className="rounded-xl border border-[#E2E6EC] bg-white p-6">
        <h3 className="mb-1 text-base font-bold text-[#0F1B2D]">Payout Settings</h3>
        <p className="mb-4 text-xs text-[#5B6577]">Bank details for receiving payouts.</p>

        {saved && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Bank details saved successfully.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F1B2D]">
              Account Holder Name
            </label>
            <Input
              value={bankDetails.accountName}
              onChange={(e) =>
                setBankDetails((p) => ({ ...p, accountName: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F1B2D]">
              Bank Name
            </label>
            <Input
              value={bankDetails.bankName}
              onChange={(e) =>
                setBankDetails((p) => ({ ...p, bankName: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F1B2D]">
              Sort Code
            </label>
            <Input
              value={bankDetails.sortCode}
              onChange={(e) =>
                setBankDetails((p) => ({ ...p, sortCode: e.target.value }))
              }
              placeholder="XX-XX-XX"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F1B2D]">
              Account Number
            </label>
            <Input
              value={bankDetails.accountNumber}
              onChange={(e) =>
                setBankDetails((p) => ({ ...p, accountNumber: e.target.value }))
              }
              placeholder="8 digits"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button className="bg-[#1F4FD8] text-white hover:bg-[#1F4FD8]/90" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Bank Details
          </Button>
        </div>
      </div>
    </div>
  )
}
