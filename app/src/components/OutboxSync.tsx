"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { setAttendance } from "@/app/practice/[id]/attendance-actions";
import { clearPending, pendingFrom, readOutbox, readOutboxRaw, subscribeOutbox } from "@/lib/outbox-store";
import { Icon } from "./Icon";

/** Sends attendance taps that were made without a signal, as soon as there is one. Says so while any are waiting. */
export function OutboxSync() {
  const raw = useSyncExternalStore(subscribeOutbox, readOutboxRaw, () => null);
  const waiting = useMemo(() => pendingFrom(raw).length, [raw]);
  const busy = useRef(false);

  useEffect(() => {
    const flush = async () => {
      if (busy.current || !navigator.onLine) return;
      busy.current = true;
      try {
        for (const p of readOutbox()) {
          const r = await setAttendance(p.practiceId, p.playerId, p.mark);
          if (r.error) break; // keep it and try again next time; the server said why
          clearPending(p);
        }
      } catch { /* still no signal */ } finally { busy.current = false; }
    };
    flush();
    window.addEventListener("online", flush);
    const timer = window.setInterval(flush, 30_000);
    return () => { window.removeEventListener("online", flush); window.clearInterval(timer); };
  }, []);

  if (waiting === 0) return null;
  return (
    <div role="status" className="no-print bg-gold-500/90 px-4 py-2 text-center text-sm font-semibold text-green-900">
      <Icon name="wifi-off" size={16} className="mr-2 inline align-[-3px]" />
      {waiting} attendance {waiting === 1 ? "mark is" : "marks are"} saved on this phone and will send when you have a signal.
    </div>
  );
}
