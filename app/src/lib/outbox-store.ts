"use client";

import { addPending, dropPending, OUTBOX_KEY, parseOutbox, type Pending } from "./outbox";

const EVENT = "coach-os-outbox";

export const readOutboxRaw = () => { try { return window.localStorage.getItem(OUTBOX_KEY); } catch { return null; } };
export const pendingFrom = (raw: string | null) => parseOutbox(raw, Date.now());
export const readOutbox = () => pendingFrom(readOutboxRaw());

function write(list: Pending[]) {
  try { window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(list)); } catch { /* private mode: the tap stays on screen only */ }
  window.dispatchEvent(new Event(EVENT));
}
export const pendingTap = (practiceId: string, playerId: string, mark: Pending["mark"]): Pending => ({ practiceId, playerId, mark, at: Date.now() });
export const queuePending = (p: Pending) => write(addPending(readOutbox(), p));
export const clearPending = (p: Pending) => write(dropPending(readOutbox(), p));
export const clearOutbox = () => { try { window.localStorage.removeItem(OUTBOX_KEY); } catch { /* private mode */ } };

export function subscribeOutbox(cb: () => void) {
  window.addEventListener(EVENT, cb); window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", cb); };
}
