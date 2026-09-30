export const SESSION_CHOICES = ["School Day", "Evening", "After School"] as const;
export const DEFAULT_START: Record<string, string> = { "School Day": "12:55", Evening: "6:55", "After School": "3:45" };

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const practiceId = (date: string, session: string) => `${date}-${slug(session)}`;

export type NewPractice = { date: string; session: string; from: string | null };

export function parseNewPractice(input: { date?: unknown; session?: unknown; custom?: unknown; from?: unknown }): { ok: true; value: NewPractice } | { ok: false; error: string } {
  const date = typeof input.date === "string" ? input.date.trim() : "";
  const d = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== date) return { ok: false, error: "Pick a date." };
  const custom = typeof input.custom === "string" ? input.custom.trim() : "";
  const chosen = typeof input.session === "string" ? input.session.trim() : "";
  const session = custom || chosen;
  if (!session) return { ok: false, error: "Pick a session, like School Day or Evening." };
  if (session.length > 30) return { ok: false, error: "Session name is too long (max 30 characters)." };
  if (!slug(session)) return { ok: false, error: "Session name needs letters or numbers." };
  const from = typeof input.from === "string" && input.from.trim() ? input.from.trim() : null;
  if (from && from.length > 100) return { ok: false, error: "Unknown practice to copy." };
  return { ok: true, value: { date, session, from } };
}
