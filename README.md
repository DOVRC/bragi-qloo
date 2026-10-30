# Bragi Taste Agent

**Discover local creativity through your cultural DNA.**

Bragi is a Qloo-powered cultural discovery agent for Medellín. Share the artists, films, and genres you love; Bragi resolves them with Qloo Taste Intelligence, retrieves cross-domain affinities, and matches a curated local catalogue — with inspectable evidence.

Built for the [Qloo Agentic Hackathon 2026](https://qloo.devpost.com/) by **Daniel Ossa Velásquez** and **Yulian Bedoya** (Colombia).

Repository: https://github.com/DOVRC/bragi-qloo

## Why Qloo is essential

Without Qloo, recommendations would be keyword guesses. With Qloo Search, Tags, and Insights, Bragi grounds matches in cultural entities and affinities. Changing preferences changes the evidence trail and ranking inputs.

## Architecture

```
Browser UI (Next.js)
  → POST /api/discover  |  GET /api/search  |  GET /api/health/qloo
      → DiscoveryAgent
          → Qloo Search / Tags / Insights (server-side X-Api-Key)
          → Taste profile + catalogue ranking
```

No Internet Computer, DFX, wallets, or marketplace checkout in this product.

## Setup

```bash
npm install
cp .env.example .env.local
# Set QLOO_API_KEY (never commit). Prefer rotating any previously exposed key.
# SAMPLE_DATA_MODE=false for live demos
npm run dev
```

Open http://localhost:3000

### Environment

| Variable | Scope | Notes |
| --- | --- | --- |
| `QLOO_API_KEY` | server | Hackathon key via `X-Api-Key` |
| `QLOO_API_BASE_URL` | server | Default `https://hackathon.api.qloo.com` |
| `SAMPLE_DATA_MODE` | server | `true` only for UI work; banner shown; never silent fallback |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Vitest (fixtures; no live quota) |
| `npm run qloo:smoke` | Live Search smoke |
| `npm run qloo:e2e` | Live Profile A/B discovery |

## Live demo

**Production:** https://bragi-qloo.vercel.app  

Status: site and CI/CD are live on Daniel’s Vercel project `bragi-qloo` (`daniel-o-s-projects1`), Git-connected to `DOVRC/bragi-qloo` / `main`. Production stores `QLOO_API_KEY` as a Vercel Secret — rotate at Qloo if a prior key was screenshot-exposed, then update the Secret. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## CI/CD

| Stage | System |
| --- | --- |
| CI | GitHub Actions — [ci.yml](https://github.com/DOVRC/bragi-qloo/actions/workflows/ci.yml) (`typecheck`, `test`, `lint`, `build`, `audit`) |
| CD | Vercel native Git integration (preview on PR; production on `main`) |

## Deploy (operators)

1. `vercel login` as Daniel → `vercel whoami` must be `dovrc`
2. Link/create project `bragi-qloo` (root `.`, Node 22, `npm ci` / `npm run build`)
3. `vercel git connect` → **only** `DOVRC/bragi-qloo`
4. Production env names: `QLOO_API_KEY` (sensitive), `QLOO_API_BASE_URL`, `SAMPLE_DATA_MODE=false`
5. Never use `NEXT_PUBLIC_` for the Qloo key

Full guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) · Demo script: [docs/GUIDED_DEMO.md](docs/GUIDED_DEMO.md)

## License

MIT — see [LICENSE](LICENSE). Brand logos in `public/brand/` are first-party Bragi assets used for this submission. Do not reuse third-party marketplace template imagery.

## Docs

- [AGENTS.md](AGENTS.md) — agent operating rules
- [docs/STATUS.md](docs/STATUS.md) — checkpoint
- [docs/QLOO_INTEGRATION.md](docs/QLOO_INTEGRATION.md) — verified API contracts
- [docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md) — Devpost readiness
