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
  User,
  Phone,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { signUp, getUserData } from "@/lib/firebase/auth";
import type { UserRole } from "@/types";

const ROLE_ROUTES: Record<string, string> = {
  passenger: "/passenger/dashboard",
  driver: "/driver/dashboard",
  admin: "/admin/dashboard",
  operator: "/operator/dashboard",
};

const registerSchema = z
  .object({
    role: z.enum(["passenger", "driver"]),
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name must be under 50 characters"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(50, "Last name must be under 50 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .regex(
        /^\+44\d{10}$/,
        "Please enter a valid UK phone number (e.g. +447700900000)"
      ),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    agreeToTerms: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.agreeToTerms === true, {
    message: "You must agree to the Terms and Conditions",
    path: ["agreeToTerms"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"passenger" | "driver">("passenger");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "passenger",
      firstName: "",
      lastName: "",
      email: "",
      phone: "+44",
      password: "",
      confirmPassword: "",
    },
  });

  function handleRoleSwitch(newRole: "passenger" | "driver") {
    setRole(newRole);
    setValue("role", newRole);
  }

  async function onSubmit(data: RegisterFormData) {
    setLoading(true);
    setError("");
    try {
      const result = await signUp(data.email, data.password, {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role as UserRole,
      });
      const userData = await getUserData(result.user.uid);
      const role = userData?.role || data.role;
      router.push(ROLE_ROUTES[role] || "/passenger/dashboard");
    } catch {
      router.push(ROLE_ROUTES[data.role] || "/passenger/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5 sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-[#172F52]">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Join thousands of passengers and drivers across the UK
        </p>
      </div>

      <div className="mb-6 flex rounded-lg bg-[#F5F7FA] p-1">
        <button
          type="button"
          onClick={() => handleRoleSwitch("passenger")}
          className={cn(
            "flex-1 rounded-md py-2.5 text-sm font-medium transition-colors",
            role === "passenger"
              ? "bg-white text-[#172F52] shadow-sm"
              : "text-[#6B7280] hover:text-[#172033]"
          )}
        >
          Passenger
        </button>
        <button
          type="button"
          onClick={() => handleRoleSwitch("driver")}
          className={cn(
            "flex-1 rounded-md py-2.5 text-sm font-medium transition-colors",
            role === "driver"
              ? "bg-white text-[#172F52] shadow-sm"
              : "text-[#6B7280] hover:text-[#172033]"
          )}
        >
          Driver
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register("role")} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label
              htmlFor="firstName"
              className="text-sm font-medium text-[#172033]"
            >
              First name
            </Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
              <Input
                id="firstName"
                placeholder="James"
                className="h-11 pl-10"
                {...register("firstName")}
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-600">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <Label
              htmlFor="lastName"
              className="text-sm font-medium text-[#172033]"
            >
              Last name
            </Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
              <Input
                id="lastName"
                placeholder="Wilson"
                className="h-11 pl-10"
                {...register("lastName")}
              />
            </div>
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-600">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

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
          <Label
            htmlFor="phone"
            className="text-sm font-medium text-[#172033]"
          >
            Phone number
          </Label>
          <div className="relative mt-1.5">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              id="phone"
              type="tel"
              placeholder="+447700900000"
              className="h-11 pl-10"
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div>
          <Label
            htmlFor="password"
            className="text-sm font-medium text-[#172033]"
          >
            Password
          </Label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min 8 characters"
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

        <div>
          <Label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-[#172033]"
          >
            Confirm password
          </Label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter your password"
              className="h-11 pl-10 pr-10"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#172033]"
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <label className="flex items-start gap-2 text-sm text-[#172033]">
          <Checkbox
            className="mt-0.5"
            onCheckedChange={(checked) =>
              setValue("agreeToTerms", checked === true, {
                shouldValidate: true,
              })
            }
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-[#D4145A] hover:underline">
              Terms and Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-[#D4145A] hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>
        {errors.agreeToTerms && (
          <p className="text-xs text-red-600">
            {errors.agreeToTerms.message}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full bg-[#D4145A] text-base font-semibold text-white hover:bg-[#D4145A]/90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#6B7280]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#D4145A] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
