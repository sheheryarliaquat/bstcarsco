"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmPasswordReset } from "@/lib/firebase/auth";

const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(data: ResetFormData) {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      await confirmPasswordReset(token, data.password);
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not reset your password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5 sm:p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#168A55]/10">
            <CheckCircle2 className="h-8 w-8 text-[#168A55]" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Password updated</h1>
          <p className="mt-2 text-sm text-[#5B6577]">You can now sign in with your new password.</p>
          <Button
            render={<Link href="/login" />}
            nativeButton={false}
            className="mt-6 h-11 w-full bg-[#1F4FD8] text-base font-semibold text-white hover:bg-[#1F4FD8]/90"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5 sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-[#0F1B2D]">Choose a new password</h1>
        <p className="mt-1 text-sm text-[#5B6577]">Enter a new password for your account</p>
      </div>

      {token === "" ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            This reset link is incomplete. Please use the link from your email, or request a new one.
          </div>
          <Button
            render={<Link href="/forgot-password" />}
            nativeButton={false}
            className="h-11 w-full bg-[#1F4FD8] text-base font-semibold text-white hover:bg-[#1F4FD8]/90"
          >
            Request a new link
          </Button>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-[#0F1B2D]">
                New password
              </Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6577]" />
                <Input id="password" type="password" autoComplete="new-password" className="h-11 pl-10" {...register("password")} />
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#0F1B2D]">
                Confirm new password
              </Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6577]" />
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className="h-11 pl-10"
                  {...register("confirmPassword")}
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-[#1F4FD8] text-base font-semibold text-white hover:bg-[#1F4FD8]/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Set new password
            </Button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-[#5B6577]">
        <Link href="/login" className="font-semibold text-[#1F4FD8] hover:underline">
          Back to Sign In
        </Link>
      </p>
    </div>
  );
}
