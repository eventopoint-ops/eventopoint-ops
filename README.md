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
1. ✅ Project skeleton — Vite + React + Supabase client, git repo
2. ✅ Rebuild each screen as clean components (dashboard, calendar, event
   detail, AI import, team/vendor management) using the live app as spec
3. ✅ Bring the Supabase Edge Function + SQL migrations into this repo (this step)
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

## Supabase (backend)

[#supabase-backend](#supabase-backend)

Project ref: `wrtdmolmcqppmgrpnvvi` (region: us-east-1).

- `supabase/migrations/` — SQL migrations, in the order they were applied to
  the live database. Table structure: `organizations`, `profiles`, `events`,
  `tasks`, `team_members`, `vendors`, `vendor_files`, `post_event_notes`, all
  scoped by `org_id` / `event_id` via RLS policies and a `current_org_id()`
  security-definer helper.
- `supabase/functions/parse-run-of-show/` — Edge Function that proxies the
  Claude API to turn an uploaded run-of-show document into structured tasks.
  Reads `ANTHROPIC_API_KEY` from Supabase project secrets.
- `supabase/config.toml` — links this repo to the Supabase project via the
  Supabase CLI (`supabase link --project-ref wrtdmolmcqppmgrpnvvi`).

**Fixed (2026-07-06):** `public._debug_ai_errors` — a table the edge
function above writes to when it hits an error — had Row Level Security
disabled, meaning it was readable by anyone with the app's public anon key
and could contain partial API key prefixes and raw error bodies. RLS is now
enabled with no client-facing policies, so only the edge function's
service-role key (which bypasses RLS) can write to it; no client can read it.

## Deploy

[#deploy](#deploy)

Deploys go through Netlify. Once this repo is pushed to a git host (GitHub),
connect Netlify to the repo directly (Site settings → Build & deploy → Link
repository) instead of manually dragging zip files — this gives real deploy
history and one-click rollback, and eliminates the filename-caching issues
the old manual-deploy process had.

