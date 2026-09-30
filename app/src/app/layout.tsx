import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Coach OS | Alma Football",
  description: "Practice planning and roster for Alma Jr. High Football",
};

export const viewport: Viewport = { themeColor: "#003810" };

const nav = [
  { href: "/", label: "Today" },
  { href: "/practice", label: "Practice" },
  { href: "/roster", label: "Team" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <header className="no-print bg-green-900 text-white">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2">
            <Image src="/brand/alma-gold-a.png" alt="Alma" width={44} height={26} priority />
            <span className="whitespace-nowrap text-sm font-semibold tracking-wide">COACH OS</span>
            <nav className="ml-auto flex gap-1">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-white/10">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
