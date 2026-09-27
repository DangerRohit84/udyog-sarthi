# PPT Review — SIH-26130 Shortlist Truth (BRUTAL)

File: `D:\SIH\udyog-sarthi\Udyog-Sarthi-AI-SIH26130-IDEA-PPT.pptx`
Extract source: `D:\SIH\udyog-sarthi\.ai\reports\ppt-extract.md`
Date: 2026-09-09 | Reviewer: Junior Dev (harsh judge mode)
Method: python-pptx full text + zip media audit + keyword counts. No sugarcoat.

## VERDICT: NOT SHORTLIST-READY — REJECT IN CURRENT FORM

**Score: 4.0 / 10**

| Criterion (SIH judge lens) | Score /10 | Why |
|---|---|---|
| Title / compliance | 3 | PS ID/title/theme correct, but Team ID + Team Name = `[Team ID]` / `[Team Name]` on ALL 8 slides. Instant reject signal. |
| Idea clarity | 6 | Problem → solution flow is coherent, but overloaded S2 (172 words, 3 sections crammed). No scope boundary. |
| Tech approach | 4 | Stack list is plausible (React/Node/Mongo/RAG/OCR/workflow) but zero depth: no model, no embeddings, no vector DB, no OCR engine, no API spec, no data flow diagram. |
| Feasibility | 4 | Risks listed, mitigations are slogans ("versioned KB", "API-ready"). No timeline, no MVP scope (which industries? which 5 approvals?), no cost, no team capacity. |
| Impact | 3 | Zero numbers. No baseline (current days/rejections), no target (X% faster), no pilot metric. Pure adjectives. |
| Innovation / differentiation | 4 | 7 buzzwords, no proof vs MAITRI/NSWS. MAITRI mentioned 0 times — fatal for Maharashtra PS. |
| References | 2 | 4 generic buckets, 0 URLs, 0 dates, 0 section numbers. Unverifiable. |
| Visual evidence | 1 | 0 tables, 0 real diagrams, 0 screenshots. Only 2 reused banner PNGs. S3 "Architecture" + "Flowchart" are text boxes. |

Pass mark for SIH internal shortlist is ~7.5. This is 3.5 points short. Do NOT submit.

---

## Official SIH 6-slide mapping vs actual 8

Official: 1 Title, 2 Idea, 3 Tech Approach, 4 Feasibility, 5 Impact, 6 References.

- S1 → Official #1 Title: OK in content, FAIL in hygiene (unfilled team, DEFAULT layout, not SIH master).
- S2 → Official #2 Idea: OVERLOADED. Challenge + Solution + Why Different + Value Prop on one slide (36 shapes). Should be split or trimmed to <90 words + 1 flow visual.
- S3 → Official #3 Tech Approach: TEXT-ONLY architecture + TEXT-ONLY flowchart + 9-line stack list. No diagram, no sequence, no RAG pipeline. FAIL on evidence.
- S4 → Official #4 Feasibility: 5 risks + feasibility para + resources + aligned-with + implementation. No timeline/Gantt, no MVP scope, no cost, no staffing. PARTIAL.
- S5 → Official #5 Impact: 4 stakeholders + broader impact, zero quantification. FAIL on numbers.
- S6 → EXTRA — INNOVATION & KEY DIFFERENTIATORS: Not in official 6. Either merge into S2 or delete. Keeping 8 slides when SIH mandates 6 = template violation, judges deduct for non-compliance.
- S7 → Official #6 References: Generic, no links. FAIL on verifiability.
- S8 → EXTRA — THANK YOU: Not in official 6. Delete or merge into S7 footer. Also introduces 2nd product name.

**Template violations:**
1. 8 slides vs mandated 6 (+33% overflow).
2. All slides `layout=DEFAULT`, `placeholders=0` — not SIH template master. Looks like Canva/Gamma export.
3. `[Team Name]` / `[Team ID]` left on S1–S8. S1, S8 footer still placeholder.
4. Two product names: `UDYAMSETU AI` (S2 header, S2 footer, S6 comparison) vs `Udyog Sarthi AI` (S8 title, filename). Pick ONE. Judges will ask "what is your product called?" and you will stammer.
5. Footer inconsistency: S2 `@SIH Idea Submission - UdyamSetu AI` vs S8 `Team [Team Name] | SIH26130 | Govt of Maharashtra`.

---

## TOP 5 FATAL GAPS + EXACT FIXES

### F1 — Unfilled identity + naming split (reject in 10 seconds)
- Evidence: `Team ID- [Team ID]`, `Team Name- [Team Name]` S1; `[Team Name]` header S2–S7; S2=UDYAMSETU AI vs S8=Udyog Sarthi AI.
- Fix (30 min): Decide ONE name TODAY (recommend `Udyog Sarthi AI` to match filename + PS). Global find-replace `UdyamSetu|UDYAMSETU` → chosen name. Fill Team ID + Team Name on S1 master + headers/footers. Re-export + re-extract to verify zero `[Team` hits: `grep -r "\[Team" ppt-extract.md` must return 0.

### F2 — Zero MAITRI, superficial NSWS (PS is Maharashtra-specific)
- Evidence: MAITRI=0 hits, NSWS=2 generic mentions, "future integration with portals" x3 with no API/field mapping.
- Fix (2–3 hrs): Add 1 comparison TABLE on Idea slide (or Feasibility): columns = Feature | MAITRI (today) | NSWS (today) | Udyog Sarthi (delta). Rows: approval personalization, pre-validation, SLA prediction, renewal tracking, Marathi/explainability. Cite MAITRI portal sections + NSWS KYA (Know Your Approvals) page with URLs + accessed date. Explicitly state: "We complement, not duplicate: ingest MAITRI/NSWS master data via [scrape/API/mock for MVP], add intelligence layer on top." Without this, judge Q "How are you different from MAITRI?" kills you.

### F3 — No evidence: 0 diagrams, 0 tables, 0 screenshots, 0 numbers
- Evidence: 2 PNGs reused as banners; S3 architecture/flow = text boxes; tables=0; numbers only 2026/26130; %, days, accuracy all 0.
- Fix (1 day, highest ROI):
  - Draw 1 real architecture diagram (5 boxes + arrows: UI → API → Workflow Engine + RAG (embeddings + vector DB + LLM) + MongoDB + OCR) — export as PNG, replace banner on S3.
  - Replace S3 text flowchart with horizontal 7-step visual with icons.
  - Add 1 dashboard mock screenshot (entrepreneur roadmap + officer SLA view) — even Figma wireframe is 10x better than nothing. If no prototype, label "Wireframe — MVP target".
  - Add 1 quantified impact strip on S5 with BASELINE → TARGET + disclaimer: e.g., "Baseline (to validate in pilot): ~X days avg. for [2 MSME approvals in Pune] → Target: -Y% resubmissions via pre-validation (to measure in 4-week pilot with N=20 applications)". NO fake precision — label targets as targets, with pilot plan (N, duration, metric). Judges punish invented 80%/50% more than honest "to be measured".

### F4 — AI-washing: LLM+RAG+OCR as magic words
- Evidence: AI=16, RAG=8, LLM=3, OCR=2, but no model name, no embedding, no chunking, no eval, no hallucination guard, no language handling.
- Fix (3 hrs): On S3 replace stack dump with RAG pipeline (5 steps): Ingest (India Code + MAITRI circulars PDFs) → Chunk (512 tokens, overlap) → Embed ([model, e.g., multilingual-e5]) → Retrieve (top-k=5, vector DB [e.g., Mongo Atlas Vector / pgvector — pick one, Mongo already listed]) → Generate ([LLM, e.g., …] + citations + "unknown if not in KB" guard). Add: OCR engine (e.g., Tesseract/AWS Textract — pick one), doc classifier, confidence threshold + human review queue, Marathi support plan. Add 1-line hallucination + privacy guard: "No answer without source chunk; PII encrypted; audit logs." If undecided, write "TBD between A/B, decision by [date]" — honesty > buzzwords.

### F5 — No MVP scope, timeline, cost, or pilot (infeasible as stated)
- Evidence: "phased rollout", "select industries", "limited set" — never named. timeline=1 (word only), cost=1, pilot=0, MVP=1 (word only).
- Fix (2 hrs): On S4 add: MVP scope box ("Phase 1: 2 industries [e.g., food processing + light engineering] × 5 approvals [list them] × 1 district [Pune]"), 12-week Gantt (Wk1–3 KB + auth, Wk4–6 workflow + OCR, Wk7–9 RAG + dashboards, Wk10–12 pilot N=20 + eval), resource table (hosting, vector DB, LLM API budget, OCR pages), team roles (who builds what). Move "Aligned With NSWS/EoDB/Maha Digital" to 1 line — currently 3 boxes waste space.

---

## Other harsh truths
- **Inconsistent numbers:** There are none to be inconsistent — worse. Every impact verb ("faster", "reduced", "improved") lacks a number. Judges score impact 0 without baseline→target.
- **Missing diagrams/screenshots:** Confirmed by media audit — 2 PNGs total, both banners. S3 claims "System Architecture" + "Process Flowchart" but both are text-box chains. This reads as no-work-done.
- **References:** S7 lists "Maharashtra Government resources", "India Code", "MAITRI facilitation resources" with no URL, no notification number, no date. Add 5–6 dated links (NSWS KYA, India Code Act section, MAITRI service page, EoDB report with page no.) or delete the slide and risk plagiarism flag.
- **S2 overload:** 172 words + 6 flow pills + 7 solution bullets + 3 differentiators + 3 value props. Nothing is readable from 10 feet. Cut to: 4 challenge bullets (keep) + 3 solution bullets max + 1 flow visual. Move rest to S6 or delete S6.
- **Language:** "Intelligent", "AI Approval Engine", "Bottleneck Intelligence" repeated without definition. Define once or drop adjective.

## Minimum fix checklist before resubmission (selection at any cost)
- [ ] ONE product name globally + Team ID/Name filled + 6 slides max (merge/delete S6+S8)
- [ ] SIH master template applied (not DEFAULT layout export)
- [ ] MAITRI vs NSWS vs You table + integration stance + URLs
- [ ] 1 architecture PNG + 1 flowchart PNG + 1 dashboard mock (label wireframe if needed)
- [ ] MVP scope (industries × approvals × district) + 12-week timeline + cost/roles + pilot N + metric
- [ ] RAG pipeline specifics (model/embedding/vector DB/chunking/citation guard) + OCR engine + privacy
- [ ] S5 quantified baseline→target strip labeled as target + pilot validation plan
- [ ] S7 references with clickable URLs + accessed dates + notification/section numbers
- [ ] Re-extract with python-pptx and verify: slides=6, tables>=1, images>=4 unique, `[Team`=0, MAITRI>=3, numbers>=5

Re-extract command: `python extract_pptx.py` → update `ppt-extract.md`, re-score. Do not submit until score >=7.5 on this rubric.
