# PPT Extract — Udyog-Sarthi-AI-SIH26130-IDEA-PPT.pptx

Source: `D:\SIH\udyog-sarthi\Udyog-Sarthi-AI-SIH26130-IDEA-PPT.pptx`
Extract method: `python-pptx` 1.0.2 (Windows, Python 3.10.6) + zip media listing. Fallback (unzip/LibreOffice) NOT needed — primary succeeded.
Date: 2026-09-09

## File meta
- File size: 1124078 bytes (~1.07 MB)
- Slide count: 8
- Slide size: 12192000 x 6858000 EMU (16:9)
- Layouts: all 8 slides = `DEFAULT`, placeholders = 0 (custom deck, NOT SIH master)
- Shapes total: S1=12, S2=36, S3=46, S4=48, S5=23, S6=31, S7=16, S8=5
- Tables: 0 across entire deck
- Images: only 2 unique PNGs reused:
  - `ppt/media/image1.png` (727620 bytes) — reused on S1–S8 as header/banner
  - `ppt/media/image2.png` (350380 bytes) — used only on S1 (second logo)
  - Per-slide picture count: S1=2, S2–S7=1 each, S8=1. No architecture diagram, no flowchart image, no screenshot — all "diagrams" are text boxes.
- Notes slides: 8 present but empty (1627 bytes each, boilerplate)
- Word counts: S1=44, S2=172, S3=149, S4=155, S5=121, S6=100, S7=78, S8=21
- Numbers found by regex: S1=[2026, 26130], S8=[26130], S2–S7=[] (zero metrics, zero %, zero days/hours, zero accuracy)

## Keyword hits (full-deck, case-insensitive)
- MAITRI: 0 — FATAL for Maharashtra PS
- NSWS: 2, Single Window: 2 (generic, no API/deep link detail)
- Maharashtra: 7, Maha: 7
- AI: 16, RAG: 8, LLM: 3, OCR: 2, API: 6, integration: 3
- architecture: 3, SLA: 4, MVP: 1, cost: 1, timeline: 1
- screenshot: 0, diagram: 0, pilot: 0, dataset: 0, accuracy: 0, precision: 0, recall: 0
- %: 0, days: 0, hours: 0
- MongoDB: 3, React: 2, Node: 2, Express: 2, PostgreSQL: 0
- Team placeholders: `[Team ID]` present, `[Team Name]` present on S1–S7 + S8 footer
- Naming: `UdyamSetu` x2 + `UDYAMSETU AI` x1 (S2), `Udyog Sarthi AI` x1 (S8), filename `Udyog-Sarthi-AI` — INCONSISTENT

---

## Slide 1 — Title (SMART INDIA HACKATHON 2026)
- SMART INDIA HACKATHON 2026
- Problem Statement ID – SIH26130
- Problem Statement Title – Efficiency in streamlining industrial approvals, compliance processes, and access to government support services
- Theme – Miscellaneous
- PS Category – Software
- Team ID – [Team ID] (UNFILLED)
- Team Name – [Team Name] (UNFILLED)
- Images: 2 (banner + second logo)

## Slide 2 — Idea: UDYAMSETU AI / Intelligent Industrial Approval & Compliance Platform
- Header: [Team Name] (unfilled) + UDYAMSETU AI + Intelligent Industrial Approval & Compliance Platform
- THE CHALLENGE: Entrepreneurs face multiple portals & unclear approval requirements. / No single source of truth for applicable licences, NOCs & schemes. / Manual document checks cause delays & repeated rejections. / Officers lack visibility into pending cases & bottlenecks.
- Flow strip (text boxes only, no image): Business Profile → Approval ID → Document Checklist → Pre-Validation → Application Workflow → Approval & Compliance
- Our Solution: Unified platform for approvals, licences, NOCs, inspections, renewals & schemes. / Entrepreneur Login: business profile + personalized approval roadmap. / AI Approval Engine: identifies approvals by sector, location, size & stage. / Document Intelligence: checklist generation + pre-validation before submission. / Unified Dashboard: track applications, approvals, renewals & SLA timelines. / Officer Dashboard: monitor pending cases, bottlenecks & workloads. / AI Assistant: explains requirements & next steps in simple language.
- Why Different: Personalized regulatory intelligence, not generic listings. / Proactive document validation before submission, not after. / Workflow optimization across departments.
- Key Value Proposition: Faster, transparent approval journeys for entrepreneurs. / Reduced repetitive scrutiny for departments. / Data-driven bottleneck visibility for government.
- Footer: @SIH Idea Submission - UdyamSetu AI

## Slide 3 — TECHNICAL APPROACH
- Header: [Team Name] + TECHNICAL APPROACH
- System Architecture (text boxes only): React / Next.js UI + Node.js + Express API + LLM + RAG AI Layer + MongoDB + Workflow Engine
- Para: Dashboards call REST APIs; the AI layer answers regulatory questions via RAG over a curated knowledge base, MongoDB stores profiles, applications & compliance records, and the workflow engine coordinates department-wise processing.
- Process Flowchart (text boxes only): Business Profiling → Approval Identification → Document Checklist → Pre-Validation → Application Workflow & Dept. Scrutiny → Inspection & Approval → Renewal & Compliance Monitoring
- Methodology: business profiling → approval identification → document checklist → pre-validation → application workflow → department scrutiny → inspection → approval → renewal & compliance monitoring.
- Tech Stack Used: React.js / Next.js / Node.js + Express (REST APIs) / MongoDB (profiles, applications, compliance) / LLM + RAG (regulatory Q&A) / Rules / Decision Engine (approval mapping) / OCR + document classification / Workflow engine (SLA & parallel processing) / Email / SMS / push notifications / Role-based access, encryption & audit logs

## Slide 4 — FEASIBILITY AND VIABILITY
- Header: [Team Name] + FEASIBILITY AND VIABILITY
- Risk Assessment and Mitigation (5 pairs):
  - Complex & frequently changing regulations → Versioned regulatory knowledge base with source references
  - Incomplete or incorrect applications → AI-assisted checklist & pre-submission validation
  - Different departmental workflows → Configurable engine for parallel, dept-specific processes
  - Sensitive business documents & data privacy → Role-based access, encryption, secure storage, audit trails
  - Government system integration → API-ready architecture for future integration with portals
- Technical Feasibility: Built on proven web, database, AI & document-processing technologies, enabling rapid MVP development. / Modular architecture: launch with a limited set of industries & approvals, then expand.
- Resource Requirements: Cloud hosting infrastructure. / Document storage & OCR processing capability. / LLM / AI API access for the RAG assistant. / Role-based authentication system.
- Aligned With: National Single Window System (NSWS) / Ease of Doing Business Initiatives / Maharashtra Digital Governance
- Implementation Approach: Phased rollout starting with select industries & approvals. / Configurable engine, adaptable to other departments in future phases. / Designed for future integration with existing government portals.

## Slide 5 — IMPACT AND BENEFITS
- Header: [Team Name] + IMPACT AND BENEFITS
- Tagline: "ONE PLATFORM. EVERY APPROVAL. FULL TRANSPARENCY."
- STAKEHOLDER IMPACT:
  - Entrepreneurs / MSMEs: Personalized approval roadmap, fewer errors, reduced compliance effort, transparent tracking.
  - Government Departments: Better application completeness, reduced repetitive scrutiny, improved workload visibility.
  - Government Officers: Centralized case management, SLA monitoring, inspection scheduling, bottleneck identification.
  - Startups: Faster understanding of registrations, licences, incentives & compliance obligations.
- BROADER & LONG-TERM IMPACT: Government: data-driven identification of approval delays & bottlenecks to improve ease of doing business. / Economic Impact: reduced approval time & compliance cost can encourage entrepreneurship, investment & industrial growth. / Long-Term: a scalable digital framework that can expand across sectors, districts & government services.
- Digital Inclusion: A simple, guided experience that lowers the barrier for first-time entrepreneurs navigating government approvals.
- Note: zero quantified metrics (no %, no days saved, no cost, no baseline).

## Slide 6 — INNOVATION & KEY DIFFERENTIATORS (EXTRA vs official 6-slide format)
- Header: [Team Name] + INNOVATION & KEY DIFFERENTIATORS
- Tagline: "From Single-Window Access to Intelligent Approval"
- 7 differentiators (title + one-liner each):
  - Personalized Approval Roadmap: Dynamically determines required approvals.
  - Regulatory RAG: Explainable answers grounded in the regulatory knowledge base.
  - Pre-Submission Intelligence: Detects missing or inconsistent documents before submission.
  - Parallel Workflow Optimization: Identifies approvals that can proceed simultaneously.
  - Risk-Based Scrutiny: Prioritizes applications using configurable compliance risk indicators.
  - SLA & Bottleneck Intelligence: Identifies delayed stages & predicts potential bottlenecks.
  - Compliance Lifecycle: Tracks renewals, inspections & continuing obligations after approval.
- Comparison strip: Traditional Process = Multiple portals + manual checking + uncertainty vs UdyamSetu AI = One profile + intelligent checklist + validation + tracking + proactive alerts

## Slide 7 — RESEARCH AND REFERENCES
- Header: [Team Name] + RESEARCH AND REFERENCES
- Government & Policy Resources: Maharashtra Government – official industrial & business facilitation resources. / Department of Skills, Employment, Entrepreneurship and Innovation, Government of Maharashtra.
- National Frameworks: Government of India – National Single Window System (NSWS). / India Code – central laws and regulations.
- Industry & Facilitation: Maharashtra Industry, Trade and Investment Facilitation resources. / Relevant Maharashtra government notifications & approval guidelines.
- Digital Governance Reports: Digital governance & ease-of-doing-business reports. / Departmental regulations & guidelines (Government of Maharashtra).
- Note: no URLs, no dates, no section numbers, no document titles — unverifiable.

## Slide 8 — THANK YOU
- THANK YOU!
- Udyog Sarthi AI (NAME MISMATCH vs UDYAMSETU AI on S2/S6)
- "Making Industrial Approvals Simple, Transparent & Intelligent"
- Team [Team Name] | SIH26130 | Government of Maharashtra (Team still unfilled)

---

## Zip listing (abridged)
- ppt/slides/slide1.xml (12013) … slide8.xml (5119); slide3 largest (37466)
- ppt/media/image1.png (727620), image2.png (350380); total embedded media = 2 PNGs
- ppt/notesSlides/notesSlide1–8.xml (1627 each, empty)
