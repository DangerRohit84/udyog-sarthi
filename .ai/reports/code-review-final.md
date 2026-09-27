# Code Review — Final Shortlist Gate (SIH-26130 Udyog Sarthi)

Verdict: APPROVED

Date: 2026-09-09 · Reviewer: Development Lead · Mode: review-only, no code changed
Scope: shortlist build — PPT submit pair + `server.js` (969 lines) + `data/seed.js` + `public/*` + `README.md` + `DEMO_SCRIPT.md`
Inputs read FIRST (in order):
1. `.ai/reports/qa-shortlist-gate.md` — PASS all verifiable, gate NOT YET → SHORTLIST-READY after 20-min user fills
2. `.ai/reports/ppt-submit-ready.md` — 6-slide honesty pass + COM re-export
3. `.ai/reports/backend-shortlist-fix.md` — 6/6 shortlist blockers (gating/completeness/audit/renewals/analytics/atomic)
4. `.ai/reports/demo-ready-report.md` — MR + LIVE/SEED + demo seeds + script
5. `.ai/reports/qa-report.md` (launcher PASS 18/18 + shortlist addendum) + `.ai/reports/code-review.md` (launcher APPROVED) + `.ai/reports/security-audit.md` (launcher SECURE_WITH_NOTES, see §6 caveat)
Constraint honored: review + coordinate ONLY. No implementation fixes applied. No files rewritten.

## Summary

Shortlist build is honest, demo-intact, and live-verified. QA re-verified every verifiable item with fresh evidence on live `:3000` (PPT 7/7, backend 7/7, frontend 6/6). Backend kills the shortlist-killer questions (R3 gated-CTO, R5 audit log, R6 headline-moves + real renewals, R7 race guard). PPT is 6 slides, <5 MB, zero overclaims, honestly badged stack, footnoted numbers. Frontend is honestly badged LIVE vs SEED with a judge-proof demo script. Two low observations (analytics-no-sweep, IPv6 localhost) are documented with workarounds and do not warrant a fix loop. Remaining gate items are USER fills only (Team ID 11× + College 1× + re-export + hall click-through, ~20 min) — not dev changes. Per "only request changes if critical for shortlist": no changes requested. APPROVED.

## Quality Gates (Merge Criteria)

- [x] All tests passing — QA shortlist gate: PPT 7/7 PASS, backend 7/7 PASS live, frontend 6/6 PASS; `node --check server.js + data/seed.js` OK; P0 regressions hold (422/401/400, knowledge 60/0.75)
- [x] Code reviewed by 1+ team member — this review (dev-lead) + prior launcher review
- [x] No critical/high security findings — no critical/high in QA; prior security audit SECURE_WITH_NOTES covered 254-line server (see §6: re-audit of new 969-line endpoints recommended post-shortlist, but live 401/403 verified — not gating)
- [x] Documentation updated — README truth pass + DEMO_SCRIPT.md + SUBMIT_CHECKLIST.txt + speaker-notes TODOs all present and verified
- [x] Branch up-to-date with main — N/A (single local prototype, no merge conflicts; server left RUNNING clean apps=3 history=38 audit=[] pre-sweep)
- [x] Meaningful commit messages — N/A to reviewer; suggest `release(shortlist): 6-slide honest PPT + gated backend + LIVE/SEED demo (SIH-26130)`
- [x] Sprint task updated — SKIPPED (no task_id in dispatch — same gap as all prior reports; skipped rather than guessed, non-blocking)

## 1. PPT 6-slide honesty — PASS, no changes requested

- 6 slides only in root (`Slides.Count==6` via python-pptx + COM). Root holds ONLY submit PPTX (~707 KB) + PDF (477,804 B = 0.46 MB <5 MB PASS) + `.bak` backup + `SUBMIT_CHECKLIST.txt`. Vision 8-slide file archived to `.ai/archive/` only (6.4 MB) — wrong-file risk closed, file NOT deleted (rollback safety correct).
- Honesty scan: bare `React 18 / Next 14 / Mongo 7 / Rules+RAG / LLM API` = 0; `Vanilla JS / JSON file store / TF-IDF / no LLM / P@1 0.75 / filename+size` all FOUND; `Tesseract` only in Phase-2 lines. Arch boxes, caption, stack, S2/S4 text all honestly rewritten. Guardrail line kept. One name only.
- Footnotes `*Seed projection` ×5 (S2 footer+strip, S3/S4 footer, S5 box+footer, S6 refs) — every numbers slide covered.
- `SUBMIT_CHECKLIST.txt` 10 items + S1/S3 speaker-notes TODOs (Team ID/college + demo honesty script) — correct.
- Intentional `XXX_COUNT=11` + `___=1` retained BY DESIGN. Uploading as-is = auto-ding — this is a USER fill, not a code fail. Do NOT "fix" by inventing an ID.

## 2. Backend gating / audit / renewals — PASS, no changes requested

- (1) Parallel gating: D tracks (`MPCB-CTO`, `FIRE-FINAL` with `gatedBy: [A,B,C]`) file as `Locked` + `lockedReason`; officer approve on Locked → `400`; predecessor approve → `Applied` + `unlock:*` audits + SLA restart at unlock (fair). Grandfathering holds (legacy seeds never overlaid). Live proof `APP-2026-0159` verified. Kills "CTO before CTE?".
- (2) Completeness: `trackCompleteness()` (exact → substring → token overlap) per-track `{pct, matched, required, missing[]}` + app `completenessPct`, exposed in every enriched payload + `GET /:id/track`. Live `0% → FACT 25% (1/4)` verified. Good.
- (3) Audit: `audit: []` append-only `{ts, actor, action, id}`, logged on file/upload/approve/query/reject/review/inspect/deemed/unlock/auto-deemed/book/complete/file-grievance/escalate/resolve/auto-escalate; `GET /api/audit` officer-only (401/403 verified live, 0→7 growth verified). Kills "show yesterday's audit log". Only `/api/reset` restores `[]` — correct.
- (4) Renewals: validity table (annual 365, CTE 1825, CTO band-aware Red/Amber 1825 Green 3650, one-time null) + `issuedAt/validityDays/renewalDue` stamping + `renewal: {due, daysLeft, state}` + `GET /api/renewals` sorted. Live `2026-09-09 → 2027-09-09 365d valid` verified. Judgment call (SLA ≠ validity, per K16/K46) documented and CORRECT — SLA-based renewals would have produced 30/60-day nonsense. `FALLBACK_VALIDITY` for stale db.json is good defensive depth.
- (5) Headline moves: `recordCompletion()` appends measured `slaStartedAt→decision` (min 1d), double-count guarded, 500-row cap; seed stays 38 rows + `liveHistoryCount/avgNewLive/basis` string. Live `38→40, avgNew 21→20` verified. Kills "file an app, show it moving".
- (6) Race guard: `writeDbAtomic()` (unique tmp same-volume + `renameSync` + cleanup), all writers routed. Live 5× parallel filings → 5 apps, valid JSON, zero `*.tmp`. Residual multi-process RMW interleave documented as out-of-scope (single demo server topology) — honest and correct for tonight.
- Scope respected: `server.js` + `seed.js` ONLY; port 3000, logins, reset, express-only, offline intact. 697→969 lines is justified (helpers + 3 read endpoints + audit), not bloat.

## 3. Frontend MR / demo honesty — PASS, no changes requested

- i18n 36/36 EN+MR, blanks 0/0, missing-in-MR 0, top-22 Devanagari byte-verified, `localStorage.us_lang` + `toggleLang` + `T()` fallback — PASS. Headless click-through gap acknowledged; hall one-click check documented in DEMO_SCRIPT — non-blocking.
- LIVE vs SEED badging: landing/dashboard/documents/analytics + footer all honestly labeled; vault "filename records only — no file bytes, no live DigiLocker API"; renewals "58 days* + *Illustrative seed date — K07/K46"; analytics "SEED baseline + LIVE counters". Correct — the one remaining static "58 days" in `app.js` is footnoted, and backend `GET /api/renewals` is ready for the UI pass. Do NOT rush a UI rewire tonight.
- README truth (60-article, 0.75, no LLM, TF-IDF, 422, Postgres, Seed projection, Sinnar) + banned-words + file+line pointers — PASS.
- DEMO_SCRIPT.md (60-sec + 2-min, exact clicks Food→Nashik Sinnar→Small→Establish→9 items→File, logins, :3000 + 127.0.0.1 fallback + QR, reset-first, break-glass, never-say) — PASS, judge-proof.
- Breach Deemed (FIRE-PROV 24d) + escalation Nodal (GRV-881 8d) fire on first read by design; `GRV-872 Resolved` kept; reset clean `apps=3 history=38` verified, server left RUNNING clean — PASS.

## 4. Code quality (FAANG lens) — GOOD, no changes requested

- Correctness: gate guard (400), unlock idempotent in sweeps, completeness deterministic, renewal backfill for legacy rows, history double-count guard, atomic-write cleanup — edge cases handled. Grandfathering + FALLBACK_VALIDITY show migrational care.
- Security (code-review lens): `401` no-token + `403` applicant on audit verified; no SQL (fixed `db.json` path), no exec, `express.json({limit:"2mb"})` cap, no outbound fetch/SSRF. Static demo tokens retained BY DESIGN (demo threat model) — do not bolt on auth tonight.
- Performance: no N+1 (single JSON read/write per request), no unbounded lists except capped live history (500), no indexes applicable (file store). No p50/p95/p99 needed for localhost demo. Analytics-no-sweep staleness (pending 8→7) is the only consistency nit — demo order hides it; 1-line P1 if desired post-shortlist.
- Maintainability / SOLID / Clean: single-file God concern (gate+completeness+renewal+history+audit in `server.js`) ACCEPTED for single-file prototype — splitting now adds integration risk for zero screening ROI. No `switch/if on type` → Strategy overkill; no fat interfaces; no `new Concrete()` DI need. Names intent-revealing (`unlockGatedTracks`, `trackCompleteness`, `recordCompletion`, `writeDbAtomic`). No magic numbers beyond well-tabled validity/SLA constants. Boy Scout: comments mark demo-grade boundaries (static tokens, single-server, 500 cap).
- DRY/KISS/YAGNI: no 3rd-time duplication extracted prematurely; no speculative generality (Mongo/React/LLM correctly deferred to Phase-2 with roadmap lines, not built). Versioning N/A (prototype).
- Tests: live curl matrix in backend §3 + QA B1–B7 + F1–F6 + P1–P7 is the test evidence for tonight (no unit harness — acceptable for offline single-dep demo; do not scaffold Jest tonight).

## 5. SIH template compliance — PASS, no changes requested

- 6-slide IDEA format held; NO names slide BY DESIGN (names via portal — adding one breaks the rule). Theme `Miscellaneous` / PS Category `Software` stated; portal dropdowns must match PS SIH26130 exactly (user item 5 — slide fix only if portal differs).
- PDF <5 MB, footers `n/6`, table navy/white, 6 PNG backups re-rendered 1920×1080 (87–177 KB) and visually checked (no brackets/overflow). Upload-only list (PPTX+PDF, never `.bak`/archive) + USB+phone backup — correct.

## 6. Demo risk — ACCEPTED, mitigations in place

| Risk | Mitigation (verified present) |
|---|---|
| Wrong-file upload (`.bak` + archive vision + submit PPTX on disk) | Checklist item 8 + USB holds only submit pair + PNGs |
| Dirty `db.json` before judging | Footer Reset one click; pre-check `curl /api/analytics → history=38`; left clean now |
| Sweep order (analytics before tracker → stale pending, no breach) | Script order tracker→grievances→analytics; break-glass table |
| MR toggle / projector Devanagari | Hall click-through item; fallback: state `36 keys zero blanks` + roadmap line |
| Banned words on stage | 5 honest sentences + never-say list + checklist item 9; point at `server.js` validator/sweeps/TF-IDF |
| Port busy / IPv6 localhost | `netstat/taskkill`, `127.0.0.1:3000` fallback, QR uses LAN IP, offline 1 dep |
| Prior security audit staleness | `security-audit.md` covered 254-line server; current server is 969 lines with 3 new read endpoints + token checks. Live 401/403 verified by QA so NOT gating shortlist — but `security` MUST re-audit post-this-review per chain (new surface: `GET /api/audit`, `GET /api/renewals`, `GET /:id/track`, static demo tokens, mass-assignment notes carry over) |
| Frontend renewals static line | Footnoted honestly; backend ready; UI pass is post-shortlist P1, not tonight |

## Issues (file:line, severity)

No critical / high / medium issues. Two low observations ACCEPTED without fix loop (same as QA):

1. `server.js` analytics handler — low — `GET /api/analytics` does not run `runSweeps` (pending 8 until first tracker/alerts read, then 7). DECISION: approve as-is. Demo order hides it; documented in DEMO_SCRIPT. Future P1 one-liner: call `runSweeps()` in analytics handler.
2. env network (not code) — low — `localhost` IPv6 `::1` hangs here, `127.0.0.1:3000` required. DECISION: approve as-is. Documented fallback + QR uses LAN IP. Verify on hall laptop.
3. Prior-cycle notes carried (non-blocking): `start.ps1:16-17` Node-enforcement warn-only; `start.ps1:5-6` vs `server.js:7` custom-PORT; `README.md` tree omits `start.ps1`; `app.js:185` static renewals line (footnoted); security notes (LAN bind, self-XSS filename/inspection fields, PATCH whitelist, `npm audit` before judging day). All ACCEPT — none critical for shortlist.

No fix cycle triggered (0/3 used). No re-verify loop required.

## Mentoring Notes

- Why grandfathering matters: juniors, the `gated` marker + "never overlay legacy rows" pattern is how you ship a rule change without rewriting history. Reset demos stay green, old probes unaffected, new filings get the new rule. Copy this Expand-Contract shape for any phased rollout.
- Why SLA ≠ validity: spec shorthand said "SLA + issued date" for renewals, but SLA (processing days) and validity (years) are different domains. The dev correctly implemented the validity table per K16/K46 and DOCUMENTED the judgment call. Lesson: when spec and domain conflict, implement the domain, document the deviation with refs. That is senior behavior.
- Why append-only audit with `{ts, actor, action, id}` minimal schema: repudiation killing starts with "never edit in place". Reset restoring `[]` is the only exception, and it is explicit. Same shape scales to a Postgres audit table later.
- Why atomic write via same-dir tmp + rename: `rename` on the same volume is atomic; tmp in another dir/volume is not. The `<pid>.<ts>.<seq>.<rand>` uniqueness prevents parallel-writer collision. Remember: atomic replace ≠ logical serializability — single-server topology statement is the honest boundary.
- Why LIVE vs SEED badging is a feature, not decor: every number a judge can challenge carries its provenance. That turns "prove 68→31" from a trap into a 10-second pointer (seed baseline + live counters + basis string). Honesty labels are load-bearing demo armor.
- Next growth: when you wire `GET /api/renewals` into `app.js:185`, keep the `*Seed projection` footnote until pilot data lands; when analytics sweeps, assert `pending` consistency in QA (tracker-first vs analytics-first order test).

## Chain Handoff

- QA PASS (verifiable) → Dev-Lead APPROVED → ready for `security` re-audit (new 969-line surface) per chain. Deploy NOT requested — do NOT dispatch devops.
- Report path: `D:\SIH\udyog-sarthi\.ai\reports\code-review-final.md` (this file). Prior `code-review.md` (launcher scope) intentionally untouched.
- Sprint DB: not updated (no task_id; consistent with all prior reports).
- User's 20-min path to SHORTLIST-READY: Team ID Ctrl+H (11×) + College fill (1×) + team-name confirm + names/female-check in portal + theme/category match + Save-As-PDF verify (<5 MB, 6 slides, no XXX/___) + USB+phone backup + one hall click-through (Reset → wizard-file → tracker Deemed → officer query → MR toggle → reload persists → Reset).
