# Deployment — Bragi Taste Agent

## Architecture

| Layer | Owner |
| --- | --- |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |
| CD | Vercel native GitHub integration |
| App root | Repository root (`.`) |
| Production branch | `main` |
| Framework | Next.js |

Pull requests: Actions validates; Vercel builds **preview** (when Git connected).  
Push/merge to `main`: Actions validates; Vercel builds **production**.

Do **not** add a second GitHub Actions deploy job that races native Vercel CD.

## Project

| Field | Value |
| --- | --- |
| GitHub | https://github.com/DOVRC/bragi-qloo |
| Preferred Vercel project | `bragi-qloo` |
| Vercel scope | Daniel’s personal/team account (verify with `vercel whoami`) |
| Region hint | `iad1` (`vercel.json`) |
| Node | 22.x on CI; Vercel Next.js runtime |

`.vercel/` is gitignored — never commit `project.json`.

## Environment variable names (server only)

| Name | Production value |
| --- | --- |
| `QLOO_API_KEY` | Rotated hackathon key (sensitive) |
| `QLOO_API_BASE_URL` | `https://hackathon.api.qloo.com` |
| `SAMPLE_DATA_MODE` | `false` |

Never use `NEXT_PUBLIC_*` for the Qloo key.  
Treat any previously screenshot-exposed key as compromised until rotated.

Add via dashboard or interactive CLI (`vercel env add QLOO_API_KEY production`) — human types the secret; do not pipe secrets on the command line.

## Local link / deploy (operators)

```bash
npm install --global vercel
vercel login          # Daniel completes browser device auth
vercel whoami         # confirm Daniel’s identity
vercel link           # select/create bragi-qloo under Daniel’s scope
vercel git connect    # DOVRC/bragi-qloo only — never ybedoyab/Bragi
vercel env ls
vercel --prod         # only after env + rotated key + green CI
```

## Verification

1. Production URL returns HTTP 200 (no auth wall).  
2. `GET /api/health/qloo` → `ok: true` (live; avoid hammering).  
3. Guided Taste Journey art-house demo once.  
4. Confirm deployment source SHA matches `main`.

## Rollback

1. Vercel → Deployments → promote a previous READY production deployment.  
2. Or `git revert` on `main` and let CD redeploy.

## CI gates

`npm ci` · `typecheck` · `test` · `lint` · `build` · `npm audit --omit=dev`  
No live Qloo calls in CI.

## Limitations

- Direct pushes to `main` may start a Vercel build before CI finishes unless Deployment Checks / branch rules require the CI check. Prefer PRs when possible.  
- Preview envs should not receive the production Qloo key by default.  
- Production URL: fill in after first READY deploy.
