# QA Report — Submission Readiness (EXCLUDING PPT/PDF)
Verdict: FAIL (1 high must-fix: footer Reset button 401; all other gates PASS)
Date: 2026-09-27 · Tester: QA Engineer · Mode: verify-only, no app code changed · Skill: verification-before-completion (evidence before claims)
Project: D:\SIH\udyog-sarthi · Node v24.11.1 / npm 11.7.0 · Engines: node >=18 (satisfied)
Scope: PPT/PDF entirely EXCLUDED per request — no .pptx/.pdf/.ai/reports/ppt* checked.

## 1. Required Files — Present/Missing (fresh Test-Path)
| File | Present | Evidence |
|---|---|---|
| server.js | True | 1583 lines, 89169 B, `node --check` OK |
| public/app.js | True | 974 lines, 85144 B, `node --check` OK |
| public/index.html | True | 32 lines, 1665 B, SPA shell `<script src="app.js">` OK |
| public/styles.css | True | 136 lines, 11954 B |
| public/i18n.json | True | valid JSON, top keys `_note,en,mr`, en=134 mr=134, match=true |
| data/seed.js | True | 247 lines, `node --check` OK, approvals=12 schemes=6 knowledge=60 history=38 apps=3 insp=2 grv=2 |
| package.json | True | 1035 B, scripts start/dev/test/lint, 1 dep express ^4.19.2 only |
| README.md | True | 116 lines, 11457 B |
| DEMO_SCRIPT.md | True | 53 lines, 7689 B |
| SUBMIT_CHECKLIST.txt | True | 24 lines, 2126 B |
| start.ps1 | True | 59 lines, 2335 B (checks Node/npm, npm install if missing, opens http://localhost:3000, npm start) |
| .gitignore | True | 6 lines: node_modules/, data/db.json, *.bak, .ai/archive/, ppt-slides/, *.tmp |

All 12 required files PRESENT. Zero missing.

## 2. Fresh Runs — Commands + Exit Codes + Outputs (verbatim)
| Claim | Command (fresh, full) | Exit | Output |
|---|---|---|---|
| Tests pass | `npm test` | 0 | `> node --check server.js && node --check data/seed.js && node --check public/app.js && node -e "JSON.parse(...i18n.json...)"` + `i18n OK`. 3× syntax OK, 1× JSON OK, 0 failures |
| Lint clean | `npm run lint` | 0 | `lint OK: no TODO/XXX` across server.js, data/seed.js, public/app.js, public/index.html, public/i18n.json. 0 placeholders |
| Boot | `Start-Process node server.js -PassThru` + sleep 4s | 0 | `PID:35656`, `Udyog Sarthi (SIH-26130) running at http://localhost:3000`, job State Running |
| Health | `Invoke-RestMethod GET http://127.0.0.1:3000/api/health` | 0 | `{"ok":true,"app":"Udyog Sarthi","sih":"26130"}` EXIT_HEALTH:0 |
| Meta | `GET /api/meta` | 0 | META_OK, depts MIDC/MPCB/LABOUR/FIRE/MSEDCL/DOI (6 depts), approvals list present |
| Login applicant | `POST /api/login {udyog@demo.in/demo123}` | 0 | `{"role":"APPLICANT","token":"d0b3252d...64hex","email":"udyog@demo.in","expiresAt":"+12h","userId":"U-003","name":"Demo Entrepreneur"}` tokenLen=64 role=APPLICANT |
| Login officer | `POST /api/login {officer@maharashtra.gov.in/officer123}` | 0 | `{"role":"OFFICER","token":"80c6fc2e...64hex","userId":"U-002","name":"Demo Officer (MPCB)"}` tokenLen=64 |
| Login admin | `POST /api/login {admin@maharashtra.gov.in/admin123}` | 0 | `{"role":"ADMIN","token":"afc3aa8d...64hex","userId":"U-001"}` tokenLen=64 |
| Knowledge eval | `GET /api/knowledge/eval` | 0 | `method: TF-IDF cosine (no embeddings, no LLM), corpusSize=60, n=8, correct=6, accuracy=0.75`, misses K03→K40 + K22→K23 (near-synonyms, ungamed). Matches README P@1 0.75 |
| Knowledge search | `GET /api/knowledge/search?q=deemed approval SLA breach&limit=3` | 0 | query echoed, meta method TF-IDF, corpusSize 60, ranked true, eval n=8 acc 0.75, top K40 (same miss as eval — consistent) |
| Analytics (dirty) | `GET /api/analytics` before reset | 0 | avgOld=60 avgNew=21, historyCount=39 seedHistoryCount=38 liveHistoryCount=1, live.applications=3 — 1 live row from auto-deemed sweep (expected; see Bugs) |
| Analytics (clean) | `POST /api/reset?demo=1` then `GET /api/analytics` | 0 | `{ok:true}` RESET_DEMO1_OK; then historyCount=38 seed=38 live=0 avgOld=60 avgNew=21 apps=3 — pristine seed restored |
| Checklist validation | `POST /api/checklist {}` | 400 (expected) | CHECKLIST_EMPTY_STATUS:400 — input validation working (was null bug fixed) |
| Static index | `Invoke-WebRequest GET http://127.0.0.1:3000/` | 200 | INDEX_STATUS:200 LEN:1665 HAS_APPJS:True |
| Reset bare (frontend path) | `POST /api/reset` no query, no token | 401 (bug) | `{"error":"Authentication required. Use POST /api/reset?demo=1 for the public demo reset, or an ADMIN Bearer token."}` — frontend resetDemo() uses this exact path |
| Stop | `Stop-Process -Id $p -Force` | 0 | STOPPED_PID confirmed, DONE |

Seed counts (fresh `node -e require seed`): approvals=12 schemes=6 knowledge=60 history=38 apps=3 insp=2 grv=2 — matches README §Seeded data.
i18n (fresh): en=134 mr=134 match=true, zero blanks.
node_modules/express: True. data/db.json: True, 54813 B, db apps=3 history=39 knowledge=60 sessions=3 (pre-reset dirty; post-reset 38/38/0 per analytics).

## 3. Remaining Present/Missing + Git Status
| Item | Status | Notes |
|---|---|---|
| README.md | PRESENT (116 lines) | Run/login/API/files complete; §i18n says 64 keys but measured 134 (drift, low) |
| DEMO_SCRIPT.md | PRESENT (53 lines) | 60-sec + 2-min + break-fix table + banned-words list |
| LICENSE | MISSING (False) | Not required for SIH IDEA portal upload; add MIT/proprietary before public/GitHub release |
| .env.example | MISSING (False) | Not needed — no dotenv, PORT defaults 3000, no secrets |
| .env | MISSING (False) | Expected — none required |
| git status | NOT A REPO (`fatal: not a git repository`, EXIT 128) | No history/diff/rollback; SIH portal takes zip so not a blocker, but `git init + commit` recommended |
| node_modules | PRESENT (express OK) | Offline judging unaffected; do not `npm update` on stage |

## Bugs Found (severity, file:line)
- **HIGH — footer Reset button 401** (`public/app.js:165-166` calls `POST /api/reset` bare; `server.js:1528-1541` requires `?demo=1` or ADMIN token). Evidence: `RESET_BARE_STATUS:401` with exact frontend path vs `RESET_DEMO1_OK {ok:true}`. Impact: judge clicks footer Reset → 401, db stays dirty (history 39), breach/escalation replay breaks. Must-fix (excluding PPT): change line 166 to `await api("POST","/api/reset?demo=1")`. Verify-only — NOT fixed.
- **LOW/doc — README i18n count drift** (`README.md:45` says "64 keys EN+MR"; measured `public/i18n.json` en=134 mr=134). Update to 134 to avoid Q&A mismatch.
- **LOW — LICENSE missing** (`D:\SIH\udyog-sarthi\LICENSE` absent). SIH upload does not need it; add before public release.
- **INFO — db.json dirty pre-reset** (`data/db.json` history 39 vs seed 38). By-design: backdated FIRE-PROV auto-deems on first read + appends 1 live row (liveHistoryCount=1, avgNewLive=25). `POST /api/reset?demo=1` restores 38/38/0 clean. Always reset before judging. File is gitignored by design.
- **INFO — not a git repo** (EXIT 128). Process risk only.

## Regression Risks
- `npm test` is syntax-only (3× node --check + JSON parse) — SLA sweeps, TF-IDF ranking, 401/403/429, 422 validator, gate unlocks NOT covered. Re-run boot+health+login+eval+analytics probe after any server.js edit + `POST /api/reset?demo=1` restore.
- Single-file `data/db.json` (gitignored) mutates on every write; QA logins/sweeps dirtied it (39). Reset before judging to restore apps=3 history=38 corpus=60 + backdated FIRE-PROV/GRV-881 triggers.
- `express ^4.19.2` caret + no audit pin; node_modules present and working on v24.11.1. Do not update on stage.
- Frontend reset path is the only known broken write path; all other reads/writes verified (checklist 400, search, eval, analytics, logins, static).

## Must-Fix Excluding PPT (ordered)
1. `public/app.js:166` → use `/api/reset?demo=1` (1-line, re-verify: bare 401 → demo1 {ok:true} → analytics 38/38/0 → footer click works logged-out).
2. `README.md:45` → "134 keys EN+MR" (doc-only).
3. Before portal/zip: `POST /api/reset?demo=1` → verify `apps=3 history=38 corpus=60` + breach/escalation fire on next read; do not ship dirty db.json (gitignored, but zip may include it).
4. Optional: `git init + commit`, add LICENSE if publishing beyond SIH portal.

---
Commands run fresh this session (all exit codes captured above): `npm test` (0), `npm run lint` (0), `node server.js` boot + `GET /api/health` (0), `GET /api/meta` (0), `POST /api/login` ×3 (0), `GET /api/knowledge/eval` (0), `GET /api/analytics` (0), `GET /api/knowledge/search` (0), `POST /api/checklist {}` (400 expected), `GET /` (200), `POST /api/reset` (401 bug) vs `POST /api/reset?demo=1` ({ok:true}).
Counts: seed 12/6/60/38/3/2/2; i18n 134/134; analytics clean 38/38/0 avgOld 60 avgNew 21 apps 3; eval 6/8=0.75 corpus 60; tokens 64-hex ×3.
