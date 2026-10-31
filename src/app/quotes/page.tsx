"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  Car,
  Check,
  Clock,
  Pencil,
  SearchX,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingProgress } from "@/components/booking/BookingProgress";
import { cn } from "@/lib/utils";
import { VEHICLE_TYPES, PRICING_DEFAULTS } from "@/constants";
import { getAvailableQuotes } from "@/lib/services/quote-service";
import {
  DEFAULT_EXTRAS_PRICING,
  calculateJourneyPrice,
  getExtrasPricing,
} from "@/lib/services/extras-service";
import { saveCheckoutSelection } from "@/lib/checkout-session";
import { ensureAuthSession } from "@/lib/firebase/auth";
import type { BookingExtrasPricing, Location, Quote, TripType, VehicleType } from "@/types";
import type { BookingSearchParams } from "@/components/booking/BookingSearch";

const VAT_RATE = PRICING_DEFAULTS.taxRate / 100;

interface CarTypeOption {
  vehicleType: VehicleType;
  label: string;
  description: string;
  passengerCapacity: number;
  luggageCapacity: number;
  /** Every provider's quote for this car type, cheapest first. */
  quotes: Quote[];
  fromPrice: number;
  fixedFare: boolean;
}

function groupByCarType(quotes: Quote[]): CarTypeOption[] {
  const groups = new Map<VehicleType, Quote[]>();
  for (const q of quotes) {
    const list = groups.get(q.vehicleType) ?? [];
    list.push(q);
    groups.set(q.vehicleType, list);
  }
  const order = VEHICLE_TYPES.map((v) => v.value);
  return [...groups.entries()]
    .map(([vehicleType, list]) => {
      const sorted = [...list].sort((a, b) => a.price - b.price);
      const meta = VEHICLE_TYPES.find((v) => v.value === vehicleType);
      return {
        vehicleType,
        label: meta?.label ?? vehicleType,
        description: meta?.description ?? "",
        passengerCapacity: Math.max(...sorted.map((q) => q.passengerCapacity)),
        luggageCapacity: Math.max(...sorted.map((q) => q.luggageCapacity)),
        quotes: sorted,
        fromPrice: sorted[0].price,
        fixedFare: sorted.some((q) => q.features.includes("Fixed fare")),
      };
    })
    .sort((a, b) => order.indexOf(a.vehicleType) - order.indexOf(b.vehicleType));
}

function money(n: number): string {
  return `£${n.toFixed(2)}`;
}

function CarIllustration() {
  return (
    <svg width="96" height="44" viewBox="0 0 96 44" fill="none" stroke="#172F52" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 32h84v-8l-10-4-12-10H34L22 20 8 23z" />
      <circle cx="26" cy="33" r="6" fill="#fff" />
      <circle cx="72" cy="33" r="6" fill="#fff" />
      <path d="M40 10v10M24 20h52" />
    </svg>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#D9E0E8] bg-white p-4">
      <Skeleton className="h-[72px] w-[120px] rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

function QuotesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const search: BookingSearchParams = useMemo(() => {
    const read = (prefix: "pickup" | "dest"): Location | null => {
      const address = searchParams.get(`${prefix}Address`);
      if (!address) return null;
      return {
        formattedAddress: address,
        latitude: parseFloat(searchParams.get(`${prefix}Lat`) || "51.5"),
        longitude: parseFloat(searchParams.get(`${prefix}Lng`) || "-0.1"),
        placeId: searchParams.get(`${prefix}PlaceId`) || "",
        postcode: searchParams.get(`${prefix}Postcode`) || "",
        city: searchParams.get(`${prefix}City`) || "",
        country: "United Kingdom",
      };
    };
    const dateStr = searchParams.get("date");
    const flight = searchParams.get("flight") || "";
    return {
      pickup: read("pickup"),
      destination: read("dest"),
      tripType: (searchParams.get("tripType") || "one_way") as TripType,
      date: dateStr ? new Date(dateStr) : undefined,
      time: searchParams.get("time") || "09:00",
      passengers: parseInt(searchParams.get("passengers") || "1", 10),
      luggage: parseInt(searchParams.get("luggage") || "0", 10),
      specialRequirements: {
        childSeat: searchParams.get("childSeat") === "1",
        wheelchairAccessible: searchParams.get("wheelchair") === "1",
        meetAndGreet: searchParams.get("meetGreet") === "1",
        ...(flight && { flightNumber: flight }),
      },
    };
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [extrasPricing, setExtrasPricing] = useState<BookingExtrasPricing>(DEFAULT_EXTRAS_PRICING);
  const [selectedType, setSelectedType] = useState<VehicleType | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isReturn, setIsReturn] = useState(search.tripType === "return");
  const [meetAndGreet, setMeetAndGreet] = useState(search.specialRequirements.meetAndGreet);
  const [childSeat, setChildSeat] = useState(search.specialRequirements.childSeat);

  useEffect(() => {
    getExtrasPricing().then(setExtrasPricing).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!search.pickup || !search.destination) {
      setQuotes([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    // Firestore rules require a signed-in session to read vehicles/rates —
    // this gives a signed-out visitor an anonymous one so quotes can load.
    ensureAuthSession()
      .then(() =>
        getAvailableQuotes({
          pickup: search.pickup!,
          destination: search.destination!,
          passengers: search.passengers,
          luggage: search.luggage,
          wheelchairAccessible: search.specialRequirements.wheelchairAccessible,
        })
      )
      .then((result) => {
        if (!cancelled) setQuotes(result);
      })
      .catch(() => {
        if (!cancelled) setQuotes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search]);

  const options = useMemo(() => groupByCarType(quotes), [quotes]);
  const cheapest = options.length ? Math.min(...options.map((o) => o.fromPrice)) : 0;

  // Until the customer picks one, the cheapest car type is selected.
  const selectedOption =
    options.find((o) => o.vehicleType === selectedType) ??
    options.find((o) => o.fromPrice === cheapest) ??
    options[0] ??
    null;
  const selectedQuote =
    selectedOption?.quotes.find((q) => q.id === selectedQuoteId) ?? selectedOption?.quotes[0] ?? null;

  const price = selectedQuote
    ? calculateJourneyPrice(selectedQuote.price, { isReturn, meetAndGreet, childSeat }, extrasPricing)
    : null;
  const vat = price ? Math.round(price.subtotal * VAT_RATE * 100) / 100 : 0;
  const total = price ? price.subtotal + vat : 0;

  function chooseType(option: CarTypeOption) {
    setSelectedType(option.vehicleType);
    setSelectedQuoteId(option.quotes[0].id);
  }

  function handleContinue() {
    if (!selectedQuote || !price) return;
    saveCheckoutSelection({
      quote: selectedQuote,
      search: {
        ...search,
        tripType: isReturn ? "return" : "one_way",
        specialRequirements: { ...search.specialRequirements, meetAndGreet, childSeat },
      },
      pricing: { lines: price.lines, subtotal: price.subtotal },
    });
    router.push("/checkout");
  }

  const extraPriceLabel = (amount: number) => (amount > 0 ? `+ ${money(amount)}` : "Free");
  const hasSearch = Boolean(search.pickup && search.destination);

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-28 lg:pb-12">
      <div className="border-b border-[#D9E0E8] bg-white px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <BookingProgress currentStep="quotes" />
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-wrap items-start gap-6 px-4 pt-6 sm:px-6 lg:px-8">
        <main className="min-w-0 flex-[999_1_560px] space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="text-2xl font-bold text-[#172F52] sm:text-3xl">Choose your car</h1>
            {!loading && options.length > 0 && (
              <p className="text-sm text-[#6B7280]">
                {options.length} car {options.length === 1 ? "type" : "types"} available · prices fixed at booking
              </p>
            )}
          </div>

          {!hasSearch ? (
            <div className="rounded-2xl border border-[#D9E0E8] bg-white py-16 text-center">
              <SearchX className="mx-auto mb-4 h-12 w-12 text-[#D9E0E8]" />
              <h2 className="text-lg font-semibold text-[#172F52]">Start a search to see prices</h2>
              <p className="mt-1 text-sm text-[#6B7280]">Enter your pick-up and drop-off on the home page.</p>
              <Button render={<Link href="/" />} nativeButton={false} className="mt-4 bg-[#D4145A] text-white hover:bg-[#D4145A]/90">
                Search for a car
              </Button>
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : options.length === 0 ? (
            <div className="rounded-2xl border border-[#D9E0E8] bg-white py-16 text-center">
              <SearchX className="mx-auto mb-4 h-12 w-12 text-[#D9E0E8]" />
              <h2 className="text-lg font-semibold text-[#172F52]">No cars available for this journey</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-[#6B7280]">
                Try fewer passengers or bags, or call us and we&apos;ll arrange it for you.
              </p>
              <Button render={<Link href="/" />} nativeButton={false} variant="outline" className="mt-4">
                Change search
              </Button>
            </div>
          ) : (
            options.map((option) => {
              const selected = option.vehicleType === selectedOption?.vehicleType;
              return (
                <div
                  key={option.vehicleType}
                  className={cn(
                    "rounded-2xl bg-white transition-shadow",
                    selected ? "border-2 border-[#D4145A] shadow-md" : "border border-[#D9E0E8] hover:shadow-md"
                  )}
                >
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => chooseType(option)}
                    className="flex w-full flex-wrap items-center gap-4 p-4 text-left sm:flex-nowrap sm:gap-5 sm:p-5"
                  >
                    <span className="hidden h-[72px] w-[120px] shrink-0 items-center justify-center rounded-xl bg-[#EEF2F7] sm:flex">
                      <CarIllustration />
                    </span>
                    <span className="min-w-0 flex-1 space-y-1.5">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-xl font-bold text-[#172F52]">{option.label}</span>
                        {option.fromPrice === cheapest && (
                          <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">Best value</span>
                        )}
                        {option.fixedFare && (
                          <span className="rounded-full bg-[#172F52]/10 px-2 py-0.5 text-xs font-semibold text-[#172F52]">Fixed fare</span>
                        )}
                      </span>
                      <span className="block text-sm text-[#6B7280]">{option.description}</span>
                      <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#172033]">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-[#6B7280]" /> Up to {option.passengerCapacity}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4 text-[#6B7280]" /> {option.luggageCapacity} bags
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-[#6B7280]" /> ~{option.quotes[0].estimatedJourneyTime} min
                        </span>
                      </span>
                    </span>
                    <span className="flex w-full shrink-0 items-center justify-between gap-3 border-t border-[#EEF1F5] pt-3 sm:ml-auto sm:w-auto sm:flex-col sm:items-end sm:gap-1.5 sm:border-0 sm:pt-0">
                      <span className="flex items-baseline gap-1.5 sm:flex-col sm:items-end sm:gap-0">
                        <span className="text-xs text-[#6B7280]">{option.quotes.length > 1 ? "from" : "one way"}</span>
                        <span className="text-3xl font-bold text-[#172F52]">{money(option.fromPrice)}</span>
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-semibold",
                          selected ? "bg-[#D4145A] text-white" : "bg-[#EEF2F7] text-[#172F52]"
                        )}
                      >
                        {selected && <Check className="h-4 w-4" />}
                        {selected ? "Selected" : "Select"}
                      </span>
                    </span>
                  </button>

                  {selected && option.quotes.length > 1 && (
                    <fieldset className="border-t border-[#EEF1F5] px-4 pb-4 pt-3 sm:px-5">
                      <legend className="sr-only">Choose a provider</legend>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Choose a provider</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {option.quotes.map((q) => (
                          <label
                            key={q.id}
                            className={cn(
                              "flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-sm",
                              q.id === selectedQuote?.id ? "border-[#D4145A] bg-[#D4145A]/5" : "border-[#D9E0E8]"
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`provider-${option.vehicleType}`}
                                checked={q.id === selectedQuote?.id}
                                onChange={() => setSelectedQuoteId(q.id)}
                                className="accent-[#D4145A]"
                              />
                              <span>
                                <span className="block font-medium text-[#172033]">{q.operatorName}</span>
                                <span className="flex items-center gap-1 text-xs text-[#6B7280]">
                                  {q.rating > 0 && (
                                    <>
                                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                      {q.rating.toFixed(1)} ·{" "}
                                    </>
                                  )}
                                  {q.vehicleDescription}
                                </span>
                              </span>
                            </span>
                            <span className="font-bold text-[#172F52]">{money(q.price)}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}
                </div>
              );
            })
          )}
        </main>

        {hasSearch && (
          <aside aria-label="Your journey" className="w-full min-w-0 flex-[1_1_320px] lg:sticky lg:top-6">
            <div className="space-y-4 rounded-2xl border border-[#D9E0E8] bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#172F52]">Your journey</h2>
                <Link href="/" className="flex items-center gap-1 text-sm font-medium text-[#D4145A] hover:underline">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center pt-1.5" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-[#D4145A]" />
                  <span className="my-1 w-0.5 flex-1 bg-[#D9E0E8]" />
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#D4145A]" />
                </div>
                <div className="min-w-0 space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase text-[#6B7280]">Pick-up</p>
                    <p className="font-medium text-[#172033]">{search.pickup?.formattedAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-[#6B7280]">Drop-off</p>
                    <p className="font-medium text-[#172033]">{search.destination?.formattedAddress}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-[#F5F7FA] px-3 py-2">
                  <p className="flex items-center gap-1 text-xs text-[#6B7280]"><Calendar className="h-3 w-3" /> Date</p>
                  <p className="font-semibold text-[#172033]">{search.date ? format(search.date, "EEE d MMM yyyy") : "—"}</p>
                </div>
                <div className="rounded-lg bg-[#F5F7FA] px-3 py-2">
                  <p className="flex items-center gap-1 text-xs text-[#6B7280]"><Clock className="h-3 w-3" /> Time</p>
                  <p className="font-semibold text-[#172033]">{search.time}</p>
                </div>
                <div className="rounded-lg bg-[#F5F7FA] px-3 py-2">
                  <p className="flex items-center gap-1 text-xs text-[#6B7280]"><Users className="h-3 w-3" /> Passengers</p>
                  <p className="font-semibold text-[#172033]">
                    {search.passengers} · {search.luggage} {search.luggage === 1 ? "bag" : "bags"}
                  </p>
                </div>
                <div className="rounded-lg bg-[#F5F7FA] px-3 py-2">
                  <p className="flex items-center gap-1 text-xs text-[#6B7280]"><Car className="h-3 w-3" /> Car</p>
                  <p className="font-semibold text-[#172033]">{selectedOption?.label ?? "—"}</p>
                </div>
              </div>

              <fieldset className="space-y-2.5 border-t border-[#EEF1F5] pt-4">
                <legend className="mb-2 text-sm font-semibold text-[#172F52]">Extras</legend>
                <label className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2.5">
                    <input type="checkbox" checked={isReturn} onChange={(e) => setIsReturn(e.target.checked)} className="h-4 w-4 accent-[#D4145A]" />
                    Return journey
                  </span>
                  <span className="text-[#6B7280]">
                    {extrasPricing.returnDiscountPercent > 0 ? `${extrasPricing.returnDiscountPercent}% off` : "+ same fare"}
                  </span>
                </label>
                <label className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2.5">
                    <input type="checkbox" checked={meetAndGreet} onChange={(e) => setMeetAndGreet(e.target.checked)} className="h-4 w-4 accent-[#D4145A]" />
                    Meet &amp; greet with name board
                  </span>
                  <span className="text-[#6B7280]">{extraPriceLabel(extrasPricing.meetAndGreet)}</span>
                </label>
                <label className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2.5">
                    <input type="checkbox" checked={childSeat} onChange={(e) => setChildSeat(e.target.checked)} className="h-4 w-4 accent-[#D4145A]" />
                    Child seat
                  </span>
                  <span className="text-[#6B7280]">{extraPriceLabel(extrasPricing.childSeat)}</span>
                </label>
                {isReturn && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    You&apos;ll enter the return date and time with your passenger details.
                  </p>
                )}
              </fieldset>

              {price && (
                <div className="space-y-1.5 border-t border-[#EEF1F5] pt-4 text-sm">
                  {price.lines.map((l) => (
                    <div key={l.label} className="flex justify-between">
                      <span className="text-[#6B7280]">{l.label}</span>
                      <span className={l.amount < 0 ? "text-green-700" : "text-[#172033]"}>
                        {l.amount < 0 ? `−${money(-l.amount)}` : money(l.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">VAT ({PRICING_DEFAULTS.taxRate}%)</span>
                    <span className="text-[#172033]">{money(vat)}</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-2">
                    <span className="text-base font-semibold text-[#172F52]">Total</span>
                    <span className="text-3xl font-bold text-[#172F52]">{money(total)}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleContinue}
                disabled={!selectedQuote}
                className="hidden h-12 w-full bg-[#D4145A] text-base font-semibold text-white hover:bg-[#D4145A]/90 lg:flex"
              >
                Continue to passenger details
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
              <p className="text-xs text-[#6B7280]">
                Licensed private hire operator. Free cancellation up to 2 hours before pick-up.
              </p>
            </div>
          </aside>
        )}
      </div>

      {selectedQuote && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D9E0E8] bg-white p-3 shadow-lg lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div>
              <p className="text-xs text-[#6B7280]">{selectedOption?.label} · total</p>
              <p className="text-xl font-bold text-[#172F52]">{money(total)}</p>
            </div>
            <Button onClick={handleContinue} className="h-11 bg-[#D4145A] text-white hover:bg-[#D4145A]/90">
              Continue
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuotesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#D4145A] border-t-transparent" />
            <p className="text-sm text-[#6B7280]">Loading prices...</p>
          </div>
        </div>
      }
    >
      <QuotesContent />
    </Suspense>
  );
}
