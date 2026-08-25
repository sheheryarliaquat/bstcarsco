import type { Metadata } from "next";
import Link from "next/link";
import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Find answers to the most common questions about booking taxis with Blue Star Airport Transfers LTD. Payment, cancellations, airports, and more.",
};

const FAQ_SECTIONS = [
  {
    title: "Booking & Pricing",
    faqs: [
      {
        question: "How do I book a taxi?",
        answer:
          "Enter your pickup and destination on our search form, select your preferred date and time, compare the available options, and confirm your booking. You'll receive instant confirmation via email and SMS.",
      },
      {
        question: "How are prices calculated?",
        answer:
          "Each taxi provider sets their own pricing. We display all available options so you can compare and choose the best value. Prices are fixed at the time of booking — no hidden fees or surge pricing.",
      },
      {
        question: "Can I get an estimate before booking?",
        answer:
          "Yes, our search results show estimated fares from each provider. The final price is confirmed at the time of booking and won't change unless you modify your journey details.",
      },
      {
        question: "Are there any hidden fees?",
        answer:
          "No. The price you see is the price you pay. Any extras like child seats or meet and greet are clearly listed before you confirm your booking.",
      },
    ],
  },
  {
    title: "Payments",
    faqs: [
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept all major debit and credit cards, Apple Pay, Google Pay, and PayPal. Some providers also accept cash payments.",
      },
      {
        question: "Do I pay the driver or pay online?",
        answer:
          "That depends on the provider. Some require online payment at the time of booking, while others allow you to pay the driver directly. This will be clearly shown before you confirm.",
      },
      {
        question: "When am I charged?",
        answer:
          "For online payments, your card is charged when you confirm the booking. For pay-by-driver options, payment is collected at the end of your journey.",
      },
    ],
  },
  {
    title: "Cancellations & Changes",
    faqs: [
      {
        question: "Can I cancel my booking?",
        answer:
          "Yes, you can cancel most bookings free of charge up to 24 hours before your scheduled pickup. Cancellations within 24 hours may incur a fee depending on the provider.",
      },
      {
        question: "Can I change my booking after confirming?",
        answer:
          "You can modify your pickup time or passenger details through your account. For route changes, please cancel and rebook, or contact the driver directly.",
      },
      {
        question: "What if I need a refund?",
        answer:
          "If you've been charged for a cancelled trip or experienced a service issue, contact our support team. We process refunds within 3-5 working days.",
      },
    ],
  },
  {
    title: "Airport Transfers",
    faqs: [
      {
        question: "Can I book an airport transfer?",
        answer:
          "Yes! We offer transfers to and from all major UK airports including Heathrow, Gatwick, Stansted, Luton, Manchester, Birmingham, Edinburgh, and more.",
      },
      {
        question: "What if my flight is delayed?",
        answer:
          "We monitor all flights in real-time. If your flight is delayed, your driver's pickup time is automatically adjusted. You don't need to do anything.",
      },
      {
        question: "What is meet and greet?",
        answer:
          "Meet and greet means your driver will wait in the airport terminal holding a name board, help with your luggage, and walk you to the vehicle. This service is available at most UK airports.",
      },
      {
        question: "How long will I wait for my driver?",
        answer:
          "For airport pickups, your driver will be waiting at the terminal before you land. For standard pickups, drivers typically arrive within 5-10 minutes of the booked time.",
      },
    ],
  },
  {
    title: "Safety & Support",
    faqs: [
      {
        question: "Are all drivers licensed?",
        answer:
          "Yes, every driver on our platform is fully licensed by their local council, insured, and has passed thorough background checks including DBS screening.",
      },
      {
        question: "What if my driver is late or doesn't show up?",
        answer:
          "Contact our 24/7 support team immediately. We'll track down your driver or arrange an alternative. If your driver doesn't show, we'll refund any prepayment in full.",
      },
      {
        question: "How do I report an issue?",
        answer:
          "You can report issues through your account dashboard, by emailing support@bstcars.co, or by calling our support line. We aim to resolve all issues within 24 hours.",
      },
      {
        question: "Is my personal data safe?",
        answer:
          "Absolutely. We use bank-level encryption to protect your data. We never share your personal information with third parties without your consent. See our Privacy Policy for details.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-[#172F52] to-[#102544] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            Find answers to common questions about Blue Star Airport Transfers LTD
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {FAQ_SECTIONS.map((section) => (
            <div key={section.title} className="mb-12 last:mb-0">
              <h2 className="mb-6 text-2xl font-bold text-[#172F52]">
                {section.title}
              </h2>
              <Accordion>
                {section.faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`${section.title}-${i}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#F5F7FA] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-[#172F52]">
            Still Have Questions?
          </h2>
          <p className="mt-4 text-gray-600">
            Our support team is here to help. Get in touch and we&apos;ll respond
            within 24 hours.
          </p>
          <Button
            size="lg"
            className="mt-8 bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
            render={<Link href="/contact" />}
            nativeButton={false}
          >
            Contact Support
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
