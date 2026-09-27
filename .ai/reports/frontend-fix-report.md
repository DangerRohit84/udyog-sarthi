# Frontend Fix Report — Gap 1-3 + Quick Wins (5.1 → 7.0)

**Date:** 2026-09-09 · **Scope:** `D:\SIH\udyog-sarthi\public\` only · **Backend:** intact (`server.js` port 3000, logins work)
**Sprint:** 15 SIH Frontend Polish · **Task:** #53 Frontend design fixes Gap1-3 + quick wins
**Input:** `DEMO_SCRIPT.md` read first. `.ai/reports/frontend-design-review.md` missing — used task summary as spec.

## Files changed (3 + report)
- `public/index.html` (29 → 31 lines): meta description, skip-link, nav `aria-label="Primary"`, alertstrip `role=status aria-live=polite`, main `#view tabindex=-1`, footer shortened (Reset button kept).
- `public/styles.css` (60 → 74 lines): see Gap 1-3 + quick wins below.
- `public/app.js` (502 → 506 lines): `toggleLang` flips `documentElement.lang`, route focus, `tblwrap` on 2 tables, rings `role=img aria-label` + border, dashboard badges `aria-label`, analytics `details` data tables for ch1/ch2/ch3.
- `public/i18n.json`: verified, no change needed (36 EN + 36 MR, zero blanks).
- `server.js`, `data/`, `package.json`: untouched.

## Gap 1 — Touch + tables + mobile (P0)
- `.btn.sm`: `padding:10px 16px; min-height:44px; inline-flex center`.
- `.nav a`: `padding:12px 14px; min-height:44px; inline-flex center; font-size:14px`.
- `input,select,textarea`: `min-height:44px` (kept `width:100%`, padding, radius).
- Tables: every `table.tbl` wrapped in `div.tblwrap` (login credentials + wizard group tables = 2 sites). CSS: `.tblwrap{overflow-x:auto}` + `.tbl{min-width:640px}`.
- `@media 480px` added: `#view` padding 14/10/48, hero padding 22/16, h1 28px, track 1fr, ring 56px, statgrid 1fr, footer 12px. Existing `@media 900px` kept.

## Gap 2 — A11y (P0)
- Skip-link `<a class="skip" href="#view">` after `<body>` + `.skip` CSS (offscreen, `:focus` reveals).
- `*:focus-visible{outline:3px solid #ffb35c; outline-offset:2px}`.
- `toggleLang()` sets `document.documentElement.lang`; init on `DOMContentLoaded` from `localStorage.us_lang`.
- `nav aria-label="Primary"`, meta description, alertstrip `role=status aria-live=polite`, `main#view tabindex=-1` + `v.focus({preventScroll:true})` on every route (incl. restored `#/grievances` — caught dropped route during edit).
- Canvas: `role=img aria-label` on ch1/ch2/ch3 + `<details><summary>Data table…` fallback built from `AN` (`byDept` old/new/saved, `live.pendingByDept`, ranked bottleneck).
- Rings: `role=img aria-label` (Done/Held/Locked/SLA breached/urgent/ontrack) + `border-color:#fff` + CSS `border:2px + text-shadow`. Badges: CSS `border:1px solid currentColor` (not color-alone; text label already present) + `aria-label` on dashboard SLA + risk badges.

## Gap 3 — Type (P0)
- `body{font-family:"Mukta","Noto Sans Devanagari","Segoe UI",Roboto,Arial,sans-serif; font-size:16px; line-height:1.5}` — offline-safe stack, no hard CDN (vendor/system fallback).
- Hero h1 `clamp(28px,4vw,40px)` + `line-height:1.2`.
- `.small 13.5px` (was 12.5), `.badge 12.5px` (was 11.5) + border, `--mut #3f4c5e` (was #5d6b7d), `--amber #7a5200` (was #a86a00), `.stat b clamp(20px,2.5vw,24px)` + `span 12.5px`.

## Quick wins (10)
1. Topbar wrap: kept `flex-wrap:wrap` + added `row-gap:8px`.
2. Focus-visible: see Gap 2.
3. Btn transition + reduced-motion: `transition:background .15s, transform .15s` + `@media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}`.
4. Card shadow: `0 2px 8px rgba(16,41,79,.08)` (was 0 1px 3px .06).
5. Step.on inset: `box-shadow:inset 0 0 0 2px var(--saffron)`.
6. Ring legibility: border + text-shadow (see Gap 2).
7. Canvas height `min(260px,60vw)` (was fixed 260px).
8. Footer shorten: one-line `Udyog Sarthi · SIH 2026 demo · 🌱 SEED* illustrative · 🔴 LIVE …` (Reset button untouched).
9. Badge border (color-alone fix) + stat clamp legibility.
10. Alertstrip `overflow-x:auto` retained for small screens + tblwrap scroll pattern.

## Verify (all PASS, backend intact)
- `node --check public/app.js` → exit 0; `node --check server.js` → exit 0.
- `npm start` health: port 3000 already serving (EADDRINUSE on second start = existing server healthy). `GET /api/analytics` → `avgOld=60 avgNew=21` (matches DEMO_SCRIPT reset expectation).
- Served-content checks: `GET /` 200 contains skip-link, `role=status`, `tabindex=-1`, `aria-label=Primary`, meta description. `GET /styles.css` 200 contains focus-visible/skip/tblwrap/640px/44px/clamp/reduced-motion/480px/#ffb35c. `GET /app.js` 200 contains lang flip/tblwrap/role=img/aria-label/details/v.focus.
- Logins (DEMO_SCRIPT): `POST /api/login udyog@demo.in/demo123` → 200 `demo-applicant-token`; `officer@maharashtra.gov.in/officer123` → 200 `demo-officer-token`. `GET /api/applications` 200, `GET /i18n.json` 200.
- Overflow 320/768/1024 (static audit): tblwrap×2, min-width+overflow, 480 + 900 queries, hero/track 1fr fallbacks, topbar/footer wrap, canvas `width:100%` (520×260 attrs only intrinsic) — PASS.
- Keyboard: Tab reaches skip-link → visible 3px outline; `main tabindex=-1` focus on route without scroll-jump — PASS (code + CSS).
- MR toggle: `i18n.json` en 36 / mr 36, missing 0, blanks 0; `toggleLang` flips `html lang` + persists `localStorage.us_lang` — no blanks.
- Demo flows preserved: wizard → file, tracker breach, officer queue, analytics LIVE vs SEED, knowledge TF-IDF, footer Reset — no route/API/validator touched; only presentational + a11y wrappers.

## Blockers
- None. Note: `.ai/reports/frontend-design-review.md` was missing; implemented from task summary. `D:\SIH` is not a git repo — no diff/commit; verification via served HTTP + file checks instead.

## TODO(username) follow-ups (not in scope)
- TODO(junior): add real 320px device screenshot pass on hall projector if washed out (USB backup per DEMO_SCRIPT).
- TODO(junior): consider Mukta woff2 vendoring under `public/fonts/` if hall offline font rendering is judged (current stack falls back cleanly).
