-- Applied to the "Coach OS - Alma Football" Supabase project.
-- Players now belong to a team: 'jr' (Jordan's Jr. High roster, the default) or 'hs' (the high school roster, varsity and JV).
alter table public.players drop constraint players_grade_check;
alter table public.players add constraint players_grade_check check (grade between 7 and 12);
alter table public.players add column team text not null default 'jr' check (team in ('jr', 'hs'));
alter table public.players add column position text check (length(position) <= 20);
alter table public.players add column height text check (length(height) <= 10);
alter table public.players add column weight smallint check (weight between 50 and 500);
create index players_team_idx on public.players (team);
