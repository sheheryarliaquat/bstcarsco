"use client"

import { useState, useEffect } from "react"
import {
  Bell,
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
import { EmptyState } from "@/components/shared/EmptyState"
import { useAuth } from "@/hooks/useAuth"
import {
  listenToUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/services/notification-service"
import type { Notification } from "@/types"

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

export default function DriverNotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!user) {
      setNotifications([])
      return
    }
    const unsub = listenToUserNotifications(user.uid, setNotifications, () => setNotifications([]))
    return unsub
  }, [user])

  const unreadCount = notifications.filter((n) => !n.read).length

  async function handleMarkAllRead() {
    if (!user) return
    await markAllNotificationsRead(user.uid)
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
            onClick={handleMarkAllRead}
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
            {[...notifications]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((notification) => (
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
                      NOTIFICATION_COLORS[notification.type] ?? "bg-[#172F52]/10 text-[#172F52]"
                    )}
                  >
                    {NOTIFICATION_ICONS[notification.type] ?? <Info className="h-4 w-4" />}
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
                        {new Date(notification.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {notification.message}
                    </p>
                    {!notification.read && (
                      <button
                        onClick={() => markNotificationRead(notification.id)}
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
