import React, { useState, useEffect } from "react";
import { API_BASE } from "./aleo";

export default function TxPoll({ txId, onConfirmed }) {
  const [status, setStatus] = useState("pending");
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!txId || txId.includes("-")) {
      // wallet-local UUID, not a real on-chain TX id — skip polling, show success after delay
      const t = setTimeout(() => { setStatus("sent"); if (onConfirmed) onConfirmed(); }, 2000);
      return () => clearTimeout(t);
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 40;

    async function poll() {
      try {
        const res = await fetch(`${API_BASE}/transaction/${txId}`);
        if (res.ok) {
          if (!cancelled) { setStatus("confirmed"); if (onConfirmed) onConfirmed(); }
          return;
        }
      } catch {}
      attempts++;
      if (attempts >= maxAttempts) { if (!cancelled) setStatus("timeout"); return; }
      if (!cancelled) setTimeout(poll, 3000);
    }

    poll();
    return () => { cancelled = true; };
  }, [txId]);

  useEffect(() => {
    if (status !== "pending") return;
    const iv = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 500);
    return () => clearInterval(iv);
  }, [status]);

  if (status === "pending") {
    return (
      <div className="tx-poll pending">
        <div className="tx-poll-bar"><div className="tx-poll-progress"></div></div>
        <span className="tx-poll-text">Waiting for on-chain confirmation{dots}</span>
      </div>
    );
  }
  if (status === "sent") {
    return (
      <div className="tx-poll confirmed">
        <span className="tx-poll-icon">✓</span>
        <span className="tx-poll-text">Transaction sent to network</span>
      </div>
    );
  }
  if (status === "confirmed") {
    return (
      <div className="tx-poll confirmed">
        <span className="tx-poll-icon">✓</span>
        <span className="tx-poll-text">Confirmed on-chain</span>
      </div>
    );
  }
  return (
    <div className="tx-poll timeout">
      <span className="tx-poll-icon">⏳</span>
      <span className="tx-poll-text">Still processing — check explorer for TX status</span>
    </div>
  );
}
