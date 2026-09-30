export type Block = {
  /** Start time as "H:MM" (12-hour clock, no am/pm; matches his sheets). */
  start: string;
  /** Number of 5-minute periods this block covers. */
  periods: number;
  /** Warm-up row that isn't a numbered period (his sheets label it FLEX). */
  flex?: boolean;
  /** Full-width block (Break, Halftime, End of Practice). */
  span?: string;
  /** What each coach's group does, keyed by coach last name. */
  lanes?: Record<string, string>;
};

export type Practice = {
  id: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  session: string;
  team: string;
  opponent?: string;
  dress: string;
  lift?: string;
  odMeeting?: string;
  situations?: string;
  coaches: string[];
  blocks: Block[];
  notes: string[];
};

export type Player = {
  id: string;
  first: string;
  last: string;
  grade: 8 | 9;
  number: number;
  otherNumbers: number[];
};

export type RosterData = {
  players: Player[];
  nearDuplicates: { first: string; last: string; grade: number; numbers: number[]; closest: string }[];
  notOnSignOut: { first: string; last: string; grade: number; numbers: number[] }[];
};
