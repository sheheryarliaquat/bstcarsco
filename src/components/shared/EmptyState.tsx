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
        <div className="mb-4 text-[#E2E6EC] [&>svg]:h-16 [&>svg]:w-16">
          {icon}
        </div>
      )}
      <h3 className="mb-1 text-lg font-semibold text-[#0F1B2D]">{title}</h3>
      {description && (
        <p className="mb-4 max-w-sm text-sm text-[#5B6577]">{description}</p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-[#1F4FD8] text-white hover:bg-[#1F4FD8]/90"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
