# Selection Fit — Brutal Audit for SIH 26130 (Udyog Sarthi)

**Date:** 2026-09-27 · **Auditor:** Product Manager · **Stance:** harsh, no sugarcoating, no guarantee
**Inputs read FIRST:** `README.md` (116 lines), `DEMO_SCRIPT.md` (53 lines), `SUBMIT_CHECKLIST.txt` (24 lines), `.ai/reports/qa-remaining-verify.md` (PASS 2026-09-27), `.ai/reports/code-review-remaining.md` (APPROVED 2026-09-27), `server.js` head 1-150 + grep (1583 lines total), `data/seed.js` head 1-80 + counts, `package.json` (1 dep express), `public/index.html` (32 lines), `public/` sizes, `.ai/reports/shortlist-win-truth.md`, `.ai/reports/sih-benchmark.md`, `.ai/reports/project-verdict.md` (4.6/10 on 2026-09-09), `.ai/reports/prototype-audit.md` (5.5/10), `.ai/reports/ppt-submit-ready.md`
**Live counts verified this run:** seed `knowledge=60 (K01-K60)`, `history=38`, `apps=3`, `insp=2`, `grv=2`, `approvals=12`, `depts=6`, `schemes=6`; `i18n en=134 mr=134 blanks=0`; `server.js 1583 lines` (was 254 on 09-09, 697 mid-fix); `public/app.js 85151 B`, `styles.css 11954 B`, `index.html 1665 B`; `db.json 52431 B`; `qa-remaining-verify PASS` (`EXIT_TEST:0 EXIT_LINT:0 RESET_DEMO1 200 ANALYTICS 38/38/0 EVAL 6/8=0.75 corpus 60`); `code-review-remaining APPROVED`
**PS 26130 in one line:** Govt of Maharashtra — efficiency in streamlining industrial approvals, compliance, access to support services. NOT another portal. Wants intelligent layer: custom checklist, doc pre-validation, verified reuse, parallel workflows, inspection planning, SLA+deemed+escalation, single dashboard (approvals/renewals/incentives), knowledge engine, risk scrutiny, grievance escalation, delay analytics.

> **No one can guarantee selection or win. Anyone who does is lying. This report gives odds + kill-shots + legit fixes, not promises.**

---

## 1. Does it solve 26130? Strong vs Missing vs Typical SIH Winners

### Verdict: PARTIALLY. Screens for all 5 outcomes, engines for ~3.5. Internal-bubble grade, not finale grade.

**What is genuinely real now (credit — verified, not praise):**
- One-command offline: `express ^4.19.2` only, `PORT 3000`, no build/DB/internet, `data/db.json` file store, `start.ps1`, `POST /api/reset?demo=1` restores `apps=3 history=38 corpus=60`. Hall-proof. Keep at all costs.
- Honesty architecture: `*Seed projection` + `LIVE vs SEED` split (`avgOld=60 avgNew=21` frozen over 38 rows, `avgNewLive/liveHistoryCount` moves). `GET /api/analytics` excludes `live:true` from SEED. Banned-words list in DEMO_SCRIPT. This is load-bearing and rare — most teams fake numbers.
- Server does not trust client: doc validator re-checks ext/size<=10MB/expiry/holder ? `422` ignoring client `passed` (`server.js:354-430` per README, MIME sniff + multipart + hash guard `:437-497`); checklist `{}` ? `400`; officer PATCH whitelisted 401/403/400; `express.json 2mb`. Forgery hole from 09-09 audit is CLOSED.
- SLA enforcement fires: immutable `slaStartedAt` + 60-sec + on-read sweeps ? `Deemed` + `Filed+7d?Nodal?+14d?Secretary`; backdated `FIRE-PROV 24d/21d` + `GRV-881 Filed 8d` fire on first read after reset. Demo beat works.
- Measured retrieval not bluff: 60-article TF-IDF cosine + tag boost, `GET /api/knowledge/eval` `n=8 correct=6 P@1=0.75` with ungamed misses `K03?K40 + K22?K23`, `no LLM/embeddings` strip. Zero new deps.
- Auth hardened for demo: scrypt per-user + legacy SHA compat, 64-hex `SHA256(email:random:time)` 12h capped 200, fixed `demo-*-token` rejected ? `401`, 5 fails/15min/IP ? `429`, real `POST /api/logout`. QA proved 3 logins.
- MR toggle 134 keys EN+MR persists `localStorage.us_lang`, wizard+tracker+buttons Devanagari verified zero blanks. Knowledge/schemes/officer remarks stay English (roadmap honest).
- Audit + gating + renewals landed since 4.6/10 verdict: `writeDbAtomic`, append-only `db.audit[]` (`GET /api/audit` officer-only), Group-D `Locked until A-C complete` + unlock audit, per-track completeness %, real renewal dates from validity table, atomic writes. `server.js` 254?1583 lines proves work, not slides.
- PPT hygiene fixed (per `ppt-submit-ready.md`): 6 slides (was 8), PDF 477,804 B <5MB, vision 8-slide moved to `.ai/archive/`, honesty find-replace (`Vanilla JS demo`, `JSON file store (Postgres roadmap)`, `TF-IDF P@1 0.75 no LLM`, `filename+size validation (Tesseract Phase-2)`), `*Seed projection` x5, one name. Scan bare `React 18/Next 14/Mongo 7/Rules+RAG/LLM API` =0.

**What is still thin / missing (no faking):**
- All impact numbers are `*Seed projection`: `60?21d`, `41%?12%` from 38 illustrative rows. Zero measured pilot (no Sinnar letter, no 20 users x 4 weeks logs). Screeners comparing against measured pilots rank you lower. Saying `measured` once = auto-ding.
- MAITRI 2.0 (live 04-Feb-2025, exclusive G2B, KYA wizard, 2023 Facilitation Act auto-escalation/joint/deemed) + NSWS (325 Central + ~2200 State, KYA, doc repository, EntityLocker, API filing) already do 80% of noun `portal`. Your novelty lives ONLY in adjectives (pre-validate, parallel-gated, risk-based, escalation-enforced, bottleneck-measured). Three adjectives were labels on 09-09; now engines but still small-scale (12 approvals vs 325+/2200, 8 districts vs 36, 60 illustrative articles `confirm with GR`).
- No hard-tech with name+accuracy+failure handling: TF-IDF 0.75 on n=8 hand-labelled is honest but not hard-tech. Zero OCR bytes (metadata only), zero model, zero embeddings/vectorDB, zero DigiLocker/EntityLocker live (filename strings only), zero SMS/push (polling strip only). Winners 2023-24 each had one: PaddleOCR+hash, DistilBERT 83% on 12k, GIS+CV+field app.
- Scale/process zero: sync JSON read-modify-write races at 10k concurrent (say so), `npm test` = syntax-only (3x `node --check` + JSON parse, no sweep/TF-IDF/401/422 coverage), no git repo, no Docker/CI, caret `express ^4.19.2` do-not-update-on-stage. By-design for demo, indefensible as `production-ready`.
- Inclusivity half: 134 keys chrome Marathi, but K01-K60 + schemes + officer remarks English-only. No mobile/PWA/inspector story, no CSC-assisted/low-bandwidth story beyond `offline`.
- PPT still NOT upload-ready until YOU do 20 min: `SIH26130-XXX` x11 + `College - ___` remain by decision (see SUBMIT_CHECKLIST). Upload as-is = `not serious` filter before demo runs. `DEMO_SCRIPT.md:11` + `README.md:93` reset lines still say bare `POST /api/reset` (server bare =401 by design, frontend uses `?demo=1`) — copy-paste curl fails. `GET /api/demo/status` returns demo passwords plaintext (risk-accepted for judging, must remove prod).

**Vs typical SIH winners (benchmark §5):**
Winners = familiar stack (you have: vanilla/Express/JSON) + ONE named hard-tech with accuracy + failure handling (you lack) + seeded real data date-stamped (you have MH-credible but illustrative) + pilot/owner/cost/DPDP/residency (you lack owner/cost/DPDP) + Marathi/offline (you have offline+half-Marathi) + failure-mode story (you have banned-words + file+line, good) + everyone speaks + backup video (you have USB/PNG/MP4 plan, good). You match 3/7 winner traits. That is why internal 60-70% with live honest demo is credible, finale win 1-3% is math, not insult.

---

## 2. Top 3 reasons judges would REJECT it (kill-shots)

**R1 — `Already exists — see MAITRI/NSWS. Duplicate.` (30-sec screener reject, no demo watched)**
Why: if slide 2 verb is `apply and track`, screener ticks duplicate. MAITRI KYA + tracking + 2023 Act escalation + NSWS doc reuse cover the noun. Your kill-table + `complement not duplicate: SSO + API layer over MAITRI/NSWS, read-only DigiLocker/MCA21, Phase-2` must be on slide 2, spoken in 15 sec. Without that sentence, stronger demo loses to weaker-but-novel team. This PS exists BECAUSE MAITRI exists but onboarding/compliance still painful — adjectives or death.

**R2 — `Numbers undefended / AI-washing / one bluff word.` (60-sec technical disproof)**
Triggers: saying `AI model, LLM/RAG running, OCR working, Mongo running, measured 60?21, DigiLocker live, SMS sent, parallel engine, auto legal advice` — each has live disproof (forged `{"name":"forged.pdf","passed":true}` ?422 now saves you ONLY if you say `metadata validation, bytes/OCR Phase-2`; scanned Marathi NOC upload ?cannot extract; `file an app — headline didn't move` ?must say `SEED frozen, LIVE moves`; `show Mongo/LLM/SMS/audit` ?must point `server.js:354-430 validator, :524-597 sweeps, :599-667 TF-IDF, Postgres/Tesseract/SMS Phase-2`). One bluff word drops technical jury to bottom-half instantly. Honest script is your only shield.

**R3 — `Admin / demo-death filter.` (0-sec, no Q&A)**
Triggers: upload `SIH26130-XXX` + `___` as-is; upload 8-slide vision 6.4MB file from `.ai/archive/` by wrong click; `localhost:3000` hangs (hall IPv6) with no `127.0.0.1:3000` fallback; port 3000 busy; dirty `db.json` (history 39 after read, breach already fired) with no reset; breach invisible (forgot Reset?read order); `npm update` breaking stage; shipping `node_modules/` + dirty `db.json` in zip. Each killed stronger teams than yours. SUBMIT_CHECKLIST 20-min + DEMO_SCRIPT break-table + `POST /api/reset?demo=1` one-click-away is not polish — is survival.

---

## 3. Top 3 reasons they would SELECT it (keep these, do not break)

**S1 — Offline one-command demo that actually fires enforcement (strongest asset)**
`npm install ? npm start ? :3000` no internet/build/DB, reset ? wizard `9 approvals critical 45d` ? File `APP-2026-0xx` ? tracker `FIRE-PROV Deemed 24d/21d` + alertstrip ? book combined inspection ? tracks `Inspection scheduled` ? officer MPCB Query/Approve with token ? tracker `Queried/Approved` ? confirm inspection ? `Under review` ? grievance `GRV-881 Nodal` ? analytics `LIVE ch3 moved` vs `SEED 60?21* frozen` ? knowledge `deemed approval SLA breach` scores + `P@1 6/8 75% no LLM`. Five minutes, three clicks, every state mutates visibly. Non-technical faculty see coherent reform (MIDC/MPCB/MSEDCL/PSI-2019 ring true). Hall Wi-Fi death does not kill you. Do not refactor tonight.

**S2 — Honesty as strategy (shortlist-safe posture competitors lack)**
`Honesty first`, `*Seed projection` x5 in deck + every README number, `Banned until built` list, `LIVE vs SEED` labels in UI+footer, TF-IDF `no LLM` strip + ungamed misses published, `metadata validation (OCR Phase-2)`, `JSON pilot ? Postgres Phase-2`, file+line pointers. Judges reward `knows gaps cold` over `bluffs`. Prior reviews risk-accepted demo-password disclosure + bare-reset 401 guard explicitly. This maturity signal scores under feasibility/practicability/sustainability while AI-washing teams get flagged as slop.

**S3 — Thin but complete Maharashtra slice (PS-fit breadth)**
6 depts, 12 approvals with fees/SLA/parallel A-D/inspection/validity, 6 schemes with eligibility+benefit, 60-article rulebook `Illustrative-confirm`, 38 history rows, 3 apps, 2 inspections (1 combined), 2 grievances, 3 vault records, 134-key MR, risk heuristic with visible weights + Red/Amber/Green route, completeness %, audit log, renewal schedule, live analytics (`filingsBySector/pendingByDept/queryRate/combined%`). All five shortlist thresholds render concretely (checklist engine + pre-validator + SLA brain + parallel+joint planner + bottleneck+scheme matcher). Narrow (12 vs 325+, 8 districts) but end-to-end beats 10 half-wired features — `half-built = zero` is finale rubric, you chose 3 flows that survive questioning.

---

## 4. Must-add for selection (max 5, legit only, no faking)

> No fake Mongo/LLM/OCR/SMS/DigiLocker claims. Each below is demo-safe, offline, 1-dep-preserving unless marked Phase-2 roadmap. Do NOT attempt Mongo migration / React rewrite / real LLM billing / SMS gateway before selection — breaks offline demo for zero screening ROI.

### P0-1 — Submit hygiene (admin reject prevention) [Priority P0]

**As a** team lead submitting to SIH portal
**I want** Team ID + college filled, 6-slide-only upload, PDF<5MB verified
**So that** screeners actually watch the demo instead of filtering on blanks/wrong file

**Acceptance Criteria:**
```gherkin
Given SUBMIT_CHECKLIST.txt 20-min list
When Ctrl+H `SIH26130-XXX` ? allotted ID + `College - ___` ? full name+city + Save As PDF
Then `Select-String XXX/___` =0, `Slides.Count==6`, PDF <5MB, root holds ONLY `Udyog-Sarthi-AI-SIH26130-IDEA-PPT.pptx + .pdf`, vision file stays in `.ai/archive/`, USB+phone hold PDF+6 PNGs+60-sec MP4
```
**INVEST:** Independent (docs only), Negotiable (ID/college values), Valuable (gates all else), Estimable (20 min), Small (1 sitting), Testable (BAD=0 scan). **RICE:** Reach 10 x Impact 3 x Confidence 100% / Effort 0.5 = 60. Do tonight.

### P0-2 — Differentiation sentence + honest script rehearsal (duplicate-tag antidote) [Priority P0]

**As a** presenter facing MAITRI/NSWS question
**I want** one kill-table + 30-sec complement-not-duplicate answer with file+line pointers
**So that** screener writes `intelligent layer` not `duplicate`

**Acceptance Criteria:**
```gherkin
Given judge asks `Why not just add to MAITRI?`
When I show slide 2 table (Capability | MAITRI | NSWS | UdyogSarthi x5 rows: roadmap, pre-validation, parallel-gated, SLA/bottleneck, lifecycle/renewals) + say `Rule engine + TF-IDF P@1 0.75 no LLM + metadata 422 + SLA sweeps + LIVE counters; Mongo/OCR/SMS/MAITRI-API Phase-2 — server.js:354-430 validator, :524-597 sweeps, :599-667 TF-IDF`
Then no banned word uttered (`AI model/LLM running/OCR built/Mongo/measured/DigiLocker live/SMS/parallel engine`), judge nods to demo not deck
```
**INVEST:** Independent, Negotiable wording, Valuable (highest Q&A ROI), Estimable (15 min rehearse), Small, Testable (mock Q&A, zero banned words). Fix `DEMO_SCRIPT.md:11` + `README.md:93` to `POST /api/reset?demo=1` (doc-only, 2 lines) so copy-paste curl does not 401.

### P1-1 — Pilot intent + measured-numbers plan (seed ? measured) [Priority P1]

**As a** ministry evaluator scoring impact/commercial viability (25%+25% finale weight)
**I want** named owner + boundary + cost + DPDP + before/after measurement plan
**So that** `60?21*` becomes credible target not slop

**Acceptance Criteria:**
```gherkin
Given pilot strip `Sinnar MIDC x 3 approvals (Udyam/Shops/Fire-NOC) x 20 users x 4 weeks`
When I show owner letter/email intent (DIC/Sinnar officer name) + costed stack (laptop+npm, JSON pilot?Postgres Phase-2, capped LLM billing, SMS gateway est, Tesseract infra) + DPDP/residency line (data stays India, consent, retention) + measurement (before/after logs ? real avg days, return %, SLA visibility)
Then every number spoken with `*Seed projection, pilot to measure`, no `measured` claim, backup one-slide cost/owner/DPDP ready if asked
```
**INVEST:** Independent (paper + 1 meeting), Valuable (converts shortlist?winner), Estimable (1-2 weeks parallel), Small if intent-letter only (1 email), Testable (letter shown, basis string quoted). Do NOT fake pilot data — intent + plan beats invented logs (invented = disqualify).

### P1-2 — One hard-tech hardening with accuracy + failure handling (win-threshold) [Priority P1]

**As a** technical judge comparing `AI` teams
**I want** ONE live AI moment with named method + eval + confidence + human queue
**So that** TF-IDF is defensible not `FAQ called engine`

**Acceptance Criteria (pick ONE, cheapest first — do not do both before selection):**
```gherkin
Given option A (recommended): TF-IDF stays + eval n>=30 + top-20 K-articles human-translated MR + citation-precision published
When `GET /api/knowledge/eval` shows `n>=30 P@1 + citation precision` + `#/knowledge` shows scores+matched terms+source + `cited answers only, human-in-loop, no legal advice without source` guardrail
Then accuracy quoted with denominator + failure named (near-synonym K03/K40) + fallback (human review)

Given option B: Tesseract.js OCR feeding validator (upload ? expiry/name extract + confidence + review queue)
When scanned PDF uploaded ? flags in <30s with confidence
Then weakest mock becomes strongest demo; if OCR fails live ? confidence + queue shown, no bluff
```
**INVEST:** Independent, Negotiable A vs B, Valuable (finale differentiator), Estimable (A 2 days, B 3-5 days), Small if A only, Testable (eval endpoint + live upload). Keep `no LLM` labels until capped-LLM Phase-2 lands. Never narrate model you do not have.

### P2-1 — Integrity + scale story without breaking demo (trust + deployability) [Priority P2]

**As a** evaluator asking `10k concurrent? audit? renewals?`
**I want** live contract probes + audit view + real renewal dates + Postgres roadmap with file+line
**So that** `demo-grade` reads as `pilot-ready`

**Acceptance Criteria:**
```gherkin
Given clean `POST /api/reset?demo=1` ? `apps=3 history=38 seed=38 live=0 corpus=60 avgOld=60 avgNew=21`
When I run 5 plain-node fetch asserts (reset-demo1 200, bare-reset 401, checklist `{}` 400, login?Bearer?officer-approve 200, eval accuracy parsed) + show `GET /api/audit` officer-only + `GET /api/renewals` real validity dates (Factory/Fire annual, CTO Red-5/Green-10, no hardcoded 58d) + say `sync JSON races at 10k — Phase-2 Postgres+Prisma (approvals/tracks slaStartedAt/audit/documents hash) + Redis idempotency + S3 bytes`
Then zip excludes `node_modules/ + data/db.json + *.pptx/pdf + .ai/archive/` (honors `.gitignore`), unzip test `npm install ? npm start ? 127.0.0.1:3000 ? Reset?wizard?breach?officer?LIVE` passes, no `npm update` on stage
```
**INVEST:** Independent, Negotiable (5 asserts minimal), Valuable (prevents regression that shipped 401 once), Estimable (half day), Small, Testable (exit 0 + analytics 38/38/0). After SIH: `git init`, pin express, expand tests, remove passwords from `/api/demo/status`.

---

## Survival protocol (if judged TOMORROW, no new code)

1. Reset FIRST: footer Reset ? `POST /api/reset?demo=1` ? `{"ok":true}` ? `GET /api/analytics` `38/38/0`. Breach needs Reset?read order (`#/tracker`/`#/app/APP-2026-0157` sweep on read +60s; `#/grievances` for GRV-881?Nodal).
2. Never open DevTools yourself. Never say banned list. Rehearse 5 honest sentences verbatim (see P0-2).
3. `localhost` hangs ? `127.0.0.1:3000` same server. Port busy ? `netstat -ano | findstr :3000` ? `taskkill /PID <n> /F` ? `npm start`.
4. MR: header Marathi ? wizard `???????? ?????? ???????` ? reload persists `localStorage.us_lang==mr` ? back English.
5. Forgery challenge ? offer forged `{"name":"forged.pdf","passed":true}` ?422 live; scanned-Marathi-NOC ? `Metadata today (422), bytes OCR Phase-2 Tesseract roadmap — validator server.js:354-430`.
6. Carry USB: 6-slide PPTX +0.47MB PDF +6 PNGs +60-sec MP4. App needs no internet.

## What NOT to do (will kill selection)

- Do NOT claim Mongo/LLM/OCR/SMS/DigiLocker live, `measured 60?21`, `parallel engine`, `auto legal advice`. Each 60-sec disproof.
- Do NOT `npm update`, refactor `server.js` (1583 lines God-file ACCEPTED for prototype — splitting adds risk zero screening ROI), migrate DB, rewrite React, add LLM billing before selection.
- Do NOT upload `.bak`/vision 8-slide/`.ai/archive/`, dirty `db.json` (39 rows), `node_modules/` in code zip.
- Do NOT add names slide (breaks 6-slide rule) — names via portal only. Confirm =1 female if team 6, same institute, team name ? institute.

## Honest odds (ranges, not promises — judges vary, draw luck matters)

- **Internal (college) WITH live honest demo today: 60-70%; without: 25-35%.** P0 closed forgery/auth/sweep, TF-IDF moment, LIVE charts, offline reset survive hall. One DevTools miss / banned word / dead demo ? bottom-half in 60s.
- **National PPT-only screening as-is (XXX/___ left): 45-55%; after P0-1+P0-2 45-min pass: 55-65% ceiling.** Cap reasons: all numbers seed, no pilot proof, hundreds/PS single-digit shortlist, MAITRI-duplicate risk if kill-table weak.
- **Finale WIN today: 1-3% (<5%). Finalist top-5 even perfect: 5-8%.** Needs P1-1+P1-2 + weeks pilot + cost/DPDP + Marathi depth + measured accuracy. 5 PSs SIH2024 got NO WINNER — `good demo` without deployability gets nothing by design.
- **After P0-1+P0-2 tonight (1hr):** screening 55-65%, internal 65-75% survives technical Q&A without humiliation. **After P1-1+P1-2+P2-1 (1-2 weeks):** 7.2-7.5/10 genuinely shortlistable + finale-defensible. No exotic stack needed.

---

## Evidence appendix (so next agent need not re-read)

- `README 116 lines`: honesty-first, 1 dep, logins `udyog@demo.in/demo123` + `officer@maharashtra.gov.in/officer123`, 64-hex 12h capped 200, 401/403/429, TF-IDF P@1 0.75 misses K40/K03+K23/K22 ungamed, 422 forgery, sweeps immutable clock, i18n 134, JSON?Postgres roadmap, `60?21*` corrected from 68?31, LIVE vs SEED `server.js:1136-1173`, banned list, 3-click core, 6 depts/12 approvals/6 schemes/60 KB/3 apps/38 history/2 insp/2 grv/3 vault.
- `DEMO_SCRIPT 53 lines`: `:3000` + `127.0.0.1` fallback, QR via Wi-Fi IP, logins token shape, reset `apps=3 history=38 corpus=60` + FIRE-PROV 24d/21d + GRV-881 8d, 60-sec +2-min scripts verbatim, break-table, never-say list.
- `SUBMIT_CHECKLIST 24 lines`: 6-slide PPTX 707,664 B + PDF 477,804 B root-only, vision archived `.ai/archive/` git-ignored, 20-min fill (Team ID XXX, Team Udyog Sarthi, college ___, no names slide, female check, theme Miscellaneous/software, re-export <5MB, USB+PNGs).
- `qa-remaining-verify PASS`: `COUNT_DEMO1=1 COUNT_BARE=0 COUNT_134=3 COUNT_64KEYS=0 en=134 mr=134 blanks=0 EXIT_TEST:0 EXIT_LINT:0 BOOT 30152 RESET 200 HEALTH ok EVAL 60/8/6/0.75 ANALYTICS 38/38/0 INDEX 200 BARE 401 guard STOPPED`.
- `code-review-remaining APPROVED`: 8 strengths (offline, honesty, auth, 422, sweeps, TF-IDF, i18n, atomic+reset), 0 critical open, 4 important non-blocking (DEMO:11 + README:93 reset nuance, syntax-only tests, zip hygiene), 7 minor (demo-status passwords, x-demo-token compat, no git, no LICENSE/env, caret express, 1583-line God accepted, db dirties-on-read by design).
- `server.js 1583 lines` head: Option-A users+scrypt+legacy SHA, sessions 12h, login/register rate-limit, `getBearerToken` rejects fixed tokens, `authSession`, `slaStartedAt`, audit append-only, `VALID_TRACK_ACTIONS`, risk bands, Group-D gating + unlock audit.
- `seed.js 245 lines`: 3 users U-001/002/003, 6 depts, 12 approvals A-D + gated D + validity, 6 schemes, K01-K60 illustrative-confirm, history 38 + live filings separate.
- `package.json`: 1 dep express ^4.19.2, node>=18, test syntax-only, lint TODO/XXX scan.
- Prior baselines: `prototype-audit 5.5/10` (demo 8, integrity 4, finale 3), `project-verdict 4.6/10` (national 15-20%, internal 40-50%, win <5%), `shortlist-win-truth` (internal 60-70% with demo, screening 45-55%?55-65% after pass, win 1-3%), `sih-benchmark` (MAITRI 2.0 04-Feb-2025 exclusive + NSWS 325/~2200 + winners need named hard-tech + pilot/owner/cost/DPDP).

*Hard boundaries respected: requirements + user stories only. No code/config/infra edited. Findings dispatchable as P0/P1/P2 to dev agents. No guarantee of selection — odds are calibration, not influence.*

