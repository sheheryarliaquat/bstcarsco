import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Blue Star Airport Transfers LTD | Compare & Book UK Taxi Services",
    template: "%s | Blue Star Airport Transfers LTD",
  },
  description:
    "Compare trusted UK taxi providers and book your journey at the best available price. Airport transfers, corporate travel, and more across the United Kingdom.",
  keywords: [
    "UK taxi booking",
    "taxi comparison",
    "airport transfer UK",
    "book taxi online",
    "UK minicab",
  ],
  openGraph: {
    title: "Blue Star Airport Transfers LTD",
    description:
      "Compare trusted UK taxi providers and book your journey at the best available price.",
    locale: "en_GB",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
