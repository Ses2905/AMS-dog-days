# Coach OS (Alma Jr. High Football)

Next.js app. Run locally: `npm install && npm run dev`, then open http://localhost:3000.

- `src/data/practices.ts`: practice plans (Wednesday Sept 30 transcribed from his PDF).
- `src/data/roster.json`: roster extracted from his PDF by `../tools/extract_pdfs.py`.
- `/practice/[id]/print`: landscape, one-page print view (Print, then "Save as PDF" to share).

Database: Supabase project "Coach OS - Alma Football" (schema in ../supabase/migrations). Copy .env.example to .env.local. Not wired into the pages yet.
