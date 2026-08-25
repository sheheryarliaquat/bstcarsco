"use client"

import { useState } from "react"
import {
  Bell,
  CheckCircle2,
  Car,
  Wallet,
  FileText,
  Star,
  AlertTriangle,
  Info,
  Check,
  CheckCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { EmptyState } from "@/components/shared/EmptyState"

interface Notification {
  id: string
  type: "trip" | "payment" | "document" | "review" | "system" | "alert"
  title: string
  message: string
  time: string
  read: boolean
}

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  trip: <Car className="h-4 w-4" />,
  payment: <Wallet className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  review: <Star className="h-4 w-4" />,
  system: <Info className="h-4 w-4" />,
  alert: <AlertTriangle className="h-4 w-4" />,
}

const NOTIFICATION_COLORS: Record<string, string> = {
  trip: "bg-blue-50 text-blue-600",
  payment: "bg-green-50 text-green-600",
  document: "bg-amber-50 text-amber-600",
  review: "bg-purple-50 text-purple-600",
  system: "bg-[#172F52]/10 text-[#172F52]",
  alert: "bg-red-50 text-red-600",
}

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "n-1",
    type: "trip",
    title: "New Trip Assigned",
    message:
      "You have been assigned a new trip from Manchester Square to Downing Street. Passenger: Emma Thompson.",
    time: "2 min ago",
    read: false,
  },
  {
    id: "n-2",
    type: "payment",
    title: "Payment Received",
    message:
      "Payment of £51.00 for trip UKTB-2026-000001 has been processed successfully.",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "n-3",
    type: "trip",
    title: "Trip Update",
    message:
      "Trip UKTB-2026-000005 has been updated. New pickup time: 09:15.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "n-4",
    type: "document",
    title: "Document Expiring Soon",
    message:
      "Your MOT Certificate expires on 28 August 2026. Please renew it to avoid account suspension.",
    time: "3 hours ago",
    read: true,
  },
  {
    id: "n-5",
    type: "review",
    title: "New 5-Star Review",
    message:
      "James Wilson left you a 5-star review: 'Absolutely brilliant service. Mohammed was on time...'",
    time: "5 hours ago",
    read: true,
  },
  {
    id: "n-6",
    type: "system",
    title: "Payout Processed",
    message:
      "Your weekly payout of £468.23 has been transferred to your bank account ending in ****4523.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "n-7",
    type: "alert",
    title: "Document Under Review",
    message:
      "Your Background Check (DBS) document is currently being reviewed. You will be notified once approved.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "n-8",
    type: "payment",
    title: "Commission Deducted",
    message:
      "15% commission of £13.13 has been deducted from your earnings for the period 24-25 Aug.",
    time: "2 days ago",
    read: true,
  },
]

export default function DriverNotificationsPage() {
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS)
  const unreadCount = notifications.filter((n) => !n.read).length

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Notifications</h1>
          <p className="text-sm text-[#6B7280]">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            className="border-[#D9E0E8]"
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-16 w-16" />}
          title="No notifications"
          description="You don't have any notifications yet."
        />
      ) : (
        <div className="rounded-2xl bg-white ring-1 ring-[#E5E7EB]">
          <div className="divide-y divide-[#F5F7FA]">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex gap-4 p-5 transition-colors hover:bg-[#F5F7FA]/50",
                  !notification.read && "bg-[#D4145A]/[0.02]"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    NOTIFICATION_COLORS[notification.type]
                  )}
                >
                  {NOTIFICATION_ICONS[notification.type]}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-sm font-semibold text-[#172F52]",
                          !notification.read && "font-bold"
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#D4145A]" />
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-[#6B7280]">
                      {notification.time}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    {notification.message}
                  </p>
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="mt-2 flex items-center gap-1 text-xs font-medium text-[#D4145A] hover:underline"
                    >
                      <Check className="h-3 w-3" />
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
