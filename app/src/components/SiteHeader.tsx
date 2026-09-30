"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const tabs = [
  { href: "/", label: "Today" },
  { href: "/practice", label: "Practice" },
  { href: "/roster", label: "Team" },
  { href: "/games", label: "Games" },
  { href: "/notes", label: "Notes" },
];
const more = [
  { href: "/assistant", label: "Assistant" },
  { href: "/tools", label: "Tools" },
  { href: "/documents", label: "Library" },
  { href: "/settings", label: "Settings" },
];

/**
 * Two tiers. The tabs are what a coach opens all day, so they sit alone on their own row and never wrap.
 * Everything else lives at the top right: inline on wide screens, behind a Menu button on phones.
 */
export function SiteHeader({ signOut }: { signOut: () => Promise<void> }) {
  const path = usePathname();
  const signedIn = !path.startsWith("/login");
  // The menu is open only for the page it was opened on, so navigating closes it without an effect.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const menuOpen = openAt === path;
  const active = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));

  return (
    <header className="no-print bg-green-900 pt-[env(safe-area-inset-top)] text-white" onKeyDown={(e) => { if (e.key === "Escape") setOpenAt(null); }}>
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex min-h-14 items-center gap-3">
          <Link href={signedIn ? "/" : "/login"} className="flex items-center gap-3 rounded-md" aria-label="Coach OS home">
            <Image src="/brand/alma-gold-a-header.png" alt="" width={48} height={28} unoptimized priority className="h-7 w-12" />
            <span className="font-display whitespace-nowrap text-xl font-bold uppercase tracking-widest">Coach OS</span>
          </Link>

          {signedIn && (
            <>
              <nav className="ml-auto hidden items-center md:flex" aria-label="More">
                {more.map((l) => (
                  <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-white/10 ${active(l.href) ? "text-gold-500" : "text-white/75"}`}>{l.label}</Link>
                ))}
                <form action={signOut}><button className="ml-1 inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/10">Sign out</button></form>
              </nav>
              <button
                className="ml-auto inline-flex min-h-12 items-center gap-2 rounded-md px-3 text-sm font-semibold text-white/85 hover:bg-white/10 md:hidden"
                aria-expanded={menuOpen} aria-controls="more-menu" onClick={() => setOpenAt(menuOpen ? null : path)}
              >
                Menu
                <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  {menuOpen ? <path d="M4 4l10 10M14 4L4 14" /> : <path d="M3 5h12M3 9h12M3 13h12" />}
                </svg>
              </button>
            </>
          )}
        </div>

        {signedIn && menuOpen && (
          <nav id="more-menu" className="-mx-3 mb-2 grid gap-1 border-t border-white/15 pt-2 md:hidden" aria-label="More">
            {more.map((l) => (
              <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined} className={`flex min-h-12 items-center rounded-md px-3 text-base font-medium hover:bg-white/10 ${active(l.href) ? "text-gold-500" : "text-white"}`}>{l.label}</Link>
            ))}
            <form action={signOut}><button className="flex min-h-12 w-full items-center rounded-md px-3 text-base font-medium text-white/75 hover:bg-white/10">Sign out</button></form>
          </nav>
        )}

        {signedIn && (
          <nav className="flex sm:-ml-5" aria-label="Main">
            {tabs.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active(l.href) ? "page" : undefined}
                className={`font-display flex-1 border-b-4 px-1 pb-2 pt-2.5 text-center text-base font-semibold uppercase tracking-wide transition-colors sm:flex-none sm:px-5 sm:text-lg sm:tracking-wider ${active(l.href) ? "border-gold-500 text-white" : "border-transparent text-white/70 hover:text-white"}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
        {!signedIn && <div className="h-2" />}
      </div>
    </header>
  );
}
