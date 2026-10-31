import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Blue Star Airport Transfers LTD | UK Private Hire Booking",
    template: "%s | Blue Star Airport Transfers LTD",
  },
  description:
    "Compare trusted UK private hire providers and book your journey at the best available price. Airport transfers, corporate travel, and more across the United Kingdom.",
  keywords: [
    "UK car hire booking",
    "private hire comparison",
    "airport transfer UK",
    "book car hire online",
    "UK minicab",
  ],
  openGraph: {
    title: "Blue Star Airport Transfers LTD",
    description:
      "Compare trusted UK private hire providers and book your journey at the best available price.",
    locale: "en_GB",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
