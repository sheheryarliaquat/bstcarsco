"use client"

import { useState } from "react"
import {
  Settings,
  Save,
  Building,
  Car,
  DollarSign,
  Mail,
  MessageSquare,
  Map,
  CreditCard,
  Flame,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SettingsSection {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const SECTIONS: SettingsSection[] = [
  { key: "general", label: "General", icon: Building },
  { key: "booking", label: "Booking", icon: Car },
  { key: "pricing", label: "Pricing", icon: DollarSign },
  { key: "email", label: "Email", icon: Mail },
  { key: "sms", label: "SMS", icon: MessageSquare },
  { key: "maps", label: "Maps", icon: Map },
  { key: "stripe", label: "Stripe", icon: CreditCard },
  { key: "firebase", label: "Firebase", icon: Flame },
  { key: "maintenance", label: "Maintenance", icon: AlertTriangle },
]

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [saved, setSaved] = useState(false)

  const [general, setGeneral] = useState({
    companyName: "Blue Star Airport Transfers LTD",
    currency: "GBP",
    timezone: "Europe/London",
    supportEmail: "support@bstcars.co",
    supportPhone: "+442071234567",
  })

  const [booking, setBooking] = useState({
    cancellationHours: 2,
    maxAdvanceDays: 30,
    autoAssign: true,
    searchRadiusMiles: 5,
    maxViaStops: 3,
  })

  const [pricingSettings, setPricingSettings] = useState({
    platformCommission: 15,
    defaultCurrency: "GBP",
    taxRate: 20,
    cancellationFee: 5,
    waitingFeePerMinute: 0.5,
    freeWaitingMinutes: 5,
  })

  const [email, setEmail] = useState({
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPass: "",
    senderName: "",
    templatesEnabled: false,
  })

  const [sms, setSms] = useState({
    provider: "",
    apiKey: "",
    apiSecret: "",
    fromNumber: "",
    enabled: false,
  })

  const [maps, setMaps] = useState({
    googleMapsKey: "",
    defaultLat: "",
    defaultLng: "",
    defaultZoom: "",
  })

  const [stripeConfig, setStripeConfig] = useState({
    publishableKey: "",
    secretKey: "",
    webhookSecret: "",
    enabled: false,
  })

  const [firebase, setFirebase] = useState({
    projectId: "",
    authDomain: "",
    storageBucket: "",
  })

  const [maintenance, setMaintenance] = useState({
    enabled: false,
    message: "We are currently performing scheduled maintenance. Please try again shortly.",
  })

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172F52]">Settings</h1>
          <p className="text-sm text-[#6B7280]">Configure platform settings and integrations</p>
        </div>
        <Button onClick={handleSave} className="bg-[#D4145A] text-white hover:bg-[#D4145A]/90">
          <Save className="mr-1.5 h-4 w-4" />
          {saved ? "Saved!" : "Save Settings"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Sidebar tabs */}
        <div className="rounded-xl border border-[#D9E0E8] bg-white p-2">
          <nav className="space-y-0.5">
            {SECTIONS.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.key}
                  onClick={() => setActiveTab(section.key)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    activeTab === section.key
                      ? "bg-[#D4145A] text-white"
                      : "text-[#6B7280] hover:bg-[#F5F7FA] hover:text-[#172F52]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {section.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-[#D9E0E8] bg-white p-6">
          {activeTab === "general" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[#172F52]">General Settings</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Company Name</label>
                  <Input value={general.companyName} onChange={(e) => setGeneral({ ...general, companyName: e.target.value })} className="h-9" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Currency</label>
                  <select value={general.currency} onChange={(e) => setGeneral({ ...general, currency: e.target.value })} className="h-9 w-full rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]">
                    <option value="GBP">GBP (£)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Timezone</label>
                  <select value={general.timezone} onChange={(e) => setGeneral({ ...general, timezone: e.target.value })} className="h-9 w-full rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]">
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Europe/Edinburgh">Europe/Edinburgh</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Support Email</label>
                  <Input value={general.supportEmail} onChange={(e) => setGeneral({ ...general, supportEmail: e.target.value })} className="h-9" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Support Phone</label>
                  <Input value={general.supportPhone} onChange={(e) => setGeneral({ ...general, supportPhone: e.target.value })} className="h-9" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "booking" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[#172F52]">Booking Settings</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Cancellation Policy (hours before pickup)</label>
                  <Input type="number" value={booking.cancellationHours} onChange={(e) => setBooking({ ...booking, cancellationHours: Number(e.target.value) })} className="h-9" min={0} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Max Advance Booking (days)</label>
                  <Input type="number" value={booking.maxAdvanceDays} onChange={(e) => setBooking({ ...booking, maxAdvanceDays: Number(e.target.value) })} className="h-9" min={1} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Driver Search Radius (miles)</label>
                  <Input type="number" value={booking.searchRadiusMiles} onChange={(e) => setBooking({ ...booking, searchRadiusMiles: Number(e.target.value) })} className="h-9" min={1} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Max Via Stops</label>
                  <Input type="number" value={booking.maxViaStops} onChange={(e) => setBooking({ ...booking, maxViaStops: Number(e.target.value) })} className="h-9" min={0} max={5} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-[#172F52]">Auto-assign Drivers</label>
                <button
                  onClick={() => setBooking({ ...booking, autoAssign: !booking.autoAssign })}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    booking.autoAssign ? "bg-[#D4145A]" : "bg-[#D9E0E8]"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    booking.autoAssign ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
                <span className="text-xs text-[#6B7280]">{booking.autoAssign ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
          )}

          {activeTab === "pricing" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[#172F52]">Pricing Settings</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Platform Commission (%)</label>
                  <Input type="number" value={pricingSettings.platformCommission} onChange={(e) => setPricingSettings({ ...pricingSettings, platformCommission: Number(e.target.value) })} className="h-9" min={0} max={50} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Tax Rate (%)</label>
                  <Input type="number" value={pricingSettings.taxRate} onChange={(e) => setPricingSettings({ ...pricingSettings, taxRate: Number(e.target.value) })} className="h-9" min={0} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Cancellation Fee (£)</label>
                  <Input type="number" value={pricingSettings.cancellationFee} onChange={(e) => setPricingSettings({ ...pricingSettings, cancellationFee: Number(e.target.value) })} className="h-9" min={0} step={0.5} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Waiting Fee Per Minute (£)</label>
                  <Input type="number" value={pricingSettings.waitingFeePerMinute} onChange={(e) => setPricingSettings({ ...pricingSettings, waitingFeePerMinute: Number(e.target.value) })} className="h-9" min={0} step={0.1} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Free Waiting Minutes</label>
                  <Input type="number" value={pricingSettings.freeWaitingMinutes} onChange={(e) => setPricingSettings({ ...pricingSettings, freeWaitingMinutes: Number(e.target.value) })} className="h-9" min={0} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "email" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[#172F52]">Email Settings</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">SMTP Host</label>
                  <Input value={email.smtpHost} onChange={(e) => setEmail({ ...email, smtpHost: e.target.value })} className="h-9" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">SMTP Port</label>
                  <Input value={email.smtpPort} onChange={(e) => setEmail({ ...email, smtpPort: e.target.value })} className="h-9" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">SMTP Username</label>
                  <Input value={email.smtpUser} onChange={(e) => setEmail({ ...email, smtpUser: e.target.value })} className="h-9" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">SMTP Password</label>
                  <Input type="password" value={email.smtpPass} onChange={(e) => setEmail({ ...email, smtpPass: e.target.value })} className="h-9" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Sender Name</label>
                  <Input value={email.senderName} onChange={(e) => setEmail({ ...email, senderName: e.target.value })} className="h-9" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-[#172F52]">Email Templates</label>
                <button
                  onClick={() => setEmail({ ...email, templatesEnabled: !email.templatesEnabled })}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    email.templatesEnabled ? "bg-[#D4145A]" : "bg-[#D9E0E8]"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    email.templatesEnabled ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
                <span className="text-xs text-[#6B7280]">{email.templatesEnabled ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
          )}

          {activeTab === "sms" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[#172F52]">SMS Settings</h3>
              <div className="flex items-center gap-3 mb-2">
                <label className="text-sm font-medium text-[#172F52]">SMS Notifications</label>
                <button
                  onClick={() => setSms({ ...sms, enabled: !sms.enabled })}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    sms.enabled ? "bg-[#D4145A]" : "bg-[#D9E0E8]"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    sms.enabled ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
                <span className="text-xs text-[#6B7280]">{sms.enabled ? "Enabled" : "Disabled"}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">SMS Provider</label>
                  <select value={sms.provider} onChange={(e) => setSms({ ...sms, provider: e.target.value })} className="h-9 w-full rounded-lg border border-[#D9E0E8] bg-white px-3 text-sm text-[#172F52] outline-none focus:border-[#D4145A]">
                    <option value="Twilio">Twilio</option>
                    <option value="AWS SNS">AWS SNS</option>
                    <option value="Vonage">Vonage</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">API Key</label>
                  <Input type="password" value={sms.apiKey} onChange={(e) => setSms({ ...sms, apiKey: e.target.value })} className="h-9" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">API Secret</label>
                  <Input type="password" value={sms.apiSecret} onChange={(e) => setSms({ ...sms, apiSecret: e.target.value })} className="h-9" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">From Number</label>
                  <Input value={sms.fromNumber} onChange={(e) => setSms({ ...sms, fromNumber: e.target.value })} className="h-9" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "maps" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[#172F52]">Maps Settings</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Google Maps API Key</label>
                  <Input type="password" value={maps.googleMapsKey} onChange={(e) => setMaps({ ...maps, googleMapsKey: e.target.value })} className="h-9" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Default Latitude</label>
                  <Input value={maps.defaultLat} onChange={(e) => setMaps({ ...maps, defaultLat: e.target.value })} className="h-9" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Default Longitude</label>
                  <Input value={maps.defaultLng} onChange={(e) => setMaps({ ...maps, defaultLng: e.target.value })} className="h-9" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Default Zoom Level</label>
                  <Input type="number" value={maps.defaultZoom} onChange={(e) => setMaps({ ...maps, defaultZoom: e.target.value })} className="h-9" min={1} max={20} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "stripe" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[#172F52]">Stripe Settings</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Publishable Key</label>
                  <Input type="password" value={stripeConfig.publishableKey} onChange={(e) => setStripeConfig({ ...stripeConfig, publishableKey: e.target.value })} className="h-9 font-mono" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Secret Key</label>
                  <Input type="password" value={stripeConfig.secretKey} onChange={(e) => setStripeConfig({ ...stripeConfig, secretKey: e.target.value })} className="h-9 font-mono" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Webhook Secret</label>
                  <Input type="password" value={stripeConfig.webhookSecret} onChange={(e) => setStripeConfig({ ...stripeConfig, webhookSecret: e.target.value })} className="h-9 font-mono" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-[#172F52]">Stripe Enabled</label>
                <button
                  onClick={() => setStripeConfig({ ...stripeConfig, enabled: !stripeConfig.enabled })}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    stripeConfig.enabled ? "bg-[#D4145A]" : "bg-[#D9E0E8]"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    stripeConfig.enabled ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
                <span className="text-xs text-[#6B7280]">{stripeConfig.enabled ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
          )}

          {activeTab === "firebase" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[#172F52]">Firebase Settings</h3>
              <div className="rounded-lg bg-[#F5F7FA] p-4 space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase text-[#6B7280]">Project ID</label>
                    <p className="font-mono text-sm text-[#172F52]">{firebase.projectId}</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase text-[#6B7280]">Auth Domain</label>
                    <p className="font-mono text-sm text-[#172F52]">{firebase.authDomain}</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase text-[#6B7280]">Storage Bucket</label>
                    <p className="font-mono text-sm text-[#172F52]">{firebase.storageBucket}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-[#6B7280]">Firebase configuration is managed through environment variables. Contact your system administrator to make changes.</p>
            </div>
          )}

          {activeTab === "maintenance" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[#172F52]">Maintenance Mode</h3>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800">Warning</span>
                </div>
                <p className="text-sm text-amber-700">Enabling maintenance mode will prevent all users from accessing the platform. Only administrators will be able to log in.</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-[#172F52]">Maintenance Mode</label>
                <button
                  onClick={() => setMaintenance({ ...maintenance, enabled: !maintenance.enabled })}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    maintenance.enabled ? "bg-[#DC2626]" : "bg-[#D9E0E8]"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    maintenance.enabled ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
                <span className={cn("text-xs font-semibold", maintenance.enabled ? "text-[#DC2626]" : "text-[#6B7280]")}>
                  {maintenance.enabled ? "MAINTENANCE MODE ACTIVE" : "Disabled"}
                </span>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#172F52]">Maintenance Message</label>
                <textarea
                  value={maintenance.message}
                  onChange={(e) => setMaintenance({ ...maintenance, message: e.target.value })}
                  className="w-full rounded-lg border border-[#D9E0E8] px-3 py-2 text-sm text-[#172F52] outline-none focus:border-[#D4145A]"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
