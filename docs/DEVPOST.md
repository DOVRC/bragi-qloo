# Devpost materials — Bragi Taste Agent

**Public demo (production):** https://bragi-qloo.vercel.app  
**Repository:** https://github.com/DOVRC/bragi-qloo  
**PR:** https://github.com/DOVRC/bragi-qloo/pull/1  

Screenshots: `docs/screenshots/` (no secrets).

| File | Content |
| --- | --- |
| `00-production-hero.png` | Production landing |
| `01-interests-five.png` | Interests with 5 tastes + intent selector |
| `02-connections-live.png` | Live Qloo affinities (Connections) |
| `02-taste-dna.png` | Taste DNA evidence shape |
| `03-feedback-rerank.png` | More like this — prioritySignals + affinity delta |
| `04-why-explainability.png` | Native candidate explainability (affinity vs popularity) |
| `05-creator-discovery.png` | Independent creator (Odio a Botero) |

## Paste-ready English description

**Bragi Taste Agent** helps people discover Medellín creators and cultural spaces from the music, film, and culture they already love.

You choose interests and an intent (**Creators**, **Places**, or **Surprise me**). Bragi resolves those signals with **Qloo Search, Tags, and Insights**, then ranks a curated local catalogue with dual-path evidence:

- **Qloo-native path** — verified Medellín place entity IDs scored with Insights `query.affinity` and **candidate** explainability (never popularity-as-affinity; aggregate explainability kept separate).
- **Bragi catalogue path** — independent creators and projects matched to Qloo affinities when they are not confidently indexed in Qloo.

The four-step Taste Journey shows Connections, **Taste DNA** (evidence shape of the run), recommendations with **More like this / Not my style / Surprise me again**, and a Why step with inspectable provenance.

Feedback is not cosmetic: refinement signals are **prioritized inside a bounded five-signal Qloo Search budget** via `prioritySignals`, so More like this and Surprise me again can change what actually reaches Search/Tags/Insights. Surprise me again rotates unused Insights affinities instead of always repeating the first. Live mode never invents demonstration profiles when evidence is empty.

## Built with

Next.js 15 · React 19 · Qloo Hackathon API · Vercel · TypeScript · Vitest

## How Qloo is used

| Capability | Usage |
| --- | --- |
| Search | Resolve up to 5 prioritized cultural signals |
| Tags | Genre/theme lookups (bounded) |
| Insights | Affinity expansion + native `filter.results.entities` ranking |
| Explainability | Per-candidate contributions on Why cards |

## Demo script

1. Open the public demo (or Preview after Preview `QLOO_API_KEY` is configured).
2. Select 5+ interests if desired; choose **Surprise me**; Explore.
3. Inspect Connections (live affinities) → Medellín matches → Taste DNA.
4. Open Why on a **Ranked by Qloo Insights** card; note affinity vs popularity language.
5. Try **Not my style**, then **More like this** / **Surprise me again** and confirm the resolve warning mentions prioritized feedback when >5 signals.

## Known limitations

- Preview historically lacked `QLOO_API_KEY` (Production-only) until rotated key is added to Preview.
- Treat any previously screenshot-exposed `hack_` key as compromised until rotation is confirmed.
- Native affinity comparison UI appears only when ≥2 native candidates return affinity.
- Tickets/calendars are not booked; public URLs are pointers only.

## Release gate

Do **not** merge until: rotated Qloo key in Production **and** Preview, CI green, Preview live Taste Journey QA, no secret leakage.
