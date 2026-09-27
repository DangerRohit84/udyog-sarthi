# QA Report — Final QA for SIH-26130 full #1–8 + polish build

Verdict: PASS

Date: 2026-09-13 · Tester: QA Engineer · Mode: live verification on http://127.0.0.1:3000 (port 3000, server restarted once mid-run to clear in-memory rate-limit, left RUNNING clean) · No app/feature code changed (verify-only)
Inputs read FIRST: `.ai/reports/full-fix-1-7.md` (107 lines), `.ai/reports/hygiene-report.md` (29 lines), `.ai/reports/docs-refresh.md` (39 lines), `.ai/reports/qa-shortlist-gate.md` (91 lines)

## Tests Run

### 0. Hygiene / gates — PASS
| Check | Evidence (this run) | Result |
|---|---|---|
| `node --check server.js / public/app.js / data/seed.js` | OK ×3 | PASS |
| `npm test` | `i18n OK` | PASS |
| `npm run lint` | `lint OK: no TODO/XXX` | PASS |
| `.gitignore` | `node_modules/`, `data/db.json`, `*.bak`, `.ai/archive/`, `ppt-slides/`, `*.tmp` (6 lines) | PASS |
| Root deck files | ONLY `Udyog-Sarthi-AI-SIH26130-IDEA-PPT.pptx (707,664B)` + `.pdf (477,804B)`; `.bak` lives in `.ai/archive/` only; zero `*.bak`/`*.tmp` in root | PASS (with note: `aadhar.pdf 0B` still in root — not a deck, uploader must ignore; see Bugs #1 low) |
| `GET /api/health` | `{ok:true, app:Udyog Sarthi, sih:26130}` | PASS |
| Served `GET /`, `/app.js`, `/i18n.json` | 200 (1448 / 58655 bytes / 8103 chars) | PASS |
| README/DEMO refs current | README has `64 keys` + `avgNewLive` + `354-430`/`437-497`, zero `147-228`; DEMO retired-token context + `429`; SUBMIT_CHECKLIST 25 lines with clean-root footer | PASS |

### 1. Auth — PASS
| Check | Evidence | Result |
|---|---|---|
| Real login mints 64-hex expiring token | officer + applicant `POST /api/login` → 200, `token` 64-hex (`TOKEN_64HEX=True`), `expiresAt` +12h | PASS |
| Passwords hashed | `server.js:38-39` `passHash = SHA256(salt:email:password)`, verify at `:682`; no plaintext credential strings | PASS |
| Fixed `demo-officer-token` / `demo-applicant-token` retired | `authSession()` `:77` returns null; officer-gated `GET /api/audit` + `PATCH …/track` with fixed token → `401` | PASS (note: public reads `/api/applications`, `/api/renewals`, `/api/analytics`, `/api/grievances`, `/api/alerts` return 200 with any/no token by design — no impersonation, they expose no privileged write) |
| Impersonation gone / role gate | applicant `GET /api/audit` → `403`; no-token → `401`; officer → `200` | PASS |
| Rate limit | 5 bad logins → `401×5`, 6th–7th → `429` | PASS (note: in-memory, restart clears by design — this run locked out once, restarted server to continue; documented) |
| Logout real | `POST /api/logout` → `{ok:true}`; officer token post-logout `GET /api/audit` → `401` | PASS |

### 2. Docs / Vault — PASS
| Check | Evidence | Result |
|---|---|---|
| Real-bytes multipart upload | `curl -F file=@qa-real.pdf` (1983 bytes) → `201 verified:true sizeBytes=1983 mime=application/pdf hash=524e259d…` | PASS |
| Tamper guard | Same bytes + different docType → `422` "already filed as Factory layout plan…" | PASS |
| Duplicate guard | Same bytes + same docType → `409` "Duplicate upload…" | PASS |
| MIME sniff | `MZ…` bytes as `.pdf` → `422` "MIME sniff failed", `mime=application/octet-stream`, `sizeBytes=518`, `hash=8e39…` | PASS |
| Forgery rejected | JSON `POST …/documents {passed:true}` → `422 verified:false` | PASS |
| Clear-first verdict only | `app.js:422` renders `⏳ Validating on server…` first, sends real `FormData` bytes, renders server verdict only (no optimistic PASSED) | PASS |
| Size/MIME/hash views | App-detail + vault + officer cards show `KB · MIME · ⛨ hash-prefix`; legacy rows labelled "legacy (no byte-hash — re-upload for hash)" (`app.js:265,386,414`) | PASS |

### 3. Officer — PASS
| Check | Evidence | Result |
|---|---|---|
| `loadOffInsp` loads | `GET /api/inspections` → 2 rows (INSP-301, INSP-298 joint); `function loadOffInsp` defined `app.js:501`, called explicitly from `route()` (no script-tag), null-guarded | PASS |
| No `undefinedd` | Only match is comment "never render `undefinedd left`"; `slaLabel(t)` (`app.js:455`) handles null SLA; terminals show status badges | PASS |
| Terminal immutable | Same-terminal re-assert `approve→approve` → `200` idempotent; `Approved→Queried` flip → `400` "Track is Approved (terminal, immutable)… File a renewal / re-apply" | PASS |
| Officer summary strip + MR + toast | `settled vs pending` strip (`app.js:472-473`), `T()`/`toggleLang` MR, `alert(` only in toast-fallback comment + `else alert(msg)` ultimate fallback (`app.js:67`, `#toast` exists so never fires) | PASS |

### 4. Inline scripts — PASS
| Check | Evidence | Result |
|---|---|---|
| Zero `<script` in `app.js` | `Select-String "<script"` → 0 | PASS |
| `knFilter`/`matchSchemes`/`genChecklist`/`loadOffInsp` all fire | All defined (`genChecklist:311`, `matchSchemes:530`, `loadOffInsp:501`, `window.knFilter`, `window.validateUpload`, `window.renewReapply`, `bindLoginRole:229`, `toast:57`, `slaLabel:455`, `doLogin:21`, `doLogout:35`) and called explicitly from `route()` after `innerHTML` | PASS |

### 5. Renewals / polish — PASS
| Check | Evidence | Result |
|---|---|---|
| Real renewals | `GET /api/renewals` → 7 rows, all with `issuedAt/validityDays/due/daysLeft/state`; states `valid` (+ badge helper covers `overdue/due-soon`) | PASS |
| Badges | `renBadge` (`app.js:258`) renders `OVERDUE n d / DUE IN n d / valid n d left` | PASS |
| Re-apply prefill + vault reuse | `renewReapply` (`app.js:268`) prefills `WIZ.data` + `WIZ.renewalOf`, renewal banner (`app.js:321`), server `reusedDocs` vault-verified (`server.js:800-803`) | PASS |
| Officer summary strip | `settled vs pending` per dept + immutability note | PASS |
| Toast not alert | `#toast` div (`index.html:24`, `role=status`), `.toast.ok/err/warn` CSS, `alert(` fires only if `#toast` missing | PASS |
| Attachment size/hash view | Covered in §2 | PASS |
| Landing one-screen | `Try it in 60 seconds` strip + inline demo logins + `Continue as Applicant/Officer → login` (no guest minting) + session/reset note (`app.js:183-204`) | PASS |

### 6. Analytics honesty — PASS
| Check | Evidence | Result |
|---|---|---|
| SEED frozen `avgNew 21` | Before→after officer approve: `avgNew 21→21`, `avgOld 60→60`, `seedHistoryCount 38` | PASS |
| LIVE moves | `liveHistoryCount 1→2`, `total 39→40`, `avgNewLive 25→14` on the measured approve | PASS |
| Basis string | `SEED frozen baseline 38 rows (never moves) + N live measured completions (move separately as avgNewLive)` + `seedHistoryCount`/`liveHistoryCount` keys | PASS |
| No write-on-read surprise | Repeated `GET /analytics` → `history 40→40` stable; sweeps run in-memory, `res.json` first, `saveDb` post-response | PASS |
| No double `loadDb` on grievances | `server.js:1070-1073` single `db` + comment; `res.json(loadDb…)` remains only on sweep-free `/api/vault`, `/api/inspections` (single load, no double) | PASS |

### 7. Preserved truths
Knowledge eval `60 articles, P@1 6/8 = 0.75, TF-IDF no LLM` — PASS. `GRV-881 Filed → Escalated to Nodal Officer` on read — PASS. `i18n 64/64 keys, 0 blanks` — PASS. Final `POST /api/reset` → `apps=3 history=38 seed=38 live=0 avgOld=60 avgNew=21`, server left RUNNING clean — PASS.

## Bugs Found (severity: critical/high/medium/low, file:line)
| # | Severity | Title + Where | Expected vs Actual | File:line | Notes |
|---|---|---|---|---|---|
| 1 | low | Root `aadhar.pdf` (0 B) still in root — strict "only PPT+PDF" violated | Expected: root holds only the two `Udyog-Sarthi-AI-*` deck files; Actual: `aadhar.pdf 0B` present | root (not code) | Pre-existing, hygiene-report §2 deliberately left it (out of move-list scope). Not a deck, not git-relevant. Fix: delete or move to `.ai/archive/`; uploader must upload ONLY the two `Udyog-Sarthi-AI-*` files. |
| 2 | low | `alert()` ultimate fallback line remains | Expected: zero `alert(`; Actual: one `else alert(msg)` fallback | `public/app.js:67` | Fires only if `#toast` missing — div exists (`index.html:24`), so unreachable in practice. Keep or remove for grep-purity. |
| 3 | low | `res.json(loadDb().…)` direct pattern on two sweep-free reads | Expected: uniform post-response-save style; Actual: `/api/vault` + `/api/inspections` inline-load | `server.js:994,996` | No double-load, no sweep, no write-on-read — correct behaviour, style-only observation. |
| 4 | low | Rate-limit lockout needs restart to clear (in-memory by design) | Expected: self-expiry; Actual: 15-min IP block, restart clears | `server.js:41` + design | By design (demo-safe, documented in full-fix §5). QA hit it once during brute-force test and restarted. Judges doing 5+ wrong passwords in 15 min will see `429` — success path unaffected (success clears window). |

No critical / high / medium bugs. No app-code changes made (verify-only; server restart + `POST /api/reset` only).

## Regression Risks
| Area | Risk | Mitigation |
|---|---|---|
| Wrong-file upload | `.ai/archive/` holds `.bak` + 8-slide vision deck; root holds `aadhar.pdf` — one wrong portal click = placeholders/8 slides/empty PDF | Upload ONLY `Udyog-Sarthi-AI-SIH26130-IDEA-PPT.pptx + .pdf`; SUBMIT_CHECKLIST footer; USB holds only submit pair |
| Dirty `db.json` before judging | QA uploads/approvals persist as live rows | Footer **Reset demo data**; verified clean now (`apps=3 history=38 seed=38 live=0 avg=60/21`); pre-check `curl /api/analytics` in DEMO_SCRIPT |
| Sweep order | Analytics before tracker shows pre-sweep pending | Script order tracker→grievances→analytics; break-glass table covers it |
| MR toggle on hall machine | Headless env could not click-test | Hall pass: `मराठी` toggle → wizard Marathi → reload persists; fallback `i18n 64/64 zero blanks` |
| Banned words on stage | One bluff (LLM/OCR/Mongo/DigiLocker-live) = instant disproof | Rehearse DEMO_SCRIPT never-say list; point at `server.js:354-430 / :437-497 / :524-597 / :599-667` |
| Port/IPv6 in hall | `localhost` may hang (IPv6 `::1` seen before) | `http://127.0.0.1:3000` fallback; `netstat → taskkill → npm start`; QR uses LAN IP; offline (1 dep `express`) |
| Rate-limit self-lock | 5 wrong passwords → 15-min `429` on that IP | Type logins from DEMO_SCRIPT; success clears window; restart clears if needed |

## SHORTLIST-READY verdict
**SHORTLIST-READY: YES — conditional on the same 2 user fills from qa-shortlist-gate §4 (Team ID `SIH26130-XXX` ×11 + College `___` ×1, re-export PDF <5MB, upload ONLY the 6-slide PPTX+PDF).** Every verifiable code/demo/hygiene/docs item in scope #1–8 + polish holds live. Finale-win items (OCR/LLM/Postgres/SMS) remain correctly roadmap-only.

*Server left RUNNING on :3000 with clean seeds. `start.ps1` untouched. Chain handoff: `dev-lead` → `security` read this file; deploy NOT requested.*
