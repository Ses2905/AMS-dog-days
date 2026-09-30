-- Applied to the "Coach OS - Alma Football" Supabase project.
-- Player notes get a category; the tools page reads its links from settings.
alter table public.notes add column category text check (category in ('performance', 'position', 'challenge', 'opportunity', 'parent'));

insert into public.settings (key, value) values (
  'tool_links',
  '[
    {"label": "Hudl", "url": "https://www.hudl.com/"},
    {"label": "SportsYou", "url": "https://www.sportsyou.com/"},
    {"label": "Google Drive", "url": "https://drive.google.com/"},
    {"label": "Gmail", "url": "https://mail.google.com/"},
    {"label": "Google Calendar", "url": "https://calendar.google.com/"},
    {"label": "Alma Athletics", "url": "https://www.almaairedales.com/"},
    {"label": "Plaud", "url": "https://web.plaud.ai/"}
  ]'::jsonb
) on conflict (key) do nothing;
