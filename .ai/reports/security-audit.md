# Security Audit — Submission Readiness SIH 26130 (offline demo)
Verdict: PASS (for SIH IDEA offline demo only — NOT for pilot/prod)

Date: 2026-09-27 · Auditor: Security Engineer · Mode: audit-only, no app code changed
Inputs read FIRST:
1. `.ai/reports/qa-report.md` — Verdict PASS (npm test exit 0, live health/meta/login/eval/analytics green, .gitignore correct, no .env, demo-creds-only grep)
2. `.ai/reports/code-review.md` — APPROVED (auth overhaul) + APPROVED (landing) + CHANGES_REQUESTED docs/placeholders only (0 code blockers)
3. `server.js` full 1583 lines (spot-verified: auth 39-230, validation 501-667, login/register 840-949, demo/status 1022-1037, upload 1237-1330, reset 1528-1546)
4. `data/seed.js` full 247 lines · `package.json` 18 lines · `.gitignore` 6 lines
5. Live filesystem checks: root listing, `data/db.json` 54,256 B present+ignored, `node_modules/` present+ignored, `.ai/archive/` 2 files, `*.bak` scan, header/CORS/token-storage greps

## 1. Hardcoded secrets — PASS (demo-only, no prod secrets)

- No API keys, connection strings, private keys, cloud creds, `sk-live`, `ghp_`, `aws_`, `BEGIN PRIVATE`, `mongodb+srv://`, `postgres://` found. Greps hit only password-hashing code + by-design demo creds. No `.env`/`.env.local` files (verified `Test-Path False`, 0 `*.env*` hits).
- `AUTH_SALT = "udyog-sarthi-demo-salt-v1::26130"` (`server.js:40`, mirrored `data/seed.js:7`): domain-separator constant, NOT a secret. It is baked into 3 legacy global-SHA hashes. Acceptable because (a) legacy path is demo-compat only, (b) hashes are of publicly-known demo passwords, (c) new users use per-user scrypt. MUST NOT be mistaken for a pepper in pilot — replace with per-user salt + server-side pepper from env/vault.
- Demo passwords `demo123 / officer123 / admin123` appear in: `server.js:42-44` (legacy hash preimage), `server.js:869` (login 401 hint), `server.js:1028-1031` (`GET /api/demo/status` plaintext), `public/app.js:355-357` (Demo card table), `data/seed.js:10-12` (legacy hashes). All are **by-design for offline judging** (risk-accepted per QA + dev-lead). Confirm: no real user, no real mailbox, no reuse outside demo.
- Hashes at rest: `data/db.json` (gitignored, 54 KB) stores `passHash/salt` for all users + live `sessions[].token`. File is never served (outside `public/`) and never uploaded (gitignored). Anyone with disk read already owns the demo — acceptable offline. For pilot: encrypt at rest / move to real DB, never log tokens.

## 2. Auth safety — PASS for demo, hardened paths verified

- Hashing: new users `crypto.scrypt(pw, 16B-hex-salt, 64)` (`server.js:48-49`); verify uses `timingSafeEqual` (`server.js:64`). Legacy 3 seed demos use global-SHA (`server.js:55-57` with `===`). Split is correct severity (legacy demo-only) but unify to `timingSafeEqual` on next touch (dev-lead nit #6 carried).
- Token handling: `mintSessionToken` = SHA256(email + 32B CSPRNG + Date.now + Math.random) (`server.js:125-127`), 12h TTL (`server.js:41`), capped 200 rows with expiry sweep (`server.js:224-228`). Fixed tokens `demo-officer-token/demo-applicant-token` explicitly rejected (`server.js:141`). `requireAuth`/`requireRole` re-load user from DB every request, check `disabled`, attach `req.user {userId,email,role(UPPERCASE),name}` (`server.js:172-212`). ADMIN inherits OFFICER (`server.js:193-194`). Logout purges token (`server.js:882-894`). Frontend stores `us_token` in `localStorage` + `Authorization: Bearer` (`public/app.js:7-8,28-31`) — XSS-stealable by design; acceptable offline (no HttpOnly option without cookies), MUST move to HttpOnly+Secure+SameSite cookies for pilot.
- Validation: `validateChecklistProfile` strict sector/size/stage/district allowlists (`server.js:505-515`); `validateDocumentInput` ignores client `passed/verified`, enforces ext allowlist `.pdf/.jpg/.jpeg/.png`, 10 MB cap, MIME allowlist, expiry, `holderName>2` (`server.js:524-600`) → 422 with `checks` on fail. Multipart path sniffs magic (PDF/PNG/JPEG) so `.exe→.pdf` rename is caught (`server.js:607-613,1299-1306`); SHA-256 duplicate/tamper guard (`server.js:657-667,1310-1316`). Title ≤200 / applicant ≤100 / remarks ≤2000 / slot 3-50 enforced. `express.json({limit:"2mb"})` (`server.js:24`) + `express.raw({multipart, limit:"12mb"})` (`server.js:1280`) bound body DoS at demo scale.
- File-write atomicity: `writeDbAtomic` unique `pid+Date+seq+rand` tmp + `renameSync` (`server.js:240-249`); all persists via `saveDb`; sweeps are in-memory with post-response save (no write-on-read GET corruption). Single-server topology explicitly documented — correct for demo, NOT safe for multi-process (logical read-modify-write race remains).
- Static serving: `express.static(public/)` (`server.js:25`). `data/db.json` lives outside `public/` → not URL-reachable. No `dotfiles` hardening, no `index:false`, `X-Powered-By: Express` still advertises (info-disclosure LOW offline). No `cors` middleware → same-origin only (good). No CSP/HSTS/X-Frame/X-Content-Type-Options/helmet — LOW for `localhost` demo, HIGH for any hosted pilot.
- Rate limiting: login 5-fails/15min/IP → 429 + success-clears (`server.js:842-871`); register 5/hr/IP → 429 (`server.js:898-903`). In-memory Maps (lost on restart) + `loginIp` trusts `x-forwarded-for` (spoofable → per-IP bypass, dev-lead nit #4). Fine for single-demo-server; pilot needs `trust proxy` + keyed limiter + persistent store.
- AuthZ correctness (concur dev-lead): ownership `isOwnerApp+isStaffRole`, reads 404-no-leak vs writes 403 (`server.js:1115,1241,1354`), `sanitizeUser` strips `passHash/salt` on all 5 user returns (`server.js:77-81,959,988,1019,935,942`), self-register OFFICER/ADMIN → 403 (`server.js:905-911`), self-disable blocked (`server.js:1003`), disable purges sessions (`server.js:1005-1007`), weak-pwd `≥8+digit` 400, dup 409, dept allowlist 400. No stack-trace leaks (generic 401s).
- XSS: frontend uses `esc()` on interpolations incl. demo table/alerts/nav (code-review verified, spot-check `public/app.js:92,137-160` confirms). No inline `<script>`, no prefilled `value=` creds (placeholder-only). Residual: any future `innerHTML` without `esc()` + `localStorage` token = session theft — keep `esc()`-everywhere rule + CSP for pilot.
- Injection/SSRF: no SQL (JSON file), no `eval`, no server-side fetch/SSRF surface. TF-IDF `limit` clamped 1-10 (`server.js:1043,1053`). Path traversal in `name` rejected (`..`/`\/` → 400, `server.js:535-537`). Audit is append-only `{ts,actor,action,id}` (`server.js:301-304`); grievance resolve is staff-only with speaking-order note (`server.js:1454-1457`).

## Findings (OWASP category, severity, file:line)

- **A01 Broken Access Control — LOW (by-design, demo):** `POST /api/reset?demo=1` is public/unauthenticated (`server.js:1528-1546`). Anyone on hall LAN can wipe `db.json` mid-demo. Accept for judging (footer Reset needs it); mitigate on stage with USB backup + re-`POST /api/reset` before judges arrive. Pilot: require ADMIN always, delete `?demo=1`.
- **A02 Cryptographic Failures — LOW (by-design, demo):** legacy global-SHA for 3 demos (`server.js:55-57`) + `===` vs `timingSafeEqual`; `AUTH_SALT` hardcoded (`server.js:40`). New users are scrypt-per-user (good). Pilot: migrate all to scrypt/argon2 + pepper-from-env, unify `timingSafeEqual`.
- **A02 Cryptographic Failures — LOW (demo) / HIGH (pilot):** `GET /api/demo/status` returns demo passwords plaintext, unauthenticated (`server.js:1022-1037`). Risk-accepted for judging; prod MUST remove `password` fields (return only `{id,email,role,disabled}`).
- **A04 Insecure Design — LOW (demo):** no security headers (helmet/CSP/HSTS/X-Frame/X-Content-Type) and `X-Powered-By` leaks (`server.js:20-25`). Harmless on `localhost`; add `helmet()` + `app.disable("x-powered-by")` before any hosted URL.
- **A05 Misconfiguration — LOW (demo):** `express ^4.19.2` floating caret, no `npm audit` gate (`package.json:13`). `node_modules/` present+working today; do NOT `npm update` on stage. Pilot: pin lockfile, run `npm audit`/Dependabot.
- **A07 Auth Failures — LOW (demo):** `x-forwarded-for` spoofable rate-limit key (`server.js:99-102`); in-memory limiter resets on restart; tokens in `localStorage` (`public/app.js:28-31`). Single-server offline → accept. Pilot: `trust proxy`, persistent limiter, HttpOnly cookies, MFA/passkeys.
- **A09 Logging Failures — LOW (demo):** auth failures only in volatile `LOGIN_FAILS` map; no structured security-event log/SIEM. `db.audit` covers domain actions (good). Accept offline; pilot needs persistent auth-audit + 1-year retention.
- **Submission hygiene — LOW (process):** `.ai/archive/` holds `Udyog-Sarthi-AI-SIH26130-IDEA-PPT-First-generated-main.pptx` + `.pptx.bak`; `*.bak`/`*.tmp`/`ppt-slides/` correctly gitignored (`.gitignore:1-6` verified) but physically present. Root also has 6-slide-correct `Udyog-Sarthi-AI-SIH26130-IDEA-PPT.pptx (0.67 MB) + .pdf (0.46 MB)` — upload ONLY these two.

## Required Fixes (for dev agents)

NONE for offline demo submission — do NOT code-fix before portal upload (freeze code, fix only deck placeholders + 3 doc count lines per code-review items 1-6). For pilot/prod (post-SIH, in order):
1. Remove plaintext passwords from `GET /api/demo/status` (`server.js:1028-1031`) + login 401 hint (`server.js:869`); gate status endpoint or delete.
2. Require ADMIN for all `POST /api/reset` (`server.js:1528`); delete `?demo=1` public path; add `helmet()` + `app.disable("x-powered-by")` + CSP.
3. Migrate legacy SHA users to scrypt, pepper from env/vault, `timingSafeEqual` everywhere; move sessions to HttpOnly+Secure+SameSite cookies + server store; persistent rate limiter behind `trust proxy`.
4. Pin deps (`package-lock`), `npm audit` in CI, SAST (CodeQL/Semgrep) + secrets scan (gitleaks) pre-commit, `git init + initial commit` now that placeholders land.

## Submission risks — what must NOT be uploaded

- NEVER upload: `node_modules/` (present, ignored), `data/db.json` (54 KB runtime DB — contains hashes + live session tokens, ignored by design), `.ai/archive/` (vision 8-slide deck + `.bak` — would break 6-slide rule), any `*.bak` / `*.tmp` / `ppt-slides/` / `aadhar.pdf (0 B)`. `.gitignore` (6 lines) already excludes all of these — verified correct.
- Upload ONLY: `Udyog-Sarthi-AI-SIH26130-IDEA-PPT.pptx + .pdf` (<5 MB, verified 0.67/0.46 MB). Re-export PDF after Team-ID/College/theme fixes, re-confirm <5 MB.
- Not a git repo (`git rev-parse` exit 128) → no secret history to leak; but also no rollback — `git init + commit` AFTER placeholder fixes, BEFORE stage edits. No `.env` to leak (none exist, none required — `PORT` defaults 3000).

## Blockers vs by-design demo issues

- BLOCKERS (portal will reject/ding — manual, ~20 min, no code change): Team ID `SIH26130-XXX` + College `___` placeholders, theme/category dropdown exactness, portal member/female-member entry, PDF re-export — per code-review Critical 1-5. Clear these before upload.
- BY-DESIGN (risk-accepted for offline demo, NOT blockers): demo creds in code/status/UI, `AUTH_SALT` constant, legacy-SHA compat, public `?demo=1` reset, missing helmet/CSP/HSTS, `localStorage` tokens, spoofable `x-forwarded-for` limiter, SEED-frozen analytics, `npm test` syntax-only. All documented above with pilot fixes; none delay IDEA PPTX+PDF upload.
