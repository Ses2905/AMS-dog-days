"""Reads the varsity roster PDF by word position and writes data/seed/varsity-roster.json.
Usage: python3 tools/extract_varsity.py <path-to-pdf>
Rows with only a jersey number (unassigned numbers) are skipped."""
import json, sys
import pymupdf

page = pymupdf.open(sys.argv[1])[0]
words = page.get_text("words")
stop = min(w[1] for w in words if w[4].startswith("Coaching"))
# Column left edges, measured from the header row: (name, left x) for each table.
TABLES = {
    "L": [("number", 50), ("first", 62), ("last", 110), ("position", 160), ("grade", 200), ("height", 232), ("weight", 255)],
    "R": [("number", 274), ("first", 288), ("last", 330), ("position", 375), ("grade", 410), ("height", 438), ("weight", 458)],
}
def side(w): return "L" if w[0] < 272 else "R"
body = [w for w in words if 80 < w[1] < stop - 2 and w[0] < 500]
rows = {"L": [], "R": []}
for s in ("L", "R"):
    ws = sorted([w for w in body if side(w) == s], key=lambda w: (w[1], w[0]))
    cur, y = [], None
    for w in ws:
        if y is None or abs(w[1] - y) > 4:
            if cur: rows[s].append(cur)
            cur, y = [w], w[1]
        else: cur.append(w)
    if cur: rows[s].append(cur)

def cell(word_list, s):
    out = {}
    for w in word_list:
        col = [c for c, x in TABLES[s] if w[0] >= x - 4][-1]
        out[col] = (out.get(col, "") + " " + w[4]).strip()
    return out

players = []
for s in ("L", "R"):
    for r in rows[s]:
        c = cell(r, s)
        if not c.get("first") or not c.get("last") or not c.get("number", "").isdigit(): continue
        ht = c.get("height", "")
        players.append({
            "number": int(c["number"]), "first": c["first"].strip(), "last": c["last"].strip(),
            "position": c.get("position", "").strip(), "grade": int(c["grade"]) if c.get("grade", "").isdigit() else None,
            "height": ht, "weight": int(c["weight"]) if c.get("weight", "").isdigit() else None,
        })
players.sort(key=lambda p: p["number"])
json.dump(players, open("data/seed/varsity-roster.json", "w"), indent=1)
print(len(players), "players")
for p in players: print(p["number"], p["first"], p["last"], p["position"], p["grade"], p["height"], p["weight"])
