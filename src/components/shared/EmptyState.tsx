import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-[#D9E0E8] [&>svg]:h-16 [&>svg]:w-16">
          {icon}
        </div>
      )}
      <h3 className="mb-1 text-lg font-semibold text-[#172033]">{title}</h3>
      {description && (
        <p className="mb-4 max-w-sm text-sm text-[#6B7280]">{description}</p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
