import React, { useMemo, useState } from "react";
import { DecryptPermission, WalletAdapterNetwork } from "@demox-labs/aleo-wallet-adapter-base";
import { WalletProvider } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletModalProvider } from "@demox-labs/aleo-wallet-adapter-reactui";
import { LeoWalletAdapter } from "@demox-labs/aleo-wallet-adapter-leo";
import "@demox-labs/aleo-wallet-adapter-reactui/styles.css";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import RegisterOrg from "./components/RegisterOrg";
import AddMember from "./components/AddMember";
import SubmitReport from "./components/SubmitReport";
import ViewReports from "./components/ViewReports";
import Footer from "./components/Footer";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const wallets = useMemo(() => [new LeoWalletAdapter({ appName: "ZKWhistle" })], []);
  return (
    <WalletProvider wallets={wallets} decryptPermission={DecryptPermission.NoDecrypt} network={WalletAdapterNetwork.TestnetBeta} autoConnect>
      <WalletModalProvider>
        <div className="app-layout">
          <Header activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="main-content">
            {activeTab === "dashboard" && <Dashboard setActiveTab={setActiveTab} />}
            {activeTab === "register" && <RegisterOrg />}
            {activeTab === "members" && <AddMember />}
            {activeTab === "report" && <SubmitReport />}
            {activeTab === "view" && <ViewReports />}
          </main>
          <Footer />
        </div>
      </WalletModalProvider>
    </WalletProvider>
  );
}
