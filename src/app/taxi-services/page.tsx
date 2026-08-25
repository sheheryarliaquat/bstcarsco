import type { Metadata } from "next";
import Link from "next/link";
import {
  Plane,
  Briefcase,
  Users,
  Crown,
  Accessibility,
  Route,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const metadata: Metadata = {
  title: "Taxi Services",
  description:
    "Explore our full range of UK taxi services — airport transfers, corporate travel, minibus hire, executive travel, wheelchair accessible vehicles, and long-distance journeys.",
};

const SERVICES = [
  {
    icon: Plane,
    title: "Airport Transfers",
    description:
      "Reliable transfers to and from all major UK airports. Flight tracking, meet and greet, and fixed-price fares available.",
    href: "/airport-transfers",
  },
  {
    icon: Briefcase,
    title: "Corporate Travel",
    description:
      "Professional business travel solutions with invoicing, priority booking, and dedicated account management.",
    href: "/corporate",
  },
  {
    icon: Users,
    title: "Minibus Hire",
    description:
      "Group travel made easy. 6, 8, and 16-seater minibuses available for events, nights out, and group transfers.",
    href: "/book",
  },
  {
    icon: Crown,
    title: "Executive Travel",
    description:
      "Travel in style with our premium executive vehicles. Perfect for VIP clients, special occasions, and business travel.",
    href: "/book",
  },
  {
    icon: Accessibility,
    title: "Wheelchair Accessible",
    description:
      "Fully wheelchair-accessible vehicles with trained drivers. Dignified, comfortable transport for all passengers.",
    href: "/book",
  },
  {
    icon: Route,
    title: "Long Distance",
    description:
      "Inter-city and long-distance travel across the UK. Comfortable vehicles with fixed, transparent pricing.",
    href: "/book",
  },
];

export default function TaxiServicesPage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-[#172F52] to-[#102544] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Our Taxi Services
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            Comprehensive transport solutions for every occasion across the UK
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <Card key={service.title} className="group transition-shadow hover:shadow-lg">
                <CardContent className="flex flex-col gap-4 p-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FCE7EF]">
                    <service.icon className="h-7 w-7 text-[#D4145A]" />
                  </div>
                  <h2 className="text-xl font-bold text-[#172F52]">
                    {service.title}
                  </h2>
                  <p className="flex-1 text-sm text-gray-600">
                    {service.description}
                  </p>
                  <Button
                    variant="outline"
                    className="self-start border-[#D4145A] text-[#D4145A] hover:bg-[#D4145A] hover:text-white"
                    render={<Link href={service.href} />}
                    nativeButton={false}
                  >
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-[#172F52]">
            Need Something Specific?
          </h2>
          <p className="mt-4 text-gray-600">
            Can&apos;t find what you&apos;re looking for? Get in touch and we&apos;ll help
            arrange the perfect transport solution.
          </p>
          <Button
            size="lg"
            className="mt-8 bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
            render={<Link href="/contact" />}
            nativeButton={false}
          >
            Contact Us
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
