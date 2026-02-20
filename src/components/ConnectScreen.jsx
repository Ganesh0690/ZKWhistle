import React from "react";
import { WalletMultiButton } from "@demox-labs/aleo-wallet-adapter-reactui";

export default function ConnectScreen() {
  return (
    <div className="connect-screen">
      <div className="connect-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <h2 className="connect-title">Connect Wallet</h2>
      <p className="connect-desc">Connect your Leo Wallet to submit anonymous reports, register organizations, and interact with ZKWhistle on Aleo testnet.</p>
      <WalletMultiButton />
    </div>
  );
}
