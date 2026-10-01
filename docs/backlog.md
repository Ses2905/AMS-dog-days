# Coach OS Backlog

Add ideas here as they come up. Newest thinking goes at the top of its section.

## Design Pass 2 (from Sarah's screenshots, next up once she sends the rest)
**What she sees:** Today feels scattered and it is hard to tell what matters. Screens feel inconsistent, text feels smushed, body text is not liked, spacing and font size are off (Assistant especially).

**Diagnosis:**
1. No defined type scale. Body, hints, labels and meta text are near-identical greys and sizes, in a narrow body font at light weight, so text reads small and cramped.
2. No single row layout. Calendar rows, Practice week rows, Team rows and Game rows each arrange title, status and action differently; some rows have an "Open" text link, some an outlined button.
3. Too much chrome. A pill on every row (every player says "Available"; every past practice says "Done"), outlined buttons on rows, cards inside filter panels.
4. Missing information where it matters: calendar practice rows show no time; the practice grid header leaves a blank white bar when no coach lanes are filled; "review" tags sit beside status pills with no explanation.
5. Today has no priority model: many equal-weight cards.

**Plan:**
- Type scale and spacing scale as tokens (body 17px / 1.5, one meta size, one label size, two weights) and a more readable body face; keep Barlow Condensed for headings and numbers.
- One `Row` (time or number on the left, title, one line of meta, trailing chevron; the whole row is the tap target) and one `Section` used on every list.
- Status shown only for exceptions (out, limited, needs a plan, overdue), never as a default.
- Today rebuilt around a priority order: what is next (one primary action), what needs attention (max 3), this week at a glance, quick capture.
- Assistant: tabs as a segmented control, larger field text, more space around the form.
- Then re-screenshot every screen on a phone and on a desktop.

**Decisions needed from Sarah:** approve the body font change; whether the Today page should lead with the next practice or the next game when both are within 24 hours.

## Next Up (in order)
1. Depth chart, finish it: waiting on Jordan's answer about units vs. position groups, one chart per team level, print view

## Done Recently
- Offline reading: today's pages, the next few days of practices and games, and their scripts are kept on the phone; a banner says when there is no signal; Sign Out clears them
- Assistant reads uploaded playbooks, scouting reports and practice documents (PDF, Word, text, CSV); answers point back to the file; school documents and contact details stay out
- Automatic checks on every PR; friendly error, not-found and loading screens
- Full-data export (Settings, Download Everything)
- Calendar link (Settings): private subscribe URL for the iPhone and Google calendars; updates itself; can be reset
- High school roster (68 players, varsity and JV) loaded with position, height and weight; scorers in JV and varsity games pick from it
- One Calendar for everything (week and month, filters by practice/game and by team); Practice and Games tabs are now each their own workflow
- Depth chart shell: units and editable positions, ranked players, injuries and thin spots flagged, dual roles shown; feeds the Depth Chart Check playbook
- Playbooks: the coaching skills in /skills run inside the Assistant (scout, game plan, script, briefing, game day, postgame, player development, depth check, family message, plan my week); results can be saved, scripts go straight into Scripts
- Team script: sectioned plays with down, distance, hash, personnel, formation, motion, defense; edit, sideline view, print; linked to practices and games
- Game scoring log, season records, scoring leaders
- Attendance: tap Present / Late / Absent / Excused on a practice page, "Everyone Present", Today prompt, per-player history

## After That
- Calendar: weather and travel time on game days
- Playbooks: run on a schedule (Monday plan-my-week), and feed saved results back in as context
- Playbooks: real depth chart data once the depth chart exists
- Script: link rows to a real play library, drag to reorder, save as reusable template
- Deeper game stats (yards, tackles, turnovers, per-quarter breakdown) once we know which ones Jordan actually tracks
- Scoring log for JV/varsity players (they are not on the roster yet, so scorers are typed by name)
- Offline saving: attendance and notes made with no signal that sync when it returns (today the app is read-only offline)
- Reading Excel, PowerPoint and photos of pages (needs OCR) for the assistant
- Plaud transcripts: paste or upload straight into "Read a Transcript"
- Morning summary and weather on Today
- High school staff list from the roster PDF (head coach and coordinators) is not loaded; the coaches list is Jr. High only
- Split the high school roster into varsity and JV once Jordan says who plays where
- Real logo files for the Tools page (currently colored letter tiles)

## Ideas to Validate With Jordan (hypotheses, not decisions)
1. **Playing-time log:** quarters or snaps per player per game. Answers "why doesn't my kid play" with data.
2. **Equipment and paperwork:** helmet, pads and jersey check-out and return; physical, insurance and consent forms on file.
3. **Game-week hub:** one page per opponent week (games at every level, scripts, prep, availability, weather).
4. **Heat and weather:** forecast on Today, with a heat-index reminder before practice.
5. **Next-level handoff:** 9th graders moving up get a one-page profile for the high school staff (position notes, strengths, what to work on).
6. **Eligibility check:** coach-entered weekly grade or eligibility status, flagged before game day.
7. **Injury log:** what happened, when, whether clearance was received (recorded, never decided by the app).
8. **Monday staff digest:** auto-built summary of last week and this week for the coaches.
9. **Recognition:** player of the week and a family-friendly recap.
10. **Plaud auto-import** instead of paste.

## Open Questions for Jordan
- **Calendar sync:** which calendar does he live in (iPhone, Google, the school's)? Would he want games and practices to show up there automatically (a read-only subscribe link), and does he want reminders (say, 1 hour before practice, the night before a game)?
- **Depth chart on the phone or at a desk?** Does he look at it during practice or only when planning? Decides whether it needs a sideline mode, a print view, or both.
- **Depth chart shape (blocks the build):** does he think in units (offense, defense, special teams) or position groups (QB, RB, OL...)? Does he want one chart per team level? Does he want a two-deep or a full list?
- Are the 7th grade and Jr. High games one game or two on "5:30 / 7pm" nights?
- Varsity Aug 18 @ Southside is a Tuesday. Real game or scrimmage?
- Are Kasen and Kason Tilton the same player?
- Which practices tagged "verify" are wrong?
- Tools he uses that are missing from the Tools page
- What he wants recorded about a player beyond performance, position ideas, challenges, opportunities and parent contact

## Won't Build (for now)
- Play diagram designer, league-wide social, payments, extra logins, anything that makes lineup or eligibility decisions for him

## Parked
- Public read-only team page (the app stays private)

## Week Ahead (built)
- `/week-ahead` (button on Today): practices with and without plans, games with prep, overdue and due-this-week action items, players not fully available. Saturday and Sunday look at the coming week. Built from existing data, no AI.
- Later: optional "Draft Week Plan" assistant button that proposes plans for the empty practice slots.

## Offline Attendance (built)
- Attendance taps made without a signal are kept on the phone and sent when it is back (checked on reconnect and every 30 seconds). The last tap per player wins; entries older than 3 days are dropped. A gold bar says how many are waiting.
- Not offline yet: Everyone Present, notes, action items, scores, roster edits. Notes and scores need duplicate protection before they can queue safely.
