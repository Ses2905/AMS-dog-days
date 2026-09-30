"use client";

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { clearOutbox } from "@/lib/outbox-store";
import { Icon } from "./Icon";

const KEY = "coach-os-synced";
const EVERY = 20 * 60 * 1000;

const subscribeOnline = (cb: () => void) => { window.addEventListener("online", cb); window.addEventListener("offline", cb); return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); }; };
const subscribeSaved = (cb: () => void) => { window.addEventListener("coach-os-synced", cb); window.addEventListener("storage", cb); return () => { window.removeEventListener("coach-os-synced", cb); window.removeEventListener("storage", cb); }; };
const readSaved = () => { try { return window.localStorage.getItem(KEY); } catch { return null; } };

/** Called on Sign Out: the saved pages belong to the person who was signed in. */
export function clearOfflineCopies() {
  try { window.localStorage.removeItem(KEY); } catch { /* private mode */ }
  clearOutbox();
  navigator.serviceWorker?.controller?.postMessage({ type: "clear" });
}

/** Keeps a copy of today's pages on the phone, and says so plainly when there is no signal. Reading and attendance work offline; other saving does not. */
export function OfflineSync() {
  const path = usePathname();
  const signedIn = !path.startsWith("/login");
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const saved = useSyncExternalStore(subscribeSaved, readSaved, () => null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => { /* no offline copies; the app still works online */ });
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "cached") {
        try { window.localStorage.setItem(KEY, String(e.data.at)); } catch { /* private mode */ }
        window.dispatchEvent(new Event("coach-os-synced"));
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator) || !signedIn || !online) return;
    const last = Number(readSaved() ?? 0);
    if (Date.now() - last < EVERY) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/offline-list", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const { urls } = (await res.json()) as { urls: string[] };
        const reg = await navigator.serviceWorker.ready;
        reg.active?.postMessage({ type: "cache-urls", urls });
      } catch { /* try again next visit */ }
    })();
    return () => { cancelled = true; };
  }, [signedIn, online, path]);

  if (online || !signedIn) return null;
  const when = saved ? new Date(Number(saved)).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" }) : null;
  return (
    <div role="status" className="no-print sticky top-0 z-30 bg-gold-500 px-4 py-2 text-center text-sm font-semibold text-green-900">
      <Icon name="wifi-off" size={16} className="mr-2 inline align-[-3px]" />
      You&apos;re offline. {when ? `Showing pages saved at ${when}.` : "Only pages you opened before will show."} You can read plans and scripts and take attendance; other changes need a signal.
    </div>
  );
}
