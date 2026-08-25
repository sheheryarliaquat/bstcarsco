import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  trend?: "up" | "down"
}

export function DashboardCard({
  title,
  value,
  change,
  icon,
  trend,
}: DashboardCardProps) {
  return (
    <div className="rounded-xl border border-[#D9E0E8] bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#172F52]/10 text-[#172F52]">
          {icon}
        </div>
        {trend && change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              trend === "up" &&
                "bg-[#168A55]/10 text-[#168A55]",
              trend === "down" &&
                "bg-[#DC2626]/10 text-[#DC2626]"
            )}
          >
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="mb-0.5 text-sm text-[#6B7280]">{title}</p>
      <p className="text-2xl font-bold text-[#172F52]">{value}</p>
    </div>
  )
}
