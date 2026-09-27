# Udyog Sarthi (SIH-26130) — Brutally Honest Prototype Audit

**Date:** 2026-09-09 · **Auditor:** CTO · **Target:** `D:\SIH\udyog-sarthi\` (Express + static frontend, `server.js` 254 lines, `public/app.js` 406 lines, `data/seed.js` 164 lines, 1 dependency: express)
**Method:** code read (all 6 source files) + live runtime tests against the already-running instance on `:3000` (health, meta, checklist, create, officer-action, forged-doc injection, inspection, grievance, escalate, reset). Probe data was cleaned via `POST /api/reset` — vault verified clean afterwards.

---

## 1. Verdict up front — SCORE: 5.5 / 10

| Lens | Score | Meaning |
|---|---|---|
| Demo narrative / judging click-path | 8 / 10 | 5-minute script works end-to-end. This is the prototype's real strength. |
| Engineering integrity (what's real vs claimed) | 4 / 10 | Too many headline claims are client-side theater or static seed data. A technical judge *will* find these in 10 minutes. |
| Finale readiness (AI/ML, auth, scale, i18n) | 3 / 10 | Zero AI/ML despite "AI" in the PPT filename. Zero auth. Zero Marathi. JSON-file DB. |
| **Overall** | **5.5 / 10** | **Select-worthy for the internal round on demo strength alone. Will get exposed at finale level without P0+P1 fixes below.** |

**One-line summary:** a genuinely good *demo* of the reform story wrapped around a prototype that currently fakes its three hardest claims (pre-validation, parallel workflow engine, analytics) and has no moat feature (AI) that winning SIH teams will all show.

---

## 2. Feature coverage table — Real vs Mock vs Static

| # | Expected capability | Status | What's actually there | Honesty gap |
|---|---|---|---|---|
| 1 | Customised checklist (sector×location×size×stage) | **REAL (thin)** | `matchChecklist()` filters 12 approvals by sector/size/stage, sorts by parallelGroup, sums fees, computes critical path. Live-tested: Food/Small/Establish → 9 items, ₹1,10,000, 45d critical. | Only 12 approvals, 8 districts; no conditional logic (investment/worker-count triggers), no taluka variation. Rules are static tags, not a rule engine. |
| 2 | Document pre-validation | **MOCK — client-side only** | All checks (type/size/expiry/name) run in `app.js:validateUpload`. Server (`server.js:155-167`) **blindly trusts `passed:true`** from the request body. | **Proven live:** injected `{"name":"forged.pdf","passed":true}` with no file → accepted, marked verified, auto-cleared an officer query, **poisoned the trusted vault**. Any judge with DevTools destroys this claim in 60 seconds. |
| 3 | Verified data reuse / DigiLocker-style vault | **PARTIAL** | Vault CRUD real; `fileApplication()` re-attaches verified names. | Only **filename strings** are stored — no file bytes, no DigiLocker/MahaOnline API, no verified-source handshake. "Reuse" = copying a string. |
| 4 | Parallel workflows | **MOCK-LABEL** | `parallelGroup: A/B/C/D` static tags + sort + grouped display. | No DAG, no dependency gating, no state machine: filing creates **all tracks as "Applied" simultaneously** — including Group-D CTO which legally requires prior CTE. Groups are display labels, not an engine. |
| 5 | Inspection scheduling + common inspection | **PARTIAL** | Booking CRUD + combined-visit suggestion + officer confirm. Live-tested OK. | No calendar conflicts, no real officer assignment ("To be assigned"), **dead code** `server.js:179` (`forEach(()=>{})`), completing an inspection **does not update related tracks**. |
| 6 | SLA tracking + deemed approval | **REAL but fragile** | `trackSla()` countdown math works; breach/warn states feed alerts. | (a) **Any track touch resets the SLA clock** — an officer can game SLA forever with fake "reviews". (b) Deemed approval **never auto-fires**; requires manual `action:"deemed"`. (c) Seed data never breaches, so judges never see the breach path unless you force it. |
| 7 | Alerts | **REAL (weak delivery)** | Derived feed from SLA/query/inspection/grievance state. Live: 4 alerts correct. | Polling on navigation only. No push — no SMS/email/WebSocket. "Alerts" = a strip you have to visit the page to see. |
| 8 | Single dashboard (applicant + officer) | **REAL (no security boundary)** | Applicant dashboard + dept-wise officer queue both work. | Role = `localStorage` string. **Server enforces zero auth** — I performed officer approve/query as an anonymous curl. Officer view is a client-side `if`, not a boundary. |
| 9 | Knowledge engine | **STATIC FAQ** | 10 hardcoded Q&A + substring filter. Works as search box. | No AI, no ranking (TF-IDF/embeddings), no grounding in live data. Calling this an "engine" will invite ridicule from any team showing RAG. |
| 10 | Risk-based scrutiny (Green/Amber/Red) | **HEURISTIC, half-dead** | `riskScore()` runs live on every application (verified across 3 seeds + 1 probe: 35/63/31/28). | (a) Seed's per-approval `riskBump` field is **never read** — dead data. (b) Thresholds (35/65) uncalibrated, no MPCB Red/Orange/Green mapping despite the knowledge article claiming exactly that. (c) No learning from outcomes. |
| 11 | Grievance + escalation ladder | **REAL CRUD, MANUAL ladder** | File/escalate/resolve all live-tested; timeline travels with case. | "Auto-escalates in 7 days" is **false** — escalation requires a human clicking Escalate. No timer, no cron, no SLA clock on grievances themselves. |
| 12 | Analytics (68→31d, bottleneck ranking) | **STATIC SEED THEATER** | Endpoint returns correct-shaped KPIs; canvas charts render offline. | The 60→21d story comes from **38 hardcoded `history` rows**; live applications **do not feed analytics at all**; 41→12% incomplete rate is a hardcoded constant. Filing 50 apps changes nothing on the charts. |

**Bottom line on "does it demo all 5 expected outcomes":** all five *render on screen* in the click-path, but outcomes 2 (pre-validation), 4-as-engine (parallel workflow), and 12 (analytics) are **demonstrations, not implementations**. A non-technical judge sees 5/5. A technical judge sees 2.5/5.

---

## 3. Live test log (reproducible)

All against `http://localhost:3000` (instance already running, PID 1660):

| Test | Result |
|---|---|
| `GET /api/health` | ✅ `{ok:true, app:"Udyog Sarthi", sih:"26130"}` |
| `GET /api/meta` | ✅ 6 depts, 12 approvals, 6 schemes, 10 knowledge, 7 sectors, 8 districts |
| `POST /api/checklist` (Food/Nashik/Small/Establish) | ✅ 9 items, ₹1,10,000, critical 45d, combined-inspection suggestion, 3 scheme previews |
| `POST /api/checklist` (Chemicals-Large-Operate = Red path) | ✅ 4 items incl. CTO + Final Fire; ⚠️ created with zero gating (see §2.4) |
| `POST /api/checklist` with `{}` | ❌ **BUG:** `criticalDays:null` (`Math.max(...[])` = −∞ → JSON null), `totalFee:0`, HTTP 200. No input validation anywhere. |
| `GET /api/applications` | ✅ 3 seeds with correct risk bands (Amber 35 / Amber 63 / Green 31) |
| `POST /api/applications` (IT-Micro probe) | ✅ `APP-2026-0159`, 4 tracks, Green 28. ⚠️ `docs:[]` unless caller passes `reusedDocs` (frontend does; API default doesn't) |
| `PATCH …/track` (anonymous officer query) | ✅ works with **zero credentials** — auth hole confirmed |
| `POST …/documents` with forged `passed:true` | ❌ **SECURITY HOLE:** forged doc accepted → verified → vault-poisoned → officer query auto-cleared |
| `POST /api/inspections`, `POST/PATCH /api/grievances` | ✅ all CRUD + escalate transitions work |
| `GET /api/analytics`, `/api/alerts`, `/api/vault` | ✅ correct shapes; analytics static (§2.12) |
| `POST /api/reset` | ✅ probes cleaned; 3 apps + 3 vault docs restored |
| `GET /api/applications/NOPE`, bad track id | ✅ clean 404 JSON (good) |

---

## 4. Critical gaps vs winning SIH teams (ranked by selection risk)

1. **No AI/ML anywhere — the single biggest selection risk.** Filename says "AI", knowledge article says "risk-based", but there is no model, no NLP, no OCR, no recommendation, no prediction. Every serious finale team will demo at least one real ML component. This alone can lose to a weaker-but-"AI" team.
2. **Integrity holes a technical evaluator will poke live:** forged-doc injection (§2.2), zero-auth officer actions (§2.8), SLA-clock gaming (§2.6), `criticalDays:null` on bad input (§3). Two minutes in DevTools each.
3. **No Marathi support.** Maharashtra government product, English-only UI, one decorative `म` crest. Regional-language teams will outscore on inclusivity; evaluators explicitly look for this in civic-tech PS.
4. **No DigiLocker / MahaOnline / real govt-API integration** — not even a sandbox stub or API-contract page. "DigiLocker-style" without a migration path reads as hand-waving.
5. **JSON-file DB with sync read-modify-write, no locking.** Concurrent officer + applicant writes can silently clobber each other; no audit trail (remarks are string-concatenated, actor identity self-declared); no backup. Fine for single-judge demo, indefensible in Q&A ("what happens with 10,000 concurrent applicants?").
6. **No mobile story.** No responsive audit evidence, no PWA manifest, no offline-first beyond "no internet needed". Field officers/inspectors are mobile users — the persona is missing.
7. **No authN/Z, no audit log, no API docs, no tests, no Dockerfile/CI, no git repo.** The repo has prior QA/security/benchmark reports (`.ai/reports/`) but zero executable tests and isn't even version-controlled. Process maturity scores zero.
8. **Analytics is a screenshot with extra steps.** Static seeds + hardcoded constants; nothing the user does moves a chart. Any judge asking "file an application and show the chart change" ends the illusion.

### What's genuinely good (credit where due)
- One-command offline run (`npm install && npm start`, `start.ps1`) — judging-environment-proof. Keep this property at all costs.
- Coherent 5-minute demo script in README; reset button; Maharashtra-credible seed data (MIDC/MPCB/MSEDCL/PSI-2019/PMEGP ring true).
- Parallel-group UX *communicates the reform* (Day-1 parallel vs sequential) even though no engine backs it.
- Vanilla stack = readable, debuggable live on stage; no build step to fail during judging.

---

## 5. Must-add features — priority order (get selected at any cost)

### P0 — do before facing any technical judge (1–2 days)
1. **Server-side doc validation (kill the forgery).** Reject client `passed` flag; server checks extension/MIME/≤10MB/required-set-per-checklist/expiry-date; unverified uploads stay `verified:false` and never enter vault. Demo the rejection path live — judges love watching red checks.
2. **Demo-grade auth with server enforcement.** Even hardcoded `applicant/demo123` + `officer/officer123` issuing a signed token (or opaque session), middleware rejecting cross-role PATCH/POST. Closes the worst Q&A hole for ~2 hours of work.
3. **Auto-deemed engine.** On read (or 60s timer): any track with `left<0` and status not terminal → `Deemed` + alert + analytics event. Makes the SLA story *true* and gives a killer demo moment (backdate one seed track to show auto-deem).
4. **Input validation + error hygiene.** 400 on empty/unknown checklist profile (fix `criticalDays:null`), whitelist `action` values, cap string lengths. Cheap, removes all crash-demo risk.
5. **Grievance SLA clock + auto-escalation.** `createdAt+7d` evaluated on read; status flips automatically with timeline entry. Makes the "auto-escalates" claim true.

### P1 — finale differentiators (3–5 days, pick ALL if possible, at minimum #6)
6. **ONE real AI feature — non-negotiable.** Cheapest credible options, ranked: (a) TF-IDF-ranked knowledge search over an expanded (~60-article) Maharashtra rule corpus with source citations; (b) OCR on upload via Tesseract.js (expiry-date/name extraction feeding the validator — turns §2.2's mock into the strongest demo in the room); (c) logistic-regression risk scorer trained on the history seeds with shown feature weights. Any one of these lets you say "AI" without lying.
7. **Marathi toggle (EN/MR).** i18n JSON for nav/wizard/tracker + Marathi knowledge answers. Outsized scoring return for ~1 day.
8. **Live-fed analytics.** Pending-track counts, query rates, inspection-combined %, grievance SLAs computed from `db.applications`; keep seeds as "baseline regime" series. Then "file an app → chart moves" works.
9. **Inspection↔track linkage.** Completing an inspection flips linked `Inspection scheduled` tracks to `Under review`; double-booking same slot warns. Removes the dead-code smell.
10. **Dependency-gated parallel engine (light).** Group B/C/D tracks created as `Locked` until predecessors clear, with visible unlock chain. Turns §2.4's label into a defensible mini-engine.

### P2 — engineering credibility (week 2)
11. **SQLite swap** (`better-sqlite3`, single file, still offline): kills race conditions, enables real audit-log table (actor/action/timestamp/immutable), unlocks pagination/search.
12. **Dockerfile + OpenAPI spec + git init + 10 smoke tests** (supertest against the live matrix in §3). Process maturity points.
13. **PWA manifest + responsive pass + accessibility basics** (labels, contrast, keyboard nav) for the mobile/officer-field story.

### P3 — if time remains
14. DigiLocker sandbox stub with API-contract page; SMS-gateway stub (e.g., MSG91 test key) for real alert push; expand seeds to all 36 districts with taluka-level MIDC mapping.

---

## 6. Demo-day survival tips (if judged tomorrow, as-is)
- Never open DevTools yourself; never narrate the words "AI model" — say "rule engine + risk heuristic, ML scorer on the roadmap" (true and safe).
- Force the breach path deliberately: backdate one track's `updatedAt` before the demo so a 🔴 breach + deemed-eligibility alert is visible in the strip.
- Keep `POST /api/reset` one click away; rehearse the 10-step README script verbatim — the narrative is your highest-scoring asset.
- If asked about DigiLocker/auth/scale: answer with the P0/P1 plan and point at the exact file+line ("validator lands in `server.js` documents route, ~20 lines") — judges reward teams that know their gaps cold.

---

## 7. Decision-framework scores (prototype as audited)

| Criterion | Score /5 | Rationale |
|---|---|---|
| Scalable & maintainable | 2 | 1 dep, readable, but file-DB races, no tests, no modular boundaries; concurrent/multi-user unsafe. |
| Follows architecture principles | 2 | No layering (routes+engine+storage in one file), no contracts, trust-boundary violation (client-computed truth). |
| Technical debt impact | 2 | Deliberate demo debt is fine; but forged-truth + static-analytics debt compounds — each new feature built on `passed:true` or seed constants deepens the hole. P0 items are the debt ceiling. |
| Security requirements | 1 | Zero auth, forgeable verification, self-declared actor identity, no headers/rate-limit/sanitization. Worst axis. |
| Team capability to implement P0+P1 | 4 | Small, well-understood codebase; P0 is hours-days, P1-one-AI-feature is days. No exotic stack needed. |

**Recommendation:** **SELECT for internal round on demo strength; CONDITIONAL green-light for finale — conditional on P0 (items 1–5) plus minimum one of P1 item 6 (real AI) and item 7 (Marathi) before the finale.** Without those, expect a technically literate jury to score this below teams with weaker UX but one honest ML component and real auth. Trade-offs accepted if you proceed as-is: you trade integrity/scale credibility for speed-of-demo — the right trade for a college qualifier, the wrong trade for a finale.
