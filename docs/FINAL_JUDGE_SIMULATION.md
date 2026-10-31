# Bragi — Final multi-agent judge simulation

**Evaluation date:** 2026-10-30 · **Local Colombia time:** ~21:58–22:07 COT  
**Official deadline:** 2026-10-30 22:45 COT · **Code-change cutoff:** 22:15 COT  
**Devpost submission status:** **NOT CONFIRMED** (simulation ≠ submission)

---

## 1. Production SHA actually tested

`d487134` (`d48713425b78412a72d39331de5173d65bd4bd95`) — `main` at evaluation time.

## 2. Production URL

https://bragi-qloo.vercel.app

## 3. Browser tooling used

Cursor IDE Browser MCP (`cursor-ide-browser`: navigate, snapshot, click, type, CDP `Emulation.setDeviceMetricsOverride`, screenshots). Live `POST /api/discover` / health checks. **No mocks, no localhost, no sample-mode assumption.**

## 4. Evidence that real browser interactions occurred

| Agent | Observed live outcomes (examples) |
| --- | --- |
| 1 | Local creators demo → Connections affinities (Jonny Greenwood, Philip Glass, …) → Ferales / Siempre Llueve / Intermediaciones → portfolio https://www.feralesmusica.com/epk → More like this → Nómada |
| 2 | Captured `POST /api/discover` with `mode: "live"`; steps resolve/insights/catalogue; Path B empty without Qloo; feedback added `prioritySignals` |
| 3 | Hip-hop → Alcolirykoz + Moravia; Not my style exclude Moravia; Radiohead+alt-rock → Ferales / Siempre Llueve / Nómada; Insights timeout disclosure on run 1 |
| 4 | Full mobile 375×812 journey; tablet/desktop post-result; screenshots under `%LOCALAPPDATA%\Temp\cursor\screenshots\bragi-*.png` |

## 5. Agent independence / isolation status

| Item | Status |
| --- | --- |
| Four separate `generalPurpose` subagents | **Yes** |
| Distinct personas / prompts | **Yes** |
| Results withheld until all four finished | **Yes** (coordinator consolidation only after Agent 4) |
| Separate browser contexts | **Best-effort** — each agent opened Production via browser MCP; shared host tooling, not four physical devices |
| Parallelism | Agents 1∥2 then Agents 3∥4 (≤2 discovery-heavy evals concurrent) |

**Limitation (honest):** True OS-level browser profile isolation was not available; agents were independent processes with separate instructions and no cross-sharing of findings until consolidation.

## 6. Evaluation date and local Colombia time

2026-10-30, approximately **21:58–22:07 COT**.

## 7. Test scenarios and observed outputs

| Scenario | Observed top matches (Production) |
| --- | --- |
| Local creators demo (alt rock / post-punk / experimental) | Ferales · Siempre Llueve Recs · Intermediaciones (then Nómada after More like this) |
| Hip-hop + rap · Creators | Alcolirykoz · Centro Cultural Moravia |
| After Not my style (exclude Moravia) | Alcolirykoz · Intermediaciones · Nómada |
| Radiohead + alternative rock · Creators | Ferales · Siempre Llueve Recs · Nómada |
| Unexpected “Werckmeister Harmonies” | Search UI only (no discover — quota) |

## 8. Total successful discovery flows

**≥ 7** live discover completions across agents (Agents 1–2: 2 each path; Agent 3: 3; Agent 4: 1). Exact total may include overlapping presets.

## 9. Failed or incomplete flows

- Agent 3: More like this / Surprise me again / unexpected full discover **skipped** (quota cap).
- Agent 3 hip-hop run 1: Insights **timeout** with honest partial-evidence disclosure (still returned Search-backed matches).
- Agent 4: Surprise me again not clicked (quota).

## 10. Network/API failures

- Insights timeout on one hip-hop run (disclosed in UI).
- Search close-match miss for `art rock` after More like this (disclosed warning).
- No total outage; `/api/health/qloo` → `ok: true` at consolidation (~22:08 COT).

## 11. Genuine UX problems

1. Demo preset does not auto-start Explore (extra click).
2. `post-punk` → resolved entity **“Post”** shown in evidence.
3. **“Medellín, Medellín”** when neighborhood equals city.
4. Judge jargon (Path B, resolve budget) dense for nontechnical users.
5. Mobile **“Open connection story →”** ~16px tall (sub-44px touch target).
6. Hero body text contrast over illustration.
7. Autocomplete duplicates / low-contrast meta.

## 12. Recommendation relevance findings

- **Strong:** Alcolirykoz under hip-hop; Ferales / Siempre Llueve / Nómada under alt-rock / Radiohead / local creators demo.
- **Weak / skeptical:** After hip-hop feedback exclusion, **Nómada** (alt-rock/post-punk) and **Intermediaciones** via thin cinematic/funk-style tags — genre bleed / thin cross-domain.
- Near-duplicate Insights tags (spacing/hyphen variants) still inflate evidence lists in places.
- Ticket/event claims consistently disclaimed; outbound portfolio URLs worked when opened.

## 13. Qloo implementation assessment

Live Search + Insights (+ Tags when applicable) via server-side `/api/discover` (`mode: "live"`). Creators intent correctly skips `qloo_native` place ranking (`0 native`). Path B comparison honest on first run (user-only cleared zero hits). Feedback changes `signals` / `prioritySignals` and re-queries. Insights affinity **entities** often shown in Connections but ranking overlap is primarily Search + Insights **tags** + Bragi catalogue. **Not** a silent fixed-list decorator; also **not** “Qloo ranks every local creator natively.”

## 14. Mobile/accessibility findings

Journey completable at 375×812; no document horizontal overflow at 375/768/1440. Named regions and many accessible control names present. Deductions: story-link touch height, truncation (“Post”), hero contrast, sub-44px secondary controls, dense 11px fine print.

## 15. Eligibility checklist

| Criterion | Result | Evidence |
| --- | --- | --- |
| Live functional demo | **PASS** | https://bragi-qloo.vercel.app — four agents completed journeys; health `ok: true` |
| Public GitHub with runnable source | **PASS** | https://github.com/DOVRC/bragi-qloo · `private: false` · README setup |
| Clear text description | **PASS** | Hero + About + `docs/DEVPOST_SUBMISSION_PACKET.md` |
| External hosting without private access | **PASS** | Agents reached Production without Vercel auth wall |
| Visible open-source LICENSE | **PASS** | GitHub `license.spdx_id` = **MIT**; root `LICENSE` |

## 16. Final judge scorecard (subjective simulation — not official hackathon scores)

| Agent | Persona | Score /10 | Notes |
| --- | ---: | ---: | --- |
| 1 | Nontechnical experience | **7.5** | Strong purpose + real portfolio; clarity hurt by jargon / “Post” |
| 2 | Qloo technical value | **8** | Live pipeline + honest provenance; Search noise / entity underuse |
| 3 | Reliability and relevance | **6.5** | Transparency high; genre bleed + Insights flakiness |
| 4 | Mobile and accessibility | **7** | Journey works; touch target + contrast issues |

**Overall evaluation: 7.3 / 10**

**Would impress a judge:** Inspectable Path B / bridge / live Qloo banner; real Medellín portfolios; creators path honesty (`bragi_catalogue`, not fake native ranks).  
**Would reduce confidence:** Weak-tag genre bleed after feedback; Search entity “Post”; Insights timeout variance; mobile story-link hit area; dense judge jargon.

## 17. Prioritized actionable defects

### Coordinator severity (vs Agent 4 labels)

Agent 4 marked story-link height **P0** for touch guidelines. Under this simulation’s policy (**P0 = demo inaccessible / journey broken**), that item is **P1**: journey still completes via cards, Why step, and portfolio links.

| ID | Severity | Defect | Action |
| --- | --- | --- | --- |
| D1 | **P1** | Weak-tag genre bleed (e.g. Nómada under hip-hop after feedback) | **Document only** pre-deadline — ranking change too risky at 22:08 COT |
| D2 | **P1** | Mobile “Open connection story” ~16px touch height | Trivial CSS `min-h-11` (shipped if CI lands before cutoff) |
| D3 | **P1** | Misleading Search resolve “Post” from post-punk | Document — needs Search quality guard, not rush |
| D4 | **P2** | “Medellín, Medellín” location line | Trivial display dedupe |
| D5 | **P2** | Near-duplicate tag spellings in evidence | Document (partial leaf dedupe already on `d487134`) |
| D6 | **P2** | Demo doesn’t auto-Explore; Path B jargon; hero contrast; autocomplete dupes | Document only |

## 18. Recommended final submission status

### **READY TO SUBMIT**

Core public demo is live, eligible, and judge-completable. Remaining issues are relevance/polish P1–P2, not an inaccessible product.

**Devpost:** still **NOT CONFIRMED** until a human submits. Prefer submitting with materials in `docs/DEVPOST_SUBMISSION_PACKET.md` over waiting on optional ranking work.

---

## Appendix — Independent agent report pointers

| Agent | Subagent ID | One-line |
| --- | --- | --- |
| 1 Nontechnical | `977ff728-b937-47bb-9775-48a79885640a` | ~8/10 demo; “Post” + jargon confuse |
| 2 Qloo technical | `71434453-8d4c-46bd-9963-b84cd785d0ac` | Live Qloo; Path B honest; bragi_catalogue creators |
| 3 Adversarial | `1962f05c-a53e-4632-b37a-1d8c5cdff559` | Alcolirykoz OK; post-feedback bleed; transparency strong |
| 4 Mobile/a11y | `9800e995-8649-4d4c-856e-c9330d696f70` | Journey OK; story link + contrast |

Summaries also under `docs/judge-sim/agent{1,2,3}-summary.md`.
