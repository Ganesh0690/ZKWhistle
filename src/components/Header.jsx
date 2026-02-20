import React from "react";
import { WalletMultiButton } from "@demox-labs/aleo-wallet-adapter-reactui";
const NAV = [
  { id: "dashboard", label: "Dashboard" },
  { id: "register", label: "Register Org" },
  { id: "members", label: "Members" },
  { id: "report", label: "Submit Report" },
  { id: "view", label: "View Reports" },
];
export default function Header({ activeTab, setActiveTab }) {
  return (
    <header className="header">
      <div className="header-brand" onClick={() => setActiveTab("dashboard")}>
        <div className="header-logo">ZW</div>
        <span className="header-title">ZK<span>Whistle</span></span>
      </div>
      <nav className="header-nav">
        {NAV.map((n) => (<button key={n.id} className={`header-nav-item${activeTab === n.id ? " active" : ""}`} onClick={() => setActiveTab(n.id)}>{n.label}</button>))}
      </nav>
      <div className="header-actions">
        <span className="network-badge">Testnet</span>
        <WalletMultiButton />
      </div>
    </header>
  );
}
