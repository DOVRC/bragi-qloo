# Devpost submission checklist

Deadline: **2026-10-30 11:45 PM EDT**

## Required

- [x] Public repository URL — https://github.com/DOVRC/bragi-qloo
- [x] Detectable open-source **LICENSE** file (MIT)
- [ ] Externally hosted, publicly accessible demo (Vercel recommended)
- [ ] English product description (what it does + why Qloo-powered)
- [x] Setup instructions (clone, env, run, test) — `apps/taste-agent/README.md` + root README
- [x] Testing instructions for judges — `npm test`, `npm run qloo:smoke`, `npm run qloo:e2e`
- [x] Explanation of original Bragi vs hackathon Taste Agent changes — docs + README
- [x] Evidence of real Qloo integration (redacted) — `docs/QLOO_INTEGRATION.md` + `docs/STATUS.md`
- [x] Privacy/credential review locally — `.env*` gitignored; check-env redacts; no silent sample fallback
- [ ] Devpost entry fields complete; Representative submits

## Strongly recommended

- [ ] Screenshots of core journey (no secrets)
- [ ] `docs/QLOO_INTEGRATION.md` linked from README
- [ ] Live smoke test log note in STATUS (success only if real)
- [ ] Responsive check mobile + desktop

## Optional

- [ ] Demo video (official site: **not required**)
- [ ] Discord #api-help if quota issues

## Technical verification before submit

```bash
cd apps/taste-agent
npm ci
npm run typecheck
npm test
npm run build
npm run qloo:smoke   # only with valid key
```

## Deployment (recommended, needs authorization)

1. Push branch to GitHub.
2. Import `apps/taste-agent` as Vercel root (or monorepo root directory setting).
3. Set `QLOO_API_KEY` and `QLOO_API_BASE_URL` in Vercel env (server).
4. Confirm production URL loads and `/api/discover` works without leaking key.
5. Paste URL into Devpost.

## Original vs new (draft for description)

| Original Bragi | Hackathon Taste Agent |
| --- | --- |
| ICP canisters, Internet Identity | Next.js + server Route Handlers |
| Artist user CRUD | Qloo Search + Insights |
| Marketplace/community vision | Cultural DNA → Medellín catalogue matching |
| Spanish README focus | English submission materials |

## Credential hygiene

- [ ] Key not in git history of submission branch
- [ ] `.env*` gitignored
- [ ] Rotate if previously shared in chat
- [ ] Sample-data mode off in production demo
