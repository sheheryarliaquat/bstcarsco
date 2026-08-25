import type { Metadata } from "next";
import Link from "next/link";
import { Car } from "lucide-react";

export const metadata: Metadata = {
  title: "Blue Star Airport Transfers LTD - Authentication",
  description:
    "Sign in or create an account to book your next journey with Blue Star Airport Transfers LTD.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-[#172F52] lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="mx-auto max-w-md px-8 text-center">
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4145A]">
              <Car className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Blue Star Airport Transfers LTD</span>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white">
            Your Journey, Your Way
          </h1>
          <p className="text-lg text-white/70">
            Compare quotes from licensed operators across the United Kingdom.
            Book with confidence, travel in comfort.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-[#D4145A]">34+</p>
              <p className="mt-1 text-sm text-white/60">Operators</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#D4145A]">15k+</p>
              <p className="mt-1 text-sm text-white/60">Passengers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#D4145A]">4.8</p>
              <p className="mt-1 text-sm text-white/60">Avg Rating</p>
            </div>
          </div>
        </div>
      </div>

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

        <div className="w-full max-w-md">{children}</div>

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
  );
}
