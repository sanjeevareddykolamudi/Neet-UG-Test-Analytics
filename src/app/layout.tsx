import type { Metadata, Viewport } from "next";

import { Providers } from "@/providers/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEET Test Analytics",
  description: "Analyze scanned NEET question papers, answer patterns, weak topics, and revision plans.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NEET Analytics"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
