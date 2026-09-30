"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Icon } from "@/components/Icon";
import { btnOutline, btnPrimary } from "@/components/ui";

/** Shown when a page fails to load. The header and tab bar stay, so he can always go somewhere else. */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl bg-white p-6 text-center shadow-sm">
      <h1>That Page Didn&apos;t Load</h1>
      <p className="text-neutral-700">Something went wrong on our end, or the connection dropped. Your data is safe. Try again, or go to another tab.</p>
      {error.digest && <p className="text-xs text-neutral-500">Reference: {error.digest}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        <button className={btnPrimary} onClick={() => retry()}><Icon name="retry" />Try Again</button>
        <Link href="/" className={btnOutline}><Icon name="home" />Go to Today</Link>
      </div>
    </div>
  );
}
