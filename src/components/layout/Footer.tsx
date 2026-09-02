import Link from "next/link"
import { Car, Phone, Mail, MapPin } from "lucide-react"

const FOOTER_COLUMNS = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Airport Transfers", href: "/airport-transfers" },
      { label: "Corporate Travel", href: "/corporate" },
      { label: "Minibus Hire", href: "/minibus" },
      { label: "Event Transport", href: "/events" },
    ],
  },
  {
    title: "For Passengers",
    links: [
      { label: "Book a Taxi", href: "/book" },
      { label: "My Bookings", href: "/passenger/bookings" },
      { label: "Support", href: "/support" },
      { label: "FAQs", href: "/faqs" },
    ],
  },
  {
    title: "For Drivers",
    links: [
      { label: "Drive With Us", href: "/drive" },
      { label: "Driver Portal", href: "/driver/dashboard" },
      { label: "Requirements", href: "/drive/requirements" },
      { label: "Benefits", href: "/drive/benefits" },
    ],
  },
  {
    title: "For Operators",
    links: [
      { label: "Join Us", href: "/operators/join" },
      { label: "Operator Portal", href: "/operator/dashboard" },
      { label: "Pricing", href: "/operators/pricing" },
      { label: "Partner Benefits", href: "/operators/benefits" },
    ],
  },
]

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
]

export function Footer() {
  return (
    <footer className="bg-[#172F52] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D4145A]">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">Blue Star Airport Transfers LTD</span>
            </Link>
            <p className="mb-4 max-w-xs text-sm text-gray-300">
              Your trusted platform for booking taxis across the United Kingdom.
              Compare quotes, track your ride, and travel with confidence.
            </p>
            <div className="flex flex-col gap-2 text-sm text-gray-300">
              <a
                href="tel:+442030029067"
                className="flex items-center gap-2 hover:text-white"
              >
                <Phone className="h-4 w-4" />
                020 3002 9067
              </a>
              <a
                href="mailto:support@bstcars.co"
                className="flex items-center gap-2 hover:text-white"
              >
                <Mail className="h-4 w-4" />
                support@bstcars.co
              </a>
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-200">
                {col.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-300 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-sm text-gray-400">
            &copy; <span suppressHydrationWarning>{new Date().getFullYear()}</span> Blue Star Airport Transfers LTD. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
