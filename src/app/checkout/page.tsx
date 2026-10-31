"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Mail,
  Phone,
  Lock,
  MessageSquare,
  Tag,
  MapPin,
  Calendar,
  Clock,
  Users,
  Briefcase,
  CreditCard,
  Loader2,
  AlertCircle,
  Car,
  Building2,
  ChevronDown,
  ChevronUp,
  Banknote,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BookingProgress } from "@/components/booking/BookingProgress";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PaymentForm } from "@/components/shared/PaymentForm";
import { BookingStatus, type Booking } from "@/types";
import { createBooking } from "@/lib/services/booking-service";
import { calculateDistance } from "@/lib/services/pricing";
import { ensureAuthSession } from "@/lib/firebase/auth";
import {
  getCheckoutSelection,
  clearCheckoutSelection,
  type CheckoutSelection,
} from "@/lib/checkout-session";
import { format } from "date-fns";

const passengerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\+44\d{10}$/, "Enter a valid UK number (e.g. +447700900000)"),
  createAccount: z.boolean().optional(),
  password: z.string().optional(),
  continueAsGuest: z.boolean().optional(),
  specialRequirements: z.string().optional(),
  promoCode: z.string().optional(),
});

type PassengerFormData = z.infer<typeof passengerSchema>;

function CheckoutContent() {
  const router = useRouter();
  const [selection, setSelection] = useState<CheckoutSelection | null>(null);
  const [selectionChecked, setSelectionChecked] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoInput, setPromoInput] = useState("");
  const [specialOpen, setSpecialOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");

  useEffect(() => {
    const stored = getCheckoutSelection();
    if (!stored || !stored.search.pickup || !stored.search.destination) {
      router.replace("/quotes");
      return;
    }
    setSelection(stored);
    setSelectionChecked(true);
  }, [router]);

  const quote = selection?.quote;
  const search = selection?.search;
  const pickup = search?.pickup;
  const destination = search?.destination;
  const distanceMiles =
    pickup && destination ? calculateDistance(pickup, destination) : 0;

  // Fare + return leg + extras as chosen on the car selection page; falls back
  // to the single-trip quote price for selections saved before extras existed.
  const priceLines = selection?.pricing?.lines ?? (quote ? [{ label: "Journey Fare", amount: quote.price }] : []);
  const basePrice = selection?.pricing?.subtotal ?? quote?.price ?? 0;
  const isReturn = search?.tripType === "return";
  const returnMissing = isReturn && (!returnDate || !returnTime);
  const discount = promoDiscount;
  const tax = (basePrice - discount) * 0.2;
  const total = basePrice - discount + tax;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PassengerFormData>({
    resolver: zodResolver(passengerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "+44",
      createAccount: false,
      continueAsGuest: false,
      specialRequirements: "",
      promoCode: "",
    },
  });

  const createAccount = watch("createAccount");
  const continueAsGuest = watch("continueAsGuest");
  const notes = watch("specialRequirements") ?? "";

  function handlePromoApply() {
    if (promoInput.toUpperCase() === "FIRST10") {
      setPromoApplied(true);
      setPromoDiscount(basePrice * 0.1);
    } else {
      setPromoApplied(false);
      setPromoDiscount(0);
    }
  }

  async function handlePayment() {
    if (!quote || !pickup || !destination || !search) return;
    if (returnMissing) {
      setPaymentError("Please enter the date and time for your return journey.");
      return;
    }
    setPaymentLoading(true);
    setPaymentError("");

    try {
      let passengerId = "guest-" + Date.now();
      try {
        // The bookings security rule requires request.auth.uid to match
        // passengerId for a real write, so a signed-out guest needs an
        // (anonymous) session before their booking can be saved — the
        // "guest-*" id below is only a fallback if that session can't be
        // established (e.g. anonymous sign-in disabled in the console).
        const currentUser = await ensureAuthSession();
        if (currentUser) passengerId = currentUser.uid;
      } catch {
        // Proceed as guest.
      }

      const bookingData: Omit<Booking, 'bookingNumber' | 'createdAt' | 'updatedAt'> = {
        passengerId,
        operatorId: quote.operatorId,
        driverId: "",
        vehicleId: quote.id,
        tripType: search.tripType,
        ...(isReturn && { returnDate, returnTime }),
        pickup,
        destination,
        viaStops: [],
        date: (search.date ?? new Date()).toISOString(),
        pickupTime: search.time,
        passengers: search.passengers,
        luggage: search.luggage,
        // Firestore rejects undefined values, so only include fields that are set.
        specialRequirements: {
          childSeat: Boolean(search.specialRequirements?.childSeat),
          wheelchairAccessible: Boolean(search.specialRequirements?.wheelchairAccessible),
          meetAndGreet: Boolean(search.specialRequirements?.meetAndGreet),
          ...(search.specialRequirements?.flightNumber && { flightNumber: search.specialRequirements.flightNumber }),
          ...(notes.trim() && { notes: notes.trim() }),
        },
        vehicleType: quote.vehicleType,
        distanceMiles,
        estimatedDuration: quote.estimatedJourneyTime,
        price: basePrice,
        discount,
        tax,
        total,
        currency: "GBP",
        paymentStatus: paymentMethod === "card" ? 'completed' : 'pending',
        paymentMethod,
        bookingStatus: paymentMethod === "cash"
          ? BookingStatus.CashPendingApproval
          : BookingStatus.Confirmed,
      };

      const { id } = await createBooking(bookingData);
      clearCheckoutSelection();

      router.push(`/booking-confirmation?payment=${paymentMethod}&bookingId=${id}`);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Failed to create booking. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  }

  function onSubmit(_data: PassengerFormData) {
    handlePayment();
  }

  if (!selectionChecked || !quote || !pickup || !destination || !search) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F6F9]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[#1F4FD8]" />
          <p className="text-sm text-[#5B6577]">Loading your booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <BookingProgress currentStep="passenger" />

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="rounded-xl border border-[#E2E6EC] bg-white p-5 sm:p-6">
                <h2 className="mb-4 text-lg font-bold text-[#0F1B2D]">
                  Passenger Details
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label
                      htmlFor="firstName"
                      className="text-sm font-medium text-[#0F1B2D]"
                    >
                      First Name
                    </Label>
                    <div className="relative mt-1.5">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6577]" />
                      <Input
                        id="firstName"
                        placeholder="James"
                        className="h-11 pl-10"
                        disabled={continueAsGuest === true}
                        {...register("firstName")}
                      />
                    </div>
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="lastName"
                      className="text-sm font-medium text-[#0F1B2D]"
                    >
                      Last Name
                    </Label>
                    <div className="relative mt-1.5">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6577]" />
                      <Input
                        id="lastName"
                        placeholder="Wilson"
                        className="h-11 pl-10"
                        disabled={continueAsGuest === true}
                        {...register("lastName")}
                      />
                    </div>
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-[#0F1B2D]"
                  >
                    Email
                  </Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6577]" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="h-11 pl-10"
                      disabled={continueAsGuest === true}
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <Label
                    htmlFor="phone"
                    className="text-sm font-medium text-[#0F1B2D]"
                  >
                    Mobile
                  </Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6577]" />
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+447700900000"
                      className="h-11 pl-10"
                      disabled={continueAsGuest === true}
                      {...register("phone")}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {continueAsGuest !== true && (
                  <div className="mt-4">
                    <label className="flex items-center gap-2 text-sm text-[#0F1B2D]">
                      <Checkbox
                        checked={createAccount === true}
                        onCheckedChange={(checked) =>
                          register("createAccount").onChange({
                            target: {
                              name: "createAccount",
                              value: checked === true,
                            },
                          })
                        }
                      />
                      Create an account for faster booking next time
                    </label>
                  </div>
                )}

                {createAccount === true && continueAsGuest !== true && (
                  <div className="mt-4">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-[#0F1B2D]"
                    >
                      Password (optional)
                    </Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6577]" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a password"
                        className="h-11 pl-10"
                        {...register("password")}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <label className="flex items-center gap-2 text-sm text-[#0F1B2D]">
                    <Checkbox
                      checked={continueAsGuest === true}
                      onCheckedChange={(checked) =>
                        register("continueAsGuest").onChange({
                          target: {
                            name: "continueAsGuest",
                            value: checked === true,
                          },
                        })
                      }
                    />
                    Continue as Guest
                  </label>
                </div>
              </div>

              {isReturn && (
                <div className="rounded-xl border border-[#E2E6EC] bg-white p-5 sm:p-6">
                  <h2 className="mb-1 text-lg font-bold text-[#0F1B2D]">Return journey</h2>
                  <p className="mb-4 text-sm text-[#5B6577]">
                    From {destination.formattedAddress.split(",")[0]} back to {pickup.formattedAddress.split(",")[0]}.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="returnDate" className="text-sm font-medium text-[#0F1B2D]">
                        Return date *
                      </Label>
                      <Input
                        id="returnDate"
                        type="date"
                        value={returnDate}
                        min={format(search.date ?? new Date(), "yyyy-MM-dd")}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="mt-1.5 h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="returnTime" className="text-sm font-medium text-[#0F1B2D]">
                        Pick-up time *
                      </Label>
                      <Input
                        id="returnTime"
                        type="time"
                        step={900}
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                        className="mt-1.5 h-11"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-[#E2E6EC] bg-white p-5 sm:p-6">
                <button
                  type="button"
                  onClick={() => setSpecialOpen(!specialOpen)}
                  className="flex w-full items-center justify-between"
                >
                  <h2 className="text-lg font-bold text-[#0F1B2D]">
                    Special Requirements
                  </h2>
                  {specialOpen ? (
                    <ChevronUp className="h-5 w-5 text-[#5B6577]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[#5B6577]" />
                  )}
                </button>
                {specialOpen && (
                  <div className="mt-4">
                    <Label
                      htmlFor="special"
                      className="text-sm font-medium text-[#0F1B2D]"
                    >
                      Additional notes for the driver
                    </Label>
                    <Textarea
                      id="special"
                      placeholder="e.g. Please call on arrival, I have a large suitcase..."
                      className="mt-1.5"
                      rows={3}
                      {...register("specialRequirements")}
                    />
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[#E2E6EC] bg-white p-5 sm:p-6">
                <h2 className="mb-3 text-lg font-bold text-[#0F1B2D]">
                  Promo Code
                </h2>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6577]" />
                    <Input
                      placeholder="Enter promo code"
                      className="h-11 pl-10"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={handlePromoApply}
                  >
                    Apply
                  </Button>
                </div>
                {promoApplied && (
                  <p className="mt-2 text-sm text-[#168A55]">
                    Promo code applied! You saved £{promoDiscount.toFixed(2)}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-[#E2E6EC] bg-white p-5 sm:p-6">
                <h2 className="mb-4 text-lg font-bold text-[#0F1B2D]">
                  Payment Method
                </h2>

                <div className="mb-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      paymentMethod === "card"
                        ? "border-[#1F4FD8] bg-[#E7EEFF]/50"
                        : "border-[#E2E6EC] hover:border-[#1F4FD8]/30"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        paymentMethod === "card"
                          ? "bg-[#1F4FD8] text-white"
                          : "bg-[#F4F6F9] text-[#5B6577]"
                      }`}
                    >
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F1B2D]">
                        Pay by Card
                      </p>
                      <p className="text-xs text-[#5B6577]">
                        Credit or debit card
                      </p>
                    </div>
                    {paymentMethod === "card" && (
                      <CheckCircle2 className="ml-auto h-5 w-5 text-[#1F4FD8]" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      paymentMethod === "cash"
                        ? "border-[#1F4FD8] bg-[#E7EEFF]/50"
                        : "border-[#E2E6EC] hover:border-[#1F4FD8]/30"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        paymentMethod === "cash"
                          ? "bg-[#1F4FD8] text-white"
                          : "bg-[#F4F6F9] text-[#5B6577]"
                      }`}
                    >
                      <Banknote className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F1B2D]">
                        Pay by Cash
                      </p>
                      <p className="text-xs text-[#5B6577]">
                        Pay the driver
                      </p>
                    </div>
                    {paymentMethod === "cash" && (
                      <CheckCircle2 className="ml-auto h-5 w-5 text-[#1F4FD8]" />
                    )}
                  </button>
                </div>

                {paymentMethod === "card" ? (
                  <PaymentForm
                    amount={total}
                    onPayment={handlePayment}
                    loading={paymentLoading}
                    error={paymentError}
                  />
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">
                          Cash Payment
                        </p>
                        <p className="mt-1 text-sm text-amber-700">
                          Your booking will be sent for approval. Once approved
                          by our team, your driver will be assigned. Pay the
                          driver directly on the day of travel.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {paymentError && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {paymentError}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={paymentLoading}
                className="h-12 w-full bg-[#1F4FD8] text-base font-semibold text-white hover:bg-[#1F4FD8]/90"
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : paymentMethod === "cash" ? (
                  <>
                    <Banknote className="mr-2 h-5 w-5" />
                    Confirm Booking (Pay by Cash)
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Pay £{total.toFixed(2)} and Confirm
                  </>
                )}
              </Button>
            </form>
          </div>

          <aside className="lg:col-span-2">
            <div className="sticky top-6 space-y-4">
              <div className="rounded-xl border border-[#E2E6EC] bg-white p-5">
                <h3 className="mb-4 text-sm font-semibold text-[#0F1B2D]">
                  Booking Summary
                </h3>

                <div className="mb-4 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1F4FD8]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#5B6577]">Pickup</p>
                      <p className="truncate text-sm font-medium text-[#0F1B2D]">
                        {pickup.formattedAddress}
                      </p>
                    </div>
                  </div>
                  <div className="ml-1.5 h-3 border-l-2 border-dashed border-[#E2E6EC]" />
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#168A55]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#5B6577]">Destination</p>
                      <p className="truncate text-sm font-medium text-[#0F1B2D]">
                        {destination.formattedAddress}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="mb-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[#0F1B2D]">
                    <Calendar className="h-3.5 w-3.5 text-[#5B6577]" />
                    {format(search.date ?? new Date(), "dd MMMM yyyy")}
                  </div>
                  <div className="flex items-center gap-2 text-[#0F1B2D]">
                    <Clock className="h-3.5 w-3.5 text-[#5B6577]" />
                    {search.time}
                  </div>
                  <div className="flex items-center gap-2 text-[#0F1B2D]">
                    <Car className="h-3.5 w-3.5 text-[#5B6577]" />
                    {quote.vehicleDescription}
                  </div>
                  <div className="flex items-center gap-2 text-[#0F1B2D]">
                    <Building2 className="h-3.5 w-3.5 text-[#5B6577]" />
                    {quote.operatorName}
                  </div>
                  <div className="flex items-center gap-2 text-[#0F1B2D]">
                    <Users className="h-3.5 w-3.5 text-[#5B6577]" />
                    {search.passengers}{" "}
                    {search.passengers === 1 ? "Passenger" : "Passengers"}
                  </div>
                  <div className="flex items-center gap-2 text-[#0F1B2D]">
                    <Briefcase className="h-3.5 w-3.5 text-[#5B6577]" />
                    {search.luggage}{" "}
                    {search.luggage === 1 ? "Luggage" : "Luggage items"}
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="space-y-1.5 text-sm">
                  {priceLines.map((line) => (
                    <div
                      key={line.label}
                      className={line.amount < 0 ? "flex justify-between text-[#168A55]" : "flex justify-between text-[#0F1B2D]"}
                    >
                      <span>{line.label}</span>
                      <span>
                        {line.amount < 0 ? "-" : ""}£{Math.abs(line.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {promoApplied && (
                    <div className="flex justify-between text-[#168A55]">
                      <span>Discount</span>
                      <span>-£{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#0F1B2D]">
                    <span>VAT (20%)</span>
                    <span>£{tax.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-2 flex justify-between border-t border-[#E2E6EC] pt-2 text-base font-bold text-[#0F1B2D]">
                  <span>Total</span>
                  <span>£{total.toFixed(2)}</span>
                </div>

                {promoApplied && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-[#1F4FD8]">
                    <Tag className="h-3 w-3" />
                    Promo: {promoInput.toUpperCase()}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[#E2E6EC] bg-[#E7EEFF]/50 p-4">
                <div className="flex items-start gap-2">
                  <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-[#1F4FD8]" />
                  <p className="text-xs text-[#5B6577]">
                    Your payment details are encrypted with 256-bit SSL.
                    Cancellation is free up to 2 hours before pickup.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <PublicLayout>
      <CheckoutContent />
    </PublicLayout>
  );
}
