"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  Clock,
  Shield,
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DashboardCard } from "@/components/shared/DashboardCard"
import { Modal } from "@/components/shared/Modal"
import { DEMO_DATA, DOCUMENT_TYPES } from "@/constants"
import type { DocumentStatus } from "@/types"

interface DocumentRecord {
  id: string
  driverId: string
  driverName: string
  documentType: string
  documentNumber: string
  issueDate: string
  expiryDate: string
  fileURL: string
  status: DocumentStatus
  uploadedAt: string
  reviewedAt?: string
  notes?: string
}

const EXPIRY_SOON_DAYS = 30

function daysUntil(dateStr: string): number {
  const now = new Date()
  const exp = new Date(dateStr)
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

const DEMO_DOCUMENTS: DocumentRecord[] = [
  ...DEMO_DATA.drivers.flatMap((d) => [
    {
      id: `doc-${d.uid}-licence`,
      driverId: d.uid,
      driverName: `${d.firstName} ${d.lastName}`,
      documentType: "Driving Licence",
      documentNumber: d.licenceNumber,
      issueDate: "2022-03-15",
      expiryDate: "2027-03-15",
      fileURL: "/documents/licence.pdf",
      status: "approved" as DocumentStatus,
      uploadedAt: "2024-06-15T10:00:00Z",
      reviewedAt: "2024-06-16T12:00:00Z",
    },
    {
      id: `doc-${d.uid}-insurance`,
      driverId: d.uid,
      driverName: `${d.firstName} ${d.lastName}`,
      documentType: "Insurance Certificate",
      documentNumber: `INS-${d.licenceNumber.slice(0, 8)}`,
      issueDate: "2026-01-01",
      expiryDate: "2027-01-01",
      fileURL: "/documents/insurance.pdf",
      status: "approved" as DocumentStatus,
      uploadedAt: "2026-01-02T09:00:00Z",
      reviewedAt: "2026-01-03T11:00:00Z",
    },
    {
      id: `doc-${d.uid}-mot`,
      driverId: d.uid,
      driverName: `${d.firstName} ${d.lastName}`,
      documentType: "MOT Certificate",
      documentNumber: `MOT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      issueDate: "2026-06-01",
      expiryDate: d.uid === "drv-003" ? "2026-09-10" : "2027-06-01",
      fileURL: "/documents/mot.pdf",
      status: d.uid === "drv-003" ? ("pending" as DocumentStatus) : ("approved" as DocumentStatus),
      uploadedAt: d.uid === "drv-003" ? "2026-08-20T14:00:00Z" : "2026-06-02T09:00:00Z",
      reviewedAt: d.uid === "drv-003" ? undefined : "2026-06-03T11:00:00Z",
    },
    {
      id: `doc-${d.uid}-phv`,
      driverId: d.uid,
      driverName: `${d.firstName} ${d.lastName}`,
      documentType: "PHV Licence",
      documentNumber: `PHV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      issueDate: "2025-07-01",
      expiryDate: d.uid === "drv-002" ? "2026-09-01" : "2027-07-01",
      fileURL: "/documents/phv.pdf",
      status: d.uid === "drv-002" ? ("rejected" as DocumentStatus) : ("approved" as DocumentStatus),
      uploadedAt: "2025-07-02T09:00:00Z",
      reviewedAt: d.uid === "drv-002" ? "2025-07-05T11:00:00Z" : "2025-07-03T11:00:00Z",
      notes: d.uid === "drv-002" ? "Document quality too low, please resubmit" : undefined,
    },
  ]),
]

export default function AdminDocumentsPage() {
  const [search, setSearch] = useState("")
  const [tabFilter, setTabFilter] = useState<string>("all")
  const [detailTarget, setDetailTarget] = useState<DocumentRecord | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<DocumentRecord | null>(null)
  const [rejectNotes, setRejectNotes] = useState("")

  const filtered = useMemo(() => {
    let result = [...DEMO_DOCUMENTS]
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
    return result
  }, [search, tabFilter])

  const expiringSoon = useMemo(() => {
    return DEMO_DOCUMENTS.filter(
      (d) => d.status === "approved" && daysUntil(d.expiryDate) <= EXPIRY_SOON_DAYS && daysUntil(d.expiryDate) > 0
    )
  }, [])

  const pendingCount = DEMO_DOCUMENTS.filter((d) => d.status === "pending").length
  const approvedCount = DEMO_DOCUMENTS.filter((d) => d.status === "approved").length
  const rejectedCount = DEMO_DOCUMENTS.filter((d) => d.status === "rejected").length
  const expiredCount = DEMO_DOCUMENTS.filter((d) => daysUntil(d.expiryDate) <= 0).length

  const statusTabs = [
    { key: "all", label: "All", count: DEMO_DOCUMENTS.length },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "approved", label: "Approved", count: approvedCount },
    { key: "rejected", label: "Rejected", count: rejectedCount },
    { key: "expired", label: "Expired", count: expiredCount },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Documents</h1>
          <p className="text-sm text-[#6B7280]">Manage driver documents and verification</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DashboardCard title="Total Documents" value={DEMO_DOCUMENTS.length} icon={<FileText className="h-5 w-5" />} />
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
                  <span className="text-sm font-medium text-[#172F52]">{doc.driverName}</span>
                  <span className="text-xs text-[#6B7280]">{doc.documentType}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-amber-700">{daysUntil(doc.expiryDate)} days left</span>
                  <p className="text-xs text-[#6B7280]">Expires: {new Date(doc.expiryDate).toLocaleDateString("en-GB")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 rounded-lg bg-[#F5F7FA] p-1">
        {statusTabs.map((st) => (
          <button
            key={st.key}
            onClick={() => setTabFilter(st.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tabFilter === st.key
                ? "bg-white text-[#172F52] shadow-sm"
                : "text-[#6B7280] hover:text-[#172F52]"
            )}
          >
            {st.label}
            <span className={cn(
              "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
              tabFilter === st.key ? "bg-[#172F52] text-white" : "bg-[#D9E0E8] text-[#6B7280]"
            )}>
              {st.count}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[#D9E0E8] bg-white p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by driver, document type..."
            className="h-9 pl-9"
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#D9E0E8] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#D9E0E8] bg-[#F5F7FA]">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Driver</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Document Type</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Number</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Expiry</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Uploaded</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#6B7280]">
                    No documents found
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-[#F5F7FA] transition-colors last:border-0 hover:bg-[#F5F7FA]/50"
                  >
                    <td className="px-4 py-3 font-medium text-[#172F52]">{doc.driverName}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{doc.documentType}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#6B7280]">{doc.documentNumber}</td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-sm text-[#172F52]">
                          {new Date(doc.expiryDate).toLocaleDateString("en-GB")}
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
                    <td className="px-4 py-3 text-xs text-[#6B7280]">
                      {new Date(doc.uploadedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#D9E0E8]"
                          onClick={() => { setDetailTarget(doc); setDetailOpen(true) }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {doc.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#168A55] text-[#168A55] hover:bg-[#168A55]/5"
                              onClick={() => {}}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
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
        title={`Document: ${detailTarget?.documentType}`}
        size="lg"
      >
        {detailTarget && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Driver</p>
                <p className="text-sm font-medium text-[#172F52]">{detailTarget.driverName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Document Type</p>
                <p className="text-sm font-medium text-[#172F52]">{detailTarget.documentType}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Document Number</p>
                <p className="font-mono text-sm text-[#172F52]">{detailTarget.documentNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Status</p>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                    detailTarget.status === "approved" && "bg-green-50 text-green-700",
                    detailTarget.status === "pending" && "bg-amber-50 text-amber-700",
                    detailTarget.status === "rejected" && "bg-red-50 text-red-700"
                  )}
                >
                  {detailTarget.status}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Issue Date</p>
                <p className="text-sm text-[#172F52]">{new Date(detailTarget.issueDate).toLocaleDateString("en-GB")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Expiry Date</p>
                <p className="text-sm text-[#172F52]">{new Date(detailTarget.expiryDate).toLocaleDateString("en-GB")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Uploaded</p>
                <p className="text-sm text-[#172F52]">
                  {new Date(detailTarget.uploadedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {detailTarget.reviewedAt && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-[#6B7280]">Reviewed</p>
                  <p className="text-sm text-[#172F52]">
                    {new Date(detailTarget.reviewedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              )}
            </div>
            {detailTarget.notes && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-[#6B7280]">Notes</p>
                <p className="text-sm text-[#DC2626]">{detailTarget.notes}</p>
              </div>
            )}
            <div className="rounded-lg bg-[#F5F7FA] p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-[#6B7280]" />
                <div>
                  <p className="text-sm font-medium text-[#172F52]">{detailTarget.documentType}.pdf</p>
                  <p className="text-xs text-[#6B7280]">Uploaded document file</p>
                </div>
                <Button variant="outline" size="sm" className="ml-auto border-[#D9E0E8]">
                  <Download className="mr-1 h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={!!rejectTarget}
        onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectNotes("") } }}
        title="Reject Document"
        size="md"
      >
        {rejectTarget && (
          <div className="space-y-4">
            <p className="text-sm text-[#6B7280]">
              Rejecting the <span className="font-semibold text-[#172F52]">{rejectTarget.documentType}</span> for{" "}
              <span className="font-semibold text-[#172F52]">{rejectTarget.driverName}</span>. The driver will be notified.
            </p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Reason for Rejection</label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                className="w-full rounded-lg border border-[#D9E0E8] px-3 py-2 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
                rows={3}
                placeholder="Enter reason for rejection..."
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-[#F5F7FA] pt-4">
              <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectNotes("") }}>
                Cancel
              </Button>
              <Button
                className="bg-[#DC2626] text-white hover:bg-[#DC2626]/90"
                onClick={() => { setRejectTarget(null); setRejectNotes("") }}
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
