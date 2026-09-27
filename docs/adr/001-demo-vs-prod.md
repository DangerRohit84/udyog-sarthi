# ADR 001 — Demo vs Prod Topology (judging prototype stays offline JSON; prod path designed, not built)

Status: Accepted (2026-09-27) · SIH 26130 Udyog Sarthi · Selection-tech §3b
Scope: `server.js` + `data/db.json` + `data/seed.js` only. No PPT/PDF touched.

## Context

SIH Idea-stage judging happens on one laptop, often with dead hall Wi-Fi, in 5 minutes.
The prototype must boot with one command, reset in one click, and fire SLA enforcement
visibly — without internet, DB server, build step, or API key. At the same time judges
ask "how will this scale to 10k concurrent / 36 districts / real GR citations?" The
answer must be an honest design pointer, not a faked migration the night before selection.

Inputs read: `selection-fit.md` P1-1 (pilot intent), `selection-tech.md` §3b (demo-vs-prod
ADR ask), `server.js` (verified 1640 lines 2026-09-27 via grep), `data/seed.js` (60 K-articles,
38 history rows, 3 apps), `package.json` (1 dep `express`).

## Decision

Keep the judging topology exactly as-is for selection. Document the prod path as
designed-only with an interface-ready seam. Never claim prod is built.

### Demo topology (TODAY, judged)

- Single Node 18 process, Express 4 (`express ^4.19.2` only dep), `PORT 3000`,
  `express.json 2mb` + `express.raw 12mb` for multipart.
- `data/db.json` JSON file store, single-writer. Atomic persistence via tmp-file +
  rename so a crash never leaves half-written JSON. Multi-process read-modify-write
  can still interleave at the logical level — single demo server is the supported
  topology (see code comment at `writeDbAtomic`).
- In-memory rate limits (`LOGIN_FAILS`, `REGISTER_ATTEMPTS` maps, reset on restart),
  sessions in `db.sessions[]` capped at 200 rows, 12h expiry, `Bearer us_token` in
  `localStorage` (XSS-stealable by design for demo; HttpOnly is Phase-2).
- Zero-dep manual multipart parser + magic-byte MIME sniff (PDF/PNG/JPEG) + SHA-256
  duplicate/tamper guard. Bytes are hashed and dropped; vault holds filename records
  only (no live DigiLocker/EntityLocker API).
- In-process TF-IDF cosine retrieval over 60 hand-written Q/A, no embeddings, no LLM.
- 60-sec background + on-read sweeps for auto-deemed / auto-escalation / gate unlocks.
- Constraints: 1 laptop, offline, 3 roles (APPLICANT/OFFICER/ADMIN), <100 applications,
  8 districts, 12 approvals, illustrative SLAs/fees/validities (`*Seed projection`).

### File:line pointers (honest, checkable on stage)

Scoping refs given in task (historic README numbering) + verified current 2026-09-27
(`grep -n function server.js`, `server.js` total 1640 lines):

| Concern | Scoped ref (task) | Verified current (2026-09-27) |
|---|---|---|
| `writeDbAtomic` (tmp + rename atomic) | `server.js:240` | `server.js:240` (`function writeDbAtomic`, tmp `${DB_FILE}.${pid}.${Date.now()}…` + `renameSync`) |
| `loadDb` (seed restore + in-memory migrations, no write-on-read) | `server.js:250` | `server.js:250` (`function loadDb`, `audit/history/sessions/vault/users` guards) |
| `runSweeps` (deemed + grievance + gate unlocks) | `server.js:760` (historic) | `server.js:770` (`function runSweeps`, calls `sweepDeemed:704` + `sweepGrievances:745` + `unlockGatedTracks`) |
| Doc validator (ext/size/expiry/holder, ignores client `passed`, 422) | `server.js:354-430` (historic) | `server.js:534` (`function validateDocumentInput`, checks + `verified` gate; historic range is stale after auth hardening) |
| TF-IDF engine (tokenize + df/idf + cosine + tag boost, no LLM) | `server.js:599-667` (historic) | `server.js:797` (`function tfidfSearch`; corpus `knowCorpus:785`, eval `evalKnowledge:866` localize `880`; historic range is stale) |
| Knowledge endpoints (search/eval) + analytics SEED/LIVE | historic `717-741` | `server.js:1092-1120` (search `1092` + `1104`, eval `1116`) + analytics `1546-1582` (verified via grep 2026-09-27) |

Live probes that prove the topology without slides:

- `POST /api/reset?demo=1` → `{"ok":true}` restores `apps=3 history=38 corpus=60`.
- `GET /api/analytics` → `seedHistoryCount 38` frozen + `liveHistoryCount` moves separately.
- `GET /api/knowledge/eval` → `n=32 correct=19 acc 0.594` ungamed (8 kept + 24 adversarial Hinglish/typo/single-keyword/Marathi-fail/near-synonym, misses published, overfit illustrative, no embeddings no LLM) with misses `K40-vs-K03 + K23-vs-K22` + `tookMs + details[]` (verified 2026-09-27).
- `GET /api/audit` (officer-only) + `GET /api/renewals` (real validity dates, no hardcoded 58d).
- Gate proof: approve Locked CTO → `400`; renamed `.exe→.pdf` upload → `422` sniff fail.

### Prod path (NOT implemented, interface ready)

`loadDb`/`saveDb` already isolates storage — the swap is a seam, not a rewrite:

1. `better-sqlite3` (still 1 file, still offline, but real transactions + indexes + WAL).
   Tables: `approvals`, `tracks` (with immutable `slaStartedAt`), append-only `audit`,
   `documents` (byte hashes), `sessions`. Replaces sync `readFileSync` per request
   (today even `authSession` re-reads the file) with pooled queries + pagination.
2. Postgres + Prisma (36 districts, 325+/2200 approvals scale), Redis (rate-limit +
   idempotency keys + session store), S3-compatible object store (real file bytes +
   virus scan), Tesseract.js OCR feeding the validator (expiry/name extract + confidence
   + human review queue), capped LLM for cited-answers-only (see ADR 002).
3. Auth hardening: HttpOnly Secure cookies + refresh rotation, helmet/CSP/HSTS,
   per-user rate-limit in Redis, remove demo passwords from `GET /api/demo/status`,
   `argon2/scrypt` stretch for all legacy rows, audit ship to append-only log.

State explicitly on stage: "not implemented for SIH prototype; interface ready."
Point at this ADR, not at code that does not exist.

## Consequences

- Good: offline judging survives Wi-Fi death; one-command boot; deterministic audit;
  no billing/key risk; honest scale story without regression risk before selection.
- Bad: sync JSON races at 10k concurrent (say so); `npm test` is syntax-only;
  sessions in `localStorage`; no pagination. All accepted for Idea stage, all listed
  in `selection-tech.md` §2.
- Never do before selection: Postgres migration, React rewrite, LLM billing, SMS
  gateway, `npm update` on stage. Each breaks the demo for zero screening ROI.

## References

- `selection-fit.md` P1-1 (pilot intent), `selection-tech.md` §3a–§3c (eval transparency,
  this ADR, determinism narrative), `README.md` honesty-first + banned-words list,
  `DEMO_SCRIPT.md` reset/read order, `server.js:236-238` single-writer comment.
