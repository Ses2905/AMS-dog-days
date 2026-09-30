# Coach OS | Product Brief & Specs Outline

**Status:** Draft v0.2 (rescoped as a personal tool for one Alma Junior High coach)
**Form factor:** Responsive web app / PWA (desktop, tablet, phone). No native apps until usage proves the need.
**Audience:** Builder and the coach who will use it

---

## 0. Scope Update (v0.2)

Coach OS is now a **personal operating system for one coach at Alma Junior High**, not a multi-school product. That changes the earlier draft:

| Earlier Assumption | Now |
|--------------------|-----|
| Multi-org, multi-role, configurable permissions | **Single user.** One login. Keep a `team_id` on every record so JV / 8th / 9th stay separate, but skip the role matrix. |
| Pilot staffs, buyer, pricing | **Dropped.** The pilot is him. Success is "did he use it this week instead of the spreadsheet and printout." |
| Partner integrations (Hudl, SportsYou, Plaud) as architecture pillars | **Links and exports only** for now. Add connectors when he asks for one. |
| Marketing-grade polish | **Brand-matched and fast to use.** Polish where it saves him time (practice grid, print view). |

**Still true even for a personal tool:** the roster is minors' data, and Feature 4 (public page) puts things on the open web. Rules for that are in Section 18.

**Assumption to confirm:** the AI Gateway features assume a Vercel-style stack (Next.js on Vercel with the AI Gateway). If you host elsewhere, the gateway calls need a different provider setup. Nothing else in the spec depends on it.

---

## 1. Decisions Needed First

Four issues in the current outline change scope, sequencing, or risk. Resolve them before design starts.

| # | Issue | Why It Matters | Recommendation |
|---|-------|----------------|----------------|
| 1 | **The MVP list contradicts itself.** Game Week is in MVP, but Game Plan, Playbook, and Staff Tasks are Phase 2. Home shows staff assignments and the script links to plays. | The MVP would ship screens that point to objects that don't exist yet. | Ship a **lightweight Play object** and **Task object** in MVP (name, tags, links only). Full Playbook, game-plan builder, and task management stay Phase 2. Game Week MVP is a checklist plus linked notes, film, and practices. |
| 2 | **Attendance is not in the MVP list**, yet it is the first thing you name for phone use. | It is the easiest daily habit to win and it feeds Home. | Add **Attendance** to MVP. Cut something else. |
| 3 | **The MVP is still about 14 modules.** Practice Planner, Team Script, Depth Chart, Game Week, and Sheets import each take real build time. | Try to build all of them and the first release lands late and shallow. | Sequence MVP into **releases** (Section 9). Practice Planner is the wedge. Prove it with a pilot staff before building the rest. |
| 4 | **Minors' data and third-party access are unresolved.** Student records fall under school policy (FERPA in the US) and, for junior high, possibly COPPA. Hudl, SportsYou, and Plaud API access is unconfirmed. | Legal or partner blockers can stall a release. | Get a **data-handling position** and **Level 1 fallbacks** (links, exports, copy/paste) defined before build. No MVP workflow may depend on a partner API. |

---

## 2. What Is True

- Coaching staffs run the program on spreadsheets, printed plans, group texts, and notes. Nothing connects them.
- The same fact (practice time, jersey number, player status) is retyped in five places.
- Most coaches are not technical. Many use a phone on the field with one hand.
- Hudl, SportsYou, Google, and Plaud already exist in their workflow. Replacing them is not the job.

> **Evidence gap:** This outline contains no research. Before committing, interview 8-12 staffs (varsity and junior high, small and large schools) and observe one full practice week. Validate that the practice plan and script are the highest-frequency pain points, not roster or communication.

## 3. Why It Matters

Coach OS wins if a staff stops maintaining duplicate documents. The measure is administrative work removed, not features used.

**North Star:** *"I stopped doing all the annoying stuff I used to do."*

## 4. Product Principles

| Principle | What It Means in Practice |
|-----------|---------------------------|
| Football First | Football vocabulary everywhere. No Project, Workspace, Sprint, Ticket, or Resource. |
| One Source of Truth | Enter once, reflect everywhere. A jersey number change updates roster, depth chart, attendance, equipment, and practice groups. |
| Build for the Sideline | Desktop plans. Mobile does. Core mobile tasks work one-handed and outdoors. |
| Default to Automation | Never ask for what the system already knows. |
| Progressive Complexity | Head coach sees the program. Position coach sees "here's what you need today." |
| Coach Approves Football Decisions | AI proposes. Coaches approve. Nothing consequential changes silently. |
| Language Is Product | Terminology and naming are experience decisions. Maintain a glossary. |

## 5. Users & Permissions

### Roles

| Role | Primary Need | Sensitive Access |
|------|--------------|------------------|
| Program Admin | Set up program, teams, seasons, users | All |
| Head Coach | Whole-program view | All coaching content |
| Coordinator | Practice, script, game plan, position-coach collaboration | Own unit plus shared |
| Position Coach | "What do I need today?" Own group, periods, notes, film | Own position group |
| Team Manager | Roster, attendance, equipment, travel | **No** coaching content or notes |
| Read Only | View selected content | Configurable |

### Permission Rules

- Configurable **by team** (Varsity, JV, Freshman, junior high) and **by information type** (contact, guardian, notes, game plan).
- Default deny for guardian contact and coach notes.
- Medical detail is **not stored**. Availability status only (Available, Limited, Injured) unless the school explicitly approves more.
- Audit log for changes to roster, depth chart, status, and permissions.

**Open question:** Who owns the account, the school or the coach? This drives data export and turnover handling when a coach leaves.

---

## 6. Experience Structure

### Navigation

| Surface | Items |
|---------|-------|
| Desktop (persistent left rail) | Home, Team, Practice, Game Week, Playbook, Film, Calendar, Staff, Reports |
| Mobile (bottom bar) | Today, Team, Practice, Game, More |
| Global | Search (players, plays, opponents, practices, notes, drills, film links) and **+ Add** (Practice, Drill, Player Note, Staff Task, Game-Plan Item, Play, Announcement) |

### Home Screen Hierarchy

1. Greeting and **next event** (for example, Varsity Practice, 3:30 PM, 90 min) with one primary CTA: **Open Today's Practice**
2. Today's priorities
3. Staff tasks
4. Game-week progress
5. Attendance status
6. Latest film
7. Recent notes
8. Upcoming schedule

The Coaching Command Center (Mon-Game Day strip) shows each day's objective, practice status, and open tasks. The dashboard should feel calm however complex the program is.

### Design Direction

Modern, athletic, fast, confident, professional, legible outdoors. High contrast, large type, generous tap targets (48px minimum on mobile). No turf textures, giant football imagery, or aggressive sports graphics. Cards and timelines over spreadsheet grids.

---

## 7. Feature Specs

Each module lists: **job**, **key capabilities**, **release**.

### 7.1 Coach Home | MVP
**Job:** Answer "What do I need to know or do today?"
- Next event, countdown, today's plan, missing attendance, weather, upcoming events, recent notes, latest film, roster changes, announcements
- Quick actions: Create Practice, Open Script, Take Attendance, Open Hudl, Add Note, Update Depth Chart
- Role-filtered. A position coach sees only their periods and tasks.

### 7.2 Team & Roster | MVP
**Job:** Replace the roster spreadsheet.
- **Player profile:** name, photo, number, grade, primary and secondary position, unit, optional height and weight, eligibility, equipment, attendance history, depth-chart spot, notes, Hudl link, documents, custom tags. Contact and guardian fields are permission-gated.
- **Views:** table, cards, position group, grade, team level, offense/defense, custom group
- **Bulk actions:** move team, assign position or coach, change status, export, Sheets sync
- Availability status flows to depth chart, attendance, and practice groups.

### 7.3 Depth Chart | MVP
**Job:** Drag-and-drop depth by unit and package.
- Units: Offense, Defense, Special Teams. Packages: Base, Goal Line, Nickel, Dime, Kickoff, Kick Return, Punt, Punt Return
- Auto-flags: duplicate assignments, missing positions, unavailable players, changes since last game
- Auto-generate scout-team assignments (**suggested**, coach confirms)

### 7.4 Practice Planner | MVP (hero)
**Job:** Build a visual practice timeline in minutes.
- **Create:** date, type, start time, duration, objectives, field and equipment needs
- **Timeline blocks:** period number, duration, drill, field location, position groups, coach responsible, units, equipment, notes, linked plays, linked Hudl clips
- Drag to reorder. Changing a duration **recalculates the rest of the timeline**.
- **Templates:** Monday Correction, Tuesday Install, Wednesday Competition, Thursday Polish, Walkthrough, Two-a-Day, Junior High, Game-Day Walkthrough
- Prompt for notes when practice ends.

### 7.5 Team Script | MVP
**Job:** Replace the script spreadsheet.
- **Row fields:** play number (auto), down, distance, hash, ball position, personnel, formation, motion, play, tag, defense/scout look, emphasis, result/notes
- Drag reorder, duplicate, insert, filter by situation, color-code sections
- Print, PDF, mobile sideline mode
- Create from a previous practice. Save templates.
- **Builder shortcuts:** Run, Pass, RPO, Screen, Special Situation
- Rows link to a Play (lightweight Play object in MVP, full Playbook in Phase 2).

### 7.6 Attendance | MVP
**Job:** Take attendance in seconds on a phone.
- Large tiles: Present, Late, Absent, Limited, Excused. Tap or swipe.
- Position coaches take their own groups **simultaneously**
- Head coach sees completion status. Season trends tracked.

### 7.7 Coaching Notes | MVP
**Job:** Capture once, find everywhere.
- Type or dictate. Attach to player, position group, practice, play, opponent, film clip, or game.
- Auto-link mentioned players. All notes on a player or topic viewable together.
- **Phase 2:** AI extraction of player, position, play, opponent, action item, coach, and suggested follow-up, with one-tap confirm.

### 7.8 Calendar | MVP
**Job:** One program calendar where events open into their content.
- Event types: practice, game, staff meeting, film, weight room, team meeting, travel, school event, dead period, equipment, camp
- Opening Tuesday Practice opens Tuesday's plan.
- Google Calendar sync in Phase 2. MVP provides calendar links and ICS export.

### 7.9 Game Week | MVP (lite) / Phase 2 (full)
**Job:** One workspace per opponent.
- **MVP:** opponent overview, schedule, weather, travel, scouting notes, linked practices, linked Hudl playlists, depth chart, preparation checklist, postgame notes
- **Checklist:** film reviewed, base plan, third down, red zone, special teams, scripts, call sheet, player install
- **Phase 2:** situational game plan, call sheet, staff assignments, opponent tendencies

### 7.10 Game Plan | Phase 2
**Job:** Organize strategy by situation, not by giant document.
- Sections: Opening Script, Normal D&D, Third Down, Red Zone, Goal Line, Backed Up, Two Minute, Four Minute, Coming Out, Short Yardage, Must-Have, Special Situations
- **Key relationship:** Play → Formation → Personnel → Practice Period → Script → Hudl Clip

### 7.11 Playbook | Phase 2
**Job:** Make existing football knowledge searchable and connected. Not a play-design tool.
- Fields: name, diagram (image upload), formation, personnel, motion, tags, assignments, coaching points, install status, film, linked scripts and game plans
- Filters: run/pass, concept, formation, personnel, situation, position group, installed, frequently used

### 7.12 Hudl Links | MVP
**Job:** Make film feel connected.
- Attach Hudl URLs to players, plays, drills, practices, opponents, game-plan situations, scripts, and notes.
- Actions: open, copy link, attach.
- Links **propagate by context**: a Red Zone playlist on a game-plan item appears in the matching practice period.
- Direct Hudl API is Phase 3 and must not gate any release.

### 7.13 Staff & Tasks | Phase 2
- Directory: role, position, contact, practice and game-day responsibilities
- Head coach assigns tasks. They appear on the assignee's Home.
- MVP includes a minimal task object so Home and Game Week checklists work.

### 7.14 Communication | Phase 2
- Contextual actions, not a messaging platform: Message Staff, Message Position Group, Send Practice Update, Share Plan, Share Film
- System drafts the message from the change (for example, "Practice has moved to 4:00 PM today.") Coach taps Send.
- MVP: copy-ready formatted announcements.

### 7.15 AI Coach Assistant | Phase 2
- Answers from the team's own data (practice time, absences, plans, notes, reps, assignments, film)
- Action-oriented: Update Practice, Create Task, Open Film, Add Period, Message Coach, Update Script
- Each answer cites the source records.

### 7.16 Google Sheets | MVP (import/export), Phase 2 (sync)
- **Import:** roster, depth chart, practice templates, drills, schedule, plays, equipment. Column mapping (`Kid` → Player Name, `#` → Jersey, `Pos` → Position, `Yr` → Grade). Saved for reuse.
- **Export:** Google Sheets, CSV, print, PDF from every major table.
- **Optional sync:** Coach OS stays the source of truth.

---

## 8. Integrations & Automation

### Architecture Principle
**Coach OS knows what is happening. Connected tools help execute it.**

```
COACHES      Desktop | Mobile | Tablet | Voice
   ↓
COACH OS     Roster | Practice | Scripts | Depth Charts | Game Week | Playbook | Notes | Tasks | Calendar
   ↓
INTELLIGENCE + AUTOMATION   Assistant | Rules | Triggers | Approvals | Notifications | Search
   ↓
INTEGRATION LAYER   Hudl | SportsYou | Google | Plaud | Future Connectors
   ↓
EXTERNAL JOBS   Film | Communication | Calendar | Documents | Capture
```

### Connector Roles

| Service | Role | MVP Behavior | Future |
|---------|------|--------------|--------|
| Hudl | Film layer | Links, one-tap open, Hudl-compatible roster export | Auth, roster/game sync, playlists (if API approved) |
| SportsYou | Communication | Copy/share formatted text, deep links, schedule export | Announcement publishing, group sync (if API approved) |
| Google Calendar | Schedule | ICS/calendar links | Two-way event sync |
| Google Sheets | Transitional | Import, export | Optional sync |
| Google Drive | Documents | Attach and reference files in context | Auto-file by opponent |
| Plaud | Capture | Paste or upload transcript | Auto-ingest summaries |

### Capability Levels (Graceful Fallbacks)
1. **Link:** store and open external content
2. **Import/Export:** structured files
3. **Automation:** webhooks, Zapier, intermediary tools
4. **Native API:** authenticated two-way
5. **Intelligent Sync:** Coach OS understands external context

Every integration must be useful at Level 1 or 2. No critical workflow depends on a third party.

### Connector Contract
Each connector owns authentication, permissions, incoming and outgoing data, sync status, error handling, and ID mapping. Core code requests an intent ("share this practice update"). The connector decides how.

### Event Model
Events: `player.updated`, `player.availability_changed`, `practice.created`, `practice.updated`, `practice.completed`, `game.created`, `game.completed`, `depth_chart.updated`, `script.updated`, `task.assigned`, `note.created`, `meeting.processed`.
One event can trigger many actions. Example: `practice.updated` → update calendar → refresh dashboards → find affected assignments → draft announcement.

### Automation Model
**Trigger → Context → Rule → Suggested or Automatic Action**

| Mode | Use For | Examples |
|------|---------|----------|
| **Automatic** | Safe, reversible | Refresh dashboards after a practice change |
| **Ask First** | Affects people or football decisions | "Practice changed. Send updated schedule to Varsity?" `Review & Send` |
| **Never Automatic** | Sensitive or consequential | Depth chart changes, player status, game-plan edits, family communication, deletions |

### Plaud / AI Processing Flow
Recording → transcript/summary → AI extraction (decisions, tasks, player notes, practice changes, game-plan ideas, assignments, follow-ups) → **coach reviews: approve, edit, reject** → approved items update Coach OS.
AI never silently changes important football information.

### Integration Hub (Settings → Integrations)
One card per service: what it does, what it can access, what Coach OS can send, automatic or manual sync, last successful sync, connection status. No technical terms unless troubleshooting.

### Priority Automations

| Priority | Automation |
|----------|------------|
| MVP | Player unavailable → flag depth chart and practice groups. Practice time change → update plan, dashboard, calendar. Practice ends → prompt for notes. Script references a play → auto-link. |
| Phase 2 | Game week begins → create checklist. Plaud transcript → proposed actions. Game ends → postgame workspace, roll notes forward, next-opponent setup. |

---

## 9. Release Plan

Quarter-level timing is intentionally omitted. Sequence by readiness, not dates.

| Release | Scope | Exit Criteria |
|---------|-------|---------------|
| **MVP-A: Foundation** | Auth and permissions, org/team/season, roster and profiles, Sheets import/export, availability status | Pilot staff imports its real roster in under 15 minutes |
| **MVP-B: Practice Wedge** | Practice Planner, templates, calendar, Home, attendance, mobile PWA | Pilot staff runs a full week from Coach OS and prints nothing |
| **MVP-C: Game Ready** | Team Script, depth chart, notes, Hudl links, Game Week lite, lightweight Play and Task objects | Pilot staff runs one game week end to end |
| **Phase 2** | Playbook, game plan, staff tasks, Plaud, Google Calendar sync, AI assistant, advanced automation, cross-team | Gated on MVP retention and pilot feedback |
| **Phase 3 (exploratory)** | Direct Hudl data, tendency analytics, auto scouting summaries, workload analysis, development histories, sideline tools, auto call sheets, voice, wearables, SIS | Each needs its own business case and partner access |

**Decision needed on scope:** Depth Chart and Team Script are each large. If MVP-C slips, cut Depth Chart drag-and-drop to a simple list first. Do not cut Script.

---

## 10. Data Model

**Core objects:** Organization, Team, Season, User, Coach, Player, Position, Position Group, Practice, Practice Template, Practice Period, Drill, Play, Formation, Personnel, Script, Script Play, Opponent, Game, Game Plan, Depth Chart, Assignment, Task, Attendance, Note, Film Link, Calendar Event, Document, Integration.

**Design rule:** Every object supports typed relationships (Note ↔ Player, Play ↔ Script Row, Film Link ↔ Practice Period). The relationship graph is the product. Build it before the screens.

**Cross-cutting requirements:**
- Season scoping (archive, roll forward)
- External ID mapping per connector
- Soft delete and audit trail
- Row-level permissions by team and information type

---

## 11. Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| **Offline** | Sideline connectivity is unreliable. Today's plan, script, roster, depth chart, and attendance must **read offline**. Attendance and notes **queue and sync**. Treat this as MVP, not polish. |
| **Performance** | Home loads under 2 seconds on 4G. Attendance tap feedback is instant. |
| **Accessibility** | WCAG AA contrast minimum. Outdoor-legibility mode (high contrast, large type). |
| **Privacy** | Data-minimal minor records, encryption in transit and at rest, school-policy alignment, parent-data gating, data export and deletion on request |
| **Devices** | Desktop, laptop, iPad, iPhone, Android via PWA |
| **Reliability** | Every write is auditable. Undo for reversible actions. |

---

## 12. Success Measures

Task-level measures over satisfaction scores.

| Stage | Measure |
|-------|---------|
| Exposure | Staffs invited, coaches activated |
| Engagement | Weekly active coaches per staff, share of practices planned in Coach OS |
| Completion | Practice plan build time vs. baseline, attendance completion rate, script completion |
| Outcome | Spreadsheets and printouts retired (self-reported), duplicate entries removed |
| Unintended consequences | Permission errors, wrong notifications sent, AI suggestions rejected, offline sync conflicts |

---

## 13. Risks & Tradeoffs

| Risk | Impact | Mitigation |
|------|--------|------------|
| MVP too broad | Late, shallow release | Staged MVP-A/B/C with pilot gates |
| Partner APIs unavailable | Broken promises | Level 1-2 fallbacks; no dependency |
| Minors' data compliance | Legal, trust | Data-minimal design, school agreements, permission defaults |
| Coach adoption inertia | Low retention | Sheets import, print/PDF export, football vocabulary |
| Sideline connectivity | Unusable when needed | Offline read and queued writes |
| AI errors on football context | Wrong changes | Approval model; sources cited; no silent edits |
| Sheets sync creates two truths | Trust loss | Coach OS is source of truth; one-way or clearly labeled sync |

## 14. What We Should Not Do

- Rebuild Hudl, SportsYou, or Google Calendar
- Build sophisticated play-design tools in the first release
- Automate weak workflows before signals and controls are solid
- Store medical detail by default
- Ship native iOS and Android before web usage proves the need
- Let AI change depth charts, player status, game plans, or family communications without confirmation

## 15. Open Questions

1. Who is the buyer: school athletic director, program booster, or head coach? This changes pricing, permissions, and onboarding.
2. Who owns program data when a coach leaves or a school changes?
3. Which pilot staffs (levels, sizes, tech comfort) will validate the wedge?
4. What Hudl, SportsYou, and Plaud access is realistically available, and on what timeline?
5. What is the minimum offline scope for MVP-B?
6. Is junior high in scope for launch, given tighter privacy expectations?
7. Are we building the practice planner first, or is the script the true pain point? Research should decide.

## 16. Next Steps

1. Confirm the four decisions in Section 1.
2. Run 8-12 coach interviews and one practice-week observation to validate the wedge.
3. Secure 2-3 pilot staffs.
4. Draft the football glossary (Language Is Product) and relationship schema.
5. Design the Home, Practice Planner, and mobile attendance flows first.

---

## 17. Alma Context From Real Files

Source files reviewed: *OFFICIAL Alma Jr. High Roster 26* (15 pages) and *Pea Ridge Jr. High Practice* (11 pages, Sept 28 to Oct 1, 2026). These change design details.

### 17.1 What the Practice Sheets Tell Us
- **The practice is a grid, not a list.** Rows are numbered periods on a **5-minute grid**. Columns are coaches (Dugger, Barrett, Coursey, Potts, Salsbury, Driscoll, Burns, and others by day). A cell holds what that coach's group does. The Practice Planner should default to this layout: **time down the side, coach lanes across, 5-minute snap.** A vertical list of periods would not match how he already thinks.
- **Header fields recur every day:** Date, Dress (Helmets, Full, Shells, Greys and helmet), Lift, O/D Meeting, Situations. Make these first-class fields on Practice, not notes.
- **Some cells span all lanes** (Team O, Break, Halftime, End of Practice, Film). Support a full-width block.
- **Two sessions per day.** A school-day session (about 12:55 to 1:35) and an evening session (about 6:55 to 8:35). Model these as two Practices on one day.
- **Footer notes carry real work:** coach-specific instructions ("Potts and Driscoll: period 3, work on Blade together"), RVA direction ("RVAs to the right, 4/5/6 Bears"), motions, and **who carries the opponent scout book** ("Coursey have Pea Ridge book", "Coursey have Siloam scout book"). Make these per-coach assignments on the practice, and show them on that coach's Today view.
- **A Skelly grid** appears with hash (RH, RM, LM, LH), numbered reps, formation/play, and coverage/front/blitz. This maps directly to Team Script rows. Hash cycling RH, RM, LM, LH repeats. Auto-fill it.
- **Terminology is his own:** ABC's, IND-O / IND D, Skelly, Mix, RVA, Pursuit, Team O / Team D, Scout O / Scout D, Heavy O, Get Off, Halftime. Seed the drill library and glossary with these exact words.
- **Play-call vocabulary is compound:** "Trey Kansas City Q Lead war", "Carolina Flash Surf", "Stack Arizona". These are formation plus play plus tag strings. Store as free text with optional parsing later. Do not force structured fields on day one.
- **Practices are scoped by opponent.** The Thursday file references Siloam; the week is built around Pea Ridge. Practice should link to an Opponent and a Game.
- **Today (Wed Sept 30) already has a practice in these files**, so a working Home screen that opens tonight's plan is a natural first demo.

### 17.2 What the Roster Tells Us
The roster file contains **9th, 8th, JV, combined and sign-out lists, plus offense and defense depth pages.** The same kid appears in several lists with different jersey numbers.

Examples seen:
- Hagen / Hagan Goodwin is #2 on the 8th list and #9 on the combined sign-out.
- Landen / Landon Quinalty / Quintally is spelled three ways.
- Haedyn / Haeden Denton and Kasen / Kason Tilton also vary.
- Numbers do not stay stable across lists (Colton Williams is #60 in one and #56 in another).

**Design implications:**
1. **A player is not a jersey number.** Store a stable player ID. Jersey number belongs to a team-season roster entry.
2. **Import needs a duplicate review step.** Match on normalized first and last name, then show near-matches ("Quinalty vs Quintally?") for him to merge. Do not auto-merge.
3. **Roster entries are per team.** A player can be on 8th, JV and the combined sign-out. Model Team membership separately from Player.
4. **Blank numbers exist** (open slots in the numbered lists). Skip empty rows on import.
5. **Roster PDFs list Head Coach Jordan Dugger and assistants Joey Potts and Jacob Coursey**; practice sheets list additional coaches (Barrett, Salsbury, Driscoll, Burns, and others on the first sheet). Seed the coach directory from these and let him fix it.
6. **The depth pages** show the defense as Bandit, Tackle, Nose, End (front), Star, Mike, Will (backers), Corner, Free Safety, Weak Safety, Corner, and the offense as LT, LG, C, RG, RT, QB and skill positions. Seed the depth chart templates with these labels, not generic ones.

**Import path:** the files are PDFs. Extract text into a staging table, let him confirm column mapping and duplicates, then write to Roster. Do not require him to re-type.

---

## 18. Brand & Visual Direction (Alma Airedales)

Assets are saved in `assets/brand/`:

| File | Use |
|------|-----|
| `alma-airedale-football-badge.png` | Login screen, print header, share cards |
| `alma-gold-a.png` | App icon, favicon, mobile top bar |
| `airedale-head-color.png` | Empty states, print header on white |
| `airedale-head-white-on-green.png` | Dark-green splash, PWA loading screen |

### Color Tokens (sampled from the logo files)

The school website (almasd.net) was not reachable from this environment, so these are **sampled from your logo images, not the official brand guide.** Confirm against the school's guide before publishing anything public.

| Token | Approx. Hex | Source | Use |
|-------|-------------|--------|-----|
| `--green-900` | `#003810` | Badge background | Nav rail, headers, primary buttons |
| `--green-600` | `#006030` | Mascot outline | Accents, links, selected states |
| `--gold-500` | `#C4B259` | Alma "A" | Highlights, active period, primary CTA on dark |
| `--tan-300` | `#D2B899` | Mascot fur | Subtle fills, card accents |
| `--ink` | `#111` | Text | Body text |
| `--paper` | `#FFF` | Background | Cards, print |

### Guidance
- **Dark green + gold on white.** Use green as structure and gold sparingly as the "this is now" signal (current period, today, next practice).
- **Outdoor readability:** check gold-on-green and gold-on-white contrast. Gold text on white will fail; use gold as a fill or on green only. Verify with a contrast checker before committing.
- Use the mascot in the **badge, empty states and print header**. Do not tile it, stretch it or place it behind content.
- Keep the earlier direction: modern performance tool, not booster-club website. The Airedale is already aggressive enough; keep everything around it calm.
- **Trademark:** the Nike swoosh appears in the badge file. Do not reuse that badge on anything shared publicly. Use the head and "A" instead.

---

## 19. Feature Backlog (Requested)

These five are noted for the to-do list, not yet scheduled. Each is mapped to the modules it depends on.

| # | Feature | Depends On | Suggested Slot | Size |
|---|---------|------------|----------------|------|
| B1 | Print-friendly practice plan | Practice Planner | **MVP-B** (ship with the planner) | S |
| B2 | Player availability tracking | Roster, Attendance, Practice, Game | **MVP-B** (extends attendance) | M |
| B3 | Public read-only team page | Calendar, Game, Announcements | Phase 2, after MVP-C | M |
| B4 | Ask the playbook (grounded Q&A) | Documents, Playbook, AI Gateway | Phase 2 | L |
| B5 | AI practice plan generator | Practice Planner, Roster, Availability, AI Gateway | Phase 2, after B2 and B4 | L |

**Sequencing logic:** B1 and B2 are cheap, solve a daily annoyance and do not need AI. B5 is only as good as the availability, drill library and past-practice data it draws on, so it comes after B2 and after several real practices are stored. B4 needs his documents uploaded and chunked, so it needs the document layer first.

### B1. Print-Friendly Practice Plan
**Job:** Bring the plan to the field on paper without a phone.
- One button: **Print / PDF** from any practice.
- Layout matches his existing sheet: header (date, dress, lift, O/D meeting, situations), period grid with time down the side and coach lanes across, footer notes.
- **Landscape, letter size, one page per session.** Fit 30+ periods at 5-minute grid without shrinking below readable size (target 9pt minimum).
- Black and white safe. Gold and green only as light tints or borders. Alma head in the header.
- Options: include or omit notes, include the Skelly grid page, one page per coach (that coach's lane only).
- Use a print stylesheet (`@media print`), not a screenshot. Verify page breaks, no cut-off lanes and blank rows trimmed.
- **Done when:** he prints Wednesday's practice and it looks as good as or better than the current PDF.

### B2. Player Availability Tracking
**Job:** Know who is available for each practice and game.
- Per player: **Available, Limited, Out, Excused** with an optional short reason (illness, injury, family, discipline). Store the minimum; do not store medical detail.
- Record by date or date range ("out through Friday"), so it persists across practices without re-entering.
- **Availability view per practice or game:** who is in, limited and out, with counts, by position group.
- Marking a player Out or Limited **flags them on the depth chart** and on affected periods.
- Attendance and availability are related but different: availability is expected, attendance is what happened. Show both.
- History per player for the season.
- Mobile: two taps from Today to mark a kid out.
- **Open question:** does he want an "unexcused vs excused" distinction for eligibility or grades? Ask him.

### B3. Public Read-Only Team Page
**Job:** A link he can share with players and families showing upcoming games and announcements.
- Read-only page: team name, upcoming games (date, time, opponent, home/away, location), announcements, optional schedule download (ICS).
- He controls what is published. **Nothing publishes automatically.** Announcements are drafted and explicitly published.
- Random, unguessable URL (or a chosen slug); a revoke and regenerate option; no login for viewers.
- **Never show:** player names, photos, jersey numbers tied to names, attendance, availability, injuries, notes, depth chart, practice plans or opponent scouting. This is the rule that protects kids on a public page, even in a personal tool.
- **Do not index:** add `noindex` and exclude from sitemaps.
- Branded with the Airedale head and school colors. Mobile-first, since parents will open it on phones.
- **Open question:** does the school or athletic director need to approve public communications for Alma? Confirm before sharing widely.

### B4. Ask the Playbook (Grounded Q&A)
**Job:** Ask questions and get answers from his own playbook and documents, with sources.
- Upload or attach documents (PDFs, Google Docs / Drive exports, scout books, notes). Extract text, split into chunks with page or section references and store embeddings.
- Chat box: "What's our Cover 3 check vs. trips?" The model receives the question plus the most relevant chunks and answers **only from them**.
- **Every answer shows sources**: document name, page/section, and the quoted passage, each linking to the original.
- If nothing relevant is found, say so. **No guessing** and no general-football filler presented as if it came from his playbook.
- Model calls go through **AI Gateway** so the model can be switched without code changes. Keep the model name and a spend limit in configuration.
- Scope filter: search all documents, one opponent's documents, or one document.
- **Quality checks before trusting it:** build 20 to 30 real questions with known answers from his files. Measure how often the correct source is retrieved and how often the answer is fully supported. Ship only when he agrees it is reliable.
- **Privacy note:** roster names and notes should not be sent to the model unless a question needs them. Default to documents only.
- **Risk:** playbook PDFs of diagrams have little text. Answers will be weak until plays are also stored as text. Storing plays as named text entries (Playbook module) improves this a lot.

### B5. AI Practice Plan Generator
**Job:** He gives goals, available time and constraints. The model drafts a practice plan he can edit.
- **Inputs:** date, session (school-day or evening), total minutes, start time, dress, **goals** (free text plus quick picks such as "install Counter", "red zone", "tackling"), opponent, coaches available and roster constraints (from availability: "no 8th grade after 7:45", "5 players out").
- **Context the model receives:** his drill library, coach names, recent practices, the opponent's game week notes and availability counts, plus the fixed 5-minute grid and the period format.
- **Output is structured, not prose:** periods with start time, duration, per-coach lane cell, group and notes, validated against the schema. Reject and retry on invalid output; never show him malformed plans.
- Lands as a **draft practice** in the same grid editor. **He reviews and edits before it becomes the plan.** Nothing is saved as final automatically.
- Guardrails: total time must equal available time; each coach appears in one place per period; uses drills from his library first and marks any new drill as "suggested"; includes water/break blocks where his sheets do.
- Show a short rationale per block ("2 periods of Inside Run because you set Inside Run as a goal") so he can trust or override.
- Uses **AI Gateway** with the same configuration as B4.
- **Depends on:** a seeded drill library. Start by importing the drills from his past practice PDFs (Pursuit, Bag Drill, Slant/Wreck, Freeze Frame, Q & 5's Reads, and so on).
- **Do not:** invent players, use jersey numbers from a stale roster, or override his availability data.
- **Evaluation:** generate plans for three past weeks and compare with what he actually ran.

---

## 20. Updated Next Steps

1. Confirm hosting (Vercel assumption for AI Gateway) and whether real player names may be sent to a model.
2. Build **MVP-A** first: roster import from the PDFs with duplicate review, Alma theme and logos.
3. Build the **Practice Planner grid** from his sheet layout, then **B1 print view** and **B2 availability** alongside it.
4. Import his drill list and glossary from these practice PDFs so the app speaks his language on day one.
5. Hold B3, B4 and B5 until he has used MVP-B for a couple of weeks. B5 needs real practice history to be good.
