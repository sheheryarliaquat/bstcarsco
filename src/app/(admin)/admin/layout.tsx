"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardList,
  Map,
  Users,
  Car,
  Building,
  FileText,
  Tag,
  Headphones,
  BarChart2,
  Scroll,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  CreditCard,
  Wallet,
  Star,
  Bell,
  Route,
  DollarSign,
  Loader2,
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
import { useAuth } from "@/hooks/useAuth"
import type { User as AppUser } from "@/types"

const ADMIN_ROLES = ["admin", "super_admin"]

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { id: "bookings", label: "Bookings", path: "/admin/bookings", icon: ClipboardList },
  { id: "dispatch", label: "Dispatch", path: "/admin/dispatch", icon: Map },
  { id: "passengers", label: "Passengers", path: "/admin/passengers", icon: Users },
  { id: "drivers", label: "Drivers", path: "/admin/drivers", icon: Car },
  { id: "operators", label: "Operators", path: "/admin/operators", icon: Building },
  { id: "vehicles", label: "Vehicles", path: "/admin/vehicles", icon: Route },
  { id: "quotes", label: "Quotes", path: "/admin/quotes", icon: ClipboardList },
  { id: "pricing", label: "Pricing", path: "/admin/pricing", icon: DollarSign },
  { id: "payments", label: "Payments", path: "/admin/payments", icon: CreditCard },
  { id: "payouts", label: "Payouts", path: "/admin/payouts", icon: Wallet },
  { id: "reviews", label: "Reviews", path: "/admin/reviews", icon: Star },
  { id: "documents", label: "Documents", path: "/admin/documents", icon: FileText },
  { id: "support", label: "Support", path: "/admin/support", icon: Headphones },
  { id: "notifications", label: "Notifications", path: "/admin/notifications", icon: Bell },
  { id: "reports", label: "Reports", path: "/admin/reports", icon: BarChart2 },
  { id: "audit-log", label: "Audit Log", path: "/admin/audit-log", icon: Scroll },
  { id: "settings", label: "Settings", path: "/admin/settings", icon: Settings },
] as const

function SidebarContent({
  onNavClick,
  userData,
  onLogout,
}: {
  onNavClick?: () => void
  userData: AppUser | null
  onLogout: () => void
}) {
  const pathname = usePathname()
  const displayName = userData
    ? `${userData.firstName} ${userData.lastName}`.trim() || "Admin"
    : "Admin"
  const initials = userData
    ? `${userData.firstName?.[0] ?? ""}${userData.lastName?.[0] ?? ""}`.toUpperCase() || "A"
    : "A"

  return (
    <div className="flex h-full flex-col bg-[#172F52]">
      <div className="px-5 pt-6 pb-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5" onClick={onNavClick}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4145A]">
            <Car className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white">Blue Star Airport Transfers LTD</span>
            <span className="ml-2 inline-flex items-center rounded-full bg-[#D4145A] px-2 py-0.5 text-[10px] font-bold text-white">
              ADMIN
            </span>
          </div>
        </Link>
      </div>

      <Separator className="mx-5 bg-white/10" />

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
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
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#D4145A] text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <Separator className="mx-5 bg-white/10" />

      <div className="px-3 py-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-red-500/20 hover:text-red-400"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span>Logout</span>
        </button>
      </div>

      <Separator className="mx-5 bg-white/10" />

      <div className="flex items-center gap-3 px-5 py-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-[#D4145A] text-sm font-semibold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {displayName}
          </p>
          <p className="truncate text-[11px] text-white/50">
            {userData?.email ?? ""}
          </p>
        </div>
      </div>
    </div>
  )
}

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
      <Loader2 className="h-8 w-8 animate-spin text-[#D4145A]" />
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, userData, loading, signOut } = useAuth()

  const isLoginPage = pathname === "/admin/login"
  const isAdmin = !!user && !!userData && ADMIN_ROLES.includes(userData.role)

  useEffect(() => {
    if (isLoginPage) return
    if (!loading && !isAdmin) {
      router.replace("/admin/login")
    }
  }, [isLoginPage, loading, isAdmin, router])

  async function handleLogout() {
    await signOut()
    router.replace("/admin/login")
  }

  // The login page renders its own full-screen layout (branding panel +
  // form) and must never be nested inside the authenticated dashboard shell.
  if (isLoginPage) {
    return <>{children}</>
  }

  // Block rendering of any admin page until we've confirmed the visitor is
  // a logged-in admin — otherwise the dashboard briefly flashes for anyone.
  if (loading || !isAdmin) {
    return <FullScreenLoader />
  }

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent userData={userData} onLogout={handleLogout} />
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
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <SidebarContent
              onNavClick={() => setMobileOpen(false)}
              userData={userData}
              onLogout={handleLogout}
            />
          </SheetContent>
        </Sheet>

        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4145A]">
            <Car className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-[#172F52]">Blue Star Airport Transfers LTD</span>
          <span className="inline-flex items-center rounded-full bg-[#172F52] px-1.5 py-0.5 text-[9px] font-bold text-white">
            ADMIN
          </span>
        </Link>

        <div className="ml-auto">
          <Link href="/admin/notifications" className="relative">
            <Bell className="h-5 w-5 text-[#6B7280]" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4145A] text-[9px] font-bold text-white">
              5
            </span>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:pl-64">
        <div className="hidden lg:flex lg:h-14 lg:items-center lg:justify-between lg:border-b lg:border-[#E5E7EB] lg:bg-white lg:px-8">
          <div />
          <div className="flex items-center gap-4">
            <Link href="/admin/notifications" className="relative">
              <Bell className="h-5 w-5 text-[#6B7280]" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4145A] text-[9px] font-bold text-white">
                5
              </span>
            </Link>
            <div className="h-6 w-px bg-[#E5E7EB]" />
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[#172F52] text-xs font-semibold text-white">
                  {`${userData?.firstName?.[0] ?? ""}${userData?.lastName?.[0] ?? ""}`.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-[#172F52]">
                {`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`.trim() || "Admin"}
              </span>
            </div>
          </div>
        </div>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
