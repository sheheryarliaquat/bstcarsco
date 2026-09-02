"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Car,
  ClipboardList,
  MapPin,
  CreditCard,
  Star,
  Bell,
  User,
  Headphones,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { NotificationBell } from "@/components/shared/NotificationBell"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", path: "/passenger/dashboard", icon: LayoutDashboard },
  { id: "book", label: "Book Taxi", path: "/passenger/book", icon: Car },
  { id: "bookings", label: "My Bookings", path: "/passenger/bookings", icon: ClipboardList },
  { id: "saved", label: "Saved Locations", path: "/passenger/saved-locations", icon: MapPin },
  { id: "payments", label: "Payments", path: "/passenger/payments", icon: CreditCard },
  { id: "reviews", label: "Reviews", path: "/passenger/reviews", icon: Star },
  { id: "notifications", label: "Notifications", path: "/passenger/notifications", icon: Bell },
  { id: "profile", label: "Profile", path: "/passenger/profile", icon: User },
  { id: "support", label: "Support", path: "/passenger/support", icon: Headphones },
] as const

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { userData } = useAuth()
  const displayName = userData
    ? `${userData.firstName} ${userData.lastName}`.trim() || "Passenger"
    : "Passenger"
  const initials = userData
    ? `${userData.firstName?.[0] ?? ""}${userData.lastName?.[0] ?? ""}`.toUpperCase() || "P"
    : "P"
  const email = userData?.email ?? "No email available"
  const avatarSrc = userData?.photoURL ?? ""

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4145A]">
          <Car className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#172F52]">Blue Star Airport Transfers LTD</p>
          <p className="text-[10px] text-[#6B7280]">Passenger Portal</p>
        </div>
      </div>

      <Separator className="bg-[#F5F7FA]" />

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
                  ? "bg-[#172F52] text-white"
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
        <Avatar size="sm">
          {avatarSrc ? <AvatarImage src={avatarSrc} alt={displayName} /> : null}
          <AvatarFallback className="bg-[#172F52] text-xs text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#172F52]">
            {displayName}
          </p>
          <p className="truncate text-[11px] text-[#6B7280]">
            {email}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PassengerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[#F5F7FA]">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-[#E5E7EB] lg:block">
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center gap-3">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger
                render={
                  <button className="rounded-lg p-1.5 text-[#172F52] hover:bg-[#F5F7FA]" />
                }
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SidebarContent onNavigate={() => setSheetOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4145A]">
                <Car className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-[#172F52]">
                Blue Star Airport Transfers LTD
              </span>
            </div>
          </div>
          <NotificationBell />
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
