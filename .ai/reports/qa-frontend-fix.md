# QA Report — Frontend Gap 1-3 Fixes (Udyog Sarthi SIH-26130)

Verdict: PASS

Date: 2026-09-09 · Tester: QA Engineer · Mode: live verification on :3000, no app-code changes
Inputs read FIRST: `.ai/reports/frontend-fix-report.md` + `DEMO_SCRIPT.md` + `.ai/reports/qa-shortlist-gate.md`
Server: live `node` PID 24996 on `:3000`, left RUNNING clean (`POST /api/reset` last → apps=3 history=38 avgOld=60 avgNew=21 pristine pre-sweep)
Scope: `public/` only (index.html 31 lines, styles.css 74 lines, app.js 505 lines). `server.js`, `data/`, `package.json` untouched.

---

## Tests Run

### 1. Gap 1 — Touch + tables + mobile (P0) — PASS (7/7)

| # | Check | Expected | Fresh evidence (this run, served HTTP + file) | Result |
|---|---|---|---|---|
| G1.1 | 44px touch targets | `.btn.sm`, `.nav a`, `input/select/textarea` all `min-height:44px` | `GET /styles.css` 200 contains `min-height:44px` ×3: `styles.css:17` nav (`padding:12px 14px; inline-flex center`), `:28` btn.sm (`padding:10px 16px; inline-flex center`), `:44` inputs. `css.count('44px')==3` | PASS |
| G1.2 | tblwrap no overflow | Every `table.tbl` in `div.tblwrap`; `.tbl{min-width:640px}` + `.tblwrap{overflow-x:auto}` | `styles.css:40-41` + served CSS both contain `tblwrap` + `min-width:640px` + `overflow-x:auto`. `app.js` `tblwrap` ×5 sites: login credentials table (`app.js:164`), wizard group tables (`:226` per-group), analytics 3× details tables (`:441,445,446`). Static audit: 2 data tables pre-analytics + 3 analytics details = all wrapped | PASS |
| G1.3 | 480px breakpoint | `@media(max-width:480px)` present + sensible 1-col fallbacks | `styles.css:65-73` present in served CSS: `#view 14/10/48`, `hero 22/16`, `h1 28px`, `track 1fr`, `ring 56px`, `statgrid 1fr`, `footer 12px`. Existing `@media 900px` (`:64`) kept: hero/g2/g3/g4/formrow/statgrid collapse | PASS |
| G1.4 | 320/768/1024 static overflow audit | No horizontal overflow at 320/768/1024 | tblwrap scroll pattern + `min-width+overflow` + 480/900 queries + hero/track 1fr fallbacks + `topbar/footer flex-wrap:wrap` (`:11,:60`) + canvas `width:100%` (`:57`, 520×260 attrs intrinsic only) + alertstrip `overflow-x:auto` (`:20`). No fixed-width offenders found in `public/` | PASS |
| G1.5 | node syntax | `node --check` exit 0 | `node --check public/app.js → 0`; `node --check server.js → 0` (fresh this run) | PASS |
| G1.6 | Served-content parity | Disk edits actually served on :3000 | `GET /`, `/styles.css`, `/app.js` all 200 and contain every Gap 1 string (see G1.1–G1.3). No stale-cache divergence | PASS |
| G1.7 | Quick-win spot checks | transition + reduced-motion, card shadow, step inset, canvas height | Served CSS contains `prefers-reduced-motion` (`:74` `*{transition:none!important;animation:none!important}`), `transition:background .15s` (`:25`), `box-shadow:0 2px 8px` (`:34`), `inset 0 0 0 2px` (`:49`), `height:min(260px,60vw)` (`:57`) | PASS |

### 2. Gap 2 — A11y (P0) — PASS (8/8)

| # | Check | Expected | Fresh evidence | Result |
|---|---|---|---|---|
| A1 | Skip-link | `<a class="skip" href="#view">` + offscreen CSS + `:focus` reveal | `GET /` contains skip-link; `index.html:11`; `styles.css:9-10` (`.skip left:-999px`, `:focus left:0`). Tab order: first focusable after body | PASS |
| A2 | focus-visible | `*:focus-visible{outline:3px solid #ffb35c; outline-offset:2px}` | `styles.css:7` + served CSS match `#ffb35c` | PASS |
| A3 | lang flip mr/en | `toggleLang` flips `documentElement.lang` + persists `localStorage.us_lang`; init on DOMContentLoaded | `app.js:55-60` (`LANG` flip + `setItem us_lang` + `documentElement.lang=LANG`), `:88` init from storage. `GET /i18n.json` → en=36 mr=36 blankEn=0 blankMr=0 missingInMr=0. Browser click-through (wizard `चेकलिस्ट जनरेटर विझार्ड` + reload persists) still wanted in hall — headless env cannot click-test, code path verified | PASS |
| A4 | nav aria + meta + alertstrip live + main focus | `nav aria-label=Primary`, meta description, alertstrip `role=status aria-live=polite`, `main#view tabindex=-1` + `v.focus(preventScroll)` every route | `index.html:6` meta description, `:20` nav aria, `:23` alertstrip live, `:24` main tabindex. `GET /` all 4 strings 200. `app.js:96-109` `v.focus({preventScroll:true})` on all 12 routes incl. `#/grievances` + not-found | PASS |
| A5 | Canvas details tables | ch1/ch2/ch3 each `role=img aria-label` + `<details><summary>Data table` fallback | Served `app.js` contains 3× `role=img aria-label` canvas + 3× `<details>`: ch3 live pendingByDept (`:441`), ch1 old/new/saved (`:445`), ch2 ranked bottleneck (`:446`). Built from live `AN` object, empty-state row included | PASS |
| A6 | Rings aria | Every ring `role=img aria-label` + border (not color-alone) | `app.js:250-257` 5 ring branches all `role=img aria-label` (Done/Held/Locked/breached-over/urgent-left/ontrack-left) + `border-color:#fff`; `styles.css:51` `border:2px + text-shadow`. Badges `border:1px solid currentColor` (`:36`) + `aria-label` on dashboard SLA/risk (`:178,182`) | PASS |
| A7 | Alertstrip live region | `role=status` polite, no assertive spam | `index.html:23` + served `/` match; `app.js:77-81` caps at 8 items, text-only, emoji prefix + `esc()` | PASS |
| A8 | Reduced-motion | `prefers-reduced-motion` kills transitions/animations | `styles.css:74` verified served | PASS |

### 3. Gap 3 — Type (P0) — PASS (6/6)

| # | Check | Expected | Fresh evidence | Result |
|---|---|---|---|---|
| T1 | Mukta stack | `body{font-family:"Mukta","Noto Sans Devanagari","Segoe UI",Roboto,Arial,sans-serif; 16px/1.5}` offline-safe | `styles.css:8` + served CSS match. No hard CDN link in `index.html` (vendor/system fallback clean) | PASS |
| T2 | clamp h1 | `clamp(28px,4vw,40px)` + `line-height:1.2` | `styles.css:23` + served match; 480px fallback `28px` (`:68`) | PASS |
| T3 | Contrast mut/amber | `--mut #3f4c5e` (was #5d6b7d), `--amber #7a5200` (was #a86a00) | `styles.css:3-4` both new values served. Darker pair on white/#fdf0d3/#edf0f4 intended AA fix; no axe run in headless env — values match approved spec exactly | PASS |
| T4 | small/badge sizes | `.small 13.5px` (was 12.5), `.badge 12.5px` (was 11.5) + border, `.stat b clamp(20px,2.5vw,24px)` + `span 12.5px` | `styles.css:32,35,36` all served: `.small 13.5px/1.5`, `.badge 12.5px + border:1px solid currentColor`, `.stat b clamp` + `span 12.5px` | PASS |
| T5 | Footer shorten keeps Reset | One-line footer, Reset button untouched | `index.html:25-28`: `Udyog Sarthi · SIH 2026 demo · 🌱 SEED* illustrative · 🔴 LIVE moves …` + `<button onclick="resetDemo()">` intact; `window.resetDemo` (`app.js:84`) verified working (see §4) | PASS |
| T6 | No layout regression from type change | 16px base + 1.5 rhythm holds at 320/480/900 | 480/900 queries + tblwrap + wrap rows unchanged; hero `clamp` scales down, stat `clamp` scales down — static audit PASS | PASS |

### 4. No demo regression — PASS (9/9)

| # | Check | Expected (DEMO_SCRIPT.md) | Fresh evidence (this run) | Result |
|---|---|---|---|---|
| R1 | Logins | `udyog@demo.in/demo123 → demo-applicant-token`; `officer@…/officer123 → demo-officer-token` both 200 | `POST /api/login` ×2 → both 200 with exact tokens | PASS |
| R2 | MR 36/36 | `i18n.json` 36 EN + 36 MR zero blanks | en=36 mr=36 blank 0/0 missing 0 | PASS |
| R3 | Wizard | Food→Nashik Sinnar→Small→Establish → 9 approvals, fees, critical 45d | `POST /api/checklist` (QA payload) → `count 9 fee 110000 crit 45` (matches frontend-fix-report §Verify + DEMO_SCRIPT 60-sec click 1) | PASS |
| R4 | Filing → tracker | File → new `APP-2026-0xx` 9 tracks, Amber, tracker opens | `POST /api/applications` → `APP-2026-0159 tracks 9`; `GET /:id` → Amber; `GET /:id/track` → keys ok | PASS |
| R5 | Officer | MPCB queue approve works with officer token | `PATCH /:id/track {DOI-UDYAM approve}` with `Bearer demo-officer-token` → 200 `Approved` | PASS |
| R6 | Analytics LIVE moves | Filing moves LIVE, SEED `60→21` frozen | Before filing `live.apps 3 hist 39`; after filing `live.apps 4`; `avgOld=60 avgNew=21` frozen throughout | PASS |
| R7 | Knowledge | TF-IDF `deemed approval SLA breach` ranks, eval 60/0.75 no LLM | `GET /knowledge/search?q=…` → 5 results, `corpusSize 60 ranked true`; `GET /knowledge/eval` → `corpus 60 n 8 correct 6 acc 0.75 no LLM` | PASS |
| R8 | Breach Deemed + Nodal still fire | Reset → tracker read auto-deems FIRE-PROV; grievance read auto-escalates GRV-881 | After `POST /reset`: `GET /applications` → `APP-2026-0157 FIRE-PROV Deemed + [Auto-deemed: SLA 21d breached]`; `GET /grievances` → `GRV-881 Escalated to Nodal Officer + 2 updates`, `GRV-872 Resolved` kept. `hist 38→39` on first tracker read is BY DESIGN (demo-prep DEMO-BREACH seed) | PASS |
| R9 | Reset clean | `POST /api/reset → apps=3 history=38` pristine | Final `POST /reset → {ok:true}`; `GET /analytics → live.apps 3 history 38 avgOld 60 avgNew 21`; `GET /health → {ok:true}`; `node --check` 0/0. Server left RUNNING clean for judging prep | PASS |

---

## Bugs Found (severity: critical/high/medium/low, file:line)

No critical / high / medium bugs. No fix-loop items — forward chain may continue.

| # | Severity | Title + Where | Expected vs Actual | File:line | Notes |
|---|---|---|---|---|---|
| 1 | low | Hall browser click-through not yet done (MR toggle visual, skip-link Tab reveal, 320px projector wash) | Expected: real-device pass; Actual: headless verification only (code + served strings + API) | `public/app.js:55-60`, `public/styles.css:9-10` | Non-blocking. Mitigation: 4-min hall pass per qa-shortlist-gate §4 item 7 (click मराठी → wizard Devanagari → reload persists; Tab → skip visible 3px outline). |
| 2 | low | Contrast AA claimed by value, not instrumented (no axe run in this env) | Expected: axe clean; Actual: `--mut #3f4c5e` + `--amber #7a5200` match approved darkened spec, visual check only | `public/styles.css:3-4` | Non-blocking. Values are darker than failing predecessors by design; run axe in hall browser if judging criteria requires a number. |
| 3 | low (pre-existing, unchanged) | `GET /api/analytics` doesn't run sweeps — pending 1-stale until first tracker read | Expected: self-consistent; Actual: `pending 8 → 7` after first read | `server.js` analytics handler | By design per qa-shortlist-gate Bug 1; DEMO_SCRIPT order (tracker before analytics) hides it. Not introduced by Gap 1-3 (presentational-only diff). |

Hard boundaries respected: TEST/verify only — zero app/feature code changed.

---

## Regression Risks

| Area | Risk | Mitigation |
|---|---|---|
| Dirty `db.json` before judging | QA filing left `APP-2026-0159` mid-run | Already mitigated: final `POST /reset` verified `apps=3 history=38`; footer Reset one click away; pre-check `curl /api/analytics → 60/21/38` in DEMO_SCRIPT |
| Sweep order | Judges opening `#/analytics` before `#/tracker` see stale pending + no breach | Script order tracker→grievances→analytics; break-glass table in DEMO_SCRIPT covers it |
| MR on hall machine | Devanagari render / projector wash | Hall click-through (Bug 1); fallback `i18n 36/36 zero blanks` + roadmap line |
| 320px hall projector | washed-out focus ring / ring text | `#ffb35c` 3px outline + ring border+text-shadow already shipped; USB backup PNGs |
| Wrong-file upload | `.bak` + archive vision file on disk | Upload ONLY 6-slide PPTX + PDF (SUBMIT_CHECKLIST item 8) |

---

## Overall

**QA Verdict: PASS — all Gap 1 (7/7), Gap 2 (8/8), Gap 3 (6/6), and demo-regression (9/9) checks hold live on :3000 with zero regressions.**
**Fix loop: no bugs requiring dev rework. Chain may proceed to dev-lead review → security audit.**
*Server left RUNNING clean (apps=3 history=38) for judging prep. This file is the gate.*
