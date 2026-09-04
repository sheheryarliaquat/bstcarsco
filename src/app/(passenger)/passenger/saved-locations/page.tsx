"use client"

import { useState, useEffect } from "react"
import {
  Home,
  Briefcase,
  Plane,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  Building2,
  GraduationCap,
  Dumbbell,
  Heart,
  ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/shared/Modal"
import { EmptyState } from "@/components/shared/EmptyState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useAuth } from "@/hooks/useAuth"
import {
  createSavedLocation,
  updateSavedLocation,
  deleteSavedLocation,
  listenToSavedLocations,
} from "@/lib/services/saved-location-service"
import type { SavedLocation } from "@/types"

const iconMap: Record<string, React.ReactNode> = {
  home: <Home className="h-5 w-5" />,
  briefcase: <Briefcase className="h-5 w-5" />,
  plane: <Plane className="h-5 w-5" />,
  building: <Building2 className="h-5 w-5" />,
  education: <GraduationCap className="h-5 w-5" />,
  gym: <Dumbbell className="h-5 w-5" />,
  health: <Heart className="h-5 w-5" />,
  shopping: <ShoppingBag className="h-5 w-5" />,
}

const iconOptions = [
  { value: "home", label: "Home", icon: <Home className="h-4 w-4" /> },
  {
    value: "briefcase",
    label: "Office",
    icon: <Briefcase className="h-4 w-4" />,
  },
  {
    value: "plane",
    label: "Airport",
    icon: <Plane className="h-4 w-4" />,
  },
  {
    value: "building",
    label: "Building",
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    value: "education",
    label: "School",
    icon: <GraduationCap className="h-4 w-4" />,
  },
  {
    value: "gym",
    label: "Gym",
    icon: <Dumbbell className="h-4 w-4" />,
  },
  {
    value: "health",
    label: "Health",
    icon: <Heart className="h-4 w-4" />,
  },
  {
    value: "shopping",
    label: "Shopping",
    icon: <ShoppingBag className="h-4 w-4" />,
  },
]

export default function SavedLocationsPage() {
  const { user } = useAuth()
  const [locations, setLocations] = useState<SavedLocation[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] =
    useState<SavedLocation | null>(null)
  const [formLabel, setFormLabel] = useState("")
  const [formAddress, setFormAddress] = useState("")
  const [formIcon, setFormIcon] = useState("home")

  useEffect(() => {
    if (!user) {
      setLocations([])
      return
    }
    const unsub = listenToSavedLocations(user.uid, setLocations, () => setLocations([]))
    return unsub
  }, [user])

  async function handleAdd() {
    if (!user) return
    await createSavedLocation({
      userId: user.uid,
      label: formLabel,
      location: {
        formattedAddress: formAddress,
        latitude: 51.5,
        longitude: -0.12,
        placeId: "",
        postcode: "",
        city: "London",
        country: "United Kingdom",
      },
      icon: formIcon,
    })
    resetForm()
    setAddOpen(false)
  }

  async function handleEdit() {
    if (!selectedLocation) return
    await updateSavedLocation(selectedLocation.id, {
      label: formLabel,
      icon: formIcon,
      location: {
        ...selectedLocation.location,
        formattedAddress: formAddress,
      },
    })
    resetForm()
    setEditOpen(false)
  }

  async function handleDelete() {
    if (!selectedLocation) return
    await deleteSavedLocation(selectedLocation.id)
    setSelectedLocation(null)
    setDeleteOpen(false)
  }

  function openEdit(loc: SavedLocation) {
    setSelectedLocation(loc)
    setFormLabel(loc.label)
    setFormAddress(loc.location.formattedAddress)
    setFormIcon(loc.icon ?? "home")
    setEditOpen(true)
  }

  function openDelete(loc: SavedLocation) {
    setSelectedLocation(loc)
    setDeleteOpen(true)
  }

  function resetForm() {
    setFormLabel("")
    setFormAddress("")
    setFormIcon("home")
    setSelectedLocation(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">
            Saved Locations
          </h1>
          <p className="text-sm text-[#6B7280]">
            Manage your frequently used addresses for quick booking.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setAddOpen(true)
          }}
          className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
        >
          <Plus className="h-4 w-4" /> Add Location
        </Button>
      </div>

      {locations.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-16 w-16" />}
          title="No saved locations"
          description="Add your frequently used addresses to book faster."
          action={{
            label: "Add Location",
            onClick: () => {
              resetForm()
              setAddOpen(true)
            },
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="group relative rounded-xl border border-[#D9E0E8] bg-white p-5 transition-shadow hover:shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#172F52]/10 text-[#172F52]">
                  {iconMap[loc.icon ?? "home"] ?? (
                    <MapPin className="h-5 w-5" />
                  )}
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(loc)}
                    className="rounded-md p-1.5 text-[#6B7280] hover:bg-[#F5F7FA] hover:text-[#172F52]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => openDelete(loc)}
                    className="rounded-md p-1.5 text-[#6B7280] hover:bg-red-50 hover:text-[#DC2626]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="mb-1 text-sm font-semibold text-[#172F52]">
                {loc.label}
              </p>
              <p className="line-clamp-2 text-xs text-[#6B7280]">
                {loc.location.formattedAddress}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Saved Location"
        description="Save an address for quick booking next time."
        size="md"
      >
        <div className="space-y-4">
          <div>
            <Label>Label</Label>
            <Input
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              placeholder="e.g. Home, Office, Gym"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Address</Label>
            <Input
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              placeholder="Start typing an address..."
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Icon</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {iconOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormIcon(opt.value)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    formIcon === opt.value
                      ? "border-[#D4145A] bg-[#D4145A]/5 text-[#D4145A]"
                      : "border-[#D9E0E8] text-[#6B7280] hover:border-[#D4145A]/30"
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!formLabel || !formAddress}
              className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
            >
              Save Location
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Location"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <Label>Label</Label>
            <Input
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              placeholder="e.g. Home, Office, Gym"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Address</Label>
            <Input
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              placeholder="Start typing an address..."
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Icon</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {iconOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormIcon(opt.value)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    formIcon === opt.value
                      ? "border-[#D4145A] bg-[#D4145A]/5 text-[#D4145A]"
                      : "border-[#D9E0E8] text-[#6B7280] hover:border-[#D4145A]/30"
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!formLabel || !formAddress}
              className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
            >
              Update Location
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Location"
        description={`Are you sure you want to delete "${selectedLocation?.label}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
