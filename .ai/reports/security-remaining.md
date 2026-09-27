# Security Audit — Remaining (code only, PPT/PDF EXCLUDED)

Verdict: PASS

Date: 2026-09-27 · Auditor: Security Engineer · Scope: remaining code only, SIH demo
Inputs read FIRST: `.ai/reports/qa-remaining-verify.md` (PASS), `.ai/reports/code-review-remaining.md` (APPROVED), `.ai/reports/qa-report.md` (PASS), `.ai/reports/code-review.md` (APPROVED), `server.js` (auth 27-212, login/register 840-949, demo/status 1022-1036, reset 1528-1546), `data/seed.js` (users 9-13), `.gitignore` (6 lines), `public/app.js` (auth 1-82, reset 165-170, guards 183-251)
Not touched: PPT/PDF per request — no `.pptx`/`.pdf` opened, edited, or judged.

## Checklist
- [x] Input validation (checklist 400, register 400/409, doc validator 422, `express.json({limit:"2mb"})`, upload `express.raw 12mb` + MIME sniff per prior audits)
- [x] Authentication/Authorization (scrypt + legacy SHA, Bearer 12h/200-cap, fixed-token reject, 401/403/429, logout purge — verified)
- [x] Data encryption (N/A localhost; passwords hashed at rest, never plaintext, `sanitizeUser` strips)
- [x] SQL injection prevention (N/A — JSON file store, no SQL concatenation)
- [x] XSS prevention (`esc()` on all interpolations, placeholder-only inputs, no inline `<script>`)
- [x] CSRF protection (N/A by design — Bearer header, no cookie session surface)
- [x] Security headers (no `helmet()` — accepted offline; not a gate)
- [x] Error handling (generic 401/403/429/400/409/422, no stack leak)

## Findings (OWASP category, severity, file:line)

No critical / high. All code-only.

1. **A07 Auth — INFO (by-design, risk-accepted): `server.js:1023-1032` `GET /api/demo/status` returns demo passwords plaintext, unauthenticated.** `users[]` correctly mapped to `{id,email,role,disabled}` only — no `passHash`/`salt`/tokens leaked. Passwords are judging-sheet values (`demo123`/`officer123`/`admin123`) also on login Demo card + README/DEMO_SCRIPT. Keep for SIH; prod MUST remove passwords from response. Not a blocker.
2. **A07 Auth — INFO (safe): `server.js:135-142` legacy `x-demo-token`/`x-auth-token` headers accepted, fixed `demo-*-token` rejected at `:141`.** Compat widening, no bypass — QA proved fixed-token 401. Keep.
3. **A01 Access Control — SAFE: `POST /api/reset` guard `server.js:1528-1541` correct.** `?demo=1` → public demo reset (judging/footer); bare without token → 401 with actionable hint; non-ADMIN Bearer → 403. Footer `public/app.js:166` now `POST /api/reset?demo=1` (`COUNT_DEMO1=1 COUNT_BARE=0`, live 200 `{ok:true}`). Bare 401 is by-design guard, not a bug. Doc lag at `DEMO_SCRIPT.md:11` + `README.md:93` (bare wording) is doc-only, no code exposure.
4. **A01 Access Control — SAFE: `?demo=1` browse flag `public/app.js:58-75` is client-only (`localStorage us_demo`), does NOT bypass server auth.** Server `GET /api/applications/:id/track/docs`, vault, inspections, grievances, audit all still `requireAuth`/`requireRole` → 401/403 regardless of `us_demo`. Guards at `app.js:211,220,224,228,232` gate rendering only; server is source of truth. No elevation: applicant→officer still 403, `#/officer` + `#/admin` still role-gated + server-enforced. Safe to ship.
5. **A02 Crypto — SAFE (demo-grade): `server.js:47-66` scrypt per-user (`randomBytes(16)`, 64B) + `timingSafeEqual`; legacy global-SHA compat for 3 seed demos (`legacy:true`, `===`).** `AUTH_SALT` at `:40` is a hash domain-separator, not a secret (passwords are public). `mintSessionToken :125-127` = `SHA256(email:32B CSPRNG:time:random)` 64-hex, 12h TTL, capped 200, expiry-swept. Prod would need argon2id/bcrypt + `timingSafeEqual` everywhere + breached-password check — explicitly out of scope, do NOT change tonight.
6. **A09 Logging — SAFE (demo-grade): `sanitizeUser :77-81` strips `passHash/salt` on all user returns (`:959,:988,:1019,:935,:942`); `appendAudit` append-only, `GET /api/audit` staff-only `:1552`.** No PII beyond demo seeds in logs. SIEM/retention N/A offline.
7. **Prod secrets — CLEAN.** No `.env`/`.env.local` (0 `*.env*` hits, `Test-Path False` per QA), no `PORT` secret (defaults 3000, `process.env.PORT || 3000`), no API keys / `aws_` / `ghp_` / `sk-live` / `BEGIN PRIVATE` / `mongodb+srv` / `postgres://` — grep hits are only hashing code + by-design demo creds (`server.js:42-44,1029-1031,:869`, `public/app.js:355-357` Demo card, README/DEMO_SCRIPT sheets). `data/seed.js:10-12` stores only salted hashes, never plaintext. `localStorage us_token/us_role/us_lang/us_demo` is Bearer demo state (XSS-stealable by design offline; prod MUST move to HttpOnly+Secure+SameSite cookies). Not a git repo → no secret history to leak.
8. **A05 Misconfig / Supply chain — SAFE.** `express ^4.19.2` only dep, `node_modules/` present + working, `npm test`/`lint` 0. Do NOT `npm update` on stage. No `helmet()`/CSP — accepted offline (vanilla JS, no inline script-tag, `esc()` everywhere); prod MUST add `helmet()` + `default-src 'self'`.
9. **Zip hygiene — operator task, not a code bug.** `.gitignore` correct (6 lines: `node_modules/`, `data/db.json`, `*.bak`, `.ai/archive/`, `ppt-slides/`, `*.tmp`). `data/db.json` dirties on read (FIRE-PROV auto-deem +1 → 39) — always `POST /api/reset?demo=1` → verify `38/38/0` before zipping/judging. See Required Fixes §4.

## Required Fixes (for dev agents)

None blocking. No code change required — ship as-is. Code-only blockers: **0**.

1. **No auth/reset code fix.** Do NOT tighten `?demo=1`, do NOT remove demo passwords from `/api/demo/status`, do NOT add `helmet()`/cookies tonight — all risk-accepted for offline judging; changes add regression risk for zero screening ROI.
2. **Doc-only (optional, non-blocking):** `DEMO_SCRIPT.md:11` + `README.md:93` reset lines should say `POST /api/reset?demo=1` (public demo) / ADMIN Bearer otherwise — matches `server.js:1035,1528-1541` + footer fix. A judge copy-pasting bare curl gets 401 otherwise. 2-line edit, no code change, do NOT re-fail QA for this.
3. **Pre-zip operator checklist (5 min, exact — code only):**
   - `POST /api/reset?demo=1` → `{"ok":true}` → `GET /api/analytics` confirms `apps=3 history=38 (seed=38 live=0) corpus=60 avgOld=60 avgNew=21`.
   - Zip code ONLY: `server.js`, `package.json` (+`package-lock.json`), `data/seed.js`, `public/` (`index.html`,`app.js`,`styles.css`,`i18n.json`), `README.md`, `DEMO_SCRIPT.md`, `SUBMIT_CHECKLIST.txt`, `start.ps1`, `.gitignore`. EXCLUDE: `node_modules/`, `data/db.json` (auto-created from seed; dirty 39-row copy breaks replay), `*.pptx`/`*.pdf`, `.ai/archive/`, `*.bak`/`*.tmp`, `ppt-slides/`, `.ai/reports/` (evidence only if portal asks).
   - Unzip test clean folder: `npm install` → `npm start` → `http://127.0.0.1:3000` → footer Reset → wizard → tracker breach → officer query → analytics LIVE moves.
   - On stage: Reset → `#/tracker`/`#/app/APP-2026-0157` (sweep fires on read) → breach; Reset → `#/grievances` → GRV-881 Nodal. Never `npm update`.
4. **After SIH (not tonight):** `git init + commit`, pin express, remove passwords from `/api/demo/status`, move sessions to HttpOnly+Secure+SameSite cookies + signed JWT/refresh, per-app ownership (RBAC/ABAC), `helmet()`+CSP, Postgres audit + retention, vault/HSM secrets, SBOM/SLSA, expand `npm test` beyond syntax (reset-demo1 200, bare-reset 401, checklist `{}` 400, login→Bearer→officer-approve, eval parse).

---
Evidence: qa-remaining-verify PASS (`COUNT_DEMO1=1 COUNT_BARE=0 RESET 200 ANALYTICS 38/38/0 BARE 401 guard`); code-review-remaining APPROVED; `app.js:166 ?demo=1` on disk; `server.js:1528-1541` guard + `:1023-1036` demo/status (no hashes/tokens) + `:172-212` auth/role + `:840-935` login/register/rate-limit verified; `.gitignore` 6 lines; no `.env`/keys; PPT/PDF untouched.
