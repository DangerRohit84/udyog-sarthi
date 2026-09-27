# Udyog Sarthi — SIH Problem Statement ID 26130

**Unified, intelligent approval & compliance management platform for Government of Maharashtra.**
Theme: *Efficiency in streamlining industrial approvals, compliance processes, and access to government support services.*
Stack: **vanilla JS + Express, port 3000, offline, 1 dep (`express` only).**

> **Honesty first (shortlist-safe):** every number below marked `*Seed projection` is an illustrative file-backed baseline, **not measured pilot data**. LIVE counters move with filings; SEED headlines do not. No LLM, no Mongo, no OCR claimed as built — see *What is real*.

## Run (one command after install)

```bash
cd udyog-sarthi
npm install
npm start
```

Open **http://localhost:3000** (if `localhost` fails on IPv6-broken halls, use **http://127.0.0.1:3000** — same server, port 3000).

> No build step, no database server, no internet needed. All data persists in `data/db.json` (JSON file storage). Works fully offline — ideal for SIH judging.

### Windows one-click

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Checks Node.js is installed, runs `npm install` if `node_modules` is missing, opens **http://localhost:3000** in your browser, then runs `npm start`.

## Demo credentials (server-verified via POST /api/login → 64-hex session token, 12h)

| Role | Email | Password | Sees |
|---|---|---|---|
| Entrepreneur (Applicant) | `udyog@demo.in` | `demo123` | Dashboard, checklist wizard, tracker, vault, schemes, grievances |
| Department Officer | `officer@maharashtra.gov.in` | `officer123` | Dept-wise pendency queue, approve/query actions, inspection confirmations |

Landing *Continue as Applicant / Officer* buttons route to `#/login` with role prefilled (no guest minting). `POST /api/login` mints a 64-hex session token (`SHA256(email:random:time)`, `expiresAt` +12h, stored in `db.sessions[]` capped 200). Officer API calls send `Authorization: Bearer <session-token>`; fixed `demo-officer-token` / `demo-applicant-token` are retired → `401` (`server.js:76-77`); missing/expired → `401`, wrong role → `403`; 5 failed logins /15min/IP → `429`. Header Switch calls `POST /api/logout` (real logout).

## What is real (no bluff words on stage)

- **60-article TF-IDF knowledge search — P@1 measured, no LLM.** `GET/POST /api/knowledge/search?q=` ranks K01–K60 with TF-IDF cosine + tag boost; `GET /api/knowledge/eval` shows the measured n=32 hand-labelled eval (original 8 kept + 24 Hinglish/typo/single-keyword/Marathi-fail/near-synonym, n=32 correct=19 acc 0.594 ungamed including K40-vs-K03 + K23-vs-K22). UI `#/knowledge` shows scores + matched terms + details[] q/expect/got/hit + tookMs + Top-4 misses box (of N live misses, full table above) + `n>=30 hand-labelled overfit illustrative TF-IDF cosine no embeddings no LLM` label. Zero new deps, offline.
- **Server-side doc validation — 422 on forgery.** `POST /api/applications/:id/documents` ignores client `passed`/`verified` and re-checks extension (pdf/jpg/png), `sizeBytes ≤10 MB`, expiry, `holderName`. Fail → `422 {details, checks, verified:false}`, nothing stored, vault untouched, query not cleared. Try `{"name":"forged.pdf","passed":true}` → `422`.
- **Auto-deemed + auto-escalation sweeps.** Immutable `slaStartedAt` clock (officer touches never move deadline) + 60-sec background + on-read sweeps: breached track → `Deemed`, `Filed (7-day SLA)` + 7d → `Nodal Officer` → +14d → `Secretary`. Backdated demo seeds fire on first read after reset (see DEMO_SCRIPT.md).
- **Inspection↔track linkage.** Booking flips linked tracks → `Inspection scheduled`; completing flips → `Under review`; double-book returns `warning` (demo not blocked).
- **Input validation.** `POST /api/checklist {}` → `400` (was `null`); unknown sector/district, bad dates, unknown depts all `400` with details.
- **EN/MR toggle — 160 keys EN+MR, zero blanks, persists.** Header `मराठी/English` button, `localStorage.us_lang`, wizard + tracker + buttons fully Marathi (Devanagari verified 2026-09-27, 160/160 blanks 0). Knowledge articles/schemes/officer remarks stay English (roadmap: top-20 human-translated first).
- **JSON pilot store → Postgres roadmap.** Today: sync JSON read-modify-write in `data/db.json` (fine for single-laptop demo, races at 10k concurrent — say so). Phase-2: Postgres + Prisma (`approvals`, `tracks` with `slaStartedAt`, append-only `audit[]`, `documents` with byte hashes), Redis idempotency keys, S3 file bytes + Tesseract.js OCR feeding the validator, capped LLM for cited-answers-only (human-in-loop, no legal advice without source).

## Numbers — all *Seed projection until pilot measures

- **Avg approval time 60 → 21 days*** (`*Seed projection` from 38-row `data/seed.js` history: 20 old + 18 new). Old README said 68 → 31 — corrected to computed 60 → 21. Pilot (Sinnar MIDC × 3 approvals × 20 users × 4 weeks, owner letter pending) to measure real before/after.
- **Incomplete applications 41% → 12%*** (`*Seed projection`, same baseline). Mechanism is real (pre-validation catches queries before filing); percentage is illustrative.
- **🔴 LIVE vs 🌱 SEED in UI:** landing + analytics label every card. LIVE (filings, pending tracks, query rate, combined-%, `ch3` pending-by-dept, plus `avgNewLive`/`liveHistoryCount`) moves with every `POST /api/applications` + officer approve/deem. SEED headlines (`avgOld=60 avgNew=21` over frozen 38 rows) + `ch1/ch2` do not — `GET /api/analytics` excludes `live:true` rows from `avgNew`/`byDept` and reports live separately as `avgNewLive`/`liveHistoryCount` + `seedHistoryCount` + `basis` string (`server.js:1546-1582`). Filing an app and watching LIVE move is the demo beat — never claim the SEED headline moved.
- **Banned until built:** `AI model, LLM/RAG running, OCR working, MongoDB running, measured 68→31, DigiLocker live, SMS/push sent, parallel engine`. Honest script: *“Rule engine + TF-IDF retrieval (no LLM) + metadata validation (422) + SLA sweeps + live counters; Mongo/OCR/SMS/MAITRI-API are Phase-2 — here are file+line + roadmap.”* Point at `server.js:534` (validator `validateDocumentInput`), `:770` (sweeps `runSweeps`: `sweepDeemed:704` + `sweepGrievances:745`), `:797` (TF-IDF `tfidfSearch`; corpus `:785` eval `:866` localize `:880`), search/eval endpoints `:1092-1120`, analytics SEED/LIVE `:1546` (verified 2026-09-27 via grep server.js).

## Shortlist demo script (2-min + 60-sec in DEMO_SCRIPT.md)

**3-click core (rehearse verbatim):**
1. **Wizard (`#/wizard`)** — defaults already *Food Processing → Nashik (Sinnar MIDC) → Small → Establish* → Next → Generate → `9 approvals · critical path 45d` → **File all as one application** → `APP-2026-0xx` opens.
2. **Tracker (`#/tracker` → `#/app/APP-2026-0157`)** — after `POST /api/reset?demo=1`, open Deccan Auto Components Plant → **FIRE-PROV shows `Deemed`** (backdated 24d vs 21d SLA, auto-deemed on read) + alertstrip `auto-deemed` info. Book a combined inspection → tracks flip to `Inspection scheduled`.
3. **Officer (`#/officer`, login `officer@maharashtra.gov.in` / `officer123`, queue MPCB)** — Query one track with remarks → applicant tracker shows `Queried`; Approve another → `Approved`. Confirm inspection → linked tracks → `Under review`.

**Plus:** backdated breach (above) + **MR toggle** (header `मराठी` → wizard shows `चेकलिस्ट जनरेटर विझार्ड` → reload persists `localStorage.us_lang==="mr"`) + **Grievance** (`#/grievances` → GRV-881 filed 8d ago auto-escalated to Nodal on read) + **Reset** (footer *Reset demo data* → `apps=3, history=38, corpus=60` clean). Full clicks + logins + QR/port in `DEMO_SCRIPT.md`.

## Seeded Maharashtra data (reset-clean)

- **6 departments:** MIDC, MPCB, Labour (Factory Directorate), Fire Services, MSEDCL (DISCOM), Directorate of Industries
- **12 approvals** with real-style fees, SLA days, documents, parallel groups (A day-1 / B after-land / C alongside-construction / D pre-production), inspection flags
- **6 schemes/incentives:** PSI-2019, IT/ITES Policy 2023, Textile Policy, EV Policy, Single-Window fee waiver, PMEGP-linked interest subsidy
- **60-article regulatory knowledge base (K01–K60**, each `Illustrative — confirm` source), risk-scoring heuristic v0 (weights visible, ML scorer roadmap), **3 demo applications**, **38 history rows** (`historyCount` exposed), 2 inspections (1 combined), 2 grievances (1 backdated Filed → Nodal demo, 1 Resolved), 3 vault filename records (bytes/API roadmap)
- `POST /api/reset?demo=1` restores exactly this: `apps=3, history=38, corpus=60` + backdated FIRE-PROV (24d) + Filed GRV-881 (8d) ready to auto-fire on next read.

## API (Express, JSON file storage in `data/db.json`)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/login` | demo login `{email,password}` → `{role,token,expiresAt}` (401 on bad creds, 429 after 5 fails/15min/IP) |
| GET | `/api/meta` | departments, approvals, schemes, knowledge |
| POST | `/api/checklist` | generate customised checklist `{sector,district,midc,size,stage}` (400 on bad profile) |
| POST | `/api/schemes/match` | eligibility + est. benefit |
| GET/POST | `/api/applications` | list (sweeps run) / create from checklist (400 on bad profile) |
| GET | `/api/applications/:id` | detail with SLA + risk + alerts (sweeps run) |
| PATCH | `/api/applications/:id/track` | **officer-only** `{approvalId,action,remarks}` (401/403/400 whitelisted) |
| POST | `/api/applications/:id/documents` | attach doc, **server validates, 422 on fail** |
| GET | `/api/vault` | verified filename records |
| GET/POST | `/api/inspections` | slots / book (links tracks, warns double-book) |
| PATCH | `/api/inspections/:id` | **officer-only** confirm/complete (links tracks) |
| GET/POST | `/api/grievances` | list (sweeps run) / raise |
| PATCH | `/api/grievances/:id` | escalate (open) / resolve (**officer-only**) |
| GET | `/api/knowledge/search` | TF-IDF ranked search `?q=&limit=` + eval strip |
| GET | `/api/knowledge/eval` | measured P@1 detail (n>=30 hand-labelled, details[] q/expect/got/hit + tookMs) |
| GET | `/api/alerts` | breaches, queries, deemed, inspections, grievances |
| GET | `/api/analytics` | 🌱 SEED frozen (`avgOld`/`avgNew`, `seedHistoryCount`, 38 rows) + 🔴 LIVE (`avgNewLive`/`liveHistoryCount`, `filingsBySector`, `pendingByDept`, `queryRate`, `combinedInspectionPct`, `basis`) |
| POST | `/api/reset?demo=1` | restore seed data (`{ok:true}`) |
| GET | `/api/health` | `{ok:true, app, sih}` |

## Files

```
udyog-sarthi/
├── server.js          # Express API + static hosting + SLA/risk/eligibility/TF-IDF engine
├── data/seed.js       # All Maharashtra seed data (repo copy; DEMO-BREACH + DEMO-ESCALATION rows marked)
├── data/db.json       # Runtime DB (auto-created from seed on first run; POST /api/reset restores)
├── public/index.html  # All views (hash-routed SPA shell)
├── public/styles.css  # Maharashtra-theme UI (saffron/navy), responsive
├── public/app.js      # Router, wizard, tracker, officer, charts (vanilla canvas) + LIVE/SEED labels
├── public/i18n.json   # 160 keys × EN/MR, zero blanks (header + wizard + tracker + login/dashboard/docs/officer, verified 2026-09-27)
├── DEMO_SCRIPT.md     # 60-sec + 2-min judging scripts (clicks + logins + QR/port + reset)
└── .ai/reports/       # qa / p0-fix / ai-fix / shortlist-win-truth / demo-ready reports
```

## Implementation reports

- `.ai/reports/shortlist-win-truth.md` — brutal-truth review (odds + kill-shots + tonight checklist). Read before stage.
- `.ai/reports/ai-fix-report.md` — TF-IDF + live analytics + i18n build log.
- `.ai/reports/p0-fix-report.md` — validation/auth/sweeps/linkage proofs.
- `.ai/reports/demo-ready-report.md` — this demo-ready pass (seeds + honesty + verification).
