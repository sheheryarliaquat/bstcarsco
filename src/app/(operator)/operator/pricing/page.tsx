"use client"

import { useState } from "react"
import {
  DollarSign,
  Edit,
  Plus,
  Save,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/shared/Modal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { DEMO_DATA, VEHICLE_TYPES } from "@/constants"
import type { PricingRule, VehicleType } from "@/types"

export default function OperatorPricingPage() {
  const [rules, setRules] = useState<PricingRule[]>(DEMO_DATA.pricingRules)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [saveConfirm, setSaveConfirm] = useState(false)
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null)
  const [editForm, setEditForm] = useState<Partial<PricingRule>>({})
  const [newRule, setNewRule] = useState({
    vehicleType: "" as VehicleType | "",
    baseFare: "3.50",
    perMile: "1.80",
    perMinute: "0.30",
    minimumFare: "5.00",
    bookingFee: "1.50",
    airportFee: "5.00",
    nightSurchargePercent: "20",
    weekendSurchargePercent: "10",
  })

  function openEdit(rule: PricingRule) {
    setEditingRule(rule)
    setEditForm({ ...rule })
    setEditModalOpen(true)
  }

  function saveEdit() {
    if (!editingRule) return
    setRules((prev) =>
      prev.map((r) => (r.id === editingRule.id ? { ...r, ...editForm } as PricingRule : r))
    )
    setEditModalOpen(false)
    setEditingRule(null)
    setSaveConfirm(true)
    setTimeout(() => setSaveConfirm(false), 3000)
  }

  function addNewRule() {
    const rule: PricingRule = {
      id: `pr-new-${Date.now()}`,
      operatorId: "op-001",
      vehicleType: newRule.vehicleType as VehicleType,
      baseFare: parseFloat(newRule.baseFare),
      perMile: parseFloat(newRule.perMile),
      perMinute: parseFloat(newRule.perMinute),
      minimumFare: parseFloat(newRule.minimumFare),
      bookingFee: parseFloat(newRule.bookingFee),
      airportFee: parseFloat(newRule.airportFee),
      nightSurchargePercent: parseFloat(newRule.nightSurchargePercent),
      weekendSurchargePercent: parseFloat(newRule.weekendSurchargePercent),
      peakTimeSurchargePercent: 0,
      congestionCharge: 0,
    }
    setRules((prev) => [...prev, rule])
    setAddModalOpen(false)
    setNewRule({
      vehicleType: "",
      baseFare: "3.50",
      perMile: "1.80",
      perMinute: "0.30",
      minimumFare: "5.00",
      bookingFee: "1.50",
      airportFee: "5.00",
      nightSurchargePercent: "20",
      weekendSurchargePercent: "10",
    })
  }

  function getTypeInfo(type: VehicleType) {
    return VEHICLE_TYPES.find((vt) => vt.value === type)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Pricing Management</h1>
          <p className="text-sm text-[#6B7280]">
            Configure fare rules for each vehicle type.
          </p>
        </div>
        <Button
          className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
          onClick={() => setAddModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Pricing Rule
        </Button>
      </div>

      {saveConfirm && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <Save className="h-4 w-4" />
          Pricing changes saved successfully.
        </div>
      )}

      {rules.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="h-16 w-16" />}
          title="No pricing rules"
          description="Add pricing rules for each vehicle type."
          action={{ label: "Add Rule", onClick: () => setAddModalOpen(true) }}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#D9E0E8] bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#D9E0E8] bg-[#F5F7FA]">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                  Vehicle Type
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                  Base Fare
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                  Per Mile
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                  Per Min
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                  Min Fare
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                  Booking Fee
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                  Airport Fee
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                  Night %
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                  Weekend %
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => {
                const typeInfo = getTypeInfo(rule.vehicleType)
                return (
                  <tr
                    key={rule.id}
                    className="border-b border-[#F5F7FA] last:border-0 hover:bg-[#F5F7FA]/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{typeInfo?.icon}</span>
                        <div>
                          <p className="font-medium text-[#172F52]">
                            {typeInfo?.label ?? rule.vehicleType}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#172F52]">
                      £{rule.baseFare.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-[#172F52]">
                      £{rule.perMile.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-[#172F52]">
                      £{rule.perMinute.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-[#172F52]">
                      £{rule.minimumFare.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-[#172F52]">
                      £{rule.bookingFee.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-[#172F52]">
                      £{rule.airportFee.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-[#172F52]">
                      {rule.nightSurchargePercent}%
                    </td>
                    <td className="px-4 py-3 text-[#172F52]">
                      {rule.weekendSurchargePercent}%
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#D9E0E8]"
                        onClick={() => openEdit(rule)}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Rule Modal */}
      <Modal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        title="Edit Pricing Rule"
        description={`Update pricing for ${editingRule ? getTypeInfo(editingRule.vehicleType)?.label : ""}`}
        size="lg"
      >
        <div className="space-y-4 pt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <PricingField
              label="Base Fare (£)"
              value={editForm.baseFare?.toString() ?? ""}
              onChange={(v) => setEditForm((p) => ({ ...p, baseFare: parseFloat(v) || 0 }))}
            />
            <PricingField
              label="Per Mile (£)"
              value={editForm.perMile?.toString() ?? ""}
              onChange={(v) => setEditForm((p) => ({ ...p, perMile: parseFloat(v) || 0 }))}
            />
            <PricingField
              label="Per Minute (£)"
              value={editForm.perMinute?.toString() ?? ""}
              onChange={(v) => setEditForm((p) => ({ ...p, perMinute: parseFloat(v) || 0 }))}
            />
            <PricingField
              label="Minimum Fare (£)"
              value={editForm.minimumFare?.toString() ?? ""}
              onChange={(v) => setEditForm((p) => ({ ...p, minimumFare: parseFloat(v) || 0 }))}
            />
            <PricingField
              label="Booking Fee (£)"
              value={editForm.bookingFee?.toString() ?? ""}
              onChange={(v) => setEditForm((p) => ({ ...p, bookingFee: parseFloat(v) || 0 }))}
            />
            <PricingField
              label="Airport Fee (£)"
              value={editForm.airportFee?.toString() ?? ""}
              onChange={(v) => setEditForm((p) => ({ ...p, airportFee: parseFloat(v) || 0 }))}
            />
            <PricingField
              label="Night Surcharge (%)"
              value={editForm.nightSurchargePercent?.toString() ?? ""}
              onChange={(v) => setEditForm((p) => ({ ...p, nightSurchargePercent: parseFloat(v) || 0 }))}
            />
            <PricingField
              label="Weekend Surcharge (%)"
              value={editForm.weekendSurchargePercent?.toString() ?? ""}
              onChange={(v) => setEditForm((p) => ({ ...p, weekendSurchargePercent: parseFloat(v) || 0 }))}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-[#F5F7FA] pt-4">
            <Button variant="outline" className="border-[#D9E0E8]" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90" onClick={saveEdit}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Rule Modal */}
      <Modal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        title="Add Pricing Rule"
        description="Create a new pricing rule for a vehicle type."
        size="lg"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Vehicle Type</label>
            <select
              value={newRule.vehicleType}
              onChange={(e) => setNewRule((p) => ({ ...p, vehicleType: e.target.value as VehicleType }))}
              className="flex h-9 w-full rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A] focus:ring-2 focus:ring-[#D4145A]/20"
            >
              <option value="">Select vehicle type...</option>
              {VEHICLE_TYPES.map((vt) => (
                <option key={vt.value} value={vt.value}>
                  {vt.icon} {vt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <PricingField
              label="Base Fare (£)"
              value={newRule.baseFare}
              onChange={(v) => setNewRule((p) => ({ ...p, baseFare: v }))}
            />
            <PricingField
              label="Per Mile (£)"
              value={newRule.perMile}
              onChange={(v) => setNewRule((p) => ({ ...p, perMile: v }))}
            />
            <PricingField
              label="Per Minute (£)"
              value={newRule.perMinute}
              onChange={(v) => setNewRule((p) => ({ ...p, perMinute: v }))}
            />
            <PricingField
              label="Minimum Fare (£)"
              value={newRule.minimumFare}
              onChange={(v) => setNewRule((p) => ({ ...p, minimumFare: v }))}
            />
            <PricingField
              label="Booking Fee (£)"
              value={newRule.bookingFee}
              onChange={(v) => setNewRule((p) => ({ ...p, bookingFee: v }))}
            />
            <PricingField
              label="Airport Fee (£)"
              value={newRule.airportFee}
              onChange={(v) => setNewRule((p) => ({ ...p, airportFee: v }))}
            />
            <PricingField
              label="Night Surcharge (%)"
              value={newRule.nightSurchargePercent}
              onChange={(v) => setNewRule((p) => ({ ...p, nightSurchargePercent: v }))}
            />
            <PricingField
              label="Weekend Surcharge (%)"
              value={newRule.weekendSurchargePercent}
              onChange={(v) => setNewRule((p) => ({ ...p, weekendSurchargePercent: v }))}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-[#F5F7FA] pt-4">
            <Button variant="outline" className="border-[#D9E0E8]" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
              onClick={addNewRule}
              disabled={!newRule.vehicleType}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function PricingField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string | number
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#172F52]">
        {label}
      </label>
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9"
      />
    </div>
  )
}
