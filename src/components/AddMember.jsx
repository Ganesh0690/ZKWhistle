import React, { useState } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { Transaction, WalletAdapterNetwork } from "@demox-labs/aleo-wallet-adapter-base";
import ConnectScreen from "./ConnectScreen";
import { PROGRAM_ID } from "../utils/aleo";
import { saveMember, getOrgs, getMembers } from "../utils/storage";
import TxPoll from "../utils/TxPoll";
export default function AddMember() {
  const { publicKey, connected, requestTransaction } = useWallet();
  const [orgId, setOrgId] = useState("");
  const [secret, setSecret] = useState("");
  const [memberHash, setMemberHash] = useState("");
  const [txStatus, setTxStatus] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState("join");
  const savedOrgs = getOrgs();
  const savedMembers = getMembers();
  if (!connected) return <ConnectScreen />;
  function generateSecret() {
    const rand = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    setSecret(rand.toString() + "field");
  }
  async function handleJoin(e) {
    e.preventDefault();
    setError(null); setTxStatus(null);
    let oid = orgId.trim(); if (!oid) { setError("Select or enter Organization ID."); return; }
    if (!oid.endsWith("field")) oid += "field";
    let s = secret.trim(); if (!s) { setError("Generate or enter a secret."); return; }
    if (!s.endsWith("field")) s += "field";
    setSubmitting(true);
    try {
      const tx = Transaction.createTransaction(publicKey, WalletAdapterNetwork.TestnetBeta, PROGRAM_ID, "join_org", [oid, s], 500_000, false);
      const txId = await requestTransaction(tx);
      const id = typeof txId === "object" ? txId.transactionId : txId;
      saveMember({ memberHash: "pending", secret: s, orgId: oid, txId: id });
      setTxStatus({ id, type: "join" });
    } catch (err) { console.error(err); setError(err.message || "Failed."); }
    finally { setSubmitting(false); }
  }
  async function handleAddByHash(e) {
    e.preventDefault();
    setError(null); setTxStatus(null);
    let oid = orgId.trim(); if (!oid) { setError("Select or enter Organization ID."); return; }
    if (!oid.endsWith("field")) oid += "field";
    let hash = memberHash.trim(); if (!hash) { setError("Enter member hash."); return; }
    if (!hash.endsWith("field")) hash += "field";
    setSubmitting(true);
    try {
      const tx = Transaction.createTransaction(publicKey, WalletAdapterNetwork.TestnetBeta, PROGRAM_ID, "add_member", [oid, hash], 500_000, false);
      const txId = await requestTransaction(tx);
      const id = typeof txId === "object" ? txId.transactionId : txId;
      saveMember({ memberHash: hash, secret: null, orgId: oid, txId: id });
      setTxStatus({ id, type: "add", hash });
    } catch (err) { console.error(err); setError(err.message || "Failed."); }
    finally { setSubmitting(false); }
  }
  return (
    <div>
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div><h2 className="section-title">Manage Members</h2><p className="section-desc">Join an organization or add members as admin.</p></div>
      </div>
      <div className="tabs">
        <button className={"tab" + (mode === "join" ? " active" : "")} onClick={() => { setMode("join"); setError(null); setTxStatus(null); }}>Join Organization</button>
        <button className={"tab" + (mode === "admin" ? " active" : "")} onClick={() => { setMode("admin"); setError(null); setTxStatus(null); }}>Add Member (Admin)</button>
      </div>
      {mode === "join" && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">Join as Member (One Click)</span><span className="severity-badge medium"><span className="status-dot"></span>Private</span></div>
          <div className="card-body">
            <form onSubmit={handleJoin}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Organization ID</label>
                  <input className="form-input" value={orgId} onChange={(e) => { setOrgId(e.target.value); setError(null); }} placeholder="Select from saved or enter" spellCheck={false} />
                  {savedOrgs.length > 0 && (<div className="quick-fill">{savedOrgs.map((o, i) => <button type="button" key={i} className="quick-fill-btn" onClick={() => setOrgId(o.orgId)}>{o.name}: {o.orgId.slice(0, 15)}...</button>)}</div>)}
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Your Private Secret</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input className="form-input" style={{ flex: 1 }} value={secret} onChange={(e) => { setSecret(e.target.value); setError(null); }} placeholder="Click Generate" spellCheck={false} />
                    <button type="button" className="btn btn-secondary" onClick={generateSecret}>Generate</button>
                  </div>
                  <span className="form-hint" style={{ color: "var(--red)" }}>Save this secret! You need it to submit reports. It is NEVER stored on-chain.</span>
                </div>
                <div className="form-actions"><button className="btn btn-primary btn-lg" type="submit" disabled={submitting} style={{ width: "100%" }}>{submitting ? <><span className="spinner"></span> Joining...</> : "Join Organization (ZK Hashes Your Secret On-Chain)"}</button></div>
              </div>
            </form>
            {error && <div className="result-banner error"><div className="result-banner-title" style={{ color: "var(--red)" }}>Error</div><div className="result-banner-detail">{error}</div></div>}
            {txStatus && txStatus.type === "join" && (<><div className="result-banner success"><div className="result-banner-title" style={{ color: "var(--green)" }}>Joined Organization</div><div className="result-banner-detail">TX: {txStatus.id}<br/>Your secret was hashed by the ZK circuit and added to the membership list.<br/>Your secret: <strong>{secret}</strong><br/>Save it! You need it to submit reports.</div></div><TxPoll txId={txStatus.id} /></>)}
          </div>
        </div>
      )}
      {mode === "admin" && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">Add Member by Hash (Admin)</span></div>
          <div className="card-body">
            <form onSubmit={handleAddByHash}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Organization ID</label>
                  <input className="form-input" value={orgId} onChange={(e) => { setOrgId(e.target.value); setError(null); }} placeholder="Select from saved or enter" spellCheck={false} />
                  {savedOrgs.length > 0 && (<div className="quick-fill">{savedOrgs.map((o, i) => <button type="button" key={i} className="quick-fill-btn" onClick={() => setOrgId(o.orgId)}>{o.name}: {o.orgId.slice(0, 15)}...</button>)}</div>)}
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Member Hash</label>
                  <input className="form-input" value={memberHash} onChange={(e) => { setMemberHash(e.target.value); setError(null); }} placeholder="BHP256 hash of member's secret" spellCheck={false} />
                  <span className="form-hint">For advanced use. Most members should use the Join tab instead.</span>
                </div>
                <div className="form-actions"><button className="btn btn-primary btn-lg" type="submit" disabled={submitting}>{submitting ? <><span className="spinner"></span> Adding...</> : "Add Member"}</button></div>
              </div>
            </form>
            {error && <div className="result-banner error"><div className="result-banner-title" style={{ color: "var(--red)" }}>Error</div><div className="result-banner-detail">{error}</div></div>}
            {txStatus && txStatus.type === "add" && (<><div className="result-banner success"><div className="result-banner-title" style={{ color: "var(--green)" }}>Member Added</div><div className="result-banner-detail">Hash: {txStatus.hash}<br/>TX: {txStatus.id}</div></div><TxPoll txId={txStatus.id} /></>)}
          </div>
        </div>
      )}
      {savedMembers.length > 0 && (
        <div className="saved-section">
          <div className="saved-title">Saved Members</div>
          <div className="saved-list">
            {savedMembers.map((m, i) => (
              <div key={i} className="saved-item" onClick={() => navigator.clipboard.writeText(m.secret || m.memberHash || "")}>
                <div>
                  <div className="saved-item-label">{m.secret ? "Secret: " + m.secret.slice(0, 20) + "..." : "Hash only"}</div>
                  <div className="saved-item-id">{m.orgId ? "Org: " + m.orgId.slice(0, 15) + "..." : ""}</div>
                </div>
                <div className="saved-item-use">Copy</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="info-card" style={{ marginTop: 20 }}>
        <strong>How Join works:</strong> You enter a secret. The ZK circuit hashes it with BHP256 on-chain. Only the hash is stored in the membership mapping. Your secret never appears on-chain. When you submit a report later, you enter the same secret — the circuit hashes it again and verifies the match. No terminal, no copy-pasting hashes.
      </div>
    </div>
  );
}
