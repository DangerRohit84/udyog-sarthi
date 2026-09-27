# QA Report — Final Shortlist Gate (SIH-26130 Udyog Sarthi)

Verdict: PASS (all verifiable code/demo checks) — Overall Gate: NOT YET → SHORTLIST-READY after 20-min user fills
Date: 2026-09-09 · Tester: QA Engineer · Mode: live verification, port 3000, no app-code changes
Inputs read FIRST: `.ai/reports/ppt-submit-ready.md`, `.ai/reports/backend-shortlist-fix.md`, `.ai/reports/demo-ready-report.md`, `.ai/reports/shortlist-win-truth.md`
Server: live `node` PID 24996 on `:3000`, left RUNNING clean (`POST /api/reset` last → apps=3 history=38 audit=[] pristine pre-sweep)

---

## 1. PPT gate — PASS (6/6 verifiable, 2 user fills remain)

| # | Check | Expected | Fresh evidence (this run) | Result |
|---|---|---|---|---|
| P1 | 6 slides only in root | `Slides.Count==6`, vision out of root | `python-pptx Slides=6`; root holds ONLY `Udyog-Sarthi-AI-SIH26130-IDEA-PPT.pptx (707,664B)` + `.pdf (477,804B)` + `.bak` + `SUBMIT_CHECKLIST.txt`; vision `First-generated-main.pptx (6,423,969B)` in `.ai/archive/` only | PASS |
| P2 | Vision archived | 8-slide file in `.ai/archive/`, not deleted | `Get-ChildItem .ai\archive` → `First-generated-main.pptx 6423969` present | PASS |
| P3 | PDF <5MB | <5,242,880 bytes | `477,804 bytes = 0.46 MB` | PASS |
| P4 | No overclaims, honest stack | Bare `React 18/Next 14/Mongo 7/Rules+RAG/LLM API/VectorDB`=0; `Vanilla JS/JSON file store/TF-IDF/no LLM/P@1 0.75/filename+size` FOUND; `Tesseract` only Phase-2 | Scan: overclaims all `0`; `Vanilla JS=4, JSON file store=4, TF-IDF=8, no LLM=6, P@1 0.75=4, filename+size=1, Tesseract=3` (Phase-2 lines only per ppt-submit-ready §1) | PASS |
| P5 | Footnotes `*Seed projection` ×5 | 5 occurrences, every numbers slide | `SEED_FOOTNOTE_COUNT=5` (S2 footer+strip, S3 footer, S4 footer, S5 box+footer, S6 refs) | PASS |
| P6 | `SUBMIT_CHECKLIST.txt` exists | 10-item user checklist in root | `Length 1753`, 10 boxes: Team ID, Team Name, College, portal names, female-member, theme/category, re-export, upload-only, demo honesty, backup | PASS |
| P7 | Speaker-notes TODOs | S1 Team ID/college, S3 demo honesty | `NOTES S1: TODO replace SIH26130-XXX + fill ___`; `NOTES S3: TODO say Vanilla JS+JSON+TF-IDF no LLM, never claim React/Mongo/LLM/OCR` | PASS |

**Intentional remaining (NOT a QA fail — user fills):** `XXX_COUNT=11`, `___=1` retained by design (ppt-submit-ready §1). Uploading as-is = auto-ding (shortlist-win-truth R1). See §4.

**Low risk note:** root `.pptx.bak (1,124,078B)` is backup only — never upload (checklist item 8 covers it). Do not delete (rollback safety).

## 2. Backend live :3000 gate — PASS (7/7)

Base: `GET /api/health → {ok:true, app:Udyog Sarthi, sih:26130}`; `node --check server.js + data/seed.js OK`; logins `udyog@demo.in/demo123 → demo-applicant-token`, `officer@maharashtra.gov.in/officer123 → demo-officer-token` both `200`.

| # | Check | Expected | Fresh evidence (this run) | Result |
|---|---|---|---|---|
| B1 | Gating Locked→unlock | Operate file → D `Locked` + reason; officer approve Locked → `400`; approve predecessor → `Applied` + unlock audits | Filed `APP-2026-0159` (Textiles/Micro/Operate): `LABOUR-FACT Applied`, `MPCB-CTO Locked` + `lockedReason`, `FIRE-FINAL Locked`; `PATCH CTO approve → 400 "Track is Locked — clear Group A–C first"`; `PATCH FACT approve → 200`, then `CTO Applied, FINAL Applied` + audits `unlock:MPCB-CTO, unlock:FIRE-FINAL` | PASS |
| B2 | Completeness 0→25% | Fresh app `0%`; matching upload → `25% (1/4)` + `missing[]`; `GET /:id/track` exposes it | `GET /track → completenessPct 0, FACT 0/4`; `POST /documents {layout.pdf, Factory layout plan, sizeBytes, holderName} → 200`; `GET /track → completenessPct 9, FACT pct 25 matched 1/4 missing 3 listed` | PASS |
| B3 | Audit grows + 401/403 | `[]` after reset → grows on sweeps/mutations; `GET /api/audit` officer-only | After reset `count 0`; after tracker+grievance reads `count 2 (auto-deemed:FIRE-PROV, auto-escalate)`; after full gating flow `count 7 (…file, upload:Factory layout plan, approve:LABOUR-FACT, unlock ×2)`; no-token `401`, applicant `403` | PASS |
| B4 | Renewals real dates | Validity table (not hardcoded 58d); `GET /api/renewals` sorted real `issuedAt/due/daysLeft/state` | Approved `LABOUR-FACT → issuedAt 2026-09-09 due 2027-09-09 validityDays 365 daysLeft 365 state valid`; seed sample `LABOUR-SHOP issued 2026-07-11 due 2027-07-11 305d valid`; `GET /api/renewals → 6 rows` | PASS |
| B5 | Analytics 38→40 live | Seed `38 + 0 live, avgNew 21`; completions append measured rows, headline moves, `basis` string | Before: `historyCount 38 liveHistoryCount 0 avgNew 21 basis "seed baseline 38 rows + 0 live"`; after 1 approve + 1 auto-deemed: `historyCount 40 liveHistoryCount 2 avgNew 20 avgNewLive 13 basis "seed baseline 38 rows + 2 live measured completions"` | PASS |
| B6 | P0 holds | Forgery `422`, no-token `401`, empty checklist `400` | `POST documents {forged.pdf, passed:true} → 422 verified:false`; `PATCH track no token → 401`; `POST /checklist {} → 400`; `GET /audit` 401/403 as above | PASS |
| B7 | Knowledge eval | `corpus 60, P@1 0.75, no LLM` | `GET /knowledge/eval → corpusSize 60 n 8 correct 6 accuracy 0.75 method "TF-IDF cosine (no embeddings, no LLM)"` | PASS |

Backend notes: `POST-RESET analytics live.apps=3 pending=8` clean; `DB history 38→39` after first read is BY DESIGN (auto-deemed breach appends live row — demo-prep agent's `DEMO-BREACH` seed, per backend-shortlist-fix §4.1). Grandfathering holds: legacy seed tracks never overlaid with `Locked`.

## 3. Frontend gate — PASS (6/6)

| # | Check | Expected | Fresh evidence (this run) | Result |
|---|---|---|---|---|
| F1 | i18n 36 keys 0 blanks | `en=36 mr=36 blank 0/0 missing 0`, top-22 Devanagari, toggle persists | `en=36 mr=36 blankEn=0 blankMr=0 missingInMr=0`; `DEVANAGARI_TOP22=22/22` (byte check `[\u0900-\u097F]`); `app.js LANG + localStorage.us_lang + toggleLang + T() fallback` per demo-ready §1(1) (browser click-through still wanted in hall — see §4) | PASS |
| F2 | LIVE vs SEED labels | Landing/dashboard/documents/analytics + footer honestly badged | `app.js LIVE=12 SEED=15`; vault `filename records only — no file bytes, no live DigiLocker API`; renewals `58 days* + *Illustrative seed date — K07/K46`; analytics `SEED baseline + LIVE counters`; `index.html` footer `SEED (*Seed projection) · LIVE counters move · JSON pilot → Postgres roadmap` | PASS |
| F3 | README truth | `60 articles, 0.75, no LLM, 422, Postgres, Seed projection, Sinnar` | All FOUND (`60-article, 0.75, no LLM, TF-IDF, Seed projection, 422, Postgres, Sinnar`); `60→21` uses unicode `→` (ASCII `->` grep misses — not a fail); banned-words list + file+line pointers present | PASS |
| F4 | DEMO_SCRIPT.md | 60-sec + 2-min with logins/port/QR/reset + break-glass + never-say | All FOUND: `60-sec, 2-min, demo123, officer123, :3000, QR, reset, 127.0.0.1, GRV-881, FIRE-PROV, Deemed, Nodal`; exact clicks (Food→Nashik Sinnar→Small→Establish→9 items→File), QR instruction (`ipconfig → 192.168.x.x → encode :3000`), `localhost ::1` fallback, break-glass table, never-say list | PASS |
| F5 | Breach Deemed + escalation Nodal on read | Reset → first tracker read auto-deems; first grievance read auto-escalates | After `POST /reset`: `GET /applications → APP-2026-0157 FIRE-PROV Under review → Deemed + [Auto-deemed: SLA 21d breached]`; `GET /grievances → GRV-881 Filed 8d → Escalated to Nodal Officer + 2 updates`; `GRV-872 Resolved` kept | PASS |
| F6 | Reset clean | `POST /api/reset → apps=3 history=38` pristine pre-sweep | `POST /reset → {ok:true}`; `analytics historyCount 38 live.apps 3 pending 8`; `db.json apps 3 history 38 audit []` (final state left clean, server RUNNING) | PASS |

## Bugs Found (severity: critical/high/medium/low, file:line)

No critical/high/medium bugs. Two low observations (non-blocking, do not fail the gate):

| # | Severity | Title + Where | Expected vs Actual | File:line | Notes |
|---|---|---|---|---|---|
| 1 | low | `GET /api/analytics` does not run `runSweeps` — pending shows 8 until first tracker/alerts read (then 7) | Expected: analytics self-consistent; Actual: 1-stale until a read triggers sweep | `server.js` analytics handler (per demo-ready §4.3) | Demo order (tracker before analytics close) hides it; 1-line P1 if desired. Workaround in DEMO_SCRIPT.md. |
| 2 | low | `localhost` IPv6 (`::1`) broken in this env, `127.0.0.1:3000` required | Expected: `localhost:3000` works everywhere; Actual: hangs here, works via `127.0.0.1` | env network, not code | Documented in DEMO_SCRIPT.md fallback + QR uses LAN IP. Verify on hall laptop. |

Hard boundaries respected: TEST/verify only — no app/feature code changed. Race-guard note: parallel demo-prep agent seeds (`DEMO-BREACH`/`DEMO-ESCALATION`) are intentional and handled correctly by sweeps; coordinate restarts via report files.

## Regression Risks

| Area | Risk | Mitigation |
|---|---|---|
| Wrong-file upload | `.bak` + `.ai\archive\` vision file + 6-slide PPTX all on disk — one wrong portal click = placeholders + 8 slides | Upload ONLY `Udyog-Sarthi-AI-SIH26130-IDEA-PPT.pptx + .pdf`; checklist item 8; USB holds only submit pair + PNGs |
| Dirty `db.json` before judging | Extra test apps (`APP-2026-0159…`) or fired sweeps persist | Footer **Reset demo data** one click away; verified `apps=3 history=38` clean now; `curl /api/analytics → avgOld=60 avgNew=21 history=38` pre-check in script |
| Sweep order | Judges opening `#/analytics` before `#/tracker` see stale pending + no breach | Script order is tracker→grievances→analytics; break-glass table covers "breach not visible" |
| MR toggle on hall machine | Headless env could not click-test; Devanagari render/projector risk | Hall prep: click `मराठी` → wizard shows `चेकलिस्ट जनरेटर विझार्ड` → reload persists (`localStorage.us_lang`); fallback: state `i18n 36 keys zero blanks` + roadmap line |
| Banned words on stage | One bluff (`LLM/OCR/Mongo/measured 68→31/DigiLocker live/parallel engine`) = 60-sec disproof | Rehearse 5 honest sentences (DEMO_SCRIPT.md §never-say + SUBMIT_CHECKLIST item 9); point at `server.js` validator/sweeps/TF-IDF lines |
| Port busy / IPv6 | `npm start` fails or `localhost` hangs in hall | `netstat -ano \| findstr :3000 → taskkill /PID /F → npm start`; fallback `http://127.0.0.1:3000`; QR uses LAN IP; offline (1 dep `express`, no CDN) |

## 4. What's left for USER in 20 min (nothing else blocks upload)

1. **Team ID (2 min):** PowerPoint `Ctrl+H` `SIH26130-XXX` → allotted ID (title slide, 5 header ovals S2–S6, S6 footer). 11 occurrences.
2. **College (1 min):** S1 `College – ___ (fill before upload)` → full name + city. 1 occurrence.
3. **Team Name (1 min):** confirm `Team Udyog Sarthi` or fix if official name differs.
4. **Member names (portal, 5 min):** PPT has NO names slide by design — do NOT add one (breaks 6-slide rule). Enter names in portal; verify female-member rule there.
5. **Theme/category (2 min):** slide says `Theme – Miscellaneous | PS Category – Software`. Match portal dropdowns to PS SIH26130 exactly; fix slide if they differ.
6. **Re-export + verify (5 min):** Save As PDF → confirm <5 MB; quick scan: 6 slides, no `XXX`/`___` left; upload ONLY 6-slide PPTX + PDF (never `.bak`, never `.ai\archive\`).
7. **Backup + hall click-through (4 min):** USB + phone copy of PDF + 6 PNGs (`.ai\reports\ppt-submit-slides\`); one real-browser pass: `npm start → :3000 → Reset → wizard-file → tracker Deemed → officer query → MR toggle → reload persists → Reset`.

## Overall

**QA Verdict: PASS — every verifiable shortlist-at-any-cost item holds live.**
**Shortlist Gate: NOT YET (upload-blocked on 2 user fills only) → SHORTLIST-READY the minute §4 items 1–2 + 6 are done (~10 min) + hall click-through (~10 min).**
**Finale win: still NO (<5%) until R3–R7 + pilot proof land — correctly out of scope tonight (shortlist-win-truth §5).**

*Chain handoff: this file is the gate. `dev-lead` → `security` read this + prior reports; deploy NOT requested. Server left RUNNING clean for judging prep.*
