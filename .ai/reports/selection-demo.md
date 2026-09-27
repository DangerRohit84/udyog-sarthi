# Selection Demo — What Kills You in 60 Seconds (SIH 26130)
Date: 2026-09-27 · Mode: demo-risk audit, no code changed
Read: `DEMO_SCRIPT.md` (53 lines), `public/index.html` (32 lines), `public/app.js` (974 lines), `start.ps1` (59 lines), `.ai/reports/qa-remaining-verify.md` (PASS), `.ai/reports/qa-report.md` (PASS), `package.json`, `server.js:21,693-762,1528-1550,1576-1581`

Verdict: **NOT stage-safe yet. 5 known killers, all reproducible. Fix the checklist or lose on process, not idea.**

No reassurance: `npm test` is 3× `node --check` + JSON parse only. No unit suite. All "LIVE" claims depend on mutable `data/db.json` + in-memory sweeps. One wrong click order and your numbers contradict your own slides.

---

## 1. Top 5 live-demo failure modes (genuine, in kill-order)

### KILLER #1 — Reset logs you out + breach only fires on READ (order kills you)
- **Files:** `public/app.js:165-170`, `server.js:1528-1550`, `server.js:693-762,1093-1119,1576-1581`
- **What happens:** Footer **Reset demo data** → `POST /api/reset?demo=1` → rewrites `data/db.json` from seed **and wipes `us_token/us_role/us_email` from localStorage** (`resetDemo()`). You are instantly logged out. `DEMO_SCRIPT.md:11` says "do this FIRST, keep one click away" — if you obey literally mid-demo (after officer login), you lose 20s re-typing `officer@maharashtra.gov.in / officer123` while judges watch.
- **Second half:** Reset does NOT show the breach. It only restores the *backdated* `FIRE-PROV (24d vs 21d SLA)` + `GRV-881 Filed 8d ago` in a pre-breach state. The auto-deem sweep fires on **next read** (`GET /api/applications`, `#/tracker`, `#/app/APP-2026-0157`) + every 60s background `setInterval`. `DEMO_SCRIPT.md:44-45` admits: "You forgot reset-read order: Reset → open tracker."
- **60-sec kill:** You click Reset on stage → breach disappears → you say "it was deemed just now" → judge asks to reload → nothing happens (already deemed, terminal immutability blocks re-fire) → you look like you faked it. Or you reset *after* login → `401` on officer queue → red error card.
- **Also:** Bare `POST /api/reset` without `?demo=1` is `401` by design (`server.js:1533`). Fixed in frontend (`app.js:166` uses `?demo=1`, QA verified `COUNT_BARE=0`) but any bookmark/curl without the query still 401s on stage.
- **Survive:** Reset **once, logged-out, T-2 min**, then immediately open `#/tracker` + `#/grievances` off-projector to arm the sweeps. Never touch Reset after you log in. If judge asks for replay, warn: "replay logs me out, 15 seconds" before you click.

### KILLER #2 — DB dirty: 38 vs 39 (your own numbers contradict you)
- **Files:** `data/seed.js` (history=38), `.ai/reports/qa-remaining-verify.md:34,44`, `server.js:671-672,1495`
- **What happens:** Clean seed = `apps=3, history=38, corpus=60`. First read after reset appends **1 live row** (`{regime:"new", live:true}` auto-deemed FIRE-PROV). QA proves it: "dirties to history 39 on first read — restores 38/38/0 on reset; always reset before judging." Analytics splits `seedHistoryCount=38` (frozen) vs `liveHistoryCount` / `live.applications=3` (moves).
- **60-sec kill:** You say "clean 3 apps, 38 history" (`DEMO_SCRIPT.md:26`) *after* you've already opened tracker once — `GET /api/analytics` now says `historyCount=39` or `liveHist=1`. Judge does the curl you told them (`curl .../api/analytics → history=38`) and gets 39. You either look sloppy or dishonest. Worse: `data/db.json` is gitignored but ships in your folder — if you zipped it dirty, judges booting your zip start at 39/4 apps, breach already consumed, no auto-fire to show.
- **Survive:** Never claim "38" after the breach is visible. Script it honestly: "38 seed + 1 live auto-deemed = 39 total, seed frozen, live moves." Re-reset + re-arm before every judging round. Never ship `data/db.json` dirty — reset, stop server, verify `ANALYTICS2 history=38 seed=38 live=0` per QA, then zip.

### KILLER #3 — Port 3000 busy + localhost IPv6 hang (projector silence)
- **Files:** `server.js:21` (`PORT = process.env.PORT || 3000`, no fallback), `start.ps1:5-6,45-55`, `DEMO_SCRIPT.md:3,41-43`
- **What happens:** `start.ps1` always opens `http://localhost:3000`, no port check, no kill, no fallback. If hall laptop has Skype/previous `node server.js` still bound, `npm start` crashes `EADDRINUSE` while browser shows blank. If hall laptop resolves `localhost` → broken `::1` (documented IPv6 quirk), page hangs with no error — `public/app.js:251` just shows "is the server running? npm start".
- **60-sec kill:** 15 seconds of white screen + you typing `netstat -ano | findstr :3000` on projector. Selection over.
- **Survive:** T-15 min: `netstat -ano | findstr :3000` → `taskkill /PID <n> /F` → `npm start` → verify **both** `http://localhost:3000/api/health` and `http://127.0.0.1:3000/api/health` return `{"ok":true}`. Speak the fallback line calmly per script: "Hall IPv6 quirk — same server on 127.0.0.1" and switch. No improvisation.

### KILLER #4 — LAN/QR + Node version (the two things start.ps1 doesn't do)
- **Files:** `start.ps1:11-23,32-43`, `package.json:15-17` (`engines node>=18`), `DEMO_SCRIPT.md:4`, `public/index.html:30`
- **QR/LAN:** No QR image is bundled. Script says "get laptop Wi-Fi IP, QR-encode, print or phone-gallery, stick on slide 1 + USB backup." `app.listen(PORT)` binds all interfaces, but hall Wi-Fi client isolation / Windows Firewall will block `http://192.168.x.x:3000` from phones. `start.ps1` never opens firewall, never prints LAN URL. If you promise "scan the QR" and 30 phones time out, you burn the whole slot.
- **Node:** QA ran `Node v24.11.1 / npm 11.7.0`. `engines >=18` but `start.ps1` only checks *existence*, never version. Hall laptop on Node 16 → `express ^4.19.2` + optional chaining + `crypto` session code can boot-fail. `start.ps1:33-38` runs `npm install` only if `node_modules` missing — offline hall + missing modules = 3-min hang. Caret `^4.19.2` + "do not npm update on stage" (QA) means any `npm update` changes behavior.
- **60-sec kill:** QR doesn't load / `ERROR: Node.js not found` / `npm install` spinning offline while judges wait.
- **Survive:** Pre-generate QR for **both** `127.0.0.1` fallback story and LAN IP, but **never depend on LAN**. Demo on laptop + projector; QR is bonus. Carry phone hotspot + USB with 6-slide PPTX + 0.46 MB PDF + 60-sec MP4 (per script). T-60 min: `node --version` (need 18+, prefer 20/24), confirm `node_modules` present, never run `npm update` on stage.

### KILLER #5 — Marathi toggle looks half-built + rate-limit lockout
- **Files:** `public/app.js:103-116,134-152`, `public/i18n.json` (en=134 mr=134 verified), `server.js:869` (5 fails/15min/IP → 429)
- **Marathi:** Counts match (134/134, zero blanks) but coverage is **header + wizard + tracker + partial login/dashboard** only. `toggleLang()` flips `localStorage.us_lang` + `document.documentElement.lang` and re-renders chrome; `DEMO_SCRIPT.md:47` admits fix is "hard-reload, click मराठी, check wizard `चेकलिस्ट जनरेटर विझार्ड`, reload — persists." Open `#/officer`, `#/analytics`, `#/grievances`, `#/knowledge` in Marathi and large blocks fall back to English literals. Judge clicks Marathi → Analytics → sees English charts + `*Seed projection` footnote → "so translation is fake?"
- **Lockout:** 5 bad logins /15 min /IP → `429`. Typing `demo123` wrong twice + caps-lock once on projector = locked out for the next team too. Officer routes without token → `401`, applicant token on officer queue → `403` — both render as red `blockedCard`, not a graceful message.
- **60-sec kill:** You show off मराठी, judge asks "show grievance in Marathi?" → half-English. Or you fat-finger password → `429` → "Login failed" loop on big screen.
- **Survive:** Demo Marathi **only** on `#/wizard` (the one string the script names), then switch back to English immediately. Type passwords from a printed card, not memory. Keep `?demo=1` browsing (`#/dashboard?demo=1`) as password-free fallback — `enterDemo()` needs no credentials. Never open DevTools yourself to prove 401/403/429; offer only if asked.

---

## 2. Pre-demo checklist that actually prevents disaster (do all, in order)

**T-60 min (laptop):**
- [ ] `node --version` → need `>=18` (QA used 24.11.1). If 16 or missing, switch laptops now.
- [ ] `node_modules` present? If missing, `npm install` **now** (needs internet). Never on stage.
- [ ] Never `npm update`. `express ^4.19.2` caret floats — lock what QA passed.
- [ ] `ipconfig` → write `192.168.x.x` on paper. Generate QR for `http://192.168.x.x:3000`, save to phone gallery + print for slide 1. Assume it may fail (firewall/isolation) — laptop+projector is the real demo.
- [ ] USB stick: 6-slide PPTX + 0.46 MB PDF + PNGs + 60-sec MP4. App needs no internet — verify by turning Wi-Fi off once and loading `http://127.0.0.1:3000`.

**T-15 min (port + boot):**
- [ ] `netstat -ano | findstr :3000` → `taskkill /PID <n> /F` if busy.
- [ ] `npm start` → verify `GET /api/health` on **both** `localhost:3000` and `127.0.0.1:3000` → `{"ok":true,"sih":"26130"}`.
- [ ] Disable sleep/screensaver. Increase font to 125-150%. Open browser with only 2 tabs: app + fallback IP.
- [ ] Print credential card: `udyog@demo.in / demo123`, `officer@maharashtra.gov.in / officer123`. Do not type from memory.

**T-2 min (reset + arm — logged OUT):**
- [ ] Footer **Reset demo data** (or `curl -X POST http://127.0.0.1:3000/api/reset?demo=1` → `{"ok":true}`).
- [ ] Verify: `curl http://127.0.0.1:3000/api/analytics` → `avgOld=60 avgNew=21 history=38 live.apps=3` (per `DEMO_SCRIPT.md:12`).
- [ ] Arm sweeps off-projector: open `#/tracker` (fires FIRE-PROV deemed) + `#/grievances` (fires GRV-881 → Nodal). Confirm `FIRE-PROV Deemed` + `GRV-881 auto-escalated` visible.
- [ ] Log out state check: Reset cleared sessions — now log in fresh as applicant **once** to confirm, then log out. Start judging logged-out at `#/` so numbers match your words.
- [ ] Never Reset again after login. If db dirties mid-round, finish the round — don't reset live.

**On stage (60-sec order):**
1. `#/wizard` defaults (Food Processing → Nashik Sinnar MIDC → Small → Establish) → Next → Generate → "9 approvals, critical path 45 days" → File → `APP-2026-0xx`. Say "rule engine, no LLM."
2. `#/tracker` → `APP-2026-0157 Deccan Auto` → `FIRE-PROV Deemed` + "auto-deemed — SLA enforcement fired." Say "24d vs 21d, immutable clock."
3. `#/officer` (login officer) → MPCB queue → Query one → `#/analytics` → "🔴 LIVE moved, 🌱 SEED 60→21* frozen, TF-IDF P@1 6/8 75% no LLM." Footer Reset only if judge asks for replay (warns logout).

---

## 3. Judge questions that expose weakness + honest answers to prepare

| Judge asks | Why it hurts | Honest answer (say this, not the banned version) |
|---|---|---|
| "Is this AI/LLM? RAG?" | `GET /api/knowledge/eval` says `TF-IDF cosine (no embeddings, no LLM) corpus 60 n=8 correct 6 acc 0.75`. Any "LLM running" claim is disprovable in 10s. | "No LLM running. TF-IDF retrieval, P@1 6/8 75%, misses K03→K40 + K22→K23 near-synonyms ungamed. LLM is Phase-2, file+line in README." |
| "OCR working? Upload a scanned Marathi NOC." | Validator is `server.js:354-430` MIME sniff + multipart + hash guard `:437-497`, returns `422` on forgery. Byte OCR is roadmap. | Demo forged `{"name":"forged.pdf","passed":true}` → `422`. "Metadata validation today, byte OCR Phase-2 Tesseract roadmap — here's the validator." Never claim OCR built. |
| "MongoDB running? Where's the data?" | It's `data/db.json` single file (53 KB, gitignored), not Mongo. | "JSON pilot for offline judging → Postgres Phase-2 roadmap. Single-file mutates on sweep — that's why we reset." |
| "You measured 60→21 days? 68→31?" | Analytics `avgOld=60 avgNew=21` is `🌱 SEED frozen baseline 38 rows`, `basis: SEED frozen + 0 live`. `avgNewLive` is null until you approve something. | "Stars are seed projection, not measured. Live counters move with filings. Pilot: Sinnar × 3 approvals × 20 users × 4 weeks to measure." |
| "DigiLocker live? SMS sent?" | Vault is `DigiLocker-style` filename+hash records, bytes not stored. No SMS/push integration. | "Vault holds verified filename+size+MIME+SHA-256, not DigiLocker live. SMS is Phase-2." |
| "Does deemed approval hold legally?" | Your sweep mints `Deemed` on breach — legally the strongest claim, weakest proof. | "Demo enforces the SLA clock immutably — officer touches can't game it. Legal adoption needs department notification workflow (Phase-2)." |
| "Multi-user? Concurrent officers?" | `db.sessions[]` capped 200, 12h TTL, file-locked JSON writes. No row locks. | "Single-laptop pilot store. Concurrent districts need Postgres + auth hardening — scoped in roadmap." |
| "Show Marathi grievance/analytics." | i18n 134/134 but partial coverage (see Killer #5). | "Marathi covers header+wizard+tracker fully, 134 keys verified. Officer/analytics/grievance fallback to English — full coverage is post-pilot." |
| "What if officer rejects? Terminal flip?" | Terminals (`Approved/Deemed/Rejected`) never flip; `Approved→Queried` blocked `400`. | "Settled tracks are immutable by design — show the `400` guard if asked. Prevents gaming." |
| "Why localhost, not deployed link?" | No deploy, no TLS, no hosted URL. | "Offline-first for hall reliability — `npm start`, no internet needed. Hosted pilot is post-selection." |

**Never say (auto-ding):** `AI model · LLM/RAG running · OCR working · MongoDB running · measured 60→21 or 68→31 · DigiLocker live · SMS/push sent · parallel engine · auto legal advice` — each has a 60-sec disproof per `DEMO_SCRIPT.md:53`.

---
*Sources: QA PASS still leaves syntax-only `npm test`, mutable `db.json`, caret dep, no git history (`qa-report.md:26,60-63`). This report adds the stage layer QA didn't cover: order, port, LAN, language, lockout.*
