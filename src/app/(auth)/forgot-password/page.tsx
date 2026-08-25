"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/firebase/auth";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setLoading(true);
    setError("");
    try {
      await resetPassword(data.email);
      setSent(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      if (message.includes("user-not-found")) {
        setSent(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5 sm:p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#168A55]/10">
            <CheckCircle2 className="h-8 w-8 text-[#168A55]" />
          </div>
          <h1 className="text-2xl font-bold text-[#172F52]">
            Check your email
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            We&apos;ve sent a password reset link to{" "}
            <span className="font-medium text-[#172033]">
              {getValues("email")}
            </span>
          </p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Please check your inbox and follow the instructions. The link will
            expire in 60 minutes.
          </p>
          <Button
            render={<Link href="/login" />}
            nativeButton={false}
            className="mt-6 h-11 w-full bg-[#D4145A] text-base font-semibold text-white hover:bg-[#D4145A]/90"
          >
            Back to Sign In
          </Button>
          <p className="mt-4 text-sm text-[#6B7280]">
            Didn&apos;t receive the email?{" "}
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setError("");
              }}
              className="font-semibold text-[#D4145A] hover:underline"
            >
              Try again
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5 sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-[#172F52]">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Enter your email address and we&apos;ll send you a link to reset your
          password
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
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
              placeholder="you@example.com"
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

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full bg-[#D4145A] text-base font-semibold text-white hover:bg-[#D4145A]/90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B7280] hover:text-[#172F52]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
