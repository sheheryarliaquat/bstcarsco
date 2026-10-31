"use client"

import { useState, useEffect } from "react"
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  CheckCircle2,
  Lock,
  Car,
  Star,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RatingStars } from "@/components/shared/RatingStars"
import { useAuth } from "@/hooks/useAuth"
import { getDriver, updateDriver } from "@/lib/services/driver-service"
import { getVehicle } from "@/lib/services/vehicle-service"
import { updateUser } from "@/lib/services/user-service"
import { changePassword } from "@/lib/firebase/auth"
import type { Driver, Vehicle } from "@/types"

export default function DriverProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Driver | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    getDriver(user.uid)
      .then((data) => {
        setProfile(data)
        if (data) {
          setFirstName(data.firstName)
          setLastName(data.lastName)
          setPhone(data.phone)
          if (data.vehicleId) {
            getVehicle(data.vehicleId).then(setVehicle).catch(() => setVehicle(null))
          }
        }
      })
      .finally(() => setLoading(false))
  }, [user])

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      await Promise.all([
        updateDriver(user.uid, { firstName, lastName, phone }),
        updateUser(user.uid, { firstName, lastName, phone }),
      ])
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    setPasswordError("")
    setPasswordSuccess(false)
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.")
      return
    }
    setPasswordSaving(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password.")
    } finally {
      setPasswordSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#1F4FD8]" />
      </div>
    )
  }

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "D"
  const isOnline = profile?.status === "online"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Profile</h1>
          <p className="text-sm text-[#5B6577]">Manage your account settings</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "text-white",
            saved ? "bg-green-600 hover:bg-green-700" : "bg-[#1F4FD8] hover:bg-[#1F4FD8]/90"
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
              {saving ? "Saving..." : "Save Changes"}
            </>
          )}
        </Button>
      </div>

      {/* Profile Photo & Rating */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-[#E5E7EB]">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-[#0F1B2D] text-2xl font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#1F4FD8] text-white shadow-lg transition-colors hover:bg-[#1F4FD8]/90">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-[#0F1B2D]">
              {firstName} {lastName}
            </h2>
            <p className="text-sm text-[#5B6577]">{profile?.email}</p>
            <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
              <RatingStars rating={profile?.rating ?? 0} size="md" count={profile?.totalReviews ?? 0} />
            </div>
            {profile?.isVerified && (
              <Badge className="mt-2 bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Verified Driver
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-[#E5E7EB]">
        <h3 className="mb-4 text-base font-bold text-[#0F1B2D]">
          Personal Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName" className="text-sm font-medium text-[#0F1B2D]">
              First Name
            </Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6577]" />
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10 pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="lastName" className="text-sm font-medium text-[#0F1B2D]">
              Last Name
            </Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6577]" />
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-10 pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-[#0F1B2D]">
              Email Address
            </Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6577]" />
              <Input
                id="email"
                type="email"
                value={profile?.email ?? ""}
                disabled
                className="h-10 pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="phone" className="text-sm font-medium text-[#0F1B2D]">
              Phone Number
            </Label>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6577]" />
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Section */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-[#E5E7EB]">
        <h3 className="mb-4 text-base font-bold text-[#0F1B2D]">My Vehicle</h3>

        {vehicle ? (
          <div className="flex items-center gap-4 rounded-xl bg-[#F4F6F9] p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#0F1B2D]/10">
              <Car className="h-7 w-7 text-[#0F1B2D]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#0F1B2D]">
                {vehicle.make} {vehicle.model} {vehicle.year}
              </p>
              <div className="flex items-center gap-4 text-xs text-[#5B6577]">
                <span>{vehicle.registration}</span>
                <span>{vehicle.colour}</span>
                {vehicle.isElectric && <span>Electric</span>}
                {vehicle.isHybrid && <span>Hybrid</span>}
              </div>
            </div>
            <Badge className={vehicle.isApproved ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}>
              {vehicle.isApproved ? "Approved" : "Pending"}
            </Badge>
          </div>
        ) : (
          <p className="text-sm text-[#5B6577]">No vehicle assigned yet. Contact your operator or admin.</p>
        )}
      </div>

      {/* Rating */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-[#E5E7EB]">
        <h3 className="mb-4 text-base font-bold text-[#0F1B2D]">
          Driver Rating
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1F4FD8]/10">
            <Star className="h-8 w-8 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <p className="text-3xl font-bold text-[#0F1B2D]">{(profile?.rating ?? 0).toFixed(1)}</p>
            <RatingStars rating={profile?.rating ?? 0} size="md" count={profile?.totalReviews ?? 0} />
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-[#E5E7EB]">
        <h3 className="mb-4 text-base font-bold text-[#0F1B2D]">
          Change Password
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="currentPassword" className="text-sm font-medium text-[#0F1B2D]">
              Current Password
            </Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6577]" />
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="h-10 pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="newPassword" className="text-sm font-medium text-[#0F1B2D]">
              New Password
            </Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6577]" />
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="h-10 pl-10"
              />
            </div>
          </div>
        </div>
        {passwordError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" /> {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Password updated.
          </div>
        )}
        <Button
          onClick={handleChangePassword}
          disabled={passwordSaving || !currentPassword || !newPassword}
          className="mt-4 bg-[#0F1B2D] text-white hover:bg-[#0F1B2D]/90"
        >
          {passwordSaving ? "Updating..." : "Update Password"}
        </Button>
      </div>

      {/* Availability Status */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-[#E5E7EB]">
        <h3 className="mb-4 text-base font-bold text-[#0F1B2D]">
          Availability Status
        </h3>
        <div className={cn("flex items-center gap-3 rounded-xl p-4", isOnline ? "bg-green-50" : "bg-gray-100")}>
          <div className={cn("h-3 w-3 rounded-full", isOnline ? "bg-green-500" : "bg-gray-400")} />
          <div>
            <p className={cn("text-sm font-bold", isOnline ? "text-green-800" : "text-gray-600")}>
              {isOnline ? "Currently Online" : "Currently Offline"}
            </p>
            <p className={cn("text-xs", isOnline ? "text-green-600" : "text-gray-500")}>
              {isOnline ? "You are available to receive trip requests" : "Go online from the sidebar to receive trips"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
