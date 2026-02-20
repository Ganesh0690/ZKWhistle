const API_BASE = "https://api.explorer.provable.com/v1/testnet";
const PROGRAM_ID = "zkwhistle_kumar_v1.aleo";

function parseAleoStruct(raw) {
  if (typeof raw !== "string") return raw;
  let s = raw.replace(/^"|"$/g, "").replace(/\\n/g, " ").replace(/[\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
  const structMatch = s.match(/^\{(.*)\}$/);
  if (!structMatch) return s;
  const obj = {};
  const pairs = structMatch[1].trim().split(",");
  for (const pair of pairs) {
    const colonIdx = pair.indexOf(":");
    if (colonIdx === -1) continue;
    const key = pair.slice(0, colonIdx).trim();
    const val = pair.slice(colonIdx + 1).trim();
    if (key) obj[key] = val;
  }
  return Object.keys(obj).length > 0 ? obj : s;
}

export async function getMappingValue(mapping, key) {
  try {
    const res = await fetch(`${API_BASE}/program/${PROGRAM_ID}/mapping/${mapping}/${key}`);
    if (!res.ok) return null;
    const text = await res.text();
    let cleaned = text.trim();
    try { cleaned = JSON.parse(cleaned); } catch {}
    if (typeof cleaned === "string") return parseAleoStruct(cleaned);
    return cleaned;
  } catch { return null; }
}

export async function getOrgCount() {
  const val = await getMappingValue("org_count", "0u8");
  if (!val) return 0;
  return parseInt(String(val).replace("u64", ""));
}

export async function getTotalReports() {
  const val = await getMappingValue("total_reports", "0u8");
  if (!val) return 0;
  return parseInt(String(val).replace("u64", ""));
}

export async function getOrganization(orgId) { return await getMappingValue("organizations", orgId); }
export async function getReport(reportId) { return await getMappingValue("reports", reportId); }

export async function checkMember(memberHash) {
  const val = await getMappingValue("members", memberHash);
  return val === true || val === "true" || String(val).includes("true");
}

export async function getBlockHeight() {
  try { const res = await fetch(`${API_BASE}/latest/height`); if (!res.ok) return 0; return await res.json(); } catch { return 0; }
}

export function formatAddress(addr) {
  if (!addr || addr.length <= 16) return addr || "";
  return addr.slice(0, 10) + "..." + addr.slice(-6);
}

export function cleanVal(val) {
  if (!val) return "";
  return String(val).replace(/\.public|\.private/g, "");
}

export const SEVERITY_MAP = { "0": { label: "Low", cls: "low" }, "1": { label: "Medium", cls: "medium" }, "2": { label: "High", cls: "high" }, "3": { label: "Critical", cls: "critical" } };
export const STATUS_MAP = { "0": { label: "Open", cls: "open" }, "1": { label: "Reviewing", cls: "reviewing" }, "2": { label: "Resolved", cls: "resolved" }, "3": { label: "Dismissed", cls: "dismissed" } };

export { PROGRAM_ID, API_BASE };
