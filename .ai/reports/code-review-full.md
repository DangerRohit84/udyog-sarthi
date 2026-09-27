# Code Review — Full #1-8 + Polish Build (SIH-26130 Udyog Sarthi)

Verdict: APPROVED

Date: 2026-09-13 · Reviewer: Development Lead · Mode: review-only (no code changed)
Inputs read FIRST: `.ai/reports/qa-full-1-8.md` (104 lines, PASS), `.ai/reports/full-fix-1-7.md` (107 lines), `.ai/reports/hygiene-report.md` (29 lines), `.ai/reports/docs-refresh.md` (39 lines), plus live spot-checks on `server.js` (~1217 lines), `public/app.js` (~655 lines), `public/i18n.json`, `public/index.html`, `public/styles.css`, `.gitignore`, `package.json` scripts, `README.md`, `DEMO_SCRIPT.md`, `SUBMIT_CHECKLIST.txt`.

Gates re-verified this run: `node --check server.js / public/app.js / data/seed.js` OK ×3; `npm test` → `i18n OK`; `npm run lint` → `lint OK: no TODO/XXX`; zero `<script` in `app.js`; `i18n 64/64 zero blanks`; `.gitignore` 6 lines; root holds ONLY `Udyog-Sarthi-AI-SIH26130-IDEA-PPT.pptx (707,664B)` + `.pdf (477,804B)` plus out-of-scope `aadhar.pdf 0B`.

## Scope reviewed (#1-8 + polish)

### 1. Auth real flow — APPROVED
- `server.js:34-92` — `sha256`, per-role salt, `passHash = SHA256(salt:email:password)`, no plaintext. `mintSessionToken` = `SHA256(email:random:time)`, 64-hex, 12h TTL, capped 200, expired purged on login (`:692-695`).
- `authSession()` `:70-81` explicitly returns null for `demo-officer-token`/`demo-applicant-token` (`:77`). `requireOfficer` → 401 missing/expired, 403 wrong role (`:86-92`). QA live: fixed tokens → 401 on `/api/audit` + `PATCH track`; applicant → 403; no-token → 401; officer → 200.
- `POST /api/login` rate-limit 5 fails/15min/IP → 429 (`:41-58, :682`); success clears window. `POST /api/logout` deletes Bearer session — QA verified post-logout 401.
- Frontend `app.js:21-50` — `doLogin` stores `us_token + us_token_exp`, `setRole` no longer mints (routes to `#/login` with `us_pending_role` prefill), header Switch → real `doLogout`. `bindLoginRole:228` wired from `route()`, not innerHTML. Correct.

### 2. Docs bytes/hash — APPROVED
- `server.js:437-497` — `sniffMime()` (PDF/PNG/JPEG magic), zero-dep `parseMultipart()` (binary-safe, multer-equivalent, no `package.json` change), `findHashConflict()`: same bytes + different docType → 422 tamper; same bytes + same docType → 409 duplicate. Multipart endpoint `:941-972` is server-is-measurer (`sizeBytes/mime/hash`).
- QA live: 1983-byte PDF → 201 `verified:true sizeBytes=1983`; tamper → 422; duplicate → 409; MZ-as-PDF → 422 sniff-fail; JSON `{passed:true}` forgery → 422 `verified:false`.
- Frontend `app.js:418-447` clears box first (`⏳ Validating on server…`), sends real `FormData` bytes, renders server verdict only — no optimistic PASSED. Size/MIME/hash views + legacy label (`:265,386,414`). Correct.

### 3. Officer terminal — APPROVED
- `slaLabel(t)` (`app.js:455`) replaces `t.sla?.left + "d left"` null bug; terminals show status badges. `loadOffInsp` (`app.js:501`) called explicitly from `route()`, null-guarded, try/catch.
- `server.js:879` terminal immutable: `Approved/Rejected/Deemed → else` → 400 with renewal guidance; idempotent same-terminal re-assert → 200. QA live verified both. Reject button + completeness + doc size/hash on cards present. Officer summary strip `settled vs pending` (`app.js:472-480`) + MR via `T()` + toast. Correct.

### 4. Inline-script removal — APPROVED
- Zero `<script` substrings in `app.js` (verified `Select-String` count 0; comments reworded to `script-tag`). All four inits (`genChecklist:311`, `matchSchemes:530`, `loadOffInsp:501`, `knFilter`, `bindLoginRole:229`, `toast:57`, `slaLabel:455`, `doLogin:21`, `doLogout:35`) defined and called explicitly from `route()` after `innerHTML`. Null-guarded, render errors in-place. Root cause fixed, not patched.

### 5. Renewals wiring — APPROVED
- `GET /api/renewals` (`server.js:1193`) returns live `issuedAt/validityDays/due/daysLeft/state` (QA: 7 rows, all shaped). `renBadge` (`app.js:258`) covers `overdue/due-soon/valid`. `renewReapply` (`app.js:268`) prefills `WIZ.data + WIZ.renewalOf`, renewal banner (`:321`), server `reusedDocs` vault-verified (`server.js:800-803`). Dashboard hardcoded `58 days`/legend deleted. Correct.

### 6. Analytics honesty — APPROVED
- `server.js:1136-1173` — `old`/`seedNew` exclude `live:true`; `avgNew`/`byDept.new` from `seedNew` only (frozen 38); live rows as `avgNewLive`/`liveHistoryCount` + `seedHistoryCount` + honest `basis` string. QA: `avgNew 21→21`, `avgOld 60→60`, `seed 38` frozen while `live 1→2`, `avgNewLive 25→14` moves; repeated reads stable `40→40`. Matches README "SEED headlines do not move". Correct and judge-proof.

### 7. Server correctness — APPROVED
- Read GETs (`/api/applications`, `/:id`, `/:id/track`, `/api/grievances`, `/api/alerts`) sweep in-memory, `res.json()` first, `saveDb()` post-response. Grievance double-`loadDb` fixed to single-`db` (`:1070-1073`). Remaining `res.json(loadDb().…)` on sweep-free `/api/vault` + `/api/inspections` (`:994,996`) is single-load, no sweep, no write-on-read — style-only, behaviour correct.
- Preserved truths: knowledge `60 articles P@1 6/8=0.75 TF-IDF no LLM`, `GRV-881 Filed→Escalated`, `i18n 64/64`, final reset `apps=3 history=38 seed=38 live=0 avg 60/21`. Correct.

### 8. Polish — APPROVED
- MR: `i18n.json` 36→64 keys EN+MR, zero blanks (verified this run), officer/dashboard/docs/login via `T()`. Toast: `#toast` div (`index.html:24`, `role=status`), `.toast.ok/err/warn` CSS (`styles.css:21-25`), `toast(msg,kind)` 6s auto-dismiss (`app.js:57-69`); all user paths use toast. Landing one-screen (`app.js:183-204`): `Try it in 60 seconds` strip + inline demo logins + `Continue as → login` (no guest minting) + session/reset note; 4th stat is LIVE completions. Attachment size/hash + wizard D-gated locks + renewal banner present. OCR/LLM/Postgres/SMS correctly roadmap-only.

### 9. Hygiene/docs — APPROVED
- `.gitignore` 6 lines exact; `.bak` moved to `.ai/archive/` (now 2 files); root deck pair only; `npm test`/`lint` stubs pass; `start.ps1` untouched; `package.json` still 1 dep `express`.
- `DEMO_SCRIPT.md` retired-token context + 429 + 64 keys + validator ref `354-430 (+437-497)`; `README.md` 64 keys (×2), `avgNewLive`/`basis` (`:1136-1173`), banned/file-line refs current (`354-430 / 437-497 / 524-597 / 599-667`), zero stale `147-228`; `SUBMIT_CHECKLIST.txt` 24 lines with clean-root footer. Grep confirms no minting claim remains (residual `demo-*-token` hits only in RETIRED context).

## Issues (file:line, severity)
| # | Severity | File:line | Issue | Disposition |
|---|---|---|---|---|
| 1 | low | root `aadhar.pdf:0B` | 0-byte non-deck file in root; strict "only PPT+PDF" violated | Pre-existing, out of hygiene move-list scope. Do NOT block: uploader must upload ONLY the two `Udyog-Sarthi-AI-*` files; SUBMIT_CHECKLIST footer covers it. Optional: delete/move to `.ai/archive/`. |
| 2 | low | `public/app.js:67` | `else alert(msg)` ultimate fallback remains | Unreachable in practice (`#toast` exists `index.html:24`). Keep for robustness or remove for grep-purity — non-blocking. |
| 3 | low | `server.js:994,996` | `res.json(loadDb().…)` inline-load on `/api/vault` + `/api/inspections` | Single load, no sweep, no double-load, no write-on-read — behaviour correct, style-only. Non-blocking. |
| 4 | low | `server.js:41` (design) | Rate-limit in-memory; restart clears; 5 wrong passwords → 15-min 429 | By design, documented (`full-fix §5`, QA §Bugs #4). Success clears window; normal demo never locks. Non-blocking. |

No critical / high / medium issues. No security regression introduced (auth hardened, forgery rejected, audit officer-gated, atomic writes kept). No scope creep (OCR/LLM/Postgres/SMS stay roadmap-only).

## Mentoring Notes
- Why APPROVED with 4 lows: review bar is "only critical blocks". Lows are either by-design (rate-limit), unreachable (alert fallback), style-only (vault/inspections reads), or process (aadhar.pdf uploader discipline). None affect correctness, demo, or judging.
- What the team did right: server-is-measurer for docs (never trust client `passed:true`); SEED-frozen/LIVE-split analytics (honesty beats moving headlines); terminal immutability with idempotent re-assert (double-click safe); explicit `route()` inits killing the innerHTML script-tag class of bug; zero-dep multipart keeping `package.json` frozen; docs updated in the same change (no stale refs).
- For the hall: rehearse DEMO_SCRIPT never-say list; use `http://127.0.0.1:3000`; type logins from script (success clears rate window); run footer Reset + `curl /api/analytics` pre-check; upload ONLY the 6-slide PPTX+PDF; carry USB + PNGs + phone PDF.
- Next chain: `security` reads `qa-full-1-8.md` + this file; deploy NOT requested (deploy gate: explicit user keyword only).

## Quality gates
- [x] All tests passing (`npm test` i18n OK, `node --check` ×3)
- [x] Code reviewed (this file; QA PASS live-verified)
- [x] No critical/high security findings (retired tokens, hashed passwords, 401/403/429, forgery 422)
- [x] Documentation updated (README/DEMO/SUBMIT line-refs current)
- [x] No merge/commit requested (review-only, no code changed)
