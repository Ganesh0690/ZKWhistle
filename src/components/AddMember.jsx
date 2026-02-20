import React, { useState, useEffect } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { Transaction, WalletAdapterNetwork } from "@demox-labs/aleo-wallet-adapter-base";
import ConnectScreen from "./ConnectScreen";
import { PROGRAM_ID } from "../utils/aleo";
import { saveMember, saveSecret, getOrgs, getMembers } from "../utils/storage";
import TxPoll from "../utils/TxPoll";

let aleoWasm = null;

async function loadWasm() {
  if (aleoWasm) return aleoWasm;
  try {
    aleoWasm = await import("@provablehq/wasm");
    if (aleoWasm.default && typeof aleoWasm.default === "function") {
      await aleoWasm.default();
    }
    return aleoWasm;
  } catch (err) {
    console.error("WASM load error:", err);
    return null;
  }
}

async function computeHashLocal(secretStr) {
  const wasm = await loadWasm();
  if (!wasm) return null;
  try {
    // Try different API patterns the SDK might expose
    if (wasm.Plaintext && wasm.Plaintext.hash) {
      const p = wasm.Plaintext.from_string(secretStr);
      return p.hash("bhp256", "field");
    }
    if (wasm.ProgramManager) {
      const pm = new wasm.ProgramManager();
      const leo = `program hash_helper.aleo;\nfunction main:\n  input r0 as field.private;\n  hash.bhp256 r0 into r1 as field;\n  output r1 as field.private;\n`;
      const result = await pm.execute_local(leo, "main", [secretStr]);
      if (result && result.length > 0) return result[0];
    }
  } catch (e) { console.warn("WASM hash attempt:", e); }
  return null;
}

// JS-based BHP256 approximation won't match Aleo's BHP256 exactly,
// so we'll use the WASM or fall back to on-chain

export default function AddMember() {
  const { publicKey, connected, requestTransaction } = useWallet();
  const [orgId, setOrgId] = useState("");
  const [memberHash, setMemberHash] = useState("");
  const [secret, setSecret] = useState("");
  const [computedHash, setComputedHash] = useState("");
  const [txStatus, setTxStatus] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [computing, setComputing] = useState(false);
  const [mode, setMode] = useState("add");
  const savedOrgs = getOrgs();
  const savedMembers = getMembers();

  if (!connected) return <ConnectScreen />;

  function generateSecret() {
    const rand = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    const s = rand.toString() + "field";
    setSecret(s);
    setComputedHash("");
  }

  async function handleComputeHash() {
    setError(null);
    setComputedHash("");
    let s = secret.trim();
    if (!s) { setError("Enter or generate a secret first."); return; }
    if (!s.endsWith("field")) s += "field";

    setComputing(true);
    try {
      // Try WASM first
      const hash = await computeHashLocal(s);
      if (hash) {
        const h = String(hash).replace(".private", "").replace(".public", "");
        setComputedHash(h);
        saveSecret({ secret: s, memberHash: h });
        setComputing(false);
        return;
      }

      // Fallback: compute on-chain
      const tx = Transaction.createTransaction(
        publicKey, WalletAdapterNetwork.TestnetBeta, PROGRAM_ID,
        "compute_member_hash", [s], 300_000, false
      );
      const txId = await requestTransaction(tx);
      const id = typeof txId === "object" ? txId.transactionId : txId;
      setError("Hash submitted on-chain (TX: " + id + "). Use CLI for instant result: leo run compute_member_hash " + s);
      saveSecret({ secret: s, memberHash: "" });
    } catch (err) {
      console.error(err);
      setError(err.message || "Hash computation failed.");
    } finally {
      setComputing(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError(null);
    setTxStatus(null);
    let oid = orgId.trim();
    if (!oid) { setError("Select or enter Organization ID."); return; }
    if (!oid.endsWith("field")) oid += "field";
    let hash = memberHash.trim();
    if (!hash) { setError("Enter member hash."); return; }
    if (!hash.endsWith("field")) hash += "field";

    setSubmitting(true);
    try {
      const tx = Transaction.createTransaction(
        publicKey, WalletAdapterNetwork.TestnetBeta, PROGRAM_ID,
        "add_member", [oid, hash], 500_000, false
      );
      const txId = await requestTransaction(tx);
      const id = typeof txId === "object" ? txId.transactionId : txId;
      saveMember({ memberHash: hash, secret: null, orgId: oid, txId: id });
      setTxStatus({ id, hash });
      setMemberHash("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Manage Members</h2>
          <p className="section-desc">Add members or compute a member hash from a secret.</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab${mode === "add" ? " active" : ""}`} onClick={() => { setMode("add"); setError(null); }}>Add Member (Admin)</button>
        <button className={`tab${mode === "hash" ? " active" : ""}`} onClick={() => { setMode("hash"); setError(null); }}>Compute Hash (Member)</button>
      </div>

      {mode === "hash" && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">Compute Your Member Hash</span>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Step 1: Generate or Enter Your Secret</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="form-input"
                    style={{ flex: 1 }}
                    value={secret}
                    onChange={(e) => { setSecret(e.target.value); setComputedHash(""); setError(null); }}
                    placeholder="Click Generate or enter your own"
                    spellCheck={false}
                  />
                  <button type="button" className="btn btn-secondary" onClick={generateSecret}>Generate</button>
                </div>
                <span className="form-hint" style={{ color: "var(--red)" }}>⚠️ SAVE THIS SECRET — you need it to submit reports. Never share it.</span>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Step 2: Compute Hash</label>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleComputeHash}
                  disabled={computing || !secret.trim()}
                  style={{ width: "100%" }}
                >
                  {computing ? <><span className="spinner"></span> Computing...</> : "Compute BHP256 Hash"}
                </button>
              </div>

              {computedHash && (
                <div className="form-group full-width">
                  <label className="form-label">Step 3: Your Hash (share this with admin)</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="form-input"
                      style={{ flex: 1, fontSize: 11 }}
                      value={computedHash}
                      readOnly
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => { navigator.clipboard.writeText(computedHash); }}
                    >
                      Copy
                    </button>
                  </div>
                  <span className="form-hint" style={{ color: "var(--green)" }}>✅ Hash computed instantly in your browser. Share this hash with your org admin. Keep your secret private.</span>
                </div>
              )}

              {computedHash && (
                <div className="form-group full-width">
                  <button
                    className="btn btn-primary btn-lg"
                    style={{ width: "100%", background: "var(--green)" }}
                    onClick={() => { setMemberHash(computedHash); setMode("add"); }}
                  >
                    Auto-Fill & Switch to Add Member →
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="result-banner error">
                <div className="result-banner-title" style={{ color: "var(--red)" }}>Note</div>
                <div className="result-banner-detail">{error}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {mode === "add" && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">Add Member by Hash</span>
          </div>
          <div className="card-body">
            <form onSubmit={handleAdd}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Organization ID</label>
                  <input
                    className="form-input"
                    value={orgId}
                    onChange={(e) => { setOrgId(e.target.value); setError(null); }}
                    placeholder="Select from saved or enter manually"
                    spellCheck={false}
                  />
                  {savedOrgs.length > 0 && (
                    <div className="quick-fill">
                      {savedOrgs.map((o, i) => (
                        <button type="button" key={i} className="quick-fill-btn" onClick={() => setOrgId(o.orgId)}>
                          {o.name}: {o.orgId.slice(0, 15)}...
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Member Hash</label>
                  <input
                    className="form-input"
                    value={memberHash}
                    onChange={(e) => { setMemberHash(e.target.value); setError(null); }}
                    placeholder="BHP256 hash — compute it in the Compute Hash tab"
                    spellCheck={false}
                  />
                  <span className="form-hint">Paste the hash from Compute Hash tab. Never the secret.</span>
                  {savedMembers.filter(m => m.memberHash && m.memberHash.length > 20).length > 0 && (
                    <div className="quick-fill">
                      {savedMembers.filter(m => m.memberHash && m.memberHash.length > 20).map((m, i) => (
                        <button type="button" key={i} className="quick-fill-btn" onClick={() => setMemberHash(m.memberHash)}>
                          Hash: {m.memberHash.slice(0, 25)}...
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button className="btn btn-primary btn-lg" type="submit" disabled={submitting}>
                    {submitting ? <><span className="spinner"></span> Adding...</> : "Add Member"}
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
                  <div className="result-banner-title" style={{ color: "var(--green)" }}>Member Added</div>
                  <div className="result-banner-detail">
                    Hash: {txStatus.hash}<br />
                    TX: {txStatus.id}<br />
                    ✅ Auto-saved
                  </div>
                </div>
                <TxPoll txId={txStatus.id} />
              </>
            )}
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
                  <div className="saved-item-label">
                    {m.secret ? "Secret: " + m.secret.slice(0, 20) + "..." : "Hash only"}
                  </div>
                  <div className="saved-item-id">
                    {m.memberHash && m.memberHash.length > 20 ? m.memberHash.slice(0, 30) + "..." : m.memberHash || "pending"}
                    {m.orgId ? " • Org: " + m.orgId.slice(0, 12) + "..." : ""}
                  </div>
                </div>
                <div className="saved-item-use">Copy</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="info-card" style={{ marginTop: 20 }}>
        <strong>Privacy flow:</strong> Member generates a secret → computes BHP256 hash in browser → shares only the hash with admin → admin adds hash on-chain. When reporting, member enters their secret privately. The ZK circuit hashes it and verifies membership. Admin never knows the secret or which address the member uses.
      </div>
    </div>
  );
}