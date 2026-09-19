# USTB Rice

[Chinese](./README.zh-CN.md)

Desktop ricing contest site for Source of USTB.

Each participant submits one write-up and any number of screenshots. The contest runs in two phases:

- **Upload** — submit and edit your own entry
- **Voting** — entries are locked, members vote for each other and judges score

## Pages

```txt
/           work wall
/login      sign in
/u/[id]     a member's entry
/me         manage your own entry
/rank       rankings
```

## Structure

```txt
app/pages/                     page routes
app/components/                shared components
app/composables/               contest state and data access
app/types/contest.ts           data model
app/utils/contest-seed.ts      contest rules and seed data
public/mock/                   placeholder screenshots
```

## Development

```bash
pnpm install
pnpm dev
```

Notes:

- Supabase is not wired up yet. Data lives in memory (`app/composables/useContestStore.ts`) and a reload resets everything.
- The data model already follows the planned tables: `profiles`, `works`, `work_photos`, `votes`.
- `app/components/DevToolbar.vue` is a footer control for switching phase and signed-in identity while developing. Remove it before going live.

## Environment

Copy `.env.example` to `.env`:

```txt
SUPABASE_URL=
SUPABASE_KEY=
```

`SUPABASE_KEY` is the anon key. It ships inside the client bundle and is not a secret — what actually guards the data is row level security, so enable RLS on every table and write policies for it.

## Scoring

```txt
total = popularity * 40% + judges * 60%
```

Popularity is normalised against the current highest vote count. The judge score is the average of every judge's score. Photo limit, description length, vote budget and weights all live in `CONTEST_CONFIG`.

## Build

```bash
pnpm build
pnpm preview
```
