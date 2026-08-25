"use client"

import { useState } from "react"
import {
  Camera,
  Save,
  Lock,
  Trash2,
  Mail,
  Phone,
  User,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { DEMO_DATA } from "@/constants"

const passenger = DEMO_DATA.passengers[0]

export default function ProfilePage() {
  const [firstName, setFirstName] = useState(passenger.firstName)
  const [lastName, setLastName] = useState(passenger.lastName)
  const [email, setEmail] = useState(passenger.email)
  const [phone, setPhone] = useState(passenger.phone)
  const [defaultPickup, setDefaultPickup] = useState(
    passenger.defaultPickup?.formattedAddress ?? ""
  )
  const [defaultDest, setDefaultDest] = useState(
    passenger.defaultDestination?.formattedAddress ?? ""
  )
  const [notifications, setNotifications] = useState(
    passenger.preferences.notifications
  )
  const [newsletter, setNewsletter] = useState(
    passenger.preferences.emailUpdates
  )
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#172F52]">Profile</h1>
        <p className="text-sm text-[#6B7280]">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Profile photo */}
      <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#6B7280]">
          Profile Photo
        </h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar size="lg" className="h-20 w-20">
              <AvatarImage src={passenger.photoURL} alt={passenger.firstName} />
              <AvatarFallback className="bg-[#172F52] text-lg text-white">
                {passenger.firstName[0]}
                {passenger.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#D4145A] text-white shadow-sm hover:bg-[#D4145A]/90">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-[#172F52]">
              {passenger.firstName} {passenger.lastName}
            </p>
            <p className="text-xs text-[#6B7280]">
              Member since{" "}
              {new Date(passenger.createdAt).toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#6B7280]">
          Personal Information
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>First Name</Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-9 pl-9"
              />
            </div>
          </div>
          <div>
            <Label>Last Name</Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-9 pl-9"
              />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 pl-9"
              />
            </div>
          </div>
          <div>
            <Label>Phone</Label>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-9 pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Defaults */}
      <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#6B7280]">
          Default Locations
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Default Pickup</Label>
            <div className="relative mt-1.5">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D4145A]" />
              <Input
                value={defaultPickup}
                onChange={(e) => setDefaultPickup(e.target.value)}
                placeholder="Set a default pickup location"
                className="h-9 pl-9"
              />
            </div>
          </div>
          <div>
            <Label>Default Destination</Label>
            <div className="relative mt-1.5">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#172F52]" />
              <Input
                value={defaultDest}
                onChange={(e) => setDefaultDest(e.target.value)}
                placeholder="Set a default destination"
                className="h-9 pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#6B7280]">
          Preferences
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#172F52]">
                Push Notifications
              </p>
              <p className="text-xs text-[#6B7280]">
                Receive notifications about your bookings
              </p>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
          <Separator className="bg-[#F5F7FA]" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#172F52]">
                Email Newsletter
              </p>
              <p className="text-xs text-[#6B7280]">
                Receive offers and updates via email
              </p>
            </div>
            <Switch checked={newsletter} onCheckedChange={setNewsletter} />
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#6B7280]">
          Change Password
        </h2>
        <div className="space-y-4">
          <div>
            <Label>Current Password</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="h-9 pl-9"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>New Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="h-9 pl-9"
                />
              </div>
            </div>
            <div>
              <Label>Confirm Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="h-9 pl-9"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button className="bg-[#172F52] text-white hover:bg-[#172F52]/90">
          <Save className="h-4 w-4" /> Save Changes
        </Button>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-[#DC2626]/20 bg-white p-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#DC2626]">
          Danger Zone
        </h2>
        <p className="mb-4 text-xs text-[#6B7280]">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        <Button
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" /> Delete Account
        </Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Account"
        description="Are you sure you want to delete your account? All your data, bookings, and reviews will be permanently removed. This cannot be undone."
        confirmText="Yes, Delete My Account"
        onConfirm={() => {}}
        variant="destructive"
      />
    </div>
  )
}
