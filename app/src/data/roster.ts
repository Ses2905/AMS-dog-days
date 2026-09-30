import raw from "./roster.json";
import type { RosterData } from "@/lib/types";

// Extracted from "OFFICIAL Alma Jr. High Roster 26.pdf" by tools/extract_pdfs.py.
// The sign-out list is the base; numbers that differ on other lists are kept as otherNumbers.
export const roster = raw as RosterData;
