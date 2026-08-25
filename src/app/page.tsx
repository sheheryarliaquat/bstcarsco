"use client";

import Link from "next/link";
import {
  Search,
  GitCompareArrows,
  CreditCard,
  Car,
  Star,
  Shield,
  Clock,
  MapPin,
  Plane,
  Users,
  BadgeCheck,
  Headphones,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { BookingSearch } from "@/components/booking/BookingSearch";

const HOW_IT_WORKS_STEPS = [
  {
    icon: Search,
    title: "Search",
    description:
      "Enter your pickup and destination. Select your travel date, time, and number of passengers.",
  },
  {
    icon: GitCompareArrows,
    title: "Compare",
    description:
      "Instantly compare prices from multiple trusted taxi providers in your area.",
  },
  {
    icon: CreditCard,
    title: "Book",
    description:
      "Choose your preferred provider and confirm your booking online with secure payment.",
  },
  {
    icon: Car,
    title: "Travel",
    description:
      "Sit back and enjoy your journey with a professional, licensed driver.",
  },
];

const AIRPORTS = [
  { code: "LHR", name: "Heathrow", city: "London" },
  { code: "LGW", name: "Gatwick", city: "London" },
  { code: "STN", name: "Stansted", city: "London" },
  { code: "LTN", name: "Luton", city: "London" },
  { code: "MAN", name: "Manchester", city: "Manchester" },
];

const FEATURES = [
  {
    icon: GitCompareArrows,
    title: "Compare Prices",
    description: "See fares from multiple providers side by side and choose the best deal.",
  },
  {
    icon: BadgeCheck,
    title: "Trusted Drivers",
    description: "All drivers are fully licensed, insured, and vetted for your safety.",
  },
  {
    icon: Clock,
    title: "24/7 Available",
    description: "Book a taxi anytime, day or night. We never stop working for you.",
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    description: "Your data is encrypted and payments are processed securely.",
  },
];

const UK_REGIONS = [
  "London",
  "South East",
  "South West",
  "Midlands",
  "North West",
  "North East",
  "Yorkshire",
  "East of England",
  "Scotland",
  "Wales",
  "Northern Ireland",
  "East Midlands",
];

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    location: "London",
    rating: 5,
    text: "Brilliant service! Saved me over £30 compared to booking directly. The driver was punctual and very professional.",
  },
  {
    name: "James T.",
    location: "Manchester",
    rating: 5,
    text: "I use Blue Star Airport Transfers LTD for all my airport transfers now. Easy to compare prices and the booking process is seamless.",
  },
  {
    name: "Priya K.",
    location: "Birmingham",
    rating: 5,
    text: "Fantastic experience from start to finish. The meet and greet at the airport was a lovely touch. Highly recommend!",
  },
];

export default function HomePage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#172F52] to-[#102544] px-4 pb-24 pt-16 sm:px-6 sm:pb-32 sm:pt-24 lg:px-8">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Book Your Taxi Online
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300 sm:text-xl">
            Compare trusted UK taxi providers and book your journey at the best
            available price.
          </p>
          <div className="mx-auto mt-8 max-w-3xl">
            <BookingSearch />
          </div>
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#172F52]">How It Works</h2>
            <p className="mt-2 text-gray-600">
              Book your taxi in four simple steps
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <div key={step.title} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D4145A] text-white">
                  <step.icon className="h-8 w-8" />
                </div>
                <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#172F52] text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#172F52]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#172F52]">
              Popular Airport Transfers
            </h2>
            <p className="mt-2 text-gray-600">
              Reliable transfers to and from all major UK airports
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {AIRPORTS.map((airport) => (
              <Link key={airport.code} href="/airport-transfers">
                <Card className="transition-shadow hover:shadow-lg">
                  <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                    <Plane className="h-10 w-10 text-[#D4145A]" />
                    <span className="text-2xl font-bold text-[#172F52]">
                      {airport.code}
                    </span>
                    <span className="text-sm font-medium text-[#172F52]">
                      {airport.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {airport.city}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#172F52]">
              Why Choose Us
            </h2>
            <p className="mt-2 text-gray-600">
              Thousands of passengers trust us every day
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FCE7EF]">
                  <feature.icon className="h-7 w-7 text-[#D4145A]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#172F52]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#172F52]">
              Areas We Cover
            </h2>
            <p className="mt-2 text-gray-600">
              Taxi services across the entire United Kingdom
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {UK_REGIONS.map((region) => (
              <Link
                key={region}
                href="/areas-we-cover"
                className="group flex items-center gap-3 rounded-xl border border-[#D9E0E8] bg-white p-4 transition-colors hover:border-[#D4145A] hover:bg-[#FCE7EF]"
              >
                <MapPin className="h-5 w-5 text-[#D4145A]" />
                <span className="text-sm font-medium text-[#172F52] group-hover:text-[#D4145A]">
                  {region}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#172F52]">
              What Our Passengers Say
            </h2>
            <p className="mt-2 text-gray-600">
              Trusted by thousands of passengers across the UK
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5"
              >
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-[#D4145A] text-[#D4145A]"
                    />
                  ))}
                </div>
                <p className="mt-4 text-sm text-gray-600">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#172F52] text-sm font-bold text-white">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#172F52]">
                      {t.name}
                    </p>
                    <p className="text-xs text-gray-500">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#172F52] to-[#102544] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Book Your Journey?
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Compare prices from trusted UK taxi providers and save on your next
            trip.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
              render={<Link href="/book" />}
              nativeButton={false}
            >
              <Car className="mr-2 h-5 w-5" />
              Book a Taxi
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              render={<Link href="/contact" />}
              nativeButton={false}
            >
              <Headphones className="mr-2 h-5 w-5" />
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
