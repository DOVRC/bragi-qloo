# Guided demo — Bragi Taste Journey

For Devpost judges unfamiliar with the project.

## What to open

1. Deployed URL or `npm run dev` → `http://localhost:3000`
2. Scroll to **Taste journey** (or click **Find my matches** / **Discover**)

## Walkthrough A — Art-house

1. Click **Art-house explorer** (or keep Radiohead, Studio Ghibli, experimental jazz).
2. Click **Explore my connections**.
3. Wait for the honest loading state (several seconds; live Qloo).
4. **Step 2 — Connections:** inspect resolved entities and **discovered** Insights affinities. Click an affinity card — matching places highlight on step 3.
5. Click **See Medellín matches**.
6. Open a card’s **How we found this**; note evidence strength badge (e.g. Cross-domain affinity).
7. Optional: **Open connection story** / official site (`rel=noopener`).

## Walkthrough B — Urban culture

1. Click **Change interests** (or step **1. Interests**).
2. Click **Urban culture explorer**.
3. **Explore my connections** again.
4. Read the **Compared with your previous run** panel (affinities added/removed; places changed or not — reported honestly).
5. Inspect new affinities and places.

## What comes from Qloo

| UI element | Source |
| --- | --- |
| Autocomplete suggestions | Live `GET /search` |
| Resolved entities | Live Search (+ name-match) |
| Discovered affinities / theme tags | Live Insights (+ Tags when genres present) |
| Venue list | Bragi curated catalogue ranked with Qloo evidence |
| Evidence strength | Derived from contribution points, not invented % |

## What is **not** guaranteed

- Exact venue order (API latency, Insights coverage, budget filter).
- That every affinity maps to a venue (highlight only when `matchedAffinityIds` contains it).
- Live events or ticket availability (never claimed).

## If Qloo times out / fails

- Error banner shows the API code/message.
- **No silent sample fallback** in live mode.
- Retry with fewer signals or wait and explore again.
- Sample mode only when `SAMPLE_DATA_MODE=true` (must be labeled).

## Recovery

- **Reset journey** clears comparison state.
- **Back to last results** keeps the previous successful response while you edit interests.
