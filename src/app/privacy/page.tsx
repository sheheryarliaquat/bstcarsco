import type { Metadata } from "next";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Blue Star Airport Transfers LTD collects, uses, and protects your personal data. Your privacy is important to us.",
};

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-[#172F52] to-[#102544] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Privacy Policy
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
            Blue Star Airport Transfers LTD Ltd (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting
            your privacy. This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you use our Platform. We
            comply with the UK General Data Protection Regulation (UK GDPR) and
            the Data Protection Act 2018.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">2. Information We Collect</h2>
          <p className="text-gray-600">
            We may collect the following types of information:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-600">
            <li>
              <strong>Personal Identification Information:</strong> Name, email
              address, phone number, and postal address.
            </li>
            <li>
              <strong>Payment Information:</strong> Credit/debit card details,
              billing address (processed securely via our payment partners).
            </li>
            <li>
              <strong>Location Data:</strong> Pickup and destination addresses,
              GPS data during journeys (for tracking and safety purposes).
            </li>
            <li>
              <strong>Device Information:</strong> IP address, browser type,
              operating system, and device identifiers.
            </li>
            <li>
              <strong>Usage Data:</strong> Pages visited, features used, search
              queries, and interaction patterns.
            </li>
            <li>
              <strong>Communication Data:</strong> Messages sent through the
              Platform, customer support enquiries, and reviews.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-[#172F52]">3. How We Use Your Information</h2>
          <p className="text-gray-600">We use your information to:</p>
          <ul className="list-disc space-y-2 pl-6 text-gray-600">
            <li>Process and manage your taxi bookings</li>
            <li>Communicate booking confirmations, updates, and receipts</li>
            <li>Process payments and handle refunds</li>
            <li>Provide customer support</li>
            <li>Improve our services and develop new features</li>
            <li>Send promotional communications (with your consent)</li>
            <li>Ensure safety and fraud prevention</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#172F52]">4. Legal Basis for Processing</h2>
          <p className="text-gray-600">
            Under the UK GDPR, we process your data on the following legal bases:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-600">
            <li>
              <strong>Contract:</strong> Processing necessary to fulfil our
              contract with you (providing taxi booking services).
            </li>
            <li>
              <strong>Legitimate Interests:</strong> Processing necessary for our
              legitimate business interests, such as improving services and
              preventing fraud.
            </li>
            <li>
              <strong>Consent:</strong> Processing based on your explicit consent,
              such as receiving marketing communications.
            </li>
            <li>
              <strong>Legal Obligation:</strong> Processing required to comply
              with applicable laws.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-[#172F52]">5. Data Sharing</h2>
          <p className="text-gray-600">
            We may share your information with:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-600">
            <li>
              <strong>Taxi Providers:</strong> To fulfil your booking, we share
              your name, phone number, pickup location, and destination with your
              assigned driver/operator.
            </li>
            <li>
              <strong>Payment Processors:</strong> To securely process
              transactions.
            </li>
            <li>
              <strong>Analytics Providers:</strong> Aggregated, anonymised data to
              help us improve the Platform.
            </li>
            <li>
              <strong>Law Enforcement:</strong> When required by law or to
              protect the safety of our users.
            </li>
          </ul>
          <p className="text-gray-600">
            We do not sell your personal data to third parties.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">6. Data Security</h2>
          <p className="text-gray-600">
            We implement industry-standard security measures including SSL
            encryption, secure server infrastructure, access controls, and
            regular security audits. However, no method of transmission over the
            internet is 100% secure, and we cannot guarantee absolute security.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">7. Data Retention</h2>
          <p className="text-gray-600">
            We retain your personal data for as long as your account is active or
            as needed to provide our services. Booking data is retained for 6
            years for tax and legal compliance. You may request deletion of your
            account and associated data at any time.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">8. Your Rights</h2>
          <p className="text-gray-600">
            Under UK GDPR, you have the right to:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-600">
            <li>Access your personal data</li>
            <li>Rectify inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Restrict processing of your data</li>
            <li>Data portability</li>
            <li>Object to processing</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p className="text-gray-600">
            To exercise any of these rights, contact us at
            privacy@bstcars.co. We will respond within 30 days.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">9. Cookies</h2>
          <p className="text-gray-600">
            We use cookies to improve your experience on the Platform. For
            detailed information about the cookies we use, please see our Cookie
            Policy.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">10. Changes to This Policy</h2>
          <p className="text-gray-600">
            We may update this Privacy Policy from time to time. We will notify
            you of significant changes by posting the new policy on this page and
            updating the &quot;Last updated&quot; date.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">11. Contact Us</h2>
          <p className="text-gray-600">
            For questions about this Privacy Policy or our data practices, contact
            our Data Protection Officer at:
          </p>
          <p className="text-gray-600">
            Email: privacy@bstcars.co
            <br />
            Address: Blue Star Airport Transfers LTD Ltd, 10 Downing Street, London, SW1A 2AA
          </p>
          <p className="text-gray-600">
            You also have the right to lodge a complaint with the Information
            Commissioner&apos;s Office (ICO) at ico.org.uk.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
