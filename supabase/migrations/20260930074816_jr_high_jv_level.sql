-- Applied to the "Coach OS - Alma Football" Supabase project.
-- Junior High JV is its own team, separate from 7th grade/Jr. High and the high school JV.
alter table public.games drop constraint games_level_check;
alter table public.games add constraint games_level_check check (level in ('jr', 'jrjv', 'jv', 'varsity'));
