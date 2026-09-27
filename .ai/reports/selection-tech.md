# SIH Selection — Harsh Technical Audit (No Hype)

Date: 2026-09-27 · Auditor: CTO · Scope: `package.json`, `server.js` (~1583 lines), `public/app.js`, `data/seed.js`, `.ai/reports/security-remaining.md`
Mode: selection screening, technical judges, 5-min demo + Q&A. Harsh truth only.

## Verdict: DEMO-STRONG, PROD-WEAK, AI-WEAK — selectable IF you stop calling rules "AI"

You have a working single-window workflow demo (wizard → filing → SLA → deemed → inspection linkage → grievance escalation → renewals → audit) with real server-side validation and honest code comments. That is rarer than most SIH teams who show Figma + PPT.

But on a strict technical screen you lose on three axes: (1) no database, (2) no learning system, (3) no scale evidence. A technical judge will pass you on execution + honesty, and fail you if you oversell. Your current code is admirably honest (`meta.method: "TF-IDF cosine (no embeddings, no LLM)"`, `source: "Illustrative — confirm with..."` on all 60 K-articles, `SEED frozen` analytics rule). Your PPT filename `Udyog-Sarthi-AI-SIH26130-IDEA-PPT.pptx` is the opposite — it promises AI you don't have. Fix the story before judges read the code.

---

## 1. Is Express + JSON + TF-IDF (1 dep, no LLM, no DB) enough to be called "AI"?

**No. Call it what it is: deterministic rules + lexical retrieval. Judges will call it shallow if you say "AI".**

What you actually have (verified in code):

- **Checklist / SLA / risk / eligibility = hardcoded `if` + lookup tables.** `server.js:307-343`: `HAZARD = {Chemicals:35, IT:2...}`, `SIZEB = {Micro:0...Large:26}`, `risk = 10 + hazard + size + 4*inspections + 6*queries - verified%`. No training, no weights learned, no evaluation against real outcomes. `K52/K53/K54` admit this (`"Demo heuristic v0 — no ML model"`, `"uncalibrated"`). Good honesty. Not AI.
- **Knowledge search = 1970s TF-IDF cosine over 60 hand-written Q/A.** `server.js:769-837`: tokenize lowercase, stopword strip, `tf/dl * idf`, cosine + `0.02*tagHit`. No embeddings, no stemming, no Marathi morphology (stop list has ~60 Hindi tokens like `ek,ka,ki,ke` but no stemmer — `tfidfSearch` will fail on `parwana` vs `parwane`, Hinglish paraphrases). Works for 60 docs, dies at 6000 GR PDFs (recomputes `df/idf` per query, O(N*V), no index, no cache).
- **Eval = 8 hand-labelled queries, P@1.** `KNOW_EVAL` (K03/K01/K04/K26/K22/K25/K08/K16) — you wrote both corpus and queries, so accuracy is near-100% by construction (overfit). n=8 has zero statistical power. A judge asking "show train/test split" or "try a paraphrase not in your 8" will break it live. The fact you expose `GET /api/knowledge/eval` with `{n, correct, accuracy, details}` is excellent honesty — most teams fake it. But n=8 advertised as "eval" looks student-grade to an ML judge.
- **1 dep (express) + JSON file is a feature for deployability, a liability for credibility.** `loadDb()` does `readFileSync(db.json)` on EVERY request including `authSession` (`server.js:144-149`), `saveDb` rewrites whole file. Synchronous blocking event loop, no connection pool, no transactions. Atomic rename (`writeDbAtomic:240-249`) prevents half-write corruption but does NOT prevent lost-update race (two concurrent `read-modify-write` interleave). In-memory `LOGIN_FAILS`/`REGISTER_ATTEMPTS` maps reset on restart. `sessions` capped at 200 rows inside the same JSON file — every login rewrites all applications + history. A judge opening two browsers and filing simultaneously can corrupt/lose a filing. That's fine for a judging laptop, indefensible as "scalable".

**Will technical judges call it shallow?** Yes, if your slide says "AI-powered risk prediction / intelligent chatbot / ML scorer". No, if your slide says "Explainable rule engine (auditable weights) + offline lexical retrieval baseline (TF-IDF, no hallucination, no API key)". Govt judges actually prefer the second — black-box LLM cannot cite GR numbers, your engine cites `slaDays` + `validityDays` deterministically. Lean into that.

Bottom line: you have **good software engineering (validation, RBAC, audit, gating, renewal math), zero machine intelligence.** Score it as such.

## 2. Biggest technical holes vs SIH expectations

Ranked by probability a judge probes them:

1. **No database. JSON file is not a DB.** No indexes, no queries, no ACID beyond single-file rename, no pagination (`GET /api/applications` returns all + `enrichApp` per track), no migration story in code (`loadDb` migrates in-memory only). SIH rubric "scalability / deployment" fails: single Node process, `express.json 2mb` + `express.raw 12mb`, sync I/O, `setInterval` sweep every N sec rewriting file. 100 concurrent applicants = event-loop stall + lost writes. You document `"single demo server is the supported topology"` (`server.js:236-238`) — honest, but judges want a prod path.
2. **Auth is demo-grade, publicly documented as insecure.** Passwords `demo123/officer123/admin123` returned plaintext on unauthenticated `GET /api/demo/status` (`server.js:1028-1032`, accepted as INFO in security audit). Legacy 3 users use global-SHA (`sha256(salt:email:pw)`, no stretch), new users scrypt (good) but sessions are random-hex stored in `db.json`, sent as `Bearer` in `localStorage` (XSS-stealable), no HttpOnly cookie, no HTTPS, no helmet/CSP, rate-limit in memory only. Fine offline; any "secure / production-ready" claim is instantly disproven by your own `/api/demo/status`.
3. **AI novelty = 0.** No learning, no embeddings, no evaluation at scale, no Hindi/Marathi retrieval despite `i18n.json` EN/MR toggle (toggle is UI strings only — corpus is English-only, `ktok` splits Devanagari but has no Marathi synonyms). `eligibleSchemes` is `investment*0.25` linear (`server.js:494`) — a judge economist will laugh if called "benefit prediction". Analytics `history` is 38 hand-typed rows (`seed.js:141-161`, `avgOld=60 avgNew=21`) — illustrative, not measured. `SEED frozen + live separate` rule is correct honesty, but the headline "52% time saved" on synthetic data is not evidence.
4. **File handling is clever but fragile.** Zero-dep manual `parseMultipart` (`server.js:618-652`) + magic-byte sniff (PDF/PNG/JPEG) + SHA-256 duplicate/tamper guard is genuinely impressive for 0 deps. But: no virus scan, no S3/object store, `hash` stored but bytes discarded (vault holds filename records only — `K34` admits `"no file bytes"`), 10MB limit, latin1 header decode edge cases. A judge asking "where is the PDF stored?" gets "nowhere — we hash and drop bytes". Don't call it "DigiLocker integration" (you correctly don't in code; don't in PPT).
5. **No tests, no perf numbers.** `npm test` = `node --check` syntax only. No unit test for `riskScore`, `trackSla`, `gateBlockedReason`, `docMatches`, no concurrency test, no latency numbers (`tookMs` exists per query but never aggregated to p50/p95). A "performance / reliability" question has no answer except "works on my laptop".
6. **Data authority gap.** All SLAs (`Udyam 3d ... CTO 60d`), fees, validity (`CTO Red 5y/Green 10y`), hazard weights, 60 knowledge answers are `Illustrative — confirm with...` (correct label). A domain judge from Maharashtra Industries/MPCB will ask "cite the GR number for 21-day Fire Provisional". You have none. This is the highest selection risk — not code, but credibility. One wrong SLA number presented as fact = fail.

## 3. The 2–3 legit upgrades that most increase selection chance (no faking, ~1 day total)

Do these, nothing else. Everything else adds regression risk before screening.

### (a) Publish the honest eval + failure cases in the UI (2 hours, highest ROI)

You already have `GET /api/knowledge/eval` and `tookMs` per search. Surface them.

- Add to `#/knowledge` page: badge `TF-IDF cosine · corpus 60 · P@1 8/8 (n=8, hand-labelled, overfit — illustrative)` + `tookMs` per query + expandable `details[]` (q/expect/got/hit). Add 4 adversarial queries you KNOW fail (Hinglish paraphrase, Marathi query, single-keyword `CTO`, typo `deemd aproval`) and show them failing. Judges trust a team that shows failure 10x more than a team claiming 100%.
- Add `GET /api/health` latency to landing footer or analytics: `p50/p95` from 50 local `curl` loops (just run `node -e` loop, paste numbers into README, don't build infra). Even `p95 <50ms localhost, n=50` beats "scalable" with no number.
- Keep method string exactly: `"TF-IDF cosine (no embeddings, no LLM)"`. That sentence is your shield.

Why it wins: turns your weakest axis (AI) into strongest signal (measurement honesty + explainability). Technical judges select for evaluation rigor, not model size.

### (b) One-page honest architecture diagram + ADR: demo vs prod (3 hours, zero code risk)

Don't migrate to Postgres tonight (regression risk). Write `docs/adr/001-demo-vs-prod.md`:

- **Demo topology (today, judged):** single Node 18, Express 4, `data/db.json` (atomic rename, single-writer), in-memory rate limits, `localStorage` Bearer, manual multipart, TF-IDF in-process. Constraints: 1 laptop, offline, 3 roles, <100 applications. Draw it as boxes. Label every arrow with the file:line (`loadDb:250`, `writeDbAtomic:240`, `runSweeps:760`).
- **Prod path (not built, designed):** `loadDb/saveDb` interface already isolates storage → swap to `better-sqlite3` (still 1 file, still offline, but real transactions + indexes) then Postgres + S3 + Redis sessions + HttpOnly cookies + helmet + JWT refresh. State explicitly: "not implemented for SIH prototype; interface ready". Add `docs/adr/002-why-no-llm.md`: offline + no API key + deterministic audit + Marathi low-resource + hallucination risk in legal context.
- Print this diagram as PPT slide 3. When asked "how will this scale?", point to ADR, not code. Staff-level answer with intern-level code.

Why it wins: SIH rewards "deployable in govt office tomorrow" (offline, 1 dep, `npm install` in 30s, Marathi toggle real) + "knows how to scale without hand-waving". You have the first; ADR gives the second without lying.

### (c) Offline-first + determinism narrative with live proof (1 hour, demo script change)

Your real advantages are not AI — they are:

- Offline: `npm start → localhost:3000`, no internet, no key, `Reset demo` footer restores seeds. Time it live (30s install). Rural MIDC offices lose net — this matters.
- Deterministic: SLA clock `slaStartedAt` immutable (`server.js:317-333`, officer touches never move deadline), terminal immutability, Group-D gating (`CTO before CTE impossible` — `server.js:1200-1204` returns 400, genuinely good domain modelling), server-side doc validation ignoring client `passed`, SHA-256 tamper guard, append-only audit. Demo these three live: (1) try to approve Locked CTO → 400, (2) upload renamed `.exe→.pdf` → 422 sniff fail, (3) breach FIRE-PROV via `APP-2026-0157` → auto-deemed + audit row. That's 90 seconds and proves engineering depth no TF-IDF slide can.

Change demo script order: workflow first, knowledge search last (and label it "lexical help search, not legal advice").

## 4. What to NEVER claim (instant fail if caught)

- **Never say ML / deep learning / predictive AI / LLM / chatbot with understanding.** You have linear arithmetic + cosine similarity. Saying "ML risk predictor" when weights are `Chemicals:35` hardcoded is fabrication. Say "heuristic v0, weights visible, ML roadmap".
- **Never say DigiLocker / NSWS / EntityLocker integration.** `K33/K34` + vault code store filename strings only, no bytes, no API. Say "vault mirrors the reuse pattern; no live API".
- **Never say production-ready / scalable / secure / encrypted.** Passwords are public on `/api/demo/status`, sessions in `localStorage`, no helmet, JSON races, 200-session cap, sync I/O. Say "offline judging prototype, single-writer; prod needs Postgres + cookies + helmet (see ADR)".
- **Never present seed numbers as measured impact.** 38 history rows, `PSI 40% subsidy`, `SLA 21/30/45/60d`, `validity 5y/10y`, hazard/size bumps are illustrative. Every K-article already says `"Illustrative — confirm with..."` — repeat that prefix on every PPT chart. Saying "reduced approval time 60→21 days" without field data is the fastest way to lose a govt judge.
- **Never say Marathi AI / multilingual NLP.** `i18n.json` toggles chrome labels; corpus + risk + validation messages are English. A Marathi query will score ~0. Don't demo one unless showing failure (see 3a).
- **Never say blockchain / real deemed legal validity / real GR citation.** Your deemed certificate is a demo status flip + audit row, not a legal instrument. Say "workflow models the Facilitation Act pattern; legal validity needs dept notification".
- **Never hide `n=8`.** If eval slide omits sample size, technical judge assumes deception. Put `n=8` in 24pt font.

---

## Decision-framework scores (1-5, 5=best)

| Criterion | Score | Reason |
|---|---|---|
| Scalable & maintainable | 2 | Clean module boundaries (`loadDb` isolatable, rule tables data-driven), but sync file I/O per request, no DB, no pagination, single process. Maintains well for demo, scales to nobody. |
| Follows architecture principles | 3 | Good domain modelling (immutable SLA clock, terminal states, Group-D gating, append-only audit, server-trusts-nothing validation). Violates persistence + statelessness (file + in-memory limits). |
| Technical debt impact | 3 | Deliberate debt (JSON over DB, TF-IDF over embeddings) is documented and reversible. Inadvertent debt: auth in `db.json`, sweeps on read + post-response save (crash window), manual multipart fragility. 20% sprint to SQLite would clear most. |
| Meets security requirements (demo) | 3 | Demo-adequate: hashed pw, expiring tokens, RBAC, 401/403/429, audit-gated, XSS `esc()`. Prod-inadequate by design (public demo creds, localStorage, no helmet/HTTPS). Correctly risk-accepted per security audit PASS. |
| Team capable of implementing prod path | 4 | Evidence: zero-dep MIME sniff + hash guard, gate logic, renewal band math, eval harness — shows the team can build the boring hard parts. Needs DB + testing discipline, not new talent. |

Overall: **3.0 — select as prototype, reject as product.** Which is exactly what SIH Idea stage funds.

## Recommendation

**Ship as-is for selection. Change the story, not the stack.**

1. Rename the narrative from "AI platform" to "Offline single-window workflow with explainable rules + lexical help search". Keep the PPT filename change: drop `-AI-` or qualify as `rules+retrieval`.
2. Implement only 3(a) eval transparency (2h). Write 3(b) ADR diagram (no code). Rehearse 3(c) live proofs (gate-400, sniff-422, auto-deemed).
3. Pre-zip: `POST /api/reset?demo=1`, verify `analytics 38/38/0`, exclude `node_modules/db.json/.ai/reports/ppt-slides` per security audit §3. Never `npm update` on stage.
4. In Q&A, volunteer the weaknesses before asked: "JSON single-writer, n=8 eval, illustrative SLAs — here's the prod path". Judges select honest teams they can mentor; they eliminate hype teams they can't trust.

Trade-offs considered: SQLite migration tonight would add real transactions (+2 scalability points) but risks breaking `loadDb` migrations + seed + demo script with no test suite to catch it — rejected for selection week. Adding an LLM API would add novelty (+1 AI point) but breaks offline, adds key cost, hallucinates legal answers, and contradicts your best asset (determinism) — rejected. Showing failure cases costs 5% polish, gains 50% trust — accepted.

---
*Files read: `package.json` (express ^4.19.2 only), `server.js:1-1583` (auth 27-230, TF-IDF 769-837, eval 819-837, sweeps 693-767, doc validator 524-600, multipart 618-667), `public/app.js:1-617` (Bearer, guards, wizard), `data/seed.js:1-247` (3 users, 12 approvals, 60 K-articles all labelled illustrative, 38 history rows), `.ai/reports/security-remaining.md` (PASS, 0 blockers). Not read per scope: PPT/PDF, index.html/styles — no claim made about them.*
