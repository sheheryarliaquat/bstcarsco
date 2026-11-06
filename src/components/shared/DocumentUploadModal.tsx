"use client"

import { useRef, useState } from "react"
import { FileText, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Modal } from "@/components/shared/Modal"
import { DOCUMENT_TYPES } from "@/constants"
import {
  ACCEPTED_DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
  saveDriverDocument,
} from "@/lib/services/driver-document-service"
import type { DriverDocument } from "@/types"

interface DocumentUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  driverId: string
  driverName: string
  /** Pre-selected document type (e.g. clicking "Upload" on a checklist row). */
  documentType?: string
  /** All of this driver's current documents, so picking a type that already
   *  exists replaces it rather than duplicating it. */
  existingDocuments: DriverDocument[]
  mode: "admin" | "driver"
  reviewerId?: string
  onSaved?: (doc: DriverDocument) => void
}

export function DocumentUploadModal(props: DocumentUploadModalProps) {
  const [saving, setSaving] = useState(false)
  // Remount the form each time the modal opens so it starts fresh,
  // pre-filled from whatever is currently on file for the chosen type.
  const [openCount, setOpenCount] = useState(0)
  const [wasOpen, setWasOpen] = useState(props.open)
  if (props.open !== wasOpen) {
    setWasOpen(props.open)
    if (props.open) setOpenCount((c) => c + 1)
  }

  return (
    <Modal
      open={props.open}
      onOpenChange={(o) => { if (!saving) props.onOpenChange(o) }}
      title={props.documentType && props.existingDocuments.some((d) => d.documentType === props.documentType)
        ? `Update ${props.documentType}`
        : "Add Document"}
      description={
        props.mode === "admin"
          ? `Uploading for ${props.driverName}. Documents added by an admin are approved automatically.`
          : "Upload a clear photo or PDF. An admin will review it before it's approved."
      }
      size="lg"
    >
      {props.open && <UploadForm key={openCount} {...props} saving={saving} setSaving={setSaving} />}
    </Modal>
  )
}

function UploadForm({
  onOpenChange,
  driverId,
  driverName,
  documentType: presetType,
  existingDocuments,
  mode,
  reviewerId,
  onSaved,
  saving,
  setSaving,
}: DocumentUploadModalProps & { saving: boolean; setSaving: (v: boolean) => void }) {
  const initial = existingDocuments.find((d) => d.documentType === (presetType ?? ""))
  const [docType, setDocType] = useState(presetType ?? "")
  const [docNumber, setDocNumber] = useState(initial?.documentNumber ?? "")
  const [issueDate, setIssueDate] = useState(initial?.issueDate ?? "")
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate ?? "")
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const fileInput = useRef<HTMLInputElement>(null)

  const existing = existingDocuments.find((d) => d.documentType === docType) ?? null

  function handleTypeChange(type: string) {
    setDocType(type)
    const current = existingDocuments.find((d) => d.documentType === type)
    setDocNumber(current?.documentNumber ?? "")
    setIssueDate(current?.issueDate ?? "")
    setExpiryDate(current?.expiryDate ?? "")
  }

  function handleFile(f: File | null) {
    setError("")
    if (f && f.size > MAX_DOCUMENT_BYTES) {
      setError("File is too large — the limit is 10 MB.")
      setFile(null)
      return
    }
    setFile(f)
  }

  const needsFile = !existing?.fileURL
  const canSave = !!docType && !saving && (!needsFile || !!file) &&
    !(issueDate && expiryDate && expiryDate < issueDate)

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError("")
    try {
      const saved = await saveDriverDocument({
        driverId,
        driverName,
        documentType: docType,
        documentNumber: docNumber,
        issueDate,
        expiryDate,
        file,
        existing,
        asAdmin: mode === "admin",
        reviewerId,
        onProgress: setProgress,
      })
      onSaved?.(saved)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="doc-type" className="text-sm font-medium text-[#0F1B2D]">Document Type *</Label>
          <select
            id="doc-type"
            value={docType}
            onChange={(e) => handleTypeChange(e.target.value)}
            disabled={!!presetType}
            className="mt-1.5 h-10 w-full rounded-lg border border-[#E2E6EC] bg-white px-3 text-sm text-[#0F1B2D] outline-none focus:border-[#1F4FD8] disabled:bg-[#F4F6F9]"
          >
            <option value="">Select a document type…</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}{existingDocuments.some((d) => d.documentType === t) ? " (on file — will replace)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="doc-number" className="text-sm font-medium text-[#0F1B2D]">Document / Reference Number</Label>
          <Input
            id="doc-number"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            placeholder="e.g. licence number, policy number"
            className="mt-1.5 h-10"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="issue-date" className="text-sm font-medium text-[#0F1B2D]">Issue Date</Label>
            <Input id="issue-date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="mt-1.5 h-10" />
          </div>
          <div>
            <Label htmlFor="expiry-date" className="text-sm font-medium text-[#0F1B2D]">Expiry Date</Label>
            <Input id="expiry-date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="mt-1.5 h-10" />
          </div>
        </div>
        {issueDate && expiryDate && expiryDate < issueDate && (
          <p className="text-xs text-red-600">Expiry date can&apos;t be before the issue date.</p>
        )}

        <div>
          <Label className="text-sm font-medium text-[#0F1B2D]">
            File {needsFile ? "*" : "(optional — leave empty to keep the current file)"}
          </Label>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED_DOCUMENT_TYPES}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-[#E2E6EC] bg-[#F4F6F9] px-3 py-2.5">
              <FileText className="h-5 w-5 shrink-0 text-[#1F4FD8]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#0F1B2D]">{file.name}</p>
                <p className="text-xs text-[#5B6577]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              {!saving && (
                <Button variant="ghost" size="icon-xs" onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = "" }}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="mt-1.5 flex w-full flex-col items-center gap-1 rounded-lg border-2 border-dashed border-[#E2E6EC] px-4 py-6 text-center transition-colors hover:border-[#1F4FD8] hover:bg-[#1F4FD8]/5"
            >
              <Upload className="h-6 w-6 text-[#5B6577]" />
              <span className="text-sm font-medium text-[#0F1B2D]">Choose a file</span>
              <span className="text-xs text-[#5B6577]">PDF or image, up to 10 MB</span>
            </button>
          )}
          {existing?.fileURL && !file && (
            <a href={existing.fileURL} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-block text-xs font-medium text-[#1F4FD8] hover:underline">
              View current file{existing.fileName ? ` (${existing.fileName})` : ""}
            </a>
          )}
        </div>

        {saving && file && (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-[#E2E6EC]">
              <div className="h-full bg-[#1F4FD8] transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-[#5B6577]">Uploading… {progress}%</p>
          </div>
        )}

        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <div className="flex justify-end gap-3 border-t border-[#E2E6EC] pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="border-[#E2E6EC]">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave} className="bg-[#1F4FD8] text-white hover:bg-[#1F4FD8]/90">
            <Upload className="mr-1.5 h-4 w-4" />
            {saving ? "Saving…" : mode === "admin" ? "Save Document" : "Submit for Review"}
          </Button>
        </div>
      </div>
  )
}
