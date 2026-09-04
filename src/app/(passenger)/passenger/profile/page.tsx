"use client"

import { useState, useEffect } from "react"
import {
  Camera,
  Save,
  Lock,
  Trash2,
  Mail,
  Phone,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useAuth } from "@/hooks/useAuth"
import { updateUser } from "@/lib/services/user-service"
import { changePassword, signOutUser } from "@/lib/firebase/auth"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()
  const { user, userData, loading: authLoading } = useAuth()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    if (userData) {
      setFirstName(userData.firstName ?? "")
      setLastName(userData.lastName ?? "")
      setPhone(userData.phone ?? "")
    }
  }, [userData])

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setSaveError("")
    setSaveSuccess(false)
    try {
      await updateUser(user.uid, { firstName, lastName, phone })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save changes.")
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    setPasswordError("")
    setPasswordSuccess(false)
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.")
      return
    }
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
      setConfirmPassword("")
      setTimeout(() => setPasswordSuccess(false), 2500)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password.")
    } finally {
      setPasswordSaving(false)
    }
  }

  async function handleDeleteAccount() {
    if (!user) return
    // Firestore rules only allow a super_admin to hard-delete a user
    // document, so this deactivates the account instead of deleting it
    // outright.
    await updateUser(user.uid, { status: "deleted" })
    await signOutUser()
    setDeleteOpen(false)
    router.push("/")
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4145A] border-t-transparent" />
      </div>
    )
  }

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
              <AvatarImage src={userData?.photoURL} alt={firstName} />
              <AvatarFallback className="bg-[#172F52] text-lg text-white">
                {firstName[0]}
                {lastName[0]}
              </AvatarFallback>
            </Avatar>
            <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#D4145A] text-white shadow-sm hover:bg-[#D4145A]/90">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-[#172F52]">
              {firstName} {lastName}
            </p>
            {userData?.createdAt && (
              <p className="text-xs text-[#6B7280]">
                Member since{" "}
                {new Date(userData.createdAt).toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
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
                value={userData?.email ?? ""}
                disabled
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
        {saveError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" /> {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Saved.
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button
            className="bg-[#172F52] text-white hover:bg-[#172F52]/90"
            onClick={handleSave}
            disabled={saving || !user}
          >
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
          </Button>
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
          {passwordError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" /> {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Password updated.
            </div>
          )}
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="border-[#D9E0E8]"
              onClick={handleChangePassword}
              disabled={passwordSaving || !currentPassword || !newPassword}
            >
              {passwordSaving ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-[#DC2626]/20 bg-white p-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#DC2626]">
          Danger Zone
        </h2>
        <p className="mb-4 text-xs text-[#6B7280]">
          Deactivate your account. Your bookings and reviews will be
          preserved, but you won&apos;t be able to sign in until an admin
          reactivates it.
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
        description="Are you sure you want to deactivate your account? You will be signed out and won't be able to sign back in until this is reversed."
        confirmText="Yes, Delete My Account"
        onConfirm={handleDeleteAccount}
        variant="destructive"
      />
    </div>
  )
}
