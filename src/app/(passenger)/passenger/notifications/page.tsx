"use client"

import { useState, useMemo } from "react"
import {
  Bell,
  CheckCircle2,
  XCircle,
  Car,
  CreditCard,
  Star,
  AlertTriangle,
  MessageSquare,
  Tag,
  Settings,
  CheckCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/EmptyState"
import { cn } from "@/lib/utils"
import type { Notification } from "@/types"

const demoNotifications: Notification[] = [
  {
    id: "notif-001",
    userId: "pass-001",
    type: "driver_assigned",
    title: "Driver Assigned",
    message:
      "Mohammed Hassan has been assigned to your booking UKTB-2026-000001.",
    read: false,
    createdAt: "2026-08-25T08:00:00Z",
  },
  {
    id: "notif-002",
    userId: "pass-001",
    type: "booking_confirmed",
    title: "Booking Confirmed",
    message:
      "Your booking UKTB-2026-000003 from Birmingham to Manchester Airport has been confirmed.",
    read: false,
    createdAt: "2026-08-22T09:20:00Z",
  },
  {
    id: "notif-003",
    userId: "pass-001",
    type: "payment_received",
    title: "Payment Received",
    message:
      "Payment of £51.00 received for booking UKTB-2026-000001.",
    read: false,
    createdAt: "2026-08-20T14:35:00Z",
  },
  {
    id: "notif-004",
    userId: "pass-001",
    type: "trip_completed",
    title: "Trip Completed",
    message:
      "Your trip from 221B Baker Street to Heathrow Airport has been completed. We hope you enjoyed your ride!",
    read: true,
    createdAt: "2026-08-20T08:00:00Z",
  },
  {
    id: "notif-005",
    userId: "pass-001",
    type: "review_received",
    title: "Review Submitted",
    message:
      "Thank you for your 5-star review for driver Mohammed Hassan.",
    read: true,
    createdAt: "2026-08-20T08:05:00Z",
  },
  {
    id: "notif-006",
    userId: "pass-001",
    type: "promo_code_applied",
    title: "Promo Code Applied",
    message:
      "Promo code SUMMER10 has been applied to your account. 10% off your next 3 bookings!",
    read: true,
    createdAt: "2026-08-18T10:00:00Z",
  },
  {
    id: "notif-007",
    userId: "pass-001",
    type: "payment_failed",
    title: "Payment Failed",
    message:
      "Payment for booking UKTB-2026-000006 could not be processed. Please update your payment method.",
    read: true,
    createdAt: "2026-08-25T12:05:00Z",
  },
  {
    id: "notif-008",
    userId: "pass-001",
    type: "system_alert",
    title: "System Maintenance",
    message:
      "Scheduled maintenance on 28 August 2026 from 02:00 to 04:00 UTC. Some services may be temporarily unavailable.",
    read: true,
    createdAt: "2026-08-24T12:00:00Z",
  },
  {
    id: "notif-009",
    userId: "pass-001",
    type: "booking_cancelled",
    title: "Booking Cancelled",
    message:
      "Booking UKTB-2026-000012 has been cancelled. A refund of £7.80 will be processed within 3-5 business days.",
    read: true,
    createdAt: "2026-07-20T14:50:00Z",
  },
]

const typeIconMap: Record<string, React.ReactNode> = {
  driver_assigned: <Car className="h-4 w-4" />,
  booking_confirmed: <CheckCircle2 className="h-4 w-4" />,
  booking_cancelled: <XCircle className="h-4 w-4" />,
  trip_completed: <CheckCircle2 className="h-4 w-4" />,
  payment_received: <CreditCard className="h-4 w-4" />,
  payment_failed: <AlertTriangle className="h-4 w-4" />,
  review_received: <Star className="h-4 w-4" />,
  support_update: <MessageSquare className="h-4 w-4" />,
  promo_code_applied: <Tag className="h-4 w-4" />,
  system_alert: <Settings className="h-4 w-4" />,
}

const typeColorMap: Record<string, string> = {
  driver_assigned: "bg-[#172F52]/10 text-[#172F52]",
  booking_confirmed: "bg-[#28A745]/10 text-[#28A745]",
  booking_cancelled: "bg-[#DC3545]/10 text-[#DC3545]",
  trip_completed: "bg-[#28A745]/10 text-[#28A745]",
  payment_received: "bg-[#17A2B8]/10 text-[#17A2B8]",
  payment_failed: "bg-[#DC3545]/10 text-[#DC3545]",
  review_received: "bg-[#D4AF37]/10 text-[#D4AF37]",
  support_update: "bg-[#6C757D]/10 text-[#6C757D]",
  promo_code_applied: "bg-[#D4145A]/10 text-[#D4145A]",
  system_alert: "bg-[#FFC107]/10 text-[#B8941E]",
}

function timeAgo(date: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  )
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(demoNotifications)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const unreadCount = notifications.filter((n) => !n.read).length

  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.read)
    return notifications
  }, [notifications, filter])

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
            Stay updated on your bookings and account.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={markAllRead}
            className="border-[#D9E0E8] text-[#172F52]"
          >
            <CheckCheck className="h-4 w-4" /> Mark All Read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            filter === "all"
              ? "bg-[#172F52] text-white"
              : "bg-white text-[#6B7280] hover:bg-[#F5F7FA]"
          )}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            filter === "unread"
              ? "bg-[#172F52] text-white"
              : "bg-white text-[#6B7280] hover:bg-[#F5F7FA]"
          )}
        >
          Unread
          {unreadCount > 0 && (
            <span
              className={cn(
                "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                filter === "unread"
                  ? "bg-white/20 text-white"
                  : "bg-[#D4145A] text-white"
              )}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-16 w-16" />}
          title={
            filter === "unread"
              ? "No unread notifications"
              : "No notifications"
          }
          description={
            filter === "unread"
              ? "You're all caught up!"
              : "You'll see booking updates and account alerts here."
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => (
            <button
              key={notif.id}
              onClick={() => markAsRead(notif.id)}
              className={cn(
                "flex w-full items-start gap-4 rounded-xl border bg-white p-4 text-left transition-colors hover:bg-[#F5F7FA]/50",
                notif.read
                  ? "border-[#D9E0E8]"
                  : "border-[#D4145A]/20 bg-[#D4145A]/[0.02]"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  typeColorMap[notif.type] ?? "bg-[#6B7280]/10 text-[#6B7280]"
                )}
              >
                {typeIconMap[notif.type] ?? <Bell className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={cn(
                      "text-sm",
                      notif.read
                        ? "font-medium text-[#6B7280]"
                        : "font-semibold text-[#172F52]"
                    )}
                  >
                    {notif.title}
                  </p>
                  <div className="flex items-center gap-2">
                    {!notif.read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#D4145A]" />
                    )}
                    <span className="shrink-0 text-[11px] text-[#ADB5BD]">
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-[#6B7280]">
                  {notif.message}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
