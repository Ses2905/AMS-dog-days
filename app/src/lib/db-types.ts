/** Plain types shared by server and client code (kept out of db.ts, which imports server-only code). */
export type Coach = { id: string; first: string | null; last: string; role: string; active: boolean };

export type Note = {
  id: string;
  kind: "note" | "action";
  body: string;
  status: "open" | "done";
  due: string | null;
  owner: string | null;
  playerId: string | null;
  practiceId: string | null;
  source: "manual" | "plaud";
  created: string;
};
