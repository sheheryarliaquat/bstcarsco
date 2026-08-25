import type { Metadata } from "next";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Learn about the cookies and tracking technologies used by Blue Star Airport Transfers LTD and how to manage your preferences.",
};

export default function CookiePolicyPage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-[#172F52] to-[#102544] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Cookie Policy
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            Last updated: 25 August 2026
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl prose prose-slate">
          <h2 className="text-2xl font-bold text-[#172F52]">1. What Are Cookies?</h2>
          <p className="text-gray-600">
            Cookies are small text files placed on your device when you visit a
            website. They help us recognise your device, remember your
            preferences, and improve your browsing experience. Cookies are widely
            used across the internet and do not harm your device.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">2. How We Use Cookies</h2>
          <p className="text-gray-600">
            We use cookies for the following purposes:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-600">
            <li>
              <strong>Essential Cookies:</strong> Required for the Platform to
              function correctly. These enable core features like booking,
              login, and payment processing. You cannot opt out of these cookies
              as the Platform will not work without them.
            </li>
            <li>
              <strong>Analytics Cookies:</strong> Help us understand how visitors
              interact with our Platform by collecting anonymous usage data. This
              helps us improve the user experience.
            </li>
            <li>
              <strong>Functionality Cookies:</strong> Remember your preferences
              such as language, location, and display settings to provide a
              personalised experience.
            </li>
            <li>
              <strong>Marketing Cookies:</strong> Used to deliver relevant
              advertisements and track the effectiveness of our marketing
              campaigns. These are only set with your explicit consent.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-[#172F52]">3. Specific Cookies We Use</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-gray-600">
              <thead>
                <tr className="border-b border-[#D9E0E8] text-left">
                  <th className="py-3 pr-4 font-semibold text-[#172F52]">
                    Cookie
                  </th>
                  <th className="py-3 pr-4 font-semibold text-[#172F52]">
                    Purpose
                  </th>
                  <th className="py-3 pr-4 font-semibold text-[#172F52]">
                    Duration
                  </th>
                  <th className="py-3 font-semibold text-[#172F52]">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E0E8]">
                <tr>
                  <td className="py-3 pr-4">session_id</td>
                  <td className="py-3 pr-4">Maintains your session</td>
                  <td className="py-3 pr-4">Session</td>
                  <td className="py-3">Essential</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">csrf_token</td>
                  <td className="py-3 pr-4">Security protection</td>
                  <td className="py-3 pr-4">Session</td>
                  <td className="py-3">Essential</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">_analytics</td>
                  <td className="py-3 pr-4">Usage analytics</td>
                  <td className="py-3 pr-4">2 years</td>
                  <td className="py-3">Analytics</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">preferences</td>
                  <td className="py-3 pr-4">User preferences</td>
                  <td className="py-3 pr-4">1 year</td>
                  <td className="py-3">Functionality</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">cookie_consent</td>
                  <td className="py-3 pr-4">Stores cookie consent</td>
                  <td className="py-3 pr-4">1 year</td>
                  <td className="py-3">Essential</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl font-bold text-[#172F52]">4. Third-Party Cookies</h2>
          <p className="text-gray-600">
            Some cookies are placed by third-party services that appear on our
            pages. We use third-party services for analytics (Google Analytics)
            and payment processing (Stripe). These third parties may use cookies
            in accordance with their own privacy policies.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">5. Managing Cookies</h2>
          <p className="text-gray-600">
            You can control and manage cookies in several ways:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-600">
            <li>
              <strong>Browser Settings:</strong> Most browsers allow you to block
              or delete cookies. Check your browser&apos;s help section for
              instructions.
            </li>
            <li>
              <strong>Our Cookie Banner:</strong> When you first visit the
              Platform, you can choose which categories of cookies to accept.
            </li>
            <li>
              <strong>Opt-Out Links:</strong> For Google Analytics, you can use
              the Google Analytics Opt-out Browser Add-on.
            </li>
          </ul>
          <p className="text-gray-600">
            Please note that disabling cookies may affect the functionality of
            the Platform. Essential cookies are required for core features to
            work.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">6. Changes to This Policy</h2>
          <p className="text-gray-600">
            We may update this Cookie Policy to reflect changes in technology or
            legislation. We will notify you of significant changes by updating
            the &quot;Last updated&quot; date and, where appropriate, by displaying a
            notice on the Platform.
          </p>

          <h2 className="text-2xl font-bold text-[#172F52]">7. Contact Us</h2>
          <p className="text-gray-600">
            If you have questions about our use of cookies, please contact us at
            privacy@bstcars.co or write to:
          </p>
          <p className="text-gray-600">
            Blue Star Airport Transfers LTD Ltd
            <br />
            10 Downing Street
            <br />
            London, SW1A 2AA
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
