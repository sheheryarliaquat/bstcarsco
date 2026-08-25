"use client"

import { useState } from "react"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  CheckCircle2,
  Lock,
  Car,
  Star,
  Edit,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RatingStars } from "@/components/shared/RatingStars"

export default function DriverProfilePage() {
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Profile</h1>
          <p className="text-sm text-[#6B7280]">Manage your account settings</p>
        </div>
        <Button
          onClick={handleSave}
          className={cn(
            "text-white",
            saved
              ? "bg-green-600 hover:bg-green-700"
              : "bg-[#D4145A] hover:bg-[#D4145A]/90"
          )}
        >
          {saved ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Profile Photo & Rating */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-[#E5E7EB]">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-[#172F52] text-2xl font-bold text-white">
                MH
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#D4145A] text-white shadow-lg transition-colors hover:bg-[#D4145A]/90">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-[#172F52]">
              Mohammed Hassan
            </h2>
            <p className="text-sm text-[#6B7280]">
              mohammed.hassan@driver.uk
            </p>
            <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
              <RatingStars rating={4.9} size="md" count={847} />
            </div>
            <Badge className="mt-2 bg-green-50 text-green-700 border border-green-200">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Verified Driver
            </Badge>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-[#E5E7EB]">
        <h3 className="mb-4 text-base font-bold text-[#172F52]">
          Personal Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName" className="text-sm font-medium text-[#172033]">
              First Name
            </Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
              <Input
                id="firstName"
                defaultValue="Mohammed"
                className="h-10 pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="lastName" className="text-sm font-medium text-[#172033]">
              Last Name
            </Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
              <Input
                id="lastName"
                defaultValue="Hassan"
                className="h-10 pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-[#172033]">
              Email Address
            </Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
              <Input
                id="email"
                type="email"
                defaultValue="mohammed.hassan@driver.uk"
                className="h-10 pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="phone" className="text-sm font-medium text-[#172033]">
              Phone Number
            </Label>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
              <Input
                id="phone"
                type="tel"
                defaultValue="+447700901100"
                className="h-10 pl-10"
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address" className="text-sm font-medium text-[#172033]">
              Address
            </Label>
            <div className="relative mt-1.5">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
              <Input
                id="address"
                defaultValue="123 Kingsway, London WC2B 6PA"
                className="h-10 pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Section */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-[#E5E7EB]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#172F52]">My Vehicle</h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#D4145A] hover:bg-[#D4145A]/10"
          >
            <Edit className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
        </div>

        <div className="flex items-center gap-4 rounded-xl bg-[#F5F7FA] p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#172F52]/10">
            <Car className="h-7 w-7 text-[#172F52]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#172F52]">
              Toyota Prius 2024
            </p>
            <div className="flex items-center gap-4 text-xs text-[#6B7280]">
              <span>LN24 TCO</span>
              <span>White</span>
              <span>Electric/Hybrid</span>
            </div>
          </div>
          <Badge className="bg-green-50 text-green-700 border border-green-200">
            Approved
          </Badge>
        </div>
      </div>

      {/* Rating */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-[#E5E7EB]">
        <h3 className="mb-4 text-base font-bold text-[#172F52]">
          Driver Rating
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4145A]/10">
            <Star className="h-8 w-8 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <p className="text-3xl font-bold text-[#172F52]">4.9</p>
            <RatingStars rating={4.9} size="md" count={847} />
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-[#E5E7EB]">
        <h3 className="mb-4 text-base font-bold text-[#172F52]">
          Change Password
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="currentPassword" className="text-sm font-medium text-[#172033]">
              Current Password
            </Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
              <Input
                id="currentPassword"
                type="password"
                placeholder="Enter current password"
                className="h-10 pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="newPassword" className="text-sm font-medium text-[#172033]">
              New Password
            </Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                className="h-10 pl-10"
              />
            </div>
          </div>
        </div>
        <Button className="mt-4 bg-[#172F52] text-white hover:bg-[#172F52]/90">
          Update Password
        </Button>
      </div>

      {/* Availability Status */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-[#E5E7EB]">
        <h3 className="mb-4 text-base font-bold text-[#172F52]">
          Availability Status
        </h3>
        <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <div>
            <p className="text-sm font-bold text-green-800">
              Currently Online
            </p>
            <p className="text-xs text-green-600">
              You are available to receive trip requests
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
