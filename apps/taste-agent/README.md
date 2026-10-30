# Bragi Taste Agent

Discover local creativity in Medellín through your cultural DNA — Qloo Taste Intelligence + curated catalogue matching.

Part of the [Qloo Agentic Hackathon 2026](https://qloo.devpost.com/) submission. See repo root [`AGENTS.md`](../../AGENTS.md) and [`docs/`](../../docs/).

## Setup

```bash
cd apps/taste-agent
cp .env.example .env.local
# Set QLOO_API_KEY via `qloo setup --qloo` or paste into .env.local (never commit)
npm install
npm run dev
```

Open http://localhost:3000

For UI work without credentials, set `SAMPLE_DATA_MODE=true` in `.env.local`. The UI shows a clear sample-data banner.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Vitest (fixtures; no live Qloo quota) |
| `npm run qloo:smoke` | Live `/search` smoke (requires key) |

## Architecture sketch

1. User submits cultural signals + budget.
2. `POST /api/discover` runs `DiscoveryAgent` (multi-step).
3. Qloo `/search` + `/v2/insights` (server-side only).
4. Match Medellín catalogue → ≤3 evidence-based recommendations.

## Legacy Bragi

ICP canisters under `src/usuarios_*` are unchanged and not required to run this app.
