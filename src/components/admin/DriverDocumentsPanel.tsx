"use client"

import { useState } from "react"
import { CheckCircle, ExternalLink, Plus, Trash2, Upload, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { DocumentStatusPill } from "@/components/shared/DocumentStatusPill"
import { DocumentUploadModal } from "@/components/shared/DocumentUploadModal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { DOCUMENT_TYPES } from "@/constants"
import {
  daysUntilExpiry,
  deleteDriverDocument,
  effectiveStatus,
  reviewDriverDocument,
} from "@/lib/services/driver-document-service"
import type { DriverDocument } from "@/types"

interface DriverDocumentsPanelProps {
  driverId: string
  driverName: string
  documents: DriverDocument[]
  reviewerId: string
}

/**
 * Admin checklist of every driver document type: shows what's on file,
 * lets the admin view the file, approve / reject it, upload or replace it,
 * and delete it.
 */
export function DriverDocumentsPanel({ driverId, driverName, documents, reviewerId }: DriverDocumentsPanelProps) {
  const [uploadType, setUploadType] = useState<string | undefined>(undefined)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<DriverDocument | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const byType = new Map(documents.map((d) => [d.documentType, d]))
  // Every standard type, plus any non-standard ones already on file.
  const types: string[] = [
    ...DOCUMENT_TYPES.filter((t) => t !== "Other" || byType.has(t)),
    ...documents.map((d) => d.documentType).filter((t) => !(DOCUMENT_TYPES as readonly string[]).includes(t)),
  ]

  const approvedCount = documents.filter((d) => effectiveStatus(d) === "approved").length

  function openUpload(type?: string) {
    setUploadType(type)
    setUploadOpen(true)
  }

  async function run(id: string, fn: () => Promise<void>) {
    setBusyId(id)
    setError("")
    try {
      await fn()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-[#5B6577]">Documents</p>
          <p className="text-xs text-[#5B6577]">
            {approvedCount} approved · {documents.length} on file
          </p>
        </div>
        <Button size="sm" className="bg-[#1F4FD8] text-white hover:bg-[#1F4FD8]/90" onClick={() => openUpload(undefined)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add Document
        </Button>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-2.5 text-sm text-red-600">{error}</div>}

      <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
        {types.map((type) => {
          const doc = byType.get(type)
          const status = doc ? effectiveStatus(doc) : "missing"
          const days = doc ? daysUntilExpiry(doc.expiryDate) : null
          const busy = !!doc && busyId === doc.id

          return (
            <div key={type} className={cn("rounded-lg bg-[#F4F6F9] px-3 py-2.5", !doc && "opacity-80")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#0F1B2D]">{type}</p>
                  {doc && (
                    <p className="text-xs text-[#5B6577]">
                      {doc.documentNumber || "No number"}
                      {doc.expiryDate && (
                        <>
                          {" · Expires "}
                          {new Date(doc.expiryDate).toLocaleDateString("en-GB")}
                          {days !== null && days > 0 && days <= 30 && (
                            <span className="font-semibold text-amber-600"> ({days}d left)</span>
                          )}
                        </>
                      )}
                    </p>
                  )}
                  {doc?.status === "rejected" && doc.notes && (
                    <p className="text-xs text-red-600">Reason: {doc.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <DocumentStatusPill status={status} />
                  {doc?.fileURL && (
                    <a
                      href={doc.fileURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View file"
                      className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-[#5B6577]" />
                    </a>
                  )}
                  {doc && doc.status !== "approved" && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      title="Approve"
                      disabled={busy}
                      onClick={() => run(doc.id, () => reviewDriverDocument(doc.id, "approved", reviewerId))}
                    >
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                  {doc && doc.status !== "rejected" && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      title="Reject"
                      disabled={busy}
                      onClick={() => { setRejecting(doc.id); setRejectNotes("") }}
                    >
                      <XCircle className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon-xs" title={doc ? "Replace" : "Upload"} onClick={() => openUpload(type)}>
                    <Upload className="h-3.5 w-3.5 text-[#1F4FD8]" />
                  </Button>
                  {doc && (
                    <Button variant="ghost" size="icon-xs" title="Delete" disabled={busy} onClick={() => setDeleteTarget(doc)}>
                      <Trash2 className="h-3.5 w-3.5 text-[#5B6577]" />
                    </Button>
                  )}
                </div>
              </div>

              {doc && rejecting === doc.id && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    autoFocus
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    placeholder="Reason (shown to the driver)"
                    className="h-8 min-w-[200px] flex-1 rounded-md border border-[#E2E6EC] bg-white px-2 text-sm outline-none focus:border-[#1F4FD8]"
                  />
                  <Button
                    size="sm"
                    className="h-8 bg-[#DC2626] text-white hover:bg-[#DC2626]/90"
                    disabled={!rejectNotes.trim() || busy}
                    onClick={() =>
                      run(doc.id, async () => {
                        await reviewDriverDocument(doc.id, "rejected", reviewerId, rejectNotes)
                        setRejecting(null)
                      })
                    }
                  >
                    Reject
                  </Button>
                  <Button size="sm" variant="outline" className="h-8" onClick={() => setRejecting(null)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <DocumentUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        driverId={driverId}
        driverName={driverName}
        documentType={uploadType}
        existingDocuments={documents}
        mode="admin"
        reviewerId={reviewerId}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
        title="Delete Document"
        description={`Delete ${driverName}'s ${deleteTarget?.documentType}? The uploaded file will be removed too.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => {
          const d = deleteTarget
          setDeleteTarget(null)
          if (d) run(d.id, () => deleteDriverDocument(d))
        }}
      />
    </div>
  )
}
