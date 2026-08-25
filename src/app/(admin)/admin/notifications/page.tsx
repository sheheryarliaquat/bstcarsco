"use client"

import { useState, useMemo } from "react"
import {
  Bell,
  Send,
  Users,
  User,
  Car,
  Building,
  Search,
  Filter,
  CheckCircle,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DashboardCard } from "@/components/shared/DashboardCard"

interface SentNotification {
  id: string
  target: string
  title: string
  message: string
  type: string
  sentAt: string
  readCount: number
  totalRecipients: number
}

const DEMO_NOTIFICATIONS: SentNotification[] = [
  { id: "notif-001", target: "all", title: "Platform Maintenance Scheduled", message: "We will be performing scheduled maintenance on 1st September from 02:00 to 04:00 GMT. Services may be briefly unavailable.", type: "system", sentAt: "2026-08-25T10:00:00Z", readCount: 12450, totalRecipients: 15420 },
  { id: "notif-002", target: "passenger", title: "Summer Sale - 20% Off Airport Transfers", message: "Book your airport transfer before 30th September and get 20% off! Use code SUMMER20 at checkout.", type: "promotion", sentAt: "2026-08-24T09:00:00Z", readCount: 8200, totalRecipients: 12000 },
  { id: "notif-003", target: "driver", title: "New Document Requirements", message: "All drivers must upload their updated DVLA check code by 15th September. Please check your documents tab.", type: "system", sentAt: "2026-08-23T14:00:00Z", readCount: 185, totalRecipients: 340 },
  { id: "notif-004", target: "operator", title: "Commission Rate Update", message: "Platform commission rates will be reviewed from 1st October. New rates will be communicated via email.", type: "system", sentAt: "2026-08-22T11:00:00Z", readCount: 30, totalRecipients: 34 },
  { id: "notif-005", target: "all", title: "Welcome to Blue Star Airport Transfers LTD!", message: "Thank you for joining Blue Star Airport Transfers LTD. Book your first ride and get £5 off with code WELCOME5.", type: "promotion", sentAt: "2026-08-20T08:00:00Z", readCount: 14200, totalRecipients: 15800 },
]

const TARGET_OPTIONS = [
  { value: "all", label: "All Users", icon: Users },
  { value: "passenger", label: "Passengers", icon: User },
  { value: "driver", label: "Drivers", icon: Car },
  { value: "operator", label: "Operators", icon: Building },
]

export default function AdminNotificationsPage() {
  const [target, setTarget] = useState("all")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [type, setType] = useState("system")
  const [sent, setSent] = useState(false)

  const totalSent = DEMO_NOTIFICATIONS.length
  const totalRecipientsAll = DEMO_NOTIFICATIONS.reduce((s, n) => s + n.totalRecipients, 0)
  const totalReadAll = DEMO_NOTIFICATIONS.reduce((s, n) => s + n.readCount, 0)
  const readRate = totalRecipientsAll > 0 ? Math.round((totalReadAll / totalRecipientsAll) * 100) : 0

  function handleSend() {
    if (!title.trim() || !message.trim()) return
    setSent(true)
    setTimeout(() => setSent(false), 2000)
    setTitle("")
    setMessage("")
    setTarget("all")
    setType("system")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Notifications</h1>
          <p className="text-sm text-[#6B7280]">Send and manage platform notifications</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <DashboardCard title="Total Sent" value={totalSent} icon={<Bell className="h-5 w-5" />} />
        <DashboardCard title="Total Recipients" value={totalRecipientsAll.toLocaleString()} icon={<Users className="h-5 w-5" />} />
        <DashboardCard title="Read Rate" value={`${readRate}%`} icon={<CheckCircle className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Send Form */}
        <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Send className="h-5 w-5 text-[#D4145A]" />
            <h3 className="text-base font-bold text-[#172F52]">Send New Notification</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Target Audience</label>
              <div className="grid grid-cols-2 gap-2">
                {TARGET_OPTIONS.map((opt) => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTarget(opt.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                        target === opt.value
                          ? "border-[#D4145A] bg-[#D4145A]/5 text-[#D4145A]"
                          : "border-[#D9E0E8] text-[#6B7280] hover:border-[#172F52] hover:text-[#172F52]"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Notification Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-9 w-full rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
              >
                <option value="system">System</option>
                <option value="promotion">Promotion</option>
                <option value="alert">Alert</option>
                <option value="update">Update</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title..."
                className="h-9"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Notification message..."
                className="w-full rounded-lg border border-[#D9E0E8] px-3 py-2 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
                rows={4}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!title.trim() || !message.trim()}
              className="w-full bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
            >
              <Send className="mr-1.5 h-4 w-4" />
              {sent ? "Sent!" : "Send Notification"}
            </Button>
          </div>
        </div>

        {/* History */}
        <div className="rounded-xl border border-[#D9E0E8] bg-white">
          <div className="border-b border-[#D9E0E8] px-6 py-4">
            <h3 className="text-base font-bold text-[#172F52]">Notification History</h3>
          </div>
          <div className="divide-y divide-[#F5F7FA]">
            {DEMO_NOTIFICATIONS.map((notif) => {
              const readPct = notif.totalRecipients > 0 ? Math.round((notif.readCount / notif.totalRecipients) * 100) : 0
              return (
                <div key={notif.id} className="px-6 py-4">
                  <div className="mb-1 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                          notif.type === "system" ? "bg-[#172F52]/10 text-[#172F52]" : "bg-[#D4145A]/10 text-[#D4145A]"
                        )}>
                          {notif.type}
                        </span>
                        <span className="text-xs text-[#6B7280] capitalize">{notif.target === "all" ? "All Users" : notif.target}s</span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-[#172F52]">{notif.title}</p>
                      <p className="mt-0.5 text-xs text-[#6B7280] line-clamp-2">{notif.message}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-[#6B7280]">
                    <span>{new Date(notif.sentAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    <span>{notif.totalRecipients.toLocaleString()} recipients</span>
                    <span>{readPct}% read rate</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#F5F7FA]">
                    <div
                      className="h-full rounded-full bg-[#168A55]"
                      style={{ width: `${readPct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
