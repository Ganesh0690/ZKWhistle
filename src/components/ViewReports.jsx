import React, { useState } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { Transaction, WalletAdapterNetwork } from "@demox-labs/aleo-wallet-adapter-base";
import ConnectScreen from "./ConnectScreen";
import { PROGRAM_ID, getOrganization, getReport, checkMember, SEVERITY_MAP, STATUS_MAP, formatAddress, cleanVal } from "../utils/aleo";
import { getOrgs, getReports, getMembers, addActivityEntry } from "../utils/storage";
import TxPoll from "../utils/TxPoll";

function parseSev(v) { const k = cleanVal(String(v||"")).replace("u8",""); return SEVERITY_MAP[k] || { label: k, cls: "low" }; }
function parseStat(v) { const k = cleanVal(String(v||"")).replace("u8",""); return STATUS_MAP[k] || { label: k, cls: "open" }; }
function parseU64(v) { return cleanVal(String(v||"")).replace("u64",""); }

export default function ViewReports() {
  const { publicKey, connected, requestTransaction } = useWallet();
  const [mode, setMode] = useState("report");
  const [searchId, setSearchId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updateReportId, setUpdateReportId] = useState("");
  const [updateOrgId, setUpdateOrgId] = useState("");
  const [updateStatus, setUpdateStatus] = useState("1");
  const [updateTx, setUpdateTx] = useState(null);
  const [updating, setUpdating] = useState(false);

  const savedOrgs = getOrgs();
  const savedReports = getReports();
  const savedMembers = getMembers();

  if (!connected) return <ConnectScreen />;

  async function handleSearch(e) {
    e.preventDefault();
    setError(null); setResult(null);
    let key = searchId.trim();
    if (!key) { setError("Enter an ID to search."); return; }
    if (!key.endsWith("field")) key += "field";
    setLoading(true);
    try {
      if (mode === "report") {
        const data = await getReport(key);
        if (!data || typeof data === "string") { setError("Report not found."); } else { setResult({ type: "report", data, key }); }
      } else if (mode === "org") {
        const data = await getOrganization(key);
        if (!data || typeof data === "string") { setError("Organization not found."); } else { setResult({ type: "org", data, key }); }
      } else {
        const data = await checkMember(key);
        setResult({ type: "member", data, key });
      }
    } catch (err) { setError("Lookup failed: " + err.message); }
    finally { setLoading(false); }
  }

  async function handleUpdateStatus(e) {
    e.preventDefault();
    setError(null); setUpdateTx(null);
    let rid = updateReportId.trim(); if (!rid) { setError("Enter Report ID."); return; }
    if (!rid.endsWith("field")) rid += "field";
    let oid = updateOrgId.trim(); if (!oid) { setError("Enter Org ID."); return; }
    if (!oid.endsWith("field")) oid += "field";
    setUpdating(true);
    try {
      const tx = Transaction.createTransaction(publicKey, WalletAdapterNetwork.TestnetBeta, PROGRAM_ID, "update_report_status", [oid, rid, updateStatus + "u8"], 500_000, false);
      const txId = await requestTransaction(tx);
      const id = typeof txId === "object" ? txId.transactionId : txId;
      addActivityEntry("status_updated", `Report status updated to ${["Open","Reviewing","Resolved","Dismissed"][updateStatus]}`, rid);
      setUpdateTx(id);
    } catch (err) { setError(err.message || "Failed."); }
    finally { setUpdating(false); }
  }

  return (
    <div>
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div><h2 className="section-title">View Reports & Organizations</h2><p className="section-desc">Look up on-chain data. All queries read public mappings.</p></div>
      </div>

      <div className="tabs">
        <button className={`tab${mode === "report" ? " active" : ""}`} onClick={() => { setMode("report"); setResult(null); setError(null); setSearchId(""); }}>Lookup Report</button>
        <button className={`tab${mode === "org" ? " active" : ""}`} onClick={() => { setMode("org"); setResult(null); setError(null); setSearchId(""); }}>Lookup Org</button>
        <button className={`tab${mode === "member" ? " active" : ""}`} onClick={() => { setMode("member"); setResult(null); setError(null); setSearchId(""); }}>Check Member</button>
        <button className={`tab${mode === "update" ? " active" : ""}`} onClick={() => { setMode("update"); setResult(null); setError(null); }}>Update Status</button>
      </div>

      {mode !== "update" && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">{mode === "report" ? "Report Lookup" : mode === "org" ? "Organization Lookup" : "Member Check"}</span></div>
          <div className="card-body">
            <form onSubmit={handleSearch}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">{mode === "report" ? "Report ID" : mode === "org" ? "Organization ID" : "Member Hash"}</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input className="form-input" style={{ flex: 1 }} value={searchId} onChange={(e) => { setSearchId(e.target.value); setError(null); }} placeholder={mode === "member" ? "BHP256 hash" : "e.g. 123456789field"} spellCheck={false} />
                    <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? <span className="spinner"></span> : "Search"}</button>
                  </div>
                  {/* Quick fill from saved data */}
                  {mode === "report" && savedReports.length > 0 && (
                    <div className="quick-fill">{savedReports.map((r, i) => <button type="button" key={i} className="quick-fill-btn" onClick={() => setSearchId(r.reportId)}>{r.content ? r.content.slice(0,20) + "..." : r.reportId.slice(0,15) + "..."}</button>)}</div>
                  )}
                  {mode === "org" && savedOrgs.length > 0 && (
                    <div className="quick-fill">{savedOrgs.map((o, i) => <button type="button" key={i} className="quick-fill-btn" onClick={() => setSearchId(o.orgId)}>{o.name}</button>)}</div>
                  )}
                  {mode === "member" && savedMembers.length > 0 && (
                    <div className="quick-fill">{savedMembers.filter(m => m.memberHash).map((m, i) => <button type="button" key={i} className="quick-fill-btn" onClick={() => setSearchId(m.memberHash)}>Hash: {m.memberHash.slice(0,20)}...</button>)}</div>
                  )}
                </div>
              </div>
            </form>
            {error && <div className="result-banner error" style={{ marginTop: 14 }}><div className="result-banner-title" style={{ color: "var(--red)" }}>Error</div><div className="result-banner-detail">{error}</div></div>}
            {result && result.type === "report" && (
              <div style={{ marginTop: 18 }}>
                <table><tbody>
                  <tr><td style={{ color: "var(--text-tertiary)", width: 140 }}>Report ID</td><td className="mono">{result.key}</td></tr>
                  <tr><td style={{ color: "var(--text-tertiary)" }}>Org ID</td><td className="mono">{cleanVal(result.data.org_id)}</td></tr>
                  <tr><td style={{ color: "var(--text-tertiary)" }}>Content Hash</td><td className="mono" style={{ wordBreak: "break-all", fontSize: 11 }}>{cleanVal(result.data.content_hash)}</td></tr>
                  <tr><td style={{ color: "var(--text-tertiary)" }}>Severity</td><td><span className={`severity-badge ${parseSev(result.data.severity).cls}`}>{parseSev(result.data.severity).label}</span></td></tr>
                  <tr><td style={{ color: "var(--text-tertiary)" }}>Status</td><td><span className={`status-badge ${parseStat(result.data.status).cls}`}><span className="status-dot"></span> {parseStat(result.data.status).label}</span></td></tr>
                  <tr><td style={{ color: "var(--text-tertiary)" }}>Report Index</td><td className="mono">{parseU64(result.data.report_index)}</td></tr>
                </tbody></table>
              </div>
            )}
            {result && result.type === "org" && (
              <div style={{ marginTop: 18 }}>
                <table><tbody>
                  <tr><td style={{ color: "var(--text-tertiary)", width: 140 }}>Org ID</td><td className="mono">{result.key}</td></tr>
                  <tr><td style={{ color: "var(--text-tertiary)" }}>Name Hash</td><td className="mono" style={{ wordBreak: "break-all" }}>{cleanVal(result.data.name_hash)}</td></tr>
                  <tr><td style={{ color: "var(--text-tertiary)" }}>Admin</td><td className="mono">{formatAddress(cleanVal(result.data.admin))}</td></tr>
                  <tr><td style={{ color: "var(--text-tertiary)" }}>Members</td><td className="mono">{parseU64(result.data.member_count)}</td></tr>
                  <tr><td style={{ color: "var(--text-tertiary)" }}>Reports</td><td className="mono">{parseU64(result.data.report_count)}</td></tr>
                  <tr><td style={{ color: "var(--text-tertiary)" }}>Active</td><td><span className={`status-badge ${String(result.data.is_active).includes("true") ? "open" : "dismissed"}`}><span className="status-dot"></span> {String(result.data.is_active).includes("true") ? "Active" : "Inactive"}</span></td></tr>
                </tbody></table>
              </div>
            )}
            {result && result.type === "member" && (
              <div className={`result-banner ${result.data ? "success" : "error"}`} style={{ marginTop: 14 }}>
                <div className="result-banner-title" style={{ color: result.data ? "var(--green)" : "var(--red)" }}>{result.data ? "Verified Member" : "Not a Member"}</div>
                <div className="result-banner-detail">{result.data ? "This hash belongs to a registered member." : "This hash is not registered."}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {mode === "update" && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">Update Report Status (Admin)</span></div>
          <div className="card-body">
            <form onSubmit={handleUpdateStatus}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Organization ID</label>
                  <input className="form-input" value={updateOrgId} onChange={(e) => { setUpdateOrgId(e.target.value); setError(null); }} placeholder="Your org ID" spellCheck={false} />
                  {savedOrgs.length > 0 && <div className="quick-fill">{savedOrgs.map((o, i) => <button type="button" key={i} className="quick-fill-btn" onClick={() => setUpdateOrgId(o.orgId)}>{o.name}</button>)}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Report ID</label>
                  <input className="form-input" value={updateReportId} onChange={(e) => { setUpdateReportId(e.target.value); setError(null); }} placeholder="Report to update" spellCheck={false} />
                  {savedReports.length > 0 && <div className="quick-fill">{savedReports.map((r, i) => <button type="button" key={i} className="quick-fill-btn" onClick={() => setUpdateReportId(r.reportId)}>{r.content ? r.content.slice(0,15) + "..." : r.reportId.slice(0,12)}</button>)}</div>}
                </div>
                <div className="form-group full-width">
                  <label className="form-label">New Status</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                    {[{v:"0",l:"Open"},{v:"1",l:"Reviewing"},{v:"2",l:"Resolved"},{v:"3",l:"Dismissed"}].map(s => <button key={s.v} type="button" className={`btn ${updateStatus===s.v?"btn-primary":"btn-ghost"}`} onClick={() => setUpdateStatus(s.v)}>{s.l}</button>)}
                  </div>
                </div>
                <div className="form-actions"><button className="btn btn-primary btn-lg" type="submit" disabled={updating}>{updating ? <><span className="spinner"></span> Updating...</> : "Update Status"}</button></div>
              </div>
            </form>
            {error && <div className="result-banner error"><div className="result-banner-title" style={{ color: "var(--red)" }}>Error</div><div className="result-banner-detail">{error}</div></div>}
            {updateTx && (<><div className="result-banner success"><div className="result-banner-title" style={{ color: "var(--green)" }}>Status Updated</div><div className="result-banner-detail">TX: {updateTx}</div></div><TxPoll txId={updateTx} /></>)}
          </div>
        </div>
      )}

      {/* Saved reports list */}
      {savedReports.length > 0 && mode === "report" && (
        <div className="saved-section">
          <div className="saved-title">Your Saved Reports</div>
          <div className="saved-list">
            {savedReports.map((r, i) => (
              <div key={i} className="saved-item" onClick={() => { setSearchId(r.reportId); }}>
                <div>
                  <div className="saved-item-label">{r.content || "Report"} <span className={`severity-badge ${["low","medium","high","critical"][r.severity]}`} style={{ marginLeft: 8 }}>{["Low","Medium","High","Critical"][r.severity]}</span></div>
                  <div className="saved-item-id">{r.reportId}</div>
                </div>
                <div className="saved-item-use">Load</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
