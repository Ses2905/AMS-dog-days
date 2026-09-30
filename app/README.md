# Coach OS (Alma Jr. High Football)

Next.js app. Run locally: `npm install && npm run dev`, then open http://localhost:3000.

- `src/data/practices.ts`: practice plans (Wednesday Sept 30 transcribed from his PDF).
- `src/data/roster.json`: roster extracted from his PDF by `../tools/extract_pdfs.py`.
- `/practice/[id]/print`: landscape, one-page print view (Print, then "Save as PDF" to share).

Database: Supabase (schema in ../supabase/migrations). Copy .env.example to .env.local. Every page needs a signed-in user; pages read from the database. Seed sources live in ../data/seed.
