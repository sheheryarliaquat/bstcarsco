"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  SlidersHorizontal,
  X,
  ArrowRight,
  SearchX,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { QuoteCard } from "@/components/booking/QuoteCard";
import {
  QuoteFilters,
  DEFAULT_FILTERS,
  type QuoteFilterValues,
} from "@/components/booking/QuoteFilters";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { Skeleton } from "@/components/ui/skeleton";
import { saveBookingDraft } from "@/lib/booking-draft";
import type { RealQuote } from "@/app/api/quotes/route";
import type { SortingType, Location, TripType } from "@/types";
import type { BookingSearchParams } from "@/components/booking/BookingSearch";

function sortQuotes(quotes: RealQuote[], sortBy: SortingType): RealQuote[] {
  const sorted = [...quotes];
  switch (sortBy) {
    case "lowest_price":
      return sorted.sort((a, b) => a.price - b.price);
    case "highest_rated":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "fastest":
      return sorted.sort(
        (a, b) => a.estimatedJourneyTime - b.estimatedJourneyTime
      );
    case "electric_first":
      return sorted.sort((a, b) => {
        if (a.isElectric && !b.isElectric) return -1;
        if (!a.isElectric && b.isElectric) return 1;
        return a.price - b.price;
      });
    default:
      return sorted;
  }
}

function filterQuotes(quotes: RealQuote[], filters: QuoteFilterValues): RealQuote[] {
  return quotes.filter((q) => {
    if (q.price < filters.priceRange[0] || q.price > filters.priceRange[1])
      return false;
    if (filters.minRating > 0 && q.rating < filters.minRating) return false;
    if (
      filters.vehicleTypes.length > 0 &&
      !filters.vehicleTypes.includes(q.vehicleType)
    )
      return false;
    if (filters.electricOnly && !q.isElectric) return false;
    if (filters.hybridOnly && !q.isHybrid) return false;
    if (filters.wheelchairOnly && q.vehicleType !== "wheelchair_accessible")
      return false;
    if (filters.minPassengers > 0 && q.passengerCapacity < filters.minPassengers)
      return false;
    if (filters.minLuggage > 0 && q.luggageCapacity < filters.minLuggage)
      return false;
    if (
      filters.paymentMethod !== "any" &&
      !q.paymentTypes.includes(filters.paymentMethod)
    )
      return false;
    return true;
  });
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[#D9E0E8] bg-white p-5">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="mb-1 h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="mb-3 h-20 w-full rounded-lg" />
      <Skeleton className="mb-3 h-3 w-full" />
      <div className="flex justify-end">
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>
    </div>
  );
}

function NoSearchState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4">
      <div className="max-w-md rounded-xl border border-[#D9E0E8] bg-white p-8 text-center">
        <MapPin className="mx-auto mb-4 h-12 w-12 text-[#D9E0E8]" />
        <h1 className="text-lg font-bold text-[#172F52]">
          Start a new search
        </h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          We need a pickup and destination to find you real quotes from our
          operators.
        </p>
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          className="mt-5 bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
        >
          Back to search
        </Button>
      </div>
    </div>
  );
}

function QuotesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchFromUrl: BookingSearchParams = useMemo(() => {
    const pickupAddress = searchParams.get("pickupAddress");
    const destAddress = searchParams.get("destAddress");

    const pickup: Location | null = pickupAddress
      ? {
          formattedAddress: pickupAddress,
          latitude: parseFloat(searchParams.get("pickupLat") || "51.5"),
          longitude: parseFloat(searchParams.get("pickupLng") || "-0.1"),
          placeId: searchParams.get("pickupPlaceId") || "",
          postcode: searchParams.get("pickupPostcode") || "",
          city: searchParams.get("pickupCity") || "",
          country: "United Kingdom",
        }
      : null;

    const destination: Location | null = destAddress
      ? {
          formattedAddress: destAddress,
          latitude: parseFloat(searchParams.get("destLat") || "51.5"),
          longitude: parseFloat(searchParams.get("destLng") || "-0.1"),
          placeId: searchParams.get("destPlaceId") || "",
          postcode: searchParams.get("destPostcode") || "",
          city: searchParams.get("destCity") || "",
          country: "United Kingdom",
        }
      : null;

    const dateStr = searchParams.get("date");
    const date = dateStr ? new Date(dateStr) : undefined;

    return {
      pickup,
      destination,
      tripType: (searchParams.get("tripType") || "one_way") as TripType,
      date,
      time: searchParams.get("time") || "09:00",
      passengers: parseInt(searchParams.get("passengers") || "1", 10),
      luggage: parseInt(searchParams.get("luggage") || "0", 10),
      specialRequirements: {
        childSeat: false,
        wheelchairAccessible: false,
        meetAndGreet: false,
      },
    };
  }, [searchParams]);

  const hasSearch = !!searchFromUrl.pickup && !!searchFromUrl.destination;

  const [filters, setFilters] = useState<QuoteFilterValues>(DEFAULT_FILTERS);
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [quotes, setQuotes] = useState<RealQuote[]>([]);
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null);
  const [loading, setLoading] = useState(hasSearch);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!hasSearch || !searchFromUrl.pickup || !searchFromUrl.destination) {
      // Nothing to fetch — `loading`'s initial value already accounts for
      // this case, and this render bails out to <NoSearchState/> anyway.
      return;
    }

    let cancelled = false;

    fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pickup: searchFromUrl.pickup,
        destination: searchFromUrl.destination,
        date: format(searchFromUrl.date ?? new Date(), "yyyy-MM-dd"),
        time: searchFromUrl.time,
        passengers: searchFromUrl.passengers,
        luggage: searchFromUrl.luggage,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Could not load quotes.");
        return data as { quotes: RealQuote[]; distanceMiles: number };
      })
      .then((data) => {
        if (cancelled) return;
        setQuotes(data.quotes);
        setDistanceMiles(data.distanceMiles);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load quotes.");
        setQuotes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSearch, reloadToken, searchParams]);

  const filteredQuotes = useMemo(() => {
    const filtered = filterQuotes(quotes, filters);
    return sortQuotes(filtered, filters.sortBy);
  }, [quotes, filters]);

  const selectedQuoteData = quotes.find((q) => q.id === selectedQuote);
  const cheapestQuote = quotes[0];
  const summaryQuote = selectedQuoteData ?? cheapestQuote;

  function handleReset() {
    setFilters(DEFAULT_FILTERS);
  }

  function handleContinue() {
    if (!selectedQuoteData || !searchFromUrl.pickup || !searchFromUrl.destination) return;

    saveBookingDraft({
      pickup: searchFromUrl.pickup,
      destination: searchFromUrl.destination,
      tripType: searchFromUrl.tripType,
      date: format(searchFromUrl.date ?? new Date(), "yyyy-MM-dd"),
      time: searchFromUrl.time,
      passengers: searchFromUrl.passengers,
      luggage: searchFromUrl.luggage,
      specialRequirements: searchFromUrl.specialRequirements,
      distanceMiles: distanceMiles ?? 0,
      quote: {
        quoteId: selectedQuoteData.id,
        vehicleId: selectedQuoteData.vehicleId,
        operatorId: selectedQuoteData.operatorId,
        operatorName: selectedQuoteData.operatorName,
        vehicleType: selectedQuoteData.vehicleType,
        vehicleDescription: selectedQuoteData.vehicleDescription,
        passengerCapacity: selectedQuoteData.passengerCapacity,
        luggageCapacity: selectedQuoteData.luggageCapacity,
        rating: selectedQuoteData.rating,
        totalReviews: selectedQuoteData.totalReviews,
        isElectric: selectedQuoteData.isElectric,
        isHybrid: selectedQuoteData.isHybrid,
        paymentTypes: selectedQuoteData.paymentTypes,
        estimatedDuration: selectedQuoteData.estimatedJourneyTime,
        price: selectedQuoteData.price,
        breakdown: selectedQuoteData.breakdown,
      },
    });

    router.push("/checkout");
  }

  if (!hasSearch) {
    return <NoSearchState />;
  }

  const priceBreakdown = summaryQuote
    ? {
        baseFare: summaryQuote.breakdown.baseFare,
        distance: summaryQuote.breakdown.distanceCharge,
        fees: summaryQuote.breakdown.bookingFee + summaryQuote.breakdown.airportFee + summaryQuote.breakdown.timeCharge,
        surcharge:
          summaryQuote.breakdown.nightSurcharge +
          summaryQuote.breakdown.weekendSurcharge +
          summaryQuote.breakdown.peakSurcharge +
          summaryQuote.breakdown.congestionCharge,
        total: summaryQuote.breakdown.total,
      }
    : undefined;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#172F52]">
              Available Quotes
            </h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              {loading
                ? "Searching..."
                : `${filteredQuotes.length} ${filteredQuotes.length === 1 ? "option" : "options"} found`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          >
            <SlidersHorizontal className="mr-1.5 h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="flex gap-6">
          <aside className="hidden w-[30%] shrink-0 lg:block">
            <div className="sticky top-6 space-y-4">
              <BookingSummary
                searchParams={searchFromUrl}
                priceBreakdown={priceBreakdown}
                onEdit={() => {}}
              />
              <Button
                render={<Link href="/" />}
                nativeButton={false}
                variant="outline"
                className="w-full border-[#D4145A] text-[#D4145A] hover:bg-[#D4145A]/5"
              >
                <SearchX className="mr-1.5 h-4 w-4" />
                Update Quotes
              </Button>
            </div>
          </aside>

          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 lg:hidden">
              <div className="absolute inset-y-0 left-0 w-full max-w-sm overflow-y-auto bg-white p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#172F52]">Filters</h2>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="rounded-lg p-1 text-[#6B7280] hover:bg-[#F5F7FA]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <QuoteFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  onReset={handleReset}
                />
                <Button
                  className="mt-4 w-full bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  Show {filteredQuotes.length} results
                </Button>
              </div>
            </div>
          )}

          <main className="min-w-0 flex-1">
            <div className="mb-4 hidden lg:block">
              <QuoteFilters
                filters={filters}
                onFiltersChange={setFilters}
                onReset={handleReset}
              />
            </div>

            {error && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setLoading(true);
                    setError("");
                    setReloadToken((t) => t + 1);
                  }}
                >
                  Retry
                </Button>
              </div>
            )}

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : quotes.length === 0 ? (
              <div className="rounded-xl border border-[#D9E0E8] bg-white py-16 text-center">
                <SearchX className="mx-auto mb-4 h-12 w-12 text-[#D9E0E8]" />
                <h3 className="text-lg font-semibold text-[#172F52]">
                  No transfer options available yet
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-[#6B7280]">
                  We don&apos;t have an approved, available vehicle for this
                  route yet. Please check back soon or contact support.
                </p>
                <Button
                  render={<Link href="/help" />}
                  nativeButton={false}
                  variant="outline"
                  className="mt-4"
                >
                  Contact Support
                </Button>
              </div>
            ) : filteredQuotes.length === 0 ? (
              <div className="rounded-xl border border-[#D9E0E8] bg-white py-16 text-center">
                <SearchX className="mx-auto mb-4 h-12 w-12 text-[#D9E0E8]" />
                <h3 className="text-lg font-semibold text-[#172F52]">
                  No quotes found
                </h3>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Try adjusting your filters to see more results.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleReset}
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredQuotes.map((quote) => (
                  <QuoteCard
                    key={quote.id}
                    quote={quote}
                    onSelect={setSelectedQuote}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {selectedQuote && selectedQuoteData && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-[#D9E0E8] bg-white p-4 shadow-lg">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#172033]">
                {selectedQuoteData.operatorName} -{" "}
                {selectedQuoteData.vehicleDescription}
              </p>
              <p className="text-lg font-bold text-[#172F52]">
                £{selectedQuoteData.price.toFixed(2)}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedQuote(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleContinue}
                className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
              >
                Continue to Book
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
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
            <p className="text-sm text-[#6B7280]">Loading quotes...</p>
          </div>
        </div>
      }
    >
      <QuotesContent />
    </Suspense>
  );
}
