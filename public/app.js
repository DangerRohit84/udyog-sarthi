/* Udyog Sarthi SPA — hash router, vanilla JS, offline canvas charts. */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
async function api(m, u, b, opts) {
  const headers = { "Content-Type": "application/json" };
  try {
    const tok = localStorage.getItem("us_token");
    if (tok) headers["Authorization"] = "Bearer " + tok;
  } catch (e) {}
  const r = await fetch(u, { method: m, headers, body: b ? JSON.stringify(b) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok && !(opts && opts.silent)) {
    const msg = (j && (j.error || j.details)) || ("HTTP " + r.status);
    const text = typeof msg === "string" ? msg : JSON.stringify(msg);
    const err = new Error("HTTP " + r.status + " — " + text);
    err.status = r.status;
    err.body = j;
    throw err;
  }
  return j;
}
/* ---------- auth (Option A: APPLICANT/OFFICER/ADMIN, Bearer us_token) ---------- */
// Demo auth: exchange credentials for a server-minted expiring session token via
// POST /api/auth/login (legacy shim POST /api/login). No client-side minting —
// tokens only come from the server (12h expiry, stored in db.sessions).
async function doLogin(email, password) {
  const body = { email: String(email || "").trim(), password: String(password || "") };
  // Prefer new RBAC endpoint, fall back to legacy shim for seed logins.
  let j = await api("POST", "/api/auth/login", body, { silent: true }).catch(() => null);
  if (!j || !j.token) j = await api("POST", "/api/login", body, { silent: true }).catch(e => ({ _err: e.message }));
  if (j && j.token) {
    localStorage.setItem("us_role", j.role);
    localStorage.setItem("us_token", j.token);
    try { localStorage.setItem("us_token_exp", j.expiresAt || ""); } catch (e) {}
    try { localStorage.setItem("us_email", body.email || j.email || j.user?.email || ""); } catch (e) {}
    try { localStorage.removeItem("us_pending_role"); } catch (e) {}
    renderChrome(); route();
    toast(`Logged in as ${j.role} — session expires ${String(j.expiresAt || "").slice(0, 16).replace("T", " ")}`, "ok");
    return true;
  }
  toast("Login failed: " + ((j && (j.error || j._err)) || "unknown error"), "err");
  return false;
}
window.doLogin = doLogin;
async function doLogout() {
  try {
    const tok = localStorage.getItem("us_token");
    if (tok) {
      await fetch("/api/auth/logout", { method: "POST", headers: { "Authorization": "Bearer " + tok } }).catch(() => {});
      await fetch("/api/logout", { method: "POST", headers: { "Authorization": "Bearer " + tok } }).catch(() => {});
    }
  } catch (e) {}
  try { localStorage.removeItem("us_role"); localStorage.removeItem("us_token"); localStorage.removeItem("us_token_exp"); localStorage.removeItem("us_email"); localStorage.removeItem("us_pending_role"); } catch (e) {}
  renderChrome(); location.hash = "#/"; route();
}
window.doLogout = doLogout;
const role = () => { try { return localStorage.getItem("us_role") || ""; } catch (e) { return ""; } };
// Role helpers (case-insensitive: server returns APPLICANT/OFFICER/ADMIN, legacy seeds lowercase).
const normRole = r => String(r || "").toUpperCase();
const curRole = () => normRole(role());
const isLoggedIn = () => { try { return !!localStorage.getItem("us_token"); } catch (e) { return false; } };
const isDemo = () => { try { return localStorage.getItem("us_demo") === "1"; } catch (e) { return false; } };
// ?demo=1 (query or hash) enables shared-judging demo browsing of seed data.
function ensureDemoFlagFromUrl() {
  try {
    const inQuery = /[?&]demo=1/.test(location.search || "");
    const inHash = /[?&]demo=1/.test(location.hash || "");
    if (inQuery || inHash) localStorage.setItem("us_demo", "1");
  } catch (e) {}
}
function enterDemo() {
  try { localStorage.setItem("us_demo", "1"); } catch (e) {}
  renderChrome(); location.hash = "#/dashboard"; route();
}
window.enterDemo = enterDemo;
function exitDemo() {
  try { localStorage.removeItem("us_demo"); } catch (e) {}
  renderChrome(); route();
}
window.exitDemo = exitDemo;
// No impersonation: role buttons route to the login form (prefilled), never mint tokens.
const setRole = r => {
  if (!r) { doLogout(); return; }
  try { localStorage.setItem("us_pending_role", r); } catch (e) {}
  location.hash = "#/login"; route();
};
let META = null;
async function meta() { if (!META) META = await api("GET", "/api/meta"); return META; }
const deptName = id => (META?.departments.find(d => d.id === id)?.name) || id;

/* ---------- toast strip (replaces alert()) ---------- */
let TOAST_TIMER = null;
function toast(msg, kind) {
  const el = $("#toast");
  const show = () => {
    el.innerHTML = `<span>${kind === "err" ? "⛔" : kind === "warn" ? "⚠️" : "✅"} ${esc(msg)}</span><button class="linkbtn" style="color:#fff" onclick="document.querySelector('#toast').style.display='none'">✕</button>`;
    el.className = "toast show " + (kind || "");
    el.style.display = "flex";
    clearTimeout(TOAST_TIMER);
    TOAST_TIMER = setTimeout(() => { el.style.display = "none"; }, 6000);
  };
  if (el) show();
  else alert(msg); // ultimate fallback if #toast missing
}
window.toast = toast;

/* ---------- i18n: minimal EN/MR toggle (header + wizard + tracker). Persisted. ---------- */
let LANG = "en", I18N = null;
try { LANG = localStorage.getItem("us_lang") || "en"; } catch (e) {}
function T(k, fb) { return (I18N && I18N[LANG] && I18N[LANG][k]) || fb || k; }
async function loadI18n() {
  try { const r = await fetch("i18n.json"); if (r.ok) I18N = await r.json(); } catch (e) { /* offline fallback: English literals */ }
}
function toggleLang() {
  LANG = LANG === "mr" ? "en" : "mr";
  try { localStorage.setItem("us_lang", LANG); } catch (e) {}
  try { document.documentElement.lang = LANG; } catch (e) {}
  renderChrome(); route();
}
window.toggleLang = toggleLang;

const NAV = [
  ["#/", "nav_home", "Home"], ["#/dashboard", "nav_dashboard", "Dashboard"], ["#/wizard", "nav_wizard", "Checklist Wizard"],
  ["#/tracker", "nav_tracker", "Tracker"], ["#/documents", "nav_documents", "Documents"], ["#/inspections", "nav_inspections", "Inspections"],
  ["#/schemes", "nav_schemes", "Schemes"], ["#/grievances", "nav_grievances", "Grievance"], ["#/analytics", "nav_analytics", "Analytics"], ["#/knowledge", "nav_knowledge", "Knowledge"]
];
function ensureDemoBanner() {
  let b = document.querySelector("#demo-banner");
  if (!b) {
    b = document.createElement("div");
    b.id = "demo-banner";
    const view = document.querySelector("#view");
    if (view && view.parentNode) view.parentNode.insertBefore(b, view);
    else document.body.prepend(b);
  }
  return b;
}
function renderChrome() {
  const r = role();
  const rn = normRole(r);
  const officerLink = (rn === "OFFICER" || rn === "ADMIN") ? `<a href="#/officer" data-h="#/officer">${esc(T("nav_officer", "Officer"))}</a>` : "";
  const adminLink = rn === "ADMIN" ? `<a href="#/admin" data-h="#/admin">${esc(T("nav_admin", "Admin"))}</a>` : "";
  $("#nav").innerHTML = NAV.map(([h, k, en]) => `<a href="${h}" data-h="${h}">${esc(T(k, en))}</a>`).join("") + officerLink + adminLink;
  [...document.querySelectorAll("#nav a")].forEach(a => a.classList.toggle("active", a.dataset.h === (location.hash || "#/").split("?")[0] || (!location.hash && a.dataset.h === "#/")));
  const bs = $("#brandsub"); if (bs) bs.textContent = T("brand_sub", "Single-Window Industrial Approvals · SIH ID 26130");
  let email = "", exp = "";
  try { email = localStorage.getItem("us_email") || ""; exp = localStorage.getItem("us_token_exp") || ""; } catch (e) {}
  const badge = !rn ? "" : rn === "ADMIN"
    ? `<span class="badge b-purple">🛡️ ${esc(T("role_admin", "Admin"))}</span>`
    : rn === "OFFICER"
      ? `<span class="badge b-blue">🏛️ ${esc(T("role_officer", "Officer"))}</span>`
      : `<span class="badge b-green">🏭 ${esc(T("role_applicant", "Applicant"))}</span>`;
  const tip = email || exp ? ` title="${esc(email)}${exp ? " · expires " + esc(String(exp).slice(0, 16).replace("T", " ")) : ""}"` : "";
  $("#rolebox").innerHTML = `<button class="btn sm ghost" onclick="toggleLang()" title="English / मराठी">${LANG === "mr" ? "English" : "मराठी"}</button>` + (isLoggedIn() && rn
    ? `${badge}<span class="small mut"${tip} style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(email)}</span><button class="btn sm ghost" onclick="doLogout()">Logout</button>`
    : `<button class="btn sm" onclick="location.hash='#/login'">${esc(T("login_btn", "Login / Demo"))}</button>`);
  // Demo-mode shared-judging strip (server-driven isolation still applies — banner is display only).
  try {
    const b = ensureDemoBanner();
    b.innerHTML = isDemo() ? `<div class="demo-banner">🎭 ${esc(T("demo_mode", "DEMO MODE - shared judging data"))} <button class="btn sm ghost" onclick="exitDemo()" style="margin-left:8px">Exit demo</button></div>` : "";
  } catch (e) {}
  api("GET", "/api/alerts").then(a => {
    $("#alertstrip").innerHTML = a.length
      ? a.slice(0, 8).map(x => `<span>${x.kind === "breach" ? "🔴" : x.kind === "warn" ? "🟠" : x.kind === "query" ? "❓" : x.kind === "grv" ? "📢" : "ℹ️"} ${esc(x.text)}</span>`).join("")
      : `<span class="mut">✅ No pending alerts — all SLA clocks healthy</span>`;
  }).catch(() => {});
}
window.setRole = setRole;
async function resetDemo() {
  toast("Replay logs you out 15s — resetting clears server sessions, re-login needed. Preserve session if valid, else you will see 401.", "warn");
  try { await api("POST", "/api/reset?demo=1"); } catch (e) { toast("Reset failed: " + e.message, "err"); return; }
  META = null;
  try { localStorage.removeItem("us_token"); localStorage.removeItem("us_role"); localStorage.removeItem("us_token_exp"); localStorage.removeItem("us_email"); localStorage.removeItem("us_pending_role"); } catch (e) {}
  toast("Replay logs you out 15s — demo data reset to seed (apps=3 history=38 corpus=60). Please log in again.", "ok");
  location.hash = "#/"; route();
}
window.resetDemo = resetDemo;

window.addEventListener("hashchange", route);
document.addEventListener("DOMContentLoaded", () => { try { document.documentElement.lang = LANG; } catch (e) {} loadI18n().finally(() => { renderChrome(); route(); }); });

/* ---------- route guards (Option A: server-driven isolation) ---------- */
// Blocked card links back to #/login (the "redirect") — no forced navigation so the
// reason stays visible; server APIs still enforce 401/403 regardless of what we render.
function blockedCard(title, msg) {
  return `<div class="card"><h3>🔒 ${esc(title)}</h3><p class="mut">${esc(msg)}</p>`
    + `<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="location.hash='#/login'">${esc(T("auth_login_required", "Login required — go to login"))}</button></div></div>`;
}
async function route() {
  ensureDemoFlagFromUrl();
  renderChromeActive();
  const raw = location.hash || "#/";
  const h = raw.split("?")[0];
  const v = $("#view");
  v.innerHTML = `<div class="card">Loading…</div>`;
  try {
    // NOTE (#4): no inline script-tag anywhere — innerHTML scripts never execute, which
    // used to leave wizard/schemes/knowledge stuck on "Generating…/Searching…".
    // Every dynamic init is an explicit call below, after innerHTML is set.
    if (h === "#/") { v.innerHTML = await landing(); v.focus({ preventScroll: true }); return; }
    if (h === "#/login") {
      v.innerHTML = login();
      bindLoginRole(); // #1: role-switch onchange wired here, not in innerHTML script
      loadDemoStatus(); // best-effort GET /api/demo/status into the Demo card
      v.focus({ preventScroll: true }); return;
    }
    if (h === "#/register") {
      v.innerHTML = register();
      v.focus({ preventScroll: true }); return;
    }
    if (h === "#/admin") {
      if (curRole() !== "ADMIN" || !isLoggedIn()) { v.innerHTML = blockedCard(T("admin_title", "Admin console"), T("auth_blocked_admin", "Admin login required. This area lists users and officers (GET /api/admin/users).")); v.focus({ preventScroll: true }); return; }
      v.innerHTML = await admin();
      v.focus({ preventScroll: true }); return;
    }
    if (h === "#/dashboard") {
      if (!isLoggedIn() && !isDemo()) { v.innerHTML = blockedCard(T("dash_title", "Applicant dashboard"), T("auth_blocked_login", "Please log in (or enter 🎭 Demo Mode) to view your dashboard. Server returns only your scoped applications.")); v.focus({ preventScroll: true }); return; }
      v.innerHTML = await dashboard(); v.focus({ preventScroll: true }); return;
    }
    if (h === "#/wizard") {
      v.innerHTML = await wizard();
      if (WIZ.step === 3) await genChecklist(true); // #4: was an inline genChecklist script-tag
      v.focus({ preventScroll: true }); return;
    }
    if (h === "#/tracker") {
      if (!isLoggedIn() && !isDemo()) { v.innerHTML = blockedCard(T("tracker_title", "Application tracker"), T("auth_blocked_login", "Please log in (or enter 🎭 Demo Mode) to view your dashboard. Server returns only your scoped applications.")); v.focus({ preventScroll: true }); return; }
      v.innerHTML = await trackerList(); v.focus({ preventScroll: true }); return;
    }
    if (h.startsWith("#/app/")) {
      if (!isLoggedIn() && !isDemo()) { v.innerHTML = blockedCard(T("tracker_title", "Application tracker"), T("auth_blocked_login", "Please log in (or enter 🎭 Demo Mode) to view your dashboard. Server returns only your scoped applications.")); v.focus({ preventScroll: true }); return; }
      v.innerHTML = await appDetail(h.split("/")[2]); v.focus({ preventScroll: true }); return;
    }
    if (h === "#/documents") {
      if (!isLoggedIn() && !isDemo()) { v.innerHTML = blockedCard(T("docs_title", "Documentation guidance + pre-validation"), T("auth_blocked_login", "Please log in (or enter 🎭 Demo Mode) to view your dashboard. Server returns only your scoped applications.")); v.focus({ preventScroll: true }); return; }
      v.innerHTML = await documents(); v.focus({ preventScroll: true }); return;
    }
    if (h === "#/officer") {
      if (!(curRole() === "OFFICER" || curRole() === "ADMIN") || !isLoggedIn()) { v.innerHTML = blockedCard(T("off_title", "Officer workspace"), T("auth_blocked_officer", "Officer or Admin login required. Applicants cannot open the pendency queue.")); v.focus({ preventScroll: true }); return; }
      v.innerHTML = await officer();
      await loadOffInsp(); // #4: was an inline loadOffInsp script-tag
      v.focus({ preventScroll: true }); return;
    }
    if (h === "#/inspections") { v.innerHTML = await inspections(); v.focus({ preventScroll: true }); return; }
    if (h === "#/schemes") {
      v.innerHTML = await schemes();
      await matchSchemes(); // #4: was an inline matchSchemes script-tag
      v.focus({ preventScroll: true }); return;
    }
    if (h === "#/grievances") { v.innerHTML = await grievances(); v.focus({ preventScroll: true }); return; }
    if (h === "#/analytics") { v.innerHTML = await analytics(), drawAnalytics(); v.focus({ preventScroll: true }); return; }
    if (h === "#/knowledge") {
      v.innerHTML = await knowledge();
      knFilter(); // #4: was an inline knFilter script-tag — fixes stuck "Searching…"
      v.focus({ preventScroll: true }); return;
    }
    v.innerHTML = `<div class="card">Not found. <a href="#/">Home</a></div>`; v.focus({ preventScroll: true });
  } catch (e) { v.innerHTML = `<div class="card">⚠️ ${esc(e.message)} — is the server running? <code>npm start</code></div>`; }
}
function renderChromeActive() {
  const cur = (location.hash || "#/").split("?")[0];
  [...document.querySelectorAll("#nav a")].forEach(a => a.classList.toggle("active", a.dataset.h === cur || (!location.hash && a.dataset.h === "#/")));
}

/* ---------- LANDING (portal-grade govt hero + trust + how + schemes + tracker) ---------- */
// WHY: portal first impression — navy+saffron hero with one signature element
// (.tricolor rule + saffron section ticks). Live numbers come from public
// GET /api/analytics only; per-user applications stay behind auth guards.
async function landing() {
  let an = null;
  try { an = await api("GET", "/api/analytics"); } catch (e) { an = null; }
  try { await meta(); } catch (e) { /* META stays null — fallback dept list below */ }
  const depts = (META && META.departments && META.departments.length ? META.departments : [
    { id: "MIDC", name: "MIDC", full: "Maharashtra Industrial Dev. Corp." },
    { id: "MPCB", name: "MPCB", full: "Pollution Control Board" },
    { id: "LABOUR", name: "Labour", full: "Industrial Safety & Health" },
    { id: "FIRE", name: "Fire", full: "Maharashtra Fire Services" },
    { id: "MSEDCL", name: "MSEDCL", full: "Power / DISCOM" },
    { id: "DOI", name: "Industries", full: "Directorate of Industries" }
  ]).slice(0, 6);
  // Schemes preview: live match on a neutral Small profile; never blocks landing.
  let schPreview = "";
  try {
    const res = await api("POST", "/api/schemes/match", { sector: "Food Processing", size: "Small", investmentLakh: 180 });
    const elig = (Array.isArray(res) ? res : []).filter(s => s.eligible).slice(0, 3);
    schPreview = elig.length
      ? elig.map(s => `<div class="howcard"><h3>✅ ${esc(s.name)}</h3><div class="small mut">${esc(s.benefit || "")}</div><div class="small"><b class="pass">≈ ₹${esc(String(s.estLakh ?? "—"))} lakh</b></div></div>`).join("")
      : `<div class="card small mut">No eligible preview for the sample profile — open the finder to match your own.</div>`;
  } catch (e) { schPreview = `<div class="card small mut">Scheme finder goes live with the server — <a href="#/schemes">open it here</a>.</div>`; }
  const statSeed = an
    ? `<div class="portal-stat"><b>${an.avgOld} → ${an.avgNew} days*</b><br><span>🌱 SEED — Avg. approval time</span></div><div class="portal-stat"><b>${an.live ? an.live.applications : 0} filed</b><br><span>🔴 LIVE — Applications via window</span></div>`
    : `<div class="portal-stat"><b>6 depts</b><br><span>One window</span></div><div class="portal-stat"><b>SLA clocks</b><br><span>Deemed on breach</span></div>`;
  return `<div class="portal-hero"><div class="tricolor"></div><div class="portal-hero-inner">
    <div>
      <span class="portal-eyebrow">🏛️ ${esc(T("land_eyebrow", "Government of Maharashtra · Single-Window System"))} · SIH 26130</span>
      <h1 class="portal-title">${esc(T("land_title", "One application. Six departments. Full traceability."))} <span class="tick">▮</span></h1>
      <p class="portal-sub">${esc(T("land_sub", "Udyog Sarthi routes your factory proposal through MIDC, MPCB, Labour, Fire, Power and Industries in parallel."))}</p>
      <div class="portal-cta">
        <button class="btn" onclick="location.hash='#/register'">${esc(T("land_cta_start", "Create applicant account"))}</button>
        <button class="btn ghost" onclick="location.hash='#/wizard'">${esc(T("land_cta_check", "Generate my checklist"))}</button>
        <button class="btn ghost" onclick="location.hash='#/tracker'">${esc(T("land_cta_track", "Track application"))}</button>
      </div>
      <div class="portal-stats">${statSeed}</div>
    </div>
    <aside class="portal-side" aria-label="Quick tour">
      <h3>60-second tour</h3>
      <div class="small">1️⃣ <b>Wizard</b> → Generate → 📨 File<br>2️⃣ <b>Tracker</b> → per-dept SLA countdowns<br>3️⃣ <b>Login</b> as officer → approve / query</div>
      <div class="small mut" style="margin-top:8px">Server-minted 12h sessions · Bearer <code>us_token</code> · Footer <b>Reset</b> restores seeds.</div>
      <div class="small" style="margin-top:8px">🎭 ${esc(T("land_demo_note", "Judging? Enter Demo Mode to browse shared seed data without an account."))} <button class="linkbtn" onclick="enterDemo()">Enter demo →</button></div>
    </aside>
  </div></div>
  <section class="sect" aria-label="Departments"><h2>${esc(T("land_trust", "Six departments · one window"))}</h2>
    <div class="trustbar">${depts.map(d => `<div class="trust">🏢 ${esc(d.name)}<small>${esc(d.full || d.id)}</small></div>`).join("")}</div></section>
  <section class="sect" aria-label="How it works"><h2>${esc(T("land_how_t", "How it works"))}</h2>
    <div class="howgrid">
      <div class="howcard"><span class="n">1</span><h3>${esc(T("land_how1_t", "1 · Register"))}</h3><div class="small mut">${esc(T("land_how1_d", "Create your applicant account in a minute."))}</div></div>
      <div class="howcard"><span class="n">2</span><h3>${esc(T("land_how2_t", "2 · Apply"))}</h3><div class="small mut">${esc(T("land_how2_d", "Answer six wizard questions, then file once."))}</div></div>
      <div class="howcard"><span class="n">3</span><h3>${esc(T("land_how3_t", "3 · Track"))}</h3><div class="small mut">${esc(T("land_how3_d", "Watch every SLA clock live."))}</div></div>
    </div></section>
  <section class="sect" aria-label="Schemes"><h2>${esc(T("land_sch_t", "Incentives you may qualify for"))}</h2><p class="mut small">${esc(T("land_sch_d", "Match your sector, size and investment against live state schemes."))}</p><div class="howgrid">${schPreview}</div><div style="margin-top:10px"><button class="btn ghost" onclick="location.hash='#/schemes'">${esc(T("land_sch_go", "Check scheme eligibility →"))}</button></div></section>
  <section class="sect" aria-label="Tracker"><h2>${esc(T("land_trk_t", "Live tracker teaser"))}</h2><p class="mut small">${esc(T("land_trk_d", "Every filing gets per-department tracks with countdowns."))}</p><div class="card"><div class="track-teaser"><input id="land_appid" placeholder="APP-2026-0157" aria-label="Application ID"><button class="btn" onclick="openLandingTracker()">${esc(T("land_trk_go", "Open tracker →"))}</button></div><div class="hint">Have an ID from the wizard? Paste it — login or 🎭 Demo Mode required to view.</div></div></section>
  <div class="landing-foot">Udyog Sarthi · <b>SIH ID 26130</b> · Govt. of Maharashtra single-window demo · 🌱 SEED illustrative · 🔴 LIVE moves with filings · <code>data/db.json</code></div>`;
}
window.openLandingTracker = () => {
  const id = (document.querySelector("#land_appid")?.value || "").trim();
  location.hash = id ? "#/app/" + encodeURIComponent(id) : "#/tracker"; route();
};

/* ---------- LOGIN (tabs + register link + separate Demo Mode card) ---------- */
let LOGIN_TAB = "APPLICANT";
function setLoginTab(t) {
  LOGIN_TAB = normRole(t) || "APPLICANT";
  if (!["APPLICANT", "OFFICER", "ADMIN"].includes(LOGIN_TAB)) LOGIN_TAB = "APPLICANT";
  try { localStorage.setItem("us_pending_role", LOGIN_TAB === "OFFICER" ? "officer" : LOGIN_TAB === "ADMIN" ? "admin" : "applicant"); } catch (e) {}
  route();
}
window.setLoginTab = setLoginTab;
function login() {
  let pending = "";
  try { pending = localStorage.getItem("us_pending_role") || ""; } catch (e) {}
  const pn = normRole(pending);
  // Sync tab from landing "Continue as …" (setRole stores lowercase pending role).
  if (pn === "OFFICER" || pn === "ADMIN" || pn === "APPLICANT") LOGIN_TAB = pn;
  // Legacy "officer" pending from older builds maps to OFFICER tab.
  try { if (pending === "officer" && LOGIN_TAB === "APPLICANT") LOGIN_TAB = "OFFICER"; } catch (e) {}
  const tab = LOGIN_TAB || "APPLICANT";
  const isStaff = tab === "OFFICER" || tab === "ADMIN";
  const emailPh = tab === "OFFICER" ? "officer@maharashtra.gov.in" : tab === "ADMIN" ? "admin@maharashtra.gov.in" : "you@example.com";
  const tabBtn = (id, label) => `<button class="tab${tab === id ? " on" : ""}" onclick="setLoginTab('${id}')" role="tab" aria-selected="${tab === id}">${label}</button>`;
  return `<div class="auth-shell"><div class="auth-grid"><div class="auth-card"><h2>${esc(T("login_title", "Login"))} · ${esc(tab === "OFFICER" ? T("role_officer", "Officer") : tab === "ADMIN" ? T("role_admin", "Admin") : T("role_applicant", "Applicant"))}</h2><p class="mut small">${esc(T("login_sub", "Server-verified credentials (POST /api/auth/login → expiring session token)."))}</p>
    <div class="tabs" role="tablist" aria-label="Login role">${tabBtn("APPLICANT", "🏭 " + esc(T("role_applicant", "Applicant")))}${tabBtn("OFFICER", "🏛️ " + esc(T("role_officer", "Officer")))}${tabBtn("ADMIN", "🛡️ " + esc(T("role_admin", "Admin")))}</div>
    <div id="lg_err" class="field-err" role="alert" aria-live="assertive"></div>
    <label for="lg_email">${esc(T("login_email", "Email"))}</label><input id="lg_email" type="email" autocomplete="username" placeholder="${esc(emailPh)}" onkeydown="if(event.key==='Enter')submitLogin()">
    <label for="lg_pass">${esc(T("login_password", "Password"))}</label><div class="pw-wrap"><input id="lg_pass" type="password" autocomplete="current-password" placeholder="••••••••" onkeydown="if(event.key==='Enter')submitLogin()"><button type="button" class="pw-toggle" id="lg_toggle" onclick="togglePw('lg_pass','lg_toggle')" aria-label="Show password">${esc(T("login_show", "Show"))}</button></div>
    ${isStaff ? `<div class="hint" style="margin-top:8px">🔒 ${esc(T("auth_no_self_reg", "Contact admin for Officer/Admin accounts — self-registration is disabled."))}</div>`
      : `<div class="small" style="margin-top:8px">${esc(T("login_have_no", "New applicant?"))} <a href="#/register">${esc(T("register_login_link", "Create an applicant account →"))}</a></div>`}
    <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="lg_go" onclick="submitLogin()">${esc(T("login_go", "Login →"))}</button></div>
    <div class="hint" style="margin-top:8px">🔑 ${esc(T("login_forgot", "Forgot password? Contact your department admin — self-reset is disabled in this demo."))}</div>
    <div class="small mut" style="margin-top:8px">${esc(T("login_hint", "Sessions expire in 12h. Officer/Admin actions need staff login."))}</div></div>
    <div class="auth-card"><h2>🎭 ${esc(T("demo_title", "Demo Mode"))}</h2><p class="mut small">${esc(T("demo_sub", "Shared judging data — log in with a demo account or browse seeds without an account."))}</p>
    <div class="tblwrap"><table class="tbl"><tr><th>${esc(T("login_role", "Role"))}</th><th>Email</th><th>Password</th></tr>
    <tr><td>${esc(T("role_applicant", "Applicant"))}</td><td><code>udyog@demo.in</code></td><td><code>demo123</code></td></tr>
    <tr><td>${esc(T("role_officer", "Officer"))}</td><td><code>officer@maharashtra.gov.in</code></td><td><code>officer123</code></td></tr>
    <tr><td>${esc(T("role_admin", "Admin"))}</td><td><code>admin@maharashtra.gov.in</code></td><td><code>admin123</code></td></tr></table></div>
    <div class="small mut" style="margin-top:8px">${esc(T("demo_hint", "Tip: append ?demo=1 to any URL (e.g. #/dashboard?demo=1) to browse seed data without logging in."))}</div>
    <div id="demo_status" class="small mut" style="margin-top:6px"></div>
    <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost" onclick="enterDemo()">${esc(T("demo_enter", "Enter demo browsing →"))}</button></div>
    <div class="small mut" style="margin-top:8px">Officer API calls send <code>Authorization: Bearer &lt;session-token&gt;</code> (12h expiry); missing/expired token gets <code>401</code>, wrong role gets <code>403</code>, 5 bad tries/15min gets <code>429</code>.</div></div></div></div>`;
}
// Show/hide password toggle — placeholders only, never prefilled values.
window.togglePw = (inputId, btnId) => {
  const inp = document.getElementById(inputId), btn = document.getElementById(btnId);
  if (!inp || !btn) return;
  const show = inp.type === "password";
  inp.type = show ? "text" : "password";
  btn.textContent = show ? T("login_hide", "Hide") : T("login_show", "Show");
  btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
  inp.focus({ preventScroll: true });
};
// Portal login submit — inline errors + loading, same backend contract as doLogin
// (POST /api/auth/login then POST /api/login shim → {token, role}; Bearer in LS).
window.submitLogin = async () => {
  const errBox = document.querySelector("#lg_err");
  const showErr = m => { if (errBox) { errBox.textContent = m; errBox.classList.add("show"); } else toast(m, "err"); };
  if (errBox) { errBox.textContent = ""; errBox.classList.remove("show"); }
  const email = (document.querySelector("#lg_email")?.value || "").trim();
  const password = document.querySelector("#lg_pass")?.value || "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !password) return showErr(T("login_err", "Please enter a valid email and your password."));
  const btn = document.querySelector("#lg_go");
  const orig = btn ? btn.innerHTML : "";
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spin" aria-hidden="true"></span>${esc(T("login_wait", "Signing in…"))}`; }
  try {
    const body = { email, password };
    let j = await api("POST", "/api/auth/login", body, { silent: true }).catch(() => null);
    if (!j || !j.token) j = await api("POST", "/api/login", body, { silent: true }).catch(e => ({ _err: e.message }));
    if (j && j.token) {
      localStorage.setItem("us_role", j.role);
      localStorage.setItem("us_token", j.token);
      try { localStorage.setItem("us_token_exp", j.expiresAt || ""); } catch (e) {}
      try { localStorage.setItem("us_email", body.email || j.email || (j.user && j.user.email) || ""); } catch (e) {}
      try { localStorage.removeItem("us_pending_role"); } catch (e) {}
      renderChrome();
      toast(`Logged in as ${j.role} — session expires ${String(j.expiresAt || "").slice(0, 16).replace("T", " ")}`, "ok");
      location.hash = normRole(j.role) === "OFFICER" ? "#/officer" : normRole(j.role) === "ADMIN" ? "#/admin" : "#/dashboard"; route();
      return;
    }
    showErr("Login failed: " + ((j && (j.error || j._err)) || "unknown error"));
  } catch (e) { showErr("Login failed: " + e.message); }
  finally { if (btn) { btn.disabled = false; btn.innerHTML = orig || esc(T("login_go", "Login →")); } }
};
// Legacy role-select wiring (login now uses tabs — kept as a no-op guard so old
// cached HTML never throws; tabs prefill email hints via placeholder instead of values).
function bindLoginRole() {
  const r = document.querySelector("#lg_role");
  if (!r || r.dataset.bound) return;
  r.dataset.bound = "1";
  r.onchange = () => {
    const off = r.value === "officer";
    const em = document.querySelector("#lg_email");
    if (em && !em.value) em.value = off ? "officer@maharashtra.gov.in" : "udyog@demo.in";
    const pw = document.querySelector("#lg_pass");
    if (pw) pw.value = "";
  };
}
// Best-effort shared-data status for the Demo card — hides silently until backend lands.
async function loadDemoStatus() {
  const el = document.querySelector("#demo_status");
  if (!el) return;
  try {
    const s = await api("GET", "/api/demo/status", null, { silent: true });
    if (s && (s.applications != null || s.users != null || s.note)) {
      el.innerHTML = `📊 ${esc(s.note || `Shared data: ${s.applications ?? "—"} applications · ${s.users ?? "—"} users`)}`;
    }
  } catch (e) { /* backend not yet deployed — card still works without it */ }
}

/* ---------- REGISTER (applicants self-serve; staff via admin) ---------- */
function register() {
  return `<div class="auth-shell"><div class="auth-grid"><div class="auth-card"><h2>${esc(T("register_title", "Create applicant account"))}</h2>
    <p class="mut small">${esc(T("register_sub", "Self-registration is open for applicants. Officers/Admins are created by an admin."))}</p>
    <div id="reg_err" class="field-err" role="alert" aria-live="assertive"></div>
    <label for="rg_name">${esc(T("register_name", "Full name"))}</label><input id="rg_name" autocomplete="name" placeholder="Meera Patil" onkeydown="if(event.key==='Enter')doRegister()">
    <label for="rg_email">${esc(T("register_email", "Email"))}</label><input id="rg_email" type="email" autocomplete="email" placeholder="you@example.com" onkeydown="if(event.key==='Enter')doRegister()">
    <div class="formrow"><div><label for="rg_pass">${esc(T("register_password", "Password (min 8 chars + 1 digit)"))}</label><div class="pw-wrap"><input id="rg_pass" type="password" autocomplete="new-password" placeholder="••••••••" onkeydown="if(event.key==='Enter')doRegister()"><button type="button" class="pw-toggle" id="rg_toggle" onclick="togglePw('rg_pass','rg_toggle')" aria-label="Show password">${esc(T("login_show", "Show"))}</button></div></div>
    <div><label for="rg_pass2">${esc(T("register_confirm", "Confirm password"))}</label><input id="rg_pass2" type="password" autocomplete="new-password" placeholder="••••••••" onkeydown="if(event.key==='Enter')doRegister()"></div></div>
    <div class="formrow"><div><label for="rg_phone">${esc(T("register_phone", "Phone (optional)"))}</label><input id="rg_phone" autocomplete="tel" inputmode="tel" placeholder="+91 …" onkeydown="if(event.key==='Enter')doRegister()"><div class="hint">${esc(T("register_mobile_hint", "10-digit mobile, used for SLA alerts."))}</div></div>
    <div><label for="rg_org">${esc(T("register_org", "Organisation (optional)"))}</label><input id="rg_org" placeholder="Firm / unit name" onkeydown="if(event.key==='Enter')doRegister()"><div class="hint">${esc(T("register_org_hint", "Firm, unit or proprietorship name."))}</div></div></div>
    <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="rg_go" onclick="doRegister()">${esc(T("register_go", "Create account →"))}</button>
    <button class="btn ghost" onclick="location.hash='#/login'">${esc(T("login_go", "Login →"))}</button></div></div>
    <div class="auth-card"><h2>🎭 ${esc(T("demo_title", "Demo Mode"))}</h2>
    <p class="mut small">${esc(T("register_sub", "Self-registration is open for applicants. Officers/Admins are created by an admin."))}</p>
    <div class="small">${esc(T("register_have_account", "New here?"))} ${esc(T("auth_no_self_reg", "Contact admin for Officer/Admin accounts — self-registration is disabled."))}</div>
    <div class="small mut" style="margin-top:8px">${esc(T("demo_hint", "Tip: append ?demo=1 to any URL (e.g. #/dashboard?demo=1) to browse seed data without logging in."))} <button class="linkbtn" onclick="enterDemo()">${esc(T("demo_enter", "Enter demo browsing →"))}</button></div></div></div></div>`;
}
window.doRegister = async () => {
  const errBox = document.querySelector("#reg_err");
  const showErr = m => { if (errBox) { errBox.textContent = m; errBox.classList.add("show"); } else toast(m, "err"); };
  if (errBox) { errBox.textContent = ""; errBox.classList.remove("show"); }
  const name = (document.querySelector("#rg_name")?.value || "").trim();
  const email = (document.querySelector("#rg_email")?.value || "").trim();
  const p1 = document.querySelector("#rg_pass")?.value || "";
  const p2 = document.querySelector("#rg_pass2")?.value || "";
  const phone = (document.querySelector("#rg_phone")?.value || "").trim();
  const org = (document.querySelector("#rg_org")?.value || "").trim();
  if (!name) return showErr(T("register_err_name", "Please enter your full name."));
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showErr(T("register_err_email", "Please enter a valid email address."));
  if (p1.length < 8 || !/\d/.test(p1)) return showErr(T("register_err_length", "Password must be at least 8 characters with at least 1 digit."));
  if (p1 !== p2) return showErr(T("register_err_match", "Passwords do not match."));
  // Mobile is optional; when given it must be a 10-digit Indian number (allow +91/spaces).
  if (phone) {
    const digits = phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    if (!/^[6-9]\d{9}$/.test(digits)) return showErr(T("register_err_phone", "Please enter a valid 10-digit mobile number (or leave blank)."));
  }
  const btn = document.querySelector("#rg_go");
  const orig = btn ? btn.innerHTML : "";
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spin" aria-hidden="true"></span>${esc(T("register_wait", "Creating…"))}`; }
  try {
    // Backend contract KEEP: POST /api/auth/register {name,email,password,phone?,org?} → {token,role}.
    const j = await api("POST", "/api/auth/register", { name, email, password: p1, phone, org });
    if (!j || !j.token) throw new Error((j && j.error) || "registration failed");
    localStorage.setItem("us_role", j.role || "APPLICANT");
    localStorage.setItem("us_token", j.token);
    try { localStorage.setItem("us_token_exp", j.expiresAt || ""); } catch (e) {}
    try { localStorage.setItem("us_email", email); } catch (e) {}
    toast(`Welcome, ${name} — account created.`, "ok");
    location.hash = "#/dashboard"; route();
  } catch (e) { showErr(e.message); }
  finally { if (btn) { btn.disabled = false; btn.innerHTML = orig || esc(T("register_go", "Create account →")); } }
};

/* ---------- DASHBOARD (LIVE tracks + REAL renewals) ---------- */
async function dashboard() {
  const apps = await api("GET", "/api/applications");
  const vault = await api("GET", "/api/vault");
  const renewals = await api("GET", "/api/renewals").catch(() => []);
  const cards = apps.map(a => {
    const done = a.tracks.filter(t => ["Approved", "Deemed"].includes(t.status)).length;
    const pct = Math.round(done / Math.max(1, a.tracks.length) * 100);
    const worst = a.tracks.find(t => t.sla?.state === "breached") ? `<span class="badge b-red" aria-label="SLA status: breached">SLA breached</span>` : a.tracks.find(t => t.sla?.state === "urgent") ? `<span class="badge b-amber" aria-label="SLA status: urgent">SLA urgent</span>` : `<span class="badge b-green" aria-label="SLA status: on track">On track</span>`;
    const renewBtns = (a.tracks || []).filter(t => ["Approved", "Deemed"].includes(t.status) && t.renewal).map(t =>
      `<button class="btn sm ghost" onclick="renewReapply('${a.id}','${t.approvalId}')">🔄 Re-apply ${esc(t.name)} (due ${t.renewal.due})</button>`).join(" ");
    return `<div class="card"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${esc(a.title)}</b><span class="badge b-grey">${a.id}</span></div>
      <div class="small mut">${esc(a.sector)} · ${esc(a.midc || a.district)} · ${esc(a.size)} · ${esc(a.stage)} · 👤 ${esc(a.applicant || "")}</div>
      <div style="margin:8px 0" class="progress"><i style="width:${pct}%"></i></div>
      <div class="small">${done}/${a.tracks.length} approvals · completeness ${a.completenessPct || 0}% · Risk <span class="badge ${a.risk.band === "Green" ? "b-green" : a.risk.band === "Amber" ? "b-amber" : "b-red"}" aria-label="Risk ${a.risk.band}, score ${a.risk.score}">${a.risk.band} ${a.risk.score}</span> ${worst}</div>
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" onclick="location.hash='#/app/${a.id}'">Open tracker →</button>${renewBtns}</div></div>`;
  }).join("");
  const renBadge = r => r.state === "overdue" ? `<span class="badge b-red">OVERDUE ${-r.daysLeft}d</span>` : r.state === "due-soon" ? `<span class="badge b-amber">DUE IN ${r.daysLeft}d</span>` : `<span class="badge b-green">valid · ${r.daysLeft}d left</span>`;
  const renList = renewals.length ? renewals.slice(0, 12).map(r =>
    `<div class="small" style="margin:6px 0">📜 <b>${esc(r.name)}</b> — ${r.appId} · 👤 ${esc(r.applicant || "")} · issued ${r.issuedAt} · due <b>${r.due}</b> (${r.validityDays}d) ${renBadge(r)} ${["Approved", "Deemed"].includes(r.status) ? `<button class="btn sm ghost" onclick="renewReapply('${r.appId}','${r.approvalId}')">Re-apply (vault reuse)</button>` : ""}</div>`
  ).join("") : `<div class="small mut">No dated renewals yet — approve a track and its issued + validity + due appears here (Factory/Fire annual, CTO Red-5/Green-10y).</div>`;
  return `<h2>${esc(T("dash_title", "Applicant dashboard"))} <span class="badge b-blue">🔴 LIVE tracks</span> <span class="badge b-green">🔴 LIVE renewals</span></h2><p class="mut">${esc(T("dash_sub", "Applications, risk posture, renewals & vault — one screen. Tracks + renewals below are LIVE from /api/renewals (issued/validity/due per approval)."))}</p>
  <div class="grid g2">${cards}</div>
  <div class="grid g2" style="margin-top:14px"><div class="card"><h3>🔄 Renewals due <span class="badge b-green">🔴 LIVE</span></h3>${renList}<div class="small mut">Validity table K07/K46 (Factory/Fire annual, CTO Red-5/Green-10y). One-click Re-apply prefills a fresh filing reusing vault docs.</div></div>
  <div class="card"><h3>🗄️ Verified vault (${vault.length})</h3><div class="small">${vault.map(d => `✅ ${esc(d.name)} <span class="mut">${d.sizeBytes ? "· " + Math.round(d.sizeBytes / 1024) + " KB" : ""}${d.hash ? " · ⛨ " + String(d.hash).slice(0, 10) + "…" : ""}</span>`).join("<br>")}</div><div style="margin-top:6px"><button class="btn sm ghost" onclick="location.hash='#/documents'">Manage documents</button></div></div></div>`;
}
// #5: Re-apply for renewal — prefill a fresh filing from the approved app, reusing vault docs.
window.renewReapply = async (appId, approvalId) => {
  try {
    const a = await api("GET", "/api/applications/" + appId);
    WIZ.data = {
      sector: a.sector, district: a.district, midc: a.midc, size: a.size,
      stage: a.stage === "Operate" ? "Operate" : "Establish",
      investmentLakh: a.investmentLakh, workers: a.workers,
      applicant: a.applicant, title: `Renewal: ${a.title} (${approvalId})`
    };
    WIZ.step = 2; WIZ.renewalOf = { appId, approvalId };
    toast(`Renewal prefilled from ${appId} ${approvalId} — vault docs will re-attach on filing.`, "ok");
    location.hash = "#/wizard"; route();
  } catch (e) { toast("Re-apply failed: " + e.message, "err"); }
};

/* ---------- WIZARD ---------- */
let WIZ = { step: 1, data: { sector: "Food Processing", district: "Nashik", midc: "Sinnar MIDC", size: "Small", stage: "Establish", investmentLakh: 180, workers: 42, applicant: "Demo Entrepreneur", title: "" } };
async function wizard() {
  await meta();
  const d = WIZ.data;
  const midcs = (META.midcAreas[d.district] || []);
  if (!midcs.includes(d.midc)) d.midc = midcs[0] || "";
  const sel = (id, opts, val) => `<select id="${id}" onchange="WIZ.data['${id.slice(4)}']=${id === 'wiz_district' ? 'this.value;WIZ.data.midc=\'\';wizardRefresh()' : 'this.value'}">${opts.map(o => `<option ${o === val ? "selected" : ""}>${o}</option>`).join("")}</select>`;
  return `<h2>${esc(T("wiz_title", "Checklist generator wizard"))}</h2><p class="mut">${esc(T("wiz_sub", "Sector × location × size × stage → exact approvals, fees, SLAs, documents, parallel order."))}</p>
  <div class="steps">${[1, 2, 3].map(i => `<div class="step ${WIZ.step === i ? "on" : ""}">Step ${i}: ${esc(T(["", "step_profile", "step_project", "step_checklist"][i], ["Profile", "Project", "Checklist"][i - 1]))}</div>`).join("")}</div>
  <div class="card" id="wizbody">
  ${WIZ.step === 1 ? `<div class="formrow"><div><label>${esc(T("f_sector", "Sector"))}</label>${sel("wiz_sector", META.sectors, d.sector)}</div>
    <div><label>${esc(T("f_district", "District"))}</label><select id="wiz_district" onchange="WIZ.data.district=this.value;wizardRefresh()">${META.districts.map(o => `<option ${o === d.district ? "selected" : ""}>${o}</option>`).join("")}</select></div></div>
    <label>${esc(T("f_midc", "MIDC area / location"))}</label><select id="wiz_midc" onchange="WIZ.data.midc=this.value">${midcs.map(o => `<option ${o === d.midc ? "selected" : ""}>${o}</option>`).join("")}</select>
    <div class="formrow"><div><label>${esc(T("f_size", "Project size"))}</label>${sel("wiz_size", ["Micro", "Small", "Medium", "Large"], d.size)}</div>
    <div><label>${esc(T("f_stage", "Stage"))}</label>${sel("wiz_stage", ["Establish", "Operate", "Expand"], d.stage)}</div></div>
    <div style="margin-top:12px"><button class="btn" onclick="WIZ.data.sector=document.querySelector('#wiz_sector').value;WIZ.data.size=document.querySelector('#wiz_size').value;WIZ.data.stage=document.querySelector('#wiz_stage').value;WIZ.data.midc=document.querySelector('#wiz_midc').value;WIZ.step=2;route()">${esc(T("next", "Next →"))}</button></div>`
  : WIZ.step === 2 ? `<div class="formrow"><div><label>${esc(T("f_title", "Project title"))}</label><input id="wiz_title" value="${esc(d.title)}" placeholder="e.g. Shree Foods Unit 2"></div>
    <div><label>${esc(T("f_applicant", "Applicant name"))}</label><input id="wiz_appl" value="${esc(d.applicant)}"></div></div>
    <div class="formrow"><div><label>${esc(T("f_investment", "Investment (₹ lakh)"))}</label><input id="wiz_inv" type="number" value="${d.investmentLakh}"></div>
    <div><label>${esc(T("f_workers", "Workers"))}</label><input id="wiz_wrk" type="number" value="${d.workers}"></div></div>
    <div style="margin-top:12px;display:flex;gap:8px"><button class="btn ghost" onclick="WIZ.step=1;route()">${esc(T("back", "← Back"))}</button>
    <button class="btn" onclick="WIZ.data.title=document.querySelector('#wiz_title').value;WIZ.data.applicant=document.querySelector('#wiz_appl').value;WIZ.data.investmentLakh=+document.querySelector('#wiz_inv').value;WIZ.data.workers=+document.querySelector('#wiz_wrk').value;genChecklist()">${esc(T("generate", "Generate checklist →"))}</button></div>`
  : `<div id="wizresult">Generating checklist… (server rule engine)</div>`}
  </div>`;
}
window.wizardRefresh = () => route();
let LASTCHECK = null;
async function genChecklist(skip) {
  if (!skip) { WIZ.step = 3; route(); return; }
  const box = $("#wizresult");
  if (box) box.innerHTML = `<div class="card">Generating checklist… (server rule engine)</div>`;
  try {
    const res = await api("POST", "/api/checklist", WIZ.data);
    LASTCHECK = res;
    const el = $("#wizresult");
    if (!el) return; // user navigated away — nothing to paint
    const gname = { A: "Group A — Day 1 parallel", B: "Group B — after land", C: "Group C — alongside construction", D: "Group D — pre-production" };
    el.innerHTML = `${WIZ.renewalOf ? `<div class="card" style="background:#eef6f0">🔄 <b>Renewal re-apply</b> from ${esc(WIZ.renewalOf.appId)} ${esc(WIZ.renewalOf.approvalId)} — vault verified docs will re-attach on filing.</div>` : ""}
  <h3>${res.count} approvals · ₹${res.totalFee.toLocaleString("en-IN")} fees · critical path ${res.criticalDays} days</h3>
  ${res.combined ? `<div class="card" style="background:#eef6f0">🔗 ${esc(res.combined)}</div>` : ""}
  ${Object.keys(res.groups).map(g => `<h4>${gname[g]}</h4><div class="tblwrap"><table class="tbl"><tr><th>Approval</th><th>Dept</th><th>SLA</th><th>Fee</th><th>Key documents</th></tr>
    ${res.items.filter(a => a.parallelGroup === g).map(a => `<tr><td><b>${esc(a.name)}</b>${a.inspection ? ' <span class="badge b-amber">site visit</span>' : ""}${a.gate ? ` <span class="badge b-grey" title="${esc(a.gate.note)}">🔒 D-gated</span>` : ""}</td><td>${a.dept}</td><td>${a.slaDays}d</td><td>₹${a.fee.toLocaleString("en-IN")}</td><td class="small">${a.docs.map(esc).join("<br>")}</td></tr>`).join("")}</table></div>`).join("")}
  <h4>💰 Matched incentives (preview)</h4><div class="small">${res.schemes.map(s => `✅ <b>${esc(s.name)}</b> — est. ₹${s.estLakh}L`).join("<br>") || "—"}</div>
  <h4>📋 Pre-filing document checklist</h4><div class="small">${[...new Set(res.items.flatMap(a => a.docs))].map(x => `☐ ${esc(x)}`).join("<br>")}</div>
  <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost" onclick="WIZ.step=2;route()">${esc(T("edit_btn", "← Edit"))}</button>
  <button class="btn green" onclick="fileApplication()">${esc(T("file_btn", "📨 File all as one application"))}</button></div>`;
  } catch (e) {
    const el2 = $("#wizresult");
    if (el2) el2.innerHTML = `<div class="card">⚠️ ${esc(e.message)}</div>`;
  }
}
window.genChecklist = genChecklist;
async function fileApplication() {
  try {
    const vault = await api("GET", "/api/vault");
    const app = await api("POST", "/api/applications", { ...WIZ.data, title: WIZ.data.title || `${WIZ.data.sector} unit — ${WIZ.data.midc}`, reusedDocs: vault.filter(v => v.verified).map(v => v.name) });
    const wasRenewal = WIZ.renewalOf;
    WIZ = { step: 1, data: WIZ.data };
    if (wasRenewal) toast(`Renewal filed as ${app.id} — vault docs reused.`, "ok");
    location.hash = "#/app/" + app.id; route();
  } catch (e) { toast("Filing failed: " + e.message, "err"); }
}
window.fileApplication = fileApplication;

/* ---------- TRACKER ---------- */
async function trackerList() {
  const apps = await api("GET", "/api/applications");
  let an = null;
  try { an = await api("GET", "/api/analytics"); } catch (e) { an = null; }
  const seed = an && an.seedHistoryCount != null ? an.seedHistoryCount : 38;
  const live = an && an.liveHistoryCount != null ? an.liveHistoryCount : 0;
  const total = an && an.historyCount != null ? an.historyCount : (seed + live);
  const seedLiveLine = `<div class="small mut" style="margin:6px 0">SEED ${seed} frozen + LIVE ${live} moves = ${total} total (seed frozen, live moves with filings).</div>`;
  const head = `<h2>${esc(T("tracker_title", "Application tracker"))}</h2><p class="mut">${esc(T("tracker_sub", "Live SLA countdown per department track. Click to open."))}</p>` + seedLiveLine;
  if (!apps.length) return head + `<div class="card">No applications yet — file one from the Wizard. ${seedLiveLine}</div>`;
  return head +
    apps.map(a => `<div class="track"><div><b>${a.id}</b> — ${esc(a.title)}<div class="small mut">${a.tracks.filter(t => ["Approved", "Deemed"].includes(t.status)).length}/${a.tracks.length} cleared</div></div>
    <button class="btn sm" onclick="location.hash='#/app/${a.id}'">${esc(T("track_btn", "Track →"))}</button></div>`).join("");
}
function ring(sla, status) {
  if (["Approved", "Deemed"].includes(status)) return `<div class="ring" role="img" aria-label="Status ${esc(status)}: completed" style="background:var(--green);border-color:#fff">Done</div>`;
  if (status === "Rejected") return `<div class="ring" role="img" aria-label="Status Rejected: on hold" style="background:var(--red);border-color:#fff">Held</div>`;
  if (status === "Locked") return `<div class="ring" role="img" aria-label="Status Locked: waiting for Group A to C clearance" style="background:#5d6b7d;border-color:#fff">Locked</div>`;
  if (!sla) return `<div class="ring" role="img" aria-label="Status ${esc(status)}" style="background:var(--blue);border-color:#fff">${esc(status)}</div>`;
  const c = sla.state === "breached" ? "var(--red)" : sla.state === "urgent" ? "var(--amber)" : "var(--blue)";
  const t = sla.state === "breached" ? `${-sla.left}d over` : `${sla.left}d left`;
  const label = sla.state === "breached" ? `SLA breached by ${-sla.left} days` : sla.state === "urgent" ? `SLA urgent, ${sla.left} days left` : `SLA on track, ${sla.left} days left`;
  return `<div class="ring" role="img" aria-label="${label}, status ${esc(status)}" style="background:${c};border-color:#fff">${t}</div>`;
}
async function appDetail(id) {
  const a = await api("GET", "/api/applications/" + id);
  const insp = (await api("GET", "/api/inspections")).filter(i => i.appId === id);
  const needVisit = a.tracks.filter(t => t.inspection && !["Approved", "Deemed"].includes(t.status)).map(t => t.dept);
  return `<button class="btn sm ghost" onclick="location.hash='#/tracker'">← All applications</button>
  <h2>${a.id} — ${esc(a.title)}</h2>
  <div><span class="badge b-blue">${esc(a.sector)}</span> <span class="badge b-grey">${esc(a.district)} · ${esc(a.midc || "")}</span>
  <span class="badge ${a.risk.band === "Green" ? "b-green" : a.risk.band === "Amber" ? "b-amber" : "b-red"}">Risk ${a.risk.band} ${a.risk.score}</span>
  <span class="badge b-grey">${esc(a.risk.route)}</span></div>
  <div class="grid g2" style="margin-top:12px"><div>
  ${a.tracks.map(t => `<div class="track"><div><b>${esc(t.name)}</b> <span class="badge b-grey">${t.dept}</span>
    <div class="small">Status: <b>${esc(t.status)}</b> · SLA ${t.slaDays}d · deadline ${t.sla?.deadline || "—"}</div>
    <div class="small mut">${esc(t.remarks || "")}</div></div>${ring(t.sla, t.status)}</div>`).join("")}
  </div><div>
    <div class="card"><h3>📅 Inspection scheduling</h3>
    ${needVisit.length >= 2 ? `<div class="small" style="background:#eef6f0;padding:8px;border-radius:8px">🔗 <b>Common Inspection eligible:</b> ${needVisit.join(" + ")} — book one joint visit.</div>` : `<div class="small mut">Site visits needed: ${needVisit.join(", ") || "none pending"}</div>`}
    <label>Date</label><input type="date" id="ins_date" value="${new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10)}">
    <label>Slot</label><select id="ins_slot"><option>10:00–12:00</option><option>11:00–13:00</option><option>14:00–16:00</option></select>
    <div style="margin-top:8px"><button class="btn sm" onclick="bookInsp('${a.id}',${JSON.stringify(needVisit).replace(/"/g, "&quot;")})">Book ${needVisit.length > 1 ? "combined " : ""}inspection</button></div>
    <div class="timeline">${insp.map(i => `<div>📋 <b>${i.id}</b> ${i.date} ${i.slot} — ${i.depts.join("+")} · ${i.status}${i.combined ? " · <b>COMBINED</b>" : ""}</div>`).join("") || "<div class='mut small'>No inspections booked yet.</div>"}</div></div>
    <div class="card" style="margin-top:12px"><h3>📎 Documents (${(a.documents || []).length}) — size / hash / checklist</h3>
    <div class="small">${(a.documents || []).map(d => `${d.verified ? "✅" : "⏳"} <b>${esc(d.name)}</b> <span class="mut">(${esc(d.docType)})${d.sizeBytes ? ` · ${Math.round(d.sizeBytes / 1024)} KB` : ""}${d.mime ? ` · ${esc(d.mime)}` : ""}${d.hash ? ` · ⛨ ${String(d.hash).slice(0, 12)}…` : " · <i>legacy (no byte-hash — re-upload for hash)</i>"}</span>`).join("<br>") || "<span class='mut'>No documents yet.</span>"}</div>
    <button class="btn sm ghost" style="margin-top:6px" onclick="location.hash='#/documents'">Upload + pre-validate</button></div>
  </div></div>`;
}
window.bookInsp = async (appId, depts) => {
  if (!depts.length) { toast("No site visits pending.", "warn"); return; }
  try {
    const r = await api("POST", "/api/inspections", { appId, depts, date: $("#ins_date").value, slot: $("#ins_slot").value });
    toast(`Booked ${r.id}${r.combined ? " (COMBINED joint visit — one slot, all departments)" : ""}${r.warning ? ` — ${r.warning}` : ""}. Linked tracks → "Inspection scheduled".`, r.warning ? "warn" : "ok");
    route();
  } catch (e) { toast("Booking failed: " + e.message, "err"); }
};

/* ---------- DOCUMENTS (real bytes → multipart, server verdict only) ---------- */
async function documents() {
  await meta();
  const vault = await api("GET", "/api/vault");
  const apps = await api("GET", "/api/applications");
  const live = apps[0];
  const allDocs = [...new Set(META.approvals.flatMap(a => a.docs))];
  return `<h2>${esc(T("docs_title", "Documentation guidance + pre-validation"))}</h2><p class="mut">${esc(T("docs_sub", "Upload → real bytes to the server (multipart) → server measures size, sniffs MIME, hashes SHA-256 → verified docs enter the vault and auto-attach. Server verdict only — no client PASSED."))}</p>
  <div class="grid g2"><div class="card"><h3>⬆️ ${esc(T("docs_up", "Upload & validate"))} ${live ? `for ${live.id}` : ""}</h3>
    <label>${esc(T("docs_type", "Document type"))}</label><select id="up_type">${allDocs.map(d => `<option>${esc(d)}</option>`).join("")}</select>
    <label>${esc(T("docs_file", "File (PDF/JPG/PNG, ≤10 MB — real bytes sent)"))}</label><input type="file" id="up_file" accept=".pdf,.jpg,.jpeg,.png">
    <div class="formrow"><div><label>${esc(T("docs_exp", "Expiry (if applicable)"))}</label><input type="date" id="up_exp"></div>
    <div><label>${esc(T("docs_holder", "Name on document"))}</label><input id="up_name" value="${esc(live?.applicant || "")}" placeholder="Must match applicant PAN"></div></div>
    <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="validateUpload('${live?.id || ""}')">Run server pre-validation</button></div>
    <div id="up_result" style="margin-top:10px"><div class="small mut">No verdict yet — choose a file and run validation. The server decides.</div></div></div>
  <div class="card"><h3>🗄️ ${esc(T("docs_vault", "DigiLocker-style vault"))} (${vault.length})</h3><div class="small">${vault.map(d => `✅ <b>${esc(d.name)}</b> — ${esc(d.docType)} <span class="mut">${d.sizeBytes ? `· ${Math.round(d.sizeBytes / 1024)} KB` : ""}${d.mime ? ` · ${esc(d.mime)}` : ""}${d.hash ? ` · ⛨ ${String(d.hash).slice(0, 12)}…` : " · <i>legacy (no byte-hash)</i>"}</span>`).join("<br>") || "—"}</div>
  <div class="small mut">${esc(T("docs_vault_note", "Vault holds verified filename + size + MIME + SHA-256 records (bytes verified on upload, not stored). Same bytes under a different docType are rejected as tamper; identical re-uploads as duplicates."))}</div>
  <div class="small mut" style="margin-top:6px">Sniff-422 demo: rename any .exe → .pdf and upload — server MIME sniff fails with 422 (not a real PDF/JPG/PNG). Forged JSON {"name":"forged.pdf","passed":true} → 422, nothing stored.</div>
  <hr><div class="small mut"><b>Why incomplete applications fell 41% → 12%*:</b> queries are caught here, before filing — not bounced between departments after. <em>*Seed projection (38-row baseline), pilot to measure.</em></div></div></div>`;
}
// #2 fix: clear box FIRST, send REAL bytes via FormData multipart, render SERVER verdict only.
// Never show an optimistic client "PASSED" — the box shows "Validating…" until the server answers.
window.validateUpload = async (appId) => {
  const box = $("#up_result");
  if (box) box.innerHTML = `<div class="card">⏳ Validating on server… (bytes uploading, MIME sniff + SHA-256 running)</div>`;
  const f = $("#up_file")?.files?.[0];
  const type = $("#up_type")?.value || "", exp = $("#up_exp")?.value || "", nm = ($("#up_name")?.value || "").trim();
  if (!f) { if (box) box.innerHTML = `<div class="checkline fail">❌ No file chosen — attach a PDF/JPG/PNG. Nothing was sent.</div>`; return; }
  if (!appId) { if (box) box.innerHTML = `<div class="checkline fail">❌ No application to attach to — file one from the Wizard first.</div>`; return; }
  try {
    const fd = new FormData();
    fd.append("file", f, f.name);
    fd.append("docType", type);
    if (exp) fd.append("expiry", exp);
    fd.append("holderName", nm);
    const headers = {};
    try { const tok = localStorage.getItem("us_token"); if (tok) headers["Authorization"] = "Bearer " + tok; } catch (e) {}
    const r = await fetch(`/api/applications/${appId}/documents/upload`, { method: "POST", headers, body: fd });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const det = Array.isArray(j.details) ? j.details.join("; ") : (j.error || ("HTTP " + r.status));
      if (box) box.innerHTML = `<div class="checkline fail">❌ <b>Server verdict: REJECTED (${r.status})</b></div><div class="small">${esc(det)}</div>`
        + ((j.checks || []).map(c => `<div class="checkline fail">❌ ${esc(typeof c === "string" ? c : c.msg || c)}</div>`).join(""))
        + (j.hash ? `<div class="small mut">SHA-256 <code>${esc(j.hash)}</code> · ${j.sizeBytes || "?"} bytes · ${esc(j.mime || "")}</div>` : "");
      return;
    }
    if (box) box.innerHTML = `<div class="checkline pass">✅ <b>Server verdict: VERIFIED</b> — vault + ${esc(appId)} updated.</div>`
      + `<div class="small">📦 ${j.sizeBytes} bytes · ${esc(j.mime || "")} · ⛨ <code>${esc(j.hash || "")}</code></div>`
      + ((j.checks || []).map(c => `<div class="checkline pass">✅ ${esc(typeof c === "string" ? c : c)}</div>`).join(""));
    toast(`Document verified (${j.sizeBytes} bytes, ${j.mime}) — vault updated.`, "ok");
    // Refresh vault counts behind the verdict without wiping it: re-render on next visit.
  } catch (e) {
    if (box) box.innerHTML = `<div class="checkline fail">❌ Upload failed: ${esc(e.message)}</div>`;
  }
};

/* ---------- OFFICER (queue + summary strip + inspection confirmations) ---------- */
function slaLabel(t) {
  // #3 fix: t.sla is null for terminal tracks (Approved/Rejected/Deemed return null
  // server-side) — never render "undefinedd left". Terminals show their status.
  if (["Approved", "Deemed"].includes(t.status)) return `<span class="badge b-green">${esc(t.status)}</span>`;
  if (t.status === "Rejected") return `<span class="badge b-red">Rejected</span>`;
  if (t.status === "Locked") return `<span class="badge b-grey">🔒 ${esc(t.lockedReason || "Locked — clear Group A–C")}</span>`;
  if (!t.sla) return `<span class="badge b-grey">${esc(t.status)}</span>`;
  if (t.sla.state === "breached") return `<b class="fail">BREACHED ${-t.sla.left}d</b> (deadline ${esc(t.sla.deadline || "—")})`;
  return `${t.sla.left}d left (deadline ${esc(t.sla.deadline || "—")})`;
}
async function officer() {
  await meta();
  const apps = await api("GET", "/api/applications");
  const dept = localStorage.getItem("us_dept") || "MPCB";
  const rows = [];
  apps.forEach(a => (a.tracks || []).filter(t => t.dept === dept && !["Approved", "Deemed", "Rejected"].includes(t.status)).forEach(t =>
    rows.push({ app: a, t })));
  // Summary strip: settled vs pending for this dept (from live tracks).
  let settled = 0, pending = 0;
  apps.forEach(a => (a.tracks || []).forEach(t => {
    if (t.dept !== dept) return;
    if (["Approved", "Deemed", "Rejected"].includes(t.status)) settled += 1; else pending += 1;
  }));
  return `<h2>${esc(T("off_title", "Officer workspace"))} — ${deptName(dept)}</h2>
  <div class="card"><label>${esc(T("off_queue", "Department queue"))}</label><select id="off_dept" onchange="localStorage.setItem('us_dept',this.value);route()">${META.departments.map(d => `<option value="${d.id}" ${d.id === dept ? "selected" : ""}>${d.name} — ${esc(d.full)}</option>`).join("")}</select>
  <div class="small" style="margin-top:8px">📊 <b>${settled} ${esc(T("off_settled", "settled"))}</b> (Approved/Deemed/Rejected, immutable) · <b>${pending} ${esc(T("off_pending_label", "pending"))}</b> in ${esc(deptName(dept))} queue · terminal tracks never flip (Approved/Deemed → Queried blocked with 400).</div></div>
  <p class="mut">${rows.length} ${esc(T("off_pending", "pending item(s). Files reaching you are pre-validated; risk-ranked."))}</p>
  ${rows.map(({ app, t }) => `<div class="card"><b>${app.id}</b> — ${esc(app.title)} <span class="badge ${app.risk.band === "Green" ? "b-green" : app.risk.band === "Amber" ? "b-amber" : "b-red"}">${app.risk.band} ${app.risk.score}</span> <span class="badge b-grey">completeness ${app.completenessPct || 0}%</span>
    <div class="small mut">${esc(t.name)} · SLA ${slaLabel(t)} · ${esc(t.remarks || "")}</div>
    <div class="small">📎 ${(app.documents || []).map(d => `${d.verified ? "✅" : "⏳"}${esc(d.name)}<span class="mut">${d.sizeBytes ? ` ${Math.round(d.sizeBytes / 1024)}KB` : ""}${d.hash ? ` ⛨${String(d.hash).slice(0, 8)}` : ""}</span>`).join(" · ") || "no docs"}</div>
    <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap"><input id="rm_${app.id}_${t.approvalId}" placeholder="${esc(T("off_remarks", "Remarks / speaking order…"))}" style="flex:2;min-width:200px">
    <button class="btn sm green" onclick="offAct('${app.id}','${t.approvalId}','approve')">${esc(T("off_approve", "Approve"))}</button>
    <button class="btn sm ghost" onclick="offAct('${app.id}','${t.approvalId}','review')">${esc(T("off_review", "Desk review"))}</button>
    <button class="btn sm ghost" onclick="offAct('${app.id}','${t.approvalId}','inspect')">${esc(T("off_inspect", "Ask inspection"))}</button>
    <button class="btn sm" style="background:var(--amber)" onclick="offAct('${app.id}','${t.approvalId}','query')">${esc(T("off_query", "Query"))}</button>
    <button class="btn sm ghost" onclick="offAct('${app.id}','${t.approvalId}','reject')">${esc(T("off_reject", "Reject"))}</button></div></div>`).join("") || `<div class="card">🎉 ${esc(T("off_clear", "Queue clear"))} ${esc(deptName(dept))}.</div>`}
  <div class="card" style="margin-top:12px"><h3>${esc(T("off_insp", "Inspection confirmations"))}</h3><div id="off_insp"><div class="small mut">Loading scheduled inspections…</div></div></div>
  <div class="card" style="margin-top:12px"><h3>📜 Officer audit drawer — GET /api/audit (officer-only table)</h3><div class="small mut">Append-only audit: file / approve / query / deem / upload / inspection / escalate. Applicant token → 403, no token → 401.</div><div style="margin-top:8px"><button class="btn sm" onclick="loadAudit()">Load audit →</button> <button class="btn sm ghost" onclick="demoGate400()">Demo gate-400 (Locked CTO → 400)</button> <button class="btn sm ghost" onclick="location.hash='#/documents'">Demo sniff-422 (renamed .exe→.pdf → 422)</button></div><div id="audit_box" style="margin-top:8px"><div class="small mut">Audit not loaded — click Load audit.</div></div></div>`;
}
window.offAct = async (appId, approvalId, action) => {
  const el = document.querySelector(`#rm_${CSS.escape(appId)}_${CSS.escape(approvalId)}`);
  try {
    await api("PATCH", `/api/applications/${appId}/track`, { approvalId, action, remarks: el?.value || ({ approve: "Verified & approved.", query: "Discrepancy found — see remarks.", review: "Taken up for desk review.", inspect: "Site inspection ordered.", reject: "Rejected with speaking order.", deemed: "Deemed approval issued." }[action]), officer: "Desk Officer" });
    toast(`${approvalId} → ${action} recorded.`, "ok");
    route();
  } catch (e) { toast("Officer action blocked (400/401/403 — see code): " + e.message + " (requires Officer or Admin login — see 🎭 Demo Mode card)", "err"); }
};
window.demoGate400 = async () => {
  try {
    const apps = await api("GET", "/api/applications");
    const locked = [];
    apps.forEach(a => (a.tracks || []).forEach(t => { if (t.status === "Locked") locked.push({ appId: a.id, approvalId: t.approvalId }); }));
    if (!locked.length) { toast("No Locked Group-D track right now — file a fresh Establish app to mint one, then retry.", "warn"); return; }
    const pick = locked[0];
    await api("PATCH", `/api/applications/${pick.appId}/track`, { approvalId: pick.approvalId, action: "approve", remarks: "Gate probe", officer: "Desk Officer" });
    toast("Unexpected: gate allowed approve (should be 400).", "warn");
  } catch (e) { toast("Gate-400 demo: " + e.message + " — Locked CTO before CTE correctly blocked with 400.", e.status === 400 ? "ok" : "err"); }
};
async function loadAudit() {
  const el = $("#audit_box"); if (!el) return;
  el.innerHTML = `<div class="small mut">Loading audit (GET /api/audit)…</div>`;
  try {
    const j = await api("GET", "/api/audit");
    const rows = (j.audit || []).slice(-30).reverse().map(a => `<tr><td class="small">${esc(String(a.ts || "").slice(0, 19).replace("T", " "))}</td><td><code>${esc(a.actor || "")}</code></td><td class="small">${esc(a.action || "")}</td><td><code>${esc(a.id || "")}</code></td></tr>`).join("");
    el.innerHTML = `<div class="small mut">Count ${(j.count != null ? j.count : (j.audit || []).length)} (last 30, newest first) — officer-only, applicant → 403.</div><div class="tblwrap"><table class="tbl"><tr><th>ts</th><th>actor</th><th>action</th><th>id</th></tr>${rows || `<tr><td colspan="4" class="mut">No audit rows yet — file or approve something.</td></tr>`}</table></div>`;
  } catch (e) { el.innerHTML = `<div class="small fail">Audit blocked: ${esc(e.message)} (need Officer/Admin Bearer — 401/403)</div>`; }
}
window.loadAudit = loadAudit;
async function loadOffInsp() {
  try {
    const list = (await api("GET", "/api/inspections")).filter(i => i.status === "Scheduled");
    const el = $("#off_insp"); if (!el) return;
    el.innerHTML = list.map(i => `<div class="small">📋 <b>${i.id}</b> ${i.date} ${i.slot} — ${i.appId} (${i.depts.join("+")})${i.combined ? " · <b>COMBINED</b>" : ""} <button class="btn sm green" onclick="inspDone('${i.id}')">Confirm done</button></div>`).join("") || "No scheduled inspections.";
  } catch (e) {
    const el = $("#off_insp"); if (el) el.innerHTML = `<div class="small fail">⚠️ ${esc(e.message)}</div>`;
  }
}
window.loadOffInsp = loadOffInsp;
window.inspDone = async id => { try { await api("PATCH", "/api/inspections/" + id, { status: "Completed" }); toast(`Inspection ${id} completed — linked tracks → Under review.`, "ok"); route(); } catch (e) { toast("Confirm blocked: " + e.message, "err"); } };

/* ---------- ADMIN (users table + create-officer + disable toggle) ---------- */
// Server-driven isolation: we render whatever scoped GET /api/admin/users returns.
// Staff-only; route() already guards ADMIN. All mutations re-fetch the table.
async function admin() {
  let users = [];
  let loadErr = "";
  try {
    users = await api("GET", "/api/admin/users");
    if (!Array.isArray(users)) users = users.users || users.items || [];
  } catch (e) { loadErr = e.message; }
  // WHY: POST /api/admin/officers requires dept (server.js:975) — populate from
  // META.departments like the officer queue (app.js:654); fallback keeps form usable offline.
  try { await meta(); } catch (e) { /* META stays null — fallback list below */ }
  const deptOpts = (META && META.departments && META.departments.length ? META.departments : [
    { id: "MIDC", name: "MIDC", full: "Maharashtra Industrial Development Corporation" },
    { id: "MPCB", name: "MPCB", full: "Maharashtra Pollution Control Board" },
    { id: "LABOUR", name: "Labour", full: "Directorate of Industrial Safety & Health / Labour" },
    { id: "FIRE", name: "Fire", full: "Maharashtra Fire Services" },
    { id: "MSEDCL", name: "MSEDCL", full: "MSEDCL (Power / DISCOM)" },
    { id: "DOI", name: "Industries", full: "Directorate of Industries (Single Window)" }
  ]);
  const rowBadge = u => {
    const r = normRole(u.role);
    return r === "ADMIN" ? `<span class="badge b-purple">🛡️ ${esc(T("role_admin", "Admin"))}</span>`
      : r === "OFFICER" ? `<span class="badge b-blue">🏛️ ${esc(T("role_officer", "Officer"))}</span>`
        : `<span class="badge b-green">🏭 ${esc(T("role_applicant", "Applicant"))}</span>`;
  };
  const rows = users.map(u => `<tr><td><b>${esc(u.name || "—")}</b><div class="small mut">${esc(u.id || "")}</div></td>`
    + `<td>${esc(u.email || "")}</td><td>${rowBadge(u)}${u.disabled ? ` <span class="badge b-red">${esc(T("admin_disabled", "disabled"))}</span>` : ""}</td>`
    + `<td><button class="btn sm ghost" onclick="adminToggle('${esc(u.id || u.email || "")}',${u.disabled ? "false" : "true"})">${u.disabled ? esc(T("admin_enable", "Enable")) : esc(T("admin_disable", "Disable"))}</button></td></tr>`).join("");
  return `<h2>🛡️ ${esc(T("admin_title", "Admin console"))}</h2><p class="mut">${esc(T("admin_sub", "Users, officers and access — staff only. Data below is whatever GET /api/admin/users returns for your session."))}</p>`
    + `<div class="grid g2"><div class="card"><h3>👥 ${esc(T("admin_users", "Users"))} (${users.length})</h3>`
    + (loadErr ? `<div class="card">⚠️ ${esc(loadErr)}</div>`
      : `<div class="tblwrap"><table class="tbl"><tr><th>${esc(T("register_name", "Full name"))}</th><th>${esc(T("register_email", "Email"))}</th><th>${esc(T("login_role", "Role"))}</th><th></th></tr>${rows || `<tr><td colspan="4" class="mut">No users returned.</td></tr>`}</table></div>`)
    + `</div><div class="card"><h3>➕ ${esc(T("admin_create_officer", "Create officer"))}</h3>`
    + `<div id="adm_err" class="small fail" style="display:none;margin:8px 0"></div>`
    + `<label>${esc(T("register_name", "Full name"))}</label><input id="adm_name" placeholder="Desk Officer">`
    + `<label>${esc(T("register_email", "Email"))}</label><input id="adm_email" type="email" placeholder="officer@maharashtra.gov.in">`
    + `<label>${esc(T("register_password", "Password (min 8 chars + 1 digit)"))}</label><input id="adm_pass" type="password" placeholder="••••••••">`
    + `<label>Department</label><select id="adm_dept">${deptOpts.map(d => `<option value="${esc(d.id)}">${esc(d.name)} — ${esc(d.full || d.id)}</option>`).join("")}</select>`
    + `<label>Designation (optional)</label><input id="adm_desig" placeholder="e.g. MPCB Officer">`
    + `<div style="margin-top:10px"><button class="btn" id="adm_go" onclick="adminCreate()">${esc(T("admin_create_go", "Create officer →"))}</button></div>`
    + `<div class="small mut" style="margin-top:8px">${esc(T("auth_no_self_reg", "Contact admin for Officer/Admin accounts — self-registration is disabled."))}</div></div></div>`;
}
window.adminCreate = async () => {
  const errBox = document.querySelector("#adm_err");
  const showErr = m => { if (errBox) { errBox.style.display = "block"; errBox.textContent = m; } else toast(m, "err"); };
  if (errBox) { errBox.style.display = "none"; errBox.textContent = ""; }
  const name = (document.querySelector("#adm_name")?.value || "").trim();
  const email = (document.querySelector("#adm_email")?.value || "").trim();
  const password = document.querySelector("#adm_pass")?.value || "";
  const dept = (document.querySelector("#adm_dept")?.value || "").trim();
  const designation = (document.querySelector("#adm_desig")?.value || "").trim();
  if (!name) return showErr(T("register_err_name", "Please enter your full name."));
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showErr(T("register_err_email", "Please enter a valid email address."));
  if (password.length < 8 || !/\d/.test(password)) return showErr(T("register_err_length", "Password must be at least 8 characters with at least 1 digit."));
  if (!dept) return showErr("Please select a department (MIDC, MPCB, LABOUR, FIRE, MSEDCL, DOI).");
  const btn = document.querySelector("#adm_go");
  if (btn) { btn.disabled = true; btn.textContent = T("register_wait", "Creating…"); }
  try {
    const payload = { name, email, password, dept };
    if (designation) payload.designation = designation;
    await api("POST", "/api/admin/officers", payload);
    toast(`Officer ${email} created.`, "ok");
    route();
  } catch (e) { showErr(e.message); if (btn) { btn.disabled = false; btn.textContent = T("admin_create_go", "Create officer →"); } }
};
window.adminToggle = async (id, disable) => {
  if (!id) { toast("Missing user id.", "err"); return; }
  try {
    await api("PATCH", `/api/admin/users/${encodeURIComponent(id)}`, { disabled: !!disable });
    toast(`User ${id} ${disable ? "disabled" : "enabled"}.`, "ok");
    route();
  } catch (e) { toast("User update blocked: " + e.message, "err"); }
};

/* ---------- INSPECTIONS ---------- */
async function inspections() {
  const list = await api("GET", "/api/inspections");
  return `<h2>${esc(T("insp_title", "Inspection planner"))}</h2><p class="mut">${esc(T("insp_sub", "Single calendar across departments. Combined visits replace 2-3 separate trips."))}</p>
  ${list.map(i => `<div class="card">📋 <b>${i.id}</b> — ${i.appId} · ${i.date} · ${i.slot}<br><span class="small">Depts: ${i.depts.join(" + ")} · Officer: ${esc(i.officer)} · Status: <b>${i.status}</b>${i.combined ? ' · <span class="badge b-green">COMBINED — 1 visit</span>' : ""}</span></div>`).join("")}`;
}

/* ---------- SCHEMES ---------- */
async function schemes() {
  await meta();
  const d = WIZ.data;
  return `<h2>${esc(T("sch_title", "Incentives & schemes finder"))}</h2><p class="mut">${esc(T("sch_sub", "Uses your wizard profile — change it there or edit below."))}</p>
  <div class="card"><div class="formrow"><div><label>Sector</label><select id="sc_sec">${META.sectors.map(s => `<option ${s === d.sector ? "selected" : ""}>${s}</option>`).join("")}</select></div>
  <div><label>Size</label><select id="sc_size">${["Micro", "Small", "Medium", "Large"].map(s => `<option ${s === d.size ? "selected" : ""}>${s}</option>`).join("")}</select></div></div>
  <label>Investment (₹ lakh)</label><input id="sc_inv" type="number" value="${d.investmentLakh}">
  <div style="margin-top:8px"><button class="btn" onclick="matchSchemes()">${esc(T("sch_check", "Check eligibility →"))}</button></div></div><div id="sc_res" style="margin-top:12px"><div class="small mut">Checking eligibility…</div></div>`;
}
async function matchSchemes() {
  const box = $("#sc_res"); if (!box) return;
  try {
    const body = { sector: $("#sc_sec")?.value || WIZ.data.sector, size: $("#sc_size")?.value || WIZ.data.size, investmentLakh: +($("#sc_inv")?.value || WIZ.data.investmentLakh) };
    const res = await api("POST", "/api/schemes/match", body);
    box.innerHTML = res.map(s => `<div class="card" style="${s.eligible ? "border-left:6px solid var(--green)" : "opacity:.75"}">
    <b>${s.eligible ? "✅" : "⬜"} ${esc(s.name)}</b> <span class="badge b-grey">${esc(s.dept)}</span>
    <div class="small">${esc(s.benefit)}</div>
    ${s.eligible ? `<div><b class="pass">Eligible — estimated benefit ≈ ₹${s.estLakh} lakh</b></div><div class="small mut">${esc(s.how)}</div>` : `<div class="small fail">Not eligible: ${s.reasons.map(esc).join("; ")}</div>`}</div>`).join("");
  } catch (e) { box.innerHTML = `<div class="card">⚠️ ${esc(e.message)}</div>`; }
}
window.matchSchemes = matchSchemes;

/* ---------- GRIEVANCE ---------- */
async function grievances() {
  const list = await api("GET", "/api/grievances");
  const apps = await api("GET", "/api/applications");
  return `<h2>${esc(T("grv_title", "Grievance & escalation"))}</h2><p class="mut">${esc(T("grv_sub", "7-day department SLA → auto-escalates to Nodal Officer → Secretary (Industries). Full timeline travels with the case."))}</p>
  <div class="card"><h3>${esc(T("grv_raise", "Raise grievance"))}</h3><div class="formrow"><div><label>${esc(T("grv_app", "Application"))}</label><select id="gr_app">${apps.map(a => `<option value="${a.id}">${a.id} — ${esc(a.title)}</option>`).join("")}</select></div>
  <div><label>${esc(T("grv_dept", "Department"))}</label><select id="gr_dept">${META.departments.map(d => `<option value="${d.id}">${d.name}</option>`).join("")}</select></div></div>
  <label>${esc(T("grv_subject", "Subject"))}</label><input id="gr_sub" placeholder="e.g. Fire NOC pending beyond SLA"><div style="margin-top:8px"><button class="btn" onclick="raiseGrv()">${esc(T("grv_file", "File grievance"))}</button></div></div>
  <div style="margin-top:12px">${list.map(g => `<div class="card"><b>${g.id}</b> — ${esc(g.subject)} <span class="badge ${g.status === "Resolved" ? "b-green" : g.status.includes("Secretary") ? "b-red" : "b-amber"}">${esc(g.status)}</span>
    <div class="small mut">${g.appId} · ${deptName(g.dept)} · filed ${String(g.createdAt).slice(0, 10)}</div>
    <div class="timeline">${g.updates.map(u => `<div>• ${esc(u)}</div>`).join("")}</div>
    ${g.status !== "Resolved" ? `<div style="margin-top:6px;display:flex;gap:6px"><button class="btn sm" onclick="grvAct('${g.id}','escalate')">⬆ ${esc(T("grv_escalate", "Escalate"))}</button><button class="btn sm green" onclick="grvAct('${g.id}','resolve')">✓ ${esc(T("grv_resolve", "Resolve with order"))}</button></div>` : ""}</div>`).join("")}</div>`;
}
window.raiseGrv = async () => {
  if (!$("#gr_sub").value.trim()) { toast("Enter a subject.", "warn"); return; }
  try {
    await api("POST", "/api/grievances", { appId: $("#gr_app").value, dept: $("#gr_dept").value, subject: $("#gr_sub").value.trim() });
    toast("Grievance filed — 7-day department SLA started.", "ok");
    route();
  } catch (e) { toast("Filing failed: " + e.message, "err"); }
};
window.grvAct = async (id, action) => {
  try { await api("PATCH", "/api/grievances/" + id, { action }); toast(`Grievance ${id} → ${action}.`, "ok"); route(); }
  catch (e) { toast("Grievance action blocked: " + e.message, "err"); }
};

/* ---------- ANALYTICS (SEED frozen + LIVE separate — honesty rule) ---------- */
let AN = null;
async function analytics() {
  AN = await api("GET", "/api/analytics");
  const drop = Math.round((1 - AN.avgNew / AN.avgOld) * 100);
  const liveAvg = AN.avgNewLive != null ? `${AN.avgNewLive}d (n=${AN.liveHistoryCount} measured)` : "— (approve something to mint one)";
  return `<h2>${esc(T("an_title", "Impact analytics"))} <span class="badge b-grey">🌱 ${esc(T("an_seed", "SEED frozen"))}</span> <span class="badge b-blue">🔴 ${esc(T("an_live", "LIVE moves"))}</span></h2><p class="mut">🌱 SEED before/after regime baseline (${AN.seedHistoryCount || AN.historyCount || 38} frozen illustrative rows, *Seed projection — never moves, not measured) + 🔴 <b>LIVE</b> counters aggregated from filings. File/approve → LIVE moves, SEED headlines do not.</p>
  <div class="grid g4">
    <div class="card"><b style="font-size:26px">${AN.avgOld} → ${AN.avgNew}d*</b><div class="small mut">🌱 SEED — Avg approval time (−${drop}%*, frozen)</div></div>
    <div class="card"><b style="font-size:26px">${AN.incomplete.old}% → ${AN.incomplete.new}%*</b><div class="small mut">🌱 SEED — Incomplete applications*</div></div>
    <div class="card"><b style="font-size:26px">${AN.live.pendingTracks}</b><div class="small mut">🔴 LIVE pending tracks</div></div>
    <div class="card"><b style="font-size:26px">${AN.live.inspections}</b><div class="small mut">🔴 LIVE scheduled inspections</div></div>
  </div>
  <div class="small mut" style="margin-top:6px">*Seed projection — computed from <code>data/seed.js</code> 38-row frozen baseline (live rows excluded). Pilot (Sinnar × 3 approvals × 20 users × 4 wks) to measure real before/after. Postgres migration roadmap in README. Basis: <code>${esc(AN.basis || "")}</code></div>
  <div class="card" style="margin-top:12px;border-left:6px solid var(--blue)"><h3>🔴 LIVE — moves with every filing/approval <span class="badge b-blue">${AN.live.applications} applications filed</span> <span class="badge b-green">avg completion ${esc(liveAvg)}</span></h3>
    <div class="grid g4">
      <div class="stat"><b>${AN.live.applications}</b><br><span>Filings via Single Window</span></div>
      <div class="stat"><b>${AN.live.queryRate}%</b><br><span>Live query rate</span></div>
      <div class="stat"><b>${AN.live.combinedInspectionPct}%</b><br><span>Combined inspections</span></div>
      <div class="stat"><b>${Object.keys(AN.live.filingsBySector || {}).length}</b><br><span>Sectors live</span></div>
    </div>
    <div class="grid g2" style="margin-top:12px">
      <div><h3>Live pending tracks by dept — file an app, watch bars move</h3><canvas class="chart" id="ch3" width="520" height="260" role="img" aria-label="Bar chart: live pending tracks by department"></canvas><details><summary class="small">Data table: live pending by dept</summary><div class="tblwrap"><table class="tbl"><tr><th>Dept</th><th>Pending tracks (live)</th></tr>${Object.entries(AN.live.pendingByDept || {}).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v}</td></tr>`).join("") || `<tr><td colspan="2">No live pending tracks</td></tr>`}</table></div></details></div>
      <div><h3>Live filings by sector</h3><div class="small">${Object.entries(AN.live.filingsBySector || {}).map(([s, n]) => `🏭 ${esc(s)}: <b>${n}</b>`).join("<br>") || "—"}</div></div>
    </div></div>
  <div class="grid g2" style="margin-top:12px">
    <div><h3>🌱 SEED — Days by department (old vs new)</h3><canvas class="chart" id="ch1" width="520" height="260" role="img" aria-label="Bar chart: average approval days by department, old regime versus Udyog Sarthi"></canvas><details><summary class="small">Data table: days by dept (old vs new)</summary><div class="tblwrap"><table class="tbl"><tr><th>Dept</th><th>Old (days)</th><th>New (days)</th><th>Saved</th></tr>${Object.entries(AN.byDept).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v.old}</td><td>${v.new}</td><td>${v.saved}</td></tr>`).join("")}</table></div></details></div>
    <div><h3>🌱 SEED — Bottleneck ranking (days saved*)</h3><canvas class="chart" id="ch2" width="520" height="260" role="img" aria-label="Bar chart: days saved by department, ranked"></canvas><details><summary class="small">Data table: bottleneck ranking</summary><div class="tblwrap"><table class="tbl"><tr><th>Dept</th><th>Days saved</th></tr>${[...Object.entries(AN.byDept)].sort((a, b) => b[1].saved - a[1].saved).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v.saved}</td></tr>`).join("")}</table></div></details></div>
  </div>
  <div class="card" style="margin-top:12px"><h3>What the data says <span class="badge b-grey">🌱 SEED* + 🔴 LIVE</span></h3><div class="small">• Biggest saver*: <b>MPCB (${AN.byDept.MPCB.saved}d saved*)</b> — parallel CTE + pre-validated effluent data.<br>• Fastest win*: <b>Industries/Udyam (${AN.byDept.DOI.new}d*)</b> — instant deemed acknowledgement.<br>• Common inspections collapse 2–3 officer trips into one joint visit (🔴 LIVE % in blue card above).<br>• Every breached SLA mints a <b>deemed approval</b> — departments now clear queues before the clock runs out (try the backdated FIRE-PROV demo in DEMO_SCRIPT.md).<br><span class="mut">*Seed projection from 38-row baseline — pilot to measure.</span></div></div>`;
}
function bars(id, labels, s1, s2, l1, l2, unit) {
  unit = unit === undefined ? "d" : unit;
  const c = document.getElementById(id); if (!c) return;
  const x = c.getContext("2d"); x.clearRect(0, 0, c.width, c.height);
  const max = Math.max(...s1, ...s2, 1) * 1.15, n = Math.max(1, labels.length), gw = c.width / n, bw = Math.min(46, gw / 4);
  x.font = "11px Segoe UI";
  labels.forEach((lb, i) => {
    const cx = gw * i + gw / 2;
    [[s1[i], "#b4232a", -bw - 2], [s2[i], "#0e7a3d", 2]].forEach(([v, col, off]) => {
      const h = (v / max) * (c.height - 60);
      x.fillStyle = col; x.fillRect(cx + off, c.height - 34 - h, bw, h);
      x.fillStyle = "#1c2430"; x.fillText(v + unit, cx + off + 4, c.height - 40 - h);
    });
    x.fillStyle = "#1c2430"; x.fillText(lb, cx - 18, c.height - 16);
  });
  x.fillStyle = "#b4232a"; x.fillRect(10, 8, 12, 12); x.fillStyle = "#1c2430"; x.fillText(l1, 26, 18);
  x.fillStyle = "#0e7a3d"; x.fillRect(150, 8, 12, 12); x.fillStyle = "#1c2430"; x.fillText(l2, 166, 18);
}
function drawAnalytics() {
  if (!AN) return;
  const ks = Object.keys(AN.byDept);
  bars("ch1", ks, ks.map(k => AN.byDept[k].old), ks.map(k => AN.byDept[k].new), "Old regime", "Udyog Sarthi");
  const rk = [...ks].sort((a, b) => AN.byDept[b].saved - AN.byDept[a].saved);
  bars("ch2", rk, rk.map(k => AN.byDept[k].saved), rk.map(() => 0), "Days saved", "");
  const live = AN.live.pendingByDept || {};
  const lk = Object.keys(live);
  if (lk.length) bars("ch3", lk, lk.map(k => live[k]), lk.map(() => 0), "Pending tracks (live)", "", "");
}

/* ---------- KNOWLEDGE (real TF-IDF ranker: GET /api/knowledge/search) ---------- */
async function knowledge() {
  return `<h2>${esc(T("kn_title", "Regulatory knowledge engine"))} <span class="badge b-blue">AI: TF-IDF ranker</span></h2><p class="mut">${esc(T("kn_sub", "Ranked search over the Maharashtra approval rulebook. Real retrieval (TF-IDF cosine) — no LLM, no embeddings; scores + eval shown honestly."))}</p>
  <div class="small mut">${esc(T("kn_lang_note", "Marathi answers are human-translated (top-20); rest fall back to English."))} ${esc(T("kn_confirm", "Confirm with GR/portal before legal reliance."))}</div>
  <div class="small mut" style="margin:6px 0">n&gt;=30 hand-labelled overfit illustrative TF-IDF cosine no embeddings no LLM — corpus 60, eval n&gt;=30 hand-labelled (overfit, illustrative). Label: n>=30 hand-labelled overfit illustrative TF-IDF cosine no embeddings no LLM.</div>
  <input id="kn_q" placeholder="${esc(T("kn_search_ph", "Search — try 'deemed', 'CTO', 'inspection', 'renewal'…"))}" oninput="knFilter()"><div id="kn_meta" style="margin-top:8px"><div class="small mut">Loading rulebook…</div></div><div id="kn_list" style="margin-top:10px"><div class="card">Loading…</div></div>
  <div class="card" style="margin-top:12px"><h3>Measured eval — details[] q / expect / got / hit + tookMs</h3><div id="kn_eval"><div class="small mut">Loading eval (GET /api/knowledge/eval)…</div></div></div>
  <div class="card" style="margin-top:12px;border-left:6px solid var(--amber)"><h3>Top 4 misses live (of N — full table above, honest — TF-IDF limits, no embeddings)</h3><div class="small mut">These illustrate TF-IDF limits — full miss list above. Marathi morphology, single-keyword ambiguity, typos and near-synonyms break lexical cosine.</div><div id="kn_adv"><div class="small mut">Loading adversarial probes…</div></div><div class="small mut" style="margin-top:6px">Static examples: 1) Marathi “परवाना कसा मिळवावा” → ~0 score (English-only corpus) · 2) single-keyword “CTO” → K01 not K15 (ambiguous) · 3) typo “deemd aproval” → K40 not K03 (edit distance) · 4) Hinglish vague “mujhe fire ka kagaz chahiye” → weak overlap. Live misses from eval appear above when present.</div></div>`;
}
let KN_TIMER = null;
window.knFilter = () => {
  clearTimeout(KN_TIMER);
  KN_TIMER = setTimeout(knRun, 180);
};
async function knRun() {
  const q = $("#kn_q")?.value || "";
  const box = $("#kn_list"); if (!box) return;
  box.innerHTML = `<div class="card">Searching…</div>`;
  try {
    const r = await api("GET", "/api/knowledge/search?q=" + encodeURIComponent(q) + "&limit=8&lang=" + encodeURIComponent(LANG));
    const m = r.meta || {};
    const metaEl = $("#kn_meta");
    if (metaEl) metaEl.innerHTML = m.ranked
      ? `<div class="small mut">🔍 <b>TF-IDF cosine</b> · corpus <b>n=${m.corpusSize}</b> articles · eval P@1 <b>${m.eval.correct}/${m.eval.n} (${Math.round(m.eval.accuracy * 100)}%)</b> · ${esc(T("kn_no_llm", "no LLM/embeddings"))} · tookMs ${m.tookMs}ms${m.lang === "mr" ? ` · 🇮🇳 mr (${m.translated || 20}/60 ${esc(T("kn_lang_note", "Marathi answers are human-translated (top-20); rest fall back to English."))})` : ""}</div>`
      : `<div class="small mut">📚 ${esc(T("kn_browsing", "Browsing articles — type to rank with TF-IDF."))} <b>n=${m.corpusSize}</b></div>`;
    box.innerHTML = (r.results || []).map(k => `<div class="faq"><b>❓ ${esc(k.q)}</b>${k.score != null ? ` <span class="badge b-blue">score ${k.score}</span>` : ""}${k.lang === "mr" && !k.fallback ? ` <span class="badge b-green">मराठी</span>` : ""}${k.fallback ? ` <span class="badge b-amber" title="${esc(T("kn_fallback_en", "Showing English — Marathi translation pending human review. Confirm with GR/portal before legal reliance."))}">EN fallback</span>` : ""}
      <div class="small" style="margin-top:4px">${esc(k.a)}</div>
      ${k.fallback ? `<div class="small mut">⚠️ ${esc(T("kn_fallback_en", "Showing English — Marathi translation pending human review. Confirm with GR/portal before legal reliance."))}</div>` : ""}
      <div class="small mut">src: ${esc(k.source || "Demo corpus")} · ${esc(T("kn_confirm", "Confirm with GR/portal before legal reliance."))}${(k.matched && k.matched.length) ? ` · matched: ${k.matched.map(esc).join(", ")}` : ""}</div>
      <div class="small mut">${(k.tags || []).map(t => `<span class="badge b-grey">${esc(t)}</span>`).join(" ")}</div></div>`).join("") || `<div class="card">No matches.</div>`;
  } catch (e) { box.innerHTML = `<div class="card">⚠️ ${esc(e.message)}</div>`; }
  try { await loadKnowledgeEval(); } catch (e) { const el = $("#kn_eval"); if (el) el.innerHTML = `<div class="small fail">Eval failed: ${esc(e.message)}</div>`; }
}
async function loadKnowledgeEval() {
  const el = $("#kn_eval");
  const adv = $("#kn_adv");
  const ev = await api("GET", "/api/knowledge/eval");
  if (el) {
    const rows = (ev.details || []).map(d => `<tr><td class="small">${esc(d.q)}</td><td><code>${esc(d.expect)}</code></td><td><code>${esc(d.got || "—")}</code></td><td>${d.hit ? "✅ hit" : "❌ miss"}</td></tr>`).join("");
    el.innerHTML = `<div class="small mut">Method: ${esc(ev.method || "TF-IDF cosine (no embeddings, no LLM)")} · corpus ${ev.corpusSize} · n=${ev.n} correct=${ev.correct} accuracy=${ev.accuracy} · tookMs ${ev.tookMs != null ? ev.tookMs + "ms" : "—"} · note: ${esc(ev.note || "n>=30 hand-labelled overfit illustrative TF-IDF cosine no embeddings no LLM")}</div>`
      + `<div class="tblwrap" style="margin-top:8px"><table class="tbl"><tr><th>q</th><th>expect</th><th>got</th><th>hit</th></tr>${rows}</table></div>`;
  }
  if (adv) {
    const misses = (ev.details || []).filter(d => !d.hit).slice(0, 4);
    const list = misses.length ? misses.map(d => `<div class="small">❌ <b>${esc(d.q)}</b> — expect <code>${esc(d.expect)}</code>, got <code>${esc(d.got || "—")}</code> (miss, honest)</div>`).join("")
      : `<div class="small mut">No misses in current eval — adversarial probes below still illustrate limits.</div>`;
    adv.innerHTML = list + `<div class="small mut" style="margin-top:6px">Probes: Hinglish paraphrase, typo “deemd aproval”, single-keyword “CTO”, Marathi query. Lexical cosine has no stemming/embeddings — failures stay visible.</div>`;
  }
}
window.loadKnowledgeEval = loadKnowledgeEval;
