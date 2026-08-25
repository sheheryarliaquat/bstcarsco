"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Car,
  Menu,
  Phone,
  ChevronDown,
  X,
  LogIn,
  UserPlus,
} from "lucide-react"
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
  { label: "Book a Taxi", href: "/book" },
  { label: "Airport Transfers", href: "/airport-transfers" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "For Business", href: "/business" },
  { label: "Drive With Us", href: "/drive" },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white transition-shadow duration-200 ${
        scrolled ? "shadow-md" : "shadow-sm"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D4145A]">
            <Car className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-[#172F52]">
            Blue Star Airport Transfers LTD
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#172033] transition-colors hover:bg-[#F5F7FA] hover:text-[#D4145A]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" size="sm" render={<Link href="/login" />} nativeButton={false}>
            <LogIn className="mr-1 h-4 w-4" />
            Login
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/register" />}
            nativeButton={false}
          >
            <UserPlus className="mr-1 h-4 w-4" />
            Register
          </Button>
          <Button
            size="sm"
            className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
            render={<Link href="/book" />}
            nativeButton={false}
          >
            <Phone className="mr-1 h-4 w-4" />
            Book Now
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Button
            size="sm"
            className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
            render={<Link href="/book" />}
            nativeButton={false}
          >
            Book Now
          </Button>

          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b border-[#D9E0E8] p-4">
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4145A]">
                    <Car className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[#172F52]">Blue Star Airport Transfers LTD</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 p-4">
                {NAV_LINKS.map((link) => (
                  <SheetClose
                    key={link.href}
                    render={
                      <Link
                        href={link.href}
                        className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#172033] transition-colors hover:bg-[#F5F7FA]"
                      />
                    }
                  >
                    {link.label}
                  </SheetClose>
                ))}
              </div>
              <div className="flex flex-col gap-2 border-t border-[#D9E0E8] p-4">
                <SheetClose
                  render={
                    <Link
                      href="/login"
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-[#D9E0E8] px-4 text-sm font-medium text-[#172033] transition-colors hover:bg-[#F5F7FA]"
                    />
                  }
                >
                  <LogIn className="mr-1 h-4 w-4" />
                  Login
                </SheetClose>
                <SheetClose
                  render={
                    <Link
                      href="/register"
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-[#D9E0E8] px-4 text-sm font-medium text-[#172033] transition-colors hover:bg-[#F5F7FA]"
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
