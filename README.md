# EVENToPOINT.ops

Event operations app — AI-assisted run-of-show import, task/team coordination,
vendor management, calendar, and (planned) staff check-in. Built with
Vite + React + Supabase.

## Status

This is a **rebuild**, started 2026-07-05. The original app had no source
repository — every change was a blind string-replace patch against a
minified production bundle, deployed by manually dragging zip files onto
Netlify. That worked short-term but wasn't sustainable: no version history,
no rollback, no way for anyone else to ever read the code.

This repo replaces that with a normal, readable, version-controlled project.

**Rebuild phases:**
1. ✅ Project skeleton — Vite + React + Supabase client, git repo (this step)
2. ⬜ Rebuild each screen as clean components (dashboard, calendar, event
   detail, AI import, team/vendor management) using the live app as spec
3. ⬜ Bring the Supabase Edge Function + SQL migrations into this repo
4. ⬜ Feature-parity QA pass against the live app
5. ⬜ Fix known gaps: staff check-in token flow, vendor files to real
   Supabase Storage, basic error logging

## Local setup

```bash
npm install
cp .env.example .env   # fill in real values if not already present
npm run dev
```

## Environment variables

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project API URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon-equivalent) key — safe for client-side use |

Never commit real values in `.env` — only `.env.example` (with placeholder-safe
values) is tracked in git.

## Deploy

Deploys go through Netlify. Once this repo is pushed to a git host (GitHub),
connect Netlify to the repo directly (Site settings → Build & deploy → Link
repository) instead of manually dragging zip files — this gives real deploy
history and one-click rollback, and eliminates the filename-caching issues
the old manual-deploy process had.
test
