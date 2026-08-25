"use client";

import Link from "next/link";
import { Plane, Clock, MapPin, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { BookingSearch } from "@/components/booking/BookingSearch";

const AIRPORTS = [
  { code: "LHR", name: "Heathrow Airport", city: "London", terminals: 5, distance: "15 mi from Central London" },
  { code: "LGW", name: "Gatwick Airport", city: "London", terminals: 2, distance: "28 mi from Central London" },
  { code: "STN", name: "Stansted Airport", city: "London", terminals: 1, distance: "35 mi from Central London" },
  { code: "LTN", name: "Luton Airport", city: "London", terminals: 1, distance: "32 mi from Central London" },
  { code: "MAN", name: "Manchester Airport", city: "Manchester", terminals: 3, distance: "10 mi from City Centre" },
  { code: "BHX", name: "Birmingham Airport", city: "Birmingham", terminals: 1, distance: "8 mi from City Centre" },
  { code: "EDI", name: "Edinburgh Airport", city: "Edinburgh", terminals: 1, distance: "8 mi from City Centre" },
  { code: "GLA", name: "Glasgow Airport", city: "Glasgow", terminals: 1, distance: "7 mi from City Centre" },
  { code: "BRS", name: "Bristol Airport", city: "Bristol", terminals: 1, distance: "8 mi from City Centre" },
  { code: "LPL", name: "Liverpool John Lennon Airport", city: "Liverpool", terminals: 1, distance: "7 mi from City Centre" },
  { code: "NCL", name: "Newcastle Airport", city: "Newcastle", terminals: 1, distance: "6 mi from City Centre" },
  { code: "EMA", name: "East Midlands Airport", city: "Nottingham", terminals: 1, distance: "15 mi from Nottingham" },
];

const FEATURES = [
  { icon: Clock, title: "Flight Tracking", description: "We monitor your flight and adjust pickup times for delays." },
  { icon: Shield, title: "Meet & Greet", description: "Driver will meet you in the terminal with a name board." },
  { icon: MapPin, title: "Fixed Prices", description: "No surge pricing or hidden fees. Your fare is locked in." },
  { icon: Plane, title: "All Airlines", description: "Covering every airline and terminal across all UK airports." },
];

export default function AirportTransfersPage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-[#172F52] to-[#102544] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Airport Transfers
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            Reliable, fixed-price transfers to and from all major UK airports
          </p>
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <BookingSearch />
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#172F52]">Airport Transfer Features</h2>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FCE7EF]">
                  <f.icon className="h-7 w-7 text-[#D4145A]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#172F52]">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#172F52]">UK Airports We Cover</h2>
            <p className="mt-2 text-gray-600">Click an airport to see routes and pricing</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AIRPORTS.map((airport) => (
              <Link key={airport.code} href="/book">
                <Card className="transition-shadow hover:shadow-lg">
                  <CardContent className="flex items-start gap-4 p-6">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#172F52] text-white">
                      <span className="text-sm font-bold">{airport.code}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#172F52]">{airport.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">{airport.city}</p>
                      <p className="mt-1 text-xs text-gray-400">{airport.distance}</p>
                    </div>
                    <ArrowRight className="mt-1 h-5 w-5 text-[#D4145A]" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#172F52] to-[#102544] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white">Book Your Airport Transfer</h2>
          <p className="mt-4 text-gray-300">
            Fixed prices, flight tracking, and professional drivers for every UK airport.
          </p>
          <Button
            size="lg"
            className="mt-8 bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
            render={<Link href="/book" />}
            nativeButton={false}
          >
            Get Quotes
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
