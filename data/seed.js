// Seed data — Udyog Sarthi (SIH 26130), Government of Maharashtra demo dataset.
// Option A users model: users[] + applicantProfiles[] + officerProfiles[] with
// legacy global-SHA hashes for the 3 demo accounts (legacy:true). New users use
// per-user scrypt (see server.js). Never store plaintext, never return hash.
const crypto = require("crypto");
function __sha256(s) { return crypto.createHash("sha256").update(String(s)).digest("hex"); }
const __AUTH_SALT = "udyog-sarthi-demo-salt-v1::26130";
const seed = {
  users: [
    { id: "U-001", name: "System Administrator", email: "admin@maharashtra.gov.in", role: "ADMIN", salt: __AUTH_SALT + ":admin", passHash: __sha256(__AUTH_SALT + ":admin:admin@maharashtra.gov.in:admin123"), legacy: true, disabled: false, createdAt: "2026-01-01T00:00:00.000Z" },
    { id: "U-002", name: "Demo Officer (MPCB)", email: "officer@maharashtra.gov.in", role: "OFFICER", dept: "MPCB", designation: "MPCB Officer", salt: __AUTH_SALT + ":officer", passHash: __sha256(__AUTH_SALT + ":officer:officer@maharashtra.gov.in:officer123"), legacy: true, disabled: false, createdAt: "2026-01-01T00:00:00.000Z" },
    { id: "U-003", name: "Demo Entrepreneur", email: "udyog@demo.in", role: "APPLICANT", salt: __AUTH_SALT + ":applicant", passHash: __sha256(__AUTH_SALT + ":applicant:udyog@demo.in:demo123"), legacy: true, disabled: false, createdAt: "2026-01-01T00:00:00.000Z" }
  ],
  applicantProfiles: [
    { userId: "U-003", name: "Demo Entrepreneur", org: "Demo Industries", phone: "" }
  ],
  officerProfiles: [
    { userId: "U-002", dept: "MPCB", designation: "MPCB Officer" }
  ],
  departments: [
    { id: "MIDC", name: "MIDC", full: "Maharashtra Industrial Development Corporation", color: "#1a6b4a", slaWeight: 1.0 },
    { id: "MPCB", name: "MPCB", full: "Maharashtra Pollution Control Board", color: "#0d5c63", slaWeight: 1.2 },
    { id: "LABOUR", name: "Labour", full: "Directorate of Industrial Safety & Health / Labour", color: "#7a3b00", slaWeight: 1.0 },
    { id: "FIRE", name: "Fire", full: "Maharashtra Fire Services", color: "#a31621", slaWeight: 1.0 },
    { id: "MSEDCL", name: "MSEDCL", full: "MSEDCL (Power / DISCOM)", color: "#1d3fae", slaWeight: 1.0 },
    { id: "DOI", name: "Industries", full: "Directorate of Industries (Single Window)", color: "#5b2a86", slaWeight: 0.8 }
  ],
  approvals: [
    { id: "MIDC-LAND", dept: "MIDC", name: "MIDC Land Allotment (Plot)", stage: ["Establish"], sizes: ["Small", "Medium", "Large"], sectors: ["ALL"], slaDays: 30, fee: 25000, parallelGroup: "A", inspection: false, riskBump: 0, validityDays: null,
      docs: ["Udyam / Company incorporation certificate", "Project report with layout", "PAN + GST of promoter", "Address proof of unit location"] },
    { id: "MIDC-BLDG", dept: "MIDC", name: "Building Plan Approval", stage: ["Establish", "Expand"], sizes: ["Small", "Medium", "Large"], sectors: ["ALL"], slaDays: 21, fee: 15000, parallelGroup: "A", inspection: false, riskBump: 0, validityDays: null,
      docs: ["Architect-certified building drawings", "MIDC land allotment letter", "Structural stability certificate"] },
    { id: "MIDC-WATER", dept: "MIDC", name: "Industrial Water Connection", stage: ["Establish", "Operate"], sizes: ["Small", "Medium", "Large"], sectors: ["ALL"], slaDays: 15, fee: 8000, parallelGroup: "C", inspection: false, riskBump: 0, validityDays: 365,
      docs: ["Allotment letter", "Water requirement statement (KLD)", "Plumbing layout"] },
    { id: "MPCB-CTE", dept: "MPCB", name: "Consent to Establish (CTE)", stage: ["Establish"], sizes: ["Micro", "Small", "Medium", "Large"], sectors: ["ALL"], slaDays: 45, fee: 20000, parallelGroup: "A", inspection: true, riskBump: 10, validityDays: 1825,
      docs: ["Project report with manufacturing process", "MIDC allotment / land papers", "Water budget & effluent details", "CA certificate of project cost"] },
    { id: "MPCB-CTO", dept: "MPCB", name: "Consent to Operate (CTO)", stage: ["Operate"], sizes: ["Micro", "Small", "Medium", "Large"], sectors: ["ALL"], slaDays: 60, fee: 30000, parallelGroup: "D", inspection: true, riskBump: 15, gatedBy: ["A", "B", "C"], validityByBand: { Red: 1825, Amber: 1825, Green: 3650 },
      docs: ["CTE compliance report", "ETP/STP installation proof", "Stack & effluent monitoring reports", "Hazardous waste authorisation (if applicable)"] },
    { id: "LABOUR-FACT", dept: "LABOUR", name: "Factory Licence (Factories Act)", stage: ["Establish", "Operate"], sizes: ["Micro", "Small", "Medium", "Large"], sectors: ["Manufacturing", "Chemicals & Pharma", "Textiles", "Food Processing", "Auto & Engineering"], slaDays: 30, fee: 12000, parallelGroup: "B", inspection: true, riskBump: 10, validityDays: 365,
      docs: ["Factory layout plan", "List of machinery & horsepower", "Partnership deed / MoA", "Safety officer appointment (if 100+ workers)"] },
    { id: "LABOUR-SHOP", dept: "LABOUR", name: "Shops & Establishments Registration", stage: ["Establish"], sizes: ["Micro", "Small", "Medium"], sectors: ["IT & ESDM", "Logistics & Warehousing", "Food Processing"], slaDays: 7, fee: 2000, parallelGroup: "A", inspection: false, riskBump: 0, validityDays: 365,
      docs: ["Premises proof (rent deed / allotment)", "ID proof of employer", "Employee count declaration"] },
    { id: "LABOUR-BOCW", dept: "LABOUR", name: "BOCW Establishment Registration (construction phase)", stage: ["Establish"], sizes: ["Medium", "Large"], sectors: ["ALL"], slaDays: 15, fee: 5000, parallelGroup: "B", inspection: false, riskBump: 5, validityDays: 365,
      docs: ["Construction work order", "Worker count estimate", "Contractor licence copies"] },
    { id: "FIRE-PROV", dept: "FIRE", name: "Provisional Fire NOC", stage: ["Establish"], sizes: ["Micro", "Small", "Medium", "Large"], sectors: ["ALL"], slaDays: 21, fee: 10000, parallelGroup: "B", inspection: true, riskBump: 10, validityDays: 365,
      docs: ["Fire fighting layout drawings", "Building plan approval", "Fire load calculation sheet"] },
    { id: "FIRE-FINAL", dept: "FIRE", name: "Final Fire NOC", stage: ["Operate"], sizes: ["Micro", "Small", "Medium", "Large"], sectors: ["ALL"], slaDays: 30, fee: 12000, parallelGroup: "D", inspection: true, riskBump: 10, gatedBy: ["A", "B", "C"], validityDays: 365,
      docs: ["Installed fire systems photographs", "Hydrant / alarm test certificates", "Provisional Fire NOC compliance"] },
    { id: "MSEDCL-PWR", dept: "MSEDCL", name: "New Industrial Power Connection (HT/LT)", stage: ["Establish", "Expand"], sizes: ["Small", "Medium", "Large"], sectors: ["ALL"], slaDays: 30, fee: 18000, parallelGroup: "C", inspection: true, riskBump: 5, validityDays: null,
      docs: ["Sanctioned load application", "Allotment / premises proof", "Electrical contractor test report", "Transformer details (for HT)"] },
    { id: "DOI-UDYAM", dept: "DOI", name: "Udyam Registration + Single-Window Acknowledgement", stage: ["Establish"], sizes: ["Micro", "Small", "Medium", "Large"], sectors: ["ALL"], slaDays: 3, fee: 0, parallelGroup: "A", inspection: false, riskBump: 0, validityDays: null,
      docs: ["Aadhaar of promoter", "PAN of enterprise", "Bank account details"] }
  ],
  schemes: [
    { id: "PSI-2019", name: "Package Scheme of Incentives 2019 (PSI)", dept: "Directorate of Industries", benefit: "Capital subsidy up to 40% of fixed capital investment + stamp duty exemption", maxBenefitLakh: 120,
      eligibility: { sizes: ["Micro", "Small", "Medium", "Large"], sectors: ["ALL"], districts: ["ALL"], minInvestmentLakh: 25 },
      how: "Apply via Single Window with EC + Udyam; subsidy released after CTO + production." },
    { id: "IT-2023", name: "Maharashtra IT/ITES Policy 2023", dept: "Directorate of IT", benefit: "Stamp-duty waiver + power-tariff subsidy + up to ₹25 lakh employment incentive", maxBenefitLakh: 60,
      eligibility: { sizes: ["Micro", "Small", "Medium", "Large"], sectors: ["IT & ESDM"], districts: ["ALL"], minInvestmentLakh: 10 },
      how: "Register IT unit on IT facilitation portal; claim via DITapes portal quarterly." },
    { id: "TEXTILE", name: "Maharashtra Technical Textile / Textile Policy", dept: "Dept. of Textiles", benefit: "25% capital subsidy + interest subsidy 6% for 7 years", maxBenefitLakh: 90,
      eligibility: { sizes: ["Small", "Medium", "Large"], sectors: ["Textiles"], districts: ["ALL"], minInvestmentLakh: 50 },
      how: "Apply to Textile Commissioner office with project report + MPCB CTE." },
    { id: "EV-2021", name: "Maharashtra EV Policy (charging + components)", dept: "Dept. of Industries / Transport", benefit: "Early-bird capital subsidy 15% + SGST reimbursement for EV component makers", maxBenefitLakh: 75,
      eligibility: { sizes: ["Small", "Medium", "Large"], sectors: ["Auto & Engineering"], districts: ["ALL"], minInvestmentLakh: 50 },
      how: "Declare EV-component end-use in project report; apply pre-production via Single Window." },
    { id: "MSME-FEE", name: "MSME Single-Window Fee Waiver & Deemed Approval", dept: "Directorate of Industries", benefit: "Zero facilitation fee + deemed approval if SLA breached (Green category)", maxBenefitLakh: 2,
      eligibility: { sizes: ["Micro", "Small", "Medium"], sectors: ["ALL"], districts: ["ALL"], minInvestmentLakh: 0 },
      how: "Automatic on filing via Single Window; deemed certificate downloadable after SLA." },
    { id: "PMEGP-INT", name: "Interest Subsidy for Food-Processing MSMEs", dept: "DIC + KVIC convergence", benefit: "35% margin-money assistance (rural) + 3% state top-up interest subsidy", maxBenefitLakh: 12,
      eligibility: { sizes: ["Micro", "Small"], sectors: ["Food Processing"], districts: ["ALL"], minInvestmentLakh: 5 },
      how: "Apply on PMEGP portal; DIC sponsors to bank; subsidy adjusted in loan." }
  ],
  // Knowledge corpus v2 — 60-article Maharashtra approval rulebook (illustrative demo summaries; confirm with dept GR/portal before legal reliance).
  knowledge: [
    { id: "K01", q: "What is the difference between CTE and CTO?", a: "CTE (Consent to Establish) is taken BEFORE construction from MPCB; CTO (Consent to Operate) is taken AFTER installation, before commercial production. You cannot legally start production on CTE alone.", a_mr: "CTE (स्थापना संमती) बांधकामाआधी MPCB कडून घ्यावी; CTO (चालवण्याची संमती) यंत्रणा बसवल्यानंतर, व्यावसायिक उत्पादनाआधी घ्यावी. केवळ CTE वर उत्पादन कायदेशीर नाही.", tags: ["MPCB", "CTE", "CTO", "consent"], source: "Illustrative summary — confirm with MPCB consent manual" },
    { id: "K02", q: "What are Red / Orange / Green industry categories?", a: "MPCB classifies industries by pollution index: Red (>60, e.g. chemicals, tannery) needs full scrutiny + mandatory inspection; Orange (41-59) desk + inspection; Green (<41, e.g. IT, assembly) fast-track / deemed route.", a_mr: "MPCB प्रदूषण निर्देशांकाने वर्गवारी करते: Red (>60, उदा. रसायने, चर्मोद्योग) पूर्ण छाननी + सक्तीची तपासणी; Orange (41-59) डेस्क + तपासणी; Green (<41, उदा. IT, जोडणी) जलद मार्ग / मान्यताप्राप्त मार्ग.", tags: ["MPCB", "risk", "category", "red", "orange", "green"], source: "Illustrative summary — confirm with MPCB categorisation circular" },
    { id: "K03", q: "What is a deemed approval?", a: "If a department does not decide within its notified SLA (e.g. 30 days), the Single Window auto-generates a deemed-approval certificate with the same legal validity. Track SLA clocks in the Tracker.", a_mr: "विभागाने अधिसूचित SLA (उदा. 30 दिवस) मध्ये निर्णय न घेतल्यास सिंगल विंडो आपोआप मान्यताप्राप्त प्रमाणपत्र तयार करते, ज्याला समान कायदेशीर वैधता असते. ट्रॅकरमध्ये SLA घड्याळे पाहा.", tags: ["SLA", "deemed", "single window", "certificate"], source: "Illustrative summary — confirm with Facilitation Act SLA notification" },
    { id: "K04", q: "Can Fire NOC and Factory Licence inspections be combined?", a: "Yes — Udyog Sarthi proposes a Common Inspection when 2+ departments flag site visits in the same window, so one officer visit covers all checklists.", a_mr: "होय — एकाच कालावधीत 2+ विभागांना जागा भेटी लागल्यास उद्योग सारथी सामायिक तपासणी सुचवते, त्यामुळे एकाच भेटीत सर्व याद्या पूर्ण होतात.", tags: ["inspection", "common", "fire", "labour", "joint"], source: "Demo workflow — confirm with joint-inspection GR" },
    { id: "K05", q: "Which approvals can run in parallel?", a: "Group A (land, building, CTE, shops, Udyam) starts day 1. Group B (factory licence, fire provisional, BOCW) starts after land allotment. Group C (power, water) runs alongside construction. Group D (CTO, final fire) only after installation.", a_mr: "गट A (जमीन, इमारत, CTE, दुकाने, उद्यम) पहिल्या दिवसापासून. गट B (कारखाना परवाना, तात्पुरती अग्निशमन NOC, BOCW) जमीन वाटपानंतर. गट C (वीज, पाणी) बांधकामासोबत. गट D (CTO, अंतिम अग्निशमन) फक्त यंत्रणा बसवल्यानंतर.", tags: ["parallel", "workflow", "groups"], source: "Demo grouping — confirm with Single Window procedure" },
    { id: "K06", q: "What triggers an application being marked incomplete?", a: "Missing/expired documents, name mismatch with PAN/Aadhaar, wrong file type, or effluent data missing for Red-category units. The pre-validation engine flags these BEFORE submission.", a_mr: "गहाळ/कालबाह्य कागदपत्रे, PAN/आधारशी नाव तफावत, चुकीचा फाइल प्रकार, किंवा Red वर्गासाठी सांडपाणी माहिती गहाळ असल्यास अर्ज अपूर्ण ठरतो. पूर्व-तपासणी इंजिन सादर करण्याआधी हेच दाखवते.", tags: ["documents", "incomplete", "validation"], source: "Demo rule — confirm with department checklists" },
    { id: "K07", q: "How are renewals handled?", a: "Factory licence (annual), CTO (5 yrs Red / 10 yrs Green), Fire NOC (annual) auto-appear in Renewals 60 days before expiry with one-click re-apply reusing vault documents.", a_mr: "कारखाना परवाना (वार्षिक), CTO (Red 5 वर्षे / Green 10 वर्षे), अग्निशमन NOC (वार्षिक) मुदत संपण्याच्या 60 दिवस आधी नूतनीकरणात आपोआप दिसतात, तिजोरीतील कागदपत्रे वापरून एका क्लिकवर पुनर्अर्ज करता येतो.", tags: ["renewal", "validity", "expiry"], source: "Illustrative validity table — confirm with each Act" },
    { id: "K08", q: "How does grievance escalation work?", a: "Raise against an application/department. Dept SLA: 7 days; auto-escalates to Nodal Officer, then to Secretary (Industries) with full timeline attached. Nothing can be closed without a speaking order.", a_mr: "अर्ज/विभागाविरुद्ध तक्रार नोंदवा. विभाग SLA: 7 दिवस; आपोआप नोडल अधिकाऱ्याकडे, मग सचिव (उद्योग) यांच्याकडे पूर्ण कालरेषेसह जाते. कारण-आदेशाशिवाय काहीही बंद होत नाही.", tags: ["grievance", "escalation", "nodal", "secretary"], source: "Demo ladder — confirm with grievance GR" },
    { id: "K09", q: "What is risk-based scrutiny?", a: "A 0-100 score from sector hazard + project size + document completeness. Green (<35): fast-track/deemed. Amber (35-65): desk review. Red (>65): mandatory site inspection + committee.", a_mr: "क्षेत्र धोका + प्रकल्प आकार + कागदपत्र पूर्णता यातून 0-100 गुण. Green (<35): जलद/मान्यताप्राप्त. Amber (35-65): डेस्क तपासणी. Red (>65): सक्तीची जागा तपासणी + समिती.", tags: ["risk", "scrutiny", "score", "green", "amber", "red"], source: "Demo heuristic v0 — weights shown in app, ML scorer roadmap" },
    { id: "K10", q: "Which incentives apply to a food-processing unit in Nashik?", a: "PSI-2019 capital subsidy + PMEGP-linked margin money (rural) + MSME fee waiver. Check the Schemes finder with your exact profile for estimated rupee benefit.", a_mr: "PSI-2019 भांडवली अनुदान + PMEGP-संलग्न मार्जिन मनी (ग्रामीण) + MSME शुल्क माफी. अचूक रुपया लाभासाठी योजना शोधकात तुमचा तपशील टाका.", tags: ["schemes", "food processing", "incentive", "PSI", "PMEGP"], source: "Illustrative — confirm with DIC + KVIC circulars" },
    { id: "K11", q: "How do I get MIDC land allotment for my unit?", a: "Apply via Single Window with Udyam/incorporation certificate, project report with layout, PAN+GST and address proof. Demo SLA 30 days; allotment letter unlocks Group B approvals.", a_mr: "उद्यम/नोंदणी प्रमाणपत्र, आराखड्यासह प्रकल्प अहवाल, प्रवर्तकाचा PAN+GST व जागेचा पत्ता पुरावा घेऊन सिंगल विंडोवर अर्ज करा. डेमो SLA 30 दिवस; वाटप पत्र गट B मंजुरी उघडते.", tags: ["MIDC", "land", "allotment", "plot"], source: "Illustrative summary — confirm with MIDC land manual" },
    { id: "K12", q: "What is needed for Building Plan Approval?", a: "Architect-certified building drawings, MIDC land allotment letter and structural stability certificate. Demo SLA 21 days; required in Establish and Expand stages.", a_mr: "वास्तुविशारद-प्रमाणित इमारत नकाशे, MIDC जमीन वाटप पत्र व संरचनात्मक स्थिरता प्रमाणपत्र आवश्यक. डेमो SLA 21 दिवस; स्थापना व विस्तार टप्प्यांत आवश्यक.", tags: ["MIDC", "building plan", "drawings", "construction"], source: "Illustrative summary — confirm with MIDC building rules" },
    { id: "K13", q: "How do I get an industrial water connection?", a: "Submit allotment letter, water requirement statement in KLD and plumbing layout. Demo SLA 15 days; runs in Group C alongside construction.", a_mr: "वाटप पत्र, KLD मधील पाणी गरज विवरण व प्लंबिंग आराखडा सादर करा. डेमो SLA 15 दिवस; बांधकामासोबत गट C मध्ये चालते.", tags: ["MIDC", "water", "KLD", "connection"], source: "Illustrative summary — confirm with MIDC water rules" },
    { id: "K14", q: "How do I apply for Consent to Establish (CTE)?", a: "Apply to MPCB with project report + manufacturing process, land papers, water budget and effluent details, and CA certificate of project cost. Demo SLA 45 days with site inspection.", a_mr: "MPCB कडे प्रकल्प अहवाल + उत्पादन प्रक्रिया, जमीन कागदपत्रे, पाणी अंदाजपत्रक व सांडपाणी तपशील, व प्रकल्प खर्चाचे CA प्रमाणपत्र घेऊन अर्ज करा. जागा तपासणीसह डेमो SLA 45 दिवस.", tags: ["MPCB", "CTE", "establish", "effluent"], source: "Illustrative summary — confirm with MPCB portal" },
    { id: "K15", q: "How do I apply for Consent to Operate (CTO)?", a: "Apply AFTER installation with CTE compliance report, ETP/STP installation proof, stack and effluent monitoring reports, and hazardous waste authorisation if applicable. Demo SLA 60 days.", a_mr: "यंत्रणा बसवल्यानंतर CTE अनुपालन अहवाल, ETP/STP बसवल्याचा पुरावा, चिमणी व सांडपाणी देखरेख अहवाल, व लागू असल्यास घातक कचरा प्राधिकार घेऊन अर्ज करा. डेमो SLA 60 दिवस.", tags: ["MPCB", "CTO", "operate", "ETP", "compliance"], source: "Illustrative summary — confirm with MPCB portal" },
    { id: "K16", q: "How long is a CTO valid?", a: "Illustrative validity used in this demo: Red category 5 years, Green category 10 years. Renewal appears 60 days before expiry. Confirm exact validity with the MPCB consent order.", a_mr: "या डेमोतील उदाहरणार्थ वैधता: Red वर्ग 5 वर्षे, Green वर्ग 10 वर्षे. मुदत संपण्याच्या 60 दिवस आधी नूतनीकरण दिसते. अचूक वैधता MPCB संमती आदेशाशी पडताळा.", tags: ["MPCB", "CTO", "validity", "renewal"], source: "Illustrative validity — confirm with consent order" },
    { id: "K17", q: "Does my unit need an ETP or STP?", a: "Wet-process Red/Orange units typically need effluent treatment (ETP) and sewage treatment (STP) with installation proof at CTO stage. Dry assembly/IT units usually do not. Confirm with MPCB category circular.", a_mr: "ओल्या प्रक्रिया असलेल्या Red/Orange घटकांना CTO टप्प्यावर सांडपाणी प्रक्रिया (ETP) व मैला प्रक्रिया (STP) बसवल्याचा पुरावा लागतो. कोरडी जोडणी/IT घटकांना सहसा लागत नाही. MPCB वर्गवारी परिपत्रकाशी पडताळा.", tags: ["MPCB", "ETP", "STP", "effluent"], source: "Illustrative summary — confirm with MPCB" },
    { id: "K18", q: "What is Hazardous Waste Authorisation?", a: "Units generating hazardous waste (common in chemicals and pharma) need authorisation alongside CTO, covering storage, handling and disposal via authorised recyclers.", a_mr: "घातक कचरा निर्माण करणाऱ्या घटकांना (रसायने व औषधांमध्ये सामान्य) CTO सोबत साठवण, हाताळणी व अधिकृत पुनर्चक्रणकर्त्यामार्फत विल्हेवाट यासाठी प्राधिकार आवश्यक.", tags: ["MPCB", "hazardous waste", "chemicals", "pharma"], source: "Illustrative summary — confirm with HW Rules" },
    { id: "K19", q: "When is a Factory Licence required?", a: "Broadly: 10+ workers with power, or 20+ without, in manufacturing premises. Needs factory layout, machinery list and partnership deed/MoA. Units with 100+ workers additionally appoint a safety officer.", a_mr: "स्थूलमानाने: वीजसह 10+ कामगार, किंवा वीजविना 20+ कामगार असलेल्या उत्पादन आवारांना. कारखाना आराखडा, यंत्रसामग्री यादी व भागीदारी करार/MoA आवश्यक. 100+ कामगार असल्यास सुरक्षा अधिकारी नेमणूक.", tags: ["labour", "factory licence", "factories act", "safety"], source: "Illustrative summary — confirm with Factories Act" },
    { id: "K20", q: "What is Shops and Establishments Registration?", a: "For micro/small service, IT and trading units: premises proof, employer ID proof and employee-count declaration. Demo SLA 7 days, no site visit, Group A day-1.", a_mr: "सूक्ष्म/लहान सेवा, IT व व्यापारी घटकांसाठी: जागा पुरावा, मालकाचा ओळख पुरावा व कर्मचारी संख्या घोषणापत्र. डेमो SLA 7 दिवस, जागा भेट नाही, गट A पहिला दिवस.", tags: ["labour", "shops", "registration", "IT", "services"], source: "Illustrative summary — confirm with Shops Act" },
    { id: "K21", q: "What is BOCW registration and when is it needed?", a: "Building and Other Construction Workers registration for the construction phase of medium/large projects: work order, worker-count estimate and contractor licences. Demo SLA 15 days.", tags: ["labour", "BOCW", "construction", "contractor"], source: "Illustrative summary — confirm with BOCW Act" },
    { id: "K22", q: "What is a Provisional Fire NOC?", a: "Fire clearance BEFORE construction based on fire-fighting layout drawings, building plan approval and fire-load calculation sheet. Demo SLA 21 days with site visit; Group B.", tags: ["fire", "provisional", "NOC", "fire load"], source: "Illustrative summary — confirm with Fire Services" },
    { id: "K23", q: "What is a Final Fire NOC?", a: "Fire clearance AFTER installation for the Operate stage: installed-system photographs, hydrant/alarm test certificates and provisional-NOC compliance. Demo SLA 30 days; Group D.", tags: ["fire", "final", "NOC", "hydrant"], source: "Illustrative summary — confirm with Fire Services" },
    { id: "K24", q: "How do I get an MSEDCL industrial power connection?", a: "Apply with sanctioned-load application, premises proof and electrical contractor test report; HT loads additionally need transformer details. Demo SLA 30 days with inspection; Group C.", tags: ["MSEDCL", "power", "HT", "LT", "electricity"], source: "Illustrative summary — confirm with MSEDCL" },
    { id: "K25", q: "How do I get Udyam Registration?", a: "Free online registration with promoter Aadhaar, enterprise PAN and bank details. Generates the Single-Window acknowledgement on day 1 (Group A) in this demo.", tags: ["Udyam", "MSME", "registration", "acknowledgement"], source: "Illustrative summary — confirm with Udyam portal" },
    { id: "K26", q: "What is the Package Scheme of Incentives 2019 (PSI)?", a: "Illustrative demo terms: capital subsidy up to 40% of fixed capital investment + stamp-duty exemption, minimum investment 25 lakh, all sectors/sizes. Apply via Single Window with EC + Udyam; released after CTO + production.", tags: ["PSI", "subsidy", "incentive", "capital"], source: "Illustrative — confirm with PSI-2019 GR" },
    { id: "K27", q: "What does the Maharashtra IT/ITES Policy 2023 offer?", a: "Illustrative demo terms: stamp-duty waiver + power-tariff subsidy + employment incentive up to 25 lakh for IT and ESDM units. Confirm live terms on the IT facilitation portal.", tags: ["IT", "ITES", "ESDM", "policy", "incentive"], source: "Illustrative — confirm with DIT policy GR" },
    { id: "K28", q: "What does the Maharashtra Textile Policy offer?", a: "Illustrative demo terms: 25% capital subsidy + 6% interest subsidy for 7 years for small/medium/large textile units. Apply to the Textile Commissioner with project report + MPCB CTE.", tags: ["textile", "subsidy", "interest", "policy"], source: "Illustrative — confirm with Textile Commissioner" },
    { id: "K29", q: "What does the Maharashtra EV Policy offer component makers?", a: "Illustrative demo terms: 15% early-bird capital subsidy + SGST reimbursement for EV-component makers in auto and engineering. Declare EV end-use in the project report pre-production.", tags: ["EV", "auto", "engineering", "subsidy", "SGST"], source: "Illustrative — confirm with EV policy GR" },
    { id: "K30", q: "What is the MSME Single-Window Fee Waiver?", a: "Illustrative demo terms: zero facilitation fee + deemed approval if SLA is breached for Green-category micro/small/medium units. Automatic on filing via Single Window.", tags: ["MSME", "fee waiver", "deemed", "green"], source: "Illustrative — confirm with Industries dept" },
    { id: "K31", q: "What PMEGP support exists for food-processing MSMEs?", a: "Illustrative demo terms: margin-money assistance around 35% rural plus a 3% state top-up interest subsidy for micro/small food-processing units via DIC + KVIC convergence. Confirm with DIC.", tags: ["PMEGP", "food processing", "margin money", "KVIC"], source: "Illustrative — confirm with DIC/KVIC" },
    { id: "K32", q: "What is the MAITRI 2.0 Know-Your-Approvals wizard?", a: "MAITRI 2.0 is Maharashtra's live G2B Single-Window channel with a Know-Your-Approvals questionnaire that routes applicants to the right approvals. This demo's checklist wizard mirrors that pattern offline.", tags: ["MAITRI", "KYA", "wizard", "single window"], source: "Public MAITRI description — confirm on MAITRI portal" },
    { id: "K33", q: "What is NSWS EntityLocker document reuse?", a: "The National Single Window System offers a central document repository: upload once, reuse across approvals. This demo's verified vault mirrors that pattern with filename-level reuse.", tags: ["NSWS", "EntityLocker", "DigiLocker", "vault", "reuse"], source: "Public NSWS description — confirm on NSWS portal" },
    { id: "K34", q: "How does vault document reuse work in this demo?", a: "Documents that pass pre-validation enter the verified vault; filing a new application re-attaches verified names automatically. Only filename records are stored — no file bytes, no live DigiLocker API.", tags: ["vault", "reuse", "documents", "DigiLocker"], source: "Demo behaviour — see Documents page" },
    { id: "K35", q: "Which approvals are in Group A (day 1)?", a: "Group A starts day 1 in parallel: MIDC land allotment, building plan approval, MPCB CTE, Shops registration (where applicable) and Udyam + Single-Window acknowledgement.", tags: ["parallel", "group A", "day 1"], source: "Demo grouping — confirm with procedure" },
    { id: "K36", q: "Which approvals are in Group B (after land)?", a: "Group B starts after land allotment: Factory Licence, Provisional Fire NOC and BOCW registration (construction phase, medium/large).", tags: ["parallel", "group B", "factory", "fire"], source: "Demo grouping — confirm with procedure" },
    { id: "K37", q: "Which approvals are in Group C (alongside construction)?", a: "Group C runs alongside construction: MSEDCL industrial power connection and MIDC industrial water connection.", tags: ["parallel", "group C", "power", "water"], source: "Demo grouping — confirm with procedure" },
    { id: "K38", q: "Which approvals are in Group D (pre-production)?", a: "Group D runs only after installation, before commercial production: MPCB CTO and Final Fire NOC. These legally require prior CTE-stage compliance.", tags: ["parallel", "group D", "CTO", "final fire"], source: "Demo grouping — confirm with procedure" },
    { id: "K39", q: "What are the demo SLA timelines per approval?", a: "Illustrative SLAs in days: Udyam 3, Shops 7, Water/BOCW 15, Building/Provisional-Fire 21, Land/Factory/Final-Fire/Power 30, CTE 45, CTO 60. Confirm notified SLAs with each department.", tags: ["SLA", "timeline", "days", "deadline"], source: "Demo seed SLAs — confirm with SLA notifications" },
    { id: "K40", q: "Is a deemed approval legally valid?", a: "Under time-bound disposal regimes, a deemed certificate carries the same validity as a decided approval. In this demo, deemed is recorded via officer action; an automatic breach sweep is on the roadmap.", tags: ["deemed", "validity", "SLA", "certificate"], source: "Illustrative — confirm with Facilitation Act" },
    { id: "K41", q: "How do I book an inspection in the app?", a: "Open the application tracker, pick a date and slot, and book. When 2+ departments need visits, the app suggests one COMBINED joint visit instead of separate trips.", tags: ["inspection", "booking", "slot", "combined"], source: "Demo behaviour — see Tracker page" },
    { id: "K42", q: "What happens when an inspection is completed?", a: "Completing an inspection moves every linked track stuck at Inspection scheduled (for the inspected departments) back to Under review with a timeline remark. Double-booked slots raise a warning at booking time.", tags: ["inspection", "completed", "tracker", "linkage"], source: "Demo behaviour v2 — see Tracker page" },
    { id: "K43", q: "What is the inspection double-booking warning?", a: "If another inspection already holds the same date and slot, booking still succeeds for demo continuity but returns a visible warning naming the conflicting inspection.", tags: ["inspection", "double booking", "slot", "warning"], source: "Demo behaviour v2 — see Inspections page" },
    { id: "K44", q: "How do I file a grievance in the app?", a: "Open Grievance, choose the application and department, and write the subject. The case opens with a 7-day department SLA and a full timeline that travels with every escalation.", tags: ["grievance", "file", "SLA", "timeline"], source: "Demo behaviour — see Grievance page" },
    { id: "K45", q: "What is the grievance escalation ladder?", a: "Department (7-day SLA) to Nodal Officer to Secretary (Industries). Each escalation appends a timeline entry, and no case closes without a written speaking order.", tags: ["grievance", "escalation", "nodal", "secretary", "speaking order"], source: "Demo ladder — confirm with grievance GR" },
    { id: "K46", q: "When do renewals become due?", a: "Illustrative demo table: Factory Licence annual, Fire NOC annual, CTO 5 years (Red) / 10 years (Green). Renewal cards appear 60 days before expiry with one-click re-apply from vault docs.", tags: ["renewal", "validity", "factory", "fire", "CTO"], source: "Illustrative validity — confirm with each Act" },
    { id: "K47", q: "How are total fees and critical path computed?", a: "Total fee is the sum of all matched approval fees; critical path is the longest single SLA among them. Example: Food/Small/Establish gives 9 items, about 1.1 lakh rupees, 45-day critical path.", tags: ["fees", "critical path", "checklist", "SLA"], source: "Demo computation — see Wizard page" },
    { id: "K48", q: "What does critical path mean for my project?", a: "The longest approval SLA in your checklist is the earliest realistic start-to-finish bound if everything runs in parallel — shorten it first (pre-validated files, joint inspections).", tags: ["critical path", "parallel", "timeline"], source: "Demo definition — see Wizard page" },
    { id: "K49", q: "Why must document names match PAN/Aadhaar?", a: "Name mismatches are a top cause of queries and rejections. The upload form asks for the name on the document and fuzzy-checks it against the applicant record before filing.", tags: ["documents", "name match", "PAN", "Aadhaar", "query"], source: "Demo rule — confirm with department checklists" },
    { id: "K50", q: "What file rules does the upload pre-check enforce?", a: "The client-side pre-check accepts PDF/JPG/PNG under 10 MB, flags expired validity dates and blocks filing until red items are fixed. Server-side enforcement is tracked as P0 follow-up work.", tags: ["documents", "upload", "PDF", "size", "expiry", "validation"], source: "Demo behaviour — see Documents page" },
    { id: "K51", q: "What happens after an officer raises a query?", a: "The track moves to Queried with remarks. Re-upload a verified document and the track returns to Under review automatically; the vault keeps the corrected record.", tags: ["query", "officer", "re-upload", "tracker"], source: "Demo behaviour — see Tracker page" },
    { id: "K52", q: "How is the risk score calculated in this demo?", a: "Heuristic v0: base 10 + sector hazard + size bump + inspection/query bumps, minus a verified-documents discount, clamped 5-98. Bands: Green <35, Amber 35-65, Red >65. Feature weights are visible; an ML scorer is roadmap.", tags: ["risk", "score", "formula", "heuristic", "weights"], source: "Demo heuristic v0 — no ML model" },
    { id: "K53", q: "What are the sector hazard weights?", a: "Demo weights: IT and ESDM 2, Logistics 8, Textiles/Food Processing 15, Manufacturing/Auto 20, Chemicals and Pharma 35. These feed the risk heuristic, not a statutory classification.", tags: ["risk", "sector", "hazard", "weights"], source: "Demo weights — uncalibrated, ML roadmap" },
    { id: "K54", q: "What are the project-size risk bumps?", a: "Demo bumps: Micro 0, Small 8, Medium 16, Large 26. Larger plants draw deeper scrutiny in the heuristic; thresholds are illustrative.", tags: ["risk", "size", "micro", "small", "medium", "large"], source: "Demo weights — uncalibrated, ML roadmap" },
    { id: "K55", q: "What data powers the analytics page?", a: "An illustrative 38-record historical baseline (old vs new regime) plus LIVE counters aggregated from filed applications, inspections and grievances. File an application and watch the live cards move.", tags: ["analytics", "baseline", "live", "history"], source: "Demo data — 38 illustrative rows + live filings" },
    { id: "K56", q: "Which districts and MIDC areas are covered in the demo?", a: "8 districts: Mumbai Suburban, Pune, Nashik, Nagpur, Aurangabad (Chh. Sambhajinagar), Kolhapur, Solapur, Thane-Pal-ghar belt, each with 1-3 MIDC areas in the wizard dropdown.", tags: ["districts", "MIDC", "location", "coverage"], source: "Demo seed — expanding to 36 districts is roadmap" },
    { id: "K57", q: "What do Establish, Operate and Expand stages mean?", a: "Establish: pre-construction licences (land, CTE, building). Operate: pre-production (CTO, final fire). Expand: capacity growth on an existing unit (building, power upgrades).", tags: ["stage", "establish", "operate", "expand"], source: "Demo definition — confirm with procedure" },
    { id: "K58", q: "How are investment and worker counts used?", a: "Today they drive scheme eligibility and benefit estimates. Conditional checklist triggers on investment/worker thresholds are roadmap, not yet implemented.", tags: ["investment", "workers", "schemes", "eligibility", "roadmap"], source: "Demo behaviour — see Schemes page" },
    { id: "K59", q: "How do I run the offline demo and reset data?", a: "Run npm install once, then npm start, open http://localhost:3000. Use Reset demo data in the footer to restore seeds after a judging run. No internet needed.", tags: ["demo", "offline", "reset", "npm", "localhost"], source: "Demo ops — see README" },
    { id: "K60", q: "What is a speaking order in grievance closure?", a: "A written reasoned order explaining the decision on the grievance. The app requires a closure note; no grievance may be closed silently without one.", tags: ["grievance", "speaking order", "closure", "resolve"], source: "Demo rule — confirm with grievance GR" }
  ],
  districts: ["Mumbai Suburban", "Pune", "Nashik", "Nagpur", "Aurangabad (Chh. Sambhajinagar)", "Kolhapur", "Solapur", "Thane–Palghar belt"],
  midcAreas: { "Mumbai Suburban": ["Andheri MIDC", "Marol MIDC"], "Pune": ["Chakan MIDC", "Ranjangaon MIDC", "Hinjawadi IT Park"], "Nashik": ["Sinnar MIDC", "Satpur MIDC", "Ambad MIDC"], "Nagpur": ["Butibori MIDC", "Hingna MIDC"], "Aurangabad (Chh. Sambhajinagar)": ["Waluj MIDC", "Shendra-Bidkin AURIC"], "Kolhapur": ["Shiye MIDC", "Gokul Shirgaon MIDC"], "Solapur": ["Chincholi MIDC"], "Thane–Palghar belt": ["Tarapur MIDC", "Taloja MIDC"] },
  sectors: ["Manufacturing", "Food Processing", "Textiles", "Chemicals & Pharma", "IT & ESDM", "Auto & Engineering", "Logistics & Warehousing"],
  // Historical records power the analytics page (38 past applications, mixed old/new regime)
  history: [
    { regime: "old", dept: "MIDC", days: 52 }, { regime: "old", dept: "MIDC", days: 61 },
    { regime: "old", dept: "MPCB", days: 96 }, { regime: "old", dept: "MPCB", days: 88 },
    { regime: "old", dept: "LABOUR", days: 54 }, { regime: "old", dept: "LABOUR", days: 47 },
    { regime: "old", dept: "FIRE", days: 58 }, { regime: "old", dept: "FIRE", days: 63 },
    { regime: "old", dept: "MSEDCL", days: 71 }, { regime: "old", dept: "MSEDCL", days: 66 },
    { regime: "old", dept: "DOI", days: 22 }, { regime: "old", dept: "DOI", days: 19 },
    { regime: "old", dept: "MPCB", days: 104 }, { regime: "old", dept: "MIDC", days: 48 },
    { regime: "old", dept: "FIRE", days: 55 }, { regime: "old", dept: "LABOUR", days: 50 },
    { regime: "old", dept: "MSEDCL", days: 74 }, { regime: "old", dept: "MPCB", days: 91 },
    { regime: "old", dept: "MIDC", days: 57 }, { regime: "old", dept: "DOI", days: 25 },
    { regime: "new", dept: "MIDC", days: 24 }, { regime: "new", dept: "MIDC", days: 19 },
    { regime: "new", dept: "MPCB", days: 38 }, { regime: "new", dept: "MPCB", days: 31 },
    { regime: "new", dept: "LABOUR", days: 16 }, { regime: "new", dept: "LABOUR", days: 21 },
    { regime: "new", dept: "FIRE", days: 18 }, { regime: "new", dept: "FIRE", days: 22 },
    { regime: "new", dept: "MSEDCL", days: 26 }, { regime: "new", dept: "MSEDCL", days: 23 },
    { regime: "new", dept: "DOI", days: 3 }, { regime: "new", dept: "DOI", days: 4 },
    { regime: "new", dept: "MPCB", days: 35 }, { regime: "new", dept: "MIDC", days: 27 },
    { regime: "new", dept: "FIRE", days: 15 }, { regime: "new", dept: "LABOUR", days: 18 },
    { regime: "new", dept: "MSEDCL", days: 29 }, { regime: "new", dept: "DOI", days: 2 }
  ],
  incompleteRates: { old: 41, new: 12 },
  applications: [
    {
      id: "APP-2026-0142", title: "Shree Ganesh Food Processing Unit", applicant: "Meera Patil",
      ownerId: "U-003", ownerEmail: "udyog@demo.in", sector: "Food Processing", district: "Nashik", midc: "Sinnar MIDC", size: "Small", stage: "Establish",
      investmentLakh: 180, workers: 42, createdAt: daysAgo(9), status: "In progress",
      tracks: [
        { approvalId: "DOI-UDYAM", status: "Approved", updatedAt: daysAgo(8), remarks: "Auto-verified via Aadhaar/PAN." },
        { approvalId: "MIDC-LAND", status: "Approved", updatedAt: daysAgo(5), remarks: "Plot P-44 allotted, Sinnar." },
        { approvalId: "LABOUR-SHOP", status: "Approved", updatedAt: daysAgo(6), remarks: "Registration certificate issued." },
        { approvalId: "MPCB-CTE", status: "Under review", updatedAt: daysAgo(2), remarks: "Effluent details accepted; desk review on." },
        { approvalId: "MIDC-BLDG", status: "Under review", updatedAt: daysAgo(3), remarks: "Drawings under scrutiny." },
        { approvalId: "FIRE-PROV", status: "Inspection scheduled", updatedAt: daysAgo(1), remarks: "Site visit booked." },
        { approvalId: "MSEDCL-PWR", status: "Applied", updatedAt: daysAgo(2), remarks: "Load sanction awaited." }
      ],
      documents: [
        { name: "Udyam certificate.pdf", docType: "Udyam / Company incorporation certificate", verified: true, uploadedAt: daysAgo(9) },
        { name: "Project report.pdf", docType: "Project report with manufacturing process", verified: true, uploadedAt: daysAgo(9) }
      ]
    },
    {
      id: "APP-2026-0157", title: "Deccan Auto Components Plant", applicant: "Amit Deshmukh",
      ownerId: "U-003", ownerEmail: "udyog@demo.in", sector: "Auto & Engineering", district: "Pune", midc: "Chakan MIDC", size: "Medium", stage: "Expand",
      investmentLakh: 950, workers: 210, createdAt: daysAgo(26), status: "In progress",
      tracks: [
        { approvalId: "MIDC-BLDG", status: "Queried", updatedAt: daysAgo(4), remarks: "Revised structural certificate required — re-upload please." },
        { approvalId: "MPCB-CTE", status: "Approved", updatedAt: daysAgo(12), remarks: "Orange category desk clearance." },
        { approvalId: "LABOUR-FACT", status: "Under review", updatedAt: daysAgo(3), remarks: "Machinery list verification." },
        // DEMO-BREACH (shortlist demo): backdated 24d vs 21d SLA → breaches by ~3d.
        // Untouched since filing (2d after app created 26d ago) → first GET /api/applications
        // after POST /api/reset auto-Deems this track via sweepDeemed (see server.js).
        // Tracker shows "Deemed" + auto-deemed alert. Reset restores this pre-breach row.
        { approvalId: "FIRE-PROV", status: "Under review", slaStartedAt: daysAgo(24), updatedAt: daysAgo(24), remarks: "Fire load sheet accepted. [Demo: untouched 24d — SLA 21d breached, auto-Deemed on read]" },
        { approvalId: "MSEDCL-PWR", status: "Applied", updatedAt: daysAgo(6), remarks: "HT estimate pending." },
        { approvalId: "LABOUR-BOCW", status: "Approved", updatedAt: daysAgo(10), remarks: "Registered." }
      ],
      documents: [
        { name: "Factory layout.pdf", docType: "Factory layout plan", verified: true, uploadedAt: daysAgo(26) },
        { name: "Structural cert (old).pdf", docType: "Structural stability certificate", verified: false, uploadedAt: daysAgo(26) }
      ]
    },
    {
      id: "APP-2026-0091", title: "Sahyadri Textiles Weaving Shed", applicant: "Fatima Sheikh",
      ownerId: "U-003", ownerEmail: "udyog@demo.in", sector: "Textiles", district: "Kolhapur", midc: "Gokul Shirgaon MIDC", size: "Micro", stage: "Operate",
      investmentLakh: 38, workers: 12, createdAt: daysAgo(70), status: "Approved",
      tracks: [
        { approvalId: "MPCB-CTO", status: "Approved", updatedAt: daysAgo(34), remarks: "Green category, fast-track." },
        { approvalId: "FIRE-FINAL", status: "Approved", updatedAt: daysAgo(36), remarks: "Systems verified on site." },
        { approvalId: "LABOUR-SHOP", status: "Approved", updatedAt: daysAgo(60), remarks: "Issued." }
      ],
      documents: [
        { name: "CTE compliance.pdf", docType: "CTE compliance report", verified: true, uploadedAt: daysAgo(70) }
      ]
    }
  ],
  inspections: [
    { id: "INSP-301", appId: "APP-2026-0142", depts: ["FIRE"], date: dateStr(2), slot: "10:00–12:00", officer: "S. Kadam (Fire)", status: "Scheduled", combined: false },
    { id: "INSP-298", appId: "APP-2026-0157", depts: ["LABOUR", "FIRE"], date: dateStr(4), slot: "11:00–13:00", officer: "Joint team: R. Mane + S. Kadam", status: "Scheduled", combined: true }
  ],
  grievances: [
    // DEMO-ESCALATION (shortlist demo): filed 8d ago with 7-day dept SLA → first
    // GET /api/grievances after POST /api/reset auto-escalates to Nodal Officer
    // via sweepGrievances (see server.js). Grievance page shows the escalation
    // timeline. Reset restores this pre-escalation row.
    { id: "GRV-881", appId: "APP-2026-0157", dept: "MIDC", subject: "Building plan pending beyond 21-day SLA", reporterId: "U-003", status: "Filed with department (7-day SLA)", createdAt: daysAgo(8), updates: ["Filed by applicant — 7-day department SLA started"] },
    { id: "GRV-872", appId: "APP-2026-0091", dept: "MSEDCL", subject: "Meter installation delayed", reporterId: "U-003", status: "Resolved", createdAt: daysAgo(40), updates: ["Filed by applicant", "Resolved in 5 days with speaking order"] }
  ],
  vault: [
    { name: "Aadhaar (verified).pdf", docType: "ID proof", verified: true, source: "DigiLocker-style vault", ownerId: null },
    { name: "PAN card (verified).pdf", docType: "PAN", verified: true, source: "DigiLocker-style vault", ownerId: null },
    { name: "Udyam certificate.pdf", docType: "Udyam / Company incorporation certificate", verified: true, source: "DigiLocker-style vault", ownerId: null }
  ],
  // Append-only audit log (who/when/what). Server appends {ts, actor, action, id} on every
  // file / approve / query / escalate (+ uploads, inspections, sweeps). Never edited in place;
  // only POST /api/reset restores it to []. Read via GET /api/audit (officer only).
  audit: [],
  // Server-side sessions: POST /api/login mints {token, email, role, createdAt, expiresAt}
  // (12h). Fixed demo tokens are never accepted — reset clears all sessions (re-login needed).
  sessions: [],
  counters: { app: 158, insp: 302, grv: 882, user: 3 }
};

function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); }
function dateStr(plus) { const d = new Date(); d.setDate(d.getDate() + plus); return d.toISOString().slice(0, 10); }

module.exports = seed;
