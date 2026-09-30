-- Applied to the "Coach OS - Alma Football" Supabase project.
-- Private storage area for uploaded files (25 MB each, common document and image types).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents', 'documents', false, 26214400,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/markdown', 'text/csv',
    'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'
  ]
);

create policy "documents: signed-in access" on storage.objects
  for all to authenticated
  using (bucket_id = 'documents')
  with check (bucket_id = 'documents');

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  category text not null default 'other' check (category in ('playbook', 'scouting', 'practice', 'school', 'other')),
  path text not null unique,
  mime text not null,
  size_bytes integer not null check (size_bytes > 0),
  game_id text references public.games(id) on delete set null,
  practice_id text references public.practices(id) on delete set null,
  text_content text,
  created_at timestamptz not null default now()
);

create index documents_created_idx on public.documents (created_at desc);
create index documents_game_idx on public.documents (game_id);
create index documents_practice_idx on public.documents (practice_id);

alter table public.documents enable row level security;
create policy "signed-in access" on public.documents for all to authenticated using (true) with check (true);
