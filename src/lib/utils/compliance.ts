import type { Vehicle } from '@/types'

export const EXPIRY_WARNING_DAYS = 30

export type ExpiryState = 'missing' | 'expired' | 'due' | 'ok'

/** Whole days from today until a YYYY-MM-DD date (negative once passed). */
export function daysUntil(date: string, now: Date = new Date()): number {
  const target = new Date(`${date}T00:00:00`)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export function expiryState(date: string | undefined, now: Date = new Date()): ExpiryState {
  if (!date) return 'missing'
  const days = daysUntil(date, now)
  if (Number.isNaN(days)) return 'missing'
  if (days < 0) return 'expired'
  if (days <= EXPIRY_WARNING_DAYS) return 'due'
  return 'ok'
}

export const VEHICLE_COMPLIANCE_FIELDS = [
  { key: 'motExpiry', label: 'MOT' },
  { key: 'insuranceExpiry', label: 'Insurance' },
  { key: 'phvLicenceExpiry', label: 'PHV licence' },
] as const

export type VehicleComplianceKey = (typeof VEHICLE_COMPLIANCE_FIELDS)[number]['key']

const SEVERITY: Record<ExpiryState, number> = { expired: 3, due: 2, missing: 1, ok: 0 }

/** The most urgent compliance problem on a vehicle, with the document it relates to. */
export function vehicleCompliance(v: Vehicle, now: Date = new Date()) {
  let worst: { state: ExpiryState; label: string; date?: string } = { state: 'ok', label: '' }
  for (const f of VEHICLE_COMPLIANCE_FIELDS) {
    const date = v[f.key]
    const state = expiryState(date, now)
    if (SEVERITY[state] > SEVERITY[worst.state]) worst = { state, label: f.label, date }
  }
  return worst
}

export function formatUKDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
