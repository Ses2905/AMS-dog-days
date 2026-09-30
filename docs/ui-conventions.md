# Coach OS interaction conventions

Every screen follows these rules so nothing has to be relearned.

**Page header.** Title on the left. Actions on the right, with the main action always the **last, right-most button** in solid green ("Add player", "Add coach", "Plan a practice", "Add note"). Secondary links come before it as green outlines ("Coaches", "Team", "Week view").

**Adding.** "Add …" opens a panel **at the top of the same list**, above the filters. Cancel and the main button sit bottom-right of the panel. Bigger things with many parts (a practice) get their own page.

**Editing.** Tap a row to expand it in place. Small records (coach, note) edit fully inline. Records with heavier actions (player: merge, remove; practice: periods) have an "Edit details" link to a full page.

**Lists.** Every list has the same toolbar: search, a sort menu, filter chips and "Showing N of M" with "Clear filters". Filters combine. Default sort is the most useful one for that list (players by number, practices newest first).

**Destructive actions.** Always a red button, always asks first ("This can't be undone"), never sits next to the main action.

**Saving.** Full-page editors have a fixed Save bar at the bottom. Inline panels put Save bottom-right. Errors appear in red next to the buttons, in plain words.

**Status chips.** Same colors everywhere: green = fine or done, gold = in progress or limited, red = needs action, grey = inactive or no data.

**Type.** Barlow Condensed (uppercase) for headings, jersey numbers and times. Barlow for everything else. Tap targets are at least 48px tall.

Shared code: `app/src/components/PageHeader.tsx`, `ListToolbar.tsx`, `ui.ts`, and the sort and filter rules in `app/src/lib/lists.ts`.

## Design System Rules (added with the consistency pass)

**One set of parts.** Buttons, chips, tabs and pills come from `app/src/components/ui.ts`, `Pill.tsx` and `Icon.tsx`. Do not write new button or pill class strings by hand.

- **Buttons** are 48px tall, one type size. Fill shows importance: solid green = the main action on the screen (one per screen, right-most), green outline = a common action, white = everything else, red text = destructive (always confirms first).
- **Icons** come only from `Icon.tsx` (one 24px grid, 2px stroke). Actions that add, edit, delete, print, copy, download or go back carry a leading icon: `+ Add Note`, pencil `Edit`, trash `Delete`. "Open" carries a trailing chevron. Never use typed glyphs (arrows, ×, ✓, ›) as icons.
- **Chips** (`chip(on)`) are filters and toggles. **Tabs** (`tab(on)`) switch a whole panel. **Pills** (`<Pill tone>`) are read-only status labels. Tones: green = good or done, gold = attention or today, red = needs action, grey = neutral, solid = final.
- **Headline Case** for buttons, tabs, chips, page titles, section headings and short field labels (Add Note, Sign Out, Scouting & Notes). Sentence case for anything that reads as a sentence: descriptions, hints, empty states, placeholders. Small words stay lowercase (a, the, to, of, for, and, or).
- **Placeholders** that show an example start with "e.g." so they never look like real data.
- **Navigation order** follows how a coach works: Today, Calendar, Practice, Games, Team, Notes. Phones use a bottom tab bar (thumb reach) and put Assistant, Tools, Library, Settings and Sign Out behind Menu. Wide screens use the same tabs under the logo.

## Design Pass 2
- **Type:** Inter for body, Barlow Condensed for display. Scale tokens in `globals.css` (`text-xs` .8125rem to `text-xl` 1.375rem); body is 17px with 1.6 line height.
- **Lists:** every list is a `Section` (white card, hairline dividers) of `Row`s (lead time or number, title, one meta line, status pill only when something needs attention). Use `narrow` for jersey numbers.
- **Today:** one "Next Up" hero, then Needs Your Attention and Coming Up. Badges say why (Overdue, Today, Tomorrow); red only when urgent.
- **Destructive actions in lists** are icon-only (`btnIconSm`), never full-width buttons.
