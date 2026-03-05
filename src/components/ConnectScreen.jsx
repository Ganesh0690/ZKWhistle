import React from "react";
import { WalletMultiButton } from "@provablehq/aleo-wallet-adaptor-react-ui";
export default function ConnectScreen() {
  return (
    <div className="connect-screen">
      <div className="connect-icon"><span style={{fontSize:32}}>🔒</span></div>
      <h2 className="connect-title">Connect Wallet</h2>
      <p className="connect-desc">Connect your Shield or Leo Wallet to access ZKWhistle. Your identity stays private — we only need your address to sign transactions.</p>
      <WalletMultiButton />
    </div>
  );
}
