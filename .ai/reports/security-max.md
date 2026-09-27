# Security Audit — Max Build (PPT excluded)
Verdict: PASS
Date: 2026-09-27 · Auditor: Security Engineer · Mode: audit-only, no app code touched · PPT/PDF excluded, untouched
Project: D:\SIH\udyog-sarthi · Scope: final freeze gate, code-only blockers

Inputs read FIRST (per workflow):
1. `.ai/reports/qa-max.md` — Verdict PASS (15 probes + re-verify R1-R12, 38/38/0, n=32 acc 0.594, 160/160 i18n, guards 401/400/422, hardtech 5/5, DB restored clean, PPT timestamps untouched)
2. `.ai/reports/code-review-max.md` — Verdict CHANGES_REQUESTED doc-only, Code FREEZE-READY (no code changes requested, arch intact, honesty code-PASS/docs-FAIL, demo-safe PASS)
3. `server.js` 1640 lines (spot-verified: auth 27-230, validation 511-610, multipart/MIME/hash 612-677, login 895-933, register 951-989, admin 1004-1073, demo/status 1076-1090, search/eval 1092-1120, upload 1294-1387, reset 1585-1603, audit 1609-1612, headers/static 20-25)
4. `data/seed.js` 247 lines (users U-001/U-002/U-003 legacy hashes, no plaintext) + `package.json` 18 lines (express ^4.19.2 only) + `.gitignore` 6 lines + `SUBMIT_CHECKLIST.txt` + `start.ps1` + root listing + `data/` listing
5. Prior `.ai/reports/security-audit.md` PASS (offline demo) — concur, carried forward with max-build line numbers

Constraint respected: audit-only, zero app-code/config edits, zero PPT/PDF touches (pptx 707664B 2026-09-09 11:52:50 + pdf 477804B 2026-09-09 11:53:35 per qa-max #15, not opened).

## 1. Prod secrets — PASS (demo creds only, by-design)

- No prod secrets found. No `.env` / `*.env*` in root listing (16 entries: .ai, .gitignore, data, DEMO_SCRIPT, docs, node_modules, package-lock, package.json, public, README, server.js, start.ps1, SUBMIT_CHECKLIST, test, pptx, pdf). No `sk-live`, `ghp_`, `aws_`, `BEGIN PRIVATE`, `mongodb+srv://`, `postgres://`, API keys, connection strings, private keys in `server.js` / `seed.js` / `package.json` / `.gitignore`.
- Only secrets-like strings are intentionally-public demo judging values: `udyog@demo.in/demo123`, `officer@maharashtra.gov.in/officer123`, `admin@maharashtra.gov.in/admin123` in `server.js:4,43-44,922,1082-1084`, `data/seed.js:10-12` (hash preimages only, never plaintext passwords stored), `public/app.js:361-363` (Demo card table), `README/DEMO_SCRIPT` logins block. Risk-accepted for offline judging, documented in qa-max + code-review-max. No real mailbox, no reuse outside demo.
- `AUTH_SALT="udyog-sarthi-demo-salt-v1::26130"` (`server.js:40`, mirrored `data/seed.js:7`): domain-separator constant, NOT a secret. Baked into 3 legacy global-SHA hashes only. New users use per-user `crypto.scrypt(pw,16B-hex,64)` (`server.js:48-49`). MUST NOT be mistaken for pepper in pilot — replace with env/vault pepper.
- Hashes at rest: `data/db.json` present (via `data/` listing) + gitignored (`.gitignore:2`), stores `passHash/salt` + live `sessions[].token`. Lives outside `public/` → not URL-reachable via `express.static(public/)` (`server.js:25`). Never uploaded (gitignored). Anyone with disk read already owns demo — acceptable offline.
- `GET /api/demo/status` (`server.js:1076-1090`) returns demo passwords plaintext unauthenticated — INFO by-design for judges (same as prior audit). `users[]` correctly mapped to `{id,email,role,disabled}` only, no `passHash/salt/tokens` leaked. Prod MUST strip `password` fields (see Required Fixes pilot #1). NOT a freeze blocker.

## 2. Auth / access control — PASS for offline demo

- Hashing: new `hashScrypt` + `timingSafeEqual` (`server.js:48-66`); legacy 3 demos global-SHA `sha256(salt:email:pw)` with `===` (`server.js:55-57`). Split correct (legacy demo-compat only). `validPassword ≥8+digit` (`server.js:67-70`), `validEmail` regex (`server.js:71-73`).
- Tokens: `mintSessionToken=SHA256(email:32B-CSPRNG:time:random)` (`server.js:125-127`), 12h TTL (`server.js:41`), capped 200 rows with expiry sweep (`server.js:221-230`). Fixed `demo-officer-token/demo-applicant-token` explicitly rejected (`server.js:141`). `requireAuth`/`requireRole` reload user from DB every request, check `disabled`, attach `req.user {userId,email,role(UPPERCASE),name}` (`server.js:172-213`). ADMIN inherits OFFICER (`server.js:193-194`). Logout purges token (`server.js:935-947`). QA proves: bare `POST /api/reset` 401, `Bearer GET applications` 200, officer-approve 200, applicant-vs-officer scoping holds.
- RBAC/ABAC: `requireRole("OFFICER","ADMIN")` on `PATCH track` (`server.js:1246`), `PATCH inspections/:id` (`server.js:1439`), `GET /api/audit` (`server.js:1609`), `GET/POST/PATCH /api/admin/*` (`server.js:1005,1016,1045`). Self-register OFFICER/ADMIN → 403, non-APPLICANT → 400 (`server.js:958-963`); officer creation ONLY via `POST /api/admin/officers` ADMIN (`server.js:1016`). Self-disable blocked (`server.js:1056`), disable purges sessions (`server.js:1058-1060`). `sanitizeUser` strips `passHash/salt` on all returns (`server.js:77-81`). Ownership `isOwnerApp+isStaffRole`: reads 404-no-leak vs writes 403 (`server.js:1166-1172,1294-1298,1340-1341`), `GET vault/inspections/grievances` scoped (`server.js:1389-1401,1478-1488`). No stack-trace leaks (generic 401/403/400).
- Rate limiting: login 5-fails/15min/IP → 429 + success-clears (`server.js:895-930`); register 5/hr/IP → 429 (`server.js:951-956`). In-memory Maps + `loginIp` trusts `x-forwarded-for` (`server.js:99-102`) — spoofable, resets on restart. Fine single-server offline; pilot needs `trust proxy` + persistent store.
- Frontend: `localStorage us_token` + `Authorization: Bearer` (code-review verified), `esc()` on all interpolations (spot-check 100+ hits), no inline `<script>`, placeholder-only creds (no `value=demo123`). XSS-stealable token by-design offline; pilot MUST move to HttpOnly+Secure+SameSite cookies.

## 3. Input validation / upload / injection / SSRF — PASS

- `validateChecklistProfile` strict allowlists sector/size/stage/district + numeric checks (`server.js:515-525`) → 400 on `{}` (qa-max #11 proven).
- `validateDocumentInput` ignores client `passed/verified`, enforces ext `.pdf/.jpg/.jpeg/.png`, 10MB cap, MIME allowlist, expiry, `holderName>2` (`server.js:534-610`) → 422. Multipart sniffs magic PDF/PNG/JPEG so `.exe→.pdf` rename caught (`server.js:617-623,1361-1363`); SHA-256 duplicate/tamper guard (`server.js:667-677,1367-1373`); path traversal `../\/` rejected (`server.js:545-547`); title ≤200/applicant ≤100/remarks ≤2000/slot 3-50 enforced. QA sniff-422 + gate-400 proven live.
- `express.json({limit:"2mb"})` (`server.js:24`) + `express.raw({multipart,limit:"12mb"})` (`server.js:1337`) bound body DoS. TF-IDF `limit` clamped 1-10. No SQL (JSON file), no `eval`, no server-side fetch/SSRF surface. `writeDbAtomic` unique tmp+`renameSync` (`server.js:240-249`); no write-on-read GET corruption (post-response saves). Audit append-only `{ts,actor,action,id}` (`server.js:311-314`).
- Headers: no `helmet`/CSP/HSTS/X-Frame/X-Content-Type, `X-Powered-By` leaks (`server.js:20-25`), no `cors` middleware → same-origin only (good). LOW offline, HIGH if ever hosted. No CSRF cookie surface (Bearer only); only cross-site-reachable mutation is public `POST /api/reset?demo=1` (one-click-restorable wipe). No structured security-event log/SIEM (volatile Maps only) — accept offline.

## 4. Reset ?demo=1 — PASS (by-design public demo reset, NOT a code blocker)

- `POST /api/reset` (`server.js:1585-1603`): `?demo=1` → public `writeDbAtomic(seed)` + `{ok:true}` (qa-max #4 200, #15 restore 38/38/0 proven). Without `?demo=1` → ADMIN Bearer required (401 no token, 401 bad session, 403 non-ADMIN). Bare `POST /api/reset` 401 proven (qa-max #10 + hardtech probe #2).
- Threat: anyone on hall LAN can wipe `db.json` mid-demo. Accepted for judging (footer Reset + DEMO_SCRIPT reset-first need it). Mitigate on stage with USB backup + re-`POST /api/reset?demo=1` before judges. Pilot MUST require ADMIN always, delete `?demo=1` path.

## 5. Zip / submit hygiene — PASS

- `.gitignore` (6 lines) verified correct: `node_modules/`, `data/db.json`, `*.bak`, `.ai/archive/`, `ppt-slides/`, `*.tmp`. Covers all forbidden upload content.
- NEVER upload: `node_modules/` (present, ignored), `data/db.json` (runtime DB with hashes+tokens, ignored), `.ai/archive/` (vision deck + `.bak`, would break 6-slide rule), `*.bak/*.tmp/ppt-slides/`. Upload ONLY per `SUBMIT_CHECKLIST.txt`: `Udyog-Sarthi-AI-SIH26130-IDEA-PPT.pptx + .pdf` (<5MB). PPT/PDF excluded from this audit per task, untouched on disk.
- Not a git repo → no secret history to leak; no `.env` to leak (`PORT` defaults 3000 per `server.js:21`). `express ^4.19.2` floating caret — do NOT `npm update` on stage; pilot pins lockfile + `npm audit`/Dependabot + SAST/secrets scan.

## Findings (OWASP category, severity, file:line)

- A01 Broken Access Control — LOW (by-design, demo): `POST /api/reset?demo=1` public (`server.js:1585-1598`). Accept; pilot requires ADMIN, deletes `?demo=1`.
- A02 Cryptographic Failures — LOW (demo): legacy global-SHA + `===` (`server.js:55-57`), hardcoded `AUTH_SALT` (`server.js:40`). New scrypt+`timingSafeEqual` good (`server.js:48-66`). Pilot migrates all to scrypt/argon2 + env pepper.
- A02 Cryptographic Failures — LOW (demo) / HIGH (pilot): `GET /api/demo/status` plaintext demo passwords (`server.js:1076-1090`) + login 401 hint (`server.js:922`). Risk-accepted; prod strips passwords.
- A04 Insecure Design — LOW (demo): no helmet/CSP/HSTS/X-Frame/X-Content-Type + `X-Powered-By` (`server.js:20-25`). Add `helmet()` + `disable("x-powered-by")` before any hosted URL.
- A05 Misconfiguration — LOW (demo): `express ^4.19.2` caret, no audit gate (`package.json:12-14`). Do NOT update on stage.
- A07 Auth Failures — LOW (demo): spoofable `x-forwarded-for` limiter (`server.js:99-102`), in-memory limiter, `localStorage` tokens. Pilot: `trust proxy`, persistent limiter, HttpOnly cookies, MFA.
- A09 Logging Failures — LOW (demo): auth failures volatile only; `db.audit` covers domain actions. Pilot needs persistent auth-audit + 1-year retention.
- Submission hygiene — LOW (process): `.ai/archive/*.bak` present but ignored; root PPTX+PDF correct. Upload ONLY those two.

## Required Fixes (for dev agents)

NONE for max-build freeze — do NOT code-fix before portal upload (freeze code; code-review-max High #1-3 + Medium #4-5 are doc/text-only, no logic change; this audit imposes zero additional code changes). For pilot/prod post-SIH, in order:
1. Strip passwords from `GET /api/demo/status` (`server.js:1081-1085`) + login hint (`server.js:922`); gate or delete endpoint.
2. Require ADMIN for all `POST /api/reset` (`server.js:1585`); delete `?demo=1`; add `helmet()` + `disable("x-powered-by")` + CSP `default-src 'self'`.
3. Migrate legacy SHA → scrypt/argon2, pepper from env/vault, `timingSafeEqual` everywhere; HttpOnly+Secure+SameSite cookies + refresh rotation; persistent rate limiter behind `trust proxy`.
4. Pin deps (`package-lock`), `npm audit` in CI, SAST (CodeQL/Semgrep) + secrets scan (gitleaks) pre-commit, `git init + commit` after doc fixes.

## Blockers (code-only)

- Code blockers: NONE. Freeze may proceed on code; remaining gates are doc-only (code-review-max High #1-3) + portal placeholders (Team ID/College/theme/PDF re-export per SUBMIT_CHECKLIST), no PPT action.
- By-design risk-accepted (NOT blockers): demo creds, AUTH_SALT, legacy-SHA, public `?demo=1`, missing helmet/CSP, localStorage tokens, spoofable limiter, SEED-frozen analytics, syntax-only `npm test`. All with pilot fixes above; none delay upload.
