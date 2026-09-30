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
