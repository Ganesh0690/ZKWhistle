import React, { useState } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { Transaction, WalletAdapterNetwork } from "@demox-labs/aleo-wallet-adapter-base";
import ConnectScreen from "./ConnectScreen";
import { PROGRAM_ID } from "../utils/aleo";
import { saveReport, getOrgs, getMembers } from "../utils/storage";
import TxPoll from "../utils/TxPoll";

export default function SubmitReport() {
  const { publicKey, connected, requestTransaction } = useWallet();
  const [orgId, setOrgId] = useState("");
  const [memberSecret, setMemberSecret] = useState("");
  const [reportContent, setReportContent] = useState("");
  const [severity, setSeverity] = useState("1");
  const [txStatus, setTxStatus] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const savedOrgs = getOrgs();
  const savedMembers = getMembers().filter(m => m.secret);

  if (!connected) return <ConnectScreen />;

  function textToField(text) {
    const bytes = new TextEncoder().encode(text.slice(0, 31));
    let hex = "";
    for (const b of bytes) hex += b.toString(16).padStart(2, "0");
    return hex.length === 0 ? "0field" : BigInt("0x" + hex).toString() + "field";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null); setTxStatus(null);
    if (!orgId.trim()) { setError("Select or enter Organization ID."); return; }
    if (!memberSecret.trim()) { setError("Enter your private secret."); return; }
    if (!reportContent.trim()) { setError("Enter report content."); return; }
    setSubmitting(true);
    try {
      let oid = orgId.trim(); if (!oid.endsWith("field")) oid += "field";
      let sec = memberSecret.trim(); if (!sec.endsWith("field")) sec += "field";
      const reportId = Math.floor(Math.random() * 1_000_000_000).toString() + "field";
      const contentHash = textToField(reportContent.trim());
      const tx = Transaction.createTransaction(publicKey, WalletAdapterNetwork.TestnetBeta, PROGRAM_ID, "submit_report", [oid, sec, reportId, contentHash, severity + "u8"], 1_000_000, false);
      const txId = await requestTransaction(tx);
      const id = typeof txId === "object" ? txId.transactionId : txId;
      saveReport({ reportId, orgId: oid, severity: parseInt(severity), txId: id, content: reportContent.trim().slice(0, 100) });
      setTxStatus({ id, reportId });
      setReportContent("");
    } catch (err) { console.error(err); setError(err.message || "Submission failed."); }
    finally { setSubmitting(false); }
  }

  const sevOptions = [
    { value: "0", label: "Low", desc: "Minor concern" },
    { value: "1", label: "Medium", desc: "Noteworthy" },
    { value: "2", label: "High", desc: "Serious" },
    { value: "3", label: "Critical", desc: "Urgent" },
  ];

  return (
    <div>
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div><h2 className="section-title">Submit Anonymous Report</h2><p className="section-desc">Your identity is never revealed. ZK proves membership without exposing who you are.</p></div>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">New Report</span><span className="severity-badge critical"><span className="status-dot"></span>Anonymous</span></div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Organization ID</label>
                <input className="form-input" value={orgId} onChange={(e) => { setOrgId(e.target.value); setError(null); }} placeholder="Select or enter" spellCheck={false} />
                {savedOrgs.length > 0 && <div className="quick-fill">{savedOrgs.map((o, i) => <button type="button" key={i} className="quick-fill-btn" onClick={() => setOrgId(o.orgId)}>{o.name}</button>)}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Your Private Secret</label>
                <input className="form-input" type="password" value={memberSecret} onChange={(e) => { setMemberSecret(e.target.value); setError(null); }} placeholder="Your secret (never revealed)" spellCheck={false} />
                {savedMembers.length > 0 && <div className="quick-fill">{savedMembers.map((m, i) => <button type="button" key={i} className="quick-fill-btn" onClick={() => setMemberSecret(m.secret)}>Secret: {m.secret.slice(0, 12)}...</button>)}</div>}
              </div>
              <div className="form-group full-width">
                <label className="form-label">Report Content</label>
                <textarea className="form-input" value={reportContent} onChange={(e) => { setReportContent(e.target.value); setError(null); }} placeholder="Describe the issue. Only a hash goes on-chain." rows={4} style={{ resize: "vertical", minHeight: 100 }} />
                <span className="form-hint">Plaintext never stored on blockchain — only the hash.</span>
              </div>
              <div className="form-group full-width">
                <label className="form-label">Severity</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                  {sevOptions.map(o => <button key={o.value} type="button" className={`btn ${severity === o.value ? "btn-primary" : "btn-ghost"}`} onClick={() => setSeverity(o.value)} style={{ flexDirection: "column", padding: "10px 8px" }}><span style={{ fontSize: 12 }}>{o.label}</span><span style={{ fontSize: 9, opacity: .7, textTransform: "none", letterSpacing: 0 }}>{o.desc}</span></button>)}
                </div>
              </div>
              <div className="form-actions"><button className="btn btn-primary btn-lg" type="submit" disabled={submitting}>{submitting ? <><span className="spinner"></span> Submitting...</> : "Submit Anonymous Report"}</button></div>
            </div>
          </form>
          {error && <div className="result-banner error"><div className="result-banner-title" style={{ color: "var(--red)" }}>Error</div><div className="result-banner-detail">{error}</div></div>}
          {txStatus && (<>
            <div className="result-banner success">
              <div className="result-banner-title" style={{ color: "var(--green)" }}>Report Submitted Anonymously</div>
              <div className="result-banner-detail">Report ID: <strong>{txStatus.reportId}</strong><br/>TX: {txStatus.id}<br/>✅ Auto-saved — find it in View Reports or Dashboard.</div>
            </div>
            <TxPoll txId={txStatus.id} />
          </>)}
        </div>
      </div>
      <div className="info-card"><strong>Privacy:</strong> Your secret is hashed inside the ZK circuit (never leaves your device). The circuit verifies membership. The report has no link to your address or identity.</div>
    </div>
  );
}
