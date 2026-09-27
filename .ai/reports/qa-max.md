# QA Report — Full Max Build (PPT/PDF excluded)
Verdict: PASS
Date: 2026-09-27 · Tester: QA Engineer · Mode: verify-only, no app code touched · Skill: verification-before-completion (evidence before claims)
Project: D:\SIH\udyog-sarthi · Node v24.11.1 · PPT/PDF excluded per scope, untouched on disk

## Tests Run
Fresh full commands with exit codes (no claims without output):

| # | Claim | Command (fresh, full) | Exit | Evidence (verbatim counts) |
|---|---|---|---|---|
| 1 | Tests pass | `npm test` | 0 | `node --check server.js && node --check data/seed.js && node --check public/app.js && JSON.parse(public/i18n.json)` + `i18n OK`. 3x syntax OK, 1x JSON OK, 0 failures |
| 2 | Lint clean | `npm run lint` | 0 | `lint OK: no TODO/XXX` across server.js, data/seed.js, public/app.js, public/index.html, public/i18n.json. 0 placeholders |
| 3 | Boot + health | `Start-Process node server.js (PID 1712)` + `GET /api/health` | 0 | `{"ok":true,"app":"Udyog Sarthi","sih":"26130"}` status 200 |
| 4 | Reset demo | `POST /api/reset?demo=1` | 200 | `{"ok":true}` |
| 5 | Analytics frozen | `GET /api/analytics` | 200 | `historyCount=38 seedHistoryCount=38 liveHistoryCount=0 avgOld=60 avgNew=21 avgNewLive=null` + `basis=SEED frozen baseline 38 rows (never moves) + 0 live measured` — matches required 38/38/0 |
| 6 | Knowledge eval | `GET /api/knowledge/eval` | 200 | `n=32 correct=19 accuracy=0.594 corpusSize=60 details=32 details-bad=0` — n>=30 OK, details[] all q/expect/got/hit present |
| 7 | Search MR | `GET /api/knowledge/search?lang=mr` (no q) | 200 | `meta.translated=20 corpusSize=60 results=5 lang=mr` — matches required translated=20 |
| 8 | Search MR ranked | `GET /api/knowledge/search?q=fire%20NOC&limit=5&lang=mr` | 200 | `translated=20 results=5 langs=[K22:mr/fallback, K23:mr/fallback, K36:mr/fallback, K38:mr/fallback, K04:mr/real]` — ranking EN TF-IDF, display localized, fallback badged by design |
| 9 | i18n parity | `public/i18n.json` counts + blanks | 0 | `enCount=160 mrCount=160 blanks=0 missing_in_mr=0` — meets en/mr counts blanks 0 |
| 10 | Bare reset guard | `POST /api/reset` (no query, no token) | 401 | `{"error":"Authentication required. Use POST /api/reset?demo=1 ..."}` — required 401 OK |
| 11 | Checklist guard | `POST /api/checklist {}` | 400 | `{"error":"Invalid checklist profile","details":["sector must be one of...","size must be one of...","stage must be one of..."]}` — required 400 OK |
| 12 | Gate guard | `POST /api/applications {Manufacturing,Medium,Operate} as applicant` then `PATCH /:id/track {MPCB-CTO,approve} as officer` | 200 then 400 | `FILE-OPERATE id=APP-2026-0159 tracks=LABOUR-FACT:Applied,MIDC-WATER:Applied,MPCB-CTO:Locked,FIRE-FINAL:Locked lockedCount=2` then `GATE-APPROVE-LOCKED status=400 {"error":"Track is Locked — clear Group A–C first. Locked: Group-D (pre-production) requires Group A–C clearance first — 2 pending: Factory Licence; Industrial Water Connection"}` — required gate-400 OK |
| 13 | Sniff guard | `POST /api/applications/:id/documents/upload multipart fake.pdf (41 text bytes, claimed application/pdf)` | 422 | `MIME sniffed as application/octet-stream, SHA-256 ad8106d082c4…` + `{"error":"File bytes not recognised as PDF/JPG/PNG (MIME sniff failed)..."}` — required sniff-422 OK |
| 14 | Hard-tech suite | `node test/hardtech.js` (server 127.0.0.1:3000) | 0 | `PASS: 1 reset-demo1 200` + `PASS: 2 bare-reset 401` + `PASS: 3 checklist {} 400` + `PASS: 4a officer login 200 token` + `PASS: 4b Bearer GET applications 200 non-empty` + `PASS: 4c found approvable track` + `PASS: 4d officer-approve 200 APP-2026-0142/MPCB-CTE` + `PASS: 5 eval parsed 200` + `PASS: 5b eval n>=30 (n=32 correct=19 acc=0.594)` + `PASS: 5c eval details[] present` + `ALL 5 HARD-TECH PROBES PASS n=32 acc=0.594` |
| 15 | DB clean after | `POST /api/reset?demo=1` restore + file check | 200 | After hard-tech mutations, restored `historyCount=38 seedHistoryCount=38 liveHistoryCount=0` + `data/db.json apps=3 history=38 knowledge=60`. Server PID 1712 stopped clean. PPT timestamps untouched (pptx 2026-09-09 11:52:50, pdf 2026-09-09 11:53:35) |

PPT/PDF scope: `Udyog-Sarthi-AI-SIH26130-IDEA-PPT.pptx (707,664 B)` + `.pdf (477,804 B)` present, NOT opened, NOT modified, excluded from all checks per instruction.

## Bugs Found (severity: critical/high/medium/low, file:line)
- None critical/high/medium in verified paths. All required status codes met fresh this session.
- Low/info — Eval accuracy 0.594 (19/32) is honest TF-IDF, not a regression: `server.js:832` KNOW_EVAL n=32 hand-labelled overfit illustrative, misses include K40-vs-K03 near-synonym (deemed approval) + Marathi-fail queries by design. Prior n=8 acc 0.75 grew to n=32 adversarial; published with `tookMs` + per-query hit. No fix, do not tune to overfit.
- Low/info — Search MR fallback rate: `server.js:880` top-20 `a_mr` only, rest fallback=true badged. Ranked query `fire NOC` returned 4/5 fallback — by design (ranking stays English TF-IDF). No fix.
- Low/doc — `public/i18n.json` now 160/160 keys (was 134 in prior qa-report). No blanks, no missing. If README claims 64/134, update doc count only. No code change made.

## Regression Risks
- `npm test` is syntax+JSON gate only (no unit assertions). Logic (SLA sweeps, TF-IDF, auth 401/403/429, 422 validator, gate unlocks) covered only by live probes above + `test/hardtech.js` (5 probes). Re-run boot+health+reset+analytics+eval+search+gate+sniff+hardtech after any `server.js`/`seed.js` edit, then `POST /api/reset?demo=1` to restore 38/38/0 before demo.
- `data/db.json` (gitignored) mutates on every write; probes filed APP-2026-0159 + hard-tech approved APP-2026-0142. Restored to `apps=3 history=38 knowledge=60 live=0` at end of this run. Always reset before judging.
- Single Express dep `express ^4.19.2`; `node_modules/` present. Do not `npm update` on stage. No build step (vanilla JS) — `npm start` is the boot path.
- Auth: 12h expiring Bearer tokens, fixed demo tokens rejected, login 5-fail/15min 429, register 5/hr 429. Probes used fresh logins (applicant + officer) — no hardcoded tokens stored.

---
## Re-verify 2026-09-27 — doc-drift fix (PPT excluded)
Verdict: PASS · Mode: verify-only, no app code touched · Skill: verification-before-completion
Node v24.11.1 · PPT/PDF excluded, untouched on disk (pptx 707664B 2026-09-09 11:52:50, pdf 477804B 2026-09-09 11:53:35)

| # | Claim | Command (fresh, full) | Exit | Evidence (verbatim) |
|---|---|---|---|---|
| R1 | npm test | `npm test` | 0 | `i18n OK` (3x node --check + JSON parse) `TEST_EXIT:0` |
| R2 | lint | `npm run lint` | 0 | `lint OK: no TODO/XXX` `LINT_EXIT:0` |
| R3 | boot+health | `Start-Process node server.js PID 19828` + `GET /api/health` | 200 | `{"ok":true,"app":"Udyog Sarthi","sih":"26130"}` |
| R4 | reset demo | `POST /api/reset?demo=1` | 200 | `{"ok":true}` |
| R5 | analytics frozen | `GET /api/analytics` | 200 | `historyCount=38 seedHistoryCount=38 liveHistoryCount=0 avgOld=60 avgNew=21 avgNewLive=null` + `basis=SEED frozen baseline 38 rows (never moves) + 0 live measured` — required 38/38/0 |
| R6 | eval | `GET /api/knowledge/eval` | 200 | `n=32 correct=19 accuracy=0.594 corpusSize=60` — required n=32 acc 0.594 |
| R7 | i18n parity | `node -e counts public/i18n.json` | 0 | `enCount=160 mrCount=160 blanks=0` — required 160/160 blanks 0 |
| R8 | hard-tech | `node test/hardtech.js` (PID 42928) | 0 | `PASS: 1 reset-demo1 200` + `PASS: 2 bare-reset 401` + `PASS: 3 checklist {} 400` + `PASS: 4a officer login 200 token` + `PASS: 4b Bearer GET applications 200 non-empty` + `PASS: 4c found approvable track` + `PASS: 4d officer-approve 200 APP-2026-0142/MPCB-CTE` + `PASS: 5 eval parsed 200` + `PASS: 5b eval n>=30 (n=32 correct=19 acc=0.594)` + `PASS: 5c eval details[] present` + `ALL 5 HARD-TECH PROBES PASS n=32 acc=0.594` `HARDTECH_EXIT:0` |
| R9 | grep stale 134 | `Select-String -Pattern \b134\b README/DEMO/SUBMIT/docs/public/server/seed` | 0 | zero hits |
| R10 | grep stale 0.75 | `Select-String -Pattern 0\.75 README/DEMO/SUBMIT/docs/server/seed/app` | 0 | zero hits |
| R11 | file:lines fresh | `Select-String server.js` | 0 | `validateDocumentInput:534` + `sweepDeemed:704 sweepGrievances:745 runSweeps:770 tfidfSearch:797 knowCorpus:785 KNOW_EVAL:832 evalKnowledge:866 localizeKnowledge:880 search:1092 eval-endpoint:1116 analytics:1546` — all match README/DEMO ranges (`server.js:76-77` retired tokens line 141, `:534` validator, `:770` sweeps, `:797` TF-IDF, `:1092-1120` search/eval, `:1546` analytics verified 2026-09-27 via grep) |
| R12 | restore clean | `POST /api/reset?demo=1` + `node -e db counts` | 200 | `RESTORED history=38 seed=38 live=0` + `apps=3 history=38 knowledge=60` servers PID 19828/42928 stopped |

Bugs: none critical/high/medium. Doc-drift fixed — README now shows 160 keys (line 45,106), 60-article corpus, `avg 60→21` over 38 rows, no stale 134/0.75. Eval 0.594 + MR fallback remain by-design (see prior rows).
