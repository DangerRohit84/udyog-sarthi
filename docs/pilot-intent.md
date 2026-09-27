# Pilot Intent — Sinnar MIDC (measured-numbers plan; all numbers below are *Seed projection until logs exist)

Status: Draft intent (2026-09-27) · SIH 26130 Udyog Sarthi · Selection-fit P1-1
Scope: paper + 1 meeting. No fake pilot data. No PPT/PDF touched.

> Every number in this repo marked `*Seed projection` is an illustrative file-backed
> baseline (38-row `data/seed.js` history: `avgOld 60 → avgNew 21 days*`,
> `incomplete 41% → 12%*`), not measured pilot data. Saying `measured` once is an
> auto-ding (`selection-fit.md` R2). This doc is the plan that turns `*` into measured.

## 1. Boundary (small enough to run, real enough to matter)

- **Site:** Sinnar MIDC, Nashik (already in wizard dropdown + seed `APP-2026-0142`).
- **Approvals (3):** Udyam Registration + Single-Window Acknowledgement (`DOI-UDYAM`,
  3d), Shops & Establishments Registration (`LABOUR-SHOP`, 7d), Provisional Fire NOC
  (`FIRE-PROV`, 21d). All Group A/B day-1-capable; no Group-D gating confounds the
  first 4 weeks. CTO/Final-Fire stay out of scope until CTE compliance exists.
- **Users (20):** 12 applicants (food-processing + textile micro/small units in
  Sinnar/Satpur/Ambad belt), 6 officers (MIDC 1, Labour 2, Fire 1, DIC 1, DOI 1),
  2 admins (DIC Sinnar + team). Single-window desk + CSC-assisted filing for
  low-bandwidth applicants.
- **Weeks (4):** W1 onboarding + baseline freeze, W2–W3 live filings with SLA clocks,
  W4 readout + retr-enewal check. Owner signs weekly 30-min review.

## 2. Owner (named intent, not invented logs)

- **Owner sought:** DIC Nashik / Sinnar MIDC executive engineer (name + email intent
  letter pending — 1 email + 1 visit; letter filed here when received, never faked).
- **What the letter says (template, 1 page):** site + 3 approvals + 20 users + 4 weeks,
  data-use consent, weekly review slot, permission to publish before/after averages
  with `n=` denominators. No commitment to adopt; intent to measure only.
- **Until the letter lands:** speak "owner intent pending, Sinnar MIDC executive
  engineer approached" — never name a person who has not signed. An intent + plan
  beats invented logs (invented = disqualify).

## 3. Costed stack (laptop + npm today; Phase-2 priced, not purchased)

| Item | Pilot (4w, offline-first) | Phase-2 (if pilot justifies) |
|---|---|---|
| Compute | Team laptop + `npm install` (30s), `PORT 3000`, no cloud bill | `better-sqlite3` → Postgres + Prisma (tables: `approvals`, `tracks` with `slaStartedAt`, append-only `audit`, `documents` with hashes) |
| Storage | `data/db.json` single-writer, `POST /api/reset?demo=1` for clean runs | S3-compatible bytes + virus scan; Redis sessions + idempotency keys |
| Auth | Demo logins (`udyog@demo.in/demo123`, officer/admin) + 12h Bearer; prod secrets removed from `/api/demo/status` | HttpOnly cookies + refresh rotation + helmet/CSP + Redis rate-limit |
| Retrieval | TF-IDF in-process, no key, `n=32 correct=19 acc 0.594` ungamed baseline (8 kept + 24 adversarial, misses published, verified 2026-09-27) | Capped LLM cited-only (allowlisted prompts, token cap, per-day budget) + `n=32` eval + citation precision |
| OCR | Metadata validation only (`422` on forgery; bytes/OCR is Phase-2) | Tesseract.js infra (expiry/name extract + confidence + human queue) |
| Comms | Polling alertstrip; no SMS/push claimed | SMS gateway estimate (per-SMS + gateway fee, volume-capped, DLT template) — priced only if officers demand push |
| People | 20 users × 4w, CSC desk 2 half-days/week, weekly 30-min review | Dept data-entry + audit clerk if filing volume >50/wk |

All Phase-2 lines are estimates for the backup slide, not purchase orders.

## 4. DPDP + residency (one paragraph the judge can quote)

Data stays in India (pilot laptop + DIC office copy; no cross-border transfer).
Consent taken at registration (purpose: approval facilitation + pilot measurement;
retention: pilot + 90 days, then anonymised aggregates only). Applicants see only
their own rows (server-enforced 404/403); officers see pendency queue only;
`GET /api/audit` is officer-only. PII (Aadhaar/PAN/bank) never stored beyond vault
filename records in pilot; bytes hashed and dropped. Grievance timelines travel with
the case; speaking orders required to close. Any LLM Phase-2 adds PII redaction +
prompt-version logging before inference.

## 5. Before/after measurement (what moves, with denominators)

Frozen baseline (today, `*Seed projection`, never moves): `avgOld 60 → avgNew 21*`
over 38 illustrative rows, `incomplete 41% → 12%*`, `seedHistoryCount 38`. These are
targets, not evidence.

Pilot measures (W1 freeze → W4 readout, all with `n=`):

- **Avg days to decision** per approval (Udyam/Shops/Fire-Prov): before (dept register
  lookback, `n=` stated) vs after (SLA-clock logs from `slaStartedAt → updatedAt`,
  `n=` stated). Reported as `avg ± p50/p95`, live rows kept separate as
  `avgNewLive/liveHistoryCount` (same rule as `GET /api/analytics`).
- **Return / query rate:** `% Queried` before (file sample) vs after (pre-validation
  `422` + completeness % logs). Mechanism is real; percentage becomes measured only here.
- **SLA visibility:** `% tracks with live countdown + deemed/escalation fired` (audit
  rows `auto-deemed` / `auto-escalate` / `unlock` counted). Target: 100% visible,
  0 silent breaches.
- **Officer time:** median `Applied → first action` hours per dept (from audit `ts`).
- **Applicant burden:** filings per approval (vault reuse count), CSC assists, Marathi
  usage (`us_lang=mr` share + `?lang=mr` fallback rate).

Readout rule: every chart shows `*Seed projection` vs `pilot measured (n=…)` side by
side, with `basis` string quoted from `/api/analytics`. If `n<10`, say "directional,
not significant" — honesty outranks a big number.

## 6. Risks + kill-switch

Hall risks (port busy, IPv6, dirty `db.json`) are in `DEMO_SCRIPT.md` break-table.
Pilot risks: officer transfer (deputy named in letter), low filing volume (extend 2w,
do not invent rows), Marathi query failure (show fallback badge, log for `a_mr`
expansion), power/net loss (offline-first laptop continues; sync when back).
Kill-switch: any DPDP complaint → pause filings, keep read-only tracker, purge PII
per retention line above.

## References

- `selection-fit.md` P1-1 acceptance (owner + cost + DPDP + before/after, no `measured`
  claim), `selection-tech.md` §3b–§3c (ADR + determinism proofs), `README.md`
  honesty-first + `*Seed projection` rule, `DEMO_SCRIPT.md` reset/read order,
  `docs/adr/001-demo-vs-prod.md` + `002-why-no-llm.md`.
