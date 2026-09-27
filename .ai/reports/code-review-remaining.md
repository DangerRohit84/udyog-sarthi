# Code Review — Remaining (code only, PPT/PDF EXCLUDED)

Verdict: APPROVED

Date: 2026-09-27 · Reviewer: Development Lead · Scope: SIH demo submission, code only
Inputs read: `.ai/reports/qa-remaining.md` (FAIL→1 HIGH), `.ai/reports/qa-remaining-verify.md` (PASS), `README.md` (116 lines), `DEMO_SCRIPT.md` (53 lines), `SUBMIT_CHECKLIST.txt` (24 lines, PPT lines ignored), `server.js` quick scan (1583 lines, head + reset route + demo/status + grep), `public/app.js:165-166` fix verified, `package.json`, `public/index.html` (32 lines), `.gitignore`, `start.ps1`
Not touched: PPT/PDF (per request — no `.pptx`/`.pdf` opened, edited, or judged).

QA grounding (accepted as evidence, not re-run):
- `qa-remaining.md`: 12/12 files present, `npm test` 0, `npm run lint` 0, boot+health+meta+3 logins+eval+analytics+search+checklist400+static200 verified; 1 HIGH (`public/app.js:166` bare `POST /api/reset` → 401) + 1 LOW (README 64-keys drift).
- `qa-remaining-verify.md`: Verdict PASS — `COUNT_DEMO1=1 COUNT_BARE=0`, `COUNT_134=3 COUNT_64KEYS=0`, `en=134 mr=134 blanks=0`, `EXIT_TEST:0 EXIT_LINT:0`, `RESET_DEMO1 200 {ok:true}`, `ANALYTICS 38/38/0`, `BARE 401 (guard, by-design)`. Both must-fix items VERIFIED FIXED.
- This review confirms the fix is present on disk (`public/app.js:166` now `await api("POST", "/api/reset?demo=1")`) and the guard in `server.js:1528-1541` is correct.

## Strengths (ship these)

1. **One-command offline demo.** `express ^4.19.2` only dep, `PORT 3000`, no build/DB-server/internet, `data/db.json` file store, `start.ps1` (Node check → conditional `npm install` → open browser → `npm start`). Ideal for hall judging.
2. **Honesty is load-bearing.** README `Honesty first` + `*Seed projection` + `Banned until built` + SEED-frozen vs LIVE-split analytics (`server.js:1136-1173` per README) + TF-IDF `no LLM/embeddings` strip. Matches DEMO_SCRIPT banned-words list. Shortlist-safe posture.
3. **Auth hardened for a demo.** scrypt per-user + legacy SHA compat, 64-hex `SHA256(email:random:time)` 12h sessions capped 200, fixed `demo-*-token` explicitly rejected (`server.js:141`), 401/403/429 paths, real `POST /api/logout`. QA proved 3 logins + fixed-token 401.
4. **Server doesn't trust the client.** Doc validator re-checks ext/size≤10MB/expiry/holder → `422` ignoring client `passed`; checklist `400` on `{}`; officer-only PATCH guarded; `express.json({limit:"2mb"})`. Correctness + security basics right.
5. **SLA enforcement actually fires.** Immutable `slaStartedAt` + 60-sec + on-read sweeps → `Deemed` + Filed→Nodal→Secretary; backdated FIRE-PROV (24d/21d) + GRV-881 (8d) fire on first read after reset. The demo beat works.
6. **Measured retrieval, not bluff.** 60-article TF-IDF cosine + tag boost, `GET /api/knowledge/eval` 8-query `6/8=0.75` with ungamed near-synonym misses (K03→K40, K22→K23), corpus echoed in every search meta. Matches README P@1 claim.
7. **i18n parity.** `public/i18n.json` valid JSON `en=134 mr=134 match=true blanks=0`; README + DEMO_SCRIPT now say 134 (3 hits, 0× `64 keys` — residual `64-hex` is token length, correctly ignored).
8. **Atomic persistence + safe reset.** `writeDbAtomic` (unique tmp + rename) for all writers; `POST /api/reset?demo=1` public demo reset vs ADMIN-token otherwise; footer `resetDemo()` now hits the public path + clears local session + toasts + routes home.

## Issues (file:line, severity) — code only, no PPT

### Critical — none open
- Prior HIGH `public/app.js:166` bare-reset 401 → VERIFIED FIXED on disk + QA live `200 {ok:true}`. No other critical (no crash, no data loss, no auth bypass, no unhandled write path) found in this scan.

### Important (non-blocking for submit, fix or handling before/on stage)

1. **Important — `DEMO_SCRIPT.md:11` reset line still says bare `POST /api/reset` (ambiguous).** Body says `footer Reset demo data → POST /api/reset → clean…`. Frontend now correctly calls `POST /api/reset?demo=1`; server bare without token is 401 by design. A judge/operator copy-pasting the bare curl gets 401. Fix (doc-only, 1 line): change to `POST /api/reset?demo=1`. Workaround today: footer button works; curl must include `?demo=1`. Not re-failing QA (code is correct, doc lags).
2. **Important — `README.md:93` API table `POST /api/reset → restore seed` omits `?demo=1` / ADMIN nuance.** Same class as above. Table is correct at a glance but a cold reader misses the guard detailed at `server.js:1528-1541` and `README:70`. Doc-only: `POST /api/reset?demo=1 (public demo) / + ADMIN Bearer otherwise`. Non-blocking.
3. **Important — test coverage is syntax-only.** `npm test` = 3× `node --check` + JSON parse. SLA sweeps, TF-IDF ranking, 401/403/429, 422 validator, gate unlocks NOT covered (QA flags this; this review agrees). Accepted for SIH demo (live probes compensate), but: do NOT refactor `server.js` tonight — any edit must be followed by boot+health+login+eval+analytics probe + `POST /api/reset?demo=1` restore. Non-blocking, process gate.
4. **Important — zip/ship hygiene (not a code bug, blocks a clean submit if ignored).** Root currently holds code + `node_modules/` + `Udyog-*.pptx/.pdf` + (gitignored) `data/db.json`. For a code zip: exclude `node_modules/` (rebuilt via `npm install`), exclude `data/db.json` (auto-created from seed; shipping a dirty 39-row copy breaks the breach replay), exclude PPT/PDF + `.ai/archive/` + `*.bak/*.tmp`. `.gitignore` already covers `node_modules/`, `data/db.json`, `*.bak`, `.ai/archive/`, `*.tmp` — zip tool must honor it (portal zip ≠ git). Reset to `38/38/0` immediately before zipping. Non-blocking, operator checklist (see Submit/Zip below).

### Minor / Nits (accept as-is for SIH; backlog after)

1. **Minor — `server.js:1023-1032` `GET /api/demo/status` returns demo passwords in plaintext, unauthenticated.** By-design for judging convenience (prior reviews risk-accepted). No hashes/tokens exposed (`users` mapped to id/email/role/disabled only). Keep for SIH; prod must remove passwords from response. Security to note, not to gate.
2. **Minor — `server.js:139` legacy `x-demo-token`/`x-auth-token` headers accepted (then fixed tokens rejected at `:141`).** Compat widening, no bypass (rejection verified). Keep; security to confirm.
3. **Minor — not a git repo (`fatal: not a git repository`).** SIH portal takes zip so not a blocker; `git init + commit` recommended for rollback. Process only.
4. **Minor — `LICENSE` absent, `.env/.env.example` absent.** Correct to omit: SIH upload doesn't need LICENSE; no dotenv/PORT default 3000/no secrets so no `.env` needed. Add LICENSE only before public/GitHub release.
5. **Minor — `express ^4.19.2` caret, no lock-pin audit.** `node_modules` present and working on Node 24. Do not `npm update` on stage. Backlog: pin or vendor after SIH.
6. **Minor — single-file God concern (`server.js` 1583 lines: gates+completeness+renewals+history+audit+TF-IDF).** ACCEPTED for single-file prototype — splitting tonight adds integration risk for zero screening ROI (consistent with prior review). No SOLID violation requiring action (no type-switch → Strategy need, no fat interface, no DI need). Names intent-revealing, magic numbers tabled.
7. **Minor — `data/db.json` mutates on read (FIRE-PROV auto-deem +1 live row → 39).** By-design (sweep), restored by reset. Always reset before judging/zipping. QA + this review aligned.

## Quality Gates (merge/submit criteria — code only)

- [x] All tests passing (`npm test` 0 + `npm run lint` 0 per QA verify; this review did not re-run — evidence accepted)
- [x] Code reviewed (this report; prior HIGH + LOW verified fixed on disk)
- [x] No critical/high security findings (scrypt/sessions/401/403/429/422/2mb cap; demo-password disclosure risk-accepted for SIH)
- [x] Documentation updated (README 134-keys ×2 + file tree, DEMO_SCRIPT 134-keys + honesty script; two reset-line nits above are non-blocking doc lags)
- [x] Branch up-to-date — N/A (not a git repo; no merge conflict surface)
- [x] Meaningful commits — N/A (no repo; recommend `git init + commit` post-submit)
- [x] Sprint task updated — N/A (SIH submit flow)

## Is remaining okay to submit / zip? — YES (code is submittable)

**Yes — ship the code as-is.** No must-fix code change remains. The two prior must-fix items are closed and verified. The Important items above are doc wording + operator hygiene, not code defects. Do NOT touch PPT (out of scope, untouched).

### Pre-zip / pre-stage operator checklist (5 min, exact)

1. `POST /api/reset?demo=1` → `{"ok":true}` → `GET /api/analytics` confirms `apps=3 history=38 (seed=38 live=0) corpus=60 avgOld=60 avgNew=21`.
2. Zip code ONLY: `server.js`, `package.json` (+`package-lock.json`), `data/seed.js`, `public/` (`index.html`, `app.js`, `styles.css`, `i18n.json`), `README.md`, `DEMO_SCRIPT.md`, `SUBMIT_CHECKLIST.txt`, `start.ps1`, `.gitignore`. EXCLUDE: `node_modules/`, `data/db.json`, `*.pptx/*.pdf`, `.ai/archive/`, `*.bak/*.tmp`, `.ai/reports/` (optional — include only if portal asks for evidence; never include dirty db).
3. Unzip test on a clean folder: `npm install` → `npm start` → `http://127.0.0.1:3000` → footer Reset → wizard file → tracker breach → officer query → analytics LIVE moves. (`localhost`→`127.0.0.1` fallback per DEMO_SCRIPT.)
4. On stage: Reset → open `#/tracker`/`#/app/APP-2026-0157` (sweep fires on read) → breach visible; Reset → `#/grievances` → GRV-881 Nodal. Never `npm update`. Carry USB backup (PPT/PDF handled by deck owner — not this review).
5. After SIH (not tonight): `git init + commit`, pin express, add LICENSE if publishing, expand `npm test` beyond syntax, tighten DEMO_SCRIPT:11 + README:93 reset lines, remove passwords from `/api/demo/status`.

## Mentoring Notes

- **Why APPROVED with open nits:** Dev-Lead gates on *judge-visible failure*, not doc polish. The only judge-visible failure (footer Reset 401) is fixed and live-verified. Remaining items fail gracefully (doc ambiguity, zip hygiene) and have calm on-stage recoveries. Holding the submit for them would trade certain delivery for negligible quality gain — wrong trade before a portal deadline.
- **For the dev who fixed `app.js:166`:** good minimal diff — one query string, zero behavior change elsewhere, cleared session + toast + route preserved. That's the Boy Scout + Two-Hats discipline (fix hat, no refactor mixed in). Keep CLs this small.
- **For the team:** `npm test` being syntax-only is the top process debt. It passed while a 401 shipped — tests didn't cover the write path. Post-SIH, add 5 live contract tests (reset-demo1 200, bare-reset 401, checklist `{}` 400, login→Bearer→officer-approve 200, eval accuracy parsed) so the next one-line bug is caught before QA. No framework needed — plain `node` fetch asserts in `test/` keep the 1-dep story.
- **Blameless note:** the bare-vs-`?demo=1` mismatch is a *systems* gap (route guard + frontend + doc evolved separately, no contract test pinning the pair). Fix the system (contract test + doc line), not the person. Same for `db.json`-dirties-on-read — file-store physics, handled by reset discipline, roadmap Postgres.
- **What to say on stage (30s):** "Rule engine + TF-IDF retrieval with measured P@1 0.75 (no LLM) + metadata validation that 422s forgeries + SLA sweeps that mint deemed approvals + live-vs-seed counters. Single dep, offline, one-click start. Mongo/OCR/SMS/LLM are Phase-2 with file+line. Stars are seed projection — pilot to measure." Point at `server.js:354-430` (validator), `:524-597` (sweeps), `:599-667` (TF-IDF).

---
Evidence: `app.js:166 /api/reset?demo=1` on disk; `server.js:1528-1541` guard correct; QA verify `COUNT_DEMO1=1 COUNT_BARE=0 COUNT_134=3 COUNT_64KEYS=0 en=134 mr=134 EXIT_TEST:0 EXIT_LINT:0 RESET 200 ANALYTICS 38/38/0`; prior reports `.ai/reports/qa-remaining.md`, `.ai/reports/qa-remaining-verify.md`; PPT/PDF untouched.
