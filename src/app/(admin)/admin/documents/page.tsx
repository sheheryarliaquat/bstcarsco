"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  Clock,
  Download,
  Plus,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { Modal } from "@/components/shared/Modal"
import { DocumentUploadModal } from "@/components/shared/DocumentUploadModal"
import { DOCUMENT_TYPES } from "@/constants"
import { useAuth } from "@/hooks/useAuth"
import { listenToDrivers } from "@/lib/services/driver-service"
import {
  daysUntilExpiry,
  effectiveStatus,
  listenToAllDriverDocuments,
  reviewDriverDocument,
} from "@/lib/services/driver-document-service"
import type { DocumentStatus, Driver, DriverDocument } from "@/types"

interface DocumentRecord extends DriverDocument {
  driverId: string
  driverName: string
  /** Stored status, with 'expired' derived from the expiry date. */
  status: DocumentStatus
}

const EXPIRY_SOON_DAYS = 30

function daysUntil(dateStr: string): number {
  return daysUntilExpiry(dateStr) ?? Number.POSITIVE_INFINITY
}

function fmt(value?: string, withTime = false) {
  if (!value) return "-"
  const d = new Date(value)
  if (isNaN(d.getTime())) return "-"
  return withTime
    ? d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export default function AdminDocumentsPage() {
  const { user } = useAuth()
  const reviewerId = user?.uid ?? "admin"
  const [search, setSearch] = useState("")
  const [tabFilter, setTabFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [detailTarget, setDetailTarget] = useState<DocumentRecord | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<DocumentRecord | null>(null)
  const [rejectNotes, setRejectNotes] = useState("")
  const [rawDocs, setRawDocs] = useState<DriverDocument[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addDriverId, setAddDriverId] = useState("")
  const [uploadOpen, setUploadOpen] = useState(false)

  useEffect(() => {
    const unsubDocs = listenToAllDriverDocuments(
      (docs) => { setRawDocs(docs); setLoading(false) },
      (err) => { setError(err.message || "Could not load documents."); setLoading(false) }
    )
    const unsubDrivers = listenToDrivers((d) => setDrivers(d), () => setDrivers([]))
    return () => { unsubDocs(); unsubDrivers() }
  }, [])

  const driverNames = useMemo(() => {
    const map: Record<string, string> = {}
    drivers.forEach((d) => { map[d.uid] = `${d.firstName} ${d.lastName}`.trim() })
    return map
  }, [drivers])

  const documents: DocumentRecord[] = useMemo(
    () =>
      rawDocs
        .map((d) => ({
          ...d,
          driverId: d.driverId ?? "",
          driverName: driverNames[d.driverId ?? ""] || d.driverName || "Unknown driver",
          documentNumber: d.documentNumber ?? "",
          status: effectiveStatus(d),
        }))
        .sort((a, b) => (b.uploadedAt ?? "").localeCompare(a.uploadedAt ?? "")),
    [rawDocs, driverNames]
  )

  // Keep the open detail modal in sync with live updates.
  const detail = detailTarget ? documents.find((d) => d.id === detailTarget.id) ?? detailTarget : null

  const filtered = useMemo(() => {
    let result = [...documents]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (d) =>
          d.driverName.toLowerCase().includes(q) ||
          d.documentType.toLowerCase().includes(q) ||
          d.documentNumber.toLowerCase().includes(q)
      )
    }
    if (tabFilter !== "all") result = result.filter((d) => d.status === tabFilter)
    if (typeFilter !== "all") result = result.filter((d) => d.documentType === typeFilter)
    return result
  }, [documents, search, tabFilter, typeFilter])

  const expiringSoon = useMemo(
    () =>
      documents
        .filter((d) => d.status === "approved" && daysUntil(d.expiryDate) <= EXPIRY_SOON_DAYS && daysUntil(d.expiryDate) > 0)
        .sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate)),
    [documents]
  )

  const pendingCount = documents.filter((d) => d.status === "pending").length
  const approvedCount = documents.filter((d) => d.status === "approved").length
  const rejectedCount = documents.filter((d) => d.status === "rejected").length
  const expiredCount = documents.filter((d) => d.status === "expired").length

  async function review(doc: DocumentRecord, status: "approved" | "rejected", notes = "") {
    setBusyId(doc.id)
    setError("")
    try {
      await reviewDriverDocument(doc.id, status, reviewerId, notes)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the document.")
      return false
    } finally {
      setBusyId(null)
    }
  }

  const addDriver = drivers.find((d) => d.uid === addDriverId)

  const statusTabs = [
    { key: "all", label: "All", count: documents.length },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "approved", label: "Approved", count: approvedCount },
    { key: "rejected", label: "Rejected", count: rejectedCount },
    { key: "expired", label: "Expired", count: expiredCount },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Documents</h1>
          <p className="text-sm text-[#5B6577]">Manage driver documents and verification</p>
        </div>
        <Button className="bg-[#1F4FD8] text-white hover:bg-[#1F4FD8]/90" onClick={() => { setAddDriverId(""); setAddOpen(true) }}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Document
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DashboardCard title="Total Documents" value={documents.length} icon={<FileText className="h-5 w-5" />} />
        <DashboardCard title="Pending Review" value={pendingCount} icon={<Clock className="h-5 w-5" />} />
        <DashboardCard title="Approved" value={approvedCount} icon={<CheckCircle className="h-5 w-5" />} />
        <DashboardCard title="Expiring Soon" value={expiringSoon.length} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      {expiringSoon.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-800">Documents Expiring Within 30 Days</h3>
          </div>
          <div className="space-y-2">
            {expiringSoon.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#0F1B2D]">{doc.driverName}</span>
                  <span className="text-xs text-[#5B6577]">{doc.documentType}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-amber-700">{daysUntil(doc.expiryDate)} days left</span>
                  <p className="text-xs text-[#5B6577]">Expires: {fmt(doc.expiryDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1 rounded-lg bg-[#F4F6F9] p-1">
        {statusTabs.map((st) => (
          <button
            key={st.key}
            onClick={() => setTabFilter(st.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tabFilter === st.key
                ? "bg-white text-[#0F1B2D] shadow-sm"
                : "text-[#5B6577] hover:text-[#0F1B2D]"
            )}
          >
            {st.label}
            <span className={cn(
              "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
              tabFilter === st.key ? "bg-[#0F1B2D] text-white" : "bg-[#E2E6EC] text-[#5B6577]"
            )}>
              {st.count}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[#E2E6EC] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6577]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by driver, document type, number..."
              className="h-9 pl-9"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]"
          >
            <option value="all">All document types</option>
            {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-[#E2E6EC] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E2E6EC] bg-[#F4F6F9]">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Driver</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Document Type</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Number</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Expiry</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Uploaded</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5B6577]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#5B6577]">
                    {loading ? "Loading documents…" : documents.length === 0 ? "No documents yet — drivers can upload from their Documents page, or click Add Document." : "No documents match your filters"}
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-[#F4F6F9] transition-colors last:border-0 hover:bg-[#F4F6F9]/50"
                  >
                    <td className="px-4 py-3 font-medium text-[#0F1B2D]">{doc.driverName}</td>
                    <td className="px-4 py-3 text-[#5B6577]">{doc.documentType}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#5B6577]">{doc.documentNumber || "-"}</td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-sm text-[#0F1B2D]">
                          {fmt(doc.expiryDate)}
                        </span>
                        {daysUntil(doc.expiryDate) <= EXPIRY_SOON_DAYS && daysUntil(doc.expiryDate) > 0 && doc.status === "approved" && (
                          <span className="ml-2 text-xs text-amber-600">({daysUntil(doc.expiryDate)}d)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                          doc.status === "approved" && "bg-green-50 text-green-700",
                          doc.status === "pending" && "bg-amber-50 text-amber-700",
                          doc.status === "rejected" && "bg-red-50 text-red-700",
                          doc.status === "expired" && "bg-gray-100 text-gray-600"
                        )}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#5B6577]">
                      {fmt(doc.uploadedAt)}
                      {doc.uploadedBy === "admin" && <span className="ml-1 text-[10px] uppercase">(admin)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#E2E6EC]"
                          onClick={() => { setDetailTarget(doc); setDetailOpen(true) }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {doc.fileURL && (
                          <a
                            href={doc.fileURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open file"
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-[#E2E6EC]")}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {doc.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              title="Approve"
                              disabled={busyId === doc.id}
                              className="border-[#168A55] text-[#168A55] hover:bg-[#168A55]/5"
                              onClick={() => review(doc, "approved")}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              title="Reject"
                              disabled={busyId === doc.id}
                              className="border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/5"
                              onClick={() => { setRejectTarget(doc); setRejectNotes("") }}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={`Document: ${detail?.documentType ?? ""}`}
        size="lg"
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Driver" value={detail.driverName} />
              <Field label="Document Type" value={detail.documentType} />
              <Field label="Document Number" value={detail.documentNumber || "-"} mono />
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Status</p>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                    detail.status === "approved" && "bg-green-50 text-green-700",
                    detail.status === "pending" && "bg-amber-50 text-amber-700",
                    detail.status === "rejected" && "bg-red-50 text-red-700",
                    detail.status === "expired" && "bg-gray-100 text-gray-600"
                  )}
                >
                  {detail.status}
                </span>
              </div>
              <Field label="Issue Date" value={fmt(detail.issueDate)} />
              <Field label="Expiry Date" value={fmt(detail.expiryDate)} />
              <Field label="Uploaded" value={`${fmt(detail.uploadedAt, true)}${detail.uploadedBy === "admin" ? " (by admin)" : ""}`} />
              {detail.reviewedAt && <Field label="Reviewed" value={fmt(detail.reviewedAt, true)} />}
            </div>
            {detail.status === "rejected" && detail.notes && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#5B6577]">Rejection reason</p>
                <p className="text-sm text-[#DC2626]">{detail.notes}</p>
              </div>
            )}

            <div className="rounded-lg bg-[#F4F6F9] p-4">
              {detail.fileURL ? (
                <>
                  {detail.fileType?.startsWith("image/") && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={detail.fileURL} alt={detail.documentType} className="mb-3 max-h-80 w-full rounded-md bg-white object-contain" />
                  )}
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 shrink-0 text-[#5B6577]" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#0F1B2D]">{detail.fileName || `${detail.documentType} file`}</p>
                      <p className="text-xs text-[#5B6577]">{detail.fileType === "application/pdf" ? "PDF document" : "Uploaded file"}</p>
                    </div>
                    <a
                      href={detail.fileURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "ml-auto border-[#E2E6EC]")}
                    >
                      <Download className="mr-1 h-3.5 w-3.5" />
                      Open / Download
                    </a>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#5B6577]">No file attached to this document.</p>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-[#F4F6F9] pt-4">
              <Button variant="outline" onClick={() => setUploadOpen(true)}>
                <Upload className="mr-1.5 h-4 w-4" /> Replace file
              </Button>
              {detail.status !== "rejected" && (
                <Button
                  variant="outline"
                  className="border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/5"
                  disabled={busyId === detail.id}
                  onClick={() => { setRejectTarget(detail); setRejectNotes("") }}
                >
                  <XCircle className="mr-1.5 h-4 w-4" /> Reject
                </Button>
              )}
              {detail.status !== "approved" && (
                <Button
                  className="bg-[#168A55] text-white hover:bg-[#168A55]/90"
                  disabled={busyId === detail.id}
                  onClick={() => review(detail, "approved")}
                >
                  <CheckCircle className="mr-1.5 h-4 w-4" /> Approve
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Replace file for the document open in the detail modal */}
      {detail && (
        <DocumentUploadModal
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          driverId={detail.driverId}
          driverName={detail.driverName}
          documentType={detail.documentType}
          existingDocuments={documents.filter((d) => d.driverId === detail.driverId)}
          mode="admin"
          reviewerId={reviewerId}
        />
      )}

      {/* Add Document: pick a driver, then upload */}
      <Modal
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Document"
        description="Choose the driver this document belongs to."
        size="md"
      >
        <div className="space-y-4">
          <select
            value={addDriverId}
            onChange={(e) => setAddDriverId(e.target.value)}
            className="h-10 w-full rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]"
          >
            <option value="">Select a driver…</option>
            {[...drivers]
              .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
              .map((d) => (
                <option key={d.uid} value={d.uid}>
                  {d.firstName} {d.lastName}{d.email ? ` — ${d.email}` : ""}
                </option>
              ))}
          </select>
          <div className="flex justify-end gap-2 border-t border-[#F4F6F9] pt-4">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#1F4FD8] text-white hover:bg-[#1F4FD8]/90"
              disabled={!addDriverId}
              onClick={() => { setAddOpen(false); setDetailTarget(null); setUploadOpen(false); setTimeout(() => setUploadOpen(true), 0) }}
            >
              Continue
            </Button>
          </div>
        </div>
      </Modal>

      {addDriver && !detail && (
        <DocumentUploadModal
          open={uploadOpen}
          onOpenChange={(o) => { setUploadOpen(o); if (!o) setAddDriverId("") }}
          driverId={addDriver.uid}
          driverName={`${addDriver.firstName} ${addDriver.lastName}`}
          existingDocuments={documents.filter((d) => d.driverId === addDriver.uid)}
          mode="admin"
          reviewerId={reviewerId}
        />
      )}

      {/* Reject Modal */}
      <Modal
        open={!!rejectTarget}
        onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectNotes("") } }}
        title="Reject Document"
        size="md"
      >
        {rejectTarget && (
          <div className="space-y-4">
            <p className="text-sm text-[#5B6577]">
              Rejecting the <span className="font-semibold text-[#0F1B2D]">{rejectTarget.documentType}</span> for{" "}
              <span className="font-semibold text-[#0F1B2D]">{rejectTarget.driverName}</span>. The reason is shown to the driver on their Documents page.
            </p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F1B2D]">Reason for Rejection</label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                className="w-full rounded-lg border border-[#E2E6EC] px-3 py-2 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8]"
                rows={3}
                placeholder="e.g. Photo is blurry, please upload a clearer copy"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-[#F4F6F9] pt-4">
              <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectNotes("") }}>
                Cancel
              </Button>
              <Button
                className="bg-[#DC2626] text-white hover:bg-[#DC2626]/90"
                disabled={!rejectNotes.trim() || busyId === rejectTarget.id}
                onClick={async () => {
                  const ok = await review(rejectTarget, "rejected", rejectNotes)
                  if (ok) { setRejectTarget(null); setRejectNotes("") }
                }}
              >
                Reject Document
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase text-[#5B6577]">{label}</p>
      <p className={cn("text-sm text-[#0F1B2D]", mono ? "font-mono" : "font-medium")}>{value}</p>
    </div>
  )
}
