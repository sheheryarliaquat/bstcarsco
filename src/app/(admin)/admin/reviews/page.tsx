"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Star,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { RatingStars } from "@/components/shared/RatingStars"
import { Modal } from "@/components/shared/Modal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { DEMO_DATA } from "@/constants"
import type { Review } from "@/types"

interface ReviewRecord extends Review {
  passengerName: string
  driverName: string
  operatorName: string
  moderationStatus: "approved" | "pending" | "rejected"
}

const DEMO_REVIEWS: ReviewRecord[] = [
  ...DEMO_DATA.reviews.map((r): ReviewRecord => ({
    ...r,
    passengerName: DEMO_DATA.passengers.find((p) => p.uid === r.passengerId)
      ? `${DEMO_DATA.passengers.find((p) => p.uid === r.passengerId)!.firstName} ${DEMO_DATA.passengers.find((p) => p.uid === r.passengerId)!.lastName}`
      : "Unknown",
    driverName: DEMO_DATA.drivers.find((d) => d.uid === r.driverId)
      ? `${DEMO_DATA.drivers.find((d) => d.uid === r.driverId)!.firstName} ${DEMO_DATA.drivers.find((d) => d.uid === r.driverId)!.lastName}`
      : "Unknown",
    operatorName: DEMO_DATA.operators.find((o) => o.uid === r.operatorId)?.companyName ?? "Unknown",
    moderationStatus: r.isApproved ? "approved" : "pending",
  })),
  {
    id: "rev-006",
    bookingId: "UKTB-2026-000002",
    passengerId: "pass-004",
    driverId: "drv-004",
    operatorId: "op-002",
    rating: 2,
    comment: "The driver was late and the vehicle was not very clean. Disappointed with the service overall.",
    createdAt: "2026-08-19T10:15:00Z",
    isApproved: false,
    passengerName: "Sophie Clarkson",
    driverName: "Peter Davies",
    operatorName: "Northern Taxi Services",
    moderationStatus: "pending" as const,
  },
  {
    id: "rev-007",
    bookingId: "UKTB-2026-000004",
    passengerId: "pass-001",
    driverId: "drv-001",
    operatorId: "op-001",
    rating: 1,
    comment: "",
    createdAt: "2026-08-18T09:30:00Z",
    isApproved: false,
    passengerName: "James Wilson",
    driverName: "Mohammed Hassan",
    operatorName: "Kingsley Travel",
    moderationStatus: "pending" as const,
  },
]

export default function AdminReviewsPage() {
  const [search, setSearch] = useState("")
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [operatorFilter, setOperatorFilter] = useState<string>("all")
  const [detailTarget, setDetailTarget] = useState<ReviewRecord | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<ReviewRecord | null>(null)

  const filtered = useMemo(() => {
    let result = [...DEMO_REVIEWS]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.passengerName.toLowerCase().includes(q) ||
          r.driverName.toLowerCase().includes(q) ||
          r.operatorName.toLowerCase().includes(q) ||
          (r.comment ?? "").toLowerCase().includes(q)
      )
    }
    if (ratingFilter !== "all") result = result.filter((r) => r.rating === Number(ratingFilter))
    if (statusFilter !== "all") result = result.filter((r) => r.moderationStatus === statusFilter)
    if (operatorFilter !== "all") result = result.filter((r) => r.operatorId === operatorFilter)
    return result
  }, [search, ratingFilter, statusFilter, operatorFilter])

  const avgRating = DEMO_REVIEWS.length > 0
    ? DEMO_REVIEWS.reduce((s, r) => s + r.rating, 0) / DEMO_REVIEWS.length
    : 0
  const pendingCount = DEMO_REVIEWS.filter((r) => r.moderationStatus === "pending").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Reviews</h1>
          <p className="text-sm text-[#6B7280]">Moderate and manage platform reviews</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <DashboardCard title="Average Rating" value={`${avgRating.toFixed(1)} ★`} icon={<Star className="h-5 w-5" />} />
        <DashboardCard title="Total Reviews" value={DEMO_REVIEWS.length} icon={<MessageSquare className="h-5 w-5" />} />
        <DashboardCard title="Pending Moderation" value={pendingCount} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <div className="rounded-xl border border-[#D9E0E8] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by passenger, driver, operator..."
              className="h-9 pl-9"
            />
          </div>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          >
            <option value="all">All Ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} Star{r !== 1 ? "s" : ""}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
          >
            <option value="all">All Operators</option>
            {DEMO_DATA.operators.map((o) => (
              <option key={o.uid} value={o.uid}>{o.companyName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-[#D9E0E8] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#D9E0E8] bg-[#F5F7FA]">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">ID</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Passenger</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Driver</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Operator</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Rating</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Review</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[#6B7280]">
                    No reviews found
                  </td>
                </tr>
              ) : (
                filtered.map((review) => (
                  <tr
                    key={review.id}
                    className="border-b border-[#F5F7FA] transition-colors last:border-0 hover:bg-[#F5F7FA]/50"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-[#172F52]">{review.id}</td>
                    <td className="px-4 py-3 text-[#172F52]">{review.passengerName}</td>
                    <td className="px-4 py-3 text-[#172F52]">{review.driverName}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{review.operatorName}</td>
                    <td className="px-4 py-3">
                      <RatingStars rating={review.rating} size="sm" />
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-[#6B7280]">
                      {review.comment || <span className="italic">No comment</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                          review.moderationStatus === "approved" && "bg-green-50 text-green-700",
                          review.moderationStatus === "pending" && "bg-amber-50 text-amber-700",
                          review.moderationStatus === "rejected" && "bg-red-50 text-red-700"
                        )}
                      >
                        {review.moderationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6B7280]">
                      {new Date(review.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#D9E0E8]"
                          onClick={() => { setDetailTarget(review); setDetailOpen(true) }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {review.moderationStatus === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#168A55] text-[#168A55] hover:bg-[#168A55]/5"
                              onClick={() => {}}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/5"
                              onClick={() => setRejectTarget(review)}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={`Review ${detailTarget?.id}`}
        size="lg"
      >
        {detailTarget && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Passenger</p>
                <p className="text-sm font-medium text-[#172F52]">{detailTarget.passengerName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Driver</p>
                <p className="text-sm font-medium text-[#172F52]">{detailTarget.driverName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Operator</p>
                <p className="text-sm text-[#172F52]">{detailTarget.operatorName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Booking Ref</p>
                <p className="font-mono text-sm text-[#172F52]">{detailTarget.bookingId}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-[#6B7280]">Rating</p>
              <RatingStars rating={detailTarget.rating} size="lg" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-[#6B7280]">Comment</p>
              <p className="text-sm text-[#172F52]">{detailTarget.comment || "No comment provided"}</p>
            </div>
            <div className="flex items-center gap-4 border-t border-[#F5F7FA] pt-4">
              <div className="space-y-1">
                <p className="text-xs text-[#6B7280]">Date</p>
                <p className="text-sm text-[#172F52]">
                  {new Date(detailTarget.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[#6B7280]">Status</p>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                    detailTarget.moderationStatus === "approved" && "bg-green-50 text-green-700",
                    detailTarget.moderationStatus === "pending" && "bg-amber-50 text-amber-700",
                    detailTarget.moderationStatus === "rejected" && "bg-red-50 text-red-700"
                  )}
                >
                  {detailTarget.moderationStatus}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={(open) => { if (!open) setRejectTarget(null) }}
        title="Reject Review"
        description="Are you sure you want to reject this review? It will not be visible to users."
        confirmText="Reject"
        variant="destructive"
        onConfirm={() => setRejectTarget(null)}
      />
    </div>
  )
}
