# ADR 002 — Why No LLM (deterministic rules + TF-IDF baseline; capped LLM is Phase-2 cited-only)

Status: Accepted (2026-09-27) · SIH 26130 Udyog Sarthi · Selection-tech §3b
Scope: `server.js:785-880` knowledge engine (verified 2026-09-27: corpus 785 / search 797 / eval 866 / localize 880) + `data/seed.js` K01–K60. No PPT/PDF touched.

## Context

The PPT filename contains `AI`, but the codebase contains zero learning systems.
Judges will probe "show the model / train-test split / Marathi query / paraphrase."
The honest answer must be ready before the question: we ship deterministic rules +
lexical retrieval today, and a tightly capped LLM only in Phase-2, cited-only,
human-in-loop. Anything else is AI-washing and fails technical screening in 60 seconds
(`selection-fit.md` R2, `selection-tech.md` §4 never-claim list).

What we actually have (verified):

- Checklist / SLA / risk / eligibility = hardcoded lookups. `HAZARD` + `SIZEB` tables,
  `risk = 10 + hazard + size + 4*inspections + 6*queries − verified%`, clamped 5–98.
  Bands Green <35 / Amber 35–65 / Red >65. Weights visible in app; `K52/K53/K54`
  label it `"Demo heuristic v0 — no ML model"` / `"uncalibrated"`.
- Knowledge search = 1970s TF-IDF cosine over 60 hand-written Q/A (`tfidfSearch:797`,
  `knowCorpus:785`, `evalKnowledge:866` localize `880`, verified 2026-09-27 via grep). Lowercase tokenize, stopword strip,
  `tf/dl * idf`, cosine + `0.02*tagHit`. No embeddings, no stemming, no Marathi
  morphology. Recomputes `df/idf` per query (`O(N*V)`), fine for 60 docs, not for
  6000 GR PDFs (no index, no cache — say so).
- Eval = 32 hand-labelled queries (original 8 `K03/K01/K04/K26/K22/K25/K08/K16` kept verbatim + 24 adversarial Hinglish/typo/single-keyword/Marathi-fail/near-synonym), `n=32 correct=19 acc 0.594` ungamed
  with misses `K40-vs-K03 + K23-vs-K22` published (verified 2026-09-27). Corpus and queries share an
  author, so `n=32` is overfit illustrative by construction and has limited statistical power.
  Exposing `GET /api/knowledge/eval` with `{n, correct, accuracy, details}` + `tookMs`
  per search is the honesty shield — most teams fake it.
- UI strings toggle EN/MR (160 keys, 160/160 blanks 0, verified 2026-09-27), but K01–K60 + schemes + officer remarks are
  English-only today. `ktok` splits Devanagari but has no Marathi synonyms; a Marathi
  query scores ~0 unless showing failure (see §3a adversarial set). Top-20 `a_mr`
  human translations land first (U4); rest fall back to English with an explicit badge.

## Decision

No LLM / embeddings / vectorDB / paid API for the SIH prototype. Reasons (all five
must be spoken together; dropping one invites "just add GPT"):

1. **Offline.** Judging halls and rural MIDC offices lose net. `npm start → :3000`
   must work with no key, no billing, no egress. An LLM API breaks the strongest
   asset (one-command offline) for a novelty point.
2. **No key / no billing.** No secrets to leak, no per-query cost, no quota death
   mid-demo. `GET /api/demo/status` already discloses demo passwords (risk-accepted
   for judging, must remove in prod) — adding an LLM key would be a second secret
   to mishandle.
3. **Deterministic + auditable.** SLA clock `slaStartedAt` immutable, terminal
   immutability, Group-D gating (`CTO before CTE` → `400`), server-side doc
   validation ignoring client `passed` (`422`), SHA-256 tamper guard, append-only
   audit. A black-box LLM cannot cite `slaDays` + `validityDays` deterministically;
   govt judges prefer explainable rules for legal-adjacent answers.
4. **Marathi low-resource.** Legal Marathi paraphrases (`parwana/parwane`, Hinglish
   mixes, typos like `deemd aproval`) defeat both TF-IDF and a generic LLM without
   a curated eval set. Shipping unmeasured "multilingual NLP" would be caught live.
   Roadmap is human-translated `a_mr` first (measured), embeddings later (measured).
5. **Hallucination risk in legal context.** Every K-article is labelled
   `"Illustrative — confirm with …"` because SLAs/fees/validities have no GR number
   cited. An LLM would invent GR numbers fluently. The prototype must never generate
   legal advice without a source; it ranks hand-written summaries and shows
   `scores + matched terms + source + confirm-with-GR` on every card.

## Phase-2 capped LLM (designed, NOT built)

Only after pilot intent (Sinnar × 3 × 20 × 4w) + top-20 `a_mr` + `n=32 acc 0.594` eval live (historic `n>=30` gate met, misses published):

- Retrieval-augmented, cited-answers-only: LLM may rephrase the top TF-IDF hit(s)
  but must attach `article-id + source + score`; no source → no answer, route to
  human review queue. No legal advice without source.
- Caps: allowlisted prompts, max tokens, per-day budget, PII redaction, DPDP consent
  log, India residency. All answers logged to audit with prompt version.
- Eval gates promotion: `n=32` (incl. Hinglish/Marathi/typo adversarials, `correct=19 acc 0.594` ungamed) + citation
  precision published on `#/knowledge`; failure cases (`K03/K40` near-synonyms) stay
  visible. If precision < threshold, ship stays TF-IDF-only.
- Infra: Postgres `documents` (hashes) + S3 bytes + Tesseract.js OCR (expiry/name +
  confidence) feed the validator before any LLM sees the text.

## Consequences

- Good: zero hallucination, zero cost, zero net dependency; eval honesty (`n=32 acc 0.594` in
  24pt font) becomes a trust signal; deterministic proofs (gate-400, sniff-422,
  auto-deemed) carry the demo while knowledge search stays labelled "lexical help
  search, not legal advice."
- Bad: `n=32 acc 0.594` looks honest but low to an ML judge; Marathi queries fail today (show
  the failure, do not hide it); no semantic paraphrase. All accepted and disclosed.
- Never claim: `ML risk predictor`, `LLM/RAG running`, `OCR working`, `multilingual
  NLP`, `DigiLocker live`, `measured 60→21`. Honest script: "Rule engine + TF-IDF
  retrieval (no LLM) + metadata validation (422) + SLA sweeps + live counters;
  capped LLM is Phase-2 cited-only — see this ADR."

## References

- `selection-tech.md` §1 (why rules are not AI) + §3a (eval transparency) + §4
  (never-claim list), `selection-fit.md` R2 (numbers/AI-washing kill-shot) + P1-2
  (option A: TF-IDF + n>=30 + top-20 MR), `server.js` TF-IDF + eval + `meta.method`
  strings, `data/seed.js` K-article `source` labels.
