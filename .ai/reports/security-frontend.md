# Security Audit — Frontend Gap 1-3 Lift (5.1 → 7.0)

Verdict: SECURE_WITH_NOTES
(Mapping to chain gate: PASS — zero critical issues, no fix loop triggered. Chain ends here — do NOT deploy.)

Date: 2026-09-09
Auditor: Security Engineer
Scope (full source read, no code changed — audit/report ONLY):
- `D:\SIH\udyog-sarthi\public\app.js` (505 lines on disk; fix-report says 506 — 1-line drift, immaterial)
- `D:\SIH\udyog-sarthi\public\index.html` (31 lines)
- `D:\SIH\udyog-sarthi\public\styles.css` (74 lines)
- `D:\SIH\udyog-sarthi\public\i18n.json` (36 EN + 36 MR, zero blanks)
Inputs read FIRST (in order):
1. `.ai/reports/frontend-fix-report.md` — Gap 1-3 + 10 quick wins, served-HTTP verified
2. `.ai/reports/qa-frontend-fix.md` — PASS (Gap1 7/7, Gap2 8/8, Gap3 6/6, regression 9/9, live :3000)
3. `.ai/reports/code-review-frontend.md` — APPROVED, 0 fix cycles, forward to security
4. `.ai/reports/security-final.md` — SECURE_WITH_NOTES (968-line server baseline, 502-line app.js) — delta comparison base

Context: local SIH demo/judging prototype, NOT production. Single operator on localhost/trusted hall LAN, illustrative seed data only, no real PII, `POST /api/reset` restores pristine. Risk assessed accordingly — issues that would be High in production are Low here. Only CRITICAL triggers the fix loop (max 3 cycles); none found (0/3 used).

## Checklist

- [x] Input validation (frontend reflects server validation; no new client trust boundary)
- [x] Authentication/Authorization (demo-grade static tokens unchanged — accepted per security-final §4)
- [x] Data encryption (N/A — localhost demo, no secrets in transit, no new crypto)
- [x] SQL injection prevention (N/A — no SQL; no query concat; no new endpoints)
- [x] XSS prevention (spot-checked all 28 innerHTML sinks + 3 new `<details>` tables — esc() coverage holds, 1 new low note + 2 carried lows)
- [x] CSRF protection (N/A — no cookies/sessions; Bearer in header + localStorage, unchanged)
- [x] Security headers (absent — noted in baseline, not required for localhost demo, unchanged by this lift)
- [x] Error handling (no stack leakage; `esc(e.message)` in route catch + knowledge catch — unchanged)

## Findings (OWASP category, severity, file:line)

No CRITICAL or HIGH findings. Gap 1-3 diff is presentational + a11y wrappers only (no route/API/validator change). All dispatch targets checked below.

### 1. XSS via new `<details>` data tables — NONE — `public/app.js:441,445,446`

- ch3 live table (`:441`): `<td>${esc(k)}</td><td>${v}</td>` — key escaped, value is server-aggregated numeric count. SAFE.
- ch1 old/new/saved table (`:445`): `<td>${esc(k)}</td><td>${v.old}</td><td>${v.new}</td><td>${v.saved}</td>` — key escaped, values numeric from SEED baseline. SAFE.
- ch2 bottleneck ranking (`:446`): `<td>${esc(k)}</td><td>${v.saved}</td>` — same pattern. SAFE.
- Empty-state rows are static strings (`No live pending tracks`). Tables wrapped in `div.tblwrap` (scroll-only, no HTML parsing change). No new sink introduced — all three built from the same live `AN` object already rendered on canvas, so no drift/no second source.

### 2. XSS via innerHTML (full sink sweep, 28 sites) — LOW, 2 carried + 1 new note, no criticals — `public/app.js` whole

- Baseline GOOD, unchanged: `esc()` (`&<>"`) at `:3` + ~40 call sites escape titles, sectors, remarks, subjects, updates, vault names, benefits, knowledge Q/A, alerts `x.text` (`:79`), error `e.message` (`:110,504`). `index.html` has no inline user data, no `document.write`/`eval`. Grep confirms: no `eval`/`Function(`/`document.write`/`insertAdjacentHTML`/`outerHTML`/`setTimeout+`/`location.href=`/`window.open` (2 hits for `eval` are English words "retrieval"/"eval P@1", not code).
- Carried Note 2a (low, self-XSS, from security-final §9a): upload result reflects chosen filename unescaped — `:317` (`File type: ${f.name…}`) + `:323` (`c.msg` into `innerHTML`). Payload `<img…>.pdf` passes ext check, fires in uploader's own browser only. Stored path safe (later rendered via `esc(d.name)` at `:280,306`). NOT introduced by Gap 1-3 — untouched lines.
- Carried Note 2b (low, self-XSS, from security-final §9b): inspection `date`/`slot`/`appId`/`depts` interpolated without `esc()` — `:275` tracker detail note, `:368` officer `loadOffInsp`, `:377` inspections planner (`${i.date} ${i.slot}`, `${i.depts.join("+")}`). `slot` validated `3–50` chars server-side but not charset, so `<img…>` stores and re-renders to same operator. Requires LAN write + self-view; no remote delivery in single-operator demo. NOT introduced by Gap 1-3.
- New Note 2c (low, Gap-lift adjacent — wizard group rows): `:227` `<td>${a.dept}</td>` unescaped (name/docs/fee paths use `esc()`/`toLocaleString` correctly; `res.combined` at `:225` uses `esc()`; schemes at `:228` use `esc(s.name)`; pre-filing checklist at `:229` uses `esc()`). `a.dept` is a server META enum (MPCB/MIDC/Labour/Fire/MSEDCL/DOI), never free text in this build. Exploitable only if server/META compromised — at which point attacker already owns the data plane. Do NOT fix-loop; batch with security-final optional item 5.
- `a.id` unescaped in `:179` dashboard badge, `:264` appDetail `<h2>`, `:350` officer remark input id, `:368` inspection row — all server-generated `APP-/INSP-/GRV-` ids only (alphanumeric + hyphen), never free text. Hash-fragment `h.split("/")[2]` at `:101` is sent to `GET /api/applications/:id`; unknown ids 404 to `esc(e.message)` catch — no direct hash-to-HTML reflection. Pre-existing, safe for demo.

### 3. aria/label injection — LOW (1 new note, not gating) — `public/app.js:178,182,250-257`

- SAFE (static): dashboard SLA badges `:178` (`aria-label="SLA status: breached/urgent/on track"` — string literals), rings `:250-252` (Done/Held/Locked literals + `border-color:#fff`), canvas `:441,445,446` (`role=img aria-label` literals), badges `:36` CSS border fix.
- SAFE (escaped): ring default `:253` (`Status ${esc(status)}`), ring SLA branch `:257` (`aria-label="${label}, status ${esc(status)}"` — `label` built from numeric `sla.left` + literals only), nav `:70` (`esc(T(k,en))`), wizard/track/knowledge labels all `esc(T(…))`.
- Note 3a (low, the only new unescaped aria interpolation in this lift): `:182` `aria-label="Risk ${a.risk.band}, score ${a.risk.score}"` — `band`/`score` from `GET /api/applications` NOT passed through `esc()`. `band` is a server-computed enum (Green/Amber/Red) and `score` numeric in this build, so break-out (`" onmouseover=`) requires server compromise. Impact even then is self-XSS in attribute context (needs `"` break-out; `esc()` missing `'` is inert in double-quoted attr per baseline). Do NOT fix-loop; one-word batch fix post-shortlist: `esc(a.risk.band)` + numeric coerce `score`.
- `deptName()`/grievance status at `:408` (`${esc(g.status)}` escaped — correct); officer `:348` SLA breach text uses numeric `t.sla.left` — safe.

### 4. lang flip (`toggleLang` + `us_lang`) — NONE — `public/app.js:49-60,88` + `public/i18n.json` whole

- `LANG` toggles strictly `"mr"↔"en"` at `:56`; `document.documentElement.lang = LANG` at `:58,88` is DOM *property* assignment, not HTML parsing — no XSS even with poisoned `localStorage.us_lang` (arbitrary string lands in `lang` IDL attribute as inert text; `T()` lookup `I18N[LANG][k]` falls back to `fb||k` on miss; header button ternary `LANG==="mr"?"English":"मराठी"` stays safe).
- `i18n.json` values audited: 36/36 static translator strings (Devanagari + `×`/`→`/`·`/`₹`), zero `<`/`>`/`"`/`script`/`on*=`. `kn_search_ph` rendered at `:482` via `esc(T(…))` into double-quoted `placeholder="…"` — `"` escaped, safe. `brandsub` at `:73` uses `textContent` (not innerHTML) — correct. Initial `localStorage` read at `:50` wrapped in try/catch — no throw on blocked storage.

### 5. Focus management (`tabindex=-1` + `v.focus(preventScroll)`) — NONE — `public/index.html:24` + `public/app.js:96-109`

- `main#view tabindex=-1` + `v.focus({preventScroll:true})` on all 12 routes incl. restored `#/grievances` + not-found is the correct SPA a11y pattern (moves screen-reader/keyboard focus without scroll-jump). No user data flows through focus path. Skip-link `<a class="skip" href="#view">` at `index.html:11` is a static fragment — no open-redirect (no `location=` assignment from hash; hash only selects a whitelisted branch at `:96-109`). `renderChromeActive()` toggles `active` class only. No focus-hijack / tab-napping vector.

### 6. CSS injection — NONE — `public/styles.css` whole (74 lines)

- Stylesheet is fully static: no `url()`, no `@import`, no `expression`/`behavior`/`binding` (grep: single hit is `scroll-behavior:auto` inside `prefers-reduced-motion` kill-switch — inert). No user data reaches `style=` attributes except three numeric/static ternaries, all safe: `:183` `width:${pct}%` (`pct` is `Math.round(done/max*100)` numeric 0–100), `:257` `background:${c}` (`c` ∈ `var(--red)/var(--amber)/var(--blue)` literals), `:393` `border-left:6px solid var(--green)`/`opacity:.75` literals. `.skip{left:-999px}` offscreen + `:focus{left:0}` is legacy but functional; no clipping-based data exfiltration surface in a localhost demo with no sensitive DOM.

### 7. Secrets — NONE — all four targets + `package.json` (unchanged)

- No API keys, connection strings, private keys, or session secrets. Only intentionally-public demo credentials (`udyog@demo.in/demo123`, `officer@maharashtra.gov.in/officer123`, `demo-applicant-token`/`demo-officer-token` at `app.js:38-39,167`) — judging-sheet values shown on login page + DEMO_SCRIPT by design, same as security-final §10 (not secrets, demo operator switch). `localStorage` tokens (`us_token`/`us_role`/`us_lang`/`us_dept`) are client-side demo state, no `HttpOnly`/`Secure` cookies by design (N/A). No `.env`, no new `Authorization` hardcoding beyond demo minting. `i18n.json`/`styles.css`/`index.html` contain zero credential-like strings.

### 8. New endpoints / outbound surface — NONE — `public/app.js` + `public/index.html`

- Endpoint inventory identical to baseline: `POST /api/login`, `GET /api/meta|alerts|analytics|applications|vault|inspections|grievances`, `POST /api/checklist|applications|inspections|grievances`, `PATCH …/track|inspections/:id|grievances/:id`, `POST /api/reset`, `GET/POST /api/schemes/match`, `GET /api/knowledge/search?q=&limit=8` (with `encodeURIComponent` at `:494` — correct), `POST …/documents`, plus relative `fetch("i18n.json")` at `:53` (same-origin static JSON, offline-fallback wrapped). No `http://`/`https://`/protocol-relative URLs anywhere; single `fetch` wrapper at `:10` only takes same-origin `/api/*` paths. No new methods, no new query params, no WebSocket/EventSource, no third-party script/link (no CDN — offline-safe font stack per fix-report Gap 3, correct for hall). `index.html` loads only `styles.css` + `app.js` relatively.

### 9. STRIDE snapshot (frontend slice, prototype — same posture as security-final, improved a11y)

- Spoofing: static demo tokens by design — unchanged, accepted; no new auth surface.
- Tampering: no new write primitive (only pre-existing filing/docs/inspection/grievance POSTs); `tblwrap`/aria/focus changes are render-only.
- Repudiation: no audit UI in frontend (JSON API only) — nothing to tamper from here.
- Information Disclosure: new `<details>` tables expose only data already on screen via canvas/API (`AN` object); no new fields; error catch shows `esc(e.message)` only.
- Denial of Service: `alerts.slice(0,8)` cap retained at `:79`; knowledge debounce 180ms at `:486` retained; canvas `bars()` guards `Math.max(1,…)` — no new loopbomb.
- Elevation of Privilege: `setRole` demo minting unchanged (operator switch, not a boundary); officer actions still server-`401/403`-gated; `Locked→approve 400` unaffected (no tracker logic touched).

## Required Fixes (for dev agents)

**None. Zero critical issues. Do NOT enter the fix loop (0/3 cycles used).**

Optional, non-blocking hardening for a post-shortlist pass (explicitly NOT gating — apply only if a follow-up task requests it; batch with security-final §Required Fixes items 1–7):
1. `public/app.js:182` — `esc(a.risk.band)` + numeric-coerce `a.risk.score` inside dashboard risk `aria-label` (closes Note 3a; one-word change).
2. `public/app.js:227` — `esc(a.dept)` in wizard group rows (closes Note 2c; server-enum today, defence-in-depth).
3. `public/app.js:317,323,275,368,377` — carried security-final item 5: `esc()` filename/`c.msg`/inspection `date`/`slot`/`appId`/`depts`; add `'` → `&#39;` to `esc()`.
4. `public/app.js:50` — clamp `us_lang` init to `["en","mr"].includes(v)?v:"en"` (hygiene; property-assignment already safe).
5. Before judging day: `npm audit`, keep `express` on latest 4.x; no SBOM/SLSA for prototype.
6. Production (out of scope): salted-hash passwords, signed JWT + expiry + rate-limited login, `helmet()` + CSP (`default-src 'self'`, no inline `onclick`), Postgres-backed audit with retention, secrets vault.

## Chain Handoff

- QA PASS (30/30 live, zero regressions) → Dev-Lead APPROVED → **Security SECURE_WITH_NOTES** (no criticals, no fix loop). Chain ends at security per router rules — **do NOT dispatch devops/deploy**.
- Report path: `D:\SIH\udyog-sarthi\.ai\reports\security-frontend.md` (this file). Prior `security-final.md` (full-build scope) + `security-audit.md` (launcher scope) + `code-review-frontend.md` + `qa-frontend-fix.md` intentionally untouched.
- Sprint DB: not updated (no `task_id` in dispatch — consistent with all prior frontend-chain reports, non-blocking).

(End of file)
