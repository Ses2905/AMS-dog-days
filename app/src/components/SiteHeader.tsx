"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Today" },
  { href: "/practice", label: "Practice" },
  { href: "/roster", label: "Team" },
  { href: "/games", label: "Games" },
  { href: "/notes", label: "Notes" },
];

/** Brand bar, plus the main tabs and Sign out once someone is signed in (everything except the login page). */
export function SiteHeader({ signOut }: { signOut: () => Promise<void> }) {
  const path = usePathname();
  const signedIn = !path.startsWith("/login");
  const active = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));
  return (
    <header className="no-print bg-green-900 text-white">
      <div className={`mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 px-4 pt-2 ${signedIn ? "sm:pb-0" : "pb-2"}`}>
        <Image src="/brand/alma-gold-a.png" alt="Alma" width={44} height={26} priority />
        <span className="font-display whitespace-nowrap text-xl font-bold uppercase tracking-widest">Coach OS</span>
        {signedIn && (
          <>
            <div className="ml-auto flex items-center sm:order-last sm:ml-4">
              <Link href="/documents" aria-current={path.startsWith("/documents") ? "page" : undefined} className={`inline-flex min-h-10 items-center rounded-md px-3 text-sm font-medium hover:bg-white/10 ${path.startsWith("/documents") ? "text-gold-500" : "text-white/70"}`}>Library</Link>
              <form action={signOut}><button className="min-h-10 rounded-md px-3 text-sm font-medium text-white/70 hover:bg-white/10">Sign out</button></form>
            </div>
            <nav className="order-last flex w-full sm:order-none sm:ml-auto sm:w-auto" aria-label="Main">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active(l.href) ? "page" : undefined}
                  className={`font-display flex-1 border-b-4 px-1 py-2.5 text-center text-base font-semibold uppercase tracking-wide sm:flex-none sm:px-4 sm:text-lg sm:tracking-wider ${active(l.href) ? "border-gold-500 text-white" : "border-transparent text-white/70 hover:text-white"}`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </>
        )}
      </div>
    </header>
  );
}
