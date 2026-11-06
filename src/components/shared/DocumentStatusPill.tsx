import { AlertTriangle, CheckCircle2, Clock, MinusCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DocumentStatus } from "@/types"

const CONFIG: Record<DocumentStatus | "missing", { label: string; className: string; Icon: typeof Clock }> = {
  approved: { label: "Approved", className: "bg-green-50 text-green-700 border-green-200", Icon: CheckCircle2 },
  pending: { label: "Pending review", className: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200", Icon: XCircle },
  expired: { label: "Expired", className: "bg-red-50 text-red-700 border-red-200", Icon: AlertTriangle },
  missing: { label: "Not uploaded", className: "bg-gray-50 text-gray-500 border-gray-200", Icon: MinusCircle },
}

export function DocumentStatusPill({
  status,
  label,
  className,
}: {
  status: DocumentStatus | "missing"
  label?: string
  className?: string
}) {
  const c = CONFIG[status] ?? CONFIG.pending
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        c.className,
        className
      )}
    >
      <c.Icon className="h-3 w-3" />
      {label ?? c.label}
    </span>
  )
}
