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

export default function CheckoutPage() {
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

  const basePrice = quote?.price ?? 0;
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
        pickup,
        destination,
        viaStops: [],
        date: (search.date ?? new Date()).toISOString(),
        pickupTime: search.time,
        passengers: search.passengers,
        luggage: search.luggage,
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
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[#D4145A]" />
          <p className="text-sm text-[#6B7280]">Loading your booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <BookingProgress currentStep="passenger" />

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="rounded-xl border border-[#D9E0E8] bg-white p-5 sm:p-6">
                <h2 className="mb-4 text-lg font-bold text-[#172F52]">
                  Passenger Details
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label
                      htmlFor="firstName"
                      className="text-sm font-medium text-[#172033]"
                    >
                      First Name
                    </Label>
                    <div className="relative mt-1.5">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
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
                      className="text-sm font-medium text-[#172033]"
                    >
                      Last Name
                    </Label>
                    <div className="relative mt-1.5">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
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
                    className="text-sm font-medium text-[#172033]"
                  >
                    Email
                  </Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
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
                    className="text-sm font-medium text-[#172033]"
                  >
                    Mobile
                  </Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                    <div className="flex">
                      <div className="flex h-11 items-center rounded-l-lg border border-r-0 border-[#D9E0E8] bg-[#F5F7FA] px-3 text-sm font-medium text-[#172033]">
                        +44
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="7700900000"
                        className="h-11 rounded-l-none"
                        disabled={continueAsGuest === true}
                        {...register("phone")}
                      />
                    </div>
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {continueAsGuest !== true && (
                  <div className="mt-4">
                    <label className="flex items-center gap-2 text-sm text-[#172033]">
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
                      className="text-sm font-medium text-[#172033]"
                    >
                      Password (optional)
                    </Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
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
                  <label className="flex items-center gap-2 text-sm text-[#172033]">
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

              <div className="rounded-xl border border-[#D9E0E8] bg-white p-5 sm:p-6">
                <button
                  type="button"
                  onClick={() => setSpecialOpen(!specialOpen)}
                  className="flex w-full items-center justify-between"
                >
                  <h2 className="text-lg font-bold text-[#172F52]">
                    Special Requirements
                  </h2>
                  {specialOpen ? (
                    <ChevronUp className="h-5 w-5 text-[#6B7280]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[#6B7280]" />
                  )}
                </button>
                {specialOpen && (
                  <div className="mt-4">
                    <Label
                      htmlFor="special"
                      className="text-sm font-medium text-[#172033]"
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

              <div className="rounded-xl border border-[#D9E0E8] bg-white p-5 sm:p-6">
                <h2 className="mb-3 text-lg font-bold text-[#172F52]">
                  Promo Code
                </h2>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
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

              <div className="rounded-xl border border-[#D9E0E8] bg-white p-5 sm:p-6">
                <h2 className="mb-4 text-lg font-bold text-[#172F52]">
                  Payment Method
                </h2>

                <div className="mb-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      paymentMethod === "card"
                        ? "border-[#D4145A] bg-[#FCE7EF]/50"
                        : "border-[#D9E0E8] hover:border-[#D4145A]/30"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        paymentMethod === "card"
                          ? "bg-[#D4145A] text-white"
                          : "bg-[#F5F7FA] text-[#6B7280]"
                      }`}
                    >
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#172033]">
                        Pay by Card
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        Credit or debit card
                      </p>
                    </div>
                    {paymentMethod === "card" && (
                      <CheckCircle2 className="ml-auto h-5 w-5 text-[#D4145A]" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      paymentMethod === "cash"
                        ? "border-[#D4145A] bg-[#FCE7EF]/50"
                        : "border-[#D9E0E8] hover:border-[#D4145A]/30"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        paymentMethod === "cash"
                          ? "bg-[#D4145A] text-white"
                          : "bg-[#F5F7FA] text-[#6B7280]"
                      }`}
                    >
                      <Banknote className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#172033]">
                        Pay by Cash
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        Pay the driver
                      </p>
                    </div>
                    {paymentMethod === "cash" && (
                      <CheckCircle2 className="ml-auto h-5 w-5 text-[#D4145A]" />
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
                className="h-12 w-full bg-[#D4145A] text-base font-semibold text-white hover:bg-[#D4145A]/90"
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
              <div className="rounded-xl border border-[#D9E0E8] bg-white p-5">
                <h3 className="mb-4 text-sm font-semibold text-[#172F52]">
                  Booking Summary
                </h3>

                <div className="mb-4 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D4145A]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#6B7280]">Pickup</p>
                      <p className="truncate text-sm font-medium text-[#172033]">
                        {pickup.formattedAddress}
                      </p>
                    </div>
                  </div>
                  <div className="ml-1.5 h-3 border-l-2 border-dashed border-[#D9E0E8]" />
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#168A55]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#6B7280]">Destination</p>
                      <p className="truncate text-sm font-medium text-[#172033]">
                        {destination.formattedAddress}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="mb-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[#172033]">
                    <Calendar className="h-3.5 w-3.5 text-[#6B7280]" />
                    {format(search.date ?? new Date(), "dd MMMM yyyy")}
                  </div>
                  <div className="flex items-center gap-2 text-[#172033]">
                    <Clock className="h-3.5 w-3.5 text-[#6B7280]" />
                    {search.time}
                  </div>
                  <div className="flex items-center gap-2 text-[#172033]">
                    <Car className="h-3.5 w-3.5 text-[#6B7280]" />
                    {quote.vehicleDescription}
                  </div>
                  <div className="flex items-center gap-2 text-[#172033]">
                    <Building2 className="h-3.5 w-3.5 text-[#6B7280]" />
                    {quote.operatorName}
                  </div>
                  <div className="flex items-center gap-2 text-[#172033]">
                    <Users className="h-3.5 w-3.5 text-[#6B7280]" />
                    {search.passengers}{" "}
                    {search.passengers === 1 ? "Passenger" : "Passengers"}
                  </div>
                  <div className="flex items-center gap-2 text-[#172033]">
                    <Briefcase className="h-3.5 w-3.5 text-[#6B7280]" />
                    {search.luggage}{" "}
                    {search.luggage === 1 ? "Luggage" : "Luggage items"}
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-[#172033]">
                    <span>Journey Fare</span>
                    <span>£{basePrice.toFixed(2)}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-[#168A55]">
                      <span>Discount</span>
                      <span>-£{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#172033]">
                    <span>VAT (20%)</span>
                    <span>£{tax.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-2 flex justify-between border-t border-[#D9E0E8] pt-2 text-base font-bold text-[#172F52]">
                  <span>Total</span>
                  <span>£{total.toFixed(2)}</span>
                </div>

                {promoApplied && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-[#D4145A]">
                    <Tag className="h-3 w-3" />
                    Promo: {promoInput.toUpperCase()}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[#D9E0E8] bg-[#FCE7EF]/50 p-4">
                <div className="flex items-start gap-2">
                  <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-[#D4145A]" />
                  <p className="text-xs text-[#6B7280]">
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
