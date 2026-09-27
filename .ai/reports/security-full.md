# Security Audit — Full #1-8 + Polish Build (SIH-26130 Udyog Sarthi)

Verdict: SECURE_WITH_NOTES
(Mapping to chain gate: PASS — zero critical issues, no fix loop triggered. Chain ends here — do NOT deploy.)

Date: 2026-09-13
Auditor: Security Engineer
Mode: audit-only (no application code or configuration changed; read + live-report review only)
Scope (full source read):
- `D:\SIH\udyog-sarthi\server.js` (1217 lines on disk — dispatch said ~1210)
- `D:\SIH\udyog-sarthi\public\app.js` (655 lines on disk — dispatch said ~660)
- `D:\SIH\udyog-sarthi\data\seed.js` (230 lines)
- `D:\SIH\udyog-sarthi\public\index.html` (32 lines)
- `D:\SIH\udyog-sarthi\public\i18n.json` (en=64 / mr=64, 0 blanks — verified this run)
- `D:\SIH\udyog-sarthi\public\styles.css` (static-only spot-check), `package.json` (1 dep: express), `.gitignore` (6 lines)
Inputs read FIRST (in order):
1. `.ai/reports/qa-full-1-8.md` — Verdict PASS (0 critical/high/medium, 4 lows; live-verified on :3000)
2. `.ai/reports/code-review-full.md` — Verdict APPROVED (4 lows, non-blocking)
3. `.ai/reports/full-fix-1-7.md` — #1-7 + polish implementation claims + live proofs
4. Delta context: `.ai/reports/security-final.md` + `security-frontend.md` + `security-audit.md` (all SECURE_WITH_NOTES baselines)

Context: local SIH demo/judging prototype, NOT production. Single operator on localhost/trusted hall LAN, illustrative seed data only, no real PII, `POST /api/reset` restores pristine (`apps=3 history=38 seed=38 live=0`). Risk assessed accordingly — issues that would be High in production are Low here. Only CRITICAL triggers the fix loop (max 3 cycles); none found (0/3 used).

## Checklist

- [x] Input validation (server-side allowlists, caps, enums — verified)
- [x] Authentication/Authorization (hashed passwords + expiring sessions + 401/403/429 — verified, demo-grade notes below)
- [x] Data encryption (N/A — localhost demo, no secrets in transit; passwords hashed at rest in code, not plaintext)
- [x] SQL injection prevention (N/A — no SQL; JSON file store, no query concat)
- [x] XSS prevention (spot-checked all sinks + 3 `<details>` tables — `esc()` baseline holds, 3 carried lows + 1 info)
- [x] CSRF protection (N/A — no cookies/sessions; Bearer in header + localStorage; open-reset CSRF note below)
- [x] Security headers (absent — noted, not required for localhost demo)
- [x] Error handling (no stack leakage; 400/401/403/404/409/422 shapes correct, `esc(e.message)` on frontend)

## Findings (OWASP category, severity, file:line)

No CRITICAL or HIGH findings. All dispatch targets hold.

### 1. Authentication — tokens / sessions / rate-limit / hash — SECURE, demo-grade notes — `server.js:34-92,670-715`
- Passwords hashed: `server.js:38-39` `passHash = SHA256(salt:email:password)` per-role salt, verify at `:682` with `===`. No plaintext credential strings anywhere. QA live: officer + applicant logins mint 64-hex expiring tokens (+12h `expiresAt`).
- Sessions real: `mintSessionToken()` `:60-62` = `SHA256(email:random32:time:random)` (64-hex, 128-bit+ entropy), stored `{token,email,role,createdAt,expiresAt}` in `db.sessions`, 12h TTL `:36`, expired purged on login `:692`, capped 200 `:697`. `findSession()` `:63-69` rejects missing/expired. `POST /api/logout` `:703-715` deletes Bearer row — QA verified post-logout `401`.
- Fixed tokens retired: `authSession()` `:77` explicitly returns null for `demo-officer-token`/`demo-applicant-token`. `requireOfficer` `:86-92` → 401 missing/expired, 403 wrong role. QA live: fixed tokens → 401 on `/api/audit` + `PATCH track`; applicant → 403; no-token → 401; officer → 200. Frontend `app.js:21-50` `doLogin` stores `us_token/us_token_exp`, `setRole` never mints (routes to `#/login` with `us_pending_role` prefill), header Switch → real `doLogout`. Correct.
- Rate-limit: 5 failed `POST /api/login` per IP per 15 min → 429 (`:41-58, :673-687`); success clears window `:687`. QA live: 5×401 then 2×429. Correct.
- LOW notes (demo-accepted, NOT gating):
  - 1a `server.js:34-39,682` — fast unsalted-beyond-static-salt SHA-256, not bcrypt/argon2, `===` not `timingSafeEqual`. Fine because the two passwords are intentionally public judging-sheet values (`demo123`/`officer123` on landing/login/DEMO_SCRIPT by design — not secrets); brute-force resistance is not a demo requirement. Production: argon2id/bcrypt + `timingSafeEqual` + breached-password check.
  - 1b `server.js:35` — `AUTH_SALT` hardcoded in source. Not a secret in this threat model (passwords are public); do not rotate as if it were a key. Production: per-user random salt in DB + pepper in vault/HSM.
  - 1c `server.js:45-48` — `loginIp()` trusts `X-Forwarded-For` first. Attacker behind a proxy that forwards XFF can rotate the header to bypass the 5/15-min window. Localhost demo impact ~nil (no proxy in hall topology). Production: trust XFF only from known proxies, or rate-limit on account + IP with exponential backoff + CAPTCHA.
  - 1d `server.js:70-74` — `x-demo-token`/`x-auth-token` header aliases retained alongside `Authorization: Bearer`. Still requires a live session row (not a bypass), so accepted; narrows future audit surface to remove aliases.
  - 1e `server.js:41` (design) — rate-limit state in-memory (`LOGIN_FAILS` Map); restart clears. By design, documented in full-fix §5 and QA Bugs #4. Success clears window so normal demo never locks.

### 2. Unrestricted file upload — multipart sniff / hash / tamper / duplicate — SECURE — `server.js:347-497,901-992`
- Server is the only measurer. `sniffMime()` `:437-443` checks magic (PDF `%PDF`, PNG `89 50 4E 47`, JPEG `FF D8 FF`); `<4 bytes` or unknown → `application/octet-stream` → multipart path rejects 422 `:966-968` ("MIME sniff failed"). Renamed `.exe→.pdf` (MZ bytes) caught — QA live verified 422 with `mime=application/octet-stream`.
- Zero-dep `parseMultipart()` `:448-482` (binary-safe Buffer split, headers latin1, bytes sliced) — multer-equivalent without a `package.json` change (still 1 dep `express`). `express.raw({type:"multipart/form-data", limit:"12mb"})` `:943` caps wire bytes; `MAX_DOC_BYTES = 10MB` `:353` enforced in `validateDocumentInput` `:394-396`.
- `sha256Bytes()` `:444` over real bytes; `findHashConflict()` `:487-497` scans apps + vault: same bytes + different docType → 422 tamper; same bytes + same docType → 409 duplicate. Both JSON path (optional `fileHash` hex-validated `:915`) `:917-924` and multipart path `:972-978` enforce it. QA live: 1983-byte PDF → 201 `verified:true sizeBytes=1983`; tamper → 422; duplicate → 409; JSON `{passed:true}` forgery → 422 `verified:false`. Client `passed/verified/checks` fully ignored `:347-348,907-911`.
- Filename traversal blocked: `validateDocumentInput` `:365-367` rejects `[\\/]` and `..`; name never used as a filesystem path (JSON record + vault row only). Extension allowlist `.pdf/.jpg/.jpeg/.png` `:351,370`; MIME allowlist `:352,405`; holder required `>2 chars` `:424-426`; expiry fails only if supplied-expired/unparseable `:413-417`.
- Frontend `app.js:420-452` clears box first ("Validating on server…"), sends real `FormData` bytes, renders server verdict only — no optimistic PASSED. Size/MIME/hash views + legacy label (`:265,386,414`). Correct.
- No findings. Residual from pre-P0 (JSON-only metadata without bytes is weaker than multipart) is closed as a bypass: JSON path still requires extension + docType + sizeBytes + holder + optional hash guard; true byte-proof is the multipart path judges click.

### 3. Terminal immutability (+ Locked gating) — SECURE with 1 LOW residual — `server.js:855-896`
- `TERMINAL = ["Approved","Rejected","Deemed"]` `:875`; `TERMINAL.includes(t.status) && next !== t.status` → 400 `:878-880` with renewal guidance. Idempotent same-terminal re-assert → 200 (double-click safe). `slaStartedAt` never moves on officer touch `:884` (anti-gaming). `stampRenewal` + `recordCompletion` + `appendAudit` on approve/deemed `:887-889`. QA live: `approve→approve` 200 idempotent; `Approved→Queried` 400. Correct.
- `Locked` guard `:868-870`: `Locked + approve/reject/deemed` → 400 with `lockedReason`. Filing stores D-tracks `Locked` when same-app A/B/C predecessors unfinished `:826-837`; `unlockGatedTracks` `:216-230` promotes `Locked→Applied` with fair SLA restart + `unlock:*` audit. Correct.
- LOW residual 3a (carried from `security-final` §6, business-logic, trusted-officer only): `review`/`inspect`/`query` on a `Locked` track are NOT blocked — `review` moves `Locked→Under review`, sidestepping the gate in two steps (review then approve). Impact is workflow-order integrity only (officer already holds approve rights; no privilege escalation, no external attacker gain, single-operator demo). Do NOT fix-loop; P1 one-liner: extend the `Locked` guard to all six actions (or allow only `query`), plus a QA order-test (`review-Locked → 400`).

### 4. Audit — append-only + officer-only read — SECURE (reset exception in §9) — `server.js:128-134,1182-1189`
- `appendAudit(db,actor,action,id)` `:131-134` pushes `{ts,actor,action,id}` only; never edited/deleted in place anywhere (verified all 12 call sites: file, `action:approvalId`, `upload:*`, book/complete-inspection, file-grievance/escalate/resolve, `unlock:*`, `auto-deemed:*`, `auto-escalate`). `GET /api/audit` `:1186` behind `requireOfficer` (401/403 verified by QA). No PATCH/DELETE audit endpoint. `action` strings server-constructed from whitelisted `action` + existing `approvalId`; `upload:*` docType capped 120 chars. Current frontend has no audit UI (JSON API only) so no stored-XSS sink; future audit UI must render via `esc()`.
- `actor` is `authRole()==="officer" ? "officer" : "applicant"` — anonymous applicant writes attribute as `applicant`. Attribution, not an auth boundary. Accept for demo (sessions are now per-login random, strictly better than the retired static tokens).
- LOW note 4a: `db.audit` is unbounded (every mutation appends; only `reset` clears). A long judging day cannot overflow localhost disk, but a P1 cap (e.g. retain last 2000, same pattern as `recordCompletion` 500 cap `:515`) removes the only uncapped growth alongside vault/inspections/applications. Not gating. Only wipe path is `POST /api/reset` → `[]` (explicit, by design — see §9).

### 5. XSS — `esc()` + `<details>` tables — LOW, 3 carried notes + 1 info, no criticals — `public/app.js` whole, `public/index.html`, `public/i18n.json`
- Baseline GOOD: `esc()` (`&<>"`) at `app.js:3` + 107 `esc(` call sites escape titles, sectors, remarks, subjects, updates, vault names, benefits, knowledge Q/A, alerts `x.text` (`app.js:102`), error `e.message` (`:161,332,450,507,539,654`). Zero `<script` substrings in `app.js` (verified count 0). No `eval`/`Function(`/`document.write`/`insertAdjacentHTML`/`outerHTML`/`window.open`/`location.href=` assignment from hash (hash only selects a whitelisted branch `:118-160`). `index.html` has no inline user data. `i18n.json` verified this run: en=64/mr=64, 0 blanks, zero `<script`/`on*=` in values; `kn_search_ph` rendered via `esc()` into double-quoted `placeholder` (`:632`); `brandsub` uses `textContent` (`:96`). `<details>` tables (`:591,595,596`): `<td>${esc(k)}</td><td>${v...}</td>` — key escaped, values numeric from `AN` — SAFE, no new sink.
- `toast()` (`:57-68`) escapes via `esc(msg)`; `alert()` ultimate fallback (`:67`) unreachable in practice (`#toast` exists `index.html:24`) — carried low, keep for robustness.
- Note 5a (low, self-XSS, carried): inspection `date`/`slot`/`appId`/`depts` interpolated without `esc()` — `app.js:384` (tracker detail timeline), `:505` (`loadOffInsp`), `:517` (inspections planner). `slot` validated `3-50` chars server-side (`server.js:1010,1045`) but not charset, so `<img…>` stores and re-renders to the same operator. Requires LAN write + self-view; no remote delivery in single-operator demo. Optional: `esc()` each field + server-side `slot` charset enum.
- Note 5b (low, carried): `aria-label="Risk ${band}, score ${score}"` — `app.js:255` (dashboard) + `372` (appDetail `Risk ${band} ${score}` text). `band` is server-computed enum (Green/Amber/Red), `score` numeric from `riskScore()` — break-out requires server compromise, at which point attacker already owns the data plane. Optional one-word batch fix: `esc(band)` + numeric-coerce `score`.
- Note 5c (low, carried): server-enum interpolations without `esc()` — `app.js:325` (`<td>${a.dept}</td>`), `:375` (`${t.dept}`), `:380` (`needVisit.join`), `:479` (`value="${d.id}"`/`>${d.name}`), `:525-527,549` (sector/size/dept option text). All values are seed `META` enums or server-computed (never free text in this build). Exploitable only if server/META compromised. Defence-in-depth batch fix with 5a/5b.
- Info 5d: `a.id`/`r.appId`/`approvalId`/`g.id`/`i.id` unescaped in text/`onclick`/`id` attributes (`:251-252,256,260,352,370,383-384,485-490,505,517,548,551,554`) — all server-generated `APP-/INSP-/GRV-` ids + `APPROVAL-ID` constants (alphanumeric + hyphen), never free text. Hash-fragment `h.split("/")[2]` (`:140`) is sent to `GET /api/applications/:id`; unknown ids 404 to `esc(e.message)` catch — no direct hash-to-HTML reflection. `bookInsp` JSON arg uses `&quot;` escaping (`:383`); `offAct` selector uses `CSS.escape` (`:494`). Safe for demo.
- `esc()` missing `'` is inert (sinks are text nodes or double-quoted attrs; `onclick="'${id}'"` carries server ids only). Note for future if free text ever enters single-quoted JS context (add `'` → `&#39;`).

### 6. Path traversal / local file — NONE — `server.js:22,25,101-126`
- `DB_FILE = path.join(__dirname,"data","db.json")` fixed; `loadDb`/`writeDbAtomic`/`reset` never take a path from the request. `express.static(path.join(__dirname,"public"))` serves only `public/`. `require.resolve("./data/seed.js")` fixed; atomic-tmp names are `pid.ts.seq.rand` server-generated in the same dir (rename atomicity correct). `validateDocumentInput` rejects `[\\/]`/`..` in `name` (`:365-367`), and the name is never used as a filesystem path regardless. No `../` read/write primitive. No `child_process`, no `eval`, no SSRF (no outbound `fetch`/`axios`/`http.request` server-side; knowledge search is in-process TF-IDF, `limit` clamped `1-10` GET `:721` + POST `:731`).

### 7. Caps / DoS — SECURE with 1 low note — `server.js:24,143,353,515,696-697,943`
- `express.json({limit:"2mb"})` `:24` caps JSON bodies; multipart `express.raw({limit:"12mb"})` `:943` caps wire bytes; per-field caps (`title ≤200` `:796`, `applicant ≤100` `:797`, `remarks/note ≤2000` via `MAX_STR` `:862,1098`, `officer ≤100` `:863,1043`, `docType 2-120` `:377`, `holder ≤120` `:424`, `name ≤255` `:362`, `size ≤10MB` `:353-396`, `slot 3-50` `:1010,1045`, `subject 5-300` `:1084`, `reusedDocs ≤255` `:803`) + enum whitelists (`VALID_TRACK_ACTIONS` `:141`, `VALID_INSP_STATUS` `:142`, dept ids `:1005-1008,1083`) all enforced with 400. Live history capped 500 with double-count guard `:505-521`; sessions capped 200 `:696-697`; `renameSync` atomic writes prevent half-written `db.json`.
- LOW note 7a: `db.audit` + `db.vault` + `db.inspections` + `db.grievances` + `db.applications` are unbounded except via `reset` (only `history-live` and `sessions` are capped). Long judging day cannot realistically overflow localhost disk; P1: cap audit (e.g. last 2000) and vault display pagination. Not gating.

### 8. Secrets — NONE — all targets + `package.json`
- No API keys, connection strings, private keys, or session secrets. Only intentionally-public demo credentials (`udyog@demo.in/demo123`, `officer@maharashtra.gov.in/officer123` at `server.js:38-39`, `app.js:220,223-225`, landing `:185`, login page) — judging-sheet values shown on-screen by design, not secrets. `localStorage` tokens (`us_token/us_role/us_lang/us_dept`) are client-side demo state; no `HttpOnly`/`Secure` cookies by design (N/A — Bearer header, no CSRF cookie surface). No `.env`, no new `Authorization` hardcoding beyond server-minted sessions. `node_modules` untouched. Not a git repo — no history to scan; nothing to rotate. `AUTH_SALT` hardcoded (see §1b) is a demo hash domain-separator, not a deployed secret.

### 9. Open reset (`POST /api/reset`) — LOW, accepted for demo — `server.js:1175-1180`
- Unauthenticated destructive endpoint: wipes `db.json` + audit → `[]` + sessions → `[]` (re-login needed). Anyone with port access (hall LAN, since `app.listen(PORT)` `:1217` with no host binds `0.0.0.0` while log says `localhost`) can wipe demo data. Accepted for demo (footer Reset button `index.html:28` → `resetDemo()` `app.js:107-113` needs it; restores pristine; one click to recover; QA left the server clean). Hall mitigation: trusted network. Future (NOT fix-loop): `requireOfficer` on reset (footer calls it after officer login) or a confirm token; `app.listen(PORT,"127.0.0.1")` for localhost-only demos (keep LAN bind only when QR judging needs it — `ipconfig → 192.168.x.x` flow intentionally needs LAN).
- Same open-port reasoning covers all open-by-design applicant primitives (filing, doc upload to any `APP-*` id, inspection booking, grievance file + `escalate`, all reads, `POST /api/login`): no per-app ownership check (any bearer/no-token can write to any app id). Matches the demo threat model (single operator, localhost, fake seeds); applicant→officer elevation is still blocked (403). Flagging for awareness only — adding RBAC/ABAC ownership is out of scope and must NOT enter the fix loop. Production would need: per-user app ownership, signed short-lived JWT + refresh, rate-limited login, `helmet()` + CSP (`default-src 'self'`, no inline `onclick`), Postgres-backed audit with retention, secrets vault, SBOM/SLSA.

### 10. Headers / CSRF / logging — INFO (production-only gap)
- No `helmet`/CSP/HSTS/`X-Content-Type-Options`, no CORS policy, no rate-limiting beyond login, no structured security-event logging (auth/validation failures not centrally logged; `console.error` on post-response-save failures only). Correct to omit for a localhost same-origin SPA+API demo with no cookies. CSRF: no cookie session to hijack; the only cross-site-reachable mutation is the unauthenticated `POST /api/reset` (see §9 — a malicious page on the same LAN could `fetch(...,{mode:"no-cors"})` it; impact is a one-click-restorable demo wipe). If this ever moves beyond `localhost`, treat as required: `helmet()`, strict CSP, rate-limit `/api/*`, CSRF tokens for cookie flows, structured security-event logging with retention.

## Required Fixes (for dev agents)

**None. Zero critical issues. Do NOT enter the fix loop (0/3 cycles used).**

Optional, non-blocking hardening for a post-shortlist pass (explicitly NOT gating — apply only if a follow-up task requests it; batch with `security-final`/`security-frontend` items):
1. `server.js:868` — extend `Locked` guard to all actions (`review`/`inspect`/`query` → 400 while gated); add QA order-test (closes §3a).
2. `server.js:1175` — `requireOfficer` on `POST /api/reset` (or confirm token); footer Reset calls it after officer login (closes §9 wipe surface).
3. `server.js:131` — cap `db.audit` (e.g. last 2000, same pattern as `recordCompletion` 500 cap) (closes §4a/§7a).
4. `server.js:1217` — bind `127.0.0.1` for localhost-only demos (keep LAN bind only when QR judging needs it).
5. `public/app.js:384,505,517,255,372,325,375,479` — `esc()` inspection `date`/`slot`/`appId`/`depts`, risk `band`/`score`, dept enums; add `'` → `&#39;` to `esc()` (closes §5a-5c).
6. `server.js:45,682` — trust `X-Forwarded-For` only from known proxies; `timingSafeEqual` for hash compare (closes §1b-1c hygiene).
7. Before judging day: `npm audit`, keep `express` on latest 4.x; no SBOM/SLSA for prototype.
8. Production (out of scope): argon2id/bcrypt passwords, signed JWT + expiry + refresh + breached-password checks, per-app ownership (RBAC/ABAC), `helmet()` + CSP, Postgres-backed audit with retention, secrets vault, zero-trust review.

## Chain Handoff

- QA PASS (`qa-full-1-8.md`, 0 critical/high/medium) → Dev-Lead APPROVED (`code-review-full.md`) → **Security SECURE_WITH_NOTES** (no criticals, no fix loop). Chain ends at security per router rules — **do NOT dispatch devops/deploy** (deploy gate: explicit user keyword only).
- Report path: `D:\SIH\udyog-sarthi\.ai\reports\security-full.md` (this file). Prior `qa-full-1-8.md`, `code-review-full.md`, `full-fix-1-7.md`, `security-final.md`, `security-frontend.md`, `security-audit.md` intentionally untouched.
- Sprint DB: not updated (no `task_id` in dispatch — consistent with all prior full-chain reports, non-blocking).
- Hall posture: upload ONLY the two `Udyog-Sarthi-AI-*` deck files; footer Reset + `curl /api/analytics` pre-check (`apps=3 history=38 seed=38 live=0 avgOld=60 avgNew=21`); type logins from DEMO_SCRIPT (success clears rate window); use `http://127.0.0.1:3000` fallback; rehearse never-say list (LLM/OCR/Mongo/DigiLocker-live stay roadmap-only).
