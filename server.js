// Udyog Sarthi — SIH 26130 backend: Express + JSON file storage, SLA/risk/eligibility engine.
// P0 integrity hardening: server-side doc validation, demo auth, input validation,
// auto-deemed + auto-escalation sweeps, inspection↔track linkage. Demo-safe (port 3000,
// logins udyog@demo.in/demo123 + officer@maharashtra.gov.in/officer123 via POST /api/login).
// Shortlist fixes: Group-D parallel gating (Locked until A–C complete), per-track
// completeness % vs seed docs, append-only audit log (GET /api/audit, officer only),
// real renewal dates from validity table + issued date (stored on track), live analytics
// history (approvals append measured live rows kept SEPARATE so SEED headlines never move),
// atomic JSON writes.
// Full fix 1-7: #1 hashed passwords + expiring session tokens + login rate-limit (no fixed
// tokens, no client minting); #2 real-bytes multipart upload with MIME sniff + SHA-256 +
// duplicate/tamper guard; #3 terminal immutability; #4 (frontend) no inline scripts;
// #5 GET /api/renewals live schedule; #6 SEED-frozen analytics + avgNewLive; #7 no
// write-on-read GETs (post-response saves) + grievance double-load fix.
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, "data", "db.json");

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ---------- Demo auth (server-side sessions, hashed passwords, expiring tokens) ----------
// Option A users model: db.users[] is the source of truth.
// - Seed demo accounts (U-001 ADMIN / U-002 OFFICER / U-003 APPLICANT) carry
//   legacy:true + global-SHA hashes (same scheme as the original DEMO_USERS) so
//   demo logins keep working after the users-table migration.
// - New users (self-register + admin-created officers) use per-user
//   crypto.scrypt(password, perUserSalt16hex, 64). Never store plaintext, never
//   return hash/salt over the API (sanitizeUser strips them).
// Sessions are {token, userId, email, role(UPPERCASE), createdAt, expiresAt} (12h).
// Fixed tokens (demo-officer-token / demo-applicant-token) are never accepted.
// Rate limits: login 5 FAILED per IP per 15min → 429 (success clears); register
// 5 attempts per IP per hour → 429. Sessions capped at 200 rows.
function sha256(s) { return crypto.createHash("sha256").update(String(s)).digest("hex"); }
const AUTH_SALT = "udyog-sarthi-demo-salt-v1::26130";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h demo sessions
const DEMO_USERS = {
  "udyog@demo.in": { role: "applicant", salt: AUTH_SALT + ":applicant", passHash: sha256(AUTH_SALT + ":applicant:udyog@demo.in:demo123") },
  "officer@maharashtra.gov.in": { role: "officer", salt: AUTH_SALT + ":officer", passHash: sha256(AUTH_SALT + ":officer:officer@maharashtra.gov.in:officer123") },
};
// ---- password hashing (Option A) ----
function newSaltHex() { return crypto.randomBytes(16).toString("hex"); }
function hashScrypt(password, saltHex) {
  return crypto.scryptSync(String(password), String(saltHex), 64).toString("hex");
}
function verifyPassword(user, emailLower, password) {
  const pw = String(password || "");
  if (!pw || !user || !user.passHash) return false;
  try {
    if (user.legacy) {
      const salt = user.salt || "";
      return sha256(salt + ":" + String(emailLower) + ":" + pw) === user.passHash;
    }
    const saltHex = user.salt || "";
    if (!saltHex) return false;
    const a = Buffer.from(hashScrypt(pw, saltHex), "hex");
    const b = Buffer.from(String(user.passHash), "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (_) { return false; }
}
function validPassword(pw) {
  const s = String(pw || "");
  return s.length >= 8 && /\d/.test(s);
}
function validEmail(em) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(em || "").trim());
}
// ---- roles ----
function normRole(r) { return String(r || "").trim().toUpperCase(); }
function isStaffRole(r) { const u = normRole(r); return u === "OFFICER" || u === "ADMIN"; }
function sanitizeUser(u) {
  if (!u || typeof u !== "object") return null;
  const { passHash, salt, ...rest } = u;
  return rest;
}
function findUserByEmail(db, email) {
  const em = String(email || "").trim().toLowerCase();
  if (!em || !Array.isArray(db.users)) return null;
  return db.users.find(u => String(u.email || "").toLowerCase() === em) || null;
}
function findUserById(db, id) {
  if (!id || !Array.isArray(db.users)) return null;
  return db.users.find(u => u.id === id) || null;
}
// In-memory login rate-limit state: ip -> [failedTs...]. Swept on each login attempt.
const LOGIN_FAILS = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILS = 5;
// Register rate-limit: ip -> [attemptTs...], 5/hr.
const REGISTER_ATTEMPTS = new Map();
const REGISTER_WINDOW_MS = 60 * 60 * 1000;
const REGISTER_MAX = 5;
function loginIp(req) {
  const fwd = (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim();
  return fwd || req.ip || (req.socket && req.socket.remoteAddress) || "unknown";
}
function loginFailsRecent(ip) {
  const now = Date.now();
  const arr = (LOGIN_FAILS.get(ip) || []).filter(t => now - t < LOGIN_WINDOW_MS);
  LOGIN_FAILS.set(ip, arr);
  return arr;
}
function recordLoginFail(ip) {
  const arr = loginFailsRecent(ip);
  arr.push(Date.now());
  LOGIN_FAILS.set(ip, arr);
}
function registerRecent(ip) {
  const now = Date.now();
  const arr = (REGISTER_ATTEMPTS.get(ip) || []).filter(t => now - t < REGISTER_WINDOW_MS);
  REGISTER_ATTEMPTS.set(ip, arr);
  return arr;
}
function recordRegisterAttempt(ip) {
  const arr = registerRecent(ip);
  arr.push(Date.now());
  REGISTER_ATTEMPTS.set(ip, arr);
}
function mintSessionToken(email) {
  return sha256(email + ":" + crypto.randomBytes(32).toString("hex") + ":" + Date.now() + ":" + Math.random());
}
function findSession(db, tok) {
  if (!tok || !Array.isArray(db.sessions)) return null;
  const s = db.sessions.find(x => x.token === tok);
  if (!s) return null;
  if (!s.expiresAt || new Date(s.expiresAt).getTime() <= Date.now()) return null; // expired
  return s;
}
function getBearerToken(req) {
  const h = req.headers.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  let tok = m ? m[1].trim() : null;
  if (!tok) tok = (req.headers["x-demo-token"] || req.headers["x-auth-token"] || "").toString().trim() || null;
  if (!tok) return null;
  if (tok === "demo-officer-token" || tok === "demo-applicant-token") return null;
  return tok;
}
function authSession(req) {
  const tok = getBearerToken(req);
  if (!tok) return null;
  let db;
  try { db = loadDb(); } catch (_) { return null; }
  return findSession(db, tok);
}
function authRole(req) {
  const s = authSession(req);
  return s ? String(s.role || "").toLowerCase() : null;
}
// Actor label for audit rows (lowercase legacy vocabulary).
function actorFor(req) {
  if (req && req.user && req.user.role) {
    const r = normRole(req.user.role);
    if (r === "ADMIN") return "admin";
    if (r === "OFFICER") return "officer";
    return "applicant";
  }
  const r = authRole(req);
  if (r === "officer" || r === "admin") return r;
  return "applicant";
}
function requireOfficer(req, res, next) {
  return requireRole("OFFICER", "ADMIN")(req, res, next);
}
// Canonical auth middleware: 401 when missing/expired/disabled, attaches
// req.user {userId, email, role(UPPERCASE), name} + req.session.
function requireAuth(req, res, next) {
  const tok = getBearerToken(req);
  if (!tok) return res.status(401).json({ error: "Authentication required. POST /api/auth/login (or /api/login) to get a fresh expiring Bearer token, then send Authorization: Bearer <token>." });
  let db;
  try { db = loadDb(); } catch (_) { return res.status(401).json({ error: "Authentication required." }); }
  const s = findSession(db, tok);
  if (!s) return res.status(401).json({ error: "Invalid or expired session. POST /api/auth/login again to get a fresh token." });
  let user = null;
  if (s.userId) user = findUserById(db, s.userId);
  if (!user && s.email) user = findUserByEmail(db, s.email);
  if (!user) return res.status(401).json({ error: "Session user no longer exists. Please log in again." });
  if (user.disabled) return res.status(401).json({ error: "Account disabled. Contact administrator." });
  const role = normRole(user.role || s.role);
  req.session = s;
  req.user = { userId: user.id, email: user.email, role, name: user.name || "" };
  next();
}
// Role gate: requireRole("OFFICER","ADMIN") etc. ADMIN inherits OFFICER
// (an ADMIN passes any check that allows OFFICER). Roles case-insensitive.
function requireRole(...roles) {
  const want = roles.map(normRole);
  const expanded = new Set(want);
  if (want.includes("OFFICER")) expanded.add("ADMIN"); // ADMIN inherits OFFICER
  return (req, res, next) => {
    const tok = getBearerToken(req);
    if (!tok) return res.status(401).json({ error: "Authentication required. POST /api/auth/login first." });
    let db;
    try { db = loadDb(); } catch (_) { return res.status(401).json({ error: "Authentication required." }); }
    const s = findSession(db, tok);
    if (!s) return res.status(401).json({ error: "Invalid or expired session. POST /api/auth/login again." });
    let user = null;
    if (s.userId) user = findUserById(db, s.userId);
    if (!user && s.email) user = findUserByEmail(db, s.email);
    if (!user) return res.status(401).json({ error: "Session user no longer exists." });
    if (user.disabled) return res.status(401).json({ error: "Account disabled." });
    const role = normRole(user.role || s.role);
    req.session = s;
    req.user = { userId: user.id, email: user.email, role, name: user.name || "" };
    if (!expanded.has(role)) return res.status(403).json({ error: `Role ${want.join("/")} required for this action.` });
    next();
  };
}
// Ownership helpers (no leak: applicants get 404 for others' rows).
function isOwnerApp(app, user) {
  if (!app || !user) return false;
  if (app.ownerId && app.ownerId === user.userId) return true;
  if (app.ownerEmail && user.email && String(app.ownerEmail).toLowerCase() === String(user.email).toLowerCase()) return true;
  return false;
}
function createSessionForUser(db, user) {
  if (!Array.isArray(db.sessions)) db.sessions = [];
  const now = Date.now();
  db.sessions = db.sessions.filter(s => s.expiresAt && new Date(s.expiresAt).getTime() > now);
  const token = mintSessionToken(String(user.email).toLowerCase());
  const expiresAt = new Date(now + SESSION_TTL_MS).toISOString();
  db.sessions.push({ token, userId: user.id, email: String(user.email).toLowerCase(), role: normRole(user.role), createdAt: new Date(now).toISOString(), expiresAt });
  while (db.sessions.length > 200) db.sessions.shift();
  return { token, expiresAt };
}

// ---------- DB helpers ----------
// Atomic JSON persistence: write to a unique tmp file in the same directory, then
// rename over db.json. Rename is atomic on the same volume, so a crash or a
// concurrent writer can never leave a half-written db.json behind. (Multi-process
// read-modify-write can still interleave at the logical level — single demo server
// is the supported topology; tmp names carry pid+random so two writers never clash
// on the tmp file itself.)
let __writeSeq = 0;
function writeDbAtomic(obj) {
  const tmp = `${DB_FILE}.${process.pid}.${Date.now()}.${(__writeSeq += 1)}.${Math.floor(Math.random() * 1e6)}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
    fs.renameSync(tmp, DB_FILE);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch (_) { /* best effort cleanup */ }
    throw e;
  }
}
function loadDb() {
  if (!fs.existsSync(DB_FILE)) {
    delete require.cache[require.resolve("./data/seed.js")];
    const seed = require("./data/seed.js");
    writeDbAtomic(seed);
  }
  const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  // Demo-safe migrations for db.json files written before the shortlist fixes:
  if (!Array.isArray(db.audit)) db.audit = [];
  if (!Array.isArray(db.history)) db.history = [];
  if (!Array.isArray(db.sessions)) db.sessions = [];
  if (!Array.isArray(db.vault)) db.vault = [];
  // Option A migration: users model + ownership fields for pre-model db.json files.
  // In-memory only (no write-on-read); the next write persists the migration.
  if (!Array.isArray(db.users) || !db.users.length) {
    try {
      delete require.cache[require.resolve("./data/seed.js")];
      const seed = require("./data/seed.js");
      if (Array.isArray(seed.users) && seed.users.length) db.users = JSON.parse(JSON.stringify(seed.users));
    } catch (_) { /* seed unavailable */ }
    if (!Array.isArray(db.users)) db.users = [];
  }
  if (!Array.isArray(db.applicantProfiles)) db.applicantProfiles = [];
  if (!Array.isArray(db.officerProfiles)) db.officerProfiles = [];
  if (db.counters && typeof db.counters === "object" && db.counters.user === undefined) {
    const maxU = (db.users || []).reduce((m, u) => {
      const n = parseInt(String(u.id || "").split("-")[1] || "0", 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    db.counters.user = Math.max(3, maxU);
  }
  if (Array.isArray(db.applications)) {
    db.applications.forEach(a => {
      if (!a.ownerId) { a.ownerId = "U-003"; }
      if (!a.ownerEmail) { a.ownerEmail = "udyog@demo.in"; }
      if (!Array.isArray(a.documents)) a.documents = [];
    });
  }
  if (Array.isArray(db.vault)) {
    db.vault.forEach(v => { if (v.ownerId === undefined) v.ownerId = null; });
  }
  if (Array.isArray(db.grievances)) {
    db.grievances.forEach(g => { if (!g.reporterId) g.reporterId = "U-003"; });
  }
  // U4 migration: backfill human-translated `a_mr` (top-20 K-articles) for db.json
  // files written before Marathi answers landed. In-memory only; next write persists.
  if (Array.isArray(db.knowledge) && db.knowledge.length) {
    try {
      delete require.cache[require.resolve("./data/seed.js")];
      const seed = require("./data/seed.js");
      const mrById = new Map((seed.knowledge || []).filter(k => k.a_mr).map(k => [k.id, k.a_mr]));
      if (mrById.size) db.knowledge.forEach(k => { if (!k.a_mr && mrById.has(k.id)) k.a_mr = mrById.get(k.id); });
    } catch (_) { /* seed unavailable — serve English fallback */ }
  }
  return db;
}
function saveDb(db) { writeDbAtomic(db); }

// Append-only audit log. Entries are {ts, actor, action, id} — never edited or
// deleted in place (only POST /api/reset restores the seed's []). Reads via
// GET /api/audit (officer only).
function appendAudit(db, actor, action, id) {
  if (!Array.isArray(db.audit)) db.audit = [];
  db.audit.push({ ts: new Date().toISOString(), actor, action, id });
}

// ---------- Domain engine ----------
const HAZARD = { "Chemicals & Pharma": 35, "Textiles": 15, "Manufacturing": 20, "Food Processing": 15, "Auto & Engineering": 20, "IT & ESDM": 2, "Logistics & Warehousing": 8 };
const SIZEB = { Micro: 0, Small: 8, Medium: 16, Large: 26 };
const VALID_SIZES = ["Micro", "Small", "Medium", "Large"];
const VALID_STAGES = ["Establish", "Operate", "Expand"];
const VALID_TRACK_ACTIONS = ["approve", "query", "reject", "review", "inspect", "deemed"];
const VALID_INSP_STATUS = ["Scheduled", "Completed", "Cancelled"];
const MAX_STR = 2000;

function approvalById(db, id) { return db.approvals.find(a => a.id === id); }

// SLA clock is anchored to an immutable start (anti-gaming fix):
// deadline = slaStartedAt (or createdAt fallback) + slaDays. Officer touches that
// only bump `updatedAt` for display — they NEVER move the deadline.
function trackBaseTime(app, track) {
  return track.slaStartedAt || track.updatedAt || track.createdAt || (app && app.createdAt);
}

function trackSla(db, app, track) {
  const ap = approvalById(db, track.approvalId);
  if (!ap) return null;
  if (["Approved", "Rejected", "Deemed"].includes(track.status)) return { left: 0, state: track.status === "Approved" || track.status === "Deemed" ? "done" : "closed" };
  const base = new Date(trackBaseTime(app, track)).getTime();
  if (!Number.isFinite(base)) return null;
  const deadline = base + ap.slaDays * 864e5;
  const left = Math.ceil((deadline - Date.now()) / 864e5);
  return { left, state: left < 0 ? "breached" : left <= 5 ? "urgent" : "ontrack", deadline: new Date(deadline).toISOString().slice(0, 10) };
}

function riskScore(db, app) {
  let s = 10 + (HAZARD[app.sector] || 12) + (SIZEB[app.size] || 8);
  (app.tracks || []).forEach(t => { const ap = approvalById(db, t.approvalId); if (ap && ap.inspection) s += 4; if (t.status === "Queried") s += 6; });
  const verified = (app.documents || []).filter(d => d.verified).length;
  const total = Math.max(1, (app.documents || []).length);
  s -= Math.round((verified / total) * 10);
  s = Math.max(5, Math.min(98, s));
  return { score: s, band: s < 35 ? "Green" : s <= 65 ? "Amber" : "Red", route: s < 35 ? "Fast-track / deemed-approval eligible" : s <= 65 ? "Desk review + selective inspection" : "Mandatory joint site inspection + committee" };
}

function enrichApp(db, app) {
  const band = riskScore(db, app).band;
  const tracks = (app.tracks || []).map(t => {
    const ap = approvalById(db, t.approvalId) || {};
    return { ...t, ...ap, sla: trackSla(db, app, t), completeness: trackCompleteness(db, app, t), renewal: renewalFor(db, app, t, band) };
  });
  const req = tracks.reduce((s, t) => s + t.completeness.required, 0);
  const got = tracks.reduce((s, t) => s + t.completeness.matched, 0);
  return { ...app, tracks, risk: riskScore(db, app), completenessPct: req ? Math.round(got / req * 100) : 100 };
}

// ---------- Parallel gating: Group-D Locked until Groups A–C complete ----------
// CTO / Final Fire NOC are legally impossible on day 1 — they require prior-stage
// (CTE/installation) compliance. New filings store D tracks as status "Locked" with
// a lockedReason whenever the same application has unfinished A/B/C predecessor
// tracks; approving the predecessors unlocks them to "Applied" (system audit entry).
// Tracks filed before this rule (no `gated` marker, incl. demo seeds) are
// grandfathered so reset demos and historical rows never flip.
function gatePredecessors(db, app, track) {
  const ap = approvalById(db, track.approvalId);
  if (!ap || !Array.isArray(ap.gatedBy) || !ap.gatedBy.length) return [];
  return (app.tracks || []).filter(t => {
    if (t.approvalId === track.approvalId) return false;
    const p = approvalById(db, t.approvalId);
    return p && ap.gatedBy.includes(p.parallelGroup);
  });
}
function gatePendingNames(db, app, track) {
  return gatePredecessors(db, app, track)
    .filter(t => !["Approved", "Deemed"].includes(t.status))
    .map(t => { const ap = approvalById(db, t.approvalId); return ap ? ap.name : t.approvalId; });
}
function gateBlockedReason(db, app, track) {
  if (!track.gated) return null; // grandfathered pre-rule track
  const pending = gatePendingNames(db, app, track);
  if (!pending.length) return null;
  return `Locked: Group-D (pre-production) requires Group A–C clearance first — ${pending.length} pending: ${pending.join("; ")}`;
}
// Promote Locked→Applied wherever the gate just cleared. The SLA clock starts at
// unlock (the department cannot breach before the file was legally actionable);
// the filing-time clock is preserved in createdAt for audit.
function unlockGatedTracks(db, app) {
  const out = [];
  (app.tracks || []).forEach(t => {
    if (t.status !== "Locked" || !t.gated) return;
    if (gateBlockedReason(db, app, t)) return;
    const now = new Date().toISOString();
    t.status = "Applied";
    t.slaStartedAt = now; // actionable now — fair SLA start
    t.updatedAt = now;
    t.remarks = `${t.remarks || ""} [Gate cleared: Group A–C complete — unlocked to Applied ${now.slice(0, 10)}]`.trim();
    appendAudit(db, "system", `unlock:${t.approvalId}`, app.id);
    out.push(t.approvalId);
  });
  return out;
}

// ---------- Completeness %: required docs (seed approvals[].docs) vs uploaded ----------
// Deterministic fuzzy match on normalized docType strings: exact → substring →
// significant-token overlap. Exposed per track (matched/missing lists) and per app.
function normDoc(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9\u0900-\u097f ]/g, " ").replace(/\s+/g, " ").trim(); }
function docMatches(required, uploadedType) {
  const r = normDoc(required), u = normDoc(uploadedType);
  if (!r || !u) return false;
  if (r === u) return true;
  if ((r.includes(u) || u.includes(r)) && Math.min(r.length, u.length) >= 8) return true;
  const sig = w => w.length > 3 && !["with", "from", "report", "proof", "details"].includes(w);
  const rt = new Set(r.split(" ").filter(sig)), ut = new Set(u.split(" ").filter(sig));
  if (!rt.size || !ut.size) return false;
  let inter = 0;
  rt.forEach(w => { if (ut.has(w)) inter += 1; });
  return inter >= 2 && inter / Math.min(rt.size, ut.size) >= 0.5;
}
function trackCompleteness(db, app, track) {
  const ap = approvalById(db, track.approvalId);
  const required = (ap && Array.isArray(ap.docs)) ? ap.docs : [];
  const uploaded = (app.documents || []).map(d => d.docType || d.name || "");
  const matched = required.filter(r => uploaded.some(u => docMatches(r, u)));
  const missing = required.filter(r => !uploaded.some(u => docMatches(r, u)));
  return { pct: required.length ? Math.round(matched.length / required.length * 100) : 100, matched: matched.length, required: required.length, missing };
}

// ---------- Renewals: validity table (seed) + issued date (stored on track) ----------
// validityDays per approval; CTO varies by risk band (Red 5y / Green 10y per K16/K46);
// one-time grants (land, building, power, Udyam) carry null = no renewal. Officer
// approval stamps issuedAt + validityDays snapshot + renewalDue on the track; legacy
// approved rows backfill issuedAt from updatedAt exactly once.
const FALLBACK_VALIDITY = { "MIDC-LAND": null, "MIDC-BLDG": null, "MIDC-WATER": 365, "MPCB-CTE": 1825, "MPCB-CTO": 1825, "LABOUR-FACT": 365, "LABOUR-SHOP": 365, "LABOUR-BOCW": 365, "FIRE-PROV": 365, "FIRE-FINAL": 365, "MSEDCL-PWR": null, "DOI-UDYAM": null };
function validityDaysFor(ap, band) {
  if (!ap) return null;
  if (ap.validityByBand && band && ap.validityByBand[band] !== undefined) return ap.validityByBand[band];
  if (ap.validityDays !== undefined) return ap.validityDays;
  return FALLBACK_VALIDITY[ap.id] !== undefined ? FALLBACK_VALIDITY[ap.id] : 365;
}
function renewalFor(db, app, track, band) {
  const ap = approvalById(db, track.approvalId);
  const issuedAt = track.issuedAt || (["Approved", "Deemed"].includes(track.status) ? (track.updatedAt || app.createdAt) : null);
  if (!ap || !issuedAt) return null;
  const validityDays = track.validityDays !== undefined && track.validityDays !== null ? track.validityDays : validityDaysFor(ap, band || riskScore(db, app).band);
  if (!validityDays) return null; // one-time grant — no renewal
  let due = track.renewalDue;
  if (!due) {
    const t = new Date(issuedAt).getTime();
    if (!Number.isFinite(t)) return null;
    due = new Date(t + validityDays * 864e5).toISOString().slice(0, 10);
  }
  const daysLeft = Math.ceil((new Date(due).getTime() - Date.now()) / 864e5);
  return { issuedAt: String(issuedAt).slice(0, 10), validityDays, due, daysLeft, state: daysLeft < 0 ? "overdue" : daysLeft <= 60 ? "due-soon" : "valid" };
}
function stampRenewal(db, app, track) {
  const ap = approvalById(db, track.approvalId);
  if (!ap) return;
  const now = new Date().toISOString();
  if (!track.issuedAt) track.issuedAt = now;
  const band = riskScore(db, app).band;
  if (track.validityDays === undefined || track.validityDays === null) {
    const v = validityDaysFor(ap, band);
    if (v) track.validityDays = v;
  }
  if (track.validityDays && !track.renewalDue) {
    track.renewalDue = new Date(new Date(track.issuedAt).getTime() + track.validityDays * 864e5).toISOString().slice(0, 10);
  }
}

function matchChecklist(db, p) {
  const list = db.approvals.filter(a =>
    (a.stage.includes(p.stage)) &&
    (a.sizes.includes(p.size)) &&
    (a.sectors.includes("ALL") || a.sectors.includes(p.sector))
  );
  // Operate stage for tiny IT units: CTO not needed w/o CTE-relevant plant — keep CTO only if prior CTE-like track exists; simplified: include.
  const seen = new Set(); const out = [];
  list.forEach(a => { if (!seen.has(a.id)) { seen.add(a.id); out.push(a); } });
  const order = { A: 0, B: 1, C: 2, D: 3 };
  out.sort((x, y) => order[x.parallelGroup] - order[y.parallelGroup]);
  const groups = {};
  out.forEach(a => { (groups[a.parallelGroup] = groups[a.parallelGroup] || []).push(a.name); });
  const totalFee = out.reduce((s, a) => s + a.fee, 0);
  const critical = out.length ? Math.max(...out.map(a => a.slaDays)) : 0;
  const insp = out.filter(a => a.inspection);
  const combined = insp.length >= 2 ? `Common Inspection suggested: ${insp.map(a => a.dept).join(" + ")} can inspect jointly — one visit instead of ${insp.length}.` : null;
  return { items: out, groups, totalFee, criticalDays: critical, combined, count: out.length };
}

function eligibleSchemes(db, p) {
  return db.schemes.map(s => {
    const e = s.eligibility;
    const okSize = e.sizes.includes("ALL") || e.sizes.includes(p.size);
    const okSec = e.sectors.includes("ALL") || e.sectors.includes(p.sector);
    const okInv = (p.investmentLakh || 0) >= (e.minInvestmentLakh || 0);
    const eligible = okSize && okSec && okInv;
    const est = eligible ? Math.min(s.maxBenefitLakh, Math.round((p.investmentLakh || 0) * 0.25 * 10) / 10) : 0;
    return { ...s, eligible, estLakh: est, reasons: [okSize ? null : `size ${p.size} not covered`, okSec ? null : `sector not covered`, okInv ? null : `needs ≥ ₹${e.minInvestmentLakh}L investment`].filter(Boolean) };
  }).sort((a, b) => (b.eligible - a.eligible) || (b.estLakh - a.estLakh));
}

// ---------- Input validation helpers ----------
function str(v) { return typeof v === "string" ? v : ""; }
function isValidDateStr(v) { const t = new Date(v).getTime(); return Number.isFinite(t); }

function validateChecklistProfile(db, p) {
  const errs = [];
  if (!p || typeof p !== "object") return ["body must be a JSON object"];
  if (!p.sector || !db.sectors.includes(p.sector)) errs.push(`sector must be one of: ${db.sectors.join(", ")}`);
  if (!VALID_SIZES.includes(p.size)) errs.push(`size must be one of: ${VALID_SIZES.join(", ")}`);
  if (!VALID_STAGES.includes(p.stage)) errs.push(`stage must be one of: ${VALID_STAGES.join(", ")}`);
  if (p.district !== undefined && p.district !== "" && p.district !== null && !db.districts.includes(p.district)) errs.push(`district must be one of: ${db.districts.join(" | ")}`);
  if (p.investmentLakh !== undefined && p.investmentLakh !== null && p.investmentLakh !== "" && !Number.isFinite(Number(p.investmentLakh))) errs.push("investmentLakh must be a number");
  if (p.workers !== undefined && p.workers !== null && p.workers !== "" && !Number.isFinite(Number(p.workers))) errs.push("workers must be a number");
  return errs;
}

// Server-side document validation. Client `passed`/`verified`/`checks` are IGNORED.
// Server decides verified from its own checks: extension, size evidence, expiry, holder name, docType.
// For multipart uploads the server uses REAL bytes (sizeBytes = bytes.length, MIME sniffed
// from magic numbers, SHA-256 over bytes). For JSON fallback it uses the supplied sizeBytes.
const ALLOWED_EXT = [".pdf", ".jpg", ".jpeg", ".png"];
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const MAX_DOC_BYTES = 10 * 1024 * 1024;
function validateDocumentInput(d) {
  const checks = [];
  const errs = [];
  d = d && typeof d === "object" ? d : {};

  // 1. name + extension
  const rawName = typeof d.name === "string" ? d.name.trim() : "";
  let extOk = false;
  if (!rawName || rawName.length > 255) {
    checks.push({ ok: false, msg: "File name missing or longer than 255 chars" });
    errs.push("name is required (1–255 chars)");
  } else if (/[\\\/]/.test(rawName) || rawName.includes("..")) {
    checks.push({ ok: false, msg: `File name "${rawName}" contains path characters — rejected` });
    errs.push("name must be a plain filename without path characters");
  } else {
    const lower = rawName.toLowerCase();
    extOk = ALLOWED_EXT.some(e => lower.endsWith(e));
    checks.push({ ok: extOk, msg: extOk ? `File type ${rawName.split(".").pop().toUpperCase()} accepted (PDF/JPG/PNG)` : `File type NOT accepted — "${rawName}" must end in .pdf/.jpg/.jpeg/.png` });
    if (!extOk) errs.push("name must end in .pdf/.jpg/.jpeg/.png");
  }

  // 2. docType
  const docType = typeof d.docType === "string" ? d.docType.trim() : "";
  const typeOk = docType.length >= 2 && docType.length <= 120;
  checks.push({ ok: typeOk, msg: typeOk ? `Document type "${docType}" recognised` : "Document type missing — pick the checklist document this file proves" });
  if (!typeOk) errs.push("docType is required (2–120 chars)");

  // 3. size evidence (server never trusts client `passed`; needs real byte count)
  let sizeBytes = null;
  if (d.sizeBytes !== undefined && d.sizeBytes !== null && d.sizeBytes !== "") sizeBytes = Number(d.sizeBytes);
  else if (d.sizeKb !== undefined && d.sizeKb !== null && d.sizeKb !== "") sizeBytes = Number(d.sizeKb) * 1024;
  else if (d.fileSize !== undefined && d.fileSize !== null && d.fileSize !== "") sizeBytes = Number(d.fileSize);
  else if (d.size !== undefined && d.size !== null && d.size !== "" && typeof d.size === "number") sizeBytes = Number(d.size);
  let sizeOk = false;
  if (!Number.isFinite(sizeBytes)) {
    checks.push({ ok: false, msg: "File size evidence missing — re-upload via the UI (server requires sizeBytes)" });
    errs.push("sizeBytes is required (number, bytes, ≤10MB)");
  } else if (!(sizeBytes > 0)) {
    checks.push({ ok: false, msg: "File size must be > 0 bytes" });
    errs.push("sizeBytes must be > 0");
  } else if (sizeBytes > MAX_DOC_BYTES) {
    checks.push({ ok: false, msg: `File size ${(sizeBytes / 1048576).toFixed(2)} MB EXCEEDS 10 MB — compress and re-upload` });
    errs.push("file exceeds 10 MB limit");
  } else {
    sizeOk = true;
    checks.push({ ok: true, msg: `File size ${(sizeBytes / 1024).toFixed(0)} KB (under 10 MB limit)` });
  }

  // 4. mime (optional — validated only if supplied)
  const mimeRaw = (d.mime || d.mimeType || d.fileType || d.type || "").toString().trim().toLowerCase();
  if (mimeRaw) {
    const mimeOk = ALLOWED_MIME.includes(mimeRaw);
    checks.push({ ok: mimeOk, msg: mimeOk ? `MIME ${mimeRaw} accepted` : `MIME "${mimeRaw}" not accepted — use PDF/JPG/PNG` });
    if (!mimeOk) errs.push("mime must be application/pdf, image/jpeg or image/png");
  }

  // 5. expiry (optional — fails only if supplied and expired/unparseable)
  const expRaw = d.expiry || d.expiryDate || d.validUntil || d.exp || "";
  let expOk = true;
  if (expRaw) {
    const t = new Date(expRaw).getTime();
    if (!Number.isFinite(t)) { expOk = false; checks.push({ ok: false, msg: `Expiry "${expRaw}" is not a valid date` }); errs.push("expiry must be a valid date"); }
    else if (t <= Date.now()) { expOk = false; checks.push({ ok: false, msg: `EXPIRED on ${String(expRaw).slice(0, 10)} — renew before filing` }); errs.push("document is expired"); }
    else checks.push({ ok: true, msg: `Validity OK (expires ${String(expRaw).slice(0, 10)})` });
  } else {
    checks.push({ ok: true, msg: "No expiry applicable — OK" });
  }

  // 6. holder / name-on-document (required — proves the file belongs to the applicant)
  const holder = (d.holderName || d.nameOnDoc || d.applicantName || d.holder || d.applicant || "").toString().trim();
  const holderOk = holder.length > 2 && holder.length <= 120;
  checks.push({ ok: holderOk, msg: holderOk ? `Name match: "${holder}" present on document record` : "Name on document missing — must match applicant (holderName required, >2 chars)" });
  if (!holderOk) errs.push("holderName is required (>2 chars, must match applicant)");

  const verified = extOk && typeOk && sizeOk && expOk && holderOk && errs.length === 0;
  return { checks, errs, verified, name: rawName, docType: docType || "General", sizeBytes, holder };
}

// ---------- Real bytes: MIME sniff + SHA-256 + duplicate/tamper guard ----------
// Zero-dep multipart handling (multer would require a package.json change, frozen by
// task scope — this manual parser gives the same guarantee: real bytes on the wire,
// server-computed size/hash/MIME, no client `passed` trust). Magic-number sniff:
// PDF %PDF, PNG 89 50 4E 47, JPEG FF D8 FF.
function sniffMime(buf) {
  if (!buf || buf.length < 4) return "application/octet-stream";
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return "application/pdf";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return "image/jpeg";
  return "application/octet-stream";
}
function sha256Bytes(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }
// Minimal multipart/form-data parser over a raw Buffer. Returns {fields, files}
// where files[] = {field, filename, mimeClaimed, bytes:Buffer}. Binary-safe: headers
// decoded as latin1, file bytes sliced, never string-mangled.
function parseMultipart(buf, contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
  if (!m) return null;
  const boundary = Buffer.from("--" + (m[1] || m[2]).trim());
  const parts = [];
  let start = 0;
  while (true) {
    const i = buf.indexOf(boundary, start);
    if (i < 0) break;
    parts.push({ from: start, at: i });
    start = i + boundary.length;
    if (buf.slice(start, start + 2).toString() === "--") break; // closing delimiter
  }
  const fields = {}, files = [];
  for (let k = 1; k < parts.length; k++) {
    let chunk = buf.slice(parts[k - 1].at + boundary.length, parts[k].at);
    // strip leading CRLF / trailing CRLF
    if (chunk[0] === 0x0D && chunk[1] === 0x0A) chunk = chunk.slice(2);
    if (chunk[chunk.length - 2] === 0x0D && chunk[chunk.length - 1] === 0x0A) chunk = chunk.slice(0, -2);
    const hEnd = chunk.indexOf(Buffer.from("\r\n\r\n"));
    if (hEnd < 0) continue;
    const head = chunk.slice(0, hEnd).toString("latin1");
    const body = chunk.slice(hEnd + 4);
    const nm = /name="([^"]*)"/i.exec(head);
    const fn = /filename="([^"]*)"/i.exec(head);
    const ct = /content-type:\s*([^\r\n;]+)/i.exec(head);
    const name = nm ? nm[1] : "";
    if (fn && fn[1] !== undefined) {
      files.push({ field: name, filename: fn[1], mimeClaimed: ct ? ct[1].trim().toLowerCase() : "", bytes: body });
    } else {
      fields[name] = body.toString("utf8");
    }
  }
  return { fields, files };
}
// Duplicate/tamper guard: same byte-hash filed under a DIFFERENT docType means the
// same file is being reused to prove two different checklist items — reject. Same
// hash + same docType is an idempotent re-upload — also reject as duplicate so the
// vault never holds two rows for one byte-stream.
function findHashConflict(db, hash, docType) {
  if (!hash) return null;
  const all = [];
  (db.applications || []).forEach(a => (a.documents || []).forEach(d => all.push({ where: a.id, ...d })));
  (db.vault || []).forEach(v => all.push({ where: "vault", ...v }));
  const same = all.filter(d => d.hash === hash);
  if (!same.length) return null;
  const diffType = same.find(d => (d.docType || "") !== docType);
  if (diffType) return { kind: "tamper", prev: diffType };
  return { kind: "duplicate", prev: same[0] };
}

// ---------- Live analytics history ----------
// The 38-row seed baseline stays untouched AND frozen in headlines; every real completion
// (officer approve, manual deemed, auto-deemed sweep) appends one measured
// {regime:"new", live:true} row reported SEPARATELY as avgNewLive/liveHistoryCount.
// GET /api/analytics avgNew/byDept exclude live rows so SEED never moves (README rule).
// Capped to keep db.json small.
function recordCompletion(db, app, track, prevStatus) {
  if (["Approved", "Deemed"].includes(prevStatus)) return; // already counted
  if (!["Approved", "Deemed"].includes(track.status)) return;
  const ap = approvalById(db, track.approvalId);
  if (!ap) return;
  const base = new Date(track.slaStartedAt || app.createdAt).getTime();
  const done = new Date(track.updatedAt || new Date().toISOString()).getTime();
  const days = Number.isFinite(base) && Number.isFinite(done) ? Math.max(1, Math.ceil((done - base) / 864e5)) : 1;
  db.history.push({ regime: "new", dept: ap.dept, days, live: true, appId: app.id, approvalId: track.approvalId, at: new Date().toISOString().slice(0, 10) });
  const liveRows = db.history.filter(h => h.live);
  while (liveRows.length > 500) {
    const i = db.history.findIndex(h => h.live);
    if (i < 0) break;
    db.history.splice(i, 1);
    liveRows.shift();
  }
}

// ---------- Auto sweeps (deemed approvals + grievance escalation + gate unlocks) ----------
function sweepDeemed(db) {
  const nowIso = new Date().toISOString();
  const nowDate = nowIso.slice(0, 10);
  let changed = false;
  const fired = [];
  db.applications.forEach(a => {
    (a.tracks || []).forEach(t => {
      if (["Approved", "Rejected", "Deemed", "Queried", "Locked"].includes(t.status)) {
        // Queried pauses the clock (ball in applicant court); Locked is not yet
        // legally actionable so its clock cannot breach; terminals need no sweep.
        // Still backfill the immutable clock so future touches can't game it.
        if (!t.slaStartedAt) { t.slaStartedAt = t.updatedAt || a.createdAt; changed = true; }
        return;
      }
      // Backfill immutable clock for legacy seeds exactly once (demo-safe: anchor to
      // last touch, not filing, so existing seeds stay green; new filings anchor to now).
      if (!t.slaStartedAt) { t.slaStartedAt = t.updatedAt || a.createdAt; changed = true; }
      const sla = trackSla(db, a, t);
      if (sla && sla.state === "breached") {
        const ap = approvalById(db, t.approvalId);
        const prev = t.status;
        t.status = "Deemed";
        t.updatedAt = nowIso;
        t.remarks = `${t.remarks || ""} [Auto-deemed: SLA ${ap ? ap.slaDays : "?"}d breached on ${nowDate} — deemed approval auto-issued]`.trim();
        stampRenewal(db, a, t);
        recordCompletion(db, a, t, prev);
        appendAudit(db, "system", `auto-deemed:${t.approvalId}`, a.id);
        changed = true;
        fired.push({ appId: a.id, approvalId: t.approvalId });
      }
    });
    if ((a.tracks || []).length && a.tracks.every(t => ["Approved", "Deemed"].includes(t.status))) a.status = "Approved";
  });
  return { changed, fired };
}

function grievanceAgeDays(g) {
  const t = new Date(g.createdAt).getTime();
  if (!Number.isFinite(t)) return 0;
  return (Date.now() - t) / 864e5;
}
function sweepGrievances(db) {
  const nowDate = new Date().toISOString().slice(0, 10);
  let changed = false;
  const escalated = [];
  db.grievances.forEach(g => {
    if (g.status === "Resolved") return;
    const age = grievanceAgeDays(g);
    if ((g.status || "").startsWith("Filed") && age > 7) {
      g.status = "Escalated to Nodal Officer";
      g.updates = g.updates || [];
      g.updates.push(`Auto-escalated after 7-day SLA breach — ${nowDate} with full case timeline`);
      appendAudit(db, "system", "auto-escalate", g.id);
      escalated.push(g.id);
      changed = true;
    } else if (g.status === "Escalated to Nodal Officer" && age > 14) {
      g.status = "Escalated to Secretary (Industries)";
      g.updates = g.updates || [];
      g.updates.push(`Auto-escalated to Secretary after 14 days — ${nowDate} with full case timeline`);
      appendAudit(db, "system", "auto-escalate", g.id);
      escalated.push(g.id);
      changed = true;
    }
  });
  return { changed, escalated };
}
function runSweeps(db) {
  const r1 = sweepDeemed(db);
  const r2 = sweepGrievances(db);
  let unlocked = [];
  db.applications.forEach(a => { unlocked = unlocked.concat(unlockGatedTracks(db, a).map(id => ({ appId: a.id, approvalId: id }))); });
  const changed = r1.changed || r2.changed || unlocked.length > 0;
  return { changed, deemed: r1.fired, escalated: r2.escalated, unlocked };
}

// ---------- Knowledge AI: TF-IDF ranked search (real retrieval, no LLM/embeddings) ----------
const KSTOP = new Set(("what,is,the,are,and,for,to,of,in,on,a,an,how,do,i,my,does,which,who,when,where,why,with,from,by,or,be,as,at,it,its,this,that,these,those,can,will,should,could,there,their,them,they,you,your,we,our,us,an,ek,ka,ki,ke,me,se,par,aur,hai,kya,ko").split(","));
function ktok(s) {
  return String(s || "").toLowerCase().split(/[^a-z0-9\u0900-\u097f]+/).filter(w => w.length > 2 && !KSTOP.has(w));
}
// Corpus: live db.knowledge, topped up from seed so old db.json files (10 FAQs) still serve 60.
function knowCorpus(db) {
  let c = Array.isArray(db.knowledge) ? [...db.knowledge] : [];
  if (c.length < 40) {
    try {
      delete require.cache[require.resolve("./data/seed.js")];
      const seed = require("./data/seed.js");
      const seen = new Set(c.map(k => k.q));
      (seed.knowledge || []).forEach(k => { if (!seen.has(k.q)) { seen.add(k.q); c.push(k); } });
    } catch (e) { /* seed unavailable — serve what db has */ }
  }
  return c;
}
function tfidfSearch(corpus, q, limit) {
  const t0 = Date.now();
  const qTerms = ktok(q);
  const N = corpus.length;
  const docToks = corpus.map(k => ktok(k.q + " " + k.a + " " + (k.tags || []).join(" ")));
  const df = {};
  docToks.forEach(ts => new Set(ts).forEach(t => { df[t] = (df[t] || 0) + 1; }));
  const idf = t => Math.log((N + 1) / ((df[t] || 0) + 1)) + 1;
  const qTf = {};
  qTerms.forEach(t => { qTf[t] = (qTf[t] || 0) + 1; });
  const qLen = Math.sqrt(Object.values(qTf).reduce((s, c) => s + c * c, 0)) || 1;
  const scored = corpus.map((k, i) => {
    const tf = {};
    docToks[i].forEach(t => { tf[t] = (tf[t] || 0) + 1; });
    const dl = docToks[i].length || 1;
    let dot = 0, dLen = 0;
    Object.keys(tf).forEach(t => { const w = (tf[t] / dl) * idf(t); dLen += w * w; if (qTf[t]) dot += w * (qTf[t] / qTerms.length) * idf(t); });
    const matched = qTerms.filter(t => tf[t]);
    // small honest tag boost: exact tag-token overlap
    const tagHit = (k.tags || []).filter(t => qTerms.some(q => String(t).toLowerCase().includes(q) || q.includes(String(t).toLowerCase()))).length;
    const score = (dot / ((Math.sqrt(dLen) || 1) * qLen)) + tagHit * 0.02;
    return { k, score, matched };
  });
  scored.sort((a, b) => b.score - a.score);
  return {
    results: scored.slice(0, limit).map(r => ({
      id: r.k.id || null, q: r.k.q, a: r.k.a, tags: r.k.tags || [], source: r.k.source || "Demo corpus",
      score: Math.round(r.score * 1000) / 1000, matched: [...new Set(r.matched)]
    })),
    tookMs: Date.now() - t0
  };
}
// Honest eval set: n>=30 hand-labelled overfit illustrative TF-IDF cosine no embeddings no LLM.
// Accuracy = P@1. Original 8 kept verbatim + 24 adversarial (Hinglish/typo/single-keyword/Marathi-fail/near-synonym).
// Hand-labelled, overfit, illustrative — corpus and queries co-authored, so misses are ungamed and published.
const KNOW_EVAL = [
  { q: "deemed approval after SLA breach", expect: "K03" },
  { q: "difference between CTE and CTO consent", expect: "K01" },
  { q: "combine fire and factory inspections into one visit", expect: "K04" },
  { q: "PSI 2019 capital subsidy", expect: "K26" },
  { q: "provisional vs final fire NOC", expect: "K22" },
  { q: "Udyam registration Aadhaar PAN", expect: "K25" },
  { q: "grievance escalate nodal officer secretary", expect: "K08" },
  { q: "CTO validity renewal red green years", expect: "K16" },
  { q: "CTO ke liye kaise apply kare ETP proof", expect: "K15" },
  { q: "fire NOC kaise milega provisional", expect: "K22" },
  { q: "Udyam registration ke liye kya documents chahiye Aadhaar", expect: "K25" },
  { q: "grievance kaise file kare escalation nodal", expect: "K44" },
  { q: "deemed approval matlab kya SLA breach par", expect: "K03" },
  { q: "deemd aproval SLA breach", expect: "K03" },
  { q: "provishional fire NOC layout", expect: "K22" },
  { q: "grievence escalaton nodal officer", expect: "K08" },
  { q: "CTE CTO conscent difference", expect: "K01" },
  { q: "CTO", expect: "K15" },
  { q: "renewal", expect: "K07" },
  { q: "inspection", expect: "K04" },
  { q: "subsidy", expect: "K26" },
  { q: "factory permit vs operating consent difference", expect: "K01" },
  { q: "is auto-approval legally binding certificate", expect: "K40" },
  { q: "joint site visit fire labour departments", expect: "K04" },
  { q: "how long consent to operate valid red green", expect: "K16" },
  { q: "परवाना कसा मिळवावा MIDC जमीन", expect: "K11" },
  { q: "अग्निशमन ना हरकत प्रमाणपत्र कसे मिळेल", expect: "K22" },
  { q: "risk score kaise calculate hota hai green amber red", expect: "K52" },
  { q: "critical path fees total how computed", expect: "K47" },
  { q: "vault", expect: "K34" },
  { q: "renewal validty factory fire annual", expect: "K46" },
  { q: "offline demo reset kaise kare npm start", expect: "K59" }
];
function evalKnowledge(corpus) {
  const t0 = Date.now();
  const details = KNOW_EVAL.map(t => {
    const top = tfidfSearch(corpus, t.q, 1).results[0];
    return { q: t.q, expect: t.expect, got: top && top.id, hit: !!(top && top.id === t.expect) };
  });
  const correct = details.filter(d => d.hit).length;
  return { n: details.length, correct, accuracy: Math.round(correct / details.length * 1000) / 1000, details, tookMs: Date.now() - t0, note: "n>=30 hand-labelled overfit illustrative TF-IDF cosine no embeddings no LLM" };
}

// ---------- Knowledge i18n: Marathi answers with English fallback ----------
// Top-20 K-articles carry human-translated `a_mr` in seed; rest fall back to English.
// Ranking stays English TF-IDF (deterministic); only the displayed `a` is localized.
// Each mr result gets {a, a_en, a_mr|null, lang, fallback} so UI can badge fallbacks.
function localizeKnowledge(corpus, results, lang) {
  const wantMr = String(lang || "").toLowerCase().startsWith("mr");
  if (!wantMr) return results;
  const byId = new Map((corpus || []).map(k => [k.id, k]));
  return (results || []).map(r => {
    const src = (r.id && byId.get(r.id)) || {};
    const mr = src.a_mr || r.a_mr || null;
    if (mr) return { ...r, a: mr, a_en: src.a || r.a, a_mr: mr, lang: "mr", fallback: false };
    return { ...r, a_en: src.a || r.a, a_mr: null, lang: "mr", fallback: true };
  });
}

// ---------- API ----------
// Canonical login — users-table lookup, legacy-SHA for seed demos, scrypt for new.
// Rate limit: 5 FAILED attempts per IP per 15min → 429. Success clears the window.
function handleLogin(req, res) {
  const ip = loginIp(req);
  if (loginFailsRecent(ip).length >= LOGIN_MAX_FAILS) {
    return res.status(429).json({ error: "Too many login attempts — try again in 15 minutes (5 failed tries / 15min per IP)." });
  }
  const { email, password } = req.body || {};
  const em = (email || "").toString().trim().toLowerCase();
  const pw = (password || "").toString();
  const db0 = loadDb();
  let user = findUserByEmail(db0, em);
  // Fallback for pre-model db.json that somehow missed migration: legacy constants.
  let ok = user && !user.disabled && verifyPassword(user, em, pw);
  if (!ok && !user && DEMO_USERS[em]) {
    const du = DEMO_USERS[em];
    ok = !!(pw && sha256(du.salt + ":" + em + ":" + pw) === du.passHash);
    if (ok) {
      const db = loadDb();
      if (!Array.isArray(db.users)) db.users = [];
      const nid = `U-${String((db.counters && db.counters.user ? db.counters.user : 3) + 1).padStart(3, "0")}`;
      user = { id: nid, name: em === "udyog@demo.in" ? "Demo Entrepreneur" : "Demo Officer", email: em, role: normRole(du.role), salt: du.salt, passHash: du.passHash, legacy: true, disabled: false, createdAt: new Date().toISOString() };
      db.users.push(user);
      if (db.counters) db.counters.user = (db.counters.user || 3) + 1;
      saveDb(db);
    }
  }
  if (!ok || !user) {
    recordLoginFail(ip);
    return res.status(401).json({ error: "Invalid credentials. Demo: udyog@demo.in/demo123 (applicant), officer@maharashtra.gov.in/officer123 (officer), admin@maharashtra.gov.in/admin123 (admin)." });
  }
  LOGIN_FAILS.set(ip, []); // success resets the fail window for this IP
  const db = loadDb();
  const fresh = findUserById(db, user.id) || findUserByEmail(db, em);
  if (!fresh || fresh.disabled) { recordLoginFail(ip); return res.status(401).json({ error: "Account disabled." }); }
  const { token, expiresAt } = createSessionForUser(db, fresh);
  saveDb(db);
  res.json({ role: normRole(fresh.role), token, email: String(fresh.email).toLowerCase(), expiresAt, userId: fresh.id, name: fresh.name || "" });
}
app.post("/api/auth/login", handleLogin);
app.post("/api/login", handleLogin); // compat shim — same handler

function handleLogout(req, res) {
  const tok = getBearerToken(req);
  if (!tok) return res.json({ ok: true });
  const db = loadDb();
  if (Array.isArray(db.sessions)) {
    const n0 = db.sessions.length;
    db.sessions = db.sessions.filter(s => s.token !== tok);
    if (db.sessions.length !== n0) saveDb(db);
  }
  res.json({ ok: true });
}
app.post("/api/auth/logout", handleLogout);
app.post("/api/logout", handleLogout); // compat shim

// Self-registration — APPLICANT only. The ONLY way to create OFFICER is
// POST /api/admin/officers (ADMIN). Supplying role officer/admin here → 403.
app.post("/api/auth/register", (req, res) => {
  const ip = loginIp(req);
  if (registerRecent(ip).length >= REGISTER_MAX) {
    return res.status(429).json({ error: "Too many registrations — try again in an hour (5/hr per IP)." });
  }
  recordRegisterAttempt(ip);
  const b = req.body || {};
  if (b.role !== undefined && b.role !== null && String(b.role).trim() !== "") {
    const r = normRole(b.role);
    if (r === "OFFICER" || r === "ADMIN") {
      return res.status(403).json({ error: "Self-registration is APPLICANT only. Officer accounts are created by an admin via POST /api/admin/officers." });
    }
    if (r !== "APPLICANT") return res.status(400).json({ error: "role must be APPLICANT (or omitted) for self-registration." });
  }
  const name = String(b.name || "").trim();
  const email = String(b.email || "").trim().toLowerCase();
  const password = String(b.password || "");
  const phone = String(b.phone || "").trim().slice(0, 20);
  const org = String(b.org || b.organization || "").trim().slice(0, 200);
  if (name.length < 2 || name.length > 100) return res.status(400).json({ error: "name is required (2–100 chars)" });
  if (!validEmail(email)) return res.status(400).json({ error: "valid email is required" });
  if (!validPassword(password)) return res.status(400).json({ error: "password must be ≥8 chars with at least 1 digit" });
  const db = loadDb();
  if (!Array.isArray(db.users)) db.users = [];
  if (findUserByEmail(db, email)) return res.status(409).json({ error: "Email already registered. POST /api/auth/login instead." });
  if (!db.counters) db.counters = { app: 158, insp: 302, grv: 882, user: 3 };
  if (db.counters.user === undefined) db.counters.user = 3 + db.users.length;
  db.counters.user += 1;
  const id = `U-${String(db.counters.user).padStart(3, "0")}`;
  const saltHex = newSaltHex();
  const user = { id, name, email, role: "APPLICANT", salt: saltHex, passHash: hashScrypt(password, saltHex), legacy: false, disabled: false, createdAt: new Date().toISOString() };
  db.users.push(user);
  if (!Array.isArray(db.applicantProfiles)) db.applicantProfiles = [];
  db.applicantProfiles.push({ userId: id, name, org, phone });
  const { token, expiresAt } = createSessionForUser(db, user);
  appendAudit(db, "applicant", "register", id);
  saveDb(db);
  res.status(201).json({ role: "APPLICANT", token, email, expiresAt, userId: id, name, user: sanitizeUser(user) });
});

app.get("/api/me", requireAuth, (req, res) => {
  const db = loadDb();
  const user = findUserById(db, req.user.userId);
  if (!user) return res.status(401).json({ error: "User not found." });
  const out = sanitizeUser(user);
  out.role = normRole(user.role);
  const ap = (db.applicantProfiles || []).find(p => p.userId === user.id) || null;
  const op = (db.officerProfiles || []).find(p => p.userId === user.id) || null;
  if (ap) out.applicantProfile = ap;
  if (op) out.officerProfile = op;
  res.json(out);
});

// Admin: list users (never hashes). ?role=OFFICER|APPLICANT|ADMIN filter.
app.get("/api/admin/users", requireRole("ADMIN"), (req, res) => {
  const db = loadDb();
  let list = Array.isArray(db.users) ? [...db.users] : [];
  if (req.query.role) {
    const f = normRole(req.query.role);
    list = list.filter(u => normRole(u.role) === f);
  }
  res.json({ count: list.length, users: list.map(sanitizeUser) });
});

// Admin: the ONLY way to create an OFFICER.
app.post("/api/admin/officers", requireRole("ADMIN"), (req, res) => {
  const b = req.body || {};
  const name = String(b.name || "").trim();
  const email = String(b.email || "").trim().toLowerCase();
  const password = String(b.password || "");
  const dept = String(b.dept || "").trim();
  const designation = String(b.designation || "").trim().slice(0, 200);
  if (name.length < 2 || name.length > 100) return res.status(400).json({ error: "name is required (2–100 chars)" });
  if (!validEmail(email)) return res.status(400).json({ error: "valid email is required" });
  if (!validPassword(password)) return res.status(400).json({ error: "password must be ≥8 chars with at least 1 digit" });
  const db = loadDb();
  const deptIds = new Set((db.departments || []).map(d => d.id));
  if (!dept || !deptIds.has(dept)) return res.status(400).json({ error: `dept must be one of: ${[...deptIds].join(", ")}` });
  if (findUserByEmail(db, email)) return res.status(409).json({ error: "Email already registered." });
  if (!db.counters) db.counters = { app: 158, insp: 302, grv: 882, user: 3 };
  if (db.counters.user === undefined) db.counters.user = 3;
  db.counters.user += 1;
  const id = `U-${String(db.counters.user).padStart(3, "0")}`;
  const saltHex = newSaltHex();
  const user = { id, name, email, role: "OFFICER", dept, designation: designation || `${dept} Officer`, salt: saltHex, passHash: hashScrypt(password, saltHex), legacy: false, disabled: false, createdAt: new Date().toISOString() };
  db.users.push(user);
  if (!Array.isArray(db.officerProfiles)) db.officerProfiles = [];
  db.officerProfiles.push({ userId: id, dept, designation: user.designation });
  appendAudit(db, "admin", "create-officer", id);
  saveDb(db);
  res.status(201).json({ user: sanitizeUser(user) });
});

// Admin: disable/enable + dept move. Disabling purges all sessions for that user.
app.patch("/api/admin/users/:id", requireRole("ADMIN"), (req, res) => {
  const db = loadDb();
  const user = findUserById(db, req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  const b = req.body || {};
  const allowed = ["disabled", "dept"];
  for (const k of Object.keys(b)) {
    if (!allowed.includes(k)) return res.status(400).json({ error: `field "${k}" is not updatable. Allowed: ${allowed.join(", ")}` });
  }
  if (b.disabled !== undefined) {
    if (typeof b.disabled !== "boolean") return res.status(400).json({ error: "disabled must be boolean" });
    if (user.id === req.user.userId && b.disabled) return res.status(400).json({ error: "Cannot disable your own admin account." });
    user.disabled = b.disabled;
    if (b.disabled && Array.isArray(db.sessions)) {
      db.sessions = db.sessions.filter(s => s.userId !== user.id && String(s.email || "").toLowerCase() !== String(user.email).toLowerCase());
    }
  }
  if (b.dept !== undefined) {
    if (normRole(user.role) !== "OFFICER") return res.status(400).json({ error: "dept can only be set on OFFICER users" });
    const deptIds = new Set((db.departments || []).map(d => d.id));
    if (typeof b.dept !== "string" || !deptIds.has(b.dept)) return res.status(400).json({ error: `dept must be one of: ${[...deptIds].join(", ")}` });
    user.dept = b.dept;
    const op = (db.officerProfiles || []).find(p => p.userId === user.id);
    if (op) op.dept = b.dept;
  }
  appendAudit(db, "admin", `update-user:${user.id}`, user.id);
  saveDb(db);
  res.json({ user: sanitizeUser(user) });
});

// Public demo status for judges (no hashes, no tokens).
app.get("/api/demo/status", (req, res) => {
  const db = loadDb();
  const users = (db.users || []).map(u => ({ id: u.id, email: u.email, role: normRole(u.role), disabled: !!u.disabled }));
  res.json({
    ok: true, demo: true, offline: true,
    logins: [
      { email: "udyog@demo.in", role: "APPLICANT", password: "demo123" },
      { email: "officer@maharashtra.gov.in", role: "OFFICER", password: "officer123" },
      { email: "admin@maharashtra.gov.in", role: "ADMIN", password: "admin123" }
    ],
    users, userCount: users.length,
    counts: { applications: (db.applications || []).length, inspections: (db.inspections || []).length, grievances: (db.grievances || []).length, sessions: (db.sessions || []).length },
    reset: "POST /api/reset?demo=1 (public demo reset) or POST /api/reset with ADMIN Bearer token"
  });
});

app.get("/api/knowledge/search", (req, res) => {
  const db = loadDb();
  const corpus = knowCorpus(db);
  const q = String(req.query.q || "");
  const limit = Math.max(1, Math.min(10, parseInt(req.query.limit, 10) || 5));
  const lang = String(req.query.lang || "");
  const translated = corpus.filter(k => k.a_mr).length;
  if (!q.trim()) return res.json({ query: q, meta: { method: "TF-IDF cosine (no embeddings, no LLM)", corpusSize: corpus.length, ranked: false, lang: lang.toLowerCase().startsWith("mr") ? "mr" : "en", translated }, results: localizeKnowledge(corpus, corpus.slice(0, limit), lang) });
  const { results, tookMs } = tfidfSearch(corpus, q, limit);
  const ev = evalKnowledge(corpus);
  res.json({ query: q, meta: { method: "TF-IDF cosine over normalized tokens (no embeddings, no LLM)", corpusSize: corpus.length, ranked: true, tookMs, lang: lang.toLowerCase().startsWith("mr") ? "mr" : "en", translated, eval: { n: ev.n, correct: ev.correct, accuracy: ev.accuracy } }, results: localizeKnowledge(corpus, results, lang) });
});
app.post("/api/knowledge/search", (req, res) => {
  const db = loadDb();
  const corpus = knowCorpus(db);
  const q = String((req.body || {}).q || "");
  const limit = Math.max(1, Math.min(10, Number((req.body || {}).limit) || 5));
  const lang = String((req.body || {}).lang || req.query.lang || "");
  const translated = corpus.filter(k => k.a_mr).length;
  if (!q.trim()) return res.json({ query: q, meta: { method: "TF-IDF cosine (no embeddings, no LLM)", corpusSize: corpus.length, ranked: false, lang: lang.toLowerCase().startsWith("mr") ? "mr" : "en", translated }, results: localizeKnowledge(corpus, corpus.slice(0, limit), lang) });
  const { results, tookMs } = tfidfSearch(corpus, q, limit);
  const ev = evalKnowledge(corpus);
  res.json({ query: q, meta: { method: "TF-IDF cosine over normalized tokens (no embeddings, no LLM)", corpusSize: corpus.length, ranked: true, tookMs, lang: lang.toLowerCase().startsWith("mr") ? "mr" : "en", translated, eval: { n: ev.n, correct: ev.correct, accuracy: ev.accuracy } }, results: localizeKnowledge(corpus, results, lang) });
});
app.get("/api/knowledge/eval", (req, res) => {
  const corpus = knowCorpus(loadDb());
  const ev = evalKnowledge(corpus);
  res.json({ method: "TF-IDF cosine (no embeddings, no LLM)", corpusSize: corpus.length, ...ev });
});

app.get("/api/meta", (req, res) => {
  const db = loadDb();
  res.json({ departments: db.departments, sectors: db.sectors, districts: db.districts, midcAreas: db.midcAreas, knowledge: db.knowledge, schemes: db.schemes, approvals: db.approvals });
});

app.post("/api/checklist", (req, res) => {
  const db = loadDb();
  const p = req.body || {};
  const errs = validateChecklistProfile(db, p);
  if (errs.length) return res.status(400).json({ error: "Invalid checklist profile", details: errs });
  const m = matchChecklist(db, p);
  // Honest gating preview: Group-D items cannot start day 1 — they unlock only
  // after the same application's Group A–C tracks clear.
  const items = m.items.map(a => (a.parallelGroup === "D"
    ? { ...a, gate: { requires: ["A", "B", "C"], note: "Group-D (pre-production): starts Locked, unlocks after this application's Group A–C approvals clear. CTO before CTE compliance is legally impossible." } }
    : a));
  res.json({ profile: p, ...m, items, schemes: eligibleSchemes(db, p).filter(s => s.eligible).slice(0, 3) });
});

app.post("/api/schemes/match", (req, res) => {
  const db = loadDb();
  const p = req.body || {};
  if (!p || typeof p !== "object") return res.status(400).json({ error: "Body must be a JSON object" });
  res.json(eligibleSchemes(db, p));
});

app.get("/api/applications", requireAuth, (req, res) => {
  // Ownership scoping: APPLICANT sees own-only; OFFICER/ADMIN see all (+ mine flag).
  // No write-on-read: sweeps run in memory, response goes out first, persistence
  // happens post-response (or on the next write / 60s interval). A crash between
  // res.json and saveDb only delays the sweep — next read recomputes it.
  const db = loadDb();
  const sweep = runSweeps(db);
  const staff = isStaffRole(req.user.role);
  let apps = db.applications.map(a => enrichApp(db, a));
  if (!staff) {
    apps = apps.filter(a => a.ownerId === req.user.userId || (a.ownerEmail && req.user.email && String(a.ownerEmail).toLowerCase() === String(req.user.email).toLowerCase()));
  } else {
    apps = apps.map(a => ({ ...a, mine: a.ownerId === req.user.userId }));
  }
  res.json(apps);
  if (sweep.changed) { try { saveDb(db); } catch (e) { console.error("post-response save failed:", e.message); } }
});

app.get("/api/applications/:id", requireAuth, (req, res) => {
  const db = loadDb();
  const sweep = runSweeps(db);
  const a = db.applications.find(x => x.id === req.params.id);
  // No leak: applicants probing others' ids get 404 (same as missing).
  if (!a) return res.status(404).json({ error: "Not found" });
  if (!isStaffRole(req.user.role) && !isOwnerApp(a, req.user)) return res.status(404).json({ error: "Not found" });
  const payload = enrichApp(db, a);
  if (isStaffRole(req.user.role)) payload.mine = a.ownerId === req.user.userId;
  res.json(payload);
  if (sweep.changed) { try { saveDb(db); } catch (e) { console.error("post-response save failed:", e.message); } }
});

app.post("/api/applications", requireAuth, (req, res) => {
  const db = loadDb();
  const p = req.body || {};
  if (!p || typeof p !== "object") return res.status(400).json({ error: "Body must be a JSON object" });
  const errs = validateChecklistProfile(db, p);
  if (errs.length) return res.status(400).json({ error: "Invalid application profile", details: errs });
  if (p.title !== undefined && p.title !== null && String(p.title).length > 200) return res.status(400).json({ error: "title must be ≤200 chars" });
  if (p.applicant !== undefined && p.applicant !== null && String(p.applicant).length > 100) return res.status(400).json({ error: "applicant must be ≤100 chars" });
  const check = matchChecklist(db, p);
  if (!check.items.length) return res.status(400).json({ error: "No approvals match this profile — check sector/size/stage" });
  // reusedDocs must already be vault-verified — never trust a client filename claim.
  const reused = Array.isArray(p.reusedDocs) ? p.reusedDocs : [];
  for (const n of reused) {
    if (typeof n !== "string" || !n.trim() || n.length > 255) return res.status(400).json({ error: "reusedDocs must be filename strings (≤255 chars)" });
  }
  const vaultNames = new Set((db.vault || []).filter(v => v.verified).map(v => v.name));
  db.counters.app += 1;
  const id = `APP-2026-0${db.counters.app}`;
  const now = new Date().toISOString();
  // Provisional tracks: Group-D approvals start Locked when this application has
  // unfinished A/B/C predecessors (CTO cannot be Applied day-1). Apps with no
  // same-app predecessors (e.g. IT-Micro-Operate) start Applied — prior-stage
  // compliance is assumed from the earlier Establish filing.
  const provisional = check.items.map(a => ({ approvalId: a.id, status: "Applied", createdAt: now, slaStartedAt: now, updatedAt: now, remarks: "Filed via Single Window. Documents pre-validated." }));
  const appRec = {
    id, title: p.title || `${p.sector || "Industrial"} project — ${p.midc || p.district || ""}`,
    applicant: p.applicant || req.user.name || "Demo Entrepreneur",
    ownerId: req.user.userId, ownerEmail: String(req.user.email).toLowerCase(),
    sector: p.sector, district: p.district, midc: p.midc, size: p.size, stage: p.stage,
    investmentLakh: Number(p.investmentLakh) || 50, workers: Number(p.workers) || 10,
    createdAt: now, status: "In progress",
    tracks: provisional,
    documents: reused.filter(n => vaultNames.has(n)).map(n => {
      const v = db.vault.find(x => x.name === n);
      return { name: n, docType: (v && v.docType) || "Reused from vault", verified: true, uploadedAt: now };
    })
  };
  appRec.tracks.forEach(t => {
    const ap = approvalById(db, t.approvalId);
    if (ap && Array.isArray(ap.gatedBy) && ap.gatedBy.length) {
      t.gated = true;
      const pending = gatePendingNames(db, appRec, t);
      if (pending.length) {
        t.status = "Locked";
        t.lockedReason = `Locked: Group-D (pre-production) requires Group A–C clearance first — ${pending.length} pending: ${pending.join("; ")}`;
        t.remarks = `${t.remarks} [${t.lockedReason}]`;
      }
    }
  });
  db.applications.unshift(appRec);
  appendAudit(db, actorFor(req), "file", id);
  saveDb(db);
  res.json(enrichApp(db, appRec));
});

// Per-track read: completeness % vs seed required docs, gate state, renewal dates.
app.get("/api/applications/:id/track", requireAuth, (req, res) => {
  const db = loadDb();
  const sweep = runSweeps(db);
  const a = db.applications.find(x => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: "Not found" });
  if (!isStaffRole(req.user.role) && !isOwnerApp(a, req.user)) return res.status(404).json({ error: "Not found" });
  const e = enrichApp(db, a);
  res.json({ appId: e.id, status: e.status, completenessPct: e.completenessPct, tracks: e.tracks });
  if (sweep.changed) { try { saveDb(db); } catch (err) { console.error("post-response save failed:", err.message); } }
});

app.patch("/api/applications/:id/track", requireRole("OFFICER", "ADMIN"), (req, res) => {
  const db = loadDb();
  const a = db.applications.find(x => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: "Not found" });
  const { approvalId, action, remarks, officer } = req.body || {};
  if (!approvalId || typeof approvalId !== "string") return res.status(400).json({ error: "approvalId is required" });
  if (!action || !VALID_TRACK_ACTIONS.includes(action)) return res.status(400).json({ error: `action must be one of: ${VALID_TRACK_ACTIONS.join(", ")}` });
  if (remarks !== undefined && remarks !== null && String(remarks).length > MAX_STR) return res.status(400).json({ error: `remarks must be ≤${MAX_STR} chars` });
  if (officer !== undefined && officer !== null && String(officer).length > 100) return res.status(400).json({ error: "officer must be ≤100 chars" });
  const t = a.tracks.find(t => t.approvalId === approvalId);
  if (!t) return res.status(404).json({ error: "Track not found" });
  // Locked tracks carry no legal effect yet — approve/reject/deem while gated is
  // exactly the "CTO before CTE" impossibility judges probe for.
  if (t.status === "Locked" && ["approve", "reject", "deemed"].includes(action)) {
    return res.status(400).json({ error: `Track is Locked — clear Group A–C first. ${t.lockedReason || gateBlockedReason(db, a, t) || ""}`.trim() });
  }
  // Terminal immutability: Approved / Deemed / Rejected can never flip (esp.
  // Approved/Deemed → Queried, which would resurrect a settled file). Idempotent
  // re-assertion of the SAME terminal (approve on Approved) is a no-op success so
  // double-clicks don't 400 during the demo.
  const TERMINAL = ["Approved", "Rejected", "Deemed"];
  const map = { approve: "Approved", query: "Queried", reject: "Rejected", review: "Under review", inspect: "Inspection scheduled", deemed: "Deemed" };
  const next = map[action] || t.status;
  if (TERMINAL.includes(t.status) && next !== t.status) {
    return res.status(400).json({ error: `Track is ${t.status} (terminal, immutable) — cannot move to ${next}. File a renewal / re-apply for a fresh track.` });
  }
  const prevStatus = t.status;
  t.status = next;
  // NOTE: updatedAt moves but slaStartedAt NEVER moves — officer touches cannot game the SLA clock.
  if (!t.slaStartedAt) t.slaStartedAt = t.updatedAt || a.createdAt;
  t.updatedAt = new Date().toISOString();
  t.remarks = (remarks || t.remarks || "") + (officer ? ` — ${officer}` : "");
  if (["approve", "deemed"].includes(action) && ["Approved", "Deemed"].includes(t.status)) stampRenewal(db, a, t);
  recordCompletion(db, a, t, prevStatus);
  appendAudit(db, "officer", `${action}:${approvalId}`, a.id);
  if (a.tracks.every(t => ["Approved", "Deemed"].includes(t.status))) a.status = "Approved";
  else if (a.tracks.some(t => t.status === "Rejected")) a.status = "Attention needed";
  // Opportunistic sweep: a breach elsewhere in this app auto-deems on any officer write.
  runSweeps(db);
  saveDb(db);
  res.json(enrichApp(db, a));
});

// Document attach + SERVER-SIDE pre-validation. Client `passed` flag is ignored.
// JSON path: validates extension/size(holder)/expiry + optional fileHash duplicate guard.
// Real-bytes path: POST /:id/documents/upload (multipart) — server computes size/MIME/hash.
// Owner-or-staff: APPLICANT may attach only to own apps (others → 403, no leak via 404
// for missing ids); OFFICER/ADMIN may attach to any.
app.post("/api/applications/:id/documents", requireAuth, (req, res) => {
  const db = loadDb();
  const a = db.applications.find(x => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: "Not found" });
  if (!isStaffRole(req.user.role) && !isOwnerApp(a, req.user)) return res.status(403).json({ error: "Forbidden — you can upload documents only to your own applications." });
  const d = req.body || {};
  if (!d || typeof d !== "object") return res.status(400).json({ error: "Body must be a JSON object" });
  const v = validateDocumentInput(d);
  if (!v.verified) {
    // Forgery / incomplete evidence: do NOT store, do NOT touch vault, do NOT clear queries.
    return res.status(422).json({ error: "Document failed server-side validation", details: v.errs, checks: v.checks, verified: false });
  }
  // Optional client-computed hash (hex sha256 of bytes) participates in the
  // duplicate/tamper guard even on the JSON path; multipart path always has it.
  const hashRaw = (d.fileHash || d.hash || d.sha256 || "").toString().trim().toLowerCase();
  const hash = /^[0-9a-f]{64}$/.test(hashRaw) ? hashRaw : null;
  if (hash) {
    const conflict = findHashConflict(db, hash, v.docType);
    if (conflict && conflict.kind === "tamper") {
      return res.status(422).json({ error: `Same file bytes already filed as "${conflict.prev.docType}" (${conflict.prev.where}) — cannot re-file identical bytes under "${v.docType}". Upload the correct document.`, verified: false, hash });
    }
    if (conflict) {
      return res.status(409).json({ error: `Duplicate upload — identical file bytes already stored (${conflict.prev.where} / "${conflict.prev.docType}").`, verified: false, hash });
    }
  }
  const mimeClaimed = (d.mime || d.mimeType || d.fileType || d.type || "").toString().trim().toLowerCase() || null;
  const rec = { name: v.name, docType: v.docType, verified: true, uploadedAt: new Date().toISOString(), checks: v.checks.map(c => c.msg), holder: v.holder, sizeBytes: v.sizeBytes, mime: mimeClaimed, hash, ownerId: req.user.userId, ownerEmail: String(req.user.email).toLowerCase() };
  a.documents.push(rec);
  if (!db.vault.find(x => x.name === rec.name)) db.vault.push({ name: rec.name, docType: rec.docType, verified: true, source: "Verified via Udyog Sarthi", sizeBytes: rec.sizeBytes, mime: rec.mime, hash, ownerId: req.user.userId });
  else {
    const vv = db.vault.find(x => x.name === rec.name);
    if (hash && !vv.hash) { vv.hash = hash; vv.sizeBytes = rec.sizeBytes; vv.mime = rec.mime; }
  }
  const t = a.tracks.find(t => t.status === "Queried");
  if (t) { t.status = "Under review"; t.updatedAt = new Date().toISOString(); t.remarks = "Re-submitted document under review."; }
  appendAudit(db, actorFor(req), `upload:${rec.docType}`, a.id);
  saveDb(db);
  res.json(enrichApp(db, a));
});

// Real-bytes upload: multipart/form-data {file, docType, expiry?, holderName?}.
// Zero-dep parser (see parseMultipart) — multer-equivalent without a package.json change.
// Server is the ONLY measurer: sizeBytes=bytes.length, mime=sniffed magic, hash=SHA-256(bytes).
app.post("/api/applications/:id/documents/upload", requireAuth, express.raw({ type: "multipart/form-data", limit: "12mb" }), (req, res) => {
  const db = loadDb();
  const a = db.applications.find(x => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: "Not found" });
  if (!isStaffRole(req.user.role) && !isOwnerApp(a, req.user)) return res.status(403).json({ error: "Forbidden — you can upload documents only to your own applications." });
  const parsed = parseMultipart(req.body, req.headers["content-type"] || "");
  if (!parsed || !parsed.files.length) {
    return res.status(400).json({ error: "No file part found — send multipart/form-data with a `file` field.", verified: false });
  }
  const f = parsed.files.find(x => x.field === "file") || parsed.files[0];
  const fields = parsed.fields || {};
  const docType = (fields.docType || "").toString().trim();
  const expiry = (fields.expiry || fields.expiryDate || "").toString().trim();
  const holderName = (fields.holderName || fields.holder || fields.applicant || "").toString().trim();
  const bytes = f.bytes || Buffer.alloc(0);
  const sizeBytes = bytes.length;
  const sniffed = sniffMime(bytes);
  const hash = sha256Bytes(bytes);
  const originalName = Buffer.from(f.filename || "upload.bin", "latin1").toString("utf8") || "upload.bin";
  // Extension must still be pdf/jpg/png; MIME must sniff to an allowed type (tamper:
  // renaming .exe → .pdf is caught here because magic won't match).
  const v = validateDocumentInput({ name: originalName, docType, sizeBytes, mime: sniffed, expiry: expiry || undefined, holderName });
  const checks = [...v.checks];
  checks.unshift({ ok: true, msg: `Received ${sizeBytes} bytes, MIME sniffed as ${sniffed}, SHA-256 ${hash.slice(0, 12)}…` });
  if (sniffed === "application/octet-stream") {
    return res.status(422).json({ error: "File bytes not recognised as PDF/JPG/PNG (MIME sniff failed) — upload a real PDF/JPG/PNG, not a renamed file.", details: ["mime sniff failed"], checks, verified: false, sizeBytes, mime: sniffed, hash });
  }
  if (!v.verified) {
    return res.status(422).json({ error: "Document failed server-side validation", details: v.errs, checks, verified: false, sizeBytes, mime: sniffed, hash });
  }
  const conflict = findHashConflict(db, hash, v.docType);
  if (conflict && conflict.kind === "tamper") {
    return res.status(422).json({ error: `Same file bytes already filed as "${conflict.prev.docType}" (${conflict.prev.where}) — cannot re-file identical bytes under "${v.docType}".`, verified: false, sizeBytes, mime: sniffed, hash });
  }
  if (conflict) {
    return res.status(409).json({ error: `Duplicate upload — identical file bytes already stored (${conflict.prev.where} / "${conflict.prev.docType}").`, verified: false, sizeBytes, mime: sniffed, hash });
  }
  const rec = { name: v.name, docType: v.docType, verified: true, uploadedAt: new Date().toISOString(), checks: checks.map(c => c.msg), holder: v.holder, sizeBytes, mime: sniffed, hash, ownerId: req.user.userId, ownerEmail: String(req.user.email).toLowerCase() };
  if (!Array.isArray(a.documents)) a.documents = [];
  a.documents.push(rec);
  if (!db.vault.find(x => x.name === rec.name)) db.vault.push({ name: rec.name, docType: rec.docType, verified: true, source: "Verified via Udyog Sarthi (byte-hashed)", sizeBytes, mime: sniffed, hash, ownerId: req.user.userId });
  else {
    const vv = db.vault.find(x => x.name === rec.name);
    vv.sizeBytes = sizeBytes; vv.mime = sniffed; vv.hash = hash;
  }
  const t = a.tracks.find(t => t.status === "Queried");
  if (t) { t.status = "Under review"; t.updatedAt = new Date().toISOString(); t.remarks = "Re-submitted document under review."; }
  appendAudit(db, actorFor(req), `upload:${rec.docType}`, a.id);
  saveDb(db);
  res.status(201).json({ verified: true, sizeBytes, mime: sniffed, hash, checks: rec.checks, app: enrichApp(db, a) });
});

app.get("/api/vault", requireAuth, (req, res) => {
  const db = loadDb();
  if (isStaffRole(req.user.role)) return res.json(db.vault || []);
  // APPLICANT: own docs + shared (ownerId null/undefined) only.
  const mine = (db.vault || []).filter(v => v.ownerId === null || v.ownerId === undefined || v.ownerId === req.user.userId);
  res.json(mine);
});

app.get("/api/inspections", requireAuth, (req, res) => {
  const db = loadDb();
  if (isStaffRole(req.user.role)) return res.json(db.inspections || []);
  const ownIds = new Set((db.applications || []).filter(a => isOwnerApp(a, req.user)).map(a => a.id));
  res.json((db.inspections || []).filter(i => ownIds.has(i.appId)));
});
app.post("/api/inspections", requireAuth, (req, res) => {
  const db = loadDb();
  const b = req.body || {};
  if (!b || typeof b !== "object") return res.status(400).json({ error: "Body must be a JSON object" });
  if (!b.appId || typeof b.appId !== "string") return res.status(400).json({ error: "appId is required" });
  const a = db.applications.find(x => x.id === b.appId);
  if (!a) return res.status(404).json({ error: "Application not found" });
  // Ownership: applicants may book only for their own applications (others → 403).
  if (!isStaffRole(req.user.role) && !isOwnerApp(a, req.user)) return res.status(403).json({ error: "Forbidden — you can book inspections only for your own applications." });
  if (!Array.isArray(b.depts) || !b.depts.length) return res.status(400).json({ error: "depts must be a non-empty array of department ids" });
  const deptIds = new Set(db.departments.map(d => d.id));
  for (const dpt of b.depts) {
    if (typeof dpt !== "string" || !deptIds.has(dpt)) return res.status(400).json({ error: `unknown dept: ${dpt}. Must be one of: ${[...deptIds].join(", ")}` });
  }
  if (!b.date || !isValidDateStr(b.date)) return res.status(400).json({ error: "date is required (YYYY-MM-DD)" });
  if (!b.slot || typeof b.slot !== "string" || b.slot.trim().length < 3 || b.slot.length > 50) return res.status(400).json({ error: "slot is required (3–50 chars)" });
  db.counters.insp += 1;
  const rec = { id: `INSP-${db.counters.insp}`, appId: b.appId, depts: b.depts, date: String(b.date).slice(0, 10), slot: b.slot.trim(), officer: "To be assigned", status: "Scheduled", combined: b.depts.length > 1, bookedBy: req.user.userId };
  // Double-booking warning (same date+slot, overlapping dept, still scheduled) — warn, don't block demo.
  const clash = db.inspections.find(i => i.status === "Scheduled" && i.date === rec.date && i.slot === rec.slot && i.depts.some(dpt => rec.depts.includes(dpt)));
  if (clash) rec.warning = `Double-booking warning: ${clash.id} already occupies ${rec.date} ${rec.slot} for ${clash.depts.join("+")}`;
  db.inspections.unshift(rec);
  // Linkage: booking moves the relevant tracks to "Inspection scheduled" so the tracker visibly moves.
  const now = new Date().toISOString();
  (a.tracks || []).forEach(t => {
    const ap = approvalById(db, t.approvalId);
    if (ap && rec.depts.includes(ap.dept) && ["Applied", "Under review", "Queried"].includes(t.status)) {
      t.status = "Inspection scheduled";
      t.updatedAt = now;
      t.remarks = `${t.remarks || ""} [Inspection ${rec.id} scheduled ${rec.date} ${rec.slot}]`.trim();
    }
  });
  appendAudit(db, actorFor(req), "book-inspection", rec.id);
  saveDb(db);
  res.status(201).json(rec);
});
app.patch("/api/inspections/:id", requireRole("OFFICER", "ADMIN"), (req, res) => {
  const db = loadDb();
  const i = db.inspections.find(x => x.id === req.params.id);
  if (!i) return res.status(404).json({ error: "Not found" });
  const b = req.body || {};
  const allowed = ["status", "officer", "date", "slot"];
  for (const k of Object.keys(b)) {
    if (!allowed.includes(k)) return res.status(400).json({ error: `field "${k}" is not updatable. Allowed: ${allowed.join(", ")}` });
  }
  if (b.status !== undefined) {
    if (!VALID_INSP_STATUS.includes(b.status)) return res.status(400).json({ error: `status must be one of: ${VALID_INSP_STATUS.join(", ")}` });
  }
  if (b.officer !== undefined && (typeof b.officer !== "string" || b.officer.length > 100)) return res.status(400).json({ error: "officer must be a string ≤100 chars" });
  if (b.date !== undefined && !isValidDateStr(b.date)) return res.status(400).json({ error: "date must be a valid date (YYYY-MM-DD)" });
  if (b.slot !== undefined && (typeof b.slot !== "string" || b.slot.trim().length < 3 || b.slot.length > 50)) return res.status(400).json({ error: "slot must be 3–50 chars" });
  if (b.status !== undefined) i.status = b.status;
  if (b.officer !== undefined) i.officer = b.officer;
  if (b.date !== undefined) i.date = String(b.date).slice(0, 10);
  if (b.slot !== undefined) i.slot = b.slot.trim();
  // Linkage: completing an inspection flips linked "Inspection scheduled" tracks to "Under review".
  if (b.status === "Completed") {
    const a = db.applications.find(x => x.id === i.appId);
    if (a) {
      const now = new Date().toISOString();
      (a.tracks || []).forEach(t => {
        const ap = approvalById(db, t.approvalId);
        if (ap && (i.depts || []).includes(ap.dept) && t.status === "Inspection scheduled") {
          t.status = "Under review";
          t.updatedAt = now;
          t.remarks = `${t.remarks || ""} [Inspection ${i.id} completed ${i.date} — report under review]`.trim();
        }
      });
    }
  }
  if (b.status === "Completed") appendAudit(db, "officer", "complete-inspection", i.id);
  saveDb(db);
  res.json(i);
});

app.get("/api/grievances", requireAuth, (req, res) => {
  // Fixed double-loadDb: single db object serves the response; save happens post-response.
  // Scoped: APPLICANT sees own reporterId rows; staff sees all.
  const db = loadDb();
  const sweep = sweepGrievances(db);
  let payload = db.grievances || [];
  if (!isStaffRole(req.user.role)) {
    payload = payload.filter(g => g.reporterId === req.user.userId);
  }
  res.json(payload);
  if (sweep.changed) { try { saveDb(db); } catch (e) { console.error("post-response save failed:", e.message); } }
});
app.post("/api/grievances", requireAuth, (req, res) => {
  const db = loadDb();
  const b = req.body || {};
  if (!b || typeof b !== "object") return res.status(400).json({ error: "Body must be a JSON object" });
  if (b.appId !== undefined && b.appId !== null && b.appId !== "" && !db.applications.find(x => x.id === b.appId)) return res.status(404).json({ error: "Application not found" });
  if (!b.dept || typeof b.dept !== "string" || !db.departments.find(d => d.id === b.dept)) return res.status(400).json({ error: `dept must be one of: ${db.departments.map(d => d.id).join(", ")}` });
  if (!b.subject || typeof b.subject !== "string" || b.subject.trim().length < 5 || b.subject.length > 300) return res.status(400).json({ error: "subject is required (5–300 chars)" });
  db.counters.grv += 1;
  const rec = { id: `GRV-${db.counters.grv}`, appId: b.appId, dept: b.dept, subject: b.subject.trim(), reporterId: req.user.userId, reporterEmail: String(req.user.email).toLowerCase(), status: "Filed with department (7-day SLA)", createdAt: new Date().toISOString(), updates: ["Filed by applicant — 7-day department SLA started"] };
  db.grievances.unshift(rec);
  appendAudit(db, actorFor(req), "file-grievance", rec.id);
  saveDb(db);
  res.status(201).json(rec);
});
app.patch("/api/grievances/:id", requireAuth, (req, res) => {
  const db = loadDb();
  const g = db.grievances.find(x => x.id === req.params.id);
  if (!g) return res.status(404).json({ error: "Not found" });
  const { action, note } = req.body || {};
  if (!["escalate", "resolve"].includes(action)) return res.status(400).json({ error: 'action must be "escalate" or "resolve"' });
  if (note !== undefined && note !== null && String(note).length > MAX_STR) return res.status(400).json({ error: `note must be ≤${MAX_STR} chars` });
  if (action === "resolve") {
    // Resolving closes a case with a speaking order — OFFICER/ADMIN only (ADMIN inherits).
    if (!isStaffRole(req.user.role)) return res.status(403).json({ error: "Officer role required to resolve." });
    g.status = "Resolved"; g.updates.push(note || "Resolved with speaking order");
  }
  if (action === "escalate") {
    g.status = g.status.includes("Nodal") ? "Escalated to Secretary (Industries)" : "Escalated to Nodal Officer";
    g.updates.push(note || `Auto-escalated — ${new Date().toISOString().slice(0, 10)} with full case timeline`);
    appendAudit(db, actorFor(req), "escalate", g.id);
  } else {
    appendAudit(db, "officer", "resolve", g.id);
  }
  saveDb(db);
  res.json(g);
});

app.get("/api/alerts", (req, res) => {
  const db = loadDb();
  const sweep = runSweeps(db);
  const alerts = [];
  db.applications.forEach(a => {
    const e = enrichApp(db, a);
    e.tracks.forEach(t => {
      if (t.sla && t.sla.state === "breached") alerts.push({ kind: "breach", text: `${t.name} breached SLA by ${-t.sla.left}d in ${e.id} — deemed approval eligible`, appId: e.id });
      else if (t.sla && t.sla.state === "urgent") alerts.push({ kind: "warn", text: `${t.name} SLA expires in ${t.sla.left}d (${e.id})`, appId: e.id });
      if (t.status === "Queried") alerts.push({ kind: "query", text: `${t.dept}: query raised on ${e.id} — "${t.remarks}"`, appId: e.id });
      if (t.status === "Deemed") alerts.push({ kind: "info", text: `${t.name} auto-deemed in ${e.id} — SLA enforcement fired`, appId: e.id });
    });
  });
  db.inspections.filter(i => i.status === "Scheduled").forEach(i => alerts.push({ kind: "info", text: `Inspection ${i.id} on ${i.date} (${i.slot}) for ${i.appId}${i.combined ? " — COMBINED visit" : ""}`, appId: i.appId }));
  db.grievances.filter(g => g.status !== "Resolved").forEach(g => alerts.push({ kind: "grv", text: `Grievance ${g.id}: ${g.subject} — ${g.status}`, appId: g.appId }));
  res.json(alerts);
  if (sweep.changed) { try { saveDb(db); } catch (e) { console.error("post-response save failed:", e.message); } }
});

app.get("/api/analytics", (req, res) => {
  const db = loadDb();
  const avg = arr => arr.length ? Math.round(arr.reduce((s, r) => s + r, 0) / arr.length) : 0;
  // Honesty rule (shortlist #6): SEED headlines NEVER move — they are the frozen 38-row
  // illustrative baseline from data/seed.js (README: "SEED headlines do not move").
  // Live completions append {regime:"new", live:true} rows that are EXCLUDED from avgNew/byDept
  // and reported separately as avgNewLive/liveHistoryCount, which DO move with demo activity.
  const old = db.history.filter(h => h.regime === "old" && !h.live);
  const seedNew = db.history.filter(h => h.regime === "new" && !h.live);
  const liveRows = db.history.filter(h => h.live);
  const byDept = {};
  db.departments.forEach(d => {
    const o = old.filter(h => h.dept === d.id).map(h => h.days), n = seedNew.filter(h => h.dept === d.id).map(h => h.days);
    byDept[d.id] = { name: d.name, old: avg(o), new: avg(n), saved: avg(o) - avg(n) };
  });
  res.json({
    avgOld: avg(old.map(h => h.days)), avgNew: avg(seedNew.map(h => h.days)),
    incomplete: db.incompleteRates, byDept,
    historyCount: db.history.length, seedHistoryCount: old.length + seedNew.length,
    // Live delta (separate, moves): measured completions during this demo session.
    liveHistoryCount: liveRows.length,
    avgNewLive: liveRows.length ? avg(liveRows.map(h => h.days)) : null,
    basis: `SEED frozen baseline ${old.length + seedNew.length} rows (never moves) + ${liveRows.length} live measured completions (move separately as avgNewLive)`,
    live: {
      applications: db.applications.length,
      pendingTracks: db.applications.flatMap(a => a.tracks).filter(t => !["Approved", "Deemed", "Rejected"].includes(t.status)).length,
      inspections: db.inspections.filter(i => i.status === "Scheduled").length,
      grievances: db.grievances.filter(g => g.status !== "Resolved").length,
      // ---- live-fed aggregation: every POST /api/applications moves these ----
      filingsBySector: db.applications.reduce((m, a) => { m[a.sector || "Unknown"] = (m[a.sector || "Unknown"] || 0) + 1; return m; }, {}),
      pendingByDept: db.applications.flatMap(a => a.tracks.map(t => ({ t, a })))
        .filter(({ t }) => !["Approved", "Deemed", "Rejected"].includes(t.status))
        .reduce((m, { t }) => { const ap = approvalById(db, t.approvalId); const d = ap ? ap.dept : "UNKNOWN"; m[d] = (m[d] || 0) + 1; return m; }, {}),
      queryRate: (() => { const all = db.applications.flatMap(a => a.tracks); return all.length ? Math.round(all.filter(t => t.status === "Queried").length / all.length * 1000) / 10 : 0; })(),
      combinedInspectionPct: db.inspections.length ? Math.round(db.inspections.filter(i => i.combined).length / db.inspections.length * 1000) / 10 : 0
    }
  });
});

app.post("/api/reset", (req, res) => {
  // Demo-safe: public reset only with ?demo=1 (judging runs, footer button).
  // Otherwise ADMIN Bearer required.
  if (String(req.query.demo || "") !== "1") {
    const tok = getBearerToken(req);
    if (!tok) return res.status(401).json({ error: "Authentication required. Use POST /api/reset?demo=1 for the public demo reset, or an ADMIN Bearer token." });
    const db0 = loadDb();
    const s = findSession(db0, tok);
    if (!s) return res.status(401).json({ error: "Invalid or expired session." });
    let user = s.userId ? findUserById(db0, s.userId) : findUserByEmail(db0, s.email);
    if (!user && s.email) user = findUserByEmail(db0, s.email);
    if (!user || user.disabled) return res.status(401).json({ error: "Authentication required." });
    if (normRole(user.role) !== "ADMIN") return res.status(403).json({ error: "ADMIN role required to reset. Use ?demo=1 for the public demo reset." });
  }
  delete require.cache[require.resolve("./data/seed.js")];
  const seed = require("./data/seed.js");
  writeDbAtomic(seed);
  res.json({ ok: true });
});

// Append-only audit log — OFFICER/ADMIN only (applicant token → 403, no token → 401).
// Entries are {ts, actor, action, id}, written on every file / approve / query /
// review / inspect / deem / upload / inspection / grievance / escalate / resolve /
// unlock / auto-deemed / auto-escalate transition.
app.get("/api/audit", requireRole("OFFICER", "ADMIN"), (req, res) => {
  const db = loadDb();
  res.json({ count: (db.audit || []).length, audit: db.audit || [] });
});

// Real renewal schedule: issued date + per-approval validity (CTO band-aware).
// Replaces the old hardcoded "58 days" dashboard line — clients should read this.
app.get("/api/renewals", (req, res) => {
  const db = loadDb();
  const out = [];
  db.applications.forEach(a => {
    const e = enrichApp(db, a);
    e.tracks.forEach(t => {
      if (t.renewal) out.push({ appId: e.id, applicant: e.applicant, approvalId: t.approvalId, name: t.name, dept: t.dept, status: t.status, ...t.renewal });
    });
  });
  out.sort((x, y) => x.daysLeft - y.daysLeft);
  res.json(out);
});

app.get("/api/health", (req, res) => res.json({ ok: true, app: "Udyog Sarthi", sih: "26130" }));

// Background sweep: SLA breach → deemed, grievance 7d/14d → auto-escalate. Keeps the
// "auto" claims true even when nobody hits a read endpoint.
setInterval(() => {
  try {
    const db = loadDb();
    if (runSweeps(db).changed) saveDb(db);
  } catch (e) { console.error("sweep failed:", e.message); }
}, 60 * 1000);

app.listen(PORT, () => console.log(`Udyog Sarthi (SIH-26130) running at http://localhost:${PORT}`));
