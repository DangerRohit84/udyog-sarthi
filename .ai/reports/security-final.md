# Security Final Audit — SIH-26130 Shortlist Build (Udyog Sarthi)

Verdict: SECURE_WITH_NOTES
(Mapping to chain gate: PASS — zero critical issues, no fix loop triggered. Chain ends here — do NOT deploy.)

Date: 2026-09-09
Auditor: Security Engineer
Scope (full source read, no code changed):
- `D:\SIH\udyog-sarthi\server.js` (968 lines — dispatch said 969, disk is 968)
- `D:\SIH\udyog-sarthi\public\app.js` (502 lines)
- `D:\SIH\udyog-sarthi\public\index.html` (29 lines)
- `D:\SIH\udyog-sarthi\data\seed.js` (227 lines)
- `D:\SIH\udyog-sarthi\start.ps1` (59 lines)
- `D:\SIH\udyog-sarthi\package.json` (1 dep: express)
Inputs read FIRST (in order):
1. `.ai/reports/qa-shortlist-gate.md` — PASS (verifiable), gate NOT YET → SHORTLIST-READY after 20-min user fills
2. `.ai/reports/code-review-final.md` — APPROVED, 0 fix cycles
3. `.ai/reports/backend-shortlist-fix.md` — 6/6 shortlist blockers + live proofs
4. `.ai/reports/p0-fix-report.md` — 5/5 P0 fixes + live proofs
5. `.ai/reports/security-audit.md` (launcher scope, 254-line server) — SECURE_WITH_NOTES, for delta comparison

Context: local SIH demo/judging prototype, NOT production. Single operator on localhost/trusted hall LAN, illustrative seed data only, no real PII, `POST /api/reset` restores pristine. Risk assessed accordingly — issues that would be High in production are Low here. Only CRITICAL triggers the fix loop (max 3 cycles); none found (0/3 used).

## Checklist

- [x] Input validation
- [x] Authentication/Authorization (demo-grade static tokens — assessed, accepted)
- [x] Data encryption (N/A — localhost demo, no secrets in transit)
- [x] SQL injection prevention (N/A — no SQL; JSON file store, no query concat)
- [x] XSS prevention (spot-checked — `esc()` baseline good, 2 low self-XSS notes carried)
- [x] CSRF protection (N/A — no cookies/sessions; Bearer in header + localStorage)
- [x] Security headers (absent — noted, not required for localhost demo)
- [x] Error handling (no stack leakage; 400/401/403/404/422 shapes correct)

## Findings (OWASP category, severity, file:line)

No CRITICAL or HIGH findings. All shortlist-gate security targets hold live (QA B3/B6 re-verified: 401/403 on audit, 422 on forgery, 400 on Locked approve).

### 1. Injection — NONE — `server.js` whole, `seed.js` whole
- No SQL / NoSQL (no `sqlite`/`pg`/`mongo`, no query strings). Store is `fs.readFileSync`/`writeFileSync` on fixed `DB_FILE` only.
- No command execution (`child_process` never imported), no `eval`/`Function`/`vm`, no `Invoke-Expression` in `start.ps1`.
- No SSRF (no outbound `fetch`/`axios`/`http.request` server-side). Knowledge search is in-process TF-IDF (`tfidfSearch`), `limit` clamped `1–10` on both GET (`server.js:567`) and POST (`server.js:577`).
- `matchChecklist`/`eligibleSchemes` use `.includes()` comparisons only; malformed bodies yield `400` or empty matches, never code exec.

### 2. Path traversal (DB_FILE) — NONE — `server.js:15,56-78,304-323`
- `DB_FILE = path.join(__dirname, "data", "db.json")` fixed; `loadDb`/`writeDbAtomic`/`reset` never take a path from the request.
- `validateDocumentInput` rejects `[\\/]` and `..` in `name` (`server.js:315-317`), and even without that check the name is never used as a filesystem path — JSON record only (`a.documents.push`, `db.vault.push`). No write-to-disk primitive for user names.
- `require.resolve("./data/seed.js")` fixed; atomic-tmp names are `pid.ts.seq.rand` server-generated in the same dir (rename atomicity correct).

### 3. Forgery / server-side doc validation — SECURE (residual documented) — `server.js:299-380,731-751`
- Client `passed`/`verified`/`checks` fully ignored; server computes `verified` from extension + docType + sizeBytes + mime-if-supplied + expiry-if-supplied + holder. Fail → `422 {verified:false}`, nothing stored, vault untouched, Queried NOT cleared. QA B6 live: `forged.pdf {passed:true} → 422`, `evil.exe → 422`, `20MB → 422`, expired → `422`, valid → `200` + vault append.
- `reusedDocs` filtered against verified vault names (`server.js:645,661`); unvaulted names silently dropped, never marked verified — vault-poisoning hole from pre-P0 closed.
- Honest residual (NOT a fail, same as P0 §4): JSON-only metadata, no byte/MIME proof — plausible `sizeBytes+holderName` passes. True bytes need `multipart/form-data` (P1). Bar raised from 1 field to 3+extension; sufficient for localhost judging.

### 4. Authentication bypass (demo tokens) — LOW, accepted for demo — `server.js:20-46,694,790,848-871,937`
- `DEMO_USERS` 2 hardcoded judging-sheet identities → opaque static tokens (`demo-applicant-token` / `demo-officer-token`); `authRole` reads `Bearer` + `x-demo-token`/`x-auth-token` aliases; `requireOfficer` → `401` missing/unknown, `403` wrong role. Live-verified by QA (audit `401` no-token, `403` applicant).
- Protected: `PATCH …/track` (all actions), `PATCH /inspections/:id`, `GET /api/audit`, grievance `resolve` (inline `401`/`403`). Open-by-design (applicant actions): filing, doc upload, inspection booking, grievance file + `escalate`, all reads, `POST /api/login`, `POST /api/reset`.
- Why not critical: tokens are intentionally public (login page, DEMO_SCRIPT, README) — they are a demo operator switch, not a secret. LAN neighbor with port access can already read/mutate by design (see §8). Production would need: hashed passwords, signed short-lived JWT + refresh, rate-limited login, RBAC/ABAC — explicitly OUT of scope tonight, do NOT bolt on.
- Note: `POST /api/reset` is unauthenticated — anyone with port access wipes `db.json` + audit to `[]`. Accepted for demo (footer Reset button needs it; restores pristine `apps=3 history=38 audit=[]`), but it is the only unauthenticated destructive endpoint. Hall mitigation: trusted network + `Reset` is one click to recover. Future: `requireOfficer` on reset or at least a confirm token.

### 5. Audit tampering — NONE via API (reset exception noted) — `server.js:80-86,679,722,748,786,824,844,865-867,926-940`
- Append-only `{ts, actor, action, id}`; never edited/deleted in place; all mutations append (`file`, `upload:*`, `approve/query/reject/review/inspect/deemed:*`, `unlock:*`, `auto-deemed:*`, `book/complete-inspection`, `file-grievance/escalate/resolve`, `auto-escalate`). QA B3 live: `0 → 7` growth verified.
- `GET /api/audit` officer-only (`401`/`403` verified). No PATCH/DELETE audit endpoint. `action` strings are server-constructed from whitelisted `action` + existing `approvalId`; `upload:*` docType capped `120` chars (stored-XSS sink only if a future UI renders audit without `esc()` — current `app.js` has no audit UI, JSON API only).
- `actor` is `authRole()==="officer" ? "officer" : "applicant"` — forgeable label in demo (tokens are public), but it is attribution, not an auth boundary. Accept.
- Only wipe path is `POST /api/reset` → `[]` (explicit, by design — see §4 note).

### 6. Gating bypass — LOW note, NOT critical — `server.js:145-182,666-677,707-709`
- Filing stores Group-D (`MPCB-CTO`, `FIRE-FINAL` with `gatedBy:[A,B,C]`) as `Locked` + `lockedReason` when same-app A/B/C predecessors unfinished; `approve/reject/deemed` on `Locked` → `400` (QA B1 live: CTO approve → `400`, FACT approve → `200` + `unlock:*` ×2 + SLA restart at unlock). Grandfathering (`t.gated` marker) correctly never overlays legacy seeds.
- Residual bypass (business-logic, trusted-officer only): `review`/`inspect`/`query` on a `Locked` track are NOT blocked — `review` moves `Locked → Under review`, sidestepping the gate in two steps (review then approve). Impact is workflow-order integrity only (officer already holds approve rights; no privilege escalation, no external attacker gain, single-operator demo). Do NOT fix-loop tonight; P1 one-liner: extend the `Locked` guard to all six actions (or allow only `query`), plus a QA order-test (`review-Locked → 400`).
- `unlockGatedTracks` is idempotent, SLA-fair (clock starts at unlock), audited — correct.

### 7. JSON cap / DoS — SECURE with 1 low note — `server.js:17,95,387-403`
- `express.json({limit:"2mb"})` caps bodies; per-field caps (`title ≤200`, `applicant ≤100`, `remarks/note ≤2000`, `officer ≤100`, `docType 2–120`, `holder ≤120`, `name ≤255`, `size ≤10MB`, `slot 3–50`, `subject 5–300`, `reusedDocs ≤255`) + enum whitelists (`VALID_TRACK_ACTIONS`, `VALID_INSP_STATUS`, dept ids) all enforced with `400`.
- Live history capped at 500 rows with double-count guard; `renameSync` atomic writes prevent half-written `db.json` (5× parallel filings → 5 apps, valid JSON, zero `*.tmp` per backend report).
- Low note: `db.audit` is unbounded (every mutation appends; only `reset` clears). Long judging day cannot realistically overflow localhost disk, but a P1 cap (e.g. retain last 2000, same shape as history) removes the only uncapped growth. Not gating.

### 8. Open port — LOW note (unchanged from launcher audit) — `server.js:14,968`, `start.ps1:5-6`
- `app.listen(PORT)` with no host binds `0.0.0.0` while log/URL say `localhost`. On hall/public Wi-Fi any LAN neighbor reaching `:3000` can read/mutate demo data (no auth boundary by design). Demo risk LOW (ephemeral seeds, `Reset` restores). Production would be HIGH. Optional (NOT fix-loop): `app.listen(PORT, "127.0.0.1", …)` for localhost-only, or document trusted-network/firewall. QR flow (`ipconfig → 192.168.x.x`) intentionally needs LAN — keep as-is tonight.

### 9. XSS (`esc` usage) — LOW, 2 self-XSS notes carried — `public/app.js:3` + sinks
- Baseline GOOD: `esc()` (`&<>"`) + ~40 call sites escape titles, sectors, remarks, subjects, updates, vault names, benefits, knowledge Q/A, alerts `x.text` (`app.js:78`), error `e.message` (`app.js:109,328`). `index.html` has no inline user data, no `document.write`/`eval`. `esc()` missing `'` is inert (sinks are text nodes or double-quoted attrs; `onclick="… '${id}' …"` interpolates server-generated `APP-/INSP-/GRV-` ids only, never free text).
- Note 9a (low, self-XSS, carried from launcher audit): upload result reflects chosen filename unescaped — `app.js:314` (`File type: ${f.name…}`) + `app.js:320-321` (`c.msg` into `innerHTML`). Payload `<img …>.pdf` passes ext check, fires in uploader's own browser only. Stored path is safe (later rendered via `esc(d.name)`).
- Note 9b (low, self-XSS, carried): inspection `date`/`slot`/`appId`/`depts` interpolated without `esc()` — `app.js:275` (tracker detail), `app.js:374` (planner). `slot` validated `3–50` chars but not charset, so `<img…>` stores and re-renders to the same operator. Requires LAN write + self-view; no remote delivery in single-operator demo.
- Optional future (NOT gating): `esc()` every `c.msg`/filename/inspection field; add `'` → `&#39;` to `esc()`; server-side `slot` charset enum.

### 10. Secrets — NONE — all targets + `package.json`
- No API keys, connection strings, private keys, or tokens beyond the intentionally-public demo credentials (`demo123`/`officer123`, `demo-*-token` — judging-sheet values shown on login page + DEMO_SCRIPT by design; not secrets). No `.env`, no `Authorization` hardcoding beyond demo minting in `app.js:38-39` (matches server). `node_modules` hits for `TOKEN_REGEXP` are library internals. Not a git repo — no history to scan; nothing to rotate.

### 11. `seed.js` + `start.ps1` — SECURE
- `seed.js`: no secrets, no exec, no URLs; `DEMO-BREACH` (FIRE-PROV 24d) + `DEMO-ESCALATION` (GRV-881 8d) seeds are intentional and handled correctly by sweeps (QA F5). Validity table (annual 365, CTE 1825, CTO Red/Amber 1825 Green 3650, one-time null) + `gatedBy` ×2 match K16/K46. History stays 38 rows.
- `start.ps1` (59 lines): unchanged since launcher audit — hardcoded `$Port=3000`, `-LiteralPath` everywhere, `& npm install/start` via call operator, no `IEX`/`Invoke-WebRequest`, process-scoped `Bypass -File` only. Secure, no changes needed.

### STRIDE snapshot (prototype, same as launcher + new controls)
- Spoofing: static demo tokens by design — accepted; officer routes 401/403 enforced.
- Tampering: LAN-anyone-can-write + open reset — accepted; atomic writes + `Reset` restore; audit append-only.
- Repudiation: FIXED since launcher — append-only audit `{ts,actor,action,id}` + officer-only read covers "show yesterday's log".
- Information Disclosure: seed data only — none; audit/grievances not exposed beyond localhost demo.
- Denial of Service: `2mb` cap + field caps + 500-row history cap help; no rate limiting — accepted on localhost (audit uncapped note above).
- Elevation of Privilege: applicant→officer blocked (`403`); Locked→approve blocked (`400`); review-on-Locked residual is workflow order, not privilege (see §6).

## Required Fixes (for dev agents)

**None. Zero critical issues. Do NOT enter the fix loop (0/3 cycles used).**

Optional, non-blocking hardening for a post-shortlist pass (explicitly NOT gating — apply only if a follow-up task requests it):
1. `server.js:707` — extend `Locked` guard to all actions (`review`/`inspect`/`query` → `400` while gated); add QA order-test.
2. `server.js:926` — `requireOfficer` on `POST /api/reset` (or confirm token); keeps footer Reset via officer login.
3. `server.js:83` — cap `db.audit` (e.g. last 2000, same pattern as `recordCompletion` 500 cap).
4. `server.js:968` — bind `127.0.0.1` for localhost-only demos (keep LAN bind only when QR judging needs it).
5. `public/app.js:314,320,275,374` — `esc()` filename/`c.msg`/inspection fields; add `'` → `&#39;` to `esc()`.
6. Before judging day: `npm audit`, keep `express` on latest 4.x; no SBOM/SLSA for prototype.
7. Production (out of scope): salted-hash passwords, signed JWT + expiry + rate-limited login, `helmet()` + CSP, Postgres-backed audit with retention, secrets vault.

## Chain Handoff

- QA PASS (verifiable) → Dev-Lead APPROVED → **Security SECURE_WITH_NOTES** (no criticals, no fix loop). Chain ends at security per router rules — **do NOT dispatch devops/deploy**.
- Report path: `D:\SIH\udyog-sarthi\.ai\reports\security-final.md` (this file). Prior `security-audit.md` (launcher scope) intentionally untouched.
- Sprint DB: not updated (no `task_id` in dispatch; consistent with `qa-shortlist-gate.md`, `code-review-final.md`, `backend-shortlist-fix.md` — skipped rather than guessed, non-blocking).
- User's 20-min path to SHORTLIST-READY unchanged (Team ID Ctrl+H 11× + College fill + re-export verify + hall click-through per `qa-shortlist-gate.md` §4).
