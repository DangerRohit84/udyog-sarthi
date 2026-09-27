# Code Review — Frontend Gap 1-3 Lift (5.1 → 7.0)

Verdict: APPROVED

Date: 2026-09-09 · Reviewer: Development Lead · Mode: review-only, no code changed
Scope: `public/index.html` (31 lines) + `public/styles.css` (74 lines) + `public/app.js` (505-506 lines) only
Inputs read FIRST (in order):
1. `.ai/reports/frontend-fix-report.md` — Gap 1-3 + 10 quick wins, served-HTTP verified
2. `.ai/reports/qa-frontend-fix.md` — PASS (Gap1 7/7, Gap2 8/8, Gap3 6/6, regression 9/9, live :3000)
3. `.ai/reports/code-review-final.md` — APPROVED shortlist gate (PPT 6-slide + 969-line backend + LIVE/SEED demo)
Constraint honored: review + coordinate ONLY. No implementation fixes applied. No files rewritten.

## Summary

Tight, low-risk polish lift. Diff is presentational + a11y wrappers only (HTML +29→31, CSS +60→74, JS +502→506). No route, API, validator, or `server.js`/`data/` touched. QA re-verified live on :3000 with served-content parity (disk edits actually served) + full demo regression (logins, wizard 9/110000/45d, filing, officer approve, LIVE moves, TF-IDF 60/0.75, breach + nodal auto-fire, reset clean). CSS quality is good, a11y fixes are correct patterns, demo risk is accepted with mitigations in place. The internal 5.1→7.0 claim is a reasonable sprint-tracking estimate — NOT judge-facing, must stay out of slides. Per "only CHANGES_REQUESTED if critical": no critical issues. APPROVED, forward to security.

## Quality Gates (Merge Criteria)

- [x] All tests passing — QA frontend-fix: 30/30 live (7+8+6+9); `node --check app.js + server.js` 0; served `/`, `/styles.css`, `/app.js` all 200 with expected strings
- [x] Code reviewed by 1+ team member — this review (dev-lead) + QA independent verification
- [x] No critical/high security findings — no new surface; `esc()` retained; no auth/token change; no outbound fetch
- [x] Documentation updated — frontend-fix-report §Gap1-3 + Verify thorough; line refs accurate against files read
- [x] Branch up-to-date with main — N/A (D:\SIH not a git repo per fix-report §Blockers; no merge conflicts; verification via served HTTP correct fallback)
- [x] Meaningful commit messages — N/A (no repo); suggest `polish(frontend): Gap1-3 touch/tables/mobile + a11y + type (SIH-26130)`
- [x] Sprint task updated — SKIPPED (no task_id in dispatch — consistent with all prior reports, non-blocking)

## 1. CSS Quality — GOOD, no changes requested

- Touch targets: `.btn.sm`, `.nav a`, `input/select/textarea` all `min-height:44px` + `inline-flex center` — meets WCAG 2.5.8 AAA shape. Padding preserved (`10px 16px` / `12px 14px`), no layout blowout. Correct.
- Tables: `div.tblwrap` on all `table.tbl` (2 pre-analytics sites in code + 3 analytics `<details>` tables = full coverage) + `.tblwrap{overflow-x:auto}` + `.tbl{min-width:640px}` — standard no-overflow pattern, preserves semantics. Correct.
- Breakpoints: existing `@media 900px` kept; new `@media 480px` sensible (view 14/10/48, hero 22/16, h1 28px fallback for `clamp()`, track 1fr, ring 56px, statgrid 1fr, footer 12px). Topbar `flex-wrap:wrap + row-gap:8px`, footer `flex-wrap`, alertstrip `overflow-x:auto`, canvas `width:100% + height:min(260px,60vw)` — no fixed-width offenders. Static 320/768/1024 audit credible.
- Type: Mukta offline-safe stack (no hard CDN — correct for hall offline), body 16px/1.5, h1 `clamp(28px,4vw,40px)/1.2`, `.small 13.5px`, `.badge 12.5px + border`, `.stat b clamp(20px,2.5vw,24px)`, `--mut #3f4c5e` + `--amber #7a5200` darker pair — all move in the right direction. Verified in file at `styles.css:3-4,8,23,32,35-36`.
- Polish: `transition:background .15s,transform .15s` + `prefers-reduced-motion` kill-switch, card `0 2px 8px`, step inset ring, ring `border:2px + text-shadow` — subtle, no jank, no new requests. Good.
- Nits (low, not blocking): `.skip{left:-999px}` is legacy offscreen technique (clip-pattern preferred) but works with `:focus{left:0}` + 3px outline; `.pill-gov 10px white-on-saffron` contrast is weak but pre-existing, not introduced here; `.ring 56px/12px` at 480px is dense but has `role=img aria-label` fallback. None warrant a fix loop tonight.

## 2. A11y — PASS, no changes requested

- Skip-link `<a class=skip href=#view>` (`index.html:11`) + offscreen/focus CSS (`styles.css:9-10`) + `main#view tabindex=-1` (`:24`) + `v.focus({preventScroll:true})` on all 12 routes incl. restored `#/grievances` (`app.js:96-109`) — correct SPA focus pattern, no scroll-jump. The caught-dropped-route fix during edit is senior attention to detail.
- `*:focus-visible{outline:3px solid #ffb35c; offset 2px}` (`:7`) — visible on both light cards and navy topbar/hero. Correct color choice for projector wash.
- `toggleLang` flips `documentElement.lang` + persists `us_lang` + init on DOMContentLoaded (`app.js:55-60,88`) — correct i18n-a11y wiring. `i18n.json` 36/36 zero blanks verified by QA; headless click-through gap acknowledged, hall 1-click check documented. Non-blocking.
- `nav aria-label=Primary`, meta description, alertstrip `role=status aria-live=polite` (capped 8, text-only, `esc()`), canvas `role=img aria-label` ×3 + `<details><summary>Data table` built from live `AN` with empty-state row, rings `role=img aria-label` on all 6 branches + `border-color:#fff`, badges `border:1px solid currentColor` + `aria-label` on dashboard SLA/risk — not-color-alone fixed by both border AND text label. Correct patterns throughout.
- Instrumented gap (no axe run in headless env) is honestly disclosed in QA Bug 2, not hidden. Values match darkened approved spec. Run axe in hall browser only if judges ask for a number.

## 3. No Backend Break — PASS

- Scope discipline: `server.js`, `data/`, `package.json` untouched. Only presentational + a11y wrappers; no route/API/validator string changed. `fileApplication`, `offAct`, `bookInsp`, `validateUpload` server calls byte-identical in shape.
- Evidence: `node --check` 0/0, `GET /api/analytics avgOld=60 avgNew=21` frozen, both demo logins 200 with exact tokens, wizard/officer/analytics/knowledge/breach/reset all 9/9 live. Served-content parity (disk → HTTP 200 with every Gap string) closes stale-cache doubt. Zero regressions attributable to this diff.

## 4. Demo Risk — ACCEPTED, mitigations in place

| Risk | Assessment |
|---|---|
| Route focus breaking demo clicks | No — `preventScroll:true` preserves scroll; focus to `main` only aids keyboard/judge tabbing |
| `tblwrap` breaking wizard/officer layout | No — wrapper is scroll-only, `min-width:640px` forces scroll not squash; officer `flex-wrap:wrap` on action row already handles 320px |
| Canvas `<details>` tables cluttering analytics | No — collapsed by default, judge expands on "show me the data" — actually de-risks the numbers challenge |
| MR toggle reload losing wizard state | Pre-existing behavior (full `route()` re-render), not introduced; `localStorage.us_lang` persists lang across reload — improves hall story |
| Stale CSS in hall browser | Mitigation: hard-refresh + `GET /styles.css` contains `44px/tblwrap/clamp` pre-check; USB backup per DEMO_SCRIPT |
| Residual risks (dirty db, sweep order, projector wash, wrong-file upload) | Already covered in code-review-final §6 + qa-frontend-fix §Regression Risks; footer Reset + script order + USB+phone backup stand — no new risk added by this lift |

## 5. SIH Shortlist Impact 5.1→7.0 Claim — CREDIBLE as internal tracking, KEEP OUT of slides

- Directionally correct: P0 touch + no-overflow tables + 480px fallbacks + skip/focus/lang/live-regions + legible type directly address evaluator quick-scan (phone, projector, 60-sec tab-through). A 5.1 (functional but rough on mobile/a11y) → 7.0 (clean, judge-proof, accessible) internal delta is plausible for screening where first impression + "can I use it without help" decides shortlist.
- Guardrail: this is a sprint-estimate, NOT measured pilot data. Must NEVER appear in PPT/PDF/demo script — slides already carry honest `*Seed projection` footnotes + LIVE/SEED badging; adding an unverified "7.0 design score" would violate the honesty pass that got code-review-final APPROVED. Keep the number in this report + sprint memory only.
- Net shortlist effect: positive, zero honesty cost. No overclaim introduced to judge-facing surface.

## Issues (file:line, severity)

No critical / high / medium issues. No fix loop triggered (0/3 used).

| # | Severity | File:line | Notes |
|---|---|---|---|
| 1 | low (pre-existing) | `public/styles.css:15` `.pill-gov 10px` | White on saffron contrast weak. Pre-existing, not introduced by Gap 1-3. Do NOT fix tonight — one-line P1 post-shortlist (darken pill bg or navy text). |
| 2 | low | hall verification gap | Real-device click-through (MR Devanagari, skip-link Tab reveal, 320px projector) still wanted. Non-blocking: 4-min hall pass per qa-frontend-fix Bug 1. |
| 3 | low | `public/styles.css:3-4` contrast values | AA claimed by value (darker pair by design), no axe run headless. Non-blocking; run axe in hall only if judging criteria needs a number. Carried from QA Bug 2. |

## Mentoring Notes

- Why `tblwrap + min-width` beats `font-size:10px` on mobile: juniors, squashing tables destroys readability to "fix" overflow. Scroll-container preserves table semantics + screen-reader order + desktop design, and gives thumb-scroll on phones. Copy this pattern for every data table.
- Why `v.focus({preventScroll:true})` matters: SPA route changes must move screen-reader + keyboard focus to `main`, but default focus scrolls to top and disorients sighted judges. `preventScroll` is the one-argument difference between accessible and annoying. The restored `#/grievances` focus line is why we review every route branch, not just the diff.
- Why `role=img + details table` for canvas: canvas pixels are invisible to AT. `aria-label` gives the gist ("pending tracks by dept"), `<details>` gives the data. Both from the same live `AN` object = no drift. That is how you demo charts honestly.
- Why offline-safe font stack over CDN link: hall Wi-Fi dies, CDN fonts FOIT/FOUT, judges see fallback anyway. Declaring the stack in CSS with system fallback means the design degrades gracefully by default. Vendoring woff2 is a P1 only if hall rendering is judged.
- Next growth: when wiring `GET /api/renewals` into the dashboard SEED line, keep the `*Seed projection` footnote until pilot data lands; add tracker-first vs analytics-first order test to QA when analytics sweep ships.

## Chain Handoff

- QA PASS (30/30 live, zero regressions) → Dev-Lead APPROVED → ready for `security` audit per chain (frontend-only surface: `esc()` coverage, no new endpoints, static demo tokens unchanged — expect SECURE_WITH_NOTES carryover, no new criticals).
- Report path: `D:\SIH\udyog-sarthi\.ai\reports\code-review-frontend.md` (this file). Prior `code-review.md` + `code-review-final.md` intentionally untouched.
- Sprint DB: not updated (no task_id in dispatch — consistent with all prior reports).
- Deploy NOT requested — do NOT dispatch devops.
