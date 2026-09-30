-- Applied to the "Coach OS - Alma Football" Supabase project.
-- null = not read yet, 0 = read but no text found (a scan or a photo), more than 0 = text ready for the assistant.
alter table public.documents add column text_chars integer check (text_chars >= 0);
