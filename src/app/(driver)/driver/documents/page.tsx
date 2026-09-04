"use client"

import { useState, useEffect } from "react"
import {
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Modal } from "@/components/shared/Modal"
import { EmptyState } from "@/components/shared/EmptyState"
import { useAuth } from "@/hooks/useAuth"
import { getDriver, updateDriver } from "@/lib/services/driver-service"
import type { DriverDocument, DocumentStatus } from "@/types"

const STATUS_CONFIG: Record<DocumentStatus, { label: string; icon: React.ReactNode; color: string }> = {
  approved: {
    label: "Approved",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "bg-green-50 text-green-700 border-green-200",
  },
  pending: {
    label: "Under Review",
    icon: <Clock className="h-3.5 w-3.5" />,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: "bg-red-50 text-red-700 border-red-200",
  },
  expired: {
    label: "Expired",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    color: "bg-red-50 text-red-700 border-red-200",
  },
}

function isExpiringSoon(dateStr: string): boolean {
  if (!dateStr) return false
  const diffDays = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return diffDays <= 30 && diffDays > 0
}

function isExpired(dateStr: string): boolean {
  return !!dateStr && new Date(dateStr) < new Date()
}

export default function DriverDocumentsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<DriverDocument[]>([])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [docType, setDocType] = useState("")
  const [docNumber, setDocNumber] = useState("")
  const [issueDate, setIssueDate] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    getDriver(user.uid)
      .then((profile) => setDocuments(profile?.documents ?? []))
      .finally(() => setLoading(false))
  }, [user])

  function openUpload(type: string) {
    setDocType(type)
    setDocNumber("")
    setIssueDate("")
    setExpiryDate("")
    setUploadOpen(true)
  }

  async function handleSubmit() {
    if (!user || !docType || !docNumber || !expiryDate) return
    setSaving(true)
    try {
      const newDoc: DriverDocument = {
        id: `doc-${Date.now()}`,
        documentType: docType,
        documentNumber: docNumber,
        issueDate,
        expiryDate,
        fileURL: "",
        status: "pending",
        uploadedAt: new Date().toISOString(),
      }
      const updated = [...documents.filter((d) => d.documentType !== docType), newDoc]
      await updateDriver(user.uid, { documents: updated })
      setDocuments(updated)
      setUploadOpen(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4145A]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Documents</h1>
          <p className="text-sm text-[#6B7280]">
            Manage your driving and vehicle documents
          </p>
        </div>
        <Button
          className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
          onClick={() => openUpload("New Document")}
        >
          <Upload className="mr-2 h-4 w-4" />
          Add Document
        </Button>
      </div>

      {documents.some((d) => isExpiringSoon(d.expiryDate)) && (
        <div className="flex items-center gap-3 rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-bold text-amber-800">
              Document Expiring Soon
            </p>
            <p className="text-xs text-amber-700">
              One or more of your documents will expire within 30 days. Please
              renew them to avoid interruptions.
            </p>
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <EmptyState
          icon={<Upload className="h-16 w-16" />}
          title="No documents on file"
          description="Add your licence, insurance, and other required documents."
          action={{ label: "Add Document", onClick: () => openUpload("New Document") }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => {
            const statusConfig = STATUS_CONFIG[doc.status]
            const expiringSoon = isExpiringSoon(doc.expiryDate)
            const expired = isExpired(doc.expiryDate)

            return (
              <div
                key={doc.id}
                className={cn(
                  "rounded-2xl bg-white p-5 ring-1 ring-[#E5E7EB] transition-shadow hover:shadow-md",
                  expired && "ring-red-200",
                  expiringSoon && "ring-amber-200"
                )}
              >
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="text-sm font-bold text-[#172F52]">{doc.documentType}</h3>
                  <div className="flex items-center gap-1.5">
                    {expiringSoon && !expired && (
                      <Badge className="bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Expiring Soon
                      </Badge>
                    )}
                    <Badge className={cn("border", statusConfig.color)}>
                      {statusConfig.icon}
                      <span className="ml-1">{statusConfig.label}</span>
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-xs text-[#6B7280]">Number</span>
                    <span className="text-xs font-medium text-[#172F52]">{doc.documentNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#6B7280]">Expiry</span>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        expired ? "text-red-600" : expiringSoon ? "text-amber-600" : "text-[#172F52]"
                      )}
                    >
                      {doc.expiryDate
                        ? new Date(doc.expiryDate).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#6B7280]">Uploaded</span>
                    <span className="text-xs text-[#172F52]">
                      {new Date(doc.uploadedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <Separator className="my-4" />

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-[#D9E0E8] text-[#D4145A] hover:bg-[#D4145A]/10"
                  onClick={() => openUpload(doc.documentType)}
                >
                  <Upload className="mr-2 h-3.5 w-3.5" />
                  {doc.status === "rejected" ? "Re-upload" : "Update"}
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title={`${docType === "New Document" ? "Add" : "Update"} Document`}
        description="Provide the document details. File upload isn't available yet — an admin will verify against the number/dates you enter."
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="doc-type" className="text-sm font-medium text-[#172033]">
              Document Type
            </Label>
            <Input
              id="doc-type"
              value={docType === "New Document" ? "" : docType}
              onChange={(e) => setDocType(e.target.value)}
              placeholder="e.g. Driving Licence"
              className="mt-1.5 h-10"
            />
          </div>
          <div>
            <Label htmlFor="doc-number" className="text-sm font-medium text-[#172033]">
              Document Number
            </Label>
            <Input
              id="doc-number"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="Enter document number"
              className="mt-1.5 h-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issue-date" className="text-sm font-medium text-[#172033]">
                Issue Date
              </Label>
              <Input
                id="issue-date"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="mt-1.5 h-10"
              />
            </div>
            <div>
              <Label htmlFor="expiry-date" className="text-sm font-medium text-[#172033]">
                Expiry Date
              </Label>
              <Input
                id="expiry-date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="mt-1.5 h-10"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setUploadOpen(false)}
              className="border-[#D9E0E8]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !docType || !docNumber || !expiryDate}
              className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
            >
              {saving ? "Saving..." : "Save Document"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
