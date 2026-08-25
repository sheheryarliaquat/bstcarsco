"use client";

import Link from "next/link";
import {
  Car,
  PoundSterling,
  Clock,
  Shield,
  Smartphone,
  Users,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/components/layout/PublicLayout";

const BENEFITS = [
  {
    icon: PoundSterling,
    title: "Competitive Earnings",
    description: "Keep more of what you earn with our low commission rates.",
  },
  {
    icon: Clock,
    title: "Flexible Hours",
    description: "Work when you want. No minimum hours or shift commitments.",
  },
  {
    icon: Smartphone,
    title: "Easy-to-Use App",
    description: "Intuitive driver app with built-in navigation and fare tracking.",
  },
  {
    icon: Shield,
    title: "Insurance Included",
    description: "Comprehensive hire and reward insurance while on trips.",
  },
  {
    icon: Users,
    title: "Supportive Community",
    description: "Join a network of thousands of professional drivers across the UK.",
  },
  {
    icon: Car,
    title: "All Vehicle Types",
    description: "Saloon, estate, MPV, and wheelchair-accessible vehicles welcome.",
  },
];

const REQUIREMENTS = [
  "Valid UK driving licence (full, not provisional)",
  "Private Hire or Hackney carriage licence from your local council",
  "Right to work in the United Kingdom",
  "DBS (Disclosure and Barring Service) check",
  "Valid motor insurance with hire and reward cover",
  "Android or iOS smartphone",
  "Vehicle must meet our age and condition standards",
];

const EARNINGS = [
  { label: "Average per trip", value: "£12 – £35" },
  { label: "Peak hour bonus", value: "Up to 25%" },
  { label: "Weekly average", value: "£400 – £800" },
  { label: "Airport premium", value: "£5 – £15 extra" },
];

export default function DriversPage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-[#172F52] to-[#102544] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Drive With Us
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            Join thousands of professional drivers earning on their own terms
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#172F52]">
              Why Drive With Blue Star Airport Transfers LTD?
            </h2>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <Card key={b.title}>
                <CardContent className="flex flex-col gap-3 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FCE7EF]">
                    <b.icon className="h-6 w-6 text-[#D4145A]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#172F52]">
                    {b.title}
                  </h3>
                  <p className="text-sm text-gray-600">{b.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-[#172F52]">
                Potential Earnings
              </h2>
              <p className="mt-4 text-gray-600">
                Earnings vary by location, hours worked, and trip types. Here&apos;s
                what our drivers typically earn.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {EARNINGS.map((e) => (
                  <div
                    key={e.label}
                    className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                  >
                    <p className="text-sm text-gray-500">{e.label}</p>
                    <p className="mt-1 text-xl font-bold text-[#D4145A]">
                      {e.value}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-gray-400">
                *Earnings figures are estimates based on driver averages and may
                vary.
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-[#172F52]">
                Requirements
              </h2>
              <p className="mt-4 text-gray-600">
                To join our platform, you&apos;ll need the following:
              </p>
              <ul className="mt-6 space-y-3">
                {REQUIREMENTS.map((r) => (
                  <li key={r} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#D4145A]" />
                    <span className="text-sm text-gray-700">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#172F52] to-[#102544] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Start Earning?
          </h2>
          <p className="mt-4 text-gray-300">
            Apply today and start receiving trip requests within 48 hours.
          </p>
          <Button
            size="lg"
            className="mt-8 bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
            render={<Link href="/register" />}
            nativeButton={false}
          >
            Apply Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
