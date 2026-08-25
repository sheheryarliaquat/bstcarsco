"use client"

import { useState } from "react"
import { CreditCard, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface PaymentFormProps {
  amount: number
  onPayment?: (paymentMethodId: string) => void
  loading?: boolean
  error?: string
}

export function PaymentForm({
  amount,
  onPayment,
  loading = false,
  error,
}: PaymentFormProps) {
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")

  function formatCardNumber(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 16)
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ")
  }

  function formatExpiry(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 4)
    if (digits.length >= 2) {
      return digits.slice(0, 2) + " / " + digits.slice(2)
    }
    return digits
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    e.stopPropagation()
    onPayment?.("pm_card_mock")
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-[#172033]">
          Card Number
        </label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          <Input
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            className="h-11 pl-10"
            maxLength={19}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#172033]">
            Expiry Date
          </label>
          <Input
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM / YY"
            className="h-11"
            maxLength={7}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#172033]">
            CVC
          </label>
          <Input
            value={cvc}
            onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="123"
            className="h-11"
            maxLength={4}
            type="password"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-[#DC2626]/20 bg-[#DC2626]/5 p-3 text-sm text-[#DC2626]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <p className="text-center text-xs text-[#6B7280]">
        Your payment is secured with 256-bit SSL encryption
      </p>
    </div>
  )
}
