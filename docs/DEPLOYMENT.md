# Deployment — Bragi Taste Agent

## Architecture

| Layer | Owner |
| --- | --- |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |
| CD | Vercel native GitHub integration |
| App root | Repository root (`.`) |
| Production branch | `main` |
| Framework | Next.js 15 / Node.js 22.x |

Pull requests: Actions validates; Vercel builds **preview**.  
Push/merge to `main`: Actions validates; Vercel builds **production**.

Do **not** add a second GitHub Actions deploy job that races native Vercel CD.

## Live project

| Field | Value |
| --- | --- |
| GitHub | https://github.com/DOVRC/bragi-qloo |
| Vercel scope | `daniel-o-s-projects1` (Daniel O’s projects / user `dovrc`) |
| Vercel project | `bragi-qloo` (`prj_8IBU5bqhjIpFGcKDwxFJLQ22ZwrG`) |
| Production URL | https://bragi-qloo.vercel.app |
| Production branch | `main` |
| Region | `iad1` |
| Node | 22.x |
| Deployment protection | SSO disabled for public hackathon demo |

`.vercel/` is gitignored — never commit `project.json`.

## Environment variable names (server only)

| Name | Production |
| --- | --- |
| `QLOO_API_KEY` | Sensitive; **rotated** hackathon key required |
| `QLOO_API_BASE_URL` | `https://hackathon.api.qloo.com` |
| `SAMPLE_DATA_MODE` | `false` |

Never use `NEXT_PUBLIC_*` for the Qloo key.  
Any previously screenshot-exposed key is compromised — rotate at Qloo, then set Production via dashboard or:

```bash
vercel env add QLOO_API_KEY --environment production --sensitive
```

(Human types the secret into the secure prompt; do not pipe secrets on the command line.)

After adding/updating the key, trigger a new production deployment (push to `main` or `vercel --prod` from a clean linked tree) so lambdas pick up the env.

Preview should **not** receive the production Qloo key by default.

## CI

Workflow: https://github.com/DOVRC/bragi-qloo/actions/workflows/ci.yml  

Gates: `npm ci` · `typecheck` · `test` · `lint` · `build` · `npm audit --omit=dev`  
No live Qloo calls in CI.

## Verification

1. https://bragi-qloo.vercel.app → HTTP 200, no auth wall.  
2. `GET /api/health/qloo` → `ok: true` (once rotated key is set; avoid hammering).  
3. Guided Taste Journey once (`docs/GUIDED_DEMO.md`).  
4. Confirm deployment source SHA matches `main`.

## Rollback

1. Vercel → Deployments → promote a previous READY production deployment.  
2. Or `git revert` on `main` and let Git CD redeploy.

## Limitations

- Hobby plan: Vercel Deployment Checks that block production until GitHub CI passes may be unavailable. Prefer PR merges with required CI. Direct pushes to `main` can start Vercel before CI finishes.  
- Live Qloo is blocked until a **rotated** `QLOO_API_KEY` is present in Production env and a redeploy completes.  
- Do not set `SAMPLE_DATA_MODE=true` for the public demo.
