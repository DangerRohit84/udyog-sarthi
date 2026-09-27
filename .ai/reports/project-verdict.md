# PROJECT VERDICT — Udyog Sarthi (SIH26130) — Will It Get Shortlisted As-Is?

**Date:** 2026-09-09 · **Reviewer:** Development Lead · **Stance:** Brutally honest, no sugarcoat (explicitly requested)
**Inputs read:** `.ai/reports/prototype-audit.md` (5.5/10), `.ai/reports/ppt-visual-review.md` (4.0/10), `.ai/reports/sih-benchmark.md`, `D:\SIH\.ai\reports\impl-report.md`, `package.json`, `server.js` (254 lines), `public/app.js` (406 lines), `README.md`, `.ai/reports/qa-report.md` (PASS 18/18 — launcher-only), `.ai/reports/code-review.md` (APPROVED — launcher-only), `.ai/reports/security-audit.md` (SECURE_WITH_NOTES — demo threat model only)
**Live checks this run:** `node v24.11.1`, `node --check server.js/app.js/seed.js` OK, `data/db.json` exists, PPT `1,124,078 bytes / 8 slides` confirmed.

---

## 0. VERDICT UP FRONT — NO, NOT AS-IS

**Project score: 4.6 / 10**

| Component | Score | Source |
|---|---|---|
| Prototype (live demo) | 5.5 / 10 | prototype-audit — demo narrative 8/10, engineering 4/10, finale readiness 3/10 |
| PPT (what screeners actually see first) | 4.0 / 10 | ppt-visual-review — bottom-half, 8 slides with placeholders, zero numbers, no MAITRI answer |
| **Combined project (what decides selection)** | **4.6 / 10** | PPT is the gate. A 5.5 demo behind a 4.0 PPT still gets filtered before anyone runs `npm start`. |

**Shortlist % TODAY (as-is, no fixes):**

| Stage | Chance | Why |
|---|---|---|
| National PPT-only screening (2–3 min/PPT) | **15–20%** | 8 slides vs required 6 + `[Team ID]` placeholders on slide 1 + zero numbers + no MAITRI/NSWS table = auto-ding signals. Screener writes "already exists — see MAITRI/NSWS" and moves on. |
| College internal WITH live demo (5-min script) | **40–50%** | This is your only bubble path. The README 10-step click-path genuinely works and looks coherent. Non-technical faculty may pass you on narrative. Any technical faculty who opens DevTools drops you to bottom-half. |
| Grand finale selection / win | **<5% / ~0% win** | Zero AI, zero auth, static analytics, JSON-file DB, English-only. Every finale winner 2023–24 had one named hard-tech (OCR+hash, DistilBERT 83%, GIS+CV) + pilot/owner/cost story. You have none. 5 PSs in SIH2024 got NO winner — "good demo" without deployability gets nothing. |

**Internal vs finale:** Bubble for internal **iff** you demo live and the jury is non-technical. Dead on arrival for finale. The prototype-audit said it exactly right: "right trade for a college qualifier, wrong trade for a finale" — and the PPT currently doesn't even clear the qualifier bar.

> Harsh truth: the `qa-report.md PASS`, `code-review.md APPROVED`, `security-audit.md SECURE_WITH_NOTES` in this repo are **launcher-only** (59-line `start.ps1`). They say nothing about the app. If anyone quotes "QA passed" to claim the project is ready, they are misreading scope. The app-level truths are in `prototype-audit.md` + `ppt-visual-review.md`, and both say NOT READY.

---

## 1. Current working state — does it run? Do all flows work?

**`npm start` — YES, this part is genuinely good. Keep it.**

- `package.json`: 1 dep (`express ^4.19.2`), `scripts.start = node server.js`, `engines >=18`. Env here `node v24.11.1` satisfies it.
- `node --check` on `server.js`, `public/app.js`, `data/seed.js` — all OK (re-verified this run).
- `server.js:7` `PORT 3000`, `server.js:254` `app.listen` — matches README + `start.ps1`. One-command offline run (`npm install && npm start → localhost:3000`) is judging-proof. No build step, no CDN. This is your highest-scoring asset. Do not break it.
- `data/db.json` auto-regenerates from seed; `POST /api/reset` restores. Good for stage recovery.

**All 7 demo flows — they RENDER, but 3 are theater. A non-technical judge sees 7/7. A technical judge sees 4/7.**

| Flow | Click-path works? | What's real | What's fake — judge kill-shot |
|---|---|---|---|
| Checklist wizard (`#/wizard`) | ✅ Food/Small/Establish → 9 items, ₹1,10,000, 45d critical | `matchChecklist()` filter+sort+fee sum is real but thin | 12 approvals, 8 districts only. No conditional logic (investment/worker triggers), no taluka variation. `POST /api/checklist {}` → `criticalDays:null`, `totalFee:0`, HTTP 200. No input validation anywhere (`server.js:92-96`). |
| Tracker + SLA (`#/tracker`, `#/app/:id`) | ✅ Rings render, breach/warn states feed alerts | `trackSla()` countdown math works | (a) **Any track touch resets SLA clock** — officer can game SLA forever with fake "reviews" (`server.js:146`). (b) Deemed **never auto-fires**, requires manual `action:"deemed"` (`server.js:144`). (c) Seeds never breach, so breach path invisible unless backdated. |
| Officer queue (`#/officer`) | ✅ Approve/query/review/inspect all mutate state | CRUD real | **Zero auth.** Role = `localStorage` string (`app.js:8-9`). Prototype-audit proved anonymous curl approve/query. Officer view is client-side `if`, not a boundary. |
| Inspection (`#/inspections`) | ✅ Book + confirm CRUD works | Booking + combined-visit suggestion works | No calendar conflicts, "To be assigned" officer (`server.js:176`), **dead code** `server.js:179` (`forEach(()=>{})`), completing inspection **does not update related tracks**. |
| Schemes (`#/schemes`) | ✅ Eligibility + est. benefit renders | `eligibleSchemes()` size/sector/investment check real | Formula `min(maxBenefit, inv*0.25)` is illustrative, not sourced from any GR. No scheme-document mapping. |
| Grievance (`#/grievances`) | ✅ File/escalate/resolve + timeline works | CRUD + ladder transitions real | **"Auto-escalates in 7 days" is FALSE.** No timer/cron/SLA clock. Escalation = human clicks Escalate (`server.js:207`, `app.js:351`). |
| Analytics (`#/analytics`) | ✅ Charts render offline (canvas, no internet) | Endpoint shape + canvas bars correct | **Static seed theater.** 60→21d from 38 hardcoded `history` rows; live apps **do not feed charts**; 41→12% is a constant. File 50 apps → charts don't move. Any judge asking "file an app and show the chart change" ends the illusion. |
| Documents/vault (`#/documents`) | ✅ Upload → checks → vault → reuse renders | Vault CRUD + re-attach real | **Worst hole in the repo.** All checks client-side (`app.js:253-269`). Server blindly trusts `passed:true` (`server.js:155-167`). Audit **proved live**: forged `{"name":"forged.pdf","passed":true}` with no file → accepted → verified → vault-poisoned → officer query auto-cleared. 60 seconds in DevTools kills your "pre-validation" claim. Only filename strings stored — no bytes, no DigiLocker/API. |
| Dashboard + knowledge | ✅ Both render | Dashboard progress/risk/vault real; knowledge substring search works | Knowledge = 10 hardcoded Q&A, no ranking/embeddings/grounding. Calling it an "engine" invites ridicule from any RAG team. Risk scorer runs live but seed `riskBump` field **never read** (dead data), thresholds uncalibrated, no MPCB Red/Orange/Green mapping despite knowledge article claiming it. |

**Bottom line on working state:** it starts every time and the 10-step README script survives a rehearsed run. It does NOT survive 10 minutes of adversarial clicking.

---

## 2. Gap vs Problem Statement ID26130 expected solution

PS does NOT ask for "another portal." It asks for an **intelligent layer** (benchmark §7). Score each expected adjective honestly:

| PS expects | Udyog Sarthi today | Grade |
|---|---|---|
| Customised checklist (sector×location×size×stage) | Static tag filter, 12 approvals, no rule engine, no versioning, `criticalDays:null` on bad input | **C — thin but demoable** |
| Doc guidance + pre-validation | Client-side theater + forgery hole (§1). No MIME/byte check, no OCR, no cross-form consistency, no completeness score | **F — claimed but mock** |
| Verified-data reuse (DigiLocker-style) | Filename-string copy. No DigiLocker/MahaOnline/EntityLocker API, not even sandbox stub or contract page | **D — label without integration path** |
| Parallel workflows | Static `parallelGroup A/B/C/D` labels + sort. No DAG, no gating — Group-D CTO created "Applied" simultaneously with Group-A, legally impossible | **F — label, not engine** |
| Inspection scheduling + common inspection | Booking CRUD + joint suggestion real; no conflicts, no assignment, no track linkage, dead code | **C- — half-built** |
| SLA tracking + deemed + alerts | Countdown real; deemed manual-only; SLA gameable; alerts = polling strip, no push (SMS/email/WS) | **C- — countdown without enforcement** |
| Single dashboard (applications/renewals/incentives) | Both dashboards render; renewals card is a hardcoded string ("58 days"); no security boundary | **B- — best thin slice, still static renewals** |
| Knowledge engine | 10-item substring FAQ. No TF-IDF/embeddings/reranker/citations/eval, no Marathi | **D — FAQ called engine** |
| Risk-based scrutiny | Heuristic runs live; dead `riskBump`, uncalibrated 35/65, no MPCB mapping, no learning | **C- — heuristic, half-dead** |
| Grievance escalation ladder | CRUD real; auto-escalation false; no grievance SLA clock | **C — manual ladder, false auto claim** |
| Delay/bottleneck analytics | Static seeds + constants; live data disconnected | **F — screenshot with extra steps** |

**PS coverage: 2.5 / 5 outcomes are implementations; the rest are demonstrations.** Shortlist threshold (benchmark §7) requires all five concretely: checklist engine with rule source + versioning, doc pre-validator with completeness score, SLA brain with breach predictor + escalation packet, parallel DAG + joint-slot planner, dept bottleneck from live data + scheme matcher. You have the **screens** for all five and the **engines** for ~two.

---

## 3. Gap vs MAITRI / NSWS bar + SIH finale winners

### 3a. MAITRI 2.0 + NSWS already do 80% of your first draft — this is the fatal Q&A

- **MAITRI 2.0** (live, exclusive G2B channel since 4 Feb 2025, CM launch): registration, common application form, routing, payment, **real-time tracking**, document management, **Know-Your-Approvals wizard**, 2023 Facilitation Act backbone (time-bound disposal, **auto-escalation to Empowered Committee**, joint inspections, deemed provisions), grievance layer.
- **NSWS** (live): 325 Central + ~2,200 State approvals, KYA questionnaire, SSO, **central document repository (upload once, reuse)**, tracking, renewals, EntityLocker, end-to-end API filing.

Your PPT says "Aligned With NSWS" and "API-ready for future integration" (= admits no integration), shows zero comparison table, zero SSO/DigiLocker/MCA21/GSTN hook, zero data-sharing/MoU path. The screener's 30-second note: *"already exists."* The PS exists **because** MAITRI/NSWS exist but onboarding/compliance is still painful — your novelty must live in the adjectives (pre-validate, parallel, risk-based, escalation, analytics), not the noun "portal." Today it lives in the noun.

**You lose Q&A the moment anyone asks:** "Why won't govt just add checklist+tracker to MAITRI in 2 sprints?" — deck has no answer, prototype has no moat.

### 3b. Finale winners all bolt ONE hard tech onto a boring workflow — you have zero

| Winner pattern | Their hard-tech proof | Your equivalent |
|---|---|---|
| Team Bharat (verification portal) | Aadhaar auth + IPFS/NSID hash + PaddleOCR template verification, live | Forgery-accepting mock + filename vault |
| News 360 (PS1329) | DistilBERT 83% + RoBERTa sentiment on 12k articles, named accuracy | No model, no accuracy, no dataset |
| DORA (infra monitoring) | AI image diff + GIS Leaflet + field app, integrated under pressure | No GIS, no mobile, no integration story |
| HexxCode (curriculum portal) | Multi-stakeholder workflow + versioning + analytics | No versioning, no audit log, static analytics |
| Common traits: familiar stack + **named model + accuracy + failure handling** + seeded real data + pilot/owner/cost + Marathi/offline for state PS | — | Familiar stack ✅, everything after the + ❌ |

**Specific finale gaps that each cost you a scoring block:**
- **No AI/ML anywhere** despite "AI" in PPT filename — single biggest selection risk. No LLM name, no embeddings, no vector DB, no OCR engine, no eval, no hallucination guardrail for legal advice (safety red flag).
- **No Marathi.** Maharashtra govt product, English-only + decorative `म`. Inclusivity/practicability points go to regional-language teams.
- **No auth/audit/API-docs/tests/Dockerfile/CI/git.** Not even version-controlled. Process maturity zero. JSON-file store with sync read-modify-write, no locking — "what happens with 10,000 concurrent applicants?" has no answer.
- **No mobile/PWA/offline-first.** Field inspectors are mobile users. Persona missing.
- **No pilot boundary, no owner, no cost, no data residency (DPDP), no failure modes.** Winners name all five. You name none.
- **Naming chaos:** `Udyog-Sarthi-AI` (file) vs `UDYAMSETU AI` (slide 2) vs `UdyamSetu AI` (footer) vs `Udyog Sarthi AI` (slide 8). Signals unfinished.

---

## 4. Scorecard (harsh but fair)

| Axis | /10 | Note |
|---|---|---|
| Demo narrative (5-min path) | 8 | Coherent reform story, offline-proof, reset button, MH-credible seeds (MIDC/MPCB/MSEDCL/PSI-2019 ring true). |
| Engineering integrity | 4 | Three headline claims fakeable in DevTools (forgery, no-auth officer, static analytics). |
| PPT / first impression | 4 | 8 slides (need 6), placeholders, no numbers, no MAITRI table, text walls at 9–11pt, 40–60% voids on 4 slides, no screenshot/mock/QR. |
| PS fit (adjectives, not noun) | 5 | All five outcomes render; 2.5 implemented. |
| MAITRI/NSWS differentiation | 2 | No kill-table, no complement-not-duplicate API/SSO story. Fatal for this PS. |
| AI credibility | 1 | Zero. Filename says AI, code has none. |
| Inclusivity (Marathi/offline/mobile) | 2 | Offline ✅, rest ❌. |
| Scale/security/process | 2 | File DB races, no auth/audit/tests/Docker/CI/git. |
| **OVERALL** | **4.6** | **Bottom-half as-is. Demo strength cannot compensate for PPT + integrity holes at screening.** |

---

## 5. TOP 5 MUST-FIX — selection at any cost, in priority order

Ordered by **shortlist ROI per hour**, not engineering purity. Do in this order. Stop polishing anything else.

### FIX 1 — PPT: 8→6 slides, kill placeholders, add numbers + MAITRI kill-table [EFFORT: 3–4 hrs — HIGHEST ROI]
**Why first:** screeners never run your code. This alone lifts PPT 4.0→7.0 and national-screening chance 15%→55%.
- Delete Thank-You (S8), fold Innovation (S6) into Solution (S2). Exactly 6 slides: Title / Solution+Innovation / Tech / Feasibility / Impact / References.
- Replace every `[Team ID]`/`[Team Name]` with real values + college + names + slide numbers + footer. Placeholders on slide 1 = "not serious" auto-ding.
- Add 4-col kill-table (Capability | MAITRI | NSWS | UdyogSarthi) × 5 rows (personalized roadmap, pre-validation, parallel workflow, SLA/bottleneck, lifecycle/renewals) + 1 line: "We complement, not duplicate: SSO + API layer over MAITRI/NSWS, DigiLocker/MCA21 read-only, Phase-2."
- Add baseline→target strip on Impact (mark as *pilot targets* with dated sources): e.g. "30–45d → <15d pilot; resubmissions −40%; checklist completeness ≥95%; SLA visibility 100% pilot depts" + MVP scope box: "MVP: 3 approvals (Udyam, Shops&Estt, Fire NOC) × 1 district, 2 roles, MR+HI+EN."
- Unify name to ONE spelling everywhere (`UdyogSarthi AI` recommended). Body ≥16pt, ≤5 bullets/box, kill 9pt captions, vertically center to remove voids. Add ONE dashboard mock screenshot + demo QR/GitHub. Re-export via PowerPoint COM 1920×1080, re-read PNGs.
- **If you do nothing else, do this.** Judged tomorrow as-is, the PPT kills you before the demo loads.

### FIX 2 — Kill the forgery: server-side doc validation, reject client `passed` flag [EFFORT: 0.5 day — 20–30 lines in `server.js`]
**Why second:** the single most exposed live lie. Any technical judge destroys "pre-validation" in 60 seconds.
- Server ignores `d.passed`; checks extension/MIME/≤10MB/required-set-per-checklist/expiry-date itself. Unverified stays `verified:false`, never enters vault, never auto-clears officer query.
- Demo the REJECTION path live (red checks) — judges love watching red. Keep `app.js` checks as UX preview, but truth lives server-side.
- Files: `server.js:154-167` (documents route), `app.js:253-269` (keep as progressive enhancement only).

### FIX 3 — Demo-grade auth + input hygiene + SLA anti-gaming [EFFORT: 0.5 day]
**Why third:** closes the three cheapest Q&A kills in one pass.
- Hardcoded `applicant/demo123` + `officer/officer123` issuing signed token/opaque session; middleware rejects cross-role `PATCH /track`, `POST /documents`, `PATCH /inspections`. Closes zero-auth hole (~2 hrs).
- `POST /api/checklist` → 400 on empty/unknown profile (fix `criticalDays:null` from `Math.max(...[])` at `server.js:68`); whitelist `action ∈ {approve,query,reject,review,inspect,deemed}` with 400 on unknown (`server.js:144-145`); whitelist `PATCH /inspections` fields, kill `Object.assign(i, req.body)` (`server.js:187`) + dead `forEach(()=>{})` (`server.js:179`).
- SLA: stop resetting clock on every touch — use `createdAt`-anchored deadline or stop-the-clock only on applicant-actionable `Queried`; add 60s/read-time auto-deem sweep (`left<0` + non-terminal → `Deemed` + alert + analytics event) + grievance `createdAt+7d` auto-escalation with timeline entry. Makes "deemed" and "auto-escalates" TRUE and gives a killer demo moment (backdate one seed track to show auto-deem).

### FIX 4 — ONE real AI feature, no more AI-washing [EFFORT: 1–2 days — non-negotiable for finale]
**Why fourth:** without this you lose to every weaker-but-"AI" team. Pick exactly ONE (cheapest first):
- (a) **TF-IDF-ranked knowledge search** over expanded ~60-article Maharashtra rule corpus with source citations + eval (citation precision + checklist accuracy on n samples). Turns the FAQ into a defensible "Regulatory RAG-lite."
- (b) **OCR on upload** via Tesseract.js (expiry/name extraction feeding Fix-2 validator) — turns your weakest mock into the strongest demo in the room ("upload MAITRI-form-like PDF → flags in <30s with confidence + human-review queue").
- (c) Logistic-regression risk scorer trained on history seeds with shown feature weights (replaces uncalibrated heuristic + dead `riskBump`).
- Rename deck claims to match reality ("rule engine + risk heuristic, ML scorer v1, roadmap RAG") until the feature lands. Never narrate "AI model" you don't have — say the true sentence.

### FIX 5 — Make the charts move + speak Marathi [EFFORT: 1–2 days combined]
**Why fifth:** proves impact + inclusivity, the two most-weighted finale blocks after tech.
- **Live-fed analytics:** pending-track counts, query rates, combined-inspection %, grievance SLAs computed from `db.applications`; keep seeds as "baseline regime" series. Then "file an app → chart moves" works. One memorable number beats five adjectives.
- **EN/MR toggle:** i18n JSON for nav/wizard/tracker + Marathi knowledge answers. ~1 day, outsized scoring return for a Maharashtra ministry PS. Add low-bandwidth/assisted (CSC-operator) line + offline-draft-then-sync story.
- Link inspection-complete → linked `Inspection scheduled` tracks flip to `Under review`; warn on double-booked slot. Dependency-gate Group B/C/D as `Locked` until predecessors clear (mini-engine turns the label defensible).

**Explicitly OUT of top-5 (do NOT spend hours here before the above):** SQLite swap, Dockerfile/OpenAPI/CI, PWA/responsive pass, DigiLocker deep integration, 36-district seeds, SMS push. All valuable, all P2/P3 — they don't save you if Fixes 1–4 are missing. If time remains after 1–5: SQLite (`better-sqlite3`, still offline, real audit-log table) → Dockerfile + 10 supertest smokes → PWA manifest.

---

## 6. If judged TOMORROW as-is — survival protocol

1. Never open DevTools yourself. Never say "AI model" — say "rule engine + risk heuristic, ML scorer on roadmap" (true and safe).
2. Backdate one track's `updatedAt` pre-demo so a 🔴 breach + deemed-eligibility alert is visible in the strip. Seeds never breach otherwise.
3. Rehearse the README 10-step script verbatim; keep `POST /api/reset` one click away. Narrative is your highest-scoring asset.
4. Q&A on DigiLocker/auth/scale: answer with the Fix-2/3 plan pointing at exact file+line ("validator lands in `server.js` documents route, ~20 lines"). Judges reward teams that know gaps cold over teams that bluff.
5. Do NOT claim "auto-escalates," "verified reuse," "parallel engine," or "68→31d measured" — all four are disprovable live. Claim what you have: "checklist preview, vault filename reuse, parallel-group display, seeded before/after illustration."

---

## 7. Development Lead recommendation

**CONDITIONAL: bubble-pick for internal demo round on narrative strength; NOT shortlist-ready on paper; NOT finale-ready at all.**

- **Today:** internal 40–50% (live demo, non-technical jury) / screening 15–20% / finale <5%. Overall 4.6/10.
- **After Fix 1 alone (3–4 hrs):** screening 50–60%. Highest leverage in the repo.
- **After Fixes 1–3 (1 day):** internal 65–75%, survives technical Q&A without humiliation.
- **After Fixes 1–5 (4–6 days):** 7.2–7.5/10, genuinely shortlistable + finale-defensible. The codebase is small and readable — P0 is hours, one-AI-feature is days. No exotic stack needed.

Trade accepted as-is: speed-of-demo over integrity/scale — right for a college qualifier rehearsal, wrong for anything with a technical jury or ministry evaluator. Fix in the order above and this goes from "neat boxes, already exists" to "intelligent layer MAITRI doesn't do, with one live AI moment and true SLA enforcement."

*Hard boundaries respected: review + coordination only. No implementation fixes applied here. Findings dispatched as Fix 1–5 above for dev agents. QA PASS / code-review APPROVED / security SECURE_WITH_NOTES in this repo cover `start.ps1` launcher only and do NOT gate the app-level gaps in this verdict.*
