# QA Report
Verdict: PASS
Date: 2026-09-27 · Tester: QA Engineer · Skill: finishing-a-development-branch Step 1 (verify-only, no push)
Project: D:\SIH\udyog-sarthi · Node v24.11.1 · npm 11.7.0

## Tests Run
- `npm test` → exit 0 — `node --check server.js && node --check data/seed.js && node --check public/app.js` + `i18n OK` (public/i18n.json valid JSON)
- `npm run lint` → exit 0 — `lint OK: no TODO/XXX` (checked server.js, data/seed.js, public/app.js, public/index.html, public/i18n.json)
- `boot node server.js` → PASS — PID 8444, `ready=1`, `BOOT_OK`, GET /api/analytics 200 on first poll
- `POST /api/reset?demo=1` → 200 `{"ok":true}` (`reset ok=True`)
- `GET /api/analytics` → 200 `historyCount=38 seedHistoryCount=38 liveHistoryCount=0` → `ANALYTICS_38_38_0_OK` (avgOld=60 avgNew=21, basis="SEED frozen baseline 38 rows (never moves) + 0 live measured completions", live.applications=3 pendingTracks=8 inspections=2 grievances=1)
- `GET /api/knowledge/eval` → 200 `n=32 correct=19 acc=0.594 corpusSize=60` → `EVAL_N32_OK`
- `node test/hardtech.js` → exit 0 — ALL 5 HARD-TECH PROBES PASS n=32 acc=0.594:
  - PASS 1 reset-demo1 200 ok:true (got 200)
  - PASS 2 bare-reset 401 (got 401)
  - PASS 3 checklist {} 400 (got 400)
  - PASS 4a officer login 200 token (got 200)
  - PASS 4b Bearer GET applications 200 non-empty (got 200)
  - PASS 4c found approvable track (non-Locked non-terminal)
  - PASS 4d officer-approve 200 APP-2026-0142/MPCB-CTE (got 200)
  - PASS 5 eval parsed 200 with n+details (got 200)
  - PASS 5b eval n>=30 (got n=32 correct=19 acc=0.594)
  - PASS 5c eval details[] q/expect/got/hit present
- `POST /api/reset?demo=1` (final restore) → 200 `ok=True` + `GET /api/analytics` 38/38/0 + `db apps=3 history=38 knowledge=60` → exit 0
- `npm test` (re-verify after restore) → exit 0 `i18n OK`
- `npm run lint` (re-verify after restore) → exit 0 `lint OK`
- `Stop-Process node` → PID 8444 killed, `netstat :3000` empty, port free → `STOP_DONE`
- No `git push` executed per instruction (Do NOT push)

## Bugs Found (severity: critical/high/medium/low, file:line)
- None — 0 critical, 0 high, 0 medium, 0 low blocking. Info only: eval accuracy 0.594 (19/32) is honest TF-IDF baseline with 24 adversarial queries co-authored (server.js:832 KNOW_EVAL) — by design, misses published, not a regression.

## Regression Risks
- `npm test` is syntax + i18n JSON only — does not cover runtime; runtime covered by boot+reset+analytics+eval+hardtech above. Re-run full chain after any server.js / data/seed.js / public/app.js edit, then reset to 38/38/0.
- `db.json` mutates on approve/deemed (live rows); gitignored but demo-sensitive — always `POST /api/reset?demo=1` before demo/hand-off to restore 38/38/0.
- Single dep `express@4.19.2`, no build step, 12h Bearer sessions, login 5-fail/15min + register 5/hr rate limits — no infra drift detected this run.
