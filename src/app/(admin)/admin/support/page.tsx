"use client"

import { useState, useMemo, useRef } from "react"
import {
  Search,
  Eye,
  Send,
  Headphones,
  Clock,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/shared/Modal"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { DEMO_DATA, SUPPORT_CATEGORIES } from "@/constants"
import type { SupportStatus } from "@/types"

interface TicketRecord {
  id: string
  userId: string
  userName: string
  userRole: string
  category: string
  subject: string
  message: string
  priority: string
  status: SupportStatus
  assignedAdmin: string | null
  createdAt: string
  messages: { sender: string; senderRole: string; message: string; timestamp: string }[]
}

const DEMO_TICKETS: TicketRecord[] = [
  {
    id: "tkt-001",
    userId: "pass-001",
    userName: "James Wilson",
    userRole: "passenger",
    category: "booking",
    subject: "Incorrect fare charged for Heathrow transfer",
    message: "I was charged £51.00 for my Heathrow transfer but the quote was £45.00. Can you please check and refund the difference?",
    priority: "high",
    status: "in_progress",
    assignedAdmin: "Admin Sarah",
    createdAt: "2026-08-25T08:30:00Z",
    messages: [
      { sender: "James Wilson", senderRole: "passenger", message: "I was charged £51.00 for my Heathrow transfer but the quote was £45.00. Can you please check and refund the difference?", timestamp: "2026-08-25T08:30:00Z" },
      { sender: "Admin Sarah", senderRole: "admin", message: "Hi James, thank you for reaching out. I'm looking into this now. The fare may have included additional meet and greet charges. Let me verify the breakdown.", timestamp: "2026-08-25T09:15:00Z" },
      { sender: "James Wilson", senderRole: "passenger", message: "Thanks, I appreciate the quick response. I did select meet and greet so perhaps the original quote should have reflected that.", timestamp: "2026-08-25T09:45:00Z" },
    ],
  },
  {
    id: "tkt-002",
    userId: "drv-003",
    userName: "Amit Sharma",
    userRole: "driver",
    category: "payment",
    subject: "Payout not received for last week",
    message: "I haven't received my payout for the week of Aug 11-17. When can I expect it?",
    priority: "medium",
    status: "waiting",
    assignedAdmin: "Admin Mark",
    createdAt: "2026-08-24T14:00:00Z",
    messages: [
      { sender: "Amit Sharma", senderRole: "driver", message: "I haven't received my payout for the week of Aug 11-17. When can I expect it?", timestamp: "2026-08-24T14:00:00Z" },
      { sender: "Admin Mark", senderRole: "admin", message: "Hi Amit, I've checked with the finance team. There seems to be a delay with your bank details verification. Can you confirm your account number?", timestamp: "2026-08-24T15:30:00Z" },
      { sender: "Amit Sharma", senderRole: "driver", message: "My account number is ****4567, sort code 20-45-67. Same as before.", timestamp: "2026-08-24T16:00:00Z" },
      { sender: "Admin Mark", senderRole: "admin", message: "Thank you. We're processing this now and you should receive it within 24 hours.", timestamp: "2026-08-24T17:00:00Z" },
    ],
  },
  {
    id: "tkt-003",
    userId: "pass-002",
    userName: "Emma Thompson",
    userRole: "passenger",
    category: "lost_property",
    subject: "Left phone in taxi - Edinburgh to Glasgow trip",
    message: "I left my phone (iPhone 15 Pro, black) in the back seat of my taxi from Edinburgh to Glasgow yesterday. Booking ref: UKTB-2026-000005.",
    priority: "high",
    status: "open",
    assignedAdmin: null,
    createdAt: "2026-08-25T10:00:00Z",
    messages: [
      { sender: "Emma Thompson", senderRole: "passenger", message: "I left my phone (iPhone 15 Pro, black) in the back seat of my taxi from Edinburgh to Glasgow yesterday. Booking ref: UKTB-2026-000005.", timestamp: "2026-08-25T10:00:00Z" },
    ],
  },
  {
    id: "tkt-004",
    userId: "op-002",
    userName: "Fiona McGregor",
    userRole: "operator",
    category: "account",
    subject: "Cannot access operator dashboard",
    message: "Since the last update, I'm getting a 403 error when trying to access my operator dashboard. I've tried clearing cache and different browsers.",
    priority: "medium",
    status: "resolved",
    assignedAdmin: "Admin Sarah",
    createdAt: "2026-08-22T09:00:00Z",
    messages: [
      { sender: "Fiona McGregor", senderRole: "operator", message: "Since the last update, I'm getting a 403 error when trying to access my operator dashboard. I've tried clearing cache and different browsers.", timestamp: "2026-08-22T09:00:00Z" },
      { sender: "Admin Sarah", senderRole: "admin", message: "Hi Fiona, this was a known issue affecting operators with the 'editor' permission. We've deployed a fix. Please try again.", timestamp: "2026-08-22T10:30:00Z" },
      { sender: "Fiona McGregor", senderRole: "operator", message: "That fixed it, thank you!", timestamp: "2026-08-22T11:00:00Z" },
      { sender: "Admin Sarah", senderRole: "admin", message: "Great, glad it's working now. Closing this ticket.", timestamp: "2026-08-22T11:15:00Z" },
    ],
  },
  {
    id: "tkt-005",
    userId: "pass-003",
    userName: "Raj Patel",
    userRole: "passenger",
    category: "promo_code",
    subject: "Promo code not applying discount",
    message: "I tried using code SUMMER20 but it says 'invalid code'. I received it in the promotional email last week.",
    priority: "low",
    status: "open",
    assignedAdmin: null,
    createdAt: "2026-08-25T11:30:00Z",
    messages: [
      { sender: "Raj Patel", senderRole: "passenger", message: "I tried using code SUMMER20 but it says 'invalid code'. I received it in the promotional email last week.", timestamp: "2026-08-25T11:30:00Z" },
    ],
  },
]

const STATUS_FLOW: SupportStatus[] = ["open", "in_progress", "waiting", "resolved", "closed"]

export default function AdminSupportPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [detailTarget, setDetailTarget] = useState<TicketRecord | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [replyMessage, setReplyMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    let result = [...DEMO_TICKETS]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.userName.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== "all") result = result.filter((t) => t.status === statusFilter)
    if (priorityFilter !== "all") result = result.filter((t) => t.priority === priorityFilter)
    if (categoryFilter !== "all") result = result.filter((t) => t.category === categoryFilter)
    return result
  }, [search, statusFilter, priorityFilter, categoryFilter])

  const openCount = DEMO_TICKETS.filter((t) => t.status === "open").length
  const inProgressCount = DEMO_TICKETS.filter((t) => t.status === "in_progress").length
  const waitingCount = DEMO_TICKETS.filter((t) => t.status === "waiting").length

  const priorityColors: Record<string, string> = {
    high: "bg-red-50 text-red-700",
    medium: "bg-amber-50 text-amber-700",
    low: "bg-blue-50 text-blue-700",
  }

  const statusColors: Record<string, string> = {
    open: "bg-blue-50 text-blue-700",
    in_progress: "bg-amber-50 text-amber-700",
    waiting: "bg-purple-50 text-purple-700",
    resolved: "bg-green-50 text-green-700",
    closed: "bg-gray-100 text-gray-600",
  }

  function advanceStatus(currentStatus: SupportStatus): SupportStatus | null {
    const idx = STATUS_FLOW.indexOf(currentStatus)
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return null
    return STATUS_FLOW[idx + 1]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Support</h1>
          <p className="text-sm text-[#6B7280]">Manage user support tickets</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <DashboardCard title="Open Tickets" value={openCount} icon={<Headphones className="h-5 w-5" />} />
        <DashboardCard title="In Progress" value={inProgressCount} icon={<Clock className="h-5 w-5" />} />
        <DashboardCard title="Awaiting Reply" value={waitingCount} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <div className="rounded-xl border border-[#D9E0E8] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets..."
              className="h-9 pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          >
            <option value="all">All Statuses</option>
            {STATUS_FLOW.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          >
            <option value="all">All Categories</option>
            {SUPPORT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-[#D9E0E8] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#D9E0E8] bg-[#F5F7FA]">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Ticket ID</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">User</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Category</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Subject</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Priority</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Assigned</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Created</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[#6B7280]">
                    No tickets found
                  </td>
                </tr>
              ) : (
                filtered.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-[#F5F7FA] transition-colors last:border-0 hover:bg-[#F5F7FA]/50 cursor-pointer"
                    onClick={() => { setDetailTarget(ticket); setDetailOpen(true) }}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-[#172F52]">{ticket.id}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-[#172F52] font-medium">{ticket.userName}</p>
                        <p className="text-xs text-[#6B7280] capitalize">{ticket.userRole}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#6B7280] capitalize">{ticket.category.replace("_", " ")}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-[#172F52]">{ticket.subject}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", priorityColors[ticket.priority] ?? "")}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", statusColors[ticket.status] ?? "")}>
                        {ticket.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">
                      {ticket.assignedAdmin ?? <span className="italic text-[#ADB5BD]">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6B7280]">
                      {new Date(ticket.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#D9E0E8]"
                        onClick={(e) => { e.stopPropagation(); setDetailTarget(ticket); setDetailOpen(true) }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Detail Modal */}
      <Modal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={`Ticket ${detailTarget?.id}`}
        size="xl"
      >
        {detailTarget && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">User</p>
                <p className="text-sm font-medium text-[#172F52]">{detailTarget.userName} ({detailTarget.userRole})</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Category</p>
                <p className="text-sm text-[#172F52] capitalize">{detailTarget.category.replace("_", " ")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Priority</p>
                <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", priorityColors[detailTarget.priority])}>
                  {detailTarget.priority}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Assigned To</p>
                <p className="text-sm text-[#172F52]">{detailTarget.assignedAdmin ?? "Unassigned"}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-[#6B7280]">Subject</p>
              <p className="text-sm font-medium text-[#172F52]">{detailTarget.subject}</p>
            </div>

            {/* Status advance buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase text-[#6B7280] mr-1">Status:</p>
              {STATUS_FLOW.map((s, i) => {
                const isCurrent = detailTarget.status === s
                const next = advanceStatus(detailTarget.status)
                const isNext = next === s
                return (
                  <button
                    key={s}
                    disabled={!isNext}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors",
                      isCurrent && "bg-[#172F52] text-white",
                      isNext && "bg-[#D4145A] text-white hover:bg-[#D4145A]/90 cursor-pointer",
                      !isCurrent && !isNext && "bg-[#F5F7FA] text-[#6B7280]"
                    )}
                  >
                    {s.replace("_", " ")}
                  </button>
                )
              })}
            </div>

            {/* Message thread */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase text-[#6B7280]">Message Thread</p>
              <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg bg-[#F5F7FA] p-3">
                {detailTarget.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-lg p-3",
                      msg.senderRole === "admin" ? "bg-[#172F52]/5 ml-8" : "bg-white mr-8"
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className={cn(
                        "text-xs font-semibold",
                        msg.senderRole === "admin" ? "text-[#D4145A]" : "text-[#172F52]"
                      )}>
                        {msg.sender}
                      </span>
                      <span className="text-[10px] text-[#6B7280]">
                        {new Date(msg.timestamp).toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                      </span>
                    </div>
                    <p className="text-sm text-[#172F52]">{msg.message}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Reply */}
            {detailTarget.status !== "closed" && (
              <div className="flex gap-2">
                <Input
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type a reply..."
                  className="h-9 flex-1"
                />
                <Button
                  className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
                  onClick={() => setReplyMessage("")}
                  disabled={!replyMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}


