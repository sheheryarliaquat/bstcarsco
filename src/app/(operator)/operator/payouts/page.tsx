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
        <h1 className="text-2xl font-bold text-[#172F52]">Payouts</h1>
        <p className="text-sm text-[#6B7280]">Track your earnings and payout history.</p>
      </div>

      {/* Next Payout + Earnings Summary */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border-2 border-[#D4145A]/20 bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4145A]/10">
              <Clock className="h-5 w-5 text-[#D4145A]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Next Payout</p>
              <p className="text-lg font-bold text-[#172F52]">26 Aug 2026</p>
            </div>
          </div>
          <div className="rounded-lg bg-[#F5F7FA] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6B7280]">Net Amount</span>
              <span className="text-xl font-bold text-[#172F52]">£1,845.00</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[#6B7280]">
              <span>Gross: £2,170.00</span>
              <span>Commission: £325.00</span>
            </div>
          </div>
          <Button className="mt-4 w-full bg-[#D4145A] text-white hover:bg-[#D4145A]/90">
            <Wallet className="mr-2 h-4 w-4" />
            View Details
          </Button>
        </div>

        <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-[#172F52]">Earnings Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#6B7280]" />
                <span className="text-sm text-[#6B7280]">This Week</span>
              </div>
              <span className="text-sm font-bold text-[#172F52]">£2,170.00</span>
            </div>
            <div className="h-px bg-[#F5F7FA]" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#6B7280]" />
                <span className="text-sm text-[#6B7280]">This Month</span>
              </div>
              <span className="text-sm font-bold text-[#172F52]">£8,450.00</span>
            </div>
            <div className="h-px bg-[#F5F7FA]" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#6B7280]" />
                <span className="text-sm text-[#6B7280]">This Quarter</span>
              </div>
              <span className="text-sm font-bold text-[#172F52]">£24,850.00</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-[#172F52]">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6B7280]">Total Paid Out</span>
              <span className="text-sm font-bold text-[#172F52]">£52,400.00</span>
            </div>
            <div className="h-px bg-[#F5F7FA]" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6B7280]">Commission Rate</span>
              <span className="text-sm font-bold text-[#172F52]">15%</span>
            </div>
            <div className="h-px bg-[#F5F7FA]" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6B7280]">Payout Frequency</span>
              <span className="text-sm font-bold text-[#172F52]">Weekly</span>
            </div>
            <div className="h-px bg-[#F5F7FA]" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6B7280]">Avg. per Payout</span>
              <span className="text-sm font-bold text-[#172F52]">£2,650.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payout History */}
      <div className="rounded-xl border border-[#D9E0E8] bg-white">
        <div className="border-b border-[#D9E0E8] px-6 py-4">
          <h3 className="text-base font-bold text-[#172F52]">Payout History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#D9E0E8] bg-[#F5F7FA]">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#6B7280]">Period</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#6B7280]">Gross Amount</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#6B7280]">Commission</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#6B7280]">Net Amount</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#6B7280]">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#6B7280]">Paid Date</th>
              </tr>
            </thead>
            <tbody>
              {payoutHistory.map((payout) => (
                <tr
                  key={payout.id}
                  className="border-b border-[#F5F7FA] last:border-0 hover:bg-[#F5F7FA]/50"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-[#172F52]">{payout.period}</p>
                      <p className="text-xs text-[#6B7280]">{payout.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-[#172F52]">
                    £{payout.gross.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-[#DC3545]">
                    -£{payout.commission.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-bold text-[#172F52]">
                    £{payout.net.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="bg-green-500/10 text-green-600">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Completed
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[#6B7280]">{payout.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Settings */}
      <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
        <h3 className="mb-1 text-base font-bold text-[#172F52]">Payout Settings</h3>
        <p className="mb-4 text-xs text-[#6B7280]">Bank details for receiving payouts.</p>

        {saved && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Bank details saved successfully.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#172F52]">
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
            <label className="mb-1.5 block text-sm font-medium text-[#172F52]">
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
            <label className="mb-1.5 block text-sm font-medium text-[#172F52]">
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
            <label className="mb-1.5 block text-sm font-medium text-[#172F52]">
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
          <Button className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Bank Details
          </Button>
        </div>
      </div>
    </div>
  )
}
