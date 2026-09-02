"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signIn, signInWithGoogle, getUserData } from "@/lib/firebase/auth";

const ROLE_ROUTES: Record<string, string> = {
  passenger: "/passenger/dashboard",
  driver: "/driver/dashboard",
  admin: "/admin/dashboard",
  operator: "/operator/dashboard",
};

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

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
  });

  async function onSubmit(data: LoginFormData) {
    setLoading(true);
    setError("");
    try {
      const result = await signIn(data.email, data.password);
      const userData = await getUserData(result.user.uid);
      const role = userData?.role || "passenger";
      router.push(ROLE_ROUTES[role] || "/passenger/dashboard");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError("");
    try {
      const result = await signInWithGoogle();
      const userData = await getUserData(result.user.uid);
      const role = userData?.role || "passenger";
      router.push(ROLE_ROUTES[role] || "/passenger/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      if (message.includes("popup-closed-by-user")) {
        setError("");
      } else {
        setError("Failed to sign in with Google. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5 sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-[#172F52]">Welcome back</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Sign in to your account to continue
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="mb-4 h-11 w-full border-[#D9E0E8] text-[#172033] hover:bg-[#F5F7FA]"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Globe className="mr-2 h-4 w-4" />
        )}
        Sign in with Google
      </Button>

      <div className="relative mb-4">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-[#6B7280]">
          or continue with email
        </span>
      </div>

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

        <label className="flex items-center gap-2 text-sm text-[#172033]">
          <Checkbox defaultChecked />
          Remember me
        </label>

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

      <div className="mt-4 text-center text-sm text-[#6B7280]">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#D4145A] hover:underline"
        >
          Register
        </Link>
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/"
          className="text-sm font-medium text-[#6B7280] hover:text-[#172F52]"
        >
          Continue as guest &rarr;
        </Link>
      </div>
    </div>
  );
}
