import React, { useState } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import ConnectScreen from "./ConnectScreen";
import { getReports, getOrgs, addActivityEntry } from "../utils/storage";
import TxPoll from "../utils/TxPoll";
export default function BountyReward() {
  const { address, connected, executeTransaction } = useWallet();
  const [reportId, setReportId] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [txStatus, setTxStatus] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const savedReports = getReports();
  const savedOrgs = getOrgs();
  if (!connected) return <ConnectScreen />;
  async function handleReward(e) {
    e.preventDefault();
    setError(null); setTxStatus(null);
    if (!recipientAddress.trim()) { setError("Enter recipient address."); return; }
    if (!recipientAddress.trim().startsWith("aleo1")) { setError("Invalid Aleo address."); return; }
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) { setError("Enter a valid amount."); return; }
    const microcredits = Math.floor(Number(amount) * 1_000_000);
    if (microcredits < 1000) { setError("Minimum reward is 0.001 credits."); return; }
    setSubmitting(true);
    try {
      const id = await executeTransaction({
        program: "credits.aleo",
        function: "transfer_public",
        inputs: [recipientAddress.trim(), microcredits.toString() + "u64"],
        fee: 0.3,
      });
      const txId = typeof id === "object" ? (id.transactionId || id.id || JSON.stringify(id)) : String(id);
      addActivityEntry("bounty_paid", "Bounty of " + amount + " credits sent to " + recipientAddress.trim().slice(0, 12) + "...", reportId || "direct");
      setTxStatus({ id: txId, amount, recipient: recipientAddress.trim() });
      setAmount("");
    } catch (err) { console.error(err); setError(err.message || "Transfer failed."); }
    finally { setSubmitting(false); }
  }
  const presetAmounts = ["0.5", "1", "2", "5"];
  return (
    <div>
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Bounty Rewards</h2>
          <p className="section-desc">Reward verified reports with Aleo credits using credits.aleo transfer_public.</p>
        </div>
      </div>
      <div className="info-card" style={{ marginBottom: 20 }}>
        <strong>How bounties work:</strong> When an admin verifies a report, they can send Aleo credits as a reward to the reporter. This uses the native <strong>credits.aleo transfer_public</strong> program — real on-chain payments. Reporters can share their address privately with the admin to receive rewards.
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Send Bounty Reward</span>
          <span className="severity-badge medium"><span className="status-dot"></span>credits.aleo</span>
        </div>
        <div className="card-body">
          <form onSubmit={handleReward}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Report ID (Optional Reference)</label>
                <input className="form-input" value={reportId} onChange={(e) => setReportId(e.target.value)} placeholder="Which report is this bounty for?" spellCheck={false} />
                {savedReports.length > 0 && (
                  <div className="quick-fill">
                    {savedReports.map((r, i) => (
                      <button type="button" key={i} className="quick-fill-btn" onClick={() => setReportId(r.reportId)}>
                        {r.content ? r.content.slice(0, 20) + "..." : r.reportId.slice(0, 15)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group full-width">
                <label className="form-label">Recipient Address</label>
                <input className="form-input" value={recipientAddress} onChange={(e) => { setRecipientAddress(e.target.value); setError(null); }} placeholder="aleo1..." spellCheck={false} />
                <span className="form-hint">The reporter's Aleo address. They share this privately with admin.</span>
              </div>
              <div className="form-group full-width">
                <label className="form-label">Reward Amount (Credits)</label>
                <input className="form-input" type="number" step="0.001" min="0.001" value={amount} onChange={(e) => { setAmount(e.target.value); setError(null); }} placeholder="e.g. 1.0" />
                <div className="quick-fill" style={{ marginTop: 6 }}>
                  {presetAmounts.map((a) => (
                    <button type="button" key={a} className="quick-fill-btn" onClick={() => setAmount(a)}>
                      {a} credits
                    </button>
                  ))}
                </div>
                <span className="form-hint">Uses credits.aleo transfer_public. Gas fee ~0.3 credits extra.</span>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary btn-lg" type="submit" disabled={submitting} style={{ width: "100%" }}>
                  {submitting ? <><span className="spinner"></span> Sending Reward...</> : "Send Bounty Reward"}
                </button>
              </div>
            </div>
          </form>
          {error && (
            <div className="result-banner error">
              <div className="result-banner-title" style={{ color: "var(--red)" }}>Error</div>
              <div className="result-banner-detail">{error}</div>
            </div>
          )}
          {txStatus && (
            <>
              <div className="result-banner success">
                <div className="result-banner-title" style={{ color: "var(--green)" }}>Bounty Sent!</div>
                <div className="result-banner-detail">
                  Amount: <strong>{txStatus.amount} credits</strong><br />
                  To: {txStatus.recipient.slice(0, 16)}...{txStatus.recipient.slice(-6)}<br />
                  TX: {txStatus.id}<br />
                  Paid via credits.aleo transfer_public
                </div>
              </div>
              <TxPoll txId={txStatus.id} />
            </>
          )}
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Bounty Model</span></div>
        <div className="card-body">
          <div className="howit-grid">
            <div className="howit-card">
              <div className="howit-num">01</div>
              <div className="howit-label">Report Verified</div>
              <div className="howit-desc">Admin reviews and marks report as Resolved in View Reports tab.</div>
            </div>
            <div className="howit-card">
              <div className="howit-num">02</div>
              <div className="howit-label">Reporter Shares Address</div>
              <div className="howit-desc">Reporter privately shares their Aleo address with admin through a secure channel.</div>
            </div>
            <div className="howit-card">
              <div className="howit-num">03</div>
              <div className="howit-label">Admin Sends Bounty</div>
              <div className="howit-desc">Admin sends credits via credits.aleo transfer_public. On-chain, verifiable payment.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
