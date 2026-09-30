-- Applied to the "Coach OS - Alma Football" Supabase project.
-- Jordan covers every Jr. High and high school game, so each game has a level.
alter table public.games add column level text not null default 'jr' check (level in ('jr', 'jv', 'varsity'));

-- Small key/value store for app-wide settings (starts with the links to the schedule pages).
create table public.settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;
create policy "signed-in access" on public.settings for all to authenticated using (true) with check (true);

insert into public.settings (key, value) values (
  'schedule_links',
  '[
    {"label": "Alma JV football schedule (Hudl)", "url": "https://fan.hudl.com/usa/ar/alma/organization/21380/alma-high-school/team/45338/boys-junior-varsity-football/schedule?date=2026-09-01T05%3A00%3A00.000Z&range=Month&ss=2026&s=U2NoZWR1bGVFbnRyeVB1YmxpY1N1bW1hcnk2YTA1Y2ZhOGJlNjlhMTUyZWJlMzZlZmY%3D"},
    {"label": "Alma High School on Hudl (all teams)", "url": "https://fan.hudl.com/usa/ar/alma/organization/21380/alma-high-school"},
    {"label": "Alma Airedales athletics calendar", "url": "https://www.almaairedales.com/calendar"}
  ]'::jsonb
);
