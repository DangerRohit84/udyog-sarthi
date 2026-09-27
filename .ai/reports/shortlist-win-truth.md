# Shortlist & Win — Brutal Truth (SIH-26130 Udyog Sarthi)

**Date:** 2026-09-09 · **Reviewer:** Development Lead · **Stance:** brutally honest, no sugarcoat (you ordered: "at any cost don't satisfy me, give me truth" — honored)
**Inputs read FIRST:** `.ai/reports/ppt-first-vs-project.md` (35% vision fidelity), `.ai/reports/project-verdict.md` (4.6/10), `.ai/reports/p0-fix-report.md` (5/5 P0), `.ai/reports/ai-fix-report.md` (TF-IDF + live + i18n), `.ai/reports/ppt-fix-report.md` (8→6 done)
**Live checks this run:** FIXED PPT `6 slides` / FIRST PPT `8 slides` / PDF `478,113 bytes` confirmed; `package.json` 1 dep `express`; `server.js` 697 lines `node --check OK`; `seed.js` 12 approvals / 6 depts / 6 schemes / 60 knowledge / 8 districts / 38 history; PPT text scan: `XXX=TRUE, ___=TRUE, LLM=TRUE, Mongo=TRUE, Tesseract=TRUE, MAITRI=TRUE, 68=TRUE, Seed=TRUE`; `server.js` has TF-IDF + `no LLM` labels, zero `Locked/gating/multer/Tesseract/audit-table`.

---

## 0. Direct answer — are you sure I will be shortlisted and win?

**NO. No one can be sure. Not me, not your mentor, not any senior. Anyone who guarantees you shortlist or win is lying to make you feel good.**

What I CAN give you is honest odds, what moved today, and what still kills you tomorrow. Read this fully — it will sting, but it is the truth.

- **Shortlist: possible, NOT certain.** You moved from "likely filtered" to "genuinely in the fight" today. You can still get knocked out tomorrow by a 30-second mistake.
- **Win: NO. Not with this build, not this week.** Finale win is <5% (realistically 1–3%). That is not an insult — it is the math of national finalists with named models + pilots + measured numbers vs your honest-but-thin demo.

If you want comfort, stop here. If you want the truth, continue.

---

## 1. TODAY post-fix state (what actually landed vs what did NOT)

### 1a. PPT 6-slide fixed? YES — but NOT upload-ready

| Claim | State | Evidence |
|---|---|---|
| 8→6 slides | DONE | `len==6` confirmed; vision file `len==8` still sitting in folder |
| PDF <5MB | DONE | `478,113 bytes = 0.46 MB` |
| Kill-table + pilot strip + `*Seed projection` footnote + MAITRI line | DONE | Text scan: MAITRI/68/Seed all FOUND |
| Placeholders gone | **NOT DONE** | `SIH26130-XXX` ×11 + `College – ___ (fill before upload)` still in deck (scan `XXX=TRUE, ___=TRUE`). Upload as-is = "not serious" auto-ding |
| Honesty pass (P0-2 from ppt-first report) | **NOT DONE** | Deck still says `React 18/Next 14`, `Mongo 7`, `Rules + RAG`, `LLM API (capped)`, `Tesseract OCR`, `VectorDB pgvector` as if BUILT. Code is vanilla JS + JSON file + TF-IDF + filename checks + in-page strip. This is the next lie waiting to be caught |
| Voids / visuals | PARTIAL | S2 solution box bottom-half white, S3 arch ~40–50% voids, S6 refs ~60% empty. No dashboard mock screenshot, no QR, no demo still. Fonts/table 7.5pt = projector risk |
| Wrong-file risk | OPEN | Vision 8-slide `6,423,969 bytes` file (`First-generated-main`) still in `D:\SIH\udyog-sarthi\`. One wrong click on portal = submit placeholders + 4 name variants + zero numbers |

### 1b. P0 backend done? YES — 5/5, your biggest real win

Server validation (`422` on forged `passed:true`, vault only accepts server-verified), demo auth (`POST /api/login`, 401/403 on officer routes), input validation (`criticalDays:null` → 400), auto-deemed + auto-escalation sweeps (immutable `slaStartedAt`, 60s + on-read), inspection↔track linkage. All live-curl proven in `p0-fix-report.md`. Demo now survives DevTools forgery + anonymous-curl + "deemed never fires" — the three cheapest kill-shots are closed.

### 1c. AI TF-IDF done? YES — honest, small, defensible

60 articles (K01–K60, all `Illustrative — confirm` sources), `ktok/tfidfSearch` cosine + tag boost, `P@1 6/8 = 75%` with measured eval strip + `no LLM/embeddings` labels, live analytics (`POST /api/applications` moves `filingsBySector/pendingByDept/queryRate/ch3`), EN/MR toggle 36 keys (nav/wizard/tracker only). Zero new deps, offline-safe. This is the most ethical decision in the repo (refused to fake LLM) — credit where due.

### 1d. What REMAINS (every row is a live Q&A kill-shot)

| # | Gap | Proof | Judge line that ends you |
|---|---|---|---|
| R1 | College/Team ID blanks | `SIH26130-XXX`, `___` in deck | Screener 10-sec filter, no demo watched |
| R2 | PPT overclaims vs code | Deck: React/Mongo/LLM/RAG/Tesseract; `package.json` 1 dep, `server.js:293` says `no LLM`, zero OCR bytes | "Show me the Mongo/LLM/OCR running right now" |
| R3 | No dependency gating | `server.js:461` creates ALL tracks `Applied` incl. Group-D CTO day-1; zero `Locked` in code | "CTO before CTE + Fire NOC? Legally impossible — explain" |
| R4 | No OCR stub at all | No multer/Tesseract/file-bytes; validation is ext/size/expiry/holder metadata | "Upload this scanned Marathi NOC, show extraction" → cannot |
| R5 | No audit-log table, no encryption, static tokens | Only `remarks` strings; `data/db.json` plaintext; `demo-officer-token` no expiry | "Show yesterday's audit log + an SMS/push" → none |
| R6 | MR half, renewals fake, analytics half-seeded | i18n chrome only (K01–K60/schemes/officer English-only); `app.js:185` hardcoded `58 days`; headline `68→31` never moves, only LIVE card + `ch3` move | "File an app, show 68→31 moving" → headline frozen |
| R7 | Scale/process zero | Sync JSON read-modify-write, no locking; no git/Docker/tests/CI; `riskBump/slaWeight` dead; risk uncalibrated; 8/36 districts, 12 vs 325+/2200 approvals | "10,000 concurrent applicants?" → races; "pilot owner/cost/DPDP?" → silence |

**One-line state: paper went 4.0→~6.5/10, code went 4.6→~6.5–7.0/10 demo-grade. Upload-ready = NO (blanks + overclaims). Finale-ready = NO (R3–R7).**

---

## 2. Honest probabilities (no guarantee, with reasons)

> These are calibrated against `project-verdict.md` baseline (screening 15–20% / internal 40–50% / finale <5%) + `ppt-first-vs-project.md §6` deltas + what I verified TODAY. Ranges, not promises — judges vary, draw luck matters.

### Internal (college) shortlist — TODAY: 60–70% WITH live demo + honest script; 25–35% without

Why higher than the old 40–50%: P0 closed forgery/auth/sweep holes, TF-IDF gives one honest "AI moment," live charts give one "filing moves the chart" moment, offline `npm start → :3000` + reset survives hall Wi-Fi death. Non-technical faculty see a coherent reform story (MIDC/MPCB/MSEDCL/PSI-2019 ring true).

Why NOT 90%: a single technical faculty opening DevTools (gating/OCR/audit/renewals), or you saying one banned word (`AI model / LLM / OCR built / MongoDB / measured 68→31 / DigiLocker live / parallel engine`), or a dead demo (port busy, db.json corrupt, no backdated breach visible, MR toggle never click-tested in a real browser) drops you to bottom-half in 60 seconds. Internal is your ONLY bubble path — and bubbles burst.

### SIH national PPT-only screening (2–3 min per deck) — TODAY as-is: 45–55%; after 45-min ID+honesty pass tonight: 55–65%

Why up from 15–20%: 6 slides (not 8), one name, kill-table answering "already exists — see MAITRI/NSWS," pilot strip `3 approvals × Sinnar × 20 users × 4 weeks`, `68→31 • 41%→12%*` with footnote, cited refs, 0.46 MB PDF. That clears the mechanical filter the vision deck failed.

Why capped at ~65% even after the pass: (a) `XXX/___` TODAY = mechanical ding — fixable tonight, fatal if forgotten; (b) `LLM/RAG/Mongo/Tesseract/React` on the tech slide with zero evidence URL/repo/eval invites "AI-washing + duplicate of MAITRI" note; (c) every number is `*Seed projection` — screeners comparing you against teams with measured pilots + owner letters + accuracy numbers + Marathi depth will rank them higher; (d) hundreds of teams per PS, single-digit shortlist per college → ministry screen. 65% is the ceiling for a seeded-but-honest deck with no pilot proof.

### Grand finale WIN — TODAY: 1–3% (bucket: <5%). Finalist (top-5) even with perfect delivery: ~5–8%

Why ~zero for WIN: every SIH 2023–24 winner pattern in `sih-benchmark.md`/`project-verdict.md §3b` had ONE named hard-tech with accuracy + failure handling (PaddleOCR + hash, DistilBERT 83%, GIS+CV) + seeded real data + pilot/owner/cost + Marathi/offline + failure-mode story. You have: TF-IDF 75% on 8 hand-labelled queries (honest, but not hard-tech), zero OCR bytes, zero model, zero measured impact, zero owner/MoU, zero cost/DPDP/scale answer, English knowledge base for a Maharashtra PS. 5 PSs in SIH2024 got NO WINNER — "good demo" without deployability gets nothing, by design.

This is not fixable by confidence or pitch energy. It is fixable by weeks of P1–P2 (see §4) + a real pilot. Do not plan around winning this cycle — plan around shortlisting + learning + returning with a measured pilot.

---

## 3. Why NO ONE can guarantee your win (read before asking again)

1. **Judges, not code, decide.** Different juries weight novelty vs completeness vs Marathi vs scale differently. Same project wins one room, filters in the next. No agent controls the room.
2. **The MAITRI bar is existential for THIS PS.** MAITRI 2.0 (live since 4 Feb 2025) + NSWS (325+ Central, ~2200 State approvals, KYA, EntityLocker) already do 80% of the noun "portal." Your novelty must live in adjectives (pre-validate, parallel-gated, risk-based, escalation-enforced, bottleneck-measured). Three of those adjectives are still labels (R3/R5/R6). A screener writing "duplicate" ends you regardless of demo quality.
3. **Caps + no-winner history.** Colleges nominate limited teams; national shortlist is single-digit per PS per center; SIH has a documented history of declaring NO winner for PSs that don't clear deployability. "Best demo in the room" ≠ winner.
4. **Demo luck is real.** Port 3000 occupied, `db.json` left dirty from testing, projector washing out 7.5pt table, Devanagari toggle breaking on hall machine, backdated-breach seed forgotten, wrong PPTX uploaded (6.4 MB vision file). Any one of these has killed stronger teams than yours.
5. **I am an AI reviewer, not the jury.** My probabilities are calibration, not influence. Anyone promising selection is selling you comfort, not truth — you explicitly forbade that, so I won't.

---

## 4. 3 things that could still KILL your shortlist TOMORROW (fix tonight)

1. **Upload the wrong thing / leave blanks.** Vision 8-slide file still in folder + `SIH26130-XXX` + `___` in fixed deck. Portal mistake = instant filter before anyone runs code. TONIGHT (20 min): archive/rename vision file to `.bak-only`, fill real Team ID + college + names on slide 1 + footers, re-export PDF, verify `BAD=0` scan, upload ONLY the 6-slide PPTX + 0.46 MB PDF. Keep a USB + screenshots + 60-sec screen-record as backup.
2. **Say one bluff word on stage.** Banned until built: `AI model, LLM, RAG (as LLM), OCR working, MongoDB running, measured 68→31, verified DigiLocker reuse, parallel engine, auto legal advice, SMS/push sent`. Each has a 60-second disproof (forged-doc DevTools, scanned-NOC upload, `10k concurrent`, `show the SMS/audit log`, `file an app — headline didn't move`). Rehearse the 5 honest sentences instead: *"Rule engine + TF-IDF retrieval (no LLM) + metadata validation + SLA sweeps + live counters; Mongo/OCR/SMS/MAITRI-API are Phase-2 — here are the exact file+line + roadmap."* Point at `server.js:152-228` (validator), `:231-291` (sweeps), `:293-361` (TF-IDF). Judges reward teams that know gaps cold over teams that bluff.
3. **Dead demo.** `npm start` fails on hall laptop, port conflict, dirty `db.json`, breach path invisible (seeds never breach unless backdated), MR toggle never tested in a real browser, projector voids. TONIGHT (30 min): fresh `npm install && npm start → :3000`, `POST /api/reset`, backdate ONE track to show 🔴 breach + deemed-eligible alert, click every README step verbatim, toggle मराठी → wizard shows `चेकलिस्ट जनरेटर विझार्ड` → reload persists, keep reset one click away, carry PDF + PNGs + video. Never open DevTools yourself.

---

## 5. 3 things that would move WIN from <5% to real contention (weeks, NOT tonight — do NOT attempt before selection)

1. **Turn labels into engines (2–3 days, highest win-ROI).** Dependency gating (`Locked` until predecessors clear in `POST /api/applications` + unlock in `PATCH /track` + sweeps), completeness score + required-set enforcement from `seed.js docs[]` (fuzzy match, `% complete` on tracker), append-only `db.audit[]` (who/when/before→after, read-only view, ~40 lines, still offline), real renewal dates from validity table (Factory/Fire annual, CTO Red-5/Green-10 per K16/K46 — kill hardcoded `58 days`). This closes the "legally impossible day-1 CTO" + "no audit" + "fake lifecycle" — the exact rows where winners separate from demos.
2. **One hard-tech with measured accuracy + failure handling (3–5 days).** Either (a) Tesseract.js OCR on upload feeding the validator (expiry/name extraction + confidence + human-review queue — turns weakest mock into strongest demo: "upload MAITRI-form-like PDF → flags in <30s"), or (b) TF-IDF → calibrated + top-20 K-articles human-translated to Marathi + district-aware checklist + investment/worker triggers + published eval (n≥30, P@1 + citation precision) with `cited answers only, human-in-loop, no legal advice without source` guardrail. Winners name model + accuracy + failure mode. Name yours or lose to whoever does.
3. **Pilot + scale + process story (1–2 weeks parallel).** Sinnar MIDC × 3 approvals × 20 users × 4 weeks WITH owner letter/MoU intent, costed stack (Mongo 7 + pgvector migration, capped LLM billing, SMS gateway, Tesseract infra), DPDP/data-residency answer, Dockerfile + 10 smoke tests + git history, 36-district + full-registry roadmap, CSC-assisted + low-bandwidth + mobile/inspector story, Marathi knowledge end-to-end. Impact numbers must become MEASURED (before/after from pilot logs), not `*Seed projection`. No pilot proof = no win, regardless of demo polish.

**Explicitly NOT before selection:** Mongo migration, React rewrite, real LLM billing, SMS gateway, DigiLocker live, full-state seeds. Each breaks the one asset that wins internal (offline 5-min demo) for zero screening ROI.

---

## 6. Tonight 60-minute checklist (in order)

- [ ] (20 min) IDs + file hygiene: real Team ID + college, vision file out of upload folder, re-export PDF, `BAD=0` scan
- [ ] (15 min) Honesty micro-pass on tech slide footnote: `TF-IDF retrieval + Rules (LLM Phase-2)` / `JSON pilot store → Mongo 7 Phase-2` / `Metadata validation (OCR Phase-2, Tesseract roadmap)` — keep arch, keep versions, keep dashed Phase-2
- [ ] (15 min) README 3 one-liners: `60-article TF-IDF (P@1 75%, no LLM)`, `metadata pre-validation (422 on fail; bytes/OCR roadmap)`, `68→31 *seed baseline + live counters, pilot to measure`
- [ ] (10 min) Rehearse honest script + backdated breach + reset + MR toggle + PDF/video backup

---

## Verdict

**Shortlist: FIGHT, don't assume — 60–70% internal with live honest demo, 45–55% national screening as-is (55–65% after tonight's 45-min pass). Win: NO — 1–3% (<5%) until R3–R7 + pilot proof land. No one can guarantee otherwise, and anyone who does is not telling you the truth.**

*Hard boundaries respected: review only, no code rewritten. Findings dispatchable as P0-2/P1-1..P1-5 to dev agents. Prior `qa-report PASS / code-review APPROVED / security SECURE_WITH_NOTES` cover launcher-only and do NOT gate app-level gaps.*
