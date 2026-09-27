# AI-Fix Report — Finale Differentiators (P1 items 6, 7, 8 + 9-check)

**Date:** 2026-09-09 · **Author:** senior-dev · **Scope:** `D:\SIH\udyog-sarthi\` (Express + vanilla JS + JSON file, port 3000, offline demo preserved, zero new npm deps)
**Inputs read first:** `.ai/reports/prototype-audit.md`, `.ai/reports/project-verdict.md`, `server.js`, `data/seed.js`, `public/app.js`, `public/index.html`

---

## 1. What was built

### (a) ONE real AI — TF-IDF knowledge search over a 60-article corpus ✅
- **Choice:** option (a) from the audit — fastest, zero-dependency, offline-safe, deterministic. No fake AI: no LLM/embeddings claimed anywhere.
- `data/seed.js`: knowledge expanded **10 → 60 articles** (K01–K60, each with `id`, Marathi-aware tags, and honest `source` labels such as *"Illustrative summary — confirm with MPCB portal"* / *"Demo heuristic v0 — no ML model"*). Covers CTE/CTO, Red/Orange/Green, deemed, parallel Groups A–D, all 12 approvals, all 6 schemes, MAITRI-KYA/NSWS-EntityLocker explainers, SLA table, risk-formula weights, renewals, grievance ladder, demo ops.
- `server.js`: `ktok` tokenizer (EN+Devanagari, stopwords) → `tfidfSearch` (TF-IDF cosine + tiny tag boost) → `knowCorpus` (live `db.knowledge`, **auto-tops-up from seed** so stale `db.json` files with 10 FAQs still serve 60) → `KNOW_EVAL` (8 hand-labelled query→expected-article pairs) + `evalKnowledge` (P@1 accuracy).
- **Endpoints:** `GET/POST /api/knowledge/search?q=&limit=` → `{query, meta{method, corpusSize, ranked, tookMs, eval{n,correct,accuracy}}, results[{id,q,a,tags,source,score,matched}]}`; `GET /api/knowledge/eval` → full eval with per-query hit/miss detail.
- **Frontend** (`public/app.js` knowledge page): debounced API search, renders **score badges, matched terms, source line, and an honesty strip** (`TF-IDF cosine · corpus n=60 · eval P@1 6/8 (75%) · no LLM/embeddings · Nms`). Empty query browses unranked.
- **Honest label (measured, not claimed): n=60, P@1 accuracy = 6/8 = 0.75.** The 2 misses are near-synonym pairs (K40-vs-K03 deemed; K23-vs-K22 fire NOC) — defensible, left as-is rather than gaming the eval set.

### (b) Live-fed analytics ✅
- `server.js` `/api/analytics` keeps the file-backed 38-row baseline (`historyCount` now exposed) and adds **live aggregation that every `POST /api/applications` moves**: `filingsBySector`, `pendingByDept`, `queryRate`, `combinedInspectionPct` (plus existing counters).
- **Frontend:** new bordered `🔴 LIVE` card (filings / query-rate / combined-% / sectors-live), **third canvas `ch3` = live pending-by-dept bars** (unit-aware `bars()` — counts render without the "d" suffix), filings-by-sector list. Old regime charts untouched.
- **Proof (live curl):** BEFORE `apps=3 pending=8` → filed `APP-2026-0159` (9 tracks, Amber 49) → AFTER `apps=4 pending=17 queryRate=4`, `pendingByDept=MIDC:5 MPCB:2 LABOUR:3 DOI:1 FIRE:3 MSEDCL:3`. Filing moves the charts. ✔

### (c) EN/MR toggle ✅ (minimal, as specced: header + wizard + tracker)
- **New `public/i18n.json`:** 36 keys × `en`/`mr` (nav ×10, brand sub, wizard titles/steps/labels/buttons, tracker titles/button, knowledge placeholder). Served statically, verified `GET /i18n.json`.
- `public/app.js`: `LANG` (default `en`, persisted `us_lang`), `T(k, fallback)` with English-literal fallback (works even if fetch fails), `toggleLang()` + `window.toggleLang`, NAV converted to `[hash, key, en]` triples, `renderChrome` translates nav/brand/login + renders the **मराठी/English toggle button** in the rolebox, wizard + result buttons + tracker list translated.
- `public/index.html`: `brand-sub` given `id="brandsub"` for JS translation (static English remains as no-JS fallback).
- **Verification:** dict served + parsed (36 keys/lang, MR values confirmed Devanagari via node byte check), wiring grepped in `app.js`. **Headless click-test not possible in this environment — recommend one manual check in demo prep** (toggle → wizard shows `चेकलिस्ट जनरेटर विझार्ड` → `localStorage.us_lang==="mr"` persists across reload).

### (d) Inspection↔track linkage — SKIPPED, already done by P0 agent ✅ (per instructions)
- On re-reading `server.js` mid-task I found the P0 agent had concurrently landed a superset: booking flips relevant `Applied/Under review/Queried` tracks → `Inspection scheduled` (with remarks), completion flips them → `Under review`, dept-overlap double-booking warning, plus validation + officer-auth. My overlapping edit attempt **failed safe** (exact-match miss) — no P0 code was overwritten; all my code verified `PRESENT` alongside it afterwards.
- I verified P0's linkage end-to-end instead of duplicating it: booked `INSP-303` (MSEDCL) → `MSEDCL-PWR: Applied → Inspection scheduled`; completed it (officer token) → `→ Under review` with timeline remarks; double-book warning fires (`"Double-booking warning: INSP-304 already occupies …"`).
- K42/K43 knowledge articles document this behavior for judges.

## 2. Verification log
| Check | Result |
|---|---|
| `node --check server.js / data/seed.js / public/app.js` | ✅ all pass |
| `npm start` + `GET /api/health` | ✅ `{ok:true,…}` on :3000 |
| `GET /api/knowledge/search?q=deemed approval SLA breach` | ✅ `corpusSize=60 ranked=true`, top `K40 0.472 / K03 0.398 / K30 0.202` — real scores |
| `GET /api/knowledge/eval` | ✅ `n=8 correct=6 accuracy=0.75` (detail in §1a) |
| Analytics BEFORE→file→AFTER | ✅ 3→4 apps, 8→17 pending, live maps populated |
| Inspection book→complete linkage (officer token) | ✅ both directions + warning |
| `GET /i18n.json` + MR byte check | ✅ 36 keys × 2 langs, Devanagari intact |
| `POST /api/reset` after tests | ✅ clean seeds restored (apps=3, history=38, **corpus=60 persisted** in `db.json`) |
| Offline property | ✅ no new deps (`express` only), no CDN, no build step |

## 3. Files changed
- `data/seed.js` — knowledge 10→60 (K01–K60 with id/tags/source). Nothing else touched.
- `server.js` — TF-IDF engine + 3 knowledge endpoints + analytics live aggregation. (Inspection/auth/sweeps/validation regions are P0's — not touched.)
- `public/app.js` — i18n bootstrap + translated NAV/wizard/tracker, API-backed knowledge UI, live analytics card + `ch3`, unit-aware `bars()`, booking-warning alert. (P0 auth/error-handling code preserved.)
- `public/index.html` — `id="brandsub"` only.
- `public/i18n.json` — **new**, EN/MR dict.
- `.ai/reports/ai-fix-report.md` — this report.

## 4. Blockers / notes for the chain
1. **Concurrent-agent contention (no data lost, flagging only):** a P0 agent edited `server.js`/`app.js` mid-task; one `node` fleet churned (3 procs, port-3000 winner changed) and a `POST /api/reset` from another session wiped one of my probe apps mid-test. Final file + runtime state re-verified after the churn. Recommend agents stagger restarts or coordinate via the report files.
2. **One transient anomaly, resolved:** a double-book probe printed an empty warning while servers were churning; re-probe on the final server returns the warning correctly. Not a code bug (see §1d proof).
3. **Manual QA still wanted:** MR toggle click-through in a real browser; wizard→file→tracker→analytics visual pass; rehearse the "file an app, watch ch3 move" + "TF-IDF eval strip" demo beats.
4. **Deliberately NOT done (out of scope / P0-owned):** doc-validator, auth, sweeps, input hygiene, whitelist hardening — P0's. No SQLite/Docker/tests — P2. Demo claims still to avoid on stage: "auto-deemed" timing nuances, DigiLocker live integration, 36-district coverage.
5. **No sprint-manager update:** no `task_id` was included in the dispatch — DB status change skipped rather than guessed.

## 5. Suggested demo beats (30 sec each)
1. Knowledge page → type `deemed approval SLA breach` → point at scores + `eval 6/8 (75%) · no LLM` strip: *"real retrieval, honestly labelled."*
2. Analytics → file one app from the wizard → reload analytics → `🔴 LIVE` card + `ch3` moved: *"filing moves the charts."*
3. Header toggle → `मराठी` → wizard in Marathi: *"Maharashtra-ready inclusivity."*
