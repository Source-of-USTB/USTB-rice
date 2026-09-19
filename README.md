# USTB Rice

[Chinese](./README.zh-CN.md)

Desktop ricing contest site for Source of USTB. Nuxt 4 + Nuxt UI on the front, Supabase for auth, database and photo storage.

Each participant submits one write-up and any number of screenshots. The contest runs in two phases:

- **Upload** — submit and edit your own entry
- **Voting** — entries are locked, members vote for each other and judges score

## Pages

```txt
/           work wall
/login      sign in / sign up
/confirm    OAuth and magic link callback
/u/[id]     a member's entry
/me         manage your own entry
/rank       rankings
```

## Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` once in the SQL Editor. It creates the tables, row level security policies, triggers and the storage bucket, and is safe to re-run.
3. Copy `.env.example` to `.env` and fill in the project URL and publishable key from Project Settings → API. `pnpm dev` creates the file for you on first run if it is missing.
4. `pnpm install && pnpm dev`

Contest rules live in the `contest_settings` row, not in the code. To open voting:

```sql
update public.contest_settings set phase = 'voting' where id = 1;
```

To appoint a judge, have them sign in once, then:

```sql
update public.profiles set role = 'judge' where id = '<their uuid>';
```

## Structure

```txt
supabase/schema.sql            tables, RLS policies, triggers, storage bucket
app/pages/                     page routes
app/components/                shared components
app/composables/               data fetching and mutations
app/types/contest.ts           domain model
app/types/database.ts          table types, mirrors schema.sql
scripts/setup-env.mjs          creates .env from .env.example when missing
```

`useContestData` fetches everything in one pass and every write calls `refresh()`. That is plenty for a club-sized contest and avoids maintaining incremental state.

## Environment

```txt
SUPABASE_URL=
SUPABASE_KEY=
```

`SUPABASE_KEY` is the publishable key. It ships inside the client bundle and is not a secret — what actually guards the data is row level security, which `schema.sql` sets up. A `SUPABASE_SERVICE_KEY` would bypass RLS: use it server side only and never commit it.

Every rule is enforced in the database as well as the UI. Disabled buttons are convenience; the policies and triggers are the boundary. Individual votes are only readable by the voter, while vote counts are public through the `work_scores` view.

## Scoring

```txt
total = popularity * popular_weight + judges * judge_weight
```

Popularity is normalised against the current highest vote count. The judge score is the average of every judge's score. Both weights, the photo limit, the description length and the vote budget come from `contest_settings`.

## Build

```bash
pnpm build
pnpm preview
```
