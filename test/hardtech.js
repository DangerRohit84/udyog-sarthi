// Hard-tech probes — 5 plain-node fetch asserts, no framework.
// Run: node test/hardtech.js  (expects server on 127.0.0.1:3000; start with `npm start` first)
// 1 reset-demo1 200, 2 bare-reset 401, 3 checklist {} 400,
// 4 login->Bearer->officer-approve 200, 5 eval parsed n>=30.
const BASE = process.env.BASE || "http://127.0.0.1:3000";
function ok(cond, msg) {
  if (!cond) { console.error("FAIL: " + msg); process.exit(1); }
  console.log("PASS: " + msg);
}
async function main() {
  // 1 reset-demo1 200
  let r = await fetch(BASE + "/api/reset?demo=1", { method: "POST" });
  let j = await r.json().catch(() => ({}));
  ok(r.status === 200 && j.ok === true, "1 reset-demo1 200 ok:true (got " + r.status + ")");
  // 2 bare-reset 401 (no query, no token)
  r = await fetch(BASE + "/api/reset", { method: "POST" });
  ok(r.status === 401, "2 bare-reset 401 (got " + r.status + ")");
  // 3 checklist {} 400
  r = await fetch(BASE + "/api/checklist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
  j = await r.json().catch(() => ({}));
  ok(r.status === 400, "3 checklist {} 400 (got " + r.status + ")");
  // 4 login->Bearer->officer-approve 200
  r = await fetch(BASE + "/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "officer@maharashtra.gov.in", password: "officer123" }) });
  j = await r.json().catch(() => ({}));
  ok(r.status === 200 && j.token, "4a officer login 200 token (got " + r.status + ")");
  const token = j.token;
  r = await fetch(BASE + "/api/applications", { headers: { Authorization: "Bearer " + token } });
  const apps = await r.json().catch(() => []);
  ok(r.status === 200 && Array.isArray(apps) && apps.length > 0, "4b Bearer GET applications 200 non-empty (got " + r.status + ")");
  let picked = null;
  for (const a of apps) {
    for (const t of (a.tracks || [])) {
      if (["Applied", "Under review", "Inspection scheduled", "Queried"].includes(t.status)) { picked = { appId: a.id, approvalId: t.approvalId }; break; }
    }
    if (picked) break;
  }
  ok(picked, "4c found approvable track (non-Locked non-terminal)");
  r = await fetch(BASE + "/api/applications/" + picked.appId + "/track", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ approvalId: picked.approvalId, action: "approve", remarks: "Probe approve", officer: "Probe" }) });
  j = await r.json().catch(() => ({}));
  ok(r.status === 200, "4d officer-approve 200 " + picked.appId + "/" + picked.approvalId + " (got " + r.status + ")");
  // 5 eval parsed n>=30
  r = await fetch(BASE + "/api/knowledge/eval");
  j = await r.json().catch(() => null);
  ok(r.status === 200 && j && typeof j.n === "number" && Array.isArray(j.details), "5 eval parsed 200 with n+details (got " + r.status + ")");
  ok(j.n >= 30, "5b eval n>=30 (got n=" + j.n + " correct=" + j.correct + " acc=" + j.accuracy + ")");
  ok(j.details.every(d => d.q && d.expect && ("got" in d) && ("hit" in d)), "5c eval details[] q/expect/got/hit present");
  console.log("ALL 5 HARD-TECH PROBES PASS n=" + j.n + " acc=" + j.accuracy);
}
main().catch(e => { console.error("FAIL: " + (e && e.message || e)); process.exit(1); });
