import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";
import { OfflineSync } from "@/components/OfflineSync";
import { SiteHeader } from "@/components/SiteHeader";
import { signOut } from "./login/actions";

const body = Inter({ variable: "--font-body", subsets: ["latin"], display: "swap" });
const display = Barlow_Condensed({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "Coach OS | Alma Football",
  description: "Practice planning and roster for Alma Jr. High Football",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Coach OS", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#003810", viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <SiteHeader signOut={signOut} />
        <OfflineSync />
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:pt-8 md:pb-10">{children}</main>
      </body>
    </html>
  );
}
