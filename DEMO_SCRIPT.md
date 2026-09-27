# Udyog Sarthi — Judging Demo Script (SIH 26130)

**URL:** `http://localhost:3000` · **Fallback:** `http://127.0.0.1:3000` (same server — use if hall laptop resolves `localhost` to broken `::1`) · **Port:** `3000` (`server.js: PORT = process.env.PORT || 3000`, vanilla + Express, offline, `npm start`).
**QR:** no image is bundled — before judging, get laptop Wi-Fi IP (`ipconfig` → `192.168.x.x`), QR-encode `http://192.168.x.x:3000` (any phone/online generator, print or phone-gallery), stick it on slide 1 + keep USB with 6-slide PPTX + 0.46 MB PDF + 60-sec screen-record as backup. Projector URL to speak: *“Single Window on port 3000 — QR on slide 1.”*

**Logins (server-verified `POST /api/login` → server-minted session token, 12h):**
- Applicant: `udyog@demo.in` / `demo123` → `{role, token, expiresAt}` — `token` is 64-hex `SHA256(email:random:time)`, `expiresAt` +12h
- Officer: `officer@maharashtra.gov.in` / `officer123` → same shape, `role:officer`
- `POST /api/login` verifies `SHA256(salt:email:password)`, stores `{token,email,role,createdAt,expiresAt}` in `db.sessions[]` (12h TTL, capped 200, expired purged on login). Fixed `demo-applicant-token` / `demo-officer-token` are RETIRED → `401` (`server.js:76-77`). Landing *Continue* buttons route to `#/login` with role prefilled (no guest minting); header Switch calls `POST /api/logout` (deletes Bearer session). 5 failed logins /15min/IP → `429`. Officer routes: missing/expired token → `401`, applicant role → `403` (show only if asked — never open DevTools yourself).

**Reset (do this FIRST, keep one click away):** footer **Reset demo data** → `POST /api/reset?demo=1` → clean `apps=3, history=38, corpus=60` + backdated `FIRE-PROV (24d vs 21d SLA)` + `GRV-881 Filed 8d ago` ready to auto-fire on next read. Verify once via curl:
`curl http://127.0.0.1:3000/api/analytics` → `avgOld=60 avgNew=21 history=38 live.apps=3`.

---

## 60-sec version (screening / hallway — one breath, three clicks)

> Say while clicking. Honest words only — banned: *AI model, LLM, OCR built, Mongo, measured 68→31, DigiLocker live.*

1. **[0-20s] Wizard → File.** `#/wizard` (defaults already *Food Processing → Nashik Sinnar MIDC → Small → Establish*) → **Next →** → **Generate checklist →** → *“9 approvals, critical path 45 days, fees summed, combined-inspection note”* → **📨 File all as one application** → `APP-2026-0xx` opens. Say: *“Rule engine, parallel Groups A–D, no LLM.”*
2. **[20-40s] Tracker breach.** `#/tracker` → open **APP-2026-0157 Deccan Auto** → point at **FIRE-PROV `Deemed`** + alertstrip *“auto-deemed — SLA enforcement fired.”* Say: *“Backdated 24 days vs 21-day SLA — untouched, so first read after reset auto-deems. Immutable clock, officer touches can’t game it.”*
3. **[40-60s] Officer + LIVE.** `#/officer` (login officer / `officer123`, queue **MPCB**) → **Query** one track with remarks → back to tracker shows `Queried`; → `#/analytics` → point at **🔴 LIVE card + `ch3` bars moved** (filing moved them) vs **🌱 SEED `60→21d*` headline frozen**. Say: *“TF-IDF knowledge P@1 n=32 correct=19 acc 0.594 ungamed no LLM; numbers with star are seed projection, live counters move — pilot to measure.”* → footer **Reset** if judge wants replay (warn: Replay logs you out 15s).

## 2-min version (internal shortlist — full story)

**[0-15s] Setup.** `npm start` → `http://localhost:3000` → footer **Reset demo data** → *“Clean: 3 apps, 38 history, 60 articles.”* Landing: point at **🌱 SEED `60→21d*` + 🔴 LIVE filings** labels. *“Stars are seed projection, live moves — I’ll show both.”*

**[15-45s] Click 1 — Wizard.** `#/wizard` → confirm *Food Processing / Nashik / Sinnar MIDC / Small / Establish* → **Next →** (title auto, investment 180L, 42 workers) → **Generate checklist →** → read *“9 approvals · critical path 45d · combined-inspection suggestion.”* → **📨 File all as one application** → new `APP-2026-0xx` with parallel tracks + Amber risk. *“Customised checklist, one-click filing, vault reuse.”*

**[45-75s] Click 2 — Tracker + breach + inspection.** `#/tracker` → **APP-2026-0157** → **FIRE-PROV `Deemed`** (backdated demo) + ring `3d over` → alertstrip auto-deemed line. *“SLA breach mints deemed approval — enforcement, not just display.”* → pick date/slot → **Book combined inspection** → tracks flip to `Inspection scheduled` + timeline remark. (If asked: double-book same slot → visible `warning`, demo not blocked.)

**[75-105s] Click 3 — Officer.** `#/login` → role Officer → `officer@maharashtra.gov.in` / `officer123` → **Login →** → `#/officer` queue **MPCB** → **Desk review** one, **Query** one with *“Effluent sheet missing — re-upload”* → tracker shows `Queried`. → **Inspection confirmations** → **Confirm done** → linked tracks → `Under review`. *“Pre-validated files only reach officers; every action needs the officer token (401 otherwise).”*

**[105-120s] MR + grievance + LIVE close.** Header **मराठी** → `#/wizard` shows `चेकलिस्ट जनरेटर विझार्ड` → reload → stays Marathi (`localStorage.us_lang`) → back to **English**. → `#/grievances` → **GRV-881 auto-escalated to Nodal Officer** (filed 8d ago, 7-day SLA) with timeline. → `#/analytics` → **🔴 LIVE pending-by-dept `ch3` moved after your filing** vs **🌱 SEED `60→21d*` footnote + Postgres roadmap**. → `#/knowledge` → type `deemed approval SLA breach` → scores + matched terms + `P@1 n=32 correct=19 acc 0.594 ungamed · no LLM` strip + details[] q/expect/got/hit + Top-4 misses box (of N live misses, full table above). → footer **Reset** (warn: Replay logs you out 15s). Close: *“Rule engine + TF-IDF (no LLM) + metadata validation (422) + SLA sweeps + live counters. Mongo/OCR/SMS are Phase-2 with file+line. Pilot: Sinnar × 3 approvals × 20 users × 4 weeks to measure.”*

---

## If things break (never improvise — run these)

| Symptom | Fix (say it calmly) |
|---|---|
| `localhost:3000` hangs | *“Hall IPv6 quirk — same server on 127.0.0.1.”* → open `http://127.0.0.1:3000`. |
| Port 3000 busy | `netstat -ano \| findstr :3000` → `taskkill /PID <n> /F` → `npm start`. |
| Dirty `db.json` (extra apps from testing) | Footer **Reset demo data** → re-check `apps=3`. |
| Breach not visible | You forgot reset-read order: **Reset → open `#/tracker`/`#/app/APP-2026-0157`** (sweep fires on read + every 60s). Curl check: `curl http://127.0.0.1:3000/api/applications \| findstr Deemed`. |
| Grievance not escalated | **Reset → open `#/grievances`** (sweep fires on read). `GRV-881 Filed 8d` → `Nodal`. |
| MR toggle looks broken | Hard-reload, click header **मराठी**, check wizard `चेकलिस्ट जनरेटर विझार्ड`, reload — persists via `localStorage.us_lang`. `i18n.json` is 160 keys EN+MR, zero blanks (160/160 blanks 0, verified 2026-09-27). |
| Forgery/OCR challenge | Offer: forged `{"name":"forged.pdf","passed":true}` → `422`; scanned-Marathi-NOC extraction → *“Metadata validation today (422), byte OCR is Phase-2 Tesseract roadmap — here’s the validator at server.js:534 (MIME sniff + multipart + hash guard) + sweeps :770 + TF-IDF :797, search/eval :1092-1120, analytics :1546 (verified 2026-09-27 via grep server.js).”* Never claim OCR built. |
| Projector washes out / offline | USB backup: PPTX + PDF + PNGs + 60-sec MP4. App needs no internet. |

## Never say (auto-ding list)

`AI model · LLM/RAG running · OCR working · MongoDB running · measured 60→21 or 68→31 · DigiLocker live · SMS/push sent · parallel engine · auto legal advice` — each has a 60-sec disproof. Say instead: *“TF-IDF retrieval + Rules (LLM Phase-2) · JSON pilot → Postgres Phase-2 · Metadata validation (OCR Phase-2) · *Seed projection, pilot to measure.”*
