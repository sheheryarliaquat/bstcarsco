"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Car,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn, getUserData, signOutUser } from "@/lib/firebase/auth"

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function OperatorLoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginFormData) {
    setLoading(true)
    setError("")
    try {
      const result = await signIn(data.email, data.password)
      const userData = await getUserData(result.user.uid)
      const role = userData?.role
      if (role === "operator") {
        router.push("/operator/dashboard")
      } else {
        // Don't leave a non-operator session signed in on the operator portal.
        await signOutUser()
        setError("You do not have operator access. Please use your operator credentials.")
      }
    } catch {
      setError("Invalid email or password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden w-1/2 bg-[#172F52] lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="mx-auto max-w-md px-8 text-center">
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4145A]">
              <Car className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Blue Star Airport Transfers LTD</span>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white">
            Operator Portal
          </h1>
          <p className="text-lg text-white/70">
            Sign in to manage your fleet, drivers, bookings, and payouts.
          </p>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex w-full flex-col items-center justify-center bg-[#F5F7FA] px-4 py-12 lg:w-1/2">
        <div className="mb-8 lg:hidden">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#172F52]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4145A]">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Blue Star Airport Transfers LTD</span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5 sm:p-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-[#172F52]">
                Welcome back
              </h1>
              <p className="mt-1 text-sm text-[#6B7280]">
                Sign in to your operator account
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-[#172033]"
                >
                  Email address
                </Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@operator.co.uk"
                    className="h-11 pl-10"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-[#172033]"
                  >
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-[#D4145A] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="h-11 pl-10 pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#172033]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full bg-[#D4145A] text-base font-semibold text-white hover:bg-[#D4145A]/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B7280] hover:text-[#172F52]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to main site
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-[#6B7280]">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-[#D4145A] hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-[#D4145A] hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
