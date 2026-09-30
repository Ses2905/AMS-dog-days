/** Brand color and letter for the tools page. Real logo files can replace these later; until then a colored tile keeps it quick to scan. */
const BRANDS: { match: RegExp; bg: string; fg: string; mark: string }[] = [
  { match: /hudl\.com$/, bg: "#FF6300", fg: "#fff", mark: "H" },
  { match: /sportsyou\.com$/, bg: "#0B6BCB", fg: "#fff", mark: "S" },
  { match: /(drive|docs|sheets|slides)\.google\.com$/, bg: "#1FA463", fg: "#fff", mark: "D" },
  { match: /mail\.google\.com$/, bg: "#D93025", fg: "#fff", mark: "M" },
  { match: /calendar\.google\.com$/, bg: "#4285F4", fg: "#fff", mark: "31" },
  { match: /(^|\.)google\.com$/, bg: "#4285F4", fg: "#fff", mark: "G" },
  { match: /almaairedales\.com$|almasd\.net$/, bg: "#003810", fg: "#C4B259", mark: "A" },
  { match: /plaud\.ai$/, bg: "#111111", fg: "#fff", mark: "P" },
];

export function toolBrand(label: string, url: string): { bg: string; fg: string; mark: string } {
  let host = "";
  try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { /* fall through to the default tile */ }
  const hit = BRANDS.find((b) => b.match.test(host));
  return hit ?? { bg: "#006030", fg: "#fff", mark: (label.trim()[0] ?? "?").toUpperCase() };
}
