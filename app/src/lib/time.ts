/** Add minutes to an "H:MM" clock string (12-hour clock, no am/pm). */
export function addMinutes(t: string, mins: number): string {
  const [h, m] = t.split(":").map(Number);
  const total = (h % 12) * 60 + m + mins;
  const hh = Math.floor(total / 60) % 12 || 12;
  return `${hh}:${String(total % 60).padStart(2, "0")}`;
}

export function periodTimes(start: string, periods: number): string[] {
  return Array.from({ length: periods }, (_, i) => addMinutes(start, i * 5));
}

/** "Wednesday, Sept 30" from an ISO date, ignoring time zones. */
export function prettyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric", timeZone: "UTC",
  });
}
