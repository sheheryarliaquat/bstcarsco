import type { Metadata } from "next";
import {
  Target,
  Heart,
  Users,
  Award,
  Calendar,
  Building2,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Blue Star Airport Transfers LTD — our mission to make taxi travel easier, fairer, and more transparent across the United Kingdom.",
};

const VALUES = [
  {
    icon: Target,
    title: "Our Mission",
    description:
      "To make booking a taxi across the UK as simple, transparent, and affordable as possible for every passenger.",
  },
  {
    icon: Heart,
    title: "Our Values",
    description:
      "Honesty, reliability, and customer care sit at the heart of everything we do. Every journey matters to us.",
  },
  {
    icon: Users,
    title: "Our Community",
    description:
      "We support local taxi drivers and operators, helping them reach more passengers and grow their businesses.",
  },
];

const TEAM = [
  { name: "David Hargreaves", role: "Founder & CEO" },
  { name: "Emma Collins", role: "Head of Operations" },
  { name: "Raj Patel", role: "Chief Technology Officer" },
  { name: "Sophie Turner", role: "Customer Experience Lead" },
];

const STATS = [
  { icon: Calendar, value: "8+", label: "Years in Business" },
  { icon: Users, value: "2M+", label: "Bookings Completed" },
  { icon: Building2, value: "5,000+", label: "Licensed Drivers" },
  { icon: MapPin, value: "200+", label: "UK Cities Covered" },
];

export default function AboutPage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-[#172F52] to-[#102544] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            About Blue Star Airport Transfers LTD
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            Making UK taxi travel simpler, fairer, and more accessible since
            2018.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-[#172F52]">Our Story</h2>
          <div className="mt-6 space-y-4 text-gray-600">
            <p>
              Blue Star Airport Transfers LTD was born out of a simple frustration: booking a taxi
              in the UK was too complicated. Passengers had no easy way to
              compare prices, and drivers struggled to reach new customers.
            </p>
            <p>
              We built a platform that connects passengers with trusted, licensed
              taxi operators across the United Kingdom. By letting providers
              compete on price and quality, we ensure you always get the best
              deal — without compromising on safety or reliability.
            </p>
            <p>
              Today, we serve over 200 cities and towns across the UK, with
              thousands of drivers and operators on our platform. Whether you need
              a quick trip across town or a long-distance airport transfer, UK
              Taxi Book is here to help.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#172F52]">
              Mission & Values
            </h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {VALUES.map((v) => (
              <Card key={v.title}>
                <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FCE7EF]">
                    <v.icon className="h-7 w-7 text-[#D4145A]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#172F52]">
                    {v.title}
                  </h3>
                  <p className="text-sm text-gray-600">{v.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#172F52]">
              Meet the Team
            </h2>
            <p className="mt-2 text-gray-600">
              The people behind Blue Star Airport Transfers LTD
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((member) => (
              <div key={member.name} className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#172F52] text-2xl font-bold text-white">
                  {member.name
                    .split(" ")
                    .map((n) => n.charAt(0))
                    .join("")}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#172F52]">
                  {member.name}
                </h3>
                <p className="text-sm text-[#D4145A]">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#172F52]">By the Numbers</h2>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#D4145A] text-white">
                  <stat.icon className="h-7 w-7" />
                </div>
                <p className="mt-4 text-3xl font-bold text-[#172F52]">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
