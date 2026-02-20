import React, { useState } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { Transaction, WalletAdapterNetwork } from "@demox-labs/aleo-wallet-adapter-base";
import ConnectScreen from "./ConnectScreen";
import { PROGRAM_ID } from "../utils/aleo";
import { saveMember, saveSecret, getOrgs, getMembers } from "../utils/storage";
import TxPoll from "../utils/TxPoll";

export default function AddMember() {
  const { publicKey, connected, requestTransaction } = useWallet();
  const [orgId, setOrgId] = useState("");
  const [memberHash, setMemberHash] = useState("");
  const [secret, setSecret] = useState("");
  const [txStatus, setTxStatus] = useState(null);
  const [hashResult, setHashResult] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState("add");
  const savedOrgs = getOrgs();
  const savedMembers = getMembers();

  if (!connected) return <ConnectScreen />;

  function generateSecret() {
    const rand = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    setSecret(rand.toString() + "field");
  }

  async function handleAdd(e) {
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
      setTxStatus({ id, hash });
      setMemberHash("");
    } catch (err) { console.error(err); setError(err.message || "Failed."); }
    finally { setSubmitting(false); }
  }

  async function handleHash(e) {
    e.preventDefault();
    setError(null); setHashResult(null);
    let s = secret.trim(); if (!s) { setError("Enter a secret."); return; }
    if (!s.endsWith("field")) s += "field";
    setSubmitting(true);
    try {
      const tx = Transaction.createTransaction(publicKey, WalletAdapterNetwork.TestnetBeta, PROGRAM_ID, "compute_member_hash", [s], 300_000, false);
      const txId = await requestTransaction(tx);
      const id = typeof txId === "object" ? txId.transactionId : txId;
      setHashResult({ id, secret: s });
    } catch (err) { console.error(err); setError(err.message || "Failed."); }
    finally { setSubmitting(false); }
  }

  return (
    <div>
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div><h2 className="section-title">Manage Members</h2><p className="section-desc">Add members or compute a member hash from a secret.</p></div>
      </div>
      <div className="tabs">
        <button className={`tab${mode === "add" ? " active" : ""}`} onClick={() => { setMode("add"); setError(null); }}>Add Member (Admin)</button>
        <button className={`tab${mode === "hash" ? " active" : ""}`} onClick={() => { setMode("hash"); setError(null); }}>Compute Hash (Member)</button>
      </div>

      {mode === "add" && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">Add Member by Hash</span></div>
          <div className="card-body">
            <form onSubmit={handleAdd}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Organization ID</label>
                  <input className="form-input" value={orgId} onChange={(e) => { setOrgId(e.target.value); setError(null); }} placeholder="Select from saved or enter manually" spellCheck={false} />
                  {savedOrgs.length > 0 && (
                    <div className="quick-fill">
                      {savedOrgs.map((o, i) => <button type="button" key={i} className="quick-fill-btn" onClick={() => setOrgId(o.orgId)}>{o.name}: {o.orgId.slice(0, 15)}...</button>)}
                    </div>
                  )}
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Member Hash</label>
                  <input className="form-input" value={memberHash} onChange={(e) => { setMemberHash(e.target.value); setError(null); }} placeholder="BHP256 hash of member's secret" spellCheck={false} />
                  <span className="form-hint">The member shares their hash. You add it. Never ask for their secret.</span>
                </div>
                <div className="form-actions"><button className="btn btn-primary btn-lg" type="submit" disabled={submitting}>{submitting ? <><span className="spinner"></span> Adding...</> : "Add Member"}</button></div>
              </div>
            </form>
            {error && <div className="result-banner error"><div className="result-banner-title" style={{ color: "var(--red)" }}>Error</div><div className="result-banner-detail">{error}</div></div>}
            {txStatus && (<><div className="result-banner success"><div className="result-banner-title" style={{ color: "var(--green)" }}>Member Added</div><div className="result-banner-detail">Hash: {txStatus.hash}<br/>TX: {txStatus.id}<br/>✅ Auto-saved</div></div><TxPoll txId={txStatus.id} /></>)}
          </div>
        </div>
      )}

      {mode === "hash" && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">Compute Your Member Hash</span></div>
          <div className="card-body">
            <form onSubmit={handleHash}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Your Private Secret</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input className="form-input" style={{ flex: 1 }} value={secret} onChange={(e) => { setSecret(e.target.value); setError(null); }} placeholder="Enter or generate a secret" spellCheck={false} />
                    <button type="button" className="btn btn-secondary" onClick={generateSecret}>Generate</button>
                  </div>
                  <span className="form-hint">⚠️ SAVE THIS SECRET! You need it to submit reports. Share only the HASH with admin.</span>
                </div>
                <div className="form-actions"><button className="btn btn-primary btn-lg" type="submit" disabled={submitting}>{submitting ? <><span className="spinner"></span> Computing...</> : "Compute Hash On-Chain"}</button></div>
              </div>
              <div className="info-card" style={{ marginTop: 14 }}>
                <strong>Faster method (recommended):</strong> Run in terminal:<br/>
                <code style={{ color: "var(--accent)" }}>cd zkwhistle_program && leo run compute_member_hash {secret || "YOUR_SECRET_field"}</code><br/>
                Copy the output hash value and give it to your admin.
              </div>
            </form>
            {error && <div className="result-banner error"><div className="result-banner-title" style={{ color: "var(--red)" }}>Error</div><div className="result-banner-detail">{error}</div></div>}
            {hashResult && (<><div className="result-banner success"><div className="result-banner-title" style={{ color: "var(--green)" }}>Hash Submitted</div><div className="result-banner-detail">TX: {hashResult.id}<br/>Your secret: <strong>{hashResult.secret}</strong> (saved locally)<br/>Check TX output for hash, or use CLI method above.</div></div><TxPoll txId={hashResult.id} /></>)}
          </div>
        </div>
      )}

      {savedMembers.length > 0 && (
        <div className="saved-section">
          <div className="saved-title">Saved Members</div>
          <div className="saved-list">
            {savedMembers.map((m, i) => (
              <div key={i} className="saved-item" onClick={() => navigator.clipboard.writeText(m.memberHash || m.secret || "")}>
                <div>
                  <div className="saved-item-label">{m.secret ? "Secret: " + m.secret.slice(0, 20) + "..." : "Hash only"}</div>
                  <div className="saved-item-id">{m.memberHash ? m.memberHash.slice(0, 30) + "..." : "pending"} {m.orgId ? "• Org: " + m.orgId.slice(0, 12) + "..." : ""}</div>
                </div>
                <div className="saved-item-use">Copy</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
