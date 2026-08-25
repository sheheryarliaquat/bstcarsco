"use client";

import Link from "next/link";
import {
  Briefcase,
  FileText,
  BarChart3,
  Clock,
  Shield,
  CreditCard,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PublicLayout } from "@/components/layout/PublicLayout";

const FEATURES = [
  { icon: FileText, title: "Centralised Invoicing", description: "Monthly consolidated invoices for easy expense management." },
  { icon: BarChart3, title: "Spend Analytics", description: "Track and report on all business travel spending." },
  { icon: Clock, title: "Priority Booking", description: "Your bookings are fast-tracked to the best available drivers." },
  { icon: Shield, title: "Vetted Drivers", description: "All drivers are DBS checked, licensed, and insured." },
  { icon: CreditCard, title: "Flexible Payment", description: "Pay on account, by card, or via corporate billing." },
  { icon: Briefcase, title: "Account Manager", description: "Dedicated account manager for your business needs." },
];

const BENEFITS = [
  "Save up to 30% on business travel costs",
  "No surge pricing — fixed corporate rates",
  "24/7 booking availability",
  "Real-time trip tracking and receipts",
  "Multi-user accounts for your team",
  "Integration with expense systems",
  "Monthly or weekly billing cycles",
  "Dedicated priority support line",
];

export default function CorporatePage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-[#172F52] to-[#102544] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Corporate Travel
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            Professional taxi solutions for businesses of all sizes
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#172F52]">
              Why Choose Corporate Account?
            </h2>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title}>
                <CardContent className="flex flex-col gap-3 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FCE7EF]">
                    <f.icon className="h-6 w-6 text-[#D4145A]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#172F52]">{f.title}</h3>
                  <p className="text-sm text-gray-600">{f.description}</p>
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
                Benefits of a Corporate Account
              </h2>
              <p className="mt-4 text-gray-600">
                Streamline your business travel with a dedicated corporate account.
                Enjoy fixed rates, centralised billing, and full visibility over your
                company&apos;s taxi spend.
              </p>
              <ul className="mt-8 space-y-3">
                {BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#D4145A]" />
                    <span className="text-sm text-gray-700">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Card>
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-[#172F52]">Request a Corporate Account</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Fill in the form below and our team will be in touch within 24 hours.
                  </p>
                  <form className="mt-6 flex flex-col gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input placeholder="First name" />
                      <Input placeholder="Last name" />
                    </div>
                    <Input placeholder="Work email" type="email" />
                    <Input placeholder="Company name" />
                    <Input placeholder="Phone number" type="tel" />
                    <Textarea placeholder="Tell us about your company's travel needs..." className="min-h-24" />
                    <Button
                      type="submit"
                      className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
                    >
                      Submit Request
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
