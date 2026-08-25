"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Car,
  DollarSign,
  BarChart2,
  Wallet,
  User,
  Bell,
  LogOut,
  Menu,
  ChevronRight,
  Settings,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { DEMO_DATA } from "@/constants"
import { RatingStars } from "@/components/shared/RatingStars"

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", path: "/operator/dashboard", icon: LayoutDashboard },
  { id: "bookings", label: "Bookings", path: "/operator/bookings", icon: ClipboardList },
  { id: "drivers", label: "Drivers", path: "/operator/drivers", icon: Users },
  { id: "vehicles", label: "Vehicles", path: "/operator/vehicles", icon: Car },
  { id: "pricing", label: "Pricing", path: "/operator/pricing", icon: DollarSign },
  { id: "reports", label: "Reports", path: "/operator/reports", icon: BarChart2 },
  { id: "payouts", label: "Payouts", path: "/operator/payouts", icon: Wallet },
  { id: "profile", label: "Company Profile", path: "/operator/profile", icon: FileText },
  { id: "notifications", label: "Notifications", path: "/operator/notifications", icon: Bell },
  { id: "settings", label: "Settings", path: "/operator/settings", icon: Settings },
] as const

const operator = DEMO_DATA.operators[0]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4145A]">
          <Car className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#172F52]">Blue Star Airport Transfers LTD</p>
          <p className="text-[10px] text-[#6B7280]">Operator Portal</p>
        </div>
      </div>

      <Separator className="bg-[#F5F7FA]" />

      <div className="mx-4 mt-4 rounded-xl bg-[#172F52]/5 p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#172F52] text-white text-xs font-bold">
            {operator.companyName.split(" ").map(w => w[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#172F52]">
              {operator.companyName}
            </p>
            <RatingStars rating={operator.rating} size="sm" count={operator.totalReviews} />
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.path || pathname.startsWith(item.path + "/")
          return (
            <Link
              key={item.id}
              href={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#D4145A]/10 text-[#D4145A]"
                  : "text-[#6B7280] hover:bg-[#F5F7FA] hover:text-[#172F52]"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
              {isActive && (
                <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
              )}
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-[#F5F7FA]" />

      <div className="px-3 py-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#DC2626] transition-colors hover:bg-red-50">
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>

      <Separator className="bg-[#F5F7FA]" />

      <div className="flex items-center gap-3 px-5 py-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-[#172F52] text-xs font-semibold text-white">
            {operator.firstName[0]}{operator.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#172F52]">
            {operator.firstName} {operator.lastName}
          </p>
          <p className="truncate text-[11px] text-[#6B7280]">
            {operator.email}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 border-r border-[#E5E7EB] lg:fixed lg:inset-y-0 lg:z-50 lg:block">
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Menu className="h-5 w-5 text-[#172F52]" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                }
              />
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                <SidebarContent onNavigate={() => setSheetOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4145A]">
                <Car className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-[#172F52]">Blue Star Airport Transfers LTD</span>
            </div>
          </div>
          <Link href="/operator/notifications" className="relative">
            <Bell className="h-5 w-5 text-[#6B7280]" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4145A] text-[9px] font-bold text-white">
              5
            </span>
          </Link>
        </div>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
