"use client"

import { useState, useEffect, useMemo } from "react"
import { Star, MessageSquarePlus, Calendar } from "lucide-react"
import { RatingStars } from "@/components/shared/RatingStars"
import { EmptyState } from "@/components/shared/EmptyState"
import { Modal } from "@/components/shared/Modal"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { BookingStatus, type Booking, type Driver, type Review } from "@/types"
import { useAuth } from "@/hooks/useAuth"
import { listenToPassengerBookings } from "@/lib/services/booking-service"
import { listenToReviewsByPassenger, createReview } from "@/lib/services/review-service"
import { getDriver } from "@/lib/services/driver-service"

export default function ReviewsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [driverNames, setDriverNames] = useState<Record<string, string>>({})
  const [writeOpen, setWriteOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) {
      setBookings([])
      setReviews([])
      return
    }
    const unsub1 = listenToPassengerBookings(user.uid, setBookings, () => setBookings([]))
    const unsub2 = listenToReviewsByPassenger(user.uid, setReviews, () => setReviews([]))
    return () => {
      unsub1()
      unsub2()
    }
  }, [user])

  useEffect(() => {
    const driverIds = [...new Set(reviews.map((r) => r.driverId).filter(Boolean))]
    Promise.all(driverIds.map((id) => getDriver(id).catch(() => null))).then((results) => {
      const map: Record<string, string> = {}
      results.forEach((d, i) => {
        if (d) map[driverIds[i]] = `${d.firstName} ${d.lastName}`
      })
      setDriverNames(map)
    })
  }, [reviews])

  const completedWithoutReview = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.bookingStatus === BookingStatus.TripCompleted &&
          !reviews.some((r) => r.bookingId === b.bookingNumber)
      ),
    [bookings, reviews]
  )

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

  async function handleSubmitReview() {
    if (!user || !selectedBooking || rating === 0) return
    setSubmitting(true)
    try {
      await createReview({
        bookingId: selectedBooking.bookingNumber,
        passengerId: user.uid,
        driverId: selectedBooking.driverId,
        operatorId: selectedBooking.operatorId,
        rating,
        comment: comment || undefined,
      })
      setWriteOpen(false)
      setSelectedBooking(null)
      setRating(0)
      setComment("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#172F52]">Reviews</h1>
        <p className="text-sm text-[#6B7280]">
          Your feedback helps us maintain the best service.
        </p>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-6 rounded-xl border border-[#D9E0E8] bg-white p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D4145A]/10">
          <Star className="h-8 w-8 fill-[#D4145A] text-[#D4145A]" />
        </div>
        <div>
          <p className="text-3xl font-bold text-[#172F52]">
            {averageRating.toFixed(1)}
          </p>
          <RatingStars rating={averageRating} size="md" count={reviews.length} />
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm text-[#6B7280]">Total Reviews</p>
          <p className="text-2xl font-bold text-[#172F52]">
            {reviews.length}
          </p>
        </div>
      </div>

      {/* Write review button for unreviewed trips */}
      {completedWithoutReview.length > 0 && (
        <div className="rounded-xl border border-[#D4145A]/20 bg-[#D4145A]/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#172F52]">
                You have {completedWithoutReview.length} unreviewed trip
                {completedWithoutReview.length > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-[#6B7280]">
                Share your experience to help other passengers.
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedBooking(completedWithoutReview[0])
                setWriteOpen(true)
              }}
              className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
            >
              <MessageSquarePlus className="h-4 w-4" /> Write Review
            </Button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <EmptyState
          icon={<Star className="h-16 w-16" />}
          title="No reviews yet"
          description="After completing a trip, you can leave a review for your driver."
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-[#D9E0E8] bg-white p-5"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-3">
                    <RatingStars rating={review.rating} size="md" />
                    <span className="text-xs text-[#6B7280]">
                      {review.bookingId}
                    </span>
                  </div>
                  {driverNames[review.driverId] && (
                    <p className="text-sm text-[#6B7280]">
                      Driver: {driverNames[review.driverId]}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(review.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm leading-relaxed text-[#172F52]">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Write review modal */}
      <Modal
        open={writeOpen}
        onOpenChange={setWriteOpen}
        title="Write a Review"
        description={
          selectedBooking
            ? `Review your trip ${selectedBooking.bookingNumber}`
            : "Share your experience"
        }
        size="md"
      >
        <div className="space-y-4">
          <div>
            <Label>Rating</Label>
            <div className="mt-2">
              <RatingStars
                rating={rating}
                size="lg"
                interactive
                onRate={setRating}
              />
            </div>
          </div>
          <div>
            <Label>Your Review</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience..."
              className="mt-1.5"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setWriteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={rating === 0 || submitting}
              className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
