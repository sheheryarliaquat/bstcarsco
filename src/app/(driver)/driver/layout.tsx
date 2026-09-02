"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardList,
  Navigation,
  Wallet,
  FileText,
  Car,
  Bell,
  User,
  LogOut,
  Star,
  Clock,
  Menu,
  X,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/hooks/useAuth"

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", path: "/driver/dashboard", icon: LayoutDashboard },
  { id: "trips", label: "My Trips", path: "/driver/bookings", icon: ClipboardList },
  { id: "active", label: "Active Trip", path: "/driver/active-trip", icon: Navigation },
  { id: "availability", label: "Availability", path: "/driver/availability", icon: Clock },
  { id: "vehicle", label: "Vehicle", path: "/driver/vehicle", icon: Car },
  { id: "documents", label: "Documents", path: "/driver/documents", icon: FileText },
  { id: "earnings", label: "Earnings", path: "/driver/earnings", icon: Wallet },
  { id: "reviews", label: "Reviews", path: "/driver/reviews", icon: Star },
  { id: "notifications", label: "Notifications", path: "/driver/notifications", icon: Bell },
  { id: "profile", label: "Profile", path: "/driver/profile", icon: User },
] as const

function DriverSidebarContent({
  isOnline,
  setIsOnline,
  onNavClick,
}: {
  isOnline: boolean
  setIsOnline: (v: boolean) => void
  onNavClick?: () => void
}) {
  const pathname = usePathname()
  const { userData } = useAuth()
  const displayName = userData
    ? `${userData.firstName} ${userData.lastName}`.trim() || "Driver"
    : "Driver"
  const initials = userData
    ? `${userData.firstName?.[0] ?? ""}${userData.lastName?.[0] ?? ""}`.toUpperCase() || "D"
    : "D"
  const email = userData?.email ?? "No email available"

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="px-5 pt-6 pb-4">
        <Link href="/driver/dashboard" className="flex items-center gap-2.5" onClick={onNavClick}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4145A]">
            <Car className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-[#172F52]">Blue Star Airport Transfers LTD</span>
        </Link>
      </div>

      <div className="mx-5 mb-4 rounded-xl bg-[#F5F7FA] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
              )}
            />
            <span className="text-sm font-medium text-[#172F52]">
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
          <Switch
            checked={isOnline}
            onCheckedChange={setIsOnline}
          />
        </div>
      </div>

      <Separator className="mx-5" />

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.path || pathname.startsWith(item.path + "/")
            const Icon = item.icon

            return (
              <li key={item.id}>
                <Link
                  href={item.path}
                  onClick={onNavClick}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#D4145A]/10 text-[#D4145A]"
                      : "text-[#6B7280] hover:bg-[#F5F7FA] hover:text-[#172F52]"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#D4145A]" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <Separator className="mx-5" />

      <div className="px-3 py-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#6B7280] transition-colors hover:bg-red-50 hover:text-red-600">
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>

      <Separator className="mx-5" />

      <div className="flex items-center gap-3 px-5 py-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-[#172F52] text-sm font-semibold text-white">
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

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOnline, setIsOnline] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col border-r border-[#E5E7EB]">
        <DriverSidebarContent
          isOnline={isOnline}
          setIsOnline={setIsOnline}
        />
      </aside>

      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-[#E5E7EB] bg-white px-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
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
            <DriverSidebarContent
              isOnline={isOnline}
              setIsOnline={setIsOnline}
              onNavClick={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <Link href="/driver/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4145A]">
            <Car className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-[#172F52]">Blue Star Airport Transfers LTD</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isOnline ? "bg-green-500" : "bg-gray-400"
            )}
          />
          <Link href="/driver/notifications" className="relative">
            <Bell className="h-5 w-5 text-[#6B7280]" />
          </Link>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:pl-72">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
