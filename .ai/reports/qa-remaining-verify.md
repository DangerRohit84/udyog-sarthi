# QA Report — Re-verify fix (EXCLUDING PPT/PDF)
Verdict: PASS
Date: 2026-09-27 · Tester: QA Engineer · Mode: verify-only, no app code changed · Scope: PPT/PDF entirely EXCLUDED — no .pptx/.pdf checked, none touched
Prior: `.ai/reports/qa-remaining.md` Verdict FAIL (1 high: footer Reset 401 at `public/app.js:165-166` + low doc drift 64 vs 134)
Project: D:\SIH\udyog-sarthi · Node v24.11.1 / npm 11.7.0 · Engines node>=18

## Tests Run
### 1. `public/app.js` reset path — FIXED (grep)
- `Select-String public/app.js "/api/reset?demo=1"` → `FOUND demo1 line 166: await api("POST", "/api/reset?demo=1"); META = null;` → `COUNT_DEMO1=1`
- Bare scan (lines containing `/api/reset` but NOT `/api/reset?demo=1`) → `COUNT_BARE=0`
- Full-repo `/api/reset` grep now shows only: `public/app.js:166` (fixed), `server.js:1035` (help text), `server.js:1528,1533` (route + 401 guard) — zero bare callers in `public/`
- Result: HIGH bug fixed. Footer `resetDemo()` works logged-out.

### 2. README + DEMO_SCRIPT i18n counts — FIXED (grep)
- `Select-String README.md,DEMO_SCRIPT.md "134 keys"` → `COUNT_134=3`:
  - `README.md:45: - **EN/MR toggle — 134 keys EN+MR, persists.**`
  - `README.md:106: ├── public/i18n.json   # 134 keys × EN/MR (header + wizard + tracker + login/dashboard/docs/officer)`
  - `DEMO_SCRIPT.md:47: ... i18n.json is 134 keys EN+MR, zero blanks (verified).`
- `Select-String README.md,DEMO_SCRIPT.md "64 keys"` → `COUNT_64KEYS=0` → `ZERO 64-keys confirmed`
  - Note: residual `64-hex` hits in README:29,36 + DEMO:7 are session-token length (SHA256 64-hex), NOT i18n keys — correctly ignored.
- Live file check: `node -e require i18n.json` → `en=134 mr=134 match=true blanks=0`
- Seed check: `node -e require seed.js` → `approvals=12 schemes=6 knowledge=60 history=38 apps=3 insp=2 grv=2`
- Result: doc drift fixed.

### 3. Fresh runs — all exit 0 + live probes
| Claim | Command (fresh) | Exit/Status | Output (verbatim) |
|---|---|---|---|
| Tests pass | `npm test` | EXIT_TEST:0 | `> node --check server.js && node --check data/seed.js && node --check public/app.js && node -e JSON.parse i18n.json` + `i18n OK` |
| Lint clean | `npm run lint` | EXIT_LINT:0 | `lint OK: no TODO/XXX` |
| Boot | `Start-Process node server.js -PassThru` + sleep 4s | BOOT_PID:30152 | `HEALTH:{"ok":true,"app":"Udyog Sarthi","sih":"26130"}` `PID_STATE:30152` |
| Reset demo | `POST /api/reset?demo=1` | 200 | `RESET_DEMO1_STATUS:200 RESET_DEMO1_BODY:{"ok":true}` |
| Health | `GET /api/health` | 200 | `HEALTH_OK:{"ok":true,"app":"Udyog Sarthi","sih":"26130"}` |
| Knowledge eval | `GET /api/knowledge/eval` | 200 | `method:TF-IDF cosine (no embeddings, no LLM) corpusSize:60 n:8 correct:6 accuracy:0.75` misses K03→K40 + K22→K23 (near-synonyms, ungamed) |
| Analytics clean | `GET /api/analytics` after reset | 200 | `historyCount=38 seed=38 liveHist=0 avgOld=60 avgNew=21 live.applications=3 pendingTracks=8` + `basis:SEED frozen baseline 38 rows + 0 live` → clean **38/38/0** |
| Static index | `GET /` | 200 | `INDEX_STATUS:200 LEN:1646 HAS_APPJS:True` |
| Bare guard (server by-design) | `POST /api/reset` no query/token | 401 expected | `BARE_STATUS:401 BARE_BODY:{"error":"Authentication required. Use POST /api/reset?demo=1 for the public demo reset, or an ADMIN Bearer token."}` (curl + node fetch both) — frontend no longer hits this |
| Re-reset | `POST /api/reset?demo=1` + `GET /api/analytics` | 200 | `RESET2:{"ok":true}` `ANALYTICS2 history=38 seed=38 live=0 avgOld=60 avgNew=21 liveApps=3` — pristine |
| Stop | `Stop-Process -Id 30152 -Force` | 0 | `STOPPED_PID:30152 confirmed PORT3000 free` |

Counts: seed 12/6/60/38/3/2/2; i18n 134/134; analytics clean 38/38/0 avgOld 60 avgNew 21 apps 3; eval 6/8=0.75 corpus 60.

## Bugs Found (severity: critical/high/medium/low, file:line)
- None open excluding PPT/PDF. Prior HIGH (`public/app.js:166` bare 401) → VERIFIED FIXED (`/api/reset?demo=1`, COUNT_BARE=0, live 200 ok:true). Prior LOW (README 64-keys drift) → VERIFIED FIXED (3× 134 keys, 0× 64 keys).
- INFO (by-design, not a bug): `POST /api/reset` bare without token still 401 on server (`server.js:1533`) — correct guard; frontend no longer calls it. `data/db.json` dirties to history 39 on first read (auto-deem sweep) — `POST /api/reset?demo=1` restores 38/38/0; always reset before judging.

## Regression Risks
- `npm test` is syntax-only (3× node --check + JSON parse) — SLA sweeps, TF-IDF ranking, 401/403/429, 422 validator not covered. Re-ran live probe this session to compensate; re-run boot+health+reset+eval+analytics after any `server.js` edit.
- Single-file `data/db.json` (gitignored) mutates on read (FIRE-PROV auto-deem +1 live row). Left clean this run (38/38/0, server stopped). Do not ship dirty db.json in zip.
- `express ^4.19.2` caret, node_modules present. Do not `npm update` on stage.
- PPT/PDF excluded per request — not checked, not touched.

---
Evidence: `COUNT_DEMO1=1 COUNT_BARE=0 COUNT_134=3 COUNT_64KEYS=0 en=134 mr=134 blanks=0 EXIT_TEST:0 EXIT_LINT:0 BOOT_PID:30152 RESET_DEMO1 200 ok:true HEALTH ok EVAL 60/8/6/0.75 ANALYTICS 38/38/0 INDEX 200 BARE 401 (guard) STOPPED 30152`
