"use client"

import { useMemo, useState } from "react"
import { Car, Clock, MapPin, Plane, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VEHICLE_TYPES } from "@/constants"
import type { Booking, Driver } from "@/types"
import { BookingStatus } from "@/types"

export type BoardBooking = Booking & { id: string }

const CANCELLED = new Set<BookingStatus>([
  BookingStatus.CancelledByPassenger,
  BookingStatus.CancelledByDriver,
  BookingStatus.CancelledByOperator,
  BookingStatus.CancelledByAdmin,
  BookingStatus.NoShow,
])
const NOT_READY = new Set<BookingStatus>([BookingStatus.PendingPayment, BookingStatus.PaymentFailed])
const ON_THE_WAY = new Set<BookingStatus>([
  BookingStatus.DriverEnRoute,
  BookingStatus.DriverArrived,
  BookingStatus.PassengerOnboard,
  BookingStatus.TripStarted,
])

type ColumnKey = "unassigned" | "assigned" | "onroute" | "completed"

function columnFor(b: BoardBooking): ColumnKey | null {
  if (CANCELLED.has(b.bookingStatus) || NOT_READY.has(b.bookingStatus)) return null
  if (b.bookingStatus === BookingStatus.TripCompleted) return "completed"
  if (ON_THE_WAY.has(b.bookingStatus)) return "onroute"
  return b.driverId ? "assigned" : "unassigned"
}

const COLUMNS: { key: ColumnKey; title: string; dot: string }[] = [
  { key: "unassigned", title: "Unassigned", dot: "bg-[#D4145A]" },
  { key: "assigned", title: "Assigned", dot: "bg-[#172F52]" },
  { key: "onroute", title: "On the way", dot: "bg-amber-500" },
  { key: "completed", title: "Completed", dot: "bg-green-600" },
]

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function vehicleLabel(type: string): string {
  return VEHICLE_TYPES.find((v) => v.value === type)?.label ?? type
}

interface DispatchBoardProps {
  bookings: BoardBooking[]
  drivers: Driver[]
  vehicleInfo: Record<string, string>
  onAssign: (booking: BoardBooking, driver: Driver) => Promise<void>
  onSetStatus: (booking: BoardBooking, status: BookingStatus) => Promise<void>
  onUnassign: (booking: BoardBooking) => Promise<void>
}

export function DispatchBoard({ bookings, drivers, vehicleInfo, onAssign, onSetStatus, onUnassign }: DispatchBoardProps) {
  const [date, setDate] = useState(todayISO)
  const [allDates, setAllDates] = useState(false)
  const [search, setSearch] = useState("")
  const [picks, setPicks] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  const driverById = useMemo(() => new Map(drivers.map((d) => [d.uid, d])), [drivers])
  // Offline drivers can still be pre-assigned to a later job, so list everyone, available first.
  const driverOptions = useMemo(
    () =>
      [...drivers].sort((a, b) => {
        const rank = (d: Driver) => (d.status === "online" ? 0 : d.status === "busy" ? 1 : 2)
        return rank(a) - rank(b) || a.firstName.localeCompare(b.firstName)
      }),
    [drivers]
  )

  const columns = useMemo(() => {
    const q = search.trim().toLowerCase()
    const grouped: Record<ColumnKey, BoardBooking[]> = { unassigned: [], assigned: [], onroute: [], completed: [] }
    for (const b of bookings) {
      if (!allDates && b.date !== date) continue
      if (
        q &&
        ![b.bookingNumber, b.pickup?.formattedAddress, b.destination?.formattedAddress, b.pickup?.postcode]
          .filter(Boolean)
          .some((t) => String(t).toLowerCase().includes(q))
      )
        continue
      const col = columnFor(b)
      if (col) grouped[col].push(b)
    }
    for (const list of Object.values(grouped)) {
      list.sort((a, b) => `${a.date} ${a.pickupTime}`.localeCompare(`${b.date} ${b.pickupTime}`))
    }
    return grouped
  }, [bookings, date, allDates, search])

  const stats = [
    { label: "Bookings", value: Object.values(columns).reduce((n, l) => n + l.length, 0) },
    { label: "Need a driver", value: columns.unassigned.length },
    { label: "Active now", value: columns.assigned.length + columns.onroute.length },
    { label: "Completed", value: columns.completed.length },
  ]

  async function run(id: string, fn: () => Promise<void>) {
    setBusyId(id)
    try {
      await fn()
    } catch (err) {
      console.error("Dispatch action failed", err)
      alert("That change could not be saved. Please try again.")
    } finally {
      setBusyId(null)
    }
  }

  function driverName(id: string) {
    const d = driverById.get(id)
    return d ? `${d.firstName} ${d.lastName}` : "Driver"
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-medium text-[#172F52]">
          Date
          <Input
            type="date"
            value={date}
            disabled={allDates}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 h-9 w-44"
          />
        </label>
        <label className="flex h-9 items-center gap-2 text-sm text-[#172F52]">
          <input
            type="checkbox"
            checked={allDates}
            onChange={(e) => setAllDates(e.target.checked)}
            className="h-4 w-4 accent-[#D4145A]"
          />
          All dates
        </label>
        <Input
          aria-label="Search bookings"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ref, address or postcode"
          className="h-9 w-64"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-[#D9E0E8] bg-white px-4 py-3">
            <p className="text-xs font-medium text-[#6B7280]">{s.label}</p>
            <p className="text-2xl font-bold text-[#172F52]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => (
          <section key={col.key} className="flex min-h-[360px] flex-col gap-3 rounded-xl bg-[#EEF1F5] p-3">
            <h3 className="flex items-center justify-between px-1 text-sm font-bold text-[#172F52]">
              <span className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", col.dot)} />
                {col.title}
              </span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs text-[#6B7280]">{columns[col.key].length}</span>
            </h3>

            {columns[col.key].length === 0 && (
              <p className="px-1 py-6 text-center text-xs text-[#6B7280]">Nothing here</p>
            )}

            {columns[col.key].map((b) => {
              const busy = busyId === b.id
              const pick = picks[b.id] ?? driverOptions[0]?.uid ?? ""
              return (
                <article key={b.id} className="space-y-2.5 rounded-lg bg-white p-3 shadow-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="flex items-center gap-1 text-lg font-bold text-[#172F52]">
                      <Clock className="h-4 w-4 text-[#6B7280]" />
                      {b.pickupTime}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-[#6B7280]">{b.bookingNumber}</span>
                  </div>
                  {allDates && <p className="text-xs text-[#6B7280]">{b.date}</p>}
                  <div className="space-y-1 text-xs text-[#172F52]">
                    <p className="flex gap-1.5">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-[#D4145A]" />
                      <span className="line-clamp-2">{b.pickup?.formattedAddress}</span>
                    </p>
                    <p className="flex gap-1.5">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-green-600" />
                      <span className="line-clamp-2">{b.destination?.formattedAddress}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <span className="rounded-full bg-[#F5F7FA] px-2 py-0.5 font-semibold text-[#172F52]">
                      <Car className="mr-1 inline h-3 w-3" />
                      {vehicleLabel(b.vehicleType)}
                    </span>
                    <span className="rounded-full bg-[#F5F7FA] px-2 py-0.5 text-[#172F52]">
                      <Users className="mr-1 inline h-3 w-3" />
                      {b.passengers}
                    </span>
                    <span className="rounded-full bg-[#F5F7FA] px-2 py-0.5 font-semibold text-[#172F52]">
                      £{(b.total ?? 0).toFixed(2)}
                    </span>
                    {b.specialRequirements?.flightNumber && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">
                        <Plane className="mr-1 inline h-3 w-3" />
                        {b.specialRequirements.flightNumber}
                      </span>
                    )}
                    {b.specialRequirements?.meetAndGreet && (
                      <span className="rounded-full bg-[#F5F7FA] px-2 py-0.5 text-[#172F52]">Meet &amp; greet</span>
                    )}
                    {b.specialRequirements?.childSeat && (
                      <span className="rounded-full bg-[#F5F7FA] px-2 py-0.5 text-[#172F52]">Child seat</span>
                    )}
                  </div>

                  {col.key === "unassigned" &&
                    (driverOptions.length === 0 ? (
                      <p className="text-xs text-[#6B7280]">No drivers added yet.</p>
                    ) : (
                      <>
                        <label className="block text-[11px] font-semibold text-[#6B7280]">
                          Driver and car
                          <select
                            value={pick}
                            onChange={(e) => setPicks((p) => ({ ...p, [b.id]: e.target.value }))}
                            className="mt-1 h-9 w-full rounded-md border border-[#D9E0E8] bg-white px-2 text-xs text-[#172F52] outline-none focus:border-[#D4145A]"
                          >
                            {driverOptions.map((d) => (
                              <option key={d.uid} value={d.uid}>
                                {d.firstName} {d.lastName}
                                {d.vehicleId && vehicleInfo[d.vehicleId] ? ` · ${vehicleInfo[d.vehicleId]}` : ""}
                                {d.status === "online" ? "" : d.status === "busy" ? " (on a job)" : " (offline)"}
                              </option>
                            ))}
                          </select>
                        </label>
                        <Button
                          size="sm"
                          disabled={busy || !pick}
                          onClick={() => {
                            const driver = driverById.get(pick)
                            if (driver) run(b.id, () => onAssign(b, driver))
                          }}
                          className="w-full bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
                        >
                          {busy ? "Dispatching..." : "Dispatch job"}
                        </Button>
                      </>
                    ))}

                  {col.key !== "unassigned" && b.driverId && (
                    <div className="flex items-center gap-2 rounded-md bg-[#F5F7FA] px-2 py-1.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#172F52] text-[11px] font-bold text-white">
                        {driverName(b.driverId)
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <span className="text-xs text-[#172F52]">
                        {driverName(b.driverId)}
                        {b.vehicleId && vehicleInfo[b.vehicleId] ? ` · ${vehicleInfo[b.vehicleId]}` : ""}
                      </span>
                    </div>
                  )}

                  {col.key === "assigned" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => run(b.id, () => onSetStatus(b, BookingStatus.DriverEnRoute))}
                        className="flex-1 bg-[#172F52] text-white hover:bg-[#172F52]/90"
                      >
                        Driver on the way
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => run(b.id, () => onUnassign(b))}>
                        Unassign
                      </Button>
                    </div>
                  )}
                  {col.key === "onroute" && (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => run(b.id, () => onSetStatus(b, BookingStatus.TripCompleted))}
                      className="w-full bg-green-700 text-white hover:bg-green-700/90"
                    >
                      Mark completed
                    </Button>
                  )}
                </article>
              )
            })}
          </section>
        ))}
      </div>
    </div>
  )
}
