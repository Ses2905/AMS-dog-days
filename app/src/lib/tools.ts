import { GLYPHS } from "./tool-glyphs";

export type ToolBrand = { bg: string; fg: string; mark: string; glyph?: string; logo?: string };

/** Logo files dropped into app/public/tools/. Add a line here when a file is added. */
export const LOGO_FILES: Record<string, string> = {
  // hudl: "/tools/hudl.png",
};

const BRANDS: { match: RegExp; brand: ToolBrand }[] = [
  { match: /hudl\.com$/, brand: { bg: "#FF6300", fg: "#fff", mark: "H", logo: LOGO_FILES.hudl } },
  { match: /sportsyou\.com$/, brand: { bg: "#0B6BCB", fg: "#fff", mark: "S", logo: LOGO_FILES.sportsyou } },
  { match: /(drive|docs|sheets|slides)\.google\.com$/, brand: { bg: "#1FA463", fg: "#fff", mark: "D", glyph: GLYPHS.drive } },
  { match: /mail\.google\.com$/, brand: { bg: "#EA4335", fg: "#fff", mark: "M", glyph: GLYPHS.gmail } },
  { match: /calendar\.google\.com$/, brand: { bg: "#4285F4", fg: "#fff", mark: "31", glyph: GLYPHS.calendar } },
  { match: /(^|\.)google\.com$/, brand: { bg: "#4285F4", fg: "#fff", mark: "G" } },
  { match: /almaairedales\.com$|almasd\.net$/, brand: { bg: "#003810", fg: "#C4B259", mark: "A", logo: "/brand/alma-gold-a-header.png" } },
  { match: /plaud\.ai$/, brand: { bg: "#111111", fg: "#fff", mark: "P", logo: LOGO_FILES.plaud } },
];

export function toolBrand(label: string, url: string): ToolBrand {
  let host = "";
  try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { /* fall through to the default tile */ }
  return BRANDS.find((b) => b.match.test(host))?.brand ?? { bg: "#006030", fg: "#fff", mark: (label.trim()[0] ?? "?").toUpperCase() };
}
