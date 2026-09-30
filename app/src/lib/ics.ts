import { levelLabel, type Level } from "./games";
import { toMinutes } from "./week";

export type FeedGame = { id: string; date: string; time: string | null; opponent: string; site: "home" | "away" | "neutral"; location: string | null; level: Level; status: string };
export type FeedPractice = { id: string; date: string; session: string; dress: string | null; opponent: string | null; start: string | null; periods: number };
export type Feed = { games: FeedGame[]; practices: FeedPractice[] };

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** RFC 5545 asks for lines of at most 75 bytes; longer lines continue on the next line after a space. */
export function fold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    const limit = out.length === 0 ? 75 : 74;
    if (enc.encode(cur + ch).length > limit) { out.push(cur); cur = ch; } else cur += ch;
  }
  out.push(cur);
  return out.join("\r\n ");
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const dt = (date: string, minutes: number) => `${date.replace(/-/g, "")}T${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}${String(minutes % 60).padStart(2, "0")}00`;
const addDay = (iso: string) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10).replace(/-/g, ""); };

/** "5:30 PM" to minutes after midnight, or null when the time is not set. */
export function gameMinutes(t: string | null): number | null {
  const m = t?.match(/^(\d{1,2}):(\d{2})\s*([AP])M$/i);
  return m ? (Number(m[1]) % 12 + (m[3].toUpperCase() === "P" ? 12 : 0)) * 60 + Number(m[2]) : null;
}

const TZ = [
  "BEGIN:VTIMEZONE", "TZID:America/Chicago",
  "BEGIN:DAYLIGHT", "TZOFFSETFROM:-0600", "TZOFFSETTO:-0500", "TZNAME:CDT", "DTSTART:19700308T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU", "END:DAYLIGHT",
  "BEGIN:STANDARD", "TZOFFSETFROM:-0500", "TZOFFSETTO:-0600", "TZNAME:CST", "DTSTART:19701101T020000", "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU", "END:STANDARD",
  "END:VTIMEZONE",
];

export function buildIcs(feed: Feed, now = new Date()): string {
  const lines: string[] = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Coach OS//Alma Football//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:Coach OS | Alma Football", "X-WR-TIMEZONE:America/Chicago", "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H", ...TZ];
  const ts = stamp(now);

  for (const g of feed.games) {
    if (g.status === "cancelled") continue;
    const start = gameMinutes(g.time);
    const title = `${levelLabel(g.level)}: ${g.site === "away" ? "@ " : "vs "}${g.opponent}${g.status === "postponed" ? " (postponed)" : ""}`;
    const ev = ["BEGIN:VEVENT", `UID:game-${g.id}@coach-os`, `DTSTAMP:${ts}`, `SUMMARY:${esc(title)}`];
    if (start === null) ev.push(`DTSTART;VALUE=DATE:${g.date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${addDay(g.date)}`);
    else ev.push(`DTSTART;TZID=America/Chicago:${dt(g.date, start)}`, `DTEND;TZID=America/Chicago:${dt(g.date, start + 150)}`);
    if (g.location) ev.push(`LOCATION:${esc(g.location)}`);
    ev.push(`DESCRIPTION:${esc(`${levelLabel(g.level)} game, ${g.site}`)}`, "END:VEVENT");
    lines.push(...ev);
  }
  for (const p of feed.practices) {
    if (!p.start || !p.periods) continue; // a practice with no plan has no time to show
    const start = toMinutes(p.start);
    lines.push("BEGIN:VEVENT", `UID:practice-${p.id}@coach-os`, `DTSTAMP:${ts}`, `SUMMARY:${esc(`${p.session} practice`)}`,
      `DTSTART;TZID=America/Chicago:${dt(p.date, start)}`, `DTEND;TZID=America/Chicago:${dt(p.date, start + p.periods * 5)}`,
      ...(p.dress || p.opponent ? [`DESCRIPTION:${esc([p.dress && `Dress: ${p.dress}`, p.opponent && `Opponent week: ${p.opponent}`].filter(Boolean).join("\n"))}`] : []), "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
