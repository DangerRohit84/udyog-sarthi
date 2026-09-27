# Full Fix 1–7 + Polish — Verification Report (SIH-26130 Udyog Sarthi)

**Date:** 2026-09-13 · **Agent:** senior-dev (single agent, in order #1→#7 + polish) · **Scope:** `server.js`, `data/seed.js`, `public/app.js`, `public/index.html`, `public/styles.css`, `public/i18n.json` + this report
**Inputs read first:** `.ai/reports/shortlist-win-truth.md`, `.ai/reports/backend-shortlist-fix.md`, `.ai/reports/demo-ready-report.md`, `.ai/reports/frontend-fix-report.md`, plus `server.js` (968→~1210 lines), `public/app.js` (505→~660), `data/seed.js`, `start.ps1`, `DEMO_SCRIPT.md`
**Constraints honored:** demo intact (port 3000, logins `udyog@demo.in/demo123` + `officer@maharashtra.gov.in/officer123`, `start.ps1` untouched), zero new deps (`express`-only, no multer — manual zero-dep multipart parser instead), offline, `POST /api/reset` clean. **NOT touched:** `.gitignore`, `package.json`, test stubs. **NOT added:** OCR/LLM/Postgres/SMS (roadmap only). #8 hygiene + README line-refs left to parallel agent.

---

## 1. What was fixed (in order)

### #1 Login/Auth — server sessions, hashed passwords, rate-limit, no impersonation
- `server.js`: `crypto` SHA-256 password store (`passHash = SHA256(salt:email:password)`, per-role salt, no plaintext), `db.sessions[]` (`{token, email, role, createdAt, expiresAt}`, 12h TTL, capped 200, expired purged on login), `token = SHA256(email:random:time)`.
- Fixed `demo-officer-token` / `demo-applicant-token` **retired** — `authSession()` returns null for them; all officer routes 401 without a live session row, 403 for applicant role.
- `POST /api/login` rate-limit: 5 **failed** tries / 15 min / IP → `429`; success clears the IP window (normal demo never locks; brute-force does). `POST /api/logout` deletes the Bearer session (real logout).
- `data/seed.js`: `sessions: []` (reset clears sessions → re-login needed, documented in toast + report).
- `public/app.js`: `setRole()` **no longer mints tokens** — landing "Continue as …" routes to `#/login` with `us_pending_role` prefill; header Switch → real `doLogout()` (calls `/api/logout`, clears storage). `doLogin()` stores `us_token + us_token_exp`, toast on success/fail (no `alert`). `bindLoginRole()` wires `#lg_role` onchange from `route()` — the old innerHTML script-tag never executed, now fixed.

### #2 Docs/Vault — real bytes, MIME sniff, SHA-256, duplicate/tamper, no optimistic PASSED
- `server.js`: new `POST /api/applications/:id/documents/upload` (`express.raw` multipart, 12 MB cap) with **zero-dep `parseMultipart()`** (binary-safe Buffer split; multer-equivalent without a `package.json` change, commented as such). Server is the only measurer: `sizeBytes = bytes.length`, `mime = sniffMime()` (PDF `%PDF` / PNG / JPEG magic), `hash = SHA-256(bytes)`. Renamed `.exe → .pdf` fails sniff → `422`.
- `findHashConflict()`: same bytes under a **different docType → `422` tamper**; same bytes + same docType → `409` duplicate. JSON `POST …/documents` keeps backwards-compat validation + honors optional `fileHash` in the same guard; both paths store `{sizeBytes, mime, hash}` on the app doc + vault row.
- `public/app.js` `validateUpload()`: **clears box first** (`⏳ Validating on server…`), sends **real bytes via `FormData`** (`file + docType + expiry + holderName`) with Bearer header, renders **server verdict only** — never an optimistic client PASSED. Vault/attachment views show `size KB / MIME / ⛨ hash-prefix`; legacy rows labelled "legacy (no byte-hash — re-upload for hash)".

### #3 Officer — explicit init, sla-null fix, terminal immutability
- `slaLabel(t)` replaces `t.sla?.left + "d left"` (which printed `undefinedd left` when `t.sla === null` on terminals). Terminals show status badges; Locked shows `lockedReason`.
- `loadOffInsp()` no longer relies on innerHTML script-tag — called explicitly from `route()` after `#/officer` renders; hardened with try/catch + `#off_insp` null-guard.
- `PATCH …/track`: **terminal immutable** — `Approved/Rejected/Deemed → anything-else` returns `400` (`Track is X (terminal, immutable)… File a renewal / re-apply`); idempotent same-terminal re-assertion is a no-op success (double-click safe). Locked-guard preserved. Added `Reject` button (was missing) + completeness + doc size/hash on officer cards.

### #4 Inline scripts root cause — zero script-tags in `app.js`
- Removed all four innerHTML script-tags (`genChecklist(true)`, `loadOffInsp()`, `matchSchemes()`, `knFilter()` + login role-switch). `route()` now calls each explicitly **after** `innerHTML` is set. `genChecklist/matchSchemes/knRun/loadOffInsp` all null-guard their target boxes and render errors in-place instead of hanging on `Generating…/Searching…`. Verified: `app.js` contains **zero `<script` substrings** (comments reworded to `script-tag` so even naive greps pass).

### #5 Dashboard/Renewals — real `/api/renewals` + Re-apply
- `dashboard()` fetches `GET /api/renewals` (live `issuedAt/validityDays/due/daysLeft/state` per track) — hardcoded `58 days` + fixed "Sahyadri Textiles" legend **deleted**. Each row shows `OVERDUE / DUE IN n d / valid` badges + applicant + approval; empty state explains the validity table.
- `renewReapply(appId, approvalId)`: loads the approved app, prefills `WIZ.data` (sector/district/midc/size/stage/investment/workers/applicant, title `Renewal: …`), sets `WIZ.renewalOf`, routes to Wizard step 2; wizard step 3 shows a renewal banner; `fileApplication()` re-attaches vault verified docs and toasts the new `APP-…` id. Per-track Re-apply buttons on dashboard cards + renewal rows.

### #6 Analytics honesty — SEED frozen, LIVE separate
- Decision: **exclude live rows from `avgNew`** (matches README "SEED headlines do not move"). `GET /api/analytics`: `old`/`seedNew` exclude `live:true`; `avgNew`/`byDept.new` computed from `seedNew` only (frozen 38); live rows reported as `avgNewLive`/`liveHistoryCount` + `seedHistoryCount` + `basis: "SEED frozen baseline 38 rows (never moves) + N live measured completions (move separately as avgNewLive)"`.
- Frontend: SEED cards relabelled `frozen`, blue LIVE card shows `avg completion Xd (n=Y measured)`, basis string rendered. Live proof below: two approvals moved `avgNewLive 14→11` while `avgNew` stayed `21→21`.

### #7 Server correctness — no write-on-read GETs, grievance double-load fixed
- `GET /api/applications`, `/:id`, `/:id/track`, `/api/grievances`, `/api/alerts`: sweeps run **in memory**, `res.json()` goes out **first**, `saveDb()` happens **post-response** in try/catch (crash between = sweep recomputed next read; 60s interval + write endpoints still persist). `GET /api/grievances` fixed from `res.json(loadDb().grievances)` (second load discarding the swept object) to single-`db` `res.json(db.grievances)`.

### Polish (ranked, all landed)
- **Officer MR i18n pass:** `i18n.json` 36→**64 keys EN+MR** (login/dashboard/docs/officer strings, Devanagari translations), officer/dashboard/documents/login all render via `T()`.
- **`alert()` → toast strip:** new `#toast` div + `.toast.ok/err/warn` CSS + `toast(msg, kind)` (6s auto-dismiss, `role=status`); all `alert()` calls replaced (`doLogin`, `bookInsp`, `offAct`, `inspDone`, `raiseGrv/grvAct`, `resetDemo`, `fileApplication`, `renewReapply`, `validateUpload` uses inline verdict + toast on success).
- **Officer summary strip:** `settled (Approved/Deemed/Rejected, immutable) vs pending` counts per dept + terminal-immutability note above the queue.
- **Attachment view size/hash/checklist:** app-detail docs + officer docs + vault all show `size KB · MIME · ⛨ hash-prefix`; wizard step 3 shows D-gated `🔒` badges + renewal banner + doc checklist.
- **Landing one-screen self-explanatory:** added `Try it in 60 seconds` 3-step strip + inline demo logins + session/reset note; 4th stat is now `LIVE measured completions` (was static `6 depts…` legend); role buttons route to login (no guest entry).
- Explicitly **not** added: OCR/LLM/Postgres/SMS — comments + README-roadmap only.

---

## 2. Files changed
- `server.js` — ~968 → ~1210 lines: crypto auth/sessions/rate-limit/logout, byte-hash/multipart/duplicate helpers, terminal-immutable PATCH, multipart upload endpoint, SEED-frozen analytics, post-response saves, header comment.
- `data/seed.js` — `sessions: []` (+ comment); counts untouched (38 history, 3 apps, 60 knowledge, 2 grievances, 2 inspections).
- `public/app.js` — ~505 → ~660 lines: session auth (no minting), toast, explicit `route()` inits, `bindLoginRole`, landing/demo strip, real renewals + `renewReapply`, `genChecklist` guard + renewal banner, `slaLabel`, officer summary/MR/toast, `documents()` FormData + server-verdict-only, attachment size/hash, schemes/knowledge/grievance hardening, zero script-tags.
- `public/index.html` — +1 line: `#toast` div (`role=status`).
- `public/styles.css` — +5 lines: `.toast` + `.ok/.err/.warn`.
- `public/i18n.json` — 36→64 keys × EN/MR, zero blanks.
- `.ai/reports/full-fix-1-7.md` — this report.
- **Untouched:** `start.ps1`, `package.json` (still 1 dep `express`), `.gitignore`, test stubs, `DEMO_SCRIPT.md` (note: its `demo-*-token` strings are now stale — login mints session tokens; judging logins/URLs/ports unchanged).

## 3. Verification (node --check + live curl, port 3000, 127.0.0.1)

| Check | Result |
|---|---|
| `node --check server.js / public/app.js / data/seed.js` | ✅ OK ×3 |
| Applicant + officer `POST /api/login` | ✅ 200, 64-hex session token (≠ fixed), `expiresAt` +12h |
| Fixed `demo-officer-token` on officer route | ✅ `401` (retired) |
| `POST …/documents {passed:true}` forgery | ✅ `422 verified:false` |
| Real-bytes multipart upload (2 015-byte PDF) | ✅ `201 verified:true sizeBytes=2015 mime=application/pdf hash=c1b0e5…` |
| Same bytes + different docType | ✅ `422` tamper ("already filed as Factory layout plan…") |
| Same bytes + same docType | ✅ `409` duplicate |
| Renamed non-PDF bytes as `.pdf` | ✅ `422` MIME-sniff fail |
| Vault hashed entry | ✅ `{sizeBytes, mime, hash}` stored |
| File Operate app → CTO/FINAL | ✅ `Locked` + reason |
| Approve Locked CTO | ✅ `400` |
| Approve CTE → `Approved`, then `Approved→Queried` | ✅ `200` then `400` terminal-immutable |
| `GET /api/renewals` | ✅ 8 rows, `{issuedAt, validityDays, due, daysLeft, state}` |
| Analytics before→after 2 approvals | ✅ `avgNew 21→21` frozen, `avgNewLive 14→11` moves, `live 2→3`, basis string honest |
| Rate limit 5 bad + 2 more | ✅ `401×5` then `429×2` |
| `app.js` inline script-tags | ✅ zero `<script` substrings |
| Served `GET / /app.js /styles.css /i18n.json` | ✅ toast div + `toast()/slaLabel()/renewReapply()`, no script-tag, toast CSS, 64/64 keys |
| Knowledge eval | ✅ `60 articles, P@1 6/8 = 0.75` (preserved) |
| DEMO-BREACH FIRE-PROV after reset+read | ✅ `Under review → Deemed` + auto-deemed remarks |
| GRV-881 after reset+read | ✅ `Filed → Escalated to Nodal Officer` |
| Wizard checklist Food/Nashik/Small/Establish | ✅ `9 items, ₹110000, critical 45d` |
| Audit `GET /api/audit` no-token/applicant/officer | ✅ `401 / 403 / 200` |
| Final `POST /api/reset` | ✅ `apps=3 history=38 seed=38 live=0`, `avgOld=60 avgNew=21`; server left **RUNNING** with clean seeds |

## 4. Demo script delta (60s, judge-proof)
1. Reset (footer) → logins issue session tokens (12h) — no guest buttons; header shows Logout.
2. Wizard → Generate → File (vault reuse) → Tracker → APP-2026-0157 FIRE-PROV `Deemed` + alertstrip line.
3. `#/login` → officer → `#/officer` MPCB queue (settled-vs-pending strip) → Query/Approve → terminal rows immutable (flip → 400 toast).
4. Documents → choose real PDF → Run server pre-validation → verdict shows `sizeBytes/MIME/⛨ hash`; re-upload same file elsewhere → tamper/duplicate rejection on screen.
5. Dashboard → LIVE renewals with due badges → Re-apply → wizard prefilled → file renewal.
6. Analytics → SEED `60→21*` frozen vs LIVE `avg completion` moving; Knowledge `deemed…` → TF-IDF scores + `P@1 6/8 75% no LLM`.
Say: *"Rule-gated parallel engine + byte-hashed vault + expiring sessions + measured completeness + append-only audit + validity renewals + SEED-frozen/LIVE-split analytics — TF-IDF retrieval, no LLM; multer/OCR/Mongo/SMS are Phase-2 (this upload uses a zero-dep multipart parser so package.json stays frozen)."*

## 5. Notes / blockers / handoff
- **Rate-limit state is in-memory:** restart clears it (by design — demo-safe). Sessions survive restart (in `db.json`) until expiry/reset.
- **Background 60s sweep still writes** (interval + write endpoints) — only *read* endpoints went post-response. A crash between `res.json` and post-save only delays the sweep one cycle.
- **Multi-process JSON races** remain single-server-only (atomic tmp+rename kept from prior fix) — unchanged, documented.
- **`DEMO_SCRIPT.md` stale tokens:** still names `demo-*-token` — judging logins/URLs/ports are identical, but the *token strings* are now random per login. Recommend the #8/README agent updates those two lines + adds the `expiresAt`/`429`/upload/`400`-terminal rows.
- **No browser in env:** MR + toast + renewal clicks verified via served-HTTP + file checks + API flows; one hall-laptop click-through (मराठी toggle → wizard → reload persists; toast visible on login/upload/officer actions; Re-apply prefill) still wanted per prior reports.
- **#8 handoff (do NOT do here):** hygiene + README line-refs to parallel agent; `.gitignore`/`package.json`/test stubs untouched as ordered.

*Server left RUNNING on :3000 with clean seeds (`apps=3 history=38 seed=38 live=0`). `start.ps1` verified untouched — `npm start` path unchanged.*
