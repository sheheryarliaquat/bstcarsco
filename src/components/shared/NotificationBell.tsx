"use client"

import { useState } from "react"
import { Bell, Check, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

interface NotificationBellProps {
  notifications?: Notification[]
  unreadCount?: number
  onMarkAsRead?: (id: string) => void
  onMarkAllRead?: () => void
}

export function NotificationBell({
  notifications = [],
  unreadCount,
  onMarkAsRead,
  onMarkAllRead,
}: NotificationBellProps) {
  const count = unreadCount ?? notifications.filter((n) => !n.read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="relative rounded-lg p-2 text-[#6B7280] transition-colors hover:bg-[#F5F7FA] hover:text-[#172033]" />
        }
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D4145A] px-1 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {count > 0 && (
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1 text-xs font-normal text-[#D4145A] hover:text-[#D4145A]/80"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#6B7280]">
            No notifications
          </div>
        ) : (
          notifications.slice(0, 10).map((n) => (
            <DropdownMenuItem
              key={n.id}
              onClick={() => !n.read && onMarkAsRead?.(n.id)}
              className={cn(
                "flex flex-col gap-0.5 py-2.5",
                !n.read && "bg-[#D4145A]/5"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-[#172033]">{n.title}</p>
                {!n.read && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#D4145A]" />
                )}
              </div>
              <p className="text-xs text-[#6B7280]">{n.message}</p>
              <p className="text-[10px] text-[#6B7280]/70">
                {formatDistanceToNow(new Date(n.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
