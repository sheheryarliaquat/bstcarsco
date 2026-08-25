import type { Metadata } from "next";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the terms and conditions for using the Blue Star Airport Transfers LTD platform. Your rights, responsibilities, and our policies.",
};

export default function TermsPage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-[#172F52] to-[#102544] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            Last updated: 25 August 2026
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl prose prose-slate">
          <h2 className="text-2xl font-bold text-[#172F52]">1. Introduction</h2>
          <p className="text-gray-600">
            Welcome to Blue Star Airport Transfers LTD (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;). These Terms of
            Service (&quot;Terms&quot;) govern your use of our website, mobile
            applications, and services (collectively, the &quot;Platform&quot;). By
            accessing or using the Platform, you agree to be bound by these Terms.
          </p>
          <p className="text-gray-600">
            Blue Star Airport Transfers LTD is a trading name of Blue Star Airport Transfers LTD Ltd, registered in
            England and Wales (Company No. 12345678). Our registered office is at
            10 Downing Street, London, SW1A 2AA.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">2. Definitions</h2>
          <p className="text-gray-600">
            &quot;User&quot;, &quot;you&quot;, &quot;your&quot; — any person who accesses or uses the
            Platform. &quot;Provider&quot; — a licensed taxi operator or driver registered
            on the Platform. &quot;Booking&quot; — a request for taxi services made
            through the Platform. &quot;Passenger&quot; — a user who books a taxi through
            the Platform.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">3. Eligibility</h2>
          <p className="text-gray-600">
            You must be at least 18 years of age to use the Platform. By using the
            Platform, you represent that you meet this requirement and have the
            legal capacity to enter into a binding agreement.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">4. Booking &amp; Payment</h2>
          <p className="text-gray-600">
            When you make a booking through the Platform, you enter into a
            contract directly with the taxi provider. Blue Star Airport Transfers LTD acts as an
            intermediary to facilitate the booking. Prices displayed are set by
            individual providers and include all applicable taxes unless stated
            otherwise.
          </p>
          <p className="text-gray-600">
            Payment is collected either online at the time of booking or directly
            from the driver at the end of the journey, depending on the provider&apos;s
            preferences. Online payments are processed securely through our
            payment partners.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">5. Cancellation Policy</h2>
          <p className="text-gray-600">
            You may cancel a booking free of charge up to 24 hours before your
            scheduled pickup time. Cancellations made within 24 hours of the
            pickup time may incur a cancellation fee of up to 50% of the booking
            value, as determined by the provider.
          </p>
          <p className="text-gray-600">
            No-shows without prior cancellation will be charged the full booking
            amount. If a provider cancels your booking, you will receive a full
            refund of any prepaid amount.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">6. User Conduct</h2>
          <p className="text-gray-600">
            You agree to use the Platform in a respectful and lawful manner. You
            must not harass drivers, provide false information, attempt to defraud
            the system, or engage in any activity that could harm other users or
            the Platform. We reserve the right to suspend or terminate accounts
            that violate these Terms.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">7. Limitation of Liability</h2>
          <p className="text-gray-600">
            Blue Star Airport Transfers LTD acts as an intermediary between passengers and providers.
            We are not a party to the contract between you and your driver. While
            we vet all providers, we cannot guarantee the quality of every
            journey. Our liability is limited to the fees paid for the specific
            booking in question.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">8. Intellectual Property</h2>
          <p className="text-gray-600">
            All content on the Platform, including text, graphics, logos, and
            software, is the property of Blue Star Airport Transfers LTD Ltd and is protected by UK
            copyright law. You may not reproduce, distribute, or create
            derivative works without our express written permission.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">9. Changes to Terms</h2>
          <p className="text-gray-600">
            We reserve the right to modify these Terms at any time. Changes will
            be posted on this page with an updated &quot;Last updated&quot; date. Your
            continued use of the Platform after changes are posted constitutes
            acceptance of the updated Terms.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">10. Governing Law</h2>
          <p className="text-gray-600">
            These Terms are governed by and construed in accordance with the laws
            of England and Wales. Any disputes arising from these Terms shall be
            subject to the exclusive jurisdiction of the courts of England and
            Wales.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">11. Contact</h2>
          <p className="text-gray-600">
            If you have any questions about these Terms, please contact us at
            legal@bstcars.co or write to us at Blue Star Airport Transfers LTD Ltd, 10
            Downing Street, London, SW1A 2AA.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
