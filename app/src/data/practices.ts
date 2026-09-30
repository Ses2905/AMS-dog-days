import type { Practice } from "@/lib/types";

const COACHES = ["Dugger", "Barrett", "Coursey", "Potts", "Salsbury", "Burns"];
const team = "Alma Jr. High Football";

// Transcribed from "Pea Ridge Jr. High Practice.pdf" (Wednesday, Sept 30, 2026).
// The remaining days come in through the importer (tools/extract_pdfs.py) next.
export const practices: Practice[] = [
  {
    id: "2026-09-30-evening",
    date: "2026-09-30",
    session: "Evening",
    team,
    opponent: "Pea Ridge",
    dress: "Shell",
    lift: "n/a",
    coaches: COACHES,
    blocks: [
      { start: "6:55", periods: 1, span: "Warm-Up", flex: true },
      { start: "7:00", periods: 3, lanes: { Dugger: "Team O", Barrett: "Team O", Coursey: "Scout D", Potts: "Scout D", Salsbury: "Scout D" } },
      { start: "7:15", periods: 2, lanes: { Dugger: "Heavy Team O", Barrett: "Heavy Team O", Coursey: "Scout D", Potts: "Scout D", Salsbury: "Scout D" } },
      { start: "7:25", periods: 1, span: "Punt / Punt Return" },
      { start: "7:30", periods: 3, lanes: { Dugger: "Scout O", Barrett: "Scout O", Coursey: "Team D", Potts: "Team D", Salsbury: "Team D" } },
      { start: "7:45", periods: 1, span: "Halftime" },
      { start: "7:50", periods: 2, span: "Logo Drill (Barrett and Sals)" },
      { start: "8:00", periods: 1, lanes: { Dugger: "Ind O", Barrett: "ABC's", Coursey: "ABC's", Potts: "ABC's", Salsbury: "O Ind O" } },
      { start: "8:05", periods: 2, lanes: { Dugger: "Inside", Barrett: "RVA", Coursey: "RVA", Potts: "RVA", Salsbury: "O Inside" } },
      { start: "8:15", periods: 2, lanes: { Dugger: "Ind D", Barrett: "Ind D", Coursey: "Ind D", Potts: "Ind D", Salsbury: "Ind D" } },
      { start: "8:25", periods: 2, lanes: { Dugger: "D Inside", Barrett: "Skell", Coursey: "Skell", Potts: "Skell", Salsbury: "D Inside" } },
      { start: "8:35", periods: 1, span: "End of Practice" },
    ],
    notes: [
      "Coursey: have the Pea Ridge scout book.",
      "RVA's to the left: 2/4/5/6 Baylor, Wheel, A&M, Arizona, Colorado, Texas, Smoke/Strike.",
    ],
  },
  {
    id: "2026-09-30-school-day",
    date: "2026-09-30",
    session: "School Day",
    team,
    opponent: "Pea Ridge",
    dress: "Shells",
    lift: "3x5 Squat and Power Clean",
    coaches: [...COACHES.slice(0, 5), "Driscoll", "Burns"],
    blocks: [
      { start: "12:55", periods: 1, span: "Warm-Up", flex: true },
      { start: "1:00", periods: 4, span: "Team D" },
      { start: "1:20", periods: 3, span: "Lift: 3x5, Squat and Power Clean" },
      { start: "1:35", periods: 1, span: "End of Practice" },
    ],
    notes: [
      "Motions: Doubles to Trips, 3/6.",
      "Stack/Slant, RR: Star will take back motion.",
      "Stack/Slant, RR, Sooie: Safety will move with it.",
    ],
  },
];

export const getPractice = (id: string) => practices.find((p) => p.id === id);
