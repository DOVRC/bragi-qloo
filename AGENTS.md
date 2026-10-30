# AGENTS.md — Bragi Taste Agent

Authoritative instructions for coding agents working on **https://github.com/DOVRC/bragi-qloo**.

**Before every task:** read this file and [`docs/STATUS.md`](docs/STATUS.md). Inspect code before changing it. Prefer small coherent improvements. Run tests. Update status. Never mark untested work complete. Never expose secrets.

## Identity

| Field | Value |
| --- | --- |
| Product | Bragi Taste Agent |
| Purpose | Qloo-grounded cultural discovery for Medellín |
| Hackathon | Qloo Agentic Hackathon 2026 |
| Team | Daniel Ossa Velásquez, Yulian Bedoya |
| Repo | https://github.com/DOVRC/bragi-qloo |

**Not in scope:** ICP, DFX, Azle, Internet Identity, wallets, marketplace checkout, Supabase (unless explicitly needed later).

## Layout (current)

```
bragi-qloo/
  AGENTS.md
  README.md
  LICENSE
  docs/
  public/brand/
  scripts/
  src/app/
  src/components/
  src/lib/agent|qloo|catalogue/
  src/data/
```

Next.js App Router at repository root. Deploy root: `.`

## Engineering rules

1. TypeScript for application code.
2. Qloo calls server-side only (`X-Api-Key`).
3. Never silent-sample when live Qloo fails.
4. Never fabricate entity IDs, bookings, or contacts.
5. Label demonstration catalogue entries.
6. Push only to `DOVRC/bragi-qloo` — never to `ybedoyab/Bragi`.
7. Do not force-push.

## Commands

```bash
npm install
npm run dev
npm run typecheck && npm test && npm run lint && npm run build
npm run qloo:check-env
npm run qloo:smoke
```

## Task loop

1. Read AGENTS.md + STATUS.md  
2. Inspect relevant code/docs  
3. Smallest coherent change  
4. Test  
5. Update STATUS  
6. Report done / pending / blockers  
