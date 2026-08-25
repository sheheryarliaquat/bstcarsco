"use client"

import { useState, useMemo } from "react"
import {
  Headphones,
  Plus,
  Send,
  Paperclip,
  ArrowLeft,
  Search,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Modal } from "@/components/shared/Modal"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { cn } from "@/lib/utils"
import { SUPPORT_CATEGORIES } from "@/constants"
import type { SupportTicket, SupportStatus } from "@/types"

const demoTickets: SupportTicket[] = [
  {
    id: "TKT-001",
    userId: "pass-001",
    userRole: "passenger",
    category: "booking",
    subject: "Driver arrived late for airport transfer",
    message:
      "My driver was 15 minutes late for my airport transfer on 20 August. I nearly missed my flight. Can I get a partial refund?",
    attachments: [],
    priority: "high",
    status: "in_progress",
    assignedAdminId: "admin-001",
    createdAt: "2026-08-20T10:00:00Z",
    updatedAt: "2026-08-21T14:30:00Z",
  },
  {
    id: "TKT-002",
    userId: "pass-001",
    userRole: "passenger",
    category: "payment",
    subject: "Double charged for booking",
    message:
      "I was charged twice for booking UKTB-2026-000009. Please refund the extra charge of £153.36.",
    attachments: [],
    priority: "high",
    status: "waiting",
    assignedAdminId: "admin-002",
    createdAt: "2026-08-10T16:00:00Z",
    updatedAt: "2026-08-12T09:15:00Z",
  },
  {
    id: "TKT-003",
    userId: "pass-001",
    userRole: "passenger",
    category: "lost_property",
    subject: "Left phone in vehicle",
    message:
      "I left my iPhone 15 Pro in the back seat of a Mercedes E-Class on 15 August. The driver was Sarah O'Brien. Booking ref: UKTB-2026-000008.",
    attachments: [],
    priority: "medium",
    status: "resolved",
    createdAt: "2026-08-15T18:00:00Z",
    updatedAt: "2026-08-17T11:00:00Z",
  },
  {
    id: "TKT-004",
    userId: "pass-001",
    userRole: "passenger",
    category: "feedback",
    subject: "Suggestion for app improvement",
    message:
      "It would be great if we could add favourite routes and rebook them quickly. For example, I commute to the office every day and have to enter the same addresses each time.",
    attachments: [],
    priority: "low",
    status: "open",
    createdAt: "2026-08-22T09:00:00Z",
    updatedAt: "2026-08-22T09:00:00Z",
  },
]

const priorityColors: Record<string, string> = {
  low: "bg-[#6C757D]/10 text-[#6C757D]",
  medium: "bg-[#FFC107]/15 text-[#B8941E]",
  high: "bg-[#DC3545]/10 text-[#DC3545]",
  urgent: "bg-[#DC2626]/15 text-[#DC2626]",
}

export default function SupportPage() {
  const [tickets] = useState(demoTickets)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  )
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string>("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [priority, setPriority] = useState<string>("medium")
  const [replyText, setReplyText] = useState("")

  const filtered = useMemo(() => {
    if (!search) return tickets
    const q = search.toLowerCase()
    return tickets.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    )
  }, [tickets, search])

  function handleCreate() {
    setCreateOpen(false)
    resetForm()
  }

  function resetForm() {
    setCategory("")
    setSubject("")
    setMessage("")
    setPriority("medium")
  }

  if (selectedTicket) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setSelectedTicket(null)
            setReplyText("")
          }}
          className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#172F52]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Tickets
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-[#172F52]">
            {selectedTicket.id}
          </h1>
          <StatusBadge
            status={selectedTicket.status}
            type="payment"
            className="capitalize"
          />
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
              priorityColors[selectedTicket.priority] ?? ""
            )}
          >
            {selectedTicket.priority}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {/* Original message */}
            <div className="rounded-xl border border-[#D9E0E8] bg-white p-5">
              <h3 className="mb-2 text-sm font-semibold text-[#172F52]">
                {selectedTicket.subject}
              </h3>
              <p className="mb-3 text-sm leading-relaxed text-[#6B7280]">
                {selectedTicket.message}
              </p>
              <div className="flex items-center gap-4 border-t border-[#F5F7FA] pt-3">
                <span className="text-xs text-[#ADB5BD]">
                  Created{" "}
                  {new Date(selectedTicket.createdAt).toLocaleDateString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </span>
                <span className="text-xs text-[#ADB5BD]">
                  Updated{" "}
                  {new Date(selectedTicket.updatedAt).toLocaleDateString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </span>
              </div>
            </div>

            {/* Support reply (demo) */}
            {selectedTicket.status !== "open" && (
              <div className="rounded-xl border border-[#172F52]/10 bg-[#172F52]/[0.02] p-5">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#172F52] text-[10px] font-bold text-white">
                    A
                  </div>
                  <p className="text-sm font-semibold text-[#172F52]">
                    Support Team
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-[#6B7280]">
                  Thank you for contacting us. We&apos;re looking into your
                  inquiry and will get back to you shortly. Your reference
                  number is {selectedTicket.id}.
                </p>
                <p className="mt-2 text-xs text-[#ADB5BD]">
                  {new Date(selectedTicket.updatedAt).toLocaleDateString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>
            )}

            {/* Reply box */}
            {selectedTicket.status !== "resolved" &&
              selectedTicket.status !== "closed" && (
                <div className="rounded-xl border border-[#D9E0E8] bg-white p-5">
                  <h3 className="mb-3 text-sm font-semibold text-[#172F52]">
                    Reply
                  </h3>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    rows={3}
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <button className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#172F52]">
                      <Paperclip className="h-3.5 w-3.5" /> Attach File
                    </button>
                    <Button
                      onClick={() => setReplyText("")}
                      disabled={!replyText}
                      className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
                    >
                      <Send className="h-4 w-4" /> Send Reply
                    </Button>
                  </div>
                </div>
              )}
          </div>

          {/* Ticket details sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-[#D9E0E8] bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#6B7280]">
                Ticket Details
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[#6B7280]">Category</p>
                  <p className="text-sm font-medium capitalize text-[#172F52]">
                    {selectedTicket.category.replace(/_/g, " ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Priority</p>
                  <p className="text-sm font-medium capitalize text-[#172F52]">
                    {selectedTicket.priority}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Status</p>
                  <StatusBadge
                    status={selectedTicket.status}
                    type="payment"
                    className="capitalize"
                  />
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Created</p>
                  <p className="text-sm text-[#172F52]">
                    {new Date(
                      selectedTicket.createdAt
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Last Updated</p>
                  <p className="text-sm text-[#172F52]">
                    {new Date(
                      selectedTicket.updatedAt
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Support</h1>
          <p className="text-sm text-[#6B7280]">
            Get help with your bookings and account.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
        >
          <Plus className="h-4 w-4" /> New Ticket
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tickets..."
          className="h-9 pl-9"
        />
      </div>

      {/* Tickets list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Headphones className="h-16 w-16" />}
          title="No support tickets"
          description="Create a new ticket if you need help with anything."
          action={{
            label: "New Ticket",
            onClick: () => setCreateOpen(true),
          }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="flex w-full items-center gap-4 rounded-xl border border-[#D9E0E8] bg-white p-4 text-left transition-colors hover:border-[#D4145A]/20 hover:bg-[#F5F7FA]/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#172F52]/10 text-[#172F52]">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#6B7280]">
                    {ticket.id}
                  </span>
                  <span className="text-[#D9E0E8]">·</span>
                  <span className="text-xs capitalize text-[#6B7280]">
                    {ticket.category.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm font-medium text-[#172F52]">
                  {ticket.subject}
                </p>
                <p className="mt-0.5 truncate text-xs text-[#6B7280]">
                  {ticket.message}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <StatusBadge
                  status={ticket.status}
                  type="payment"
                  className="capitalize"
                />
                <span className="text-[11px] text-[#ADB5BD]">
                  {new Date(ticket.updatedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create ticket modal */}
      <Modal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create Support Ticket"
        description="Describe your issue and we'll get back to you as soon as possible."
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v ?? "medium")}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide as much detail as possible..."
              rows={5}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Attachments</Label>
            <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-dashed border-[#D9E0E8] p-4 text-center">
              <Paperclip className="h-4 w-4 text-[#6B7280]" />
              <p className="text-xs text-[#6B7280]">
                Drag files here or click to browse
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!category || !subject || !message}
              className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
            >
              <Send className="h-4 w-4" /> Submit Ticket
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
