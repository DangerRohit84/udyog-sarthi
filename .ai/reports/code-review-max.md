# Code Review — Max Build (PPT excluded)

Verdict: CHANGES_REQUESTED (doc-only, no code change, PPT untouched)

Date: 2026-09-27 · Reviewer: Development Lead · Scope: max build freeze gate, PPT/PDF excluded
Inputs read FIRST (per workflow):
1. `.ai/reports/qa-max.md` — Verdict PASS (15 probes, fresh exit codes, 38/38/0 + n=32 acc 0.594)
2. `.ai/reports/qa-report.md` — Verdict PASS (mirror, 160/160 i18n, 38/38/0)
3. `docs/adr/001-demo-vs-prod.md` + `docs/adr/002-why-no-llm.md`
4. `docs/pilot-intent.md` (Sinnar intent, *Seed projection rule)
5. `README.md` (117 lines) + `DEMO_SCRIPT.md` (54 lines) diff
6. `package.json` (1 dep) + `server.js` (1641 lines, spot-read: 21, 240-306, 534, 704-777, 785-889, 1092-1120, 1546-1603) + `public/app.js` (1034 lines, knowledge/analytics/tracker) + `public/i18n.json` (en=160 mr=160 blanks 0) + `data/seed.js` + `SUBMIT_CHECKLIST.txt` + `test/hardtech.js`
Constraint respected: review-only, zero app-code edits, zero PPT/PDF touches (per Hard Boundaries + task).

## Summary

Code is freeze-ready. Docs are not. QA-max proves the live system is honest and demo-safe: `npm test` 0, `lint` 0, boot+health 200, `reset?demo=1` 200, analytics `38/38/0 avgOld 60 avgNew 21 avgNewLive null`, eval `n=32 correct=19 acc 0.594 corpus 60 details 32 bad 0`, search MR `translated=20`, i18n `160/160 blanks 0`, guards `401/400/400/422` all correct, `hardtech.js` ALL 5 PASS, DB restored clean, PPT timestamps untouched. Architecture intact, offline 1-dep kept, SEED-frozen/LIVE-split intact, no LLM/Mongo/OCR claimed in code, eval ungamed with misses published.

Freeze is blocked only by doc drift that a judge can disprove in 60 seconds: README/DEMO still say `134 keys` (file is `160/160`), ADRs + pilot-intent + SUBMIT still say `n=8 P@1 0.75` (live is `n=32 acc 0.594`), README/DEMO file:line pointers (`354-430`, `437-497`, `524-597`, `599-667`) land in dead code (actual `534`, `770`, `797`, `1092-1120`), and UI heading `4 adversarial fails` understates 13 live misses. All fixes are doc-only, ~15 min, no code, no PPT.

## Quality Gates (Merge Criteria)

- [x] All tests passing — qa-max 15/15 PASS + hardtech 5/5 + npm test/lint 0 (evidence in qa-max.md)
- [x] Code reviewed by 1+ team member — this review (dev-lead)
- [x] No critical/high security findings in this scope — auth 401/403/429 + 422 sniff + gate-400 all hold live; no secrets added (demo creds by-design, see security-audit)
- [ ] Documentation updated — FAIL: 3 doc drifts below (134→160, 0.75→0.594, stale file:lines). Must-fix before freeze.
- [x] Branch up-to-date with main — N/A (single-laptop prototype, no conflicts)
- [x] Meaningful commit messages — N/A to reviewer; suggest `docs(freeze): sync i18n 160/160 + eval n=32 0.594 + file:line (SIH-26130)`
- [x] Sprint task updated to done — N/A (no task_id provided for max review)
- [x] PPT excluded — verified untouched (pptx 707664B 09-09 + pdf 477804B 09-09 per qa-max #15)

## Architecture Adherence — PASS (intact)

- Single-dep offline kept: `package.json:12-14` `express ^4.19.2` only. Verified `en=160 mr=160 blanks 0`, `has-mongo=false has-llm=false`, `has-react=false`. No build step, `npm start → :3000`, `data/db.json` single-writer. Do NOT `npm update` on stage.
- Atomic persistence intact: `server.js:240 writeDbAtomic` (tmp `${pid}.${Date.now()}.seq.rand.tmp` + `renameSync` + unlink-cleanup) via `saveDb:306`. `loadDb:250` seed-restore + in-memory migrations (audit/history/sessions/vault/users/applicantProfiles/officerProfiles + `a_mr` U4 backfill) with no write-on-read. Single-writer comment preserved.
- Deterministic engine intact: `sweepDeemed:704` + `sweepGrievances:745` + `runSweeps:770` (deemed + escalated + `unlockGatedTracks`), 60-sec + on-read sweeps, post-response `saveDb` (`1148-1163` pattern). Gate `Group-D Locked → 400` live-proven (APP-2026-0159, 2 locked). Validator `validateDocumentInput:534` (ext/size ≤10MB/expiry/holder, ignores client `passed`) + MIME sniff + SHA-256 live-proven 422. Terminal immutability + append-only audit kept.
- SEED-frozen/LIVE-split intact: `server.js:1546-1582` filters `old (!live)` + `seedNew (!live)` for `avgOld/avgNew/byDept`, reports `liveHistoryCount/avgNewLive/basis` separately. `basis` string quotes frozen 38 + live moves. QA `38/38/0` + `avgNewLive null` correct. `public/app.js:925-954` analytics badges `🌱 SEED frozen + 🔴 LIVE moves` + `*Seed projection` footnote correct.
- Retrieval intact: `knowCorpus:785` (db + seed top-up to 60) + `tfidfSearch:797` (lowercase ktok + stopword strip incl. Hindi particles, `tf/dl*idf` cosine + `0.02*tagHit`, `tookMs`) + `evalKnowledge:866` + `localizeKnowledge:880` (top-20 `a_mr`, rest `fallback:true` badged). Ranking stays English TF-IDF by design; MR fallback badged in UI (`app.js:1010-1012`). Correct.

## Honesty — CODE PASS, DOCS CHANGES_REQUESTED

Live honesty (PASS, verified in qa-max + spot-read):
- `KNOW_EVAL:832-864` is 32 rows (8 original verbatim + 24 adversarial Hinglish/typo/single-keyword/Marathi-fail/near-synonym). Comment `829-831` labels `n>=30 hand-labelled overfit illustrative TF-IDF cosine no embeddings no LLM`. `evalKnowledge:866-873` returns `{n, correct, accuracy, details[], tookMs, note}` with per-query `q/expect/got/hit`. QA `n=32 correct=19 acc 0.594 details 32 bad 0` — ungamed, misses include K40-vs-K03 + Marathi-fail by design. UI `app.js:1018-1032` renders live `n/correct/accuracy/tookMs/note` + full details table dynamically (not hardcoded 0.75) + top-4 misses slice. `app.js:1007-1008` search meta shows live `eval.correct/n/accuracy + tookMs + translated/20`. No tuning, no overfit fix per qa-max low/info — concur.
- `*Seed projection` kept in code + UI: `app.js:290-321` landing `🌱 SEED 60→21d*` + `🔴 LIVE filed` + footer `🌱 SEED illustrative · 🔴 LIVE moves`; `app.js:605` tracker `SEED frozen + LIVE moves`; `app.js:674/938/954` `41%→12%*` + `*Seed projection — 38-row frozen baseline`; `server.js:1549-1568` `SEED headlines NEVER move` comment + `basis`. Pilot-intent `*Seed projection` rule quoted correctly.
- No LLM/Mongo/OCR/DigiLocker/SMS/measured claims in code: `has-mongo=false has-llm=false`, `method` strings all `TF-IDF cosine (no embeddings, no LLM)`, `app.js:987-989` `Real retrieval (TF-IDF cosine) — no LLM, no embeddings` + `Confirm with GR/portal`. `AI: TF-IDF ranker` badge (app.js:987) is honest (ranker, not model). Banned-words only in banned-lists + roadmaps.

Doc honesty (CHANGES_REQUESTED — must-fix before freeze, doc-only):
- See High #1-3 + Medium #4-5 below. Code tells `0.594 / 160 / 534+770+797`, docs still tell `0.75 / 134 / 354-430`. Judge follows file+line and sees mismatch = auto-ding even though code is honest.

## Demo-Safe — PASS

- QA-max #3-5 + #15: boot PID 1712 + health 200 + reset 200 + analytics 38/38/0 + restored `apps=3 history=38 knowledge=60 live=0` + server stopped clean. `DEMO_SCRIPT.md` reset-first + reset/read order (breach + GRV-881 fire on read) + IPv6 fallback (`127.0.0.1:3000`) + port-busy + dirty-db + breach-not-visible + MR + forgery/OCR + projector/USB break-table all present. `Never say` list (`AI model · LLM/RAG running · OCR working · Mongo · measured 60→21/68→31 · DigiLocker live · SMS/push · parallel engine · auto legal advice`) matches README banned-list. PPT excluded per scope, timestamps untouched.

## README / DEMO Diff (judge-visible)

| Item | README.md | DEMO_SCRIPT.md | Live file (truth) | Match? |
|---|---|---|---|---|
| i18n keys | `134 keys EN+MR` (:45, :106) | `134 keys EN+MR` (:47) | `public/i18n.json` 160/160 blanks 0 (qa-max #9) | NO — both stale, fix to 160 |
| Eval | `n>=30 hand-labelled` (:40, :90) + misses K40-vs-K03 named | `P@1 n>=30 hand-labelled · no LLM` + `details[] + 4 adversarial fails box` (:22, :34) | `n=32 correct=19 acc 0.594 details 32` (qa-max #6/#14) | YES on n>=30, NO on fails count (live misses 13, UI slices 4) |
| Headlines | `60→21* *Seed projection` (:50) + `41%→12%*` (:51) + LIVE/SEED split (:52) | `🌱 SEED 60→21d* frozen vs 🔴 LIVE moved` (:22, :34) + `*Seed projection, pilot to measure` | `analytics 60/21 frozen + live 0` + `basis` string | YES |
| No-LLM | `No LLM, no Mongo, no OCR` (:7) + `no LLM` (:40) + banned-list (:53) | `no LLM` (:20) + banned-list (:18, :53) | No LLM deps, TF-IDF only | YES |
| File:line | `validator 354-430, sniff 437-497, sweeps 524-597, TF-IDF 599-667, endpoints 717-741` (:53) | `validator 354-430 + sniff/multipart/hash 437-497` (:48) | `validator 534, sweeps 770, TF-IDF 797, eval 866, search 1092-1115, analytics 1546` | NO — both stale |
| Reset | `POST /api/reset?demo=1 → apps=3 history=38 corpus=60` (:70) | `Reset → apps=3 history=38 corpus=60 + FIRE-PROV 24d + GRV-881 8d` (:11) | QA restores exactly that | YES |
| Pilot | `Sinnar × 3 × 20 × 4w owner letter pending` (:50) | `Pilot: Sinnar × 3 × 20 × 4w to measure` (:34) | `pilot-intent.md` same | YES |

## Issues (file:line, severity)

### High — must-fix before freeze (doc-only, ~10 min, no code, no PPT)
1. `README.md:45 + :106 + DEMO_SCRIPT.md:47` — i18n count drift: docs claim `134 keys`, live file is `160/160 blanks 0` (qa-max #9 re-proven this run via `node -e` counts). Judge opening `i18n.json` sees 160 and hears 134 = looks gamed even though growth is honest work. Fix: replace all three lines with `160 keys EN+MR, zero blanks (verified 2026-09-27)` — no code change. (Rule-of-Three / honesty-first.)
2. `docs/adr/001-demo-vs-prod.md:59` + `docs/adr/002-why-no-llm.md:26-34,65,80-84` + `docs/pilot-intent.md:43` + `SUBMIT_CHECKLIST.txt:20-21` — eval drift: docs claim `n=8 P@1 6/8=0.75`, live API is `n=32 correct=19 acc 0.594` (code `KNOW_EVAL:832-864` = 8 + 24 adversarial, note `n>=30 hand-labelled overfit illustrative`). ADR001 even has a `verified current` column but still lists `n=8` as current. Pilot-intent `P@1 6/8=0.75* baseline` and SUBMIT `P@1 0.75` will be quoted on stage and disproved by `GET /api/knowledge/eval`. Fix: update all four docs to `n=32 correct=19 acc 0.594 ungamed (8 kept + 24 adversarial, misses published, overfit illustrative, no embeddings no LLM)` + keep `tookMs + details[]` shield language. Doc-only.
3. `README.md:53` + `DEMO_SCRIPT.md:48` — stale file:line pointers: README `354-430 / 437-497 / 524-597 / 599-667 / 717-741` and DEMO `354-430 / 437-497` land in dead code. Verified current: `validateDocumentInput server.js:534`, `runSweeps:770 (sweepDeemed:704 + sweepGrievances:745)`, `tfidfSearch:797 (corpus:785 eval:866 localize:880)`, `search/eval endpoints:1092-1120`, `analytics SEED/LIVE:1546-1582`, `writeDbAtomic:240 loadDb:250`. ADR001 already admits `historic range is stale` — README/DEMO must do the same. Fix: replace pointers with verified-current list above or cite `ADR001 table` instead of raw ranges. Doc-only, 3-min.

### Medium — fix before freeze if 5 min remain (doc/UI-text, no logic change)
4. `public/app.js:992 + :992-993 static examples` — `4 adversarial fails` heading understates live 13 misses (`32-19`). Code does show all 13 in the eval table above (`:1023-1025`) and slices top-4 for the amber box (`:1028 slice(0,4)`), so nothing is hidden — but heading + static `These 4 fail by design` reads as `only 4 fail` while table shows 13 ❌. Judge will ask. Fix (text-only, no logic): retitle to `Top 4 misses live (of N — full table above, honest)` + change `These 4 fail` to `These illustrate TF-IDF limits — full miss list above`. Do NOT retune eval to reduce misses.
5. `public/app.js:605` — hardcoded `38 seed +1 live=39 total` prefix in `seedLiveLine` while suffix is dynamic (`SEED ${seed} + LIVE ${live} = ${total}`). After fresh reset (`live=0 total=38`) the prefix still says `+1 live=39`. Dynamic suffix saves honesty, but prefix looks canned. Fix (text-only): drop hardcoded prefix, keep only dynamic `SEED ${seed} frozen + LIVE ${live} moves = ${total} total`. No logic change.
6. `server.js` line-count drift: `docs/adr/001:16,44` says `1611 lines`, file is `1641` (auth hardening growth). Low-medium but judge may `wc -l`. Fix: update ADR to `1641 lines (2026-09-27)` or drop exact count.

### Low / Nits (post-freeze, do not touch before stage)
7. `DEMO_SCRIPT.md:12` — curl check says `history=38 live.apps=3` while API returns `historyCount/seedHistoryCount/liveHistoryCount + live.applications`. QA proves mapping holds; wording is shorthand, not wrong. Leave.
8. `SUBMIT_CHECKLIST.txt:21` — `filename/size/expiry validation` shorthand is honest (server also checks holderName + MIME sniff + hash). No change needed before freeze.
9. `docs/adr/002:31` — `UI strings 134 keys` same drift as High #1; covered by that fix.
10. `qa-max.md:31-33` low/infos (eval 0.594 honest, MR fallback 4/5 by design, i18n 160 doc lag) — concur, no code action. Do NOT tune TF-IDF or expand `a_mr` before freeze (overfit/gaming risk).

## Mentoring Notes (why, not just what)

- Honesty is the demo: the `n=32 0.594` drop from `n=8 0.75` is growth, not regression — 24 adversarial probes (Hinglish/typo/single-keyword/Marathi-fail/near-synonym) were added and misses published with `tookMs + details[]`. Keep saying `overfit illustrative, corpus and queries co-authored` (server.js:829-831 + eval note). Never tune to raise 0.594 before freeze — gaming the eval kills the trust shield.
- Rule-of-Three for docs: counts (`160`, `n=32`) and file:lines (`534/770/797`) moved twice now (64→134→160, 8→32, 1611→1641). Add a 10-second CI check before freeze: `node -e` i18n counts + `KNOW_EVAL.length` + `grep -n function validateDocumentInput|tfidfSearch|runSweeps` and fail if docs drift. Cheaper than a judge catch.
- Strangler-fig discipline held: `loadDb/saveDb` seam + `better-sqlite3 → Postgres` roadmap without migrating before selection is correct. Same for capped-LLM cited-only (ADR002) — designed, not built. Say `interface ready, not implemented` on stage; point at ADR, not missing code.
- Demo order is load-bearing: `reset?demo=1 → read tracker/grievances (sweep fires) → file → officer → analytics LIVE → reset`. `db.json` mutates on every write (gitignored); always reset before judging. Never `npm update`, never add deps, never claim OCR/LLM/Mongo/SMS/DigiLocker/measured.
- For the next dev: when wiring `GET /api/renewals` into dashboard, keep `*Seed projection` footnote until pilot `n=` lands; when analytics sweep ships, add tracker-first vs analytics-first order test to QA.

## Freeze Gate

- Code: FREEZE-READY (no code changes requested).
- Docs: NOT READY — fix High #1-3 (doc-only, ~10 min), then Medium #4-5 if time. Re-run `npm test + lint + boot + reset + analytics + eval` after doc edits (docs only, but prove nothing broke), then `POST /api/reset?demo=1` to restore `38/38/0`.
- PPT/PDF: EXCLUDED, untouched — do not open, do not re-export.
- Forward to `security` after doc fixes (read this report + qa-max.md), then freeze. Deploy only on explicit user `deploy/release/ship` keyword per chain.
