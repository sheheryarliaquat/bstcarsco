"use client"

import { useState } from "react"
import {
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Car,
  Shield,
  CreditCard,
  ClipboardCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Modal } from "@/components/shared/Modal"

interface DriverDocument {
  id: string
  type: string
  icon: React.ReactNode
  documentNumber: string
  expiryDate: string
  status: "pending" | "approved" | "rejected" | "expired"
  uploadedAt: string
}

const DOCUMENTS: DriverDocument[] = [
  {
    id: "doc-1",
    type: "Driving Licence",
    icon: <CreditCard className="h-5 w-5" />,
    documentNumber: "MOH1234567890",
    expiryDate: "2029-06-15",
    status: "approved",
    uploadedAt: "2024-06-20",
  },
  {
    id: "doc-2",
    type: "Private Hire Licence",
    icon: <Shield className="h-5 w-5" />,
    documentNumber: "PHL-2024-98765",
    expiryDate: "2025-09-30",
    status: "approved",
    uploadedAt: "2024-06-20",
  },
  {
    id: "doc-3",
    type: "Vehicle Registration",
    icon: <Car className="h-5 w-5" />,
    documentNumber: "LN24 TCO",
    expiryDate: "2027-03-01",
    status: "approved",
    uploadedAt: "2024-06-20",
  },
  {
    id: "doc-4",
    type: "Insurance Certificate",
    icon: <Shield className="h-5 w-5" />,
    documentNumber: "INS-2026-54321",
    expiryDate: "2026-09-05",
    status: "approved",
    uploadedAt: "2025-09-01",
  },
  {
    id: "doc-5",
    type: "MOT Certificate",
    icon: <ClipboardCheck className="h-5 w-5" />,
    documentNumber: "MOT-2025-12345",
    expiryDate: "2026-08-28",
    status: "approved",
    uploadedAt: "2025-08-28",
  },
  {
    id: "doc-6",
    type: "Background Check (DBS)",
    icon: <Shield className="h-5 w-5" />,
    documentNumber: "DBS-2024-67890",
    expiryDate: "2027-06-20",
    status: "pending",
    uploadedAt: "2026-08-20",
  },
]

const STATUS_CONFIG = {
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
  const expiry = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays <= 30 && diffDays > 0
}

function isExpired(dateStr: string): boolean {
  return new Date(dateStr) < new Date()
}

export default function DriverDocumentsPage() {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)

  function handleUpload(docType: string) {
    setSelectedDoc(docType)
    setUploadOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#172F52]">Documents</h1>
        <p className="text-sm text-[#6B7280]">
          Manage your driving and vehicle documents
        </p>
      </div>

      {/* Warning Banner */}
      {DOCUMENTS.some((d) => isExpiringSoon(d.expiryDate)) && (
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

      {/* Documents Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOCUMENTS.map((doc) => {
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#172F52]/10 text-[#172F52]">
                  {doc.icon}
                </div>
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

              <h3 className="mb-2 text-sm font-bold text-[#172F52]">
                {doc.type}
              </h3>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-xs text-[#6B7280]">Number</span>
                  <span className="text-xs font-medium text-[#172F52]">
                    {doc.documentNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-[#6B7280]">Expiry</span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      expired
                        ? "text-red-600"
                        : expiringSoon
                          ? "text-amber-600"
                          : "text-[#172F52]"
                    )}
                  >
                    {new Date(doc.expiryDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
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
                onClick={() => handleUpload(doc.type)}
              >
                <Upload className="mr-2 h-3.5 w-3.5" />
                {doc.status === "rejected" ? "Re-upload" : "Update"}
              </Button>
            </div>
          )
        })}
      </div>

      {/* Upload Modal */}
      <Modal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title={`Upload ${selectedDoc ?? "Document"}`}
        description="Please provide the document details and upload a clear photo or scan."
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="doc-number" className="text-sm font-medium text-[#172033]">
              Document Number
            </Label>
            <Input
              id="doc-number"
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
                className="mt-1.5 h-10"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-[#172033]">
              Upload File
            </Label>
            <div className="mt-1.5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D9E0E8] bg-[#F5F7FA] p-8 transition-colors hover:border-[#D4145A]/50 hover:bg-[#D4145A]/5">
              <Upload className="mb-2 h-8 w-8 text-[#6B7280]" />
              <p className="text-sm font-medium text-[#172033]">
                Click to upload or drag and drop
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">
                PDF, JPG, PNG up to 10MB
              </p>
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
              onClick={() => setUploadOpen(false)}
              className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90"
            >
              Upload Document
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
