"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "./Icon";
import { clearOfflineCopies } from "./OfflineSync";

// Ordered the way a coach works: what is happening now, what is coming, the two workflows, the people, then capture.
const tabs: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Today", icon: "home" },
  { href: "/calendar", label: "Calendar", icon: "calendar" },
  { href: "/practice", label: "Practice", icon: "practice" },
  { href: "/games", label: "Games", icon: "trophy" },
  { href: "/roster", label: "Team", icon: "users" },
  { href: "/notes", label: "Notes", icon: "note" },
];
const more: { href: string; label: string; icon: IconName }[] = [
  { href: "/assistant", label: "Assistant", icon: "chat" },
  { href: "/tools", label: "Tools", icon: "wrench" },
  { href: "/documents", label: "Library", icon: "book" },
  { href: "/settings", label: "Settings", icon: "sliders" },
];

/**
 * Phones: a slim top bar (logo and Menu) plus a tab bar at the bottom, where a thumb reaches.
 * Wide screens: the same tabs under the logo, and the extra links top right.
 */
export function SiteHeader({ signOut }: { signOut: () => Promise<void> }) {
  const path = usePathname();
  const signedIn = !path.startsWith("/login");
  // The menu is open only for the page it was opened on, so navigating closes it without an effect.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const menuOpen = openAt === path;
  const active = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));

  return (
    <>
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
                    <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined} className={`inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors hover:bg-white/10 ${active(l.href) ? "text-gold-500" : "text-white/80"}`}>
                      <Icon name={l.icon} size={16} />{l.label}
                    </Link>
                  ))}
                  <form action={signOut} onSubmit={clearOfflineCopies}><button className="ml-1 inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"><Icon name="log-out" size={16} />Sign Out</button></form>
                </nav>
                <button
                  className="ml-auto inline-flex min-h-12 items-center gap-2 rounded-md px-3 text-sm font-semibold text-white/90 hover:bg-white/10 md:hidden"
                  aria-expanded={menuOpen} aria-controls="more-menu" onClick={() => setOpenAt(menuOpen ? null : path)}
                >
                  Menu<Icon name={menuOpen ? "x" : "menu"} />
                </button>
              </>
            )}
          </div>

          {signedIn && menuOpen && (
            <nav id="more-menu" className="-mx-3 mb-2 grid gap-1 border-t border-white/15 pt-2 md:hidden" aria-label="More">
              {more.map((l) => (
                <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined} className={`flex min-h-12 items-center gap-3 rounded-md px-3 text-base font-semibold hover:bg-white/10 ${active(l.href) ? "text-gold-500" : "text-white"}`}><Icon name={l.icon} />{l.label}</Link>
              ))}
              <form action={signOut} onSubmit={clearOfflineCopies}><button className="flex min-h-12 w-full items-center gap-3 rounded-md px-3 text-base font-semibold text-white/80 hover:bg-white/10"><Icon name="log-out" />Sign Out</button></form>
            </nav>
          )}

          {signedIn && (
            <nav className="-ml-5 hidden md:flex" aria-label="Main">
              {tabs.map((l) => (
                <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined}
                  className={`font-display border-b-4 px-5 pb-2 pt-2.5 text-lg font-semibold uppercase tracking-wider transition-colors ${active(l.href) ? "border-gold-500 text-white" : "border-transparent text-white/70 hover:text-white"}`}>
                  {l.label}
                </Link>
              ))}
            </nav>
          )}
          {!signedIn && <div className="h-2" />}
        </div>
      </header>

      {signedIn && (
        <nav aria-label="Main" className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-green-900 pb-[env(safe-area-inset-bottom)] md:hidden">
          <ul className="mx-auto flex max-w-xl">
            {tabs.map((l) => (
              <li key={l.href} className="flex-1">
                <Link href={l.href} aria-current={active(l.href) ? "page" : undefined}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-semibold tracking-wide transition-colors ${active(l.href) ? "text-gold-500" : "text-white/70"}`}>
                  <Icon name={l.icon} size={22} />{l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
