"use client"

import { useState, useEffect, useMemo } from "react"
import { Upload, AlertTriangle, Loader2, ExternalLink, FileText, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DocumentStatusPill } from "@/components/shared/DocumentStatusPill"
import { DocumentUploadModal } from "@/components/shared/DocumentUploadModal"
import { useAuth } from "@/hooks/useAuth"
import { DOCUMENT_TYPES } from "@/constants"
import {
  daysUntilExpiry,
  effectiveStatus,
  listenToDriverDocuments,
} from "@/lib/services/driver-document-service"
import type { DriverDocument } from "@/types"

function formatDate(value?: string) {
  if (!value) return "-"
  const d = new Date(value)
  return isNaN(d.getTime())
    ? "-"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export default function DriverDocumentsPage() {
  const { user, userData } = useAuth()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [documents, setDocuments] = useState<DriverDocument[]>([])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadType, setUploadType] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!user) return
    const unsubscribe = listenToDriverDocuments(
      user.uid,
      (docs) => {
        setDocuments(docs)
        setLoading(false)
      },
      (err) => {
        setLoadError(err.message || "Could not load your documents.")
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [user])

  const byType = useMemo(() => new Map(documents.map((d) => [d.documentType, d])), [documents])
  const types = useMemo(
    () => [
      ...DOCUMENT_TYPES.filter((t) => t !== "Other" || byType.has(t)),
      ...documents.map((d) => d.documentType).filter((t) => !(DOCUMENT_TYPES as readonly string[]).includes(t)),
    ],
    [byType, documents]
  )

  const attention = documents.filter((d) => {
    const s = effectiveStatus(d)
    const days = daysUntilExpiry(d.expiryDate)
    return s === "rejected" || s === "expired" || (days !== null && days > 0 && days <= 30)
  })
  const approved = documents.filter((d) => effectiveStatus(d) === "approved").length

  const driverName =
    [userData?.firstName, userData?.lastName].filter(Boolean).join(" ") || user?.displayName || user?.email || "Driver"

  function openUpload(type?: string) {
    setUploadType(type)
    setUploadOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#1F4FD8]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Documents</h1>
          <p className="text-sm text-[#5B6577]">
            Upload your driving and vehicle documents. {approved} of {types.length} approved.
          </p>
        </div>
        <Button className="bg-[#1F4FD8] text-white hover:bg-[#1F4FD8]/90" onClick={() => openUpload(undefined)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Document
        </Button>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>
      )}

      {attention.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-bold text-amber-800">Some documents need your attention</p>
            <p className="text-xs text-amber-700">
              {attention.map((d) => d.documentType).join(", ")} — rejected, expired or expiring within 30 days. Please upload a new copy.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {types.map((type) => {
          const doc = byType.get(type)
          const status = doc ? effectiveStatus(doc) : "missing"
          const days = doc ? daysUntilExpiry(doc.expiryDate) : null
          const expiringSoon = days !== null && days > 0 && days <= 30

          return (
            <div
              key={type}
              className={cn(
                "flex flex-col rounded-2xl bg-white p-5 ring-1 ring-[#E5E7EB] transition-shadow hover:shadow-md",
                (status === "expired" || status === "rejected") && "ring-red-200",
                expiringSoon && status === "approved" && "ring-amber-200"
              )}
            >
              <div className="mb-4 flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-[#0F1B2D]">{type}</h3>
                <DocumentStatusPill
                  status={status}
                  label={expiringSoon && status === "approved" ? `Expires in ${days}d` : undefined}
                  className={expiringSoon && status === "approved" ? "border-amber-200 bg-amber-50 text-amber-700" : undefined}
                />
              </div>

              {doc ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between gap-2">
                    <span className="text-xs text-[#5B6577]">Number</span>
                    <span className="truncate text-xs font-medium text-[#0F1B2D]">{doc.documentNumber || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#5B6577]">Expiry</span>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        status === "expired" ? "text-red-600" : expiringSoon ? "text-amber-600" : "text-[#0F1B2D]"
                      )}
                    >
                      {formatDate(doc.expiryDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#5B6577]">Uploaded</span>
                    <span className="text-xs text-[#0F1B2D]">{formatDate(doc.uploadedAt)}</span>
                  </div>
                  {doc.status === "rejected" && doc.notes && (
                    <p className="rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-700">Reason: {doc.notes}</p>
                  )}
                  {doc.fileURL && (
                    <a
                      href={doc.fileURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-[#1F4FD8] hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> View file
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-[#5B6577]">
                  <FileText className="h-4 w-4" /> Not uploaded yet
                </div>
              )}

              <Separator className="my-4" />

              <Button
                variant="outline"
                size="sm"
                className="mt-auto w-full border-[#E2E6EC] text-[#1F4FD8] hover:bg-[#1F4FD8]/10"
                onClick={() => openUpload(type)}
              >
                <Upload className="mr-2 h-3.5 w-3.5" />
                {!doc ? "Upload" : doc.status === "rejected" || status === "expired" ? "Re-upload" : "Update"}
              </Button>
            </div>
          )
        })}
      </div>

      {user && (
        <DocumentUploadModal
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          driverId={user.uid}
          driverName={driverName}
          documentType={uploadType}
          existingDocuments={documents}
          mode="driver"
        />
      )}
    </div>
  )
}
