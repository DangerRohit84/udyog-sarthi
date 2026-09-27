# Docs Refresh — SIH-26130 post full-fix #1-7 (2026-09-13)

Agent: junior-dev · Scope: `DEMO_SCRIPT.md`, `README.md`, `SUBMIT_CHECKLIST.txt` + this report
Inputs read FIRST: `.ai/reports/full-fix-1-7.md` (all 107 lines, esp. §5 handoff: DEMO_SCRIPT stale tokens + #8/README line-refs), `.ai/reports/hygiene-report.md` (all 29 lines, esp. §2 root-trim + `npm test`/`lint` stubs), plus `server.js` grep for validator/sweep/TF-IDF, `package.json` scripts.
Hard boundary respected: did NOT touch `server.js`, `public/app.js`, `data/seed.js` (parallel code agent owns them); did NOT touch `start.ps1`, `.gitignore`, `package.json`.

## 1. Files changed

### DEMO_SCRIPT.md (3 edits, 53 lines total, 60-sec + 2-min scripts kept intact)
1. **Logins block (lines 6-9): retired fixed tokens → real session flow.** Deleted `→ demo-applicant-token` / `→ demo-officer-token` minting claim. Now: `POST /api/login` → `{role, token, expiresAt}`, 64-hex `SHA256(email:random:time)`, `expiresAt` +12h; `SHA256(salt:email:password)` verify, `db.sessions[]` 12h TTL capped 200; fixed `demo-*-token` RETIRED → `401` (`server.js:76-77`); landing *Continue* → `#/login` prefill (no guest minting); header Switch → `POST /api/logout`; 5 fails/15min/IP → `429`; officer missing/expired → `401`, wrong role → `403`. Logins unchanged (`udyog@demo.in/demo123`, `officer@maharashtra.gov.in/officer123`).
2. **MR row:** `i18n.json` 36 keys → **64 keys EN+MR** (full-fix §Polish: 36→64).
3. **Forgery/OCR row:** validator ref `server.js:147-228` → **`server.js:354-430` (+ MIME sniff + multipart + hash guard `:437-497`)**.
- Kept: port 3000 + `127.0.0.1` fallback (line 3), QR + USB backup (line 4), reset `apps=3, history=38, corpus=60` + FIRE-PROV 24d + GRV-881 8d (lines 11-12), 60-sec 3-click + 2-min full story verbatim, banned-words list.

### README.md (6 edits)
1. **Heading :29:** `→ token` → `→ 64-hex session token, 12h`.
2. **Landing/auth paragraph :36 (was false):** deleted "mint the same demo tokens / `Bearer demo-officer-token`" claim. Now: route to `#/login` prefill, 64-hex mint, `db.sessions[]` capped 200, fixed tokens retired → `401` (`server.js:76-77`), `401`/`403`/`429` rules, `POST /api/logout` real logout.
3. **EN/MR :45 + Files :106:** 36 keys → **64 keys** (both spots).
4. **LIVE vs SEED :52 (truth):** added `avgNewLive`/`liveHistoryCount` move vs `avgOld=60 avgNew=21` frozen over 38 rows; `GET /api/analytics` excludes `live:true` from `avgNew`/`byDept`, reports live separately + `seedHistoryCount` + `basis` (`server.js:1136-1173`).
5. **Banned/file+line :53 (stale refs):** `server.js:147-228 / :231-291 / :293-361` → **`server.js:354-430` (validator), `:437-497` (MIME sniff + multipart + hash guard), `:524-597` (sweeps: `sweepDeemed` 524-558 + `sweepGrievances` 565-589 + `runSweeps` 590-597), `:599-667` (TF-IDF engine `tfidfSearch` 617-648 + eval 660-667, endpoints `:717-741`)** — verified by grep + `node -e` line dump (server.js 1218 lines total).
6. **API table:** `/api/login` → `{role,token,expiresAt}` (401/429); `/api/analytics` → SEED frozen + LIVE `avgNewLive`/`liveHistoryCount`/`basis`.
- Truth ensured (all still honest): 60 articles P@1 6/8=0.75 no LLM (:40), 422 forgery (:41), JSON pilot → Postgres roadmap (:46), *Seed projection 60→21 frozen + avgNewLive moves (:50/:52).

### SUBMIT_CHECKLIST.txt (1 edit, 22→24 lines)
- Appended verification footer: root clean — ONLY `Udyog-Sarthi-AI-SIH26130-IDEA-PPT.pptx` (707,664 B) + `.pdf` (477,804 B); zero `*.bak`/`*.tmp`/vision deck in root (verified `Get-ChildItem -Path * -Include *.pptx,*.pdf,*.bak,*.tmp`); forbidden files under `.ai/archive/` (git-ignored); note `aadhar.pdf` (0 B) is NOT a deck — ignore, upload only the two `Udyog-Sarthi-AI-*` files.

### This report
- `.ai/reports/docs-refresh.md` — THIS FILE.

## 2. Verification
- `npm test` → PASS (`i18n OK`, implies `node --check` clean on `server.js`, `data/seed.js`, `public/app.js` + `i18n.json` parses).
- `npm run lint` → PASS (`lint OK: no TODO/XXX` over 5 scanned files).
- Grep checks: `DEMO_SCRIPT.md` has zero `147-228` / zero `36 keys`; remaining `demo-*-token` hits (DEMO :9, README :36) are both in explicit `RETIRED → 401` context only — no minting claim remains. `README.md` has zero `147-228`/`231-291`/`293-361`.
- `server.js` / `app.js` / `seed.js` untouched (no edits by this task); `start.ps1` untouched.

## 3. Blockers / notes
- DB integration skipped honestly: no `<task_id>` supplied in dispatch and no `udyog-sarthi` row exists in sprint.db per hygiene-report §4 (checked 19 sprints / 61 tasks) — so `update-task <id>` was not runnable without risking a wrong-task write. No code impact.
- Rate-limit is in-memory (restart clears, by design); sessions survive restart in `db.json` until expiry/reset (per full-fix §5).
- One hall-laptop click-through still wanted per full-fix §5: MR toggle → wizard → reload persists; toast on login/upload/officer; Re-apply prefill (no browser in env, verified via served-HTTP + API flows only).
