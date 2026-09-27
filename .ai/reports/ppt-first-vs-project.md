# PPT-First-Vision vs Project — Brutal Honesty Report (SIH-26130)

**Date:** 2026-09-09 · **Reviewer:** Development Lead · **Stance:** brutally honest, no sugarcoat (explicitly requested)
**Question answered:** "why you not follow as it in our project" — answered directly in §0.

**Files:**
- Vision PPT (FIRST): `Udyog-Sarthi-AI-SIH26130-IDEA-PPT-First-generated-main.pptx` — **6,423,969 bytes / 8 slides** (confirmed `len(Presentation.slides)==8`)
- Current PPT (FIXED): `Udyog-Sarthi-AI-SIH26130-IDEA-PPT.pptx` — **707,340 bytes / 6 slides** (fixed per `ppt-fix-report.md`)
- Project: `server.js` (697 lines), `public/app.js` (499 lines), `public/index.html` (29 lines), `data/seed.js` (215 lines), `package.json` (1 dep `express`), `README.md`
- Prior reports read FIRST: `ppt-visual-review.md` (4.0/10), `project-verdict.md` (4.6/10), `ppt-fix-report.md` (8→6 done), `p0-fix-report.md` (5/5 P0 done), `ai-fix-report.md` (TF-IDF + live analytics + i18n done)

**Render method (as instructed, no fallback):**
- PowerPoint COM `PowerPoint.Application` (`C:\Program Files\Microsoft Office\Root\Office16\POWERPNT.EXE` exists → `True`), `Slide.Export PNG 1920x1080` → `.ai/reports/ppt-first-slides/first-slide-01.png` … `08.png` (161/137/121/123/107/89/92/72 KB — sizes prove real render, not placeholder).
- Each PNG opened with Read tool and visually inspected (layout, voids, placeholders, diagrams) — NOT just text dump.
- Text extracted via `python-pptx` to `C:\Users\Rohit\AppData\Local\Temp\opencode\first-dump.txt` (127 lines, 8 slides) — full text in §5 appendix reference.

---

## 0. Direct answer to your complaint — why project doesn't follow vision PPT

**Short answer: because the vision PPT was never buildable as-written for an SIH offline demo, and the devs silently built something else without updating the PPT. Both sides are at fault. The PPT lied first, the code diverged second, nobody reconciled them.**

Brutal breakdown:

1. **Vision PPT is AI-generated enterprise fantasy, not a build spec.** It promises `LLM+RAG + MongoDB + React/Next + OCR + Workflow Engine + Email/SMS/push + RBAC/encryption/audit + API-ready NSWS integration` with zero versions, zero costs, zero API keys, zero pilot scope, zero numbers, and `[Team ID]/[Team Name]` placeholders on every slide. That stack needs cloud + LLM billing + Mongo Atlas + OCR pipeline + SMS gateway + DigiLocker MoU. You have a college judging hall with no internet, one `npm start`, port 3000, and days of time. No team builds the vision stack in that constraint. The PPT was written before a single line of code and never costed.

2. **Devs chose survival over fidelity — and were right to, but wrong to stay silent.** They built `Express + JSON file + vanilla JS + TF-IDF + filename checks + alert strip` because it **starts every time offline, demos in 5 minutes, resets with one click**. Mongo → JSON file (no Atlas dependency), LLM → TF-IDF (no API key, no hallucination liability, honestly labelled `no LLM/embeddings`), React → vanilla (no build step), OCR → extension/size/expiry/holder checks (no Tesseract weight), SMS → in-page strip (no gateway). Every deviation was a deliberate offline-demo tradeoff. The sin is they never wrote it down: PPT still says `LLM+RAG`, code says `TF-IDF cosine (no LLM)` (`server.js:375-399`). PPT still says `MongoDB`, code says `data/db.json` (`server.js:11,45-53`). Judge opens both, sees a lie in 30 seconds.

3. **Where deviation was justified vs where it was a lazy miss:**
   - JUSTIFIED (keep, just fix PPT wording): JSON-file over Mongo (offline > scale for internal round), TF-IDF over LLM (honest retrieval > fake AI-washing), vanilla over React (zero build > framework badge), alert-strip over SMS (no gateway in hackathon).
   - MISS (no excuse, hours of work): no dependency gating (Group-D CTO filed `Applied` day-1 alongside Group-A — legally impossible, `server.js:461` creates all tracks `Applied`), no OCR stub at all (vision says `OCR + document classification`, code has zero OCR import — `package.json:11` proves it), no audit log table (vision says `audit logs`, code has only `remarks` strings), renewals hardcoded (`app.js:185` `58 days` string), knowledge answers English-only despite Maharashtra PS (i18n covers chrome/wizard/tracker only, `public/i18n.json` 36 keys, K01-K60 English only).

4. **Current FIXED PPT already admits the vision was wrong — but project still doesn't match even the fixed PPT.** The 6-slide fix added kill-table, pilot strip `68→31 days • 41%→12%*`, layered arch with `Tesseract/pgvector/Phase-2`, cited refs. Those numbers are **seed projections with `*Seed projection` footnote**, not measured. Analytics page still mixes 38 hardcoded `history` rows (`seed.js:124-144`) with live counters (`server.js:663-675`). If a judge files an app and asks "show me 68→31 moving", only the LIVE card moves — the headline `68→31` never moves. That's the next lie waiting to be caught.

**One-line verdict for this report: vision fidelity ~35%. You built the screens for the vision, not the engines.**

---

## 1. Coverage % (honest math)

30 distinct verifiable claims extracted from vision slides 2/3/4/6 (names, arch, workflows, numbers, depts, schemes, AI/OCR, notifications, security, lifecycle).

| Grade | Count | Meaning |
|---|---|---|
| **Yes** (works as claimed) | 3 / 30 (10%) | Express API, checklist filter+fee math, inspection CRUD + linkage (after P0) |
| **Partial** (screen exists, engine thin/mocked/hardcoded) | 15 / 30 (50%) | Roadmap, doc checklist, dashboards, TF-IDF-as-RAG, risk heuristic, SLA countdown, grievance ladder, parallel labels, vault reuse, analytics baseline+live, i18n chrome, 6 depts/12 approvals/6 schemes seeds |
| **No** (claimed, zero implementation) | 12 / 30 (40%) | React/Next, MongoDB, LLM/embeddings, OCR/classification, Email/SMS/push, encryption/audit-log, cloud hosting, versioned KB, configurable engine, govt API integration, predictive bottleneck, renewal lifecycle engine |

**Weighted fidelity = (3×1.0 + 15×0.5 + 12×0.0) / 30 = 10.5/30 = 35%.**
Call it **35% vision fidelity**. The fixed 6-slide PPT lifts *paper* fidelity to ~60% (because it rewords claims toward reality), but *code* fidelity stays 35% until P0/P1 below land.

---

## 2. Claim-by-claim mapping (PPT Claim | Implemented? | Evidence file:line | Why not followed)

### Slide 2 — Solution (7 bullets + Why Different + KVP + 6-box flow)

| # | Vision PPT claim | Verdict | Evidence | Why deviated (root cause) |
|---|---|---|---|---|
| 2.1 | Unified platform for approvals, licences, NOCs, inspections, renewals & schemes | **Partial** | `app.js:62-66` NAV 10 routes, `app.js:170-187` dashboard, `app.js:369-373` inspections, `app.js:376-393` schemes; renewals `app.js:185` hardcoded `58 days` string | Screens built, renewal engine not. Time: renewal scheduler + validity table per Act = days; team hardcoded one card to keep demo path. Miss, not tradeoff — cheap to fix with real date math. |
| 2.2 | Entrepreneur Login: business profile + personalized roadmap | **Partial** | `server.js:365-373` `POST /api/login` hardcoded 2 users → opaque tokens; `app.js:190` WIZ defaults; `server.js:406-412` checklist | Real login flow exists after P0, but identities hardcoded (`DEMO_USERS`), no signup/profile persistence/versioning. Offline tradeoff justified; passwordless SSO/MAITRI SSO was never in scope for demo. PPT says `Login`, code delivers demo-grade — must label as such. |
| 2.3 | AI Approval Engine: identifies approvals by sector, location, size & stage | **Partial** | `server.js:99-117` `matchChecklist` filters `stage+sizes+sectors`, sorts Group A-D, sums fee, max SLA; `server.js:135-145` validates sector/size/stage | Sector/size/stage real, **district ignored in filter** (accepted but unused), investment/workers unused for checklist (only schemes, `seed.js:116` admits `roadmap, not yet implemented`). No rule versioning. Thin filter, not engine. Rule-engine needs decision-table + triggers — skipped for speed. |
| 2.4 | Document Intelligence: checklist generation + pre-validation before submission | **Partial** | Checklist `server.js:99-117` real; validation `server.js:147-228` `validateDocumentInput` ext/size/expiry/holder, `app.js:305-329` client preview + server POST | After P0, server rejects forged `passed:true` with 422 (`p0-fix-report.md` proven). BUT: JSON-only, no file bytes (`MAX_DOC_BYTES` checks a number the client sends), no OCR, no cross-form consistency, no completeness score. Vision says `Intelligence`, code does metadata gate. Multipart + Tesseract = P1 week, skipped. |
| 2.5 | Unified Dashboard: track applications, approvals, renewals & SLA timelines | **Partial** | `app.js:170-187` dashboard progress/risk/vault, `app.js:241-278` tracker + `ring()` SLA rings, `server.js:73-82` `trackSla` | Tracking + SLA countdown real + auto-deemed sweep after P0 (`server.js:231-260`). Renewals fake (see 2.1). Timeline = `remarks` strings, no audit table. Dashboard is best thin slice (verdict B-), still static renewals. |
| 2.6 | Officer Dashboard: monitor pending cases, bottlenecks & workloads | **Partial** | `app.js:332-351` officer queue per dept + risk badges + `offAct`, `server.js:472-498` officer-only PATCH | Queue + approve/query real, auth closed after P0 (401/403). Bottleneck = static `byDept` from 38 seeds (`server.js:654-658`), workload = none (no assignment, `To be assigned` in `seed.js:197-198`). Vision promises workload visibility; code has none. |
| 2.7 | AI Assistant: explains requirements & next steps in simple language | **Partial** | `server.js:293-361` TF-IDF `ktok/tfidfSearch/evalKnowledge` over 60 articles, `app.js:474-499` knowledge UI with scores + `no LLM` strip; `ai-fix-report.md` P@1 6/8=75% | Honest retrieval, NOT assistant. No conversational LLM, no citations-to-GR (sources say `Illustrative summary — confirm`), no Marathi answers. Vision says `AI Assistant`, code says `TF-IDF ranker`. Downgrade was honest (refused to fake LLM) — PPT must stop saying LLM. |
| 2.8 | 6-box flow: Business Profile → Approval ID → Checklist → Pre-Validation → Workflow → Approval & Compliance (slide-02.png top strip) | **Partial** | All 6 boxes have routes: wizard → checklist → documents → tracker/officer → inspections → dashboard/renewals | Flow renders end-to-end (README 10-step). But transitions aren't gated: filing creates ALL tracks `Applied` including Group-D CTO (`server.js:461`), inspection-complete flips correctly after P0 (`server.js:577-590`), renewal end missing. Flowchart true as navigation, false as state machine. |
| 2.9 | Why Different: personalized intelligence / proactive validation / workflow optimization | **Partial** | Personalized = 2.3 thin; proactive = 2.4 metadata-only; optimization = `combined` string (`server.js:115`) + joint booking (`server.js:539-555`) | Only combined-inspection suggestion is genuinely optimizing (1 visit vs N). Rest are labels. Vision differentiators need MAITRI/NSWS kill-table to mean anything — vision PPT has none (fatal, see `ppt-visual-review.md` §MAITRI FAIL). Fixed PPT added it; vision has zero. |

### Slide 3 — Technical Approach (arch 5 boxes + flowchart 7 boxes + 9-bullet stack)

| # | Vision claim | Verdict | Evidence | Why not followed |
|---|---|---|---|---|
| 3.1 | React / Next.js UI | **No** | `public/index.html:1-29` static shell + `public/app.js:1` `vanilla JS`, no `package.json` react/next, no build step (`README.md:16` boasts `No build step`) | Deliberate offline tradeoff: vanilla = zero build, judging-hall-proof. Justified for demo, but PPT must stop claiming React. Fix PPT, not code. |
| 3.2 | Node.js + Express API | **Yes** | `server.js:5` `require("express")`, `package.json:11` `express ^4.19.2`, `server.js:697` `listen(3000)` | Only stack claim fully true. Keep. |
| 3.3 | LLM + RAG AI Layer | **No** | `server.js:375-399` explicitly `TF-IDF cosine (no embeddings, no LLM)`, `app.js:492` strip `no LLM/embeddings`, `ai-fix-report.md:11` `No fake AI: no LLM/embeddings claimed anywhere` | Devs refused to AI-wash — correct call. Vision PPT AI-washed before code existed. PPT is wrong, code is honest. Never "fix" by faking LLM; fix PPT to say `TF-IDF retrieval + rules`. |
| 3.4 | MongoDB (profiles, applications, compliance) | **No** | `server.js:11` `DB_FILE data/db.json`, `server.js:45-53` `loadDb/saveDb` sync JSON, no `mongodb` in `package.json` | Offline tradeoff: JSON file = no Atlas, no network, resettable. Justified for internal round, fatal for finale scale Q&A (`What happens with 10k concurrent?` → answer: sync read-modify-write races). PPT must say `JSON file (demo) → Mongo/pgvector roadmap`. |
| 3.5 | Workflow Engine (SLA & parallel) | **Partial** | SLA: `server.js:66-82` immutable `slaStartedAt` + `server.js:231-260` 60s sweep → auto-Deemed (P0 real); Parallel: `seed.js:12-35` `parallelGroup A/B/C/D` + `server.js:108-111` sort/display only | SLA half now real (countdown + auto-fire proven in `p0-fix-report.md`). Parallel is labels + sort, no DAG/gating/locking. Engine needs predecessor check — hours of work, skipped. Biggest legal-credibility miss. |
| 3.6 | Rules / Decision Engine (approval mapping) | **Partial** | `server.js:99-129` `matchChecklist` + `eligibleSchemes` (`min(maxBenefit, inv*0.25)` illustrative, `project-verdict.md` notes not sourced to any GR) | Filter + formula real but thin, no versioning, no source citations, no conditional triggers. Vision says `Decision Engine`, code has `filter+sort`. |
| 3.7 | OCR + document classification | **No** | `package.json` 1 dep only; `grep OCR server.js/app.js` = comments only; validation is filename/ext/size (`server.js:149-151` `ALLOWED_EXT/MIME`) | Zero OCR bytes. Needs Tesseract.js + upload pipeline (multipart) = 1-2 days + bundle weight. Skipped entirely. Vision's strongest demo moment (`upload PDF → flags in <30s`) doesn't exist. Pure miss. |
| 3.8 | Email / SMS / push notifications | **No** | `server.js:632-648` `/api/alerts` polling JSON; `app.js:76-80` `alertstrip` innerHTML polling; no nodemailer/twilio/web-push in `package.json` | In-app strip only. No gateway credentials in hackathon — justified to skip, but PPT must stop listing it as built. Say `in-app alerts (SMS/push Phase-2)`. |
| 3.9 | Role-based access, encryption & audit logs | **Partial** (RBAC demo-only; encryption/audit **No**) | RBAC: `server.js:28-42` `authRole/requireOfficer` 401/403 on 3 routes; encryption: zero (no bcrypt/crypto/at-rest); audit: zero table (only `remarks`/`updates` strings in tracks/grievances) | P0 closed the anonymous-curl hole (proven 401/403). But tokens static (`demo-officer-token`), no expiry/signing, no per-user data isolation, no audit-log table, no encryption. Vision promises enterprise security; code has demo gate. Must label `demo auth`. |

### Slide 4 — Feasibility (risks, tech feasibility, resources, aligned-with, implementation)

| # | Vision claim | Verdict | Evidence | Why not followed |
|---|---|---|---|---|
| 4.1 | Versioned regulatory KB with source references | **Partial** | `seed.js:58-119` K01-K60 with `tags` + `source` (e.g. `Illustrative summary — confirm with MPCB portal`), `server.js:299-310` `knowCorpus` tops up to 60 | 60 articles real (up from 10), but every source says `Illustrative — confirm`, no version numbers, no GR dates, no update pipeline. Vision says `Versioned`, code has static array. Versioning = table + changelog — not built. |
| 4.2 | AI-assisted checklist & pre-submission validation (mitigation) | **Partial** | See 2.3+2.4 | Same thinness. Mitigation true for demo profiles, false for edge cases (`criticalDays:null` fixed to 400 after P0, but taluka/investment triggers still missing). |
| 4.3 | Configurable engine for parallel dept-specific processes | **No** | `seed.js` hardcoded `parallelGroup`, no admin UI, no config JSON, no per-dept SLA override (`slaWeight` in `seed.js:3-10` never read by `trackSla`) | `slaWeight` dead data, `riskBump` dead (`project-verdict.md` proven). Configurability claimed, hardcoding delivered. Hours to expose config, not done. |
| 4.4 | RBAC/encryption/secure storage/audit trails (mitigation) | **No** (beyond demo gate) | See 3.9; `data/db.json` plaintext JSON, `README.md:16` `persists in data/db.json` | No secure storage (plaintext file), no encryption, no audit trail table. Privacy mitigation in PPT is aspirational, not implemented. DPDP answer = none. |
| 4.5 | API-ready for future integration with portals | **No** | Zero `fetch(` to MAITRI/NSWS/DigiLocker/MCA21 in `server.js/app.js`; vault `seed.js:204-208` `DigiLocker-style` filename strings only | Honest label would be `no integration`. Fixed PPT softens to `SSO + read-only, Phase-2` dashed — vision PPT says `API-ready` as if built. Nothing ready: no OpenAPI, no connector interface, no sandbox stub. |
| 4.6 | Cloud hosting / Doc storage & OCR / LLM API / RBAC system (resources) | **No** | Runs `localhost:3000` offline (`README.md:6-16`), 2 MB JSON limit (`server.js:13`), no cloud manifest/Dockerfile/CI | Resource slide describes a cloud product; project is a local demo. Justified for judging-hall survival, but PPT must scope MVP as `offline pilot` not cloud. |
| 4.7 | Aligned with NSWS / EoDB / MH Digital Governance | **Partial** | `app.js:122-123` landing copy mentions MIDC/MPCB unification; K32/K33 explain MAITRI-KYA/NSWS-EntityLocker as patterns (`seed.js:91-92`); fixed PPT adds complement line | Vision PPT says `Aligned With` as pills with zero integration path. Project mirrors patterns offline (wizard≈KYA, vault≈EntityLocker) but integrates with nothing. Complement-not-duplicate story exists only in fixed PPT, not vision, not code. |

### Slide 5 — Impact (stakeholder 4 cards + broader 3 bullets + inclusion)

| # | Vision claim | Verdict | Evidence | Why not followed |
|---|---|---|---|---|
| 5.1 | Personalized roadmap / fewer errors / transparent tracking (MSME card) | **Partial** | Wizard `app.js:217-229` renders fees/SLA/docs/groups; tracker rings `app.js:247-253`; error reduction unmeasured | Roadmap renders, but `fewer errors` unproven (no before/after measurement, no completeness score). Vision has zero numbers; project seeds `68→31 / 41%→12%` (`seed.js:124-145` 38 rows + `incompleteRates`) but they're illustrative constants, not logs. Impact without measurement = marketing. |
| 5.2 | Better completeness / reduced scrutiny / workload visibility (Dept card) | **Partial** | Officer sees pre-validated files (`app.js:342-344` risk + docs), but scrutiny reduction unlogged, workload visibility absent | No metric: no query-rate-before/after from live data (queryRate now live `server.js:673` but never baselined). Card true as aspiration, unproven as impact. |
| 5.3 | Centralized case mgmt / SLA monitoring / inspection scheduling / bottleneck ID (Officer card) | **Partial** | Case mgmt + SLA + scheduling real (see 2.5/2.6); bottleneck = `byDept.saved` static (`server.js:654-658`) | Bottleneck ranking doesn't move with live filings (only `pendingByDept` live `server.js:670-672` moves). Vision promises intelligence; code shows seeded chart + live sidecar. |
| 5.4 | Faster understanding of registrations/licences/incentives (Startup card) + Digital Inclusion guided experience | **Partial** | Knowledge 60 articles + schemes finder (`app.js:385-392` est. benefit), wizard 3 steps, EN/MR toggle chrome (`app.js:48-60`, `public/i18n.json` 36 keys) | Guided experience real; inclusion half: toggle translates nav/wizard/tracker, knowledge/schemes/officer remain English. First-time low-literacy UX (voice/assisted/CSC) absent. MH-context points half-claimed. |

### Slide 6 — Innovation (7 differentiators + Traditional→UdyamSetu bar)

| # | Vision claim | Verdict | Evidence | Why not followed |
|---|---|---|---|---|
| 6.1 | Personalized Approval Roadmap (dynamically determines) | **Partial** | See 2.3 | Dynamic within 12-approval universe, not across full registry. `Dynamically` oversells a 10-line filter. |
| 6.2 | Regulatory RAG (explainable, grounded) | **Partial** | TF-IDF scores + `matched` terms + `source` line (`server.js:336-339`, `app.js:494-497`), eval P@1 75% (`server.js:354-361`) | Grounded in 60 demo summaries, not regulations. No chunking/embeddings/reranker/vector DB (vision implies all). Honest RAG-lite, not RAG. |
| 6.3 | Pre-Submission Intelligence (detects missing/inconsistent before) | **Partial** | Missing-type via checklist pre-filing list (`app.js:227`), inconsistent via expiry/name/size (`server.js:152-228`) | No cross-document consistency (PAN vs Aadhaar vs GSTIN match), no required-set-per-approval enforcement (any `docType` 2-120 chars passes), no completeness %. Detects format, not substance. |
| 6.4 | Parallel Workflow Optimization (simultaneous) | **No** | See 3.5 | Labels, not optimization. No critical-path shortening, no joint-slot optimizer (slot picked manually, `app.js:271-272` date input). |
| 6.5 | Risk-Based Scrutiny (configurable indicators) | **Partial** | `server.js:84-92` `riskScore` = 10 + hazard + size + inspection/query bumps − verified discount, bands Green<35/Amber≤65/Red | Runs live, but weights uncalibrated, `riskBump` per approval never read, thresholds arbitrary, no MPCB Red/Orange/Green mapping despite K02 claiming it, no learning. `Configurable` false — hardcoded. |
| 6.6 | SLA & Bottleneck Intelligence (predicts bottlenecks) | **Partial** | SLA countdown + breach/deemed real; bottleneck = historical avg diff, no prediction | Identifies delays, predicts nothing. No breach predictor, no escalation packet. `Predicts` is AI-washing. |
| 6.7 | Compliance Lifecycle (renewals/inspections/obligations after approval) | **No** | Inspections CRUD real, renewals/obligations fake (see 2.1) | Lifecycle needs validity table + cron + re-apply flow. Only inspection half exists. Vision's only post-approval promise is 80% missing. |

### Cross-cutting (naming, numbers, depts, schemes)

| # | Vision fact | Verdict | Evidence |
|---|---|---|---|
| X.1 | Product name | **No** (vision self-inconsistent) | File `Udyog-Sarthi-AI` vs S2 title `UDYAMSETU AI` vs S2 footer `UdyamSetu AI` vs S8 `UdyamSetu AI`/`UdyamSetu` (first-dump.txt S2/S8) vs project `Udyog Sarthi` (`server.js:1`, `index.html:14`). 4 variants. Fixed PPT unified to `Udyog Sarthi AI` — vision never did. |
| X.2 | Numbers (baselines, targets, costs, timelines) | **No** (vision) / **Partial** (project) | Vision: zero numbers in 8 slides (visually confirmed: no digits except `2026`/`26130`). Project: `68→31d / 41%→12% / 38 rows / 12 approvals / 6 depts / 6 schemes / 8 districts / 60 articles / P@1 75%` — but all seeds/projections, none measured. Fixed PPT canonicalizes `68→31 • 41%→12%* • ≥95% • 100%*` with footnote — vision had none. |
| X.3 | Departments / approvals / schemes / districts | **Partial** | `seed.js:3-10` 6 depts (MIDC/MPCB/LABOUR/FIRE/MSEDCL/DOI), `:11-36` 12 approvals with fee/SLA/docs/groups, `:37-56` 6 schemes (PSI-2019/IT-2023/TEXTILE/EV-2021/MSME-FEE/PMEGP-INT), `:120-121` 8 districts + MIDC areas. Vision names no department, no scheme, no district. Project concretizes vision's vagueness — credit where due — but covers 8/36 districts, 12 approvals vs 325+/2200 in NSWS reality. Pilot scope, not state coverage. |

---

## 3. Visual proof (what the 8 PNGs actually show — not text dump)

- `first-slide-01.png` (161 KB): serif `SMART INDIA HACKATHON 2026`, 6 bullets, `[Team ID]/[Team Name]` blue brackets, bottom 50% empty white void, brain-bulb graphic right. Unfinished template.
- `first-slide-02.png` (137 KB): `UDYAMSETU AI` title, 6-box navy→slate strip, 17 bullets across 3 columns at ~11pt, middle `Our Solution` box bottom-half empty. Text wall, no screenshot/number/icon.
- `first-slide-03.png` (121 KB): linear `React → Node → LLM+RAG → MongoDB → Workflow` chain (architecturally backwards — DB in middle), 9-bullet stack, 7-box flowchart, ~9pt captions, 40% voids. Fresher block diagram, no layers/auth/vector DB/OCR engine name/API spec.
- `first-slide-04.png` (123 KB): 5 blue→navy risk pills (neat), but `Technical Feasibility` 2 bullets, `API-ready for future` = admits no integration, zero timeline/cost/team/MVP.
- `first-slide-05.png` (107 KB): 4 stakeholder cards + inclusion strip, 100% adjectives (`faster/fewer/reduced/transparent`), zero metrics.
- `first-slide-06.png` (89 KB): 7 grey cards 3+3+1 (7th centered alone = asymmetry hole), self-comparison bar only, no MAITRI/NSWS table, no novelty/IP.
- `first-slide-07.png` (92 KB): 2×2 boxes `official resources / relevant notifications / reports` — no URLs/GR nos/dates/stats, ~60% empty color.
- `first-slide-08.png` (72 KB): `THANK YOU! / UdyamSetu AI`, `Team [Team Name]` placeholder again, 4th name variant, vast whitespace. Wastes a counted slide.

Vision PPT score stays **4.0/10** (`ppt-visual-review.md`): correct problem fit, coherent flow, clean palette — but 8 slides (need 6), placeholders, no numbers, no MAITRI answer, AI without evidence, no demo. Nothing in re-render changes that.

---

## 4. Root causes — why devs deviated (and whether each was justified)

| # | Cause | What it killed | Justified or miss? |
|---|---|---|---|
| R1 | **Offline judging-hall constraint.** No internet, no Atlas, no LLM key, `npm start → localhost:3000` must survive. | Mongo → JSON file, LLM → TF-IDF, SMS → strip, cloud → localhost | **Justified.** Right trade for internal qualifier (`project-verdict.md`: `right trade for college qualifier, wrong for finale`). Fault is PPT still claiming cloud/LLM. |
| R2 | **Vision PPT written before costing.** 6.4 MB AI-generated template with enterprise stack, no versions (`which LLM? which embeddings? which vector DB? which OCR?`), no billing, no MoU path. Devs inherited an uncosted promise. | All of §2 No-column | **PPT's fault first.** Devs should have pushed back day-1 and reworded PPT to `demo stack + Phase-2`. They didn't — silent divergence. |
| R3 | **Speed over integrity (1 dep vs production).** `package.json` 1 dep, 697+499 lines total, days of work. Real RBAC/OCR/audit/DAG/Mongo-migration = weeks. | Rule-engine depth, gating, audit log, OCR, i18n depth, tests/Docker/CI/git (repo not even version-controlled per verdict) | **Half-justified.** P0 (validation/auth/sweeps/linkage) + P1 (TF-IDF/live/i18n) closed the cheapest kill-shots in days. Remaining gaps need explicit P2 scheduling, not denial. |
| R4 | **Honest refusal to fake AI — but no PPT update.** Team correctly refused to hallucinate `LLM` accuracy; shipped TF-IDF with `no LLM` labels + 75% eval. | LLM/RAG/OCR/prediction claims | **Code justified, comms miss.** The most ethical decision in the repo (no fake AI) looks like a lie because PPT still says `LLM+RAG`. One `find-replace` in PPT would turn a liability into a moat (`honest retrieval > fake AI`). |
| R5 | **No backlog grooming / INVEST / estimation.** No sprint tasks for `slaWeight`/`riskBump`/district-filter/gating — all left dead/half-wired. No planning poker, no <1-day splits. | Configurability, district-aware checklist, calibrated risk, renewal dates | **Process miss.** Classic junior-dev pattern: screens first, engines later, dead fields left in seed. Dev-lead should have flagged `riskBump`/`slaWeight` unread in review. |
| R6 | **Naming + numbers never owned.** 4 name variants, zero numbers in vision, seeds invented numbers without sources. | Credibility | **Ownership miss.** 30-minute fix (pick `Udyog Sarthi AI`, footnote every number as `*pilot target/seed projection`), left for 3 report cycles. Fixed PPT finally did it — vision never had it. |

---

## 5. Top 5 mismatches (the ones that lose you the shortlist if asked live)

1. **LLM+RAG + OCR claimed, TF-IDF + filename gate delivered.** Vision S3 stack bullets 4+6 vs `server.js:293-361` (TF-IDF, `no LLM`) + `server.js:149-228` (ext/size/expiry/holder, no bytes) + `package.json` (zero ML/OCR deps). Judge kill-shot: `Upload a scanned Marathi NOC and show OCR extraction.` Answer today: cannot. Demo the REJECTION path (red checks + 422) instead; never say `AI model`.
2. **MongoDB + React/Next claimed, JSON file + vanilla delivered.** Vision S3 arch vs `server.js:11,45-53` + `index.html` + `README.md:16`. Kill-shot: `What happens with 10,000 concurrent applicants?` Answer today: sync read-modify-write races, no locking. Say `offline pilot store, Mongo/pgvector migration Phase-2` — fixed PPT arch footnote already says this; vision doesn't.
3. **Enterprise security + notifications claimed, demo gate + strip delivered.** Vision S3 bullet 8-9 + S4 mitigation vs `server.js:28-42` static tokens + `server.js:632-648` polling strip. Kill-shot: `Show me an SMS/push and an audit log for yesterday's approval.` Answer: none. Say `demo auth + timeline remarks; audit-log table + SMS gateway Phase-2`.
4. **Parallel engine + versioned KB + govt integration claimed, labels + static array + zero integration delivered.** Vision S4 mitigations vs `server.js:108-111` sort-only + `seed.js:58-119` illustrative sources + zero external `fetch`. Kill-shot: `Why won't govt add checklist+tracker to MAITRI in 2 sprints?` Vision has no answer; fixed PPT's kill-table (`MAITRI Partial / NSWS Partial / You Full` × 5 rows) is the only shield — memorize it.
5. **Predictive/measured impact claimed qualitatively, seeded constants delivered.** Vision S5/S6 (`predicts bottlenecks`, `faster/transparent`) vs `seed.js:124-145` 38 rows + `app.js:185` hardcoded renewals. Kill-shot: `File an app now and show 68→31 moving.` Only LIVE card + `ch3` move (`server.js:663-675`, `app.js:427-437` proven in `ai-fix-report.md`); headline never moves. Say `seed baseline illustration + live counters; pilot will measure` — point at footnote `*Seed projection, pilot to validate`.

---

## 6. Alignment plan — make shortlist chance maximal (do NOT chase vision stack)

**Strategy: fix PPT to match reality (hours) + minimal code to close cheap lies (days). Do NOT rebuild Mongo/React/LLM now — you'd break the only asset that works (offline 5-min demo) for zero shortlist ROI.**

### P0 — Before upload (3-4 hrs total, highest ROI; PPT-only + README one-liners)

- [ ] **P0-1 (30 min): Keep the fixed 6-slide deck, delete vision file from submission.** Submit ONLY `Udyog-Sarthi-AI-SIH26130-IDEA-PPT.pptx` (6 slides, 0.46 MB PDF). Vision 8-slide file (`First-generated-main`, 6.4 MB) must NEVER be uploaded — it has placeholders + 4 name variants + 0 numbers + MAITRI FAIL. Archive it out of the folder or rename `.bak`.
- [ ] **P0-2 (45 min): Honesty pass on fixed deck's 3 remaining overclaims.** Find-replace in PPT: `LLM + RAG` → `TF-IDF retrieval + Rules (LLM Phase-2)`; `MongoDB` → `JSON pilot store → Mongo 7 Phase-2`; `OCR + document classification` → `Metadata validation (OCR Phase-2, Tesseract roadmap)`. Keep layered arch, keep versions, keep `Phase-2` dashed connector. Turns 3 lies into roadmap credibility.
- [ ] **P0-3 (30 min): README truth pass.** `README.md:51` says `10-item knowledge base` → fix to `60-article TF-IDF corpus (P@1 75%, no LLM)`; `:39` `instant mock pre-validation` → `metadata pre-validation (ext/size/expiry/holder, 422 on fail; file-bytes/OCR roadmap)`; `:8` grievance `auto-escalation` now TRUE after P0 sweep — keep, add `(60s sweep + on-read)`; `:43` analytics `68→31` → append `*seed baseline illustration + live counters, pilot to measure`.
- [ ] **P0-4 (30 min): Rehearse the 5 honest sentences.** `Rule engine + TF-IDF retrieval (no LLM) + metadata validation + SLA sweeps + live counters; Mongo/OCR/SMS/MAITRI-API Phase-2.` Never say `AI model / verified reuse / parallel engine / measured 68→31 / auto legal advice`. Q&A on gaps: point at exact file+line (`validator server.js:152-228 ~20 lines`, `sweeps :231-291`, `TF-IDF :293-361`).
- [ ] **P0-5 (15 min): Fill college + Team ID.** Replace `SIH26130-XXX` + `___` (see `ppt-fix-report.md` §4) before portal upload. Placeholders = auto-ding.

### P1 — If 2-4 days remain (cheap code that kills live Q&A, in ROI order)

- [ ] **P1-1 (0.5 day): Dependency gating (turns parallel label into mini-engine).** On `POST /api/applications` (`server.js:461`), create Group-B/C/D tracks as `Locked` until predecessors clear; unlock in `PATCH /track` approve path + sweeps. Add K-article + wizard note. Kills `legally impossible day-1 CTO` — cheapest credibility win in the repo.
- [ ] **P1-2 (0.5 day): Completeness score + required-set enforcement.** Per-approval `docs[]` in `seed.js:12-35` already lists required docs — enforce: `documents` must cover matched `docs` set (fuzzy name match) before `status` leaves `In progress`; surface `% complete` on tracker. Turns `pre-validation` from format-check into substance-check without OCR.
- [ ] **P1-3 (0.5 day): Audit-log table (JSON, still offline).** Append-only `db.audit[]` on every officer track/inspection/grievance write (who/when/before→after/IP). Render read-only on app detail. Closes `audit trails` claim for ~40 lines, no new deps.
- [ ] **P1-4 (0.5 day): Renewal dates from validity table (kill hardcoded 58).** Validity map (Factory annual, Fire annual, CTO Red-5/Green-10 per K16/K46) + `createdAt` math → real `renewals[]` on dashboard; re-apply reuses vault. Turns lifecycle half-real.
- [ ] **P1-5 (0.5-1 day): Marathi knowledge + district-aware checklist.** Translate top-20 K-articles (human, not MT for legal text) + `matchChecklist` district→MIDC-area weighting + investment/worker conditional triggers (e.g. `100+ workers → safety officer doc required`). Closes MH-inclusion + `location` lie.
- [ ] **Explicitly NOT P1 (P2/P3, do not touch pre-shortlist):** Mongo migration, React rewrite, real LLM/RAG with billing, Tesseract pipeline, SMS gateway, DigiLocker live, 36-district seeds, Dockerfile/CI/PWA. All valuable, all break offline safety for zero screening ROI.

### Effort → shortlist delta (honest)

- Today (vision 8-slide + 35% code): screening 15-20%, internal demo 40-50%, finale <5% (`project-verdict.md`).
- After P0 alone (submit fixed 6-slide + honesty pass, code untouched): screening 50-60%. Highest leverage per hour.
- After P0+P1-1..P1-4 (2-3 days): internal 65-75%, survives technical Q&A without humiliation, genuinely shortlistable 7.0-7.5/10.
- Vision-stack rebuild (weeks): shortlist chance DROPS (broken demo) — do not attempt before selection.

---

## Appendix — extraction log (for audit)

- `python-pptx` dump: 8 slides, 127 text/table lines → `C:\Users\Rohit\AppData\Local\Temp\opencode\first-dump.txt` (full text summarized in §2 tables; raw file on disk).
- COM export: `export_first.py` via `win32com.client.Dispatch('PowerPoint.Application')`, `Slides(idx).Export PNG 1920x1080` × 8 → `first-slide-01.png` … `08.png` in `.ai/reports/ppt-first-slides\` (verified `Count` + `exists=True` × 8).
- Current PPT re-check: `len(Presentation)==6`, 707,340 bytes (unchanged since fix); vision `len==8`, 6,423,969 bytes.
- Code re-read: `server.js` 697 lines, `app.js` 499 lines, `seed.js` 215 lines, `package.json` 1 dep, `index.html` 29 lines (line refs above are to current files post-P0/AI-fix).

*Hard boundaries respected: review + coordination only. No code rewritten here. Findings dispatched as P0/P1 above for dev agents. Prior `qa-report PASS / code-review APPROVED / security SECURE_WITH_NOTES` cover launcher-only and do NOT gate app-level gaps (see `project-verdict.md:29`).*
