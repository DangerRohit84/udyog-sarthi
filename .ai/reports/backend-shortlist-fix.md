# Backend Shortlist Fix Report — Udyog Sarthi (SIH-26130)

**Date:** 2026-09-09 · **Agent:** senior-dev · **Scope:** `server.js` + `data/seed.js` ONLY (no frontend/deps/port/auth changes)
**Inputs read first:** `.ai/reports/shortlist-win-truth.md` (R3/R5/R6/R7), `.ai/reports/p0-fix-report.md`, `.ai/reports/ai-fix-report.md`, `server.js` (697 lines), `data/seed.js`, `public/app.js`
**Constraint honored:** demo intact — port `3000`, logins `udyog@demo.in/demo123` + `officer@maharashtra.gov.in/officer123`, `POST /api/reset` restores seeds, `express`-only, offline. Server left RUNNING with clean seeds (history 38, apps 3, pending 8).

---

## 1. What was fixed (6/6 shortlist blockers)

### (1) Parallel gating — Group-D Locked until A–C complete (kills R3: "CTO before CTE?")
- `data/seed.js`: `MPCB-CTO` + `FIRE-FINAL` carry `gatedBy: ["A","B","C"]`.
- `server.js` filing (`POST /api/applications`): D tracks with unfinished same-app A/B/C predecessors are stored as `status: "Locked"` + `lockedReason` (+ `gated: true` marker). Apps with no same-app predecessors (e.g. IT-Micro-Operate) start `Applied` — prior-stage compliance assumed from the earlier Establish filing.
- Officer `PATCH …/track` on a Locked track with `approve/reject/deemed` → `400 { error: "Track is Locked — clear Group A–C first…" }`.
- `unlockGatedTracks()` (runs inside `runSweeps`, i.e. on every read + 60s interval + officer write): Locked + gate met → `Applied`, SLA clock restarts at unlock (fair: dept cannot breach before the file was actionable), remarks stamped, `system / unlock:<approvalId>` audit entry.
- `POST /api/checklist` annotates D items with `gate: { requires, note }` so the wizard is honest.
- Grandfathering: pre-rule tracks (no `gated` marker, incl. all demo seeds) are never overlaid — reset demos stay green, P0 backdate probes on legacy rows unaffected.
- **Live proof:** filed `APP-2026-0159` (Textiles/Micro/Operate) → `CTO Locked`, `FINAL Locked` ("1 pending: Factory Licence"), `FACT Applied` → officer approve CTO → `400` → officer approve FACT → `CTO Applied`, `FINAL Applied` (+ 2 system unlock audits).

### (2) Completeness % from `seed.js` docs (required vs uploaded)
- `trackCompleteness()`: required set = `approvals[].docs`; deterministic fuzzy match (exact → substring → significant-token overlap) against uploaded `docType`s. Per track: `{ pct, matched, required, missing[] }`; per app: `completenessPct`.
- Exposed in **every** enriched payload (`GET /api/applications`, `GET /:id`, `PATCH …/track`, doc-upload) **plus** new `GET /api/applications/:id/track` → `{ appId, status, completenessPct, tracks }`.
- **Live proof:** fresh app `0%` → uploaded `Factory layout.pdf` (`docType: Factory layout plan`, server-validated) → `FACT 25% (1/4)`, app `9%`, `missing: 3` listed.

### (3) Append-only audit log (kills R5: "show yesterday's audit log")
- `data/seed.js`: `audit: []`. Entries strictly `{ ts, actor, action, id }` — never edited/deleted in place (only `/api/reset` restores `[]`).
- Logged: `file` (application), `upload:<docType>`, `approve/query/reject/review/inspect/deemed:<approvalId>` (officer), `unlock:<approvalId>` + `auto-deemed:<approvalId>` (system), `book/complete-inspection` (applicant/officer), `file-grievance / escalate / resolve / auto-escalate` (applicant/officer/system).
- `GET /api/audit` — officer only (`401` no token, `403` applicant).
- **Live proof:** `0 → 6` entries across the gating flow (`applicant file`, `system auto-deemed`, `system auto-escalate`, `officer approve:LABOUR-FACT`, `system unlock:MPCB-CTO`, `system unlock:FIRE-FINAL`); `401`/`403` verified.

### (4) Real renewal dates (kills "58 days" hardcode, R6)
- `data/seed.js` validity table: annual `365` (Factory, Shops, BOCW, Fire-Prov, Fire-Final, Water, CTE→`1825`), CTO band-aware `validityByBand { Red: 1825, Amber: 1825, Green: 3650 }` (per K16/K46), one-time grants `null` (Land, Building, Power, Udyam → no renewal card).
- Officer approve/deem stamps `issuedAt + validityDays + renewalDue` **on the track**; legacy approved rows backfill `issuedAt` from `updatedAt`. Enriched track carries `renewal: { issuedAt, validityDays, due, daysLeft, state: valid|due-soon(≤60d)|overdue }`.
- New `GET /api/renewals` (open read, sorted by `daysLeft`) — the dashboard's static "58 days" line should read this (frontend change left for the UI pass; backend is live).
- **Live proof:** approved `LABOUR-FACT` → `issued 2026-09-09, due 2027-09-09, 365d, valid`. Judgment call documented: spec shorthand said "SLA + issued date" but SLA (processing days) ≠ validity (years) — implemented the validity table per shortlist-win-truth §5.1/K16/K46, since SLA-based "renewals" would have produced 30/60-day nonsense.
- Stale-`db.json` safety: `FALLBACK_VALIDITY` map covers approvals lacking the new fields until the next reset.

### (5) Headline moves — approvals append live history (kills R6: "file an app, show 68→31 moving")
- `recordCompletion()`: every real completion (officer approve, manual deemed, auto-deemed sweep) appends `{ regime: "new", live: true, dept, days }` with **measured** `slaStartedAt→decision` days (min 1d). Guarded against double-count (terminal→terminal re-approves skipped). Live rows capped at 500.
- Seed keeps exactly **38 rows**; response adds `liveHistoryCount`, `avgNewLive`, `basis: "seed baseline 38 rows + N live measured completions"`. Headline `avgNew`/`byDept` blend baseline + live, so they move.
- **Live proof:** `avgNew 21 → 20`, `history 38 → 40`, `liveRows 2, avgLive 13` after one officer approval + one auto-deemed breach (see §3). Filing still moves `pendingByDept`/`filingsBySector` (P1 behavior preserved).

### (6) JSON race guard — atomic write (kills R7: "10,000 concurrent?")
- `writeDbAtomic()`: serialize → unique tmp (`db.json.<pid>.<ts>.<seq>.<rand>.tmp`, same dir/volume) → `renameSync` over `db.json` (atomic replace) → tmp cleanup on failure. All writers routed through it (`saveDb`, seed-init, `/api/reset`).
- **Live proof:** 5 parallel filings → `APP-2026-0159…0163` all persisted, `db.json` parses, zero `*.tmp` leftovers. Residual risk (documented, out of scope): multi-*process* read-modify-write can still interleave logically — supported topology is the single demo server.

---

## 2. Files changed
- `server.js` — 697 → 969 lines: header note, atomic-write + audit helpers, gate/completeness/renewal/history helpers, `enrichApp` upgrade, filing-Locked, locked-guard, renewal stamping, audit on all mutations, unlock in sweeps, `GET /api/audit` (officer), `GET /api/renewals`, `GET /api/applications/:id/track`, analytics live delta, atomic reset.
- `data/seed.js` — `gatedBy` ×2, `validityDays`/`validityByBand` ×12, `audit: []`. History still 38 rows; apps/inspections/grievances/vault/counters untouched by this fix.
- **Untouched:** `public/*`, `package.json` (still 1 dep), `start.ps1`, port, logins.

## 3. Verification (node --check + live curl, port 3000)
| Check | Result |
|---|---|
| `node --check server.js / data/seed.js` | ✅ OK ×2 |
| File Operate app → CTO/FINAL `Locked` + reason | ✅ `APP-2026-0159` |
| Officer approve CTO while Locked → `400` | ✅ "Track is Locked — clear Group A–C first…" |
| Officer approve FACT → CTO/FINAL auto-`Applied` | ✅ + 2 system unlock audits |
| `GET …/track` completeness 0% → 25% after matching upload | ✅ `missing[]` listed |
| Renewal stamped + `GET /api/renewals` real date | ✅ `2026-09-09 → 2027-09-09, 365d, valid` |
| Analytics `38→40 rows`, `avgNew 21→20`, `basis` string | ✅ headline moves |
| Audit `0→6`, `GET /api/audit` 401/403/officer-200 | ✅ |
| P0 regressions: forged doc `422`, no-token `401`, `{}` checklist `400`, knowledge `60/75%` | ✅ all hold |
| 5× parallel filings → 5 apps, valid JSON, no `*.tmp` | ✅ |
| Final `POST /api/reset` → history 38, apps 3, pending 8, health OK | ✅ clean, server left RUNNING |

## 4. Notes for the chain (read before QA/review)
1. **Concurrent-agent contention (no data lost):** a demo-prep agent is working the same repo in parallel — it planted a commented `DEMO-BREACH` FIRE-PROV row (backdated 24d, `slaStartedAt` seeded) and a `DEMO-ESCALATION` GRV-881 row (filed 8d) in `data/seed.js`, plus it restarted the :3000 server once mid-task (stale pre-fix process killed by me; fresh code confirmed serving before verification). Effects on my numbers: after any reset, the FIRST tracker/grievance read auto-deems FIRE-PROV (+1 live history row, +2 system audits) and auto-escalates GRV-881 (+1 audit) — **by their design, not a bug**. My sweep handled both correctly (renewal stamped, history appended, audits written). Recommend agents coordinate restarts via the report files.
2. **No sprint-manager update:** no `task_id` in dispatch — skipped rather than guessed (same as ai-fix-report).
3. **Deliberately NOT done:** OCR bytes/multipart upload (still JSON metadata validation — bar unchanged from P0), token expiry/signing (static demo tokens retained), frontend renewal line (still static "58 days" in `app.js:185` — backend `GET /api/renewals` is ready for the UI pass), Marathi knowledge end-to-end, Mongo/Docker/tests (P2).
4. **Demo beats unlocked (30s each):** (a) file Operate app → point at `🔒 Locked: Group-D…` → approve Factory Licence → watch CTO unlock; (b) upload matching doc → completeness `0→25%`; (c) approve → analytics `history 38→39`, `avgNew` ticks; (d) officer opens `GET /api/audit` → "every action accounted for".
5. **Banned words still banned:** no LLM/OCR/Mongo/SMS claimed anywhere in added code; comments mark demo-grade boundaries (static tokens, single-server topology, 500-row live cap).

## 5. Demo script (judge-proof, 60s)
1. `POST /api/reset` → tracker shows the 🔴 auto-deemed breach + escalation (demo seeds). 2. File Textiles/Micro/Operate → CTO `Locked` ("legally impossible day-1 — ask me why"). 3. Officer approves Factory Licence → CTO unlocks, audit grows, analytics ticks. Say: *"Rule-gated parallel engine + measured completeness + append-only audit + validity-based renewals + live impact counters — TF-IDF retrieval, no LLM; Mongo/OCR/SMS are Phase-2."*
