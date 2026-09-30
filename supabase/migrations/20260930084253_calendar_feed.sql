-- Applied to the "Coach OS - Alma Football" Supabase project.
-- A secret token for the subscribe link, and the one function the link is allowed to call (no login on that link).
insert into public.settings (key, value)
values ('calendar_token', to_jsonb(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')))
on conflict (key) do nothing;

-- Returns only the schedule (opponents, dates, times, places, practice sessions), and only when the secret in the link matches.
create or replace function public.calendar_feed(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  expected text;
begin
  select value #>> '{}' into expected from public.settings where key = 'calendar_token';
  if expected is null or p_token is null or length(p_token) < 32 or p_token <> expected then
    return null;
  end if;
  return jsonb_build_object(
    'games', coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'date', g.date, 'time', g.start_time, 'opponent', g.opponent, 'site', g.site, 'location', g.location, 'level', g.level, 'status', g.status) order by g.date) from public.games g), '[]'::jsonb),
    'practices', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'date', p.date, 'session', p.session, 'dress', p.dress, 'opponent', p.opponent,
      'start', (select b.start_time from public.practice_blocks b where b.practice_id = p.id order by b.position limit 1),
      'periods', (select coalesce(sum(b.periods), 0) from public.practice_blocks b where b.practice_id = p.id)) order by p.date) from public.practices p), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.calendar_feed(text) from public;
grant execute on function public.calendar_feed(text) to anon;
-- The Supabase linter flags this function because it is callable without a login. That is the point: it returns nothing
-- unless the 64-character secret in the subscribe link matches, and it returns only the schedule.
