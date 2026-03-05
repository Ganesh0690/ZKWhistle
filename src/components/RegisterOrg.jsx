import React, { useState } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import ConnectScreen from "./ConnectScreen";
import { PROGRAM_ID } from "../utils/aleo";
import { saveOrg, getOrgs } from "../utils/storage";
import TxPoll from "../utils/TxPoll";
export default function RegisterOrg() {
  const { address, connected, executeTransaction } = useWallet();
  const [orgName, setOrgName] = useState("");
  const [txStatus, setTxStatus] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const savedOrgs = getOrgs();
  if (!connected) return <ConnectScreen />;
  function nameToField(name) {
    const bytes = new TextEncoder().encode(name.slice(0, 16));
    let hex = "";
    for (const b of bytes) hex += b.toString(16).padStart(2, "0");
    return BigInt("0x" + hex).toString() + "field";
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null); setTxStatus(null);
    if (!orgName.trim()) { setError("Enter an organization name."); return; }
    setSubmitting(true);
    try {
      const nameHash = nameToField(orgName.trim());
      const orgId = Math.floor(Math.random() * 1_000_000_000).toString() + "field";
      const id = await executeTransaction({
        program: PROGRAM_ID,
        function: "register_org",
        inputs: [orgId, nameHash],
        fee: 0.5,
      });
      const txId = typeof id === "object" ? (id.transactionId || id.id || JSON.stringify(id)) : String(id);
      saveOrg({ orgId, name: orgName.trim(), adminAddress: address, txId });
      setTxStatus({ id: txId, orgId, name: orgName.trim() });
      setOrgName("");
    } catch (err) { console.error(err); setError(err.message || "Registration failed."); }
    finally { setSubmitting(false); }
  }
  return (
    <div>
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div><h2 className="section-title">Register Organization</h2><p className="section-desc">Create a new organization. You become the admin.</p></div>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">New Organization</span></div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Organization Name</label>
                <input className="form-input" value={orgName} onChange={(e) => { setOrgName(e.target.value); setError(null); }} placeholder="e.g. Acme Corp, My DAO" maxLength={16} />
                <span className="form-hint">Max 16 chars. Stored as hash.</span>
              </div>
              <div className="form-actions"><button className="btn btn-primary btn-lg" type="submit" disabled={submitting}>{submitting ? <><span className="spinner"></span> Registering...</> : "Register Organization"}</button></div>
            </div>
          </form>
          {error && <div className="result-banner error"><div className="result-banner-title" style={{ color: "var(--red)" }}>Error</div><div className="result-banner-detail">{error}</div></div>}
          {txStatus && (<><div className="result-banner success"><div className="result-banner-title" style={{ color: "var(--green)" }}>Organization Registered</div><div className="result-banner-detail">Org ID: <strong>{txStatus.orgId}</strong><br/>Name: {txStatus.name}<br/>TX: {txStatus.id}<br/>Auto-saved locally.</div></div><TxPoll txId={txStatus.id} /></>)}
        </div>
      </div>
      {savedOrgs.length > 0 && (<div className="saved-section"><div className="saved-title">Your Organizations</div><div className="saved-list">{savedOrgs.map((o, i) => (<div key={i} className="saved-item" onClick={() => navigator.clipboard.writeText(o.orgId)}><div><div className="saved-item-label">{o.name}</div><div className="saved-item-id">{o.orgId}</div></div><div className="saved-item-use">Click to copy</div></div>))}</div></div>)}
    </div>
  );
}
