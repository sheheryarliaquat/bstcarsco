"use client"

import { useState } from "react"
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
  Car,
  Users,
  Star,
  Camera,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RatingStars } from "@/components/shared/RatingStars"
import { DEMO_DATA } from "@/constants"

export default function OperatorProfilePage() {
  const operator = DEMO_DATA.operators[0]
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState({
    companyName: operator?.companyName ?? "",
    description: operator?.description ?? "",
    email: operator?.email ?? "",
    phone: operator?.phone ?? "",
    address: "45 Mayfair Lane, London, W1K 4QS",
    operatingAreas: ["Central London", "Greater London", "Heathrow Airport", "Gatwick Airport"],
    fleetSize: (operator?.fleetSize ?? 0).toString(),
    serviceHoursStart: "06:00",
    serviceHoursEnd: "23:00",
    weekendHoursStart: "08:00",
    weekendHoursEnd: "22:00",
  })

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Company Profile</h1>
          <p className="text-sm text-[#6B7280]">Manage your company details and settings.</p>
        </div>
        <Button className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90" onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Profile saved successfully.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Company Logo & Summary */}
        <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
          <div className="mb-4 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#172F52] text-2xl font-bold text-white">
                {(operator?.companyName ?? "").split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>
              <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#D4145A] text-white shadow-md hover:bg-[#D4145A]/90">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h2 className="text-lg font-bold text-[#172F52]">
              {operator?.companyName || "Your Company"}
            </h2>
            <RatingStars rating={operator?.rating ?? 0} size="md" count={operator?.totalReviews ?? 0} />
          </div>

          <div className="space-y-3 border-t border-[#F5F7FA] pt-4">
            <div className="flex items-center gap-3 text-sm text-[#6B7280]">
              <Building2 className="h-4 w-4 shrink-0" />
              <span>Verified Operator</span>
              <Badge className="ml-auto bg-green-500/10 text-green-600 text-[10px]">
                Active
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#6B7280]">
              <Car className="h-4 w-4 shrink-0" />
              <span>Fleet Size</span>
              <span className="ml-auto font-medium text-[#172F52]">
                {operator?.fleetSize ?? 0} vehicles
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#6B7280]">
              <Star className="h-4 w-4 shrink-0" />
              <span>Rating</span>
              <span className="ml-auto font-medium text-[#172F52]">
                {operator?.rating ?? 0}/5.0
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#6B7280]">
              <Users className="h-4 w-4 shrink-0" />
              <span>Total Reviews</span>
              <span className="ml-auto font-medium text-[#172F52]">
                {(operator?.totalReviews ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Company Details Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
            <h3 className="mb-4 text-base font-bold text-[#172F52]">
              Company Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#172F52]">
                  Company Name
                </label>
                <Input
                  value={profile.companyName}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, companyName: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#172F52]">
                  Description
                </label>
                <Textarea
                  value={profile.description}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={3}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, email: e.target.value }))
                      }
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                    <Input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, phone: e.target.value }))
                      }
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#172F52]">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-[#6B7280]" />
                  <Input
                    value={profile.address}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, address: e.target.value }))
                    }
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Operating Areas */}
          <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
            <h3 className="mb-4 text-base font-bold text-[#172F52]">
              Operating Areas
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.operatingAreas.map((area) => (
                <Badge
                  key={area}
                  className="bg-[#172F52]/10 text-[#172F52] hover:bg-[#172F52]/20 cursor-pointer px-3 py-1.5"
                >
                  <MapPin className="mr-1 h-3 w-3" />
                  {area}
                  <button
                    className="ml-2 text-[#6B7280] hover:text-[#DC3545]"
                    onClick={() =>
                      setProfile((p) => ({
                        ...p,
                        operatingAreas: p.operatingAreas.filter((a) => a !== area),
                      }))
                    }
                  >
                    ×
                  </button>
                </Badge>
              ))}
              <button className="flex items-center gap-1 rounded-full border border-dashed border-[#D9E0E8] px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:border-[#D4145A] hover:text-[#D4145A]">
                + Add Area
              </button>
            </div>
          </div>

          {/* Service Hours */}
          <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
            <h3 className="mb-4 text-base font-bold text-[#172F52]">
              Service Hours
            </h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-3 text-sm font-medium text-[#172F52]">
                  Weekday Hours
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-[#6B7280]">From</label>
                    <Input
                      type="time"
                      value={profile.serviceHoursStart}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          serviceHoursStart: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <span className="mt-5 text-[#6B7280]">to</span>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-[#6B7280]">Until</label>
                    <Input
                      type="time"
                      value={profile.serviceHoursEnd}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          serviceHoursEnd: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-[#172F52]">
                  Weekend Hours
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-[#6B7280]">From</label>
                    <Input
                      type="time"
                      value={profile.weekendHoursStart}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          weekendHoursStart: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <span className="mt-5 text-[#6B7280]">to</span>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-[#6B7280]">Until</label>
                    <Input
                      type="time"
                      value={profile.weekendHoursEnd}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          weekendHoursEnd: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
