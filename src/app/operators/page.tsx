"use client";

import Link from "next/link";
import {
  Building2,
  BarChart3,
  Globe,
  Cpu,
  Shield,
  Headphones,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/components/layout/PublicLayout";

const BENEFITS = [
  {
    icon: Globe,
    title: "Wider Reach",
    description:
      "Access thousands of passengers searching for taxi services every day in your area.",
  },
  {
    icon: BarChart3,
    title: "Grow Your Business",
    description:
      "Increase your bookings and revenue by listing on the UK's fastest-growing taxi platform.",
  },
  {
    icon: Cpu,
    title: "Seamless Integration",
    description:
      "Our API integrates directly with your existing dispatch system. No manual work needed.",
  },
  {
    icon: Shield,
    title: "Trusted Platform",
    description:
      "Join a platform that prioritises safety and compliance for both passengers and operators.",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    description:
        "Our operator support team is available 7 days a week to help with any issues.",
  },
  {
    icon: Building2,
    title: "Free to Join",
    description:
      "No upfront costs. We operate on a simple commission model — you only pay when you earn.",
  },
];

const FEATURES = [
  "Real-time booking notifications",
  "Automated fare calculation",
  "Driver and vehicle management",
  "Customer ratings and feedback",
  "Revenue reporting dashboard",
  "Multi-depot support",
  "White-label booking widget",
  "Marketing and promotional tools",
];

export default function OperatorsPage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-[#172F52] to-[#102544] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            For Operators
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            Partner with Blue Star Airport Transfers LTD and grow your taxi business
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#172F52]">
              Why Partner With Us?
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
                Platform Features
              </h2>
              <p className="mt-4 text-gray-600">
                Everything you need to manage your fleet and accept bookings
                online.
              </p>
              <ul className="mt-8 space-y-3">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#D4145A]" />
                    <span className="text-sm text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col justify-center">
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-bold text-[#172F52]">
                    Ready to Get Started?
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Joining is free and takes less than 10 minutes. Our team will
                    review your application and have you live within 48 hours.
                  </p>
                  <Button
                    size="lg"
                    className="mt-6 bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
                    render={<Link href="/register" />}
                    nativeButton={false}
                  >
                    Register as Operator
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <p className="mt-4 text-xs text-gray-400">
                    No setup fees. No monthly charges. Pay only per booking.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
