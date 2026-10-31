"use client"

import Link from "next/link"
import { LogIn, Menu, Phone, PlaneTakeoff, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"

const NAV_LINKS = [
  { label: "Airport transfers", href: "/airport-transfers" },
  { label: "How it works", href: "/how-it-works" },
  { label: "For business", href: "/corporate" },
  { label: "Manage booking", href: "/passenger/bookings" },
  { label: "Help", href: "/contact" },
]

const PHONE_DISPLAY = "020 3002 9067"
const PHONE_HREF = "tel:+442030029067"

function Logo({ size = "md" }: { size?: "md" | "sm" }) {
  const box = size === "md" ? "h-9 w-9" : "h-8 w-8"
  return (
    <span className={`flex ${box} items-center justify-center rounded-[10px] bg-[#F2B233]`}>
      <PlaneTakeoff className="h-5 w-5 text-[#0F1B2D]" aria-hidden="true" />
    </span>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#0F1B2D] text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="BST Cars home">
          <Logo />
          <span className="font-display text-xl font-bold text-white">BST Cars</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#C9D2E0] transition-colors hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a href={PHONE_HREF} className="flex items-center gap-1.5 text-sm font-semibold text-[#F2B233] hover:underline">
            <Phone className="h-4 w-4" aria-hidden="true" />
            {PHONE_DISPLAY}
          </a>
          <Link
            href="/login"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-white/20 px-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Log in
          </Link>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <a
            href={PHONE_HREF}
            aria-label={`Call ${PHONE_DISPLAY}`}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[#F2B233] hover:bg-white/10"
          >
            <Phone className="h-5 w-5" />
          </a>
          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label="Open menu" className="h-10 w-10 text-white hover:bg-white/10 hover:text-white" />}
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b border-[#E2E6EC] p-4">
                <SheetTitle className="flex items-center gap-2">
                  <Logo size="sm" />
                  <span className="font-display text-[#0F1B2D]">BST Cars</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 p-4">
                {NAV_LINKS.map((link) => (
                  <SheetClose
                    key={link.href}
                    render={
                      <Link
                        href={link.href}
                        className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#0F1B2D] transition-colors hover:bg-[#F4F6F9]"
                      />
                    }
                  >
                    {link.label}
                  </SheetClose>
                ))}
              </div>
              <div className="flex flex-col gap-2 border-t border-[#E2E6EC] p-4">
                <a
                  href={PHONE_HREF}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#F2B233] px-4 text-sm font-semibold text-[#0F1B2D]"
                >
                  <Phone className="h-4 w-4" />
                  {PHONE_DISPLAY}
                </a>
                <SheetClose
                  render={
                    <Link
                      href="/login"
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-[#E2E6EC] px-4 text-sm font-medium text-[#0F1B2D] transition-colors hover:bg-[#F4F6F9]"
                    />
                  }
                >
                  <LogIn className="mr-1 h-4 w-4" />
                  Log in
                </SheetClose>
                <SheetClose
                  render={
                    <Link
                      href="/register"
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-[#E2E6EC] px-4 text-sm font-medium text-[#0F1B2D] transition-colors hover:bg-[#F4F6F9]"
                    />
                  }
                >
                  <UserPlus className="mr-1 h-4 w-4" />
                  Register
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
