# Guided demo — Bragi Taste Journey

For Devpost judges unfamiliar with the project. Use **Production:** https://bragi-qloo.vercel.app  
(`SAMPLE_DATA_MODE=false` — live Qloo). Local: `npm run dev` → http://localhost:3000 · [DEPLOYMENT.md](DEPLOYMENT.md).

Results vary with Qloo latency and Insights coverage. Never hardcode or promise exact creators or order.

---

## 60–90 second walkthrough (preferred)

**Input:** **Local creators demo** (`alternative rock` · `post-punk` · `experimental music`) · intent **Creators**.

| # | Show | Where in UI |
| --- | --- | --- |
| 1 | Cultural interests | Step **1. Interests** — chips prefilled; intent **Creators** pressed |
| 2 | Qloo Search / Insights | Click **Explore my connections** → step **2. Connections** (resolved entities + discovered affinities / theme tags) |
| 3 | New cultural affinities | Affinity cards under Connections (from live Insights, not typed by the user) |
| 4 | Local independent creator | **See Medellín matches** → step **3. Medellín** ranked cards |
| 5 | Taste-to-Creator Bridge | Bridge panel on Medellín / Why — interest → resolve → affinity → catalogue match → portfolio |
| 6 | What Qloo Changed | Comparison of user-signal-only vs Qloo-enriched under the **same** city / intent / score floor |
| 7 | Creator portfolio | Outbound link on a card (`rel=noopener`) — Bandcamp / Instagram / site as listed |
| 8 | One feedback interaction | **More like this**, **Not my style**, or **Surprise me again** |

Optional: open **How we found this** / step **4. Why** for contribution provenance and evidence strength.

### Where Qloo ends and Bragi begins

| Layer | Source |
| --- | --- |
| Autocomplete | Live `GET /api/search` → Qloo Search |
| Resolved entities / theme tags | Qloo Search (+ Tags when genres present) |
| Discovered affinities | Qloo Insights |
| Ranked Medellín list | **Bragi** curated catalogue scored against Qloo evidence (`rankingPath`: `qloo_native` for verified place IDs, else `bragi_catalogue`) |
| Taste→Creator Bridge / What Qloo Changed | Bragi UI over the same discovery payload — no invented lifts |

---

## Alternative walkthrough (if preferred profile is thin or times out)

1. Click **Art-house explorer** (Radiohead · Studio Ghibli · experimental jazz) or **Urban culture explorer**.
2. Keep **Creators** or switch to **Surprise me** / **Places**.
3. **Explore my connections** again; if the error banner appears, retry with fewer chips or wait and explore again.
4. Continue from Connections → Medellín → Bridge / What Qloo Changed → one feedback action.

Live mode **never** silently falls back to sample profiles. Sample mode only when `SAMPLE_DATA_MODE=true` (labeled banner).

---

## What is not guaranteed

- Exact creator/venue order (API latency, Insights coverage, budget filter).
- That every affinity highlights a catalogue row.
- Live events or ticket availability (never claimed).

## Recovery

- **Reset journey** clears comparison state.
- **Back to last results** keeps the previous successful response while you edit interests.
- Error banner shows API code/message — retry; do not invent matches.
