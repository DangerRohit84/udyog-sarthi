# Code Review — Auth Overhaul (Option A Bearer+scrypt RBAC)

Verdict: APPROVED

Date: 2026-09-25 · Reviewer: Development Lead · Scope: auth/RBAC overhaul
Inputs read FIRST:
1. `.ai/reports/qa-report.md` — Verdict PASS 58/58 (incl. 4 bug-fix proofs, static gates + npm test exit 0)
2. `server.js` (1583 lines, full auth/RBAC + domain engine read: lines 1-150, 151-500, 500-899, 898-1247, 1248-1583)
3. `public/app.js` login/register/admin/guards (lines 1-250, 250-449, 660-907)
4. `data/seed.js` users/profiles (247 lines) + `public/i18n.json` EN/MR (215 lines)
Constraint respected: review-only, no implementation fixes applied (per Hard Boundaries).

## Summary

Option A correctly extended: Bearer sessions in `db.sessions` (12h TTL), per-user `crypto.scrypt` + `newSaltHex()` for new users, legacy global-SHA compat for 3 seed demos (`legacy:true`), `sanitizeUser()` stripping `passHash/salt` everywhere, `requireAuth`/`requireRole` with ADMIN-inherits-OFFICER, ownership scoping via `isOwnerApp`+`isStaffRole` (404 no-leak for applicants, 403 for docs/inspections ownership, 403 role gates, 401 unauth, 409 dup, 400 weak-pwd `>=8+digit`, 429 login 5/15min + register 5/hr). Frontend tabs (APPLICANT/OFFICER/ADMIN), guards (`#/officer` OFFICER/ADMIN, `#/admin` ADMIN-only, `blockedCard` + `auth_blocked_*`), admin dept `<select>` from `META.departments` + 6-dept fallback, dept sent in payload, demo banner/table (3 rows, correct `admin@maharashtra.gov.in`), pwd parity frontend+backend `>=8+digit`, i18n EN/MR 104/104 parity. Regression 18/18 preserved (tracker/officer/analytics/schemes/grievance). QA's Bugs #1-4 verified FIXED — concur. No blocking issues. Ready for `security`.

## Quality Gates (Merge Criteria)

- [x] All tests passing — QA 58/58 PASS + `node --check` x3 + `npm test` exit 0
- [x] Code reviewed by 1+ team member — this review (dev-lead)
- [x] No critical/high security findings — none (see notes; demo-password disclosure in `/api/demo/status` is by-design for judging, flagged for security to confirm)
- [x] Documentation updated — `i18n.json` + login_sub/register_sub/auth_no_self_reg/admin_sub all describe Bearer/RBAC correctly; no stale `demo-officer-token` claims (server rejects fixed tokens `server.js:141`)
- [x] Branch up-to-date with main — N/A (prototype, single local change, no conflicts observed)
- [x] Meaningful commit messages — N/A to reviewer; suggest `feat(auth): Option A Bearer+scrypt RBAC, admin officers, dept guard (SIH-26130)`
- [x] Sprint task updated to done — note: sprint DB update skipped (no task_id provided); non-blocking

## Architecture Adherence (Option A, zero-dep) — PASS

- Bearer+scrypt extension, not rewrite: `hashScrypt`/`newSaltHex`/`verifyPassword` (`server.js:47-66`) use `crypto` only, no new deps. `createSessionForUser` caps 200 rows, `mintSessionToken` random 32B, 12h TTL. Fixed tokens rejected (`getBearerToken:141`). Atomic writes preserved (`writeDbAtomic` pid+seq+rand tmp + rename, all persists via `saveDb`).
- Team patterns kept: atomic writes everywhere, validation style (`validEmail`/`validPassword`/`validateChecklistProfile`/`validateDocumentInput` returning `{errs,checks}`), `appendAudit` append-only, no write-on-read (sweeps in-memory, `saveDb` post-response), i18n `T(key, fallback)` EN/MR.
- No password/hash exposure: `sanitizeUser` (`77-81`) strips both; verified on `GET /api/admin/users:959`, `POST /api/admin/officers:988`, `PATCH /api/admin/users:1019`, `POST /api/auth/register:935`, `GET /api/me:942`; `GET /api/demo/status` exposes only `{id,email,role,disabled}` + intentional demo creds (see nit #5). QA live check: 0 `passHash/salt` rows in user list.

## RBAC Matrix — Enforced Backend + Frontend — PASS

| Action | Backend | Frontend | QA proof |
|---|---|---|---|
| Self-register APPLICANT only | `POST /api/auth/register:905-910` role OFFICER/ADMIN → 403, else 400 | tabs + `auth_no_self_reg` note, `doRegister` no role field | role:OFFICER/ADMIN → 403 x2 |
| Create OFFICER | `POST /api/admin/officers` + `requireRole(ADMIN)` + dept must be in `departments` else 400, dup 409 | `admin()` dept select from META + fallback, client guard, payload `{name,email,password,dept}` | 201 + officer login 200, no-dept 400 intact |
| List/disable users | `GET/PATCH /api/admin/users` + `requireRole(ADMIN)`, self-disable 400, disable purges sessions | `admin()` renders scoped list, toggle | count 6, 0 hashes, filter, disable→401, self-disable 400 |
| Applicant isolation | `GET /api/applications` scoped, `GET :id` + `GET :id/track` 404 no-leak, docs/inspections 403 ownership | dashboard/tracker render scoped lists, `blockedCard` | A count 1, B count 0 + 404/403/403 |
| Officer track/audit | `PATCH :id/track` + `requireRole(OFFICER,ADMIN)`, terminal immutability, Locked gate; `GET /api/audit` staff-only | `offAct` + officer queue, `auth_blocked_officer` | applicant PATCH 403 x2, officer audit 200, applicant audit 403, unauth 401 |
| Login/logout/rate-limit | `handleLogin` 5 fails/15min 429 success-clears, `handleLogout` purges token | `doLogin` prefers `/api/auth/login` falls back `/api/login`, `doLogout` hits both | logout→401, unauth 401, 6 bad-pw `[401x5,429]`, fixed token 401 |

## Error Handling — GOOD

401 missing/expired/disabled with actionable `POST /api/auth/login` hint; 403 role vs 404 no-leak correctly split (apps read 404, docs/inspect write 403 — intentional, no id oracle on reads); 409 dup email + dup bytes; 400 weak pwd / bad dept / bad role / immutable terminal; 422 doc validation with `checks`; 429 with window text. No stack traces leaked (all `catch` return generic 401).

## Issues (file:line, severity)

No blocking issues. 0/3 fix cycles used.

Nits (accepted as-is, for security/backlog — do NOT trigger fix loop):

1. `server.js:167-169` — nit — `requireOfficer` wrapper defined but all routes use `requireRole("OFFICER","ADMIN")` directly (dead helper). Keep or delete in cleanup pass; harmless.
2. `server.js:214-229` — nit — no dedicated `requireOwnerOrStaff` middleware; ownership repeated inline (`isOwnerApp`+`isStaffRole` in 6 routes: apps :id/track/docs x2, inspections POST, vault, grievances). Consistent and correct — extraction is refactor, not fix. Suggest `requireOwnerOrStaff(loadFn)` when server.js grows beyond ~1600 lines.
3. `server.js:135-142` — nit — `getBearerToken` also accepts `x-demo-token`/`x-auth-token` legacy headers. Widens surface slightly; QA proves Bearer path. Keep for compat, security to confirm no fixed-token bypass (already rejected line 141).
4. `server.js:99-102` — nit — `loginIp` trusts `x-forwarded-for` (spoofable → rate-limit bypass per-IP). Fine for single-demo-server topology; note for prod (use `trust proxy` + keyed limiter).
5. `server.js:1028-1031` — nit (by-design) — `GET /api/demo/status` returns demo passwords in plaintext for judging convenience. Public, unauthenticated. Accepted for SIH demo; security to confirm risk-accept + prod must remove passwords from response.
6. `server.js:55-57,61-63` — nit — legacy SHA path uses `===`, scrypt path uses `timingSafeEqual`. Correct severity split (legacy demo-only), but unify to `timingSafeEqual` on next touch.
7. `server.js:1583 + monolith` — nit — `server.js` now 1583 lines. Maintainability watch: next feature should split routes (`routes/auth.js`, `routes/admin.js`, `routes/apps.js`) + `middleware/auth.js`. Do NOT split now (risk > benefit pre-judging).

## Maintainability Notes

- SRP/OCP: middleware single-purpose (`requireAuth` 401+attach, `requireRole` 401+403+ADMIN-inherits). No switch-on-type needing Strategy; no fat interfaces; no premature DI. KISS/YAGNI respected — flagging patterns here would be over-engineering.
- Clean Code: `normRole` everywhere (backend `75`, frontend `55-56`) prevents role-case drift (QA regression risk table agrees — do not compare raw `us_role`). `slaStartedAt` immutability comment + enforcement (`1217-1218`) is exemplary anti-gaming documentation. `WHY` comment on dept select (`app.js:699-700`) teaches juniors the server contract.
- DRY: dept fallback list duplicated (`app.js:702-709` mirrors `seed.js:20-27`). Intentional offline resilience — keep in sync via META (code already prefers META). Rule of Three not yet met for owner-check extraction — wait until 3rd new owner route.
- Frontend: tabs + placeholders (no prefilled password `value=`), `esc()` on all interpolations, no inline `<script>` (explicit inits after `innerHTML`), `blockedCard` links to login without forced nav (reason stays visible). `adminCreate`/`doRegister` share pwd rule + `register_err_length` — parity proven.
- Perf: no N+1 (JSON file, `enrichApp` per req is O(tracks)), TF-IDF O(corpus) fine at n=60, sessions swept on write, history capped 500 live rows. No p99 action needed for demo scale.

## Mentoring Notes

- Why 404 vs 403? Reads use 404 (don't confirm existence to probers), writes use 403 (caller already knows id from own list — clearer UX). Copy this split for every new owner route.
- Why `sanitizeUser` destructures? `const {passHash,salt,...rest}=u` can never forget a new secret field the way an allowlist can. Use this pattern for every user return.
- Why ADMIN inherits OFFICER? One line (`193-194`) removes an entire class of "admin blocked from officer queue" bugs. When adding roles, extend the set — don't add `||` at every call site.
- Why `slaStartedAt` never moves? Judges probe "officer touches to reset clock". The comment at `1217` + backfill-only logic is the defense — preserve it.

## Chain Handoff

- QA PASS (58/58) → Dev-Lead APPROVED → ready for `security` audit per chain. No dev fix loop required.
- Report path: `D:\SIH\udyog-sarthi\.ai\reports\code-review.md` (this file). `qa-report.md` untouched.

---
# Landing Review — portal landing + auth UI

Verdict: APPROVED

Date: 2026-09-25 · Reviewer: Development Lead · Scope: portal landing + auth UI
Inputs read FIRST:
1. `.ai/reports/qa-report.md` — Landing QA PASS (L1 13/13, L2 11/11, L3 8/8, L4 134/134, L5 47/47 live, static gates + npm test exit 0)
2. `public/app.js` landing 262-320 + login 322-428 + register 430-482 + router/guards 1-256 (full read)
3. `public/styles.css` full 136 lines (portal tokens 77-136, focus 7, reduced-motion 136, responsive 121-135)
4. `public/i18n.json` EN/MR full 275 lines — verified EN=134 MR=134 missing-both=[] via python re-check
5. `public/index.html` footer 26-29 (SIH 26130 + SEED/LIVE legend + Reset)
Constraint respected: review-only, no implementation fixes applied (per Hard Boundaries).

## Summary

Landing + login/register are portal-coherent, maintainable, and contract-safe. Navy+saffron hero with single signature (.tricolor + saffron ticks), live stats from GET /api/analytics only (SEED avg + LIVE filed, offline fallback), trustbar 6 depts from META.departments + 6-dept fallback sliced to 6, how-it-works 3 cards, schemes preview live POST /api/schemes/match (Food Processing/Small/180, top-3 eligible, never blocks on catch), tracker teaser (#land_appid + openLandingTracker). Login tabs APPLICANT/OFFICER/ADMIN (role=tablist, aria-selected, us_pending_role sync incl. legacy officer), per-tab placeholder only (never value=), submitLogin stays email-regex + non-empty ONLY (no min-8 block — demo123 7 chars passes, contract proven live 200), staff auth_no_self_reg lock note, inline #lg_err role=alert + spinner + disabled restore, role-routed success (OFFICER to officer, ADMIN to admin, else dashboard). Register validates name/email/8+digit/confirm/optional 10-digit mobile with spinner, contract POST /api/auth/register. Guards intact (#/admin ADMIN-only, #/officer OFFICER/ADMIN, blockedCard no forced nav, nav links gated, normRole uppercase everywhere). i18n 134/134 parity re-proven + all 120 T() keys used present (landing/auth subset 64/64). Responsive (900px hero 1col/trustbar 3col/howgrid+auth 1col, 480px paddings), focus-visible 3px #ffb35c + skip:focus, prefers-reduced-motion kills transition/animation, 44px touch targets, esc() everywhere, zero prefilled creds. QA L1-L5 concur. No blocking issues. Ready for security.

## Quality Gates (Merge Criteria)

- [x] All tests passing — QA Landing PASS (L1 13/13 + L2 11/11 + L3 8/8 + L4 134/134 + L5 47/47) + node --check x3 + npm test exit 0
- [x] Code reviewed by 1+ team member — this review (dev-lead, landing scope)
- [x] No critical/high security findings — none (demo creds as code in separate Demo card by design, inputs placeholder-only; carried as nit #5 for security risk-accept)
- [x] Documentation updated — land_*/login_*/register_*/demo_*/auth_* strings describe Bearer 12h/RBAC/demo correctly in EN+MR; footer + landing-foot both carry SIH 26130 + SEED/LIVE legend
- [x] Branch up-to-date with main — N/A (prototype, single local change, no conflicts observed)
- [x] Meaningful commit messages — N/A to reviewer; suggest feat(landing): portal hero + trust + auth UI with i18n 134/134 (SIH-26130)
- [x] Sprint task updated to done — note: sprint DB update skipped (no task_id provided); non-blocking

## Design Coherence — PASS

- Tokens --saffron/--navy reused; portal-hero gradient matches topbar/hero language; one signature only (tricolor rule + saffron tick) — no second accent competing.
- Sections reuse .card/.btn/.badge/.tbl/.hint — .trust/.howcard/.auth-card/.track-teaser/.landing-foot are thin compositions, not a parallel system.
- CTAs map 1:1 to funnel (register, wizard, tracker); 60-sec tour + enterDemo note + us_token 12h + Reset note teach judges without clutter.
- index.html:27 footer and app.js:315 landing-foot agree (SIH 26130 + SEED/LIVE + data/db.json).

## Code Maintainability — PASS

- esc() on every interpolation incl. schPreview/depts/statSeed; T(k,fb) with English fallback everywhere (offline-safe); WHY comments on landing + login contract + no-inline-script.
- No inline script-tag — dynamic inits explicit after innerHTML (bindLoginRole/loadDemoStatus/genChecklist/matchSchemes); window exports consistent with SPA pattern.
- META cached + fallback dept list; schemes preview try/catch with muted fallback — landing never blocks on API.
- DRY: dept fallback mirrors seed.js (intentional, prefers META first); pwd rule only in doRegister/adminCreate + backend register (login deliberately excluded).
- SRP (landing/login/register/submitLogin/doRegister single-purpose); no switch-on-type needing Strategy; Boy Scout applied.

## Guards / RBAC / Backend Contract — PASS (preserved)

- Router app.js:205-206 #/admin ADMIN-only + isLoggedIn, 231-232 #/officer OFFICER/ADMIN + isLoggedIn, dashboard/tracker/docs gated isLoggedIn||isDemo, blockedCard links to #/login without forced nav; server still enforces 401/403.
- Nav 137-138 officer/admin links gated by normRole; curRole()=normRole(role()) prevents role-case drift — do not compare raw us_role.
- submitLogin 381 email-regex + non-empty ONLY — verified NO length<8 block; live udyog@demo.in/demo123 = 200 proves contract; prefers /api/auth/login falls back /api/login, stores us_role/us_token/us_token_exp/us_email, routes by role + 12h toast.
- doRegister 458-466 name/email/p1<8-or-nodigit/confirm/phone rules + spinner; contract POST /api/auth/register kept (471); success to #/dashboard.
- Landing 264 GET /api/analytics, 277 POST /api/schemes/match, 265 meta(), 423 GET /api/demo/status best-effort — all public/best-effort, no per-user leak pre-auth.

## i18n 134 Parity — PASS (re-proven)

- Python re-check (utf-8): EN=134 MR=134 missing-in-MR=[] missing-in-EN=[]; T()-used in app.js=120, missing-in-EN=[]; landing/auth subset 64/64 fully translated incl. register_err_phone/login_err/login_have_no.
- toggleLang() + documentElement.lang re-renders via T() for every landing/auth string; T(k,fb) fallback covers drift but CI should assert EN==MR (now 134/134).

## Responsive / Focus / Reduced-Motion — PASS

- media(max-width:900px) hero 1col, trustbar 6 to 3col, howgrid/auth 1col; media(max-width:480px) paddings/track 1col/statgrid 1col — covers 360px phones.
- focus-visible 3px #ffb35c (styles.css:7) + .skip:focus left:0; main#view tabindex=-1 + v.focus preventScroll on every route; role=tablist/tab aria-selected, #lg_err/#reg_err role=alert aria-live=assertive, #land_appid aria-label, sect aria-label, autocomplete/inputmode attributes.
- prefers-reduced-motion:reduce kills transition/animation (btn transition + spin); .tblwrap overflow-x:auto keeps 640px demo table usable on mobile.

## No Creds Leak — PASS

- Grep value= with demo123/officer123/admin123 in public/* = 0 hits; all password inputs placeholder bullets only; email inputs placeholder only; bindLoginRole legacy branch never fills password.
- Demo creds live only as code in separate Demo card table (3 rows, correct admin@maharashtra.gov.in) — by design for judging; inputs stay placeholder-only. Do not move creds into value=.

## Issues (file:line, severity)

No blocking issues. 0/3 fix cycles used.

Nits (accepted as-is, for security/backlog — do NOT trigger fix loop):

1. public/app.js:444 — low — register second card subtitle reuses T(register_sub) instead of T(demo_sub) — Demo card on #/register shows duplicated applicant copy. EN/MR parity unaffected. Fix: swap to demo_sub on next touch.
2. public/app.js:370,347,437 — low — togglePw aria-label hardcoded English + initial aria-label Show password on both toggles while visible label uses T(login_show/login_hide). MR screen-reader gap. Fix: T() for aria-labels too.
3. public/app.js:406-417 — nit — bindLoginRole dead (#lg_role no longer rendered, tabs replaced select); kept as no-op guard for cached HTML. Harmless — delete on cleanup pass.
4. public/app.js:314,317-320 — nit — tracker teaser hint says login/Demo required but openLandingTracker navigates regardless; route blockedCard handles it. Consider inline link to #/login in hint.
5. public/app.js:355-357 (+ server.js demo/status prior) — nit (by-design) — Demo card + GET /api/demo/status expose demo passwords in plaintext for judging. Accepted for SIH demo; security to confirm risk-accept + prod must remove passwords.

## Mentoring Notes

- Why login must NOT copy register 8+digit guard: demo123 is 7 chars by design. submitLogin stays email+non-empty only; length rule lives in doRegister/adminCreate + backend register. Copying it into login locks out all 3 demo accounts — QA regression-risk table calls this out. Preserve the split.
- Why normRole().toUpperCase() on every guard: backend is UPPERCASE, legacy seeds were lowercase. One helper removes role-case drift. Never compare raw us_role.
- Why schemes preview never blocks: landing wraps POST /api/schemes/match in try/catch with muted fallback + finder link. First impression must survive a stopped server — copy this pattern for future landing widgets.
- Why Demo creds stay as code not value=: autofill + shoulder-surfing + password-manager pollution. Separate card = explicit judge opt-in; placeholders = no accidental submission. Keep separation.

## Chain Handoff

- QA Landing PASS (L1-L5) → Dev-Lead APPROVED (this review) → ready for security audit per chain. No dev fix loop required.
- Report path: D:\SIH\udyog-sarthi\.ai\reports\code-review.md (this file, appended). qa-report.md untouched.

---

# Code Review — Submission Readiness SIH 26130 IDEA (2026-09-27)

Verdict: CHANGES_REQUESTED (docs/placeholders only — no code logic blockers)

Reviewer: Development Lead · Scope: submission readiness for SIH IDEA PPTX+PDF upload
Inputs read FIRST (per Workflow):
1. `.ai/reports/qa-report.md` — Verdict PASS, npm test exit 0, lint exit 0, live boot health/meta/login/eval/analytics verified
2. `README.md` (116 lines), `DEMO_SCRIPT.md` (53 lines), `SUBMIT_CHECKLIST.txt` (24 lines), `package.json` (18 lines), `server.js` quick scan (lines 1-979 + QA evidence for rest)
3. Root listing: 14 entries — PPTX + PDF present, no LICENSE, not a git repo, no docs/ folder
Constraint respected: review-only, zero code fixes applied (per Hard Boundaries).

## Summary

App is demo-healthy and honest-safe: vanilla JS SPA + Express, 1 dep, offline, `npm start → localhost:3000`, syntax+JSON gate green, live probes green (health ok, 6 depts/12 approvals, login 64-hex 12h, eval 0.75 ungamed, analytics seedCount 38 / 60→21 SEED-frozen). Docs are judge-ready (README honesty-first, DEMO_SCRIPT 60-sec + 2-min + break-fix table, SUBMIT_CHECKLIST 10 items). Deck sizes safe (PPTX 0.67 MB + PDF 0.46 MB < 5 MB). No prod secrets — only by-design demo creds demo123/officer123.

NOT yet submittable: SUBMIT_CHECKLIST placeholders are still open (Team ID SIH26130-XXX, College ___, portal dropdown/theme/category/female-member verification, PDF re-export after edits). These are 20-min manual pre-upload tasks — portal will reject or ding an XXX/___ deck. Fix those, re-export PDF, re-verify <5 MB, then upload ONLY the two Udyog-Sarthi-AI-SIH26130-IDEA-PPT.* files.

## Quality Gates (Merge Criteria — submission lens)

- [x] All tests passing — `npm test` exit 0 (3× node --check + i18n JSON parse), `npm run lint` exit 0, `npm run build` missing-script EXPECTED (no build step declared README:19)
- [x] Code reviewed — this review (dev-lead, submission scope)
- [x] No critical/high security findings — none in runtime paths; demo-creds exposure by-design for offline judging (must strip for pilot/prod)
- [ ] Documentation updated — README/DEMO_SCRIPT i18n 64-keys claim is stale (measured 134/134); update before stage to avoid Q&A mismatch
- [x] Branch up-to-date — N/A (not a git repo — see process note)
- [x] Meaningful commits — N/A (no repo); suggest `git init + initial commit` before further edits (non-blocking for portal zip)
- [ ] Sprint task updated — skipped (no task_id); non-blocking

## Issues (file:line, severity)

### Critical — MUST fix before portal upload (blocks submission, ~20 min)

1. `SUBMIT_CHECKLIST.txt:6-7` — Critical — Team ID still `SIH26130-XXX` placeholder. Ctrl+H in PowerPoint: title slide + all 5 header ovals + S6 footer → allotted ID. An XXX deck reads as incomplete.
2. `SUBMIT_CHECKLIST.txt:9-10` — Critical — College still `___ (fill before upload)`. Replace Slide 1 with full `College - <Name>, <City>`.
3. `SUBMIT_CHECKLIST.txt:16-17 + :7` — Critical — Theme/category exactness: Slide 1 says `Theme - Miscellaneous | PS Category - Software`. Match portal dropdowns EXACTLY to PS SIH26130 wording; fix slide if portal differs, then re-export PDF + confirm <5 MB (currently 0.67/0.46 MB safe to re-export).
4. `SUBMIT_CHECKLIST.txt:11-15` — Critical/process — Member names via portal (PPT correctly has NO names — do NOT add a names slide, would break 6-slide rule) + female-member rule (>=1 female if team of 6). Verify in portal entry before submit. No PPT change.
5. `SUBMIT_CHECKLIST.txt:8 + :22` — Critical/process — Upload ONLY `Udyog-Sarthi-AI-SIH26130-IDEA-PPT.pptx + .pdf`. Never upload `.bak` / `.ai/archive/` vision 8-slide file. Carry USB + 6 PNGs + PDF on phone backup.

### Important — Must fix before stage / demo (judge-trust, not portal-blockers)

6. `README.md:45 + :106 + DEMO_SCRIPT.md:47` — Important/doc — i18n key-count drift: docs claim `64 keys EN+MR`, QA measured `en=134, mr=134, match=true, zero blanks`. Counts grew; update all three lines to `134 keys` to avoid judge Q&A mismatch ("you claim 64 but file has 134?"). 2-min edit, no code change.
7. `D:\SIH\udyog-sarthi:1` — Important/process — not a git repository (`git rev-parse` exit 128). Portal accepts folder/zip so not a blocker, but zero history/rollback. `git init + initial commit` recommended before any further edits. Do NOT `npm update` on stage (express ^4.19.2 floating; node_modules present + working).
8. `server.js` + `data/db.json` — Important/process — `npm test` is syntax-only (no unit asserts); `data/db.json` (53,981 B, gitignored by design) mutates on every write. Before judging: `POST /api/reset` → verify `apps=3, history=38, corpus=60` + backdated FIRE-PROV/GRV-881 triggers, then boot+health+login+eval+analytics probe. Any `server.js` edit needs same re-verify.
9. `DEMO_SCRIPT.md:3-4` — Important/process — QR not bundled: get hall Wi-Fi IP via `ipconfig`, QR-encode `http://192.168.x.x:3000`, stick on slide 1 + keep USB + 60-sec screen-record backup. Speak `Single Window on port 3000 — QR on slide 1`. Fallback `http://127.0.0.1:3000` if `localhost` IPv6-broken.

### Minor / Nice-to-have — After submission or pre-public-release (do NOT delay upload)

10. `D:\SIH\udyog-sarthi\LICENSE:1` — Minor — LICENSE missing (file absent). SIH IDEA upload does not require it; add MIT/proprietary before any public/GitHub release.
11. `docs/` folder absent — Minor — explicitly covered by DEMO_SCRIPT + .ai/reports; no action for IDEA 6-slide format.
12. `start.ps1` (59 lines) — Minor — read verbatim OK (checks Node/npm, opens localhost:3000, runs npm start). Prior inline tokenizer probe failed on quoting, not on file. No action; keep USB-boot path.
13. `data/db.json` + `.ai/archive/` — Minor — correctly gitignored (`.gitignore` 6 lines correct), correctly out of root. Root is clean (ONLY the two IDEA-PPT.* files). Ignore root `aadhar.pdf` 0 B — never upload.

## Mentoring Notes

- Why placeholders block but code does not? Portal reviewers triage on deck completeness in <60 sec. An XXX/___ deck signals unfinished even with a green `npm test`. Code health earns the demo; deck completeness earns the shortlist. Fix the 20-min checklist first.
- Why 134 vs 64 matters on stage? Judges probe one number and follow the file+line. Claiming 64 when `i18n.json` parses 134/134 looks gamed even when the growth is honest work. Update the three doc lines — honesty-first means counts match files.
- Why reset-before-judging is non-negotiable? LIVE counters move with filings by design (SEED headlines frozen 60→21 over 38 rows, LIVE reported separately). A dirty `db.json` from hallway testing shows drift a judge will question. One footer click (`POST /api/reset`) restores the rehearsed breach/escalation beats.
- Why no `git` is okay today but risky tomorrow? Portal takes a zip, so history is not a gate. But without `init + commit` every pre-stage edit is unrecoverable. Commit once placeholders + i18n-count fixes land, then freeze `node_modules` (no update on stage).

## Chain Handoff

- QA PASS (syntax+JSON gate + live probes) → Dev-Lead CHANGES_REQUESTED (placeholders/docs only, 0 code defects) → send must-fix list (items 1-5 + 6) back to submitter; no dev-agent fix loop required (manual PPT/portal tasks, 2-min doc edits).
- Report path: `D:\SIH\udyog-sarthi\.ai\reports\code-review.md` (this file, appended). `qa-report.md` untouched. `server.js` / docs unmodified by reviewer.
