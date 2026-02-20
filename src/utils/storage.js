const STORAGE_KEY = "zkwhistle_data";

function getAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { orgs: [], reports: [], members: [], activity: [] };
    return JSON.parse(raw);
  } catch { return { orgs: [], reports: [], members: [], activity: [] }; }
}

function saveAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveOrg({ orgId, name, adminAddress, txId }) {
  const data = getAll();
  if (!data.orgs.find(o => o.orgId === orgId)) {
    data.orgs.push({ orgId, name, adminAddress, txId, createdAt: Date.now() });
    addActivity(data, "org_registered", `Organization "${name}" registered`, orgId);
    saveAll(data);
  }
}

export function saveMember({ memberHash, secret, orgId, txId }) {
  const data = getAll();
  if (!data.members.find(m => m.memberHash === memberHash && m.orgId === orgId)) {
    data.members.push({ memberHash, secret, orgId, txId, createdAt: Date.now() });
    addActivity(data, "member_added", `Member added to org ${orgId.slice(0, 12)}...`, orgId);
    saveAll(data);
  }
}

export function saveReport({ reportId, orgId, severity, txId, content }) {
  const data = getAll();
  if (!data.reports.find(r => r.reportId === reportId)) {
    data.reports.push({ reportId, orgId, severity, txId, content, createdAt: Date.now(), status: "Open" });
    addActivity(data, "report_submitted", `Anonymous report submitted (${["Low","Medium","High","Critical"][severity] || "?"})`, reportId);
    saveAll(data);
  }
}

export function saveSecret({ secret, memberHash }) {
  const data = getAll();
  const existing = data.members.find(m => m.memberHash === memberHash);
  if (existing) { existing.secret = secret; }
  else { data.members.push({ memberHash, secret, orgId: null, txId: null, createdAt: Date.now() }); }
  saveAll(data);
}

function addActivity(data, type, message, refId) {
  data.activity.unshift({ type, message, refId, timestamp: Date.now() });
  if (data.activity.length > 20) data.activity = data.activity.slice(0, 20);
}

export function addActivityEntry(type, message, refId) {
  const data = getAll();
  addActivity(data, type, message, refId);
  saveAll(data);
}

export function getOrgs() { return getAll().orgs; }
export function getReports() { return getAll().reports; }
export function getMembers() { return getAll().members; }
export function getActivity() { return getAll().activity; }
export function getMySecret(orgId) {
  const members = getAll().members;
  const m = members.find(m => m.orgId === orgId && m.secret);
  return m ? m.secret : null;
}
export function getLatestOrgId() {
  const orgs = getAll().orgs;
  return orgs.length > 0 ? orgs[orgs.length - 1].orgId : "";
}

export function clearAll() {
  localStorage.removeItem(STORAGE_KEY);
}
