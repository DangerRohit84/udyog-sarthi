# P0 Backend Integrity Fix Report — Udyog Sarthi (SIH-26130)

**Date:** 2026-09-09 · **Agent:** senior-dev · **Scope:** `server.js` (+ minimal `public/app.js` compat) · **Inputs:** `.ai/reports/prototype-audit.md`, `.ai/reports/project-verdict.md`
**Constraint honored:** demo intact — logins `udyog@demo.in/demo123` + `officer@maharashtra.gov.in/officer123`, port `3000`, `start.ps1` untouched, `POST /api/reset` restores seeds, vault verified clean after tests.

---

## 1. What was fixed (5/5 P0 items)

### (1) Server-side doc validation — forgery killed (`POST /api/applications/:id/documents`)
- **Before (`server.js:155-167`):** `verified: !!d.passed`, pushed `d.passed` docs straight to vault, auto-cleared officer `Queried`. Live-proven forgery: `{"name":"forged.pdf","passed":true}` → verified + vault-poisoned.
- **After:** new `validateDocumentInput()` **ignores** client `passed`/`verified`/`checks` entirely. Server computes its own checks:
  1. `name` 1–255 chars, plain filename (no `/\..`), must end `.pdf/.jpg/.jpeg/.png`
  2. `docType` required 2–120 chars
  3. `sizeBytes` (or `sizeKb`/`fileSize`) required, `>0` and `≤10MB`
  4. `mime` validated only if supplied (`application/pdf`, `image/jpeg`, `image/png`)
  5. `expiry`/`expiryDate`/`validUntil` — fails only if supplied and expired/unparseable; missing = pass
  6. `holderName`/`nameOnDoc`/`applicantName` required `>2` chars
- Fail → `422 { error, details, checks, verified:false }`, **nothing stored, vault untouched, query NOT cleared**. Pass → stored `verified:true`, vault append (deduped), first `Queried` track → `Under review`.
- **Poison-vault fix:** vault only accepts server-verified docs. `POST /api/applications` `reusedDocs` now filtered against vault (`vaultNames.has(n)`); unvaulted names silently dropped, never marked verified.
- **Known limit (documented, needs multipart P1):** no real file bytes over JSON — a determined attacker sending plausible `sizeBytes+holderName` passes. True byte/MIME validation requires `multipart/form-data` upload (noted as follow-up; bar raised from 1 field to 3 + extension).

### (2) Demo auth middleware — officer routes locked
- New `POST /api/login` accepts exactly the judging-sheet identities, returns simple opaque tokens:
  - `udyog@demo.in / demo123` → `{ role:"applicant", token:"demo-applicant-token" }`
  - `officer@maharashtra.gov.in / officer123` → `{ role:"officer", token:"demo-officer-token" }`
  - bad creds → `401`.
- `authRole(req)` reads `Authorization: Bearer <token>` (also `x-demo-token`/`x-auth-token` alias). `requireOfficer` → `401` if missing/unknown, `403` if `applicant` token on officer route.
- **Protected:** `PATCH /api/applications/:id/track` (all approve/query/reject/review/inspect/deemed), `PATCH /api/inspections/:id` (confirm), `PATCH /api/grievances/:id` with `action:resolve`. `escalate` stays open (applicant can escalate); reads stay open.
- **Whitelist:** `action ∈ {approve,query,reject,review,inspect,deemed}` else `400`; grievance `action ∈ {escalate,resolve}` else `400`; inspection PATCH allows only `{status,officer,date,slot}` — `Object.assign(i, req.body)` hole closed, unknown field → `400`.
- **Frontend compat (`public/app.js`):** `api()` auto-sends `Bearer` from `localStorage.us_token`; `setRole()` mints matching demo token for one-click landing buttons; `login()` now calls `/api/login` with email+password and stores token; `offAct`/`inspDone` surface `401/403` as alert. No login UX regression.

### (3) Input validation — `criticalDays:null` + all POST bodies
- `matchChecklist`: `Math.max(...[])` → guarded `out.length ? max : 0` (no more `null`).
- `validateChecklistProfile(db,p)`: `sector ∈ db.sectors`, `size ∈ Micro/Small/Medium/Large`, `stage ∈ Establish/Operate/Expand`, `district` if present ∈ `db.districts`, numeric `investmentLakh/workers`. `POST /api/checklist {}` → `400 { error, details }` (was `200 criticalDays:null`).
- `POST /api/applications`: same profile check + `title ≤200`, `applicant ≤100`, `0 items → 400`, `reusedDocs` strings `≤255`.
- `PATCH /track`: `approvalId` required, action whitelist, `remarks ≤2000`, `officer ≤100`.
- `POST /inspections`: `appId` must exist, `depts` non-empty known ids, `date` valid, `slot` 3–50 chars. `POST /grievances`: `dept` known, `subject` 5–300 chars, `appId` if given must exist.

### (4) Auto-deemed + auto-escalation sweeps (cron + on-read)
- **Immutable SLA clock (anti-gaming):** new `track.slaStartedAt` set at filing (`now`), never moved by officer writes. `trackSla()` deadline = `slaStartedAt + slaDays` (fallback `updatedAt` for legacy). Verified: officer `review` leaves `deadline` unchanged (`2026-09-27 → 2026-09-27` PASS).
- **Demo-safe migration:** legacy tracks backfill `slaStartedAt = updatedAt` (not filing), so existing seeds stay green; `Queried` pauses the clock (skipped by sweep, ball in applicant court). Fresh-seed alerts after fix: 1 query + 2 inspections + 1 grievance, zero spurious deemed — query demo narrative preserved.
- **`sweepDeemed(db)`:** any non-terminal, non-queried track with `sla.left<0` → `Deemed` + timestamped remarks. Fires on `GET /applications`, `GET /applications/:id`, `GET /alerts`, any officer track write, plus `setInterval(60s)` background sweep. Forced-breach test (`MSEDCL-PWR` backdated 35d): `Applied → Deemed` on next read PASS; alerts emit `auto-deemed` info.
- **`sweepGrievances(db)`:** `Filed* + age>7d → Escalated to Nodal Officer`, `Nodal + age>14d → Escalated to Secretary (Industries)`, each with timeline entry. Fires on `GET /grievances`, `GET /alerts`, + same 60s interval. Forced test (`GRV-999` filed 8d ago): auto-escalated to Nodal on read PASS.

### (5) Inspection↔track linkage + dead code + filing→tracker
- Removed dead `server.js:179` `(b.depts||[]).forEach(()=>{})`.
- `POST /inspections` → after create, every linked track (`approval.dept ∈ depts`, status `Applied/Under review/Queried`) → `Inspection scheduled` + remarks `[Inspection INSP-x scheduled date slot]`. Verified: fresh `APP-2026-0159/MPCB-CTO` `Applied → Inspection scheduled` on booking PASS. Double-booking (`same date+slot+dept+Scheduled`) returns `warning` field, demo not blocked (verified `INSP-305` warns about `INSP-304`).
- `PATCH /inspections/:id {status:Completed}` (officer-only) → linked `Inspection scheduled` tracks → `Under review` + remarks. Verified `MPCB-CTO → Under review` PASS.
- Filing (`POST /api/applications`) creates tracks with `createdAt+slaStartedAt+updatedAt=now`, status `Applied` — tracker moves immediately; `GET /tracker` + `GET /app/:id` reflect new app (verified `APP-2026-0159`).

---

## 2. Files changed
- `server.js` — all 5 P0 fixes + `POST /api/login` + sweeps + whitelists. (Note: file also contains a parallel P1 TF-IDF knowledge-search + live-analytics block added by a concurrent agent — left intact, not touched by this fix.)
- `public/app.js` — `api()` Bearer header + throw-on-`!ok`, `doLogin()`, `setRole()` token minting, `login()` credential form wired to `/api/login`, `validateUpload()` sends `{name,docType,sizeBytes,mime,expiry,holderName}` (no `passed`), `offAct`/`inspDone` 401 alerts.
- **Untouched:** `start.ps1`, `package.json` (still 1 dep `express`), `data/seed.js`, port `3000`. `data/db.json` reset to seed after tests.

## 3. Verification (node --check + live curl, port 3000)
- `node --check server.js / public/app.js` → OK ×2.
- `POST /api/login` applicant/officer → `200 {role,token}` PASS; bad creds → `401` PASS.
- `POST /api/checklist {}` → `400` (was `200 null`) PASS; unknown sector → `400` PASS; valid Food/Nashik/Small/Establish → `200` PASS.
- `POST …/documents {"name":"forged.pdf","passed":true}` → `422 verified:false` PASS (was `200 verified:true`); `+checks+verified` forgery → `422` PASS; `evil.exe` → `422` PASS; `20MB` → `422` PASS; `expiry 2020-01-01` → `422` PASS; valid `{Compliance Report.pdf,sizeBytes,mime,holderName}` → `200` + vault append PASS; vault contains valid, **not** forged/evil/big PASS.
- `PATCH …/track` no token → `401` PASS; applicant token → `403` PASS; bad `action:hack` + officer token → `400` PASS; valid `query` + officer token → `200` PASS.
- `PATCH /api/inspections/INSP-301` no token → `401` PASS; illegal field `appId` → `400` PASS; unknown dept booking → `400` PASS; bad grievance subject/action → `400` PASS; grievance `resolve` no token → `401` PASS.
- Filing `POST /api/applications` IT-Micro-Operate → `APP-2026-0159 Green 28` PASS; bad profile → `400` PASS; booking → `201` + tracker `Inspection scheduled` PASS; complete (officer token) → tracker `Under review` PASS; double-book → `warning` PASS.
- Sweeps: backdated `FIRE-FINAL` → `Deemed` on read PASS; `GRV-999` 8d → `Nodal` PASS; officer `review` deadline immutable PASS; fresh-seed alerts healthy (no spurious deemed) PASS.
- Cleanup: `POST /api/reset` → `{ok:true}`, vault = 3 seeds, `GET /api/health {ok:true}` PASS.

## 4. Blockers / risks
- None blocking. Two honest limits: (a) JSON-only docs — true byte/MIME proof needs `multipart` upload (P1); (b) tokens are static demo strings, no expiry/signing — flagged in code as demo-grade, sufficient to close the anonymous-curl hole without adding a session store.
- Concurrent P1 edits to `server.js` (TF-IDF + live analytics) were preserved; future merges should keep P0 blocks (`DEMO_USERS` → sweeps → `/api/login`) intact.

## 5. Demo script (30s judge-proof)
1. `POST /api/checklist {}` → show `400` (was `null`). 2. Forged `passed:true` → show `422` red checks. 3. Officer `PATCH` without token → `401`, then `POST /api/login` officer → retry → `200`. 4. Backdate one track (or wait for breach) → reload tracker → `Deemed` + alert. Say: “rule engine + risk heuristic, TF-IDF retrieval live, ML scorer on roadmap” — never “AI model”.
