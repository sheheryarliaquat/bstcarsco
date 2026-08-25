import type { Metadata } from "next";
import Link from "next/link";
import {
  Search,
  GitCompareArrows,
  CreditCard,
  Car,
  Star,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Learn how to book a taxi with Blue Star Airport Transfers LTD in five simple steps. Search, compare, book, travel, and review.",
};

const STEPS = [
  {
    icon: Search,
    number: 1,
    title: "Search",
    description:
      "Enter your pickup location and destination. Choose your travel date, time, and the number of passengers. You can also add special requirements like child seats or wheelchair accessibility.",
  },
  {
    icon: GitCompareArrows,
    number: 2,
    title: "Compare",
    description:
      "Instantly view prices from multiple licensed taxi providers in your area. Compare vehicle types, estimated arrival times, and customer ratings — all in one place.",
  },
  {
    icon: CreditCard,
    number: 3,
    title: "Book",
    description:
      "Select your preferred provider and confirm your booking. Pay securely online or choose to pay the driver directly. You'll receive instant confirmation by email and SMS.",
  },
  {
    icon: Car,
    number: 4,
    title: "Travel",
    description:
      "Track your driver in real-time as they make their way to you. Enjoy a comfortable, safe journey to your destination with a professional, licensed driver.",
  },
  {
    icon: Star,
    number: 5,
    title: "Review",
    description:
      "After your journey, leave a rating and review. Your feedback helps us maintain high standards and helps other passengers make informed decisions.",
  },
];

const FAQS = [
  {
    question: "How do I book a taxi?",
    answer:
      "Simply enter your pickup and destination on our search form, select your preferred date and time, compare the available options, and confirm your booking. You'll receive instant confirmation via email and SMS.",
  },
  {
    question: "Can I book an airport transfer?",
    answer:
      "Yes! We offer transfers to and from all major UK airports including Heathrow, Gatwick, Stansted, Luton, Manchester, Birmingham, and more. You can enter your flight number for tracking.",
  },
  {
    question: "How are prices calculated?",
    answer:
      "Each taxi provider sets their own pricing. We display all available options so you can compare and choose the best value. Prices are fixed at the time of booking — no hidden fees.",
  },
  {
    question: "Can I cancel my booking?",
    answer:
      "Yes, you can cancel most bookings free of charge up to 24 hours before your scheduled pickup. Cancellation policies may vary by provider.",
  },
  {
    question: "Do I pay the driver or pay online?",
    answer:
      "That depends on the provider. Some require online payment at the time of booking, while others allow you to pay the driver directly. This will be clearly shown before you confirm.",
  },
  {
    question: "Are all drivers licensed?",
    answer:
      "Yes, every driver on our platform is fully licensed by their local council, insured, and has passed background checks. Your safety is our top priority.",
  },
  {
    question: "What if my driver is late?",
    answer:
      "You can track your driver in real-time through the app. If there's an issue, contact our 24/7 support team and we'll arrange an alternative driver if needed.",
  },
  {
    question: "Can I request a child seat or wheelchair-accessible vehicle?",
    answer:
      "Absolutely. You can specify special requirements when searching, and we'll only show you providers that can accommodate your needs.",
  },
];

export default function HowItWorksPage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-[#172F52] to-[#102544] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            How It Works
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            Book your taxi in five simple steps
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="space-y-12">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="flex flex-col items-start gap-6 sm:flex-row"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#D4145A] text-white">
                  <step.icon className="h-8 w-8" />
                </div>
                <div>
                  <span className="text-sm font-semibold uppercase tracking-wider text-[#D4145A]">
                    Step {step.number}
                  </span>
                  <h2 className="mt-1 text-2xl font-bold text-[#172F52]">
                    {step.title}
                  </h2>
                  <p className="mt-2 text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#172F52]">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-gray-600">
              Got a question? We&apos;ve got answers.
            </p>
          </div>
          <div className="mt-12">
            <Accordion>
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#172F52] to-[#102544] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-gray-300">
            Search, compare, and book your next taxi journey today.
          </p>
          <Button
            size="lg"
            className="mt-8 bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
            render={<Link href="/book" />}
            nativeButton={false}
          >
            <Car className="mr-2 h-5 w-5" />
            Book a Taxi
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
