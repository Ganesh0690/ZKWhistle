import React, { useMemo, useState } from "react";
import { AleoWalletProvider } from "@provablehq/aleo-wallet-adaptor-react";
import { WalletModalProvider } from "@provablehq/aleo-wallet-adaptor-react-ui";
import { ShieldWalletAdapter } from "@provablehq/aleo-wallet-adaptor-shield";
import { LeoWalletAdapter } from "@provablehq/aleo-wallet-adaptor-leo";
import { Network } from "@provablehq/aleo-types";
import { DecryptPermission } from "@provablehq/aleo-wallet-adaptor-core";
import "@provablehq/aleo-wallet-adaptor-react-ui/dist/styles.css";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import RegisterOrg from "./components/RegisterOrg";
import AddMember from "./components/AddMember";
import SubmitReport from "./components/SubmitReport";
import ViewReports from "./components/ViewReports";
import Footer from "./components/Footer";
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  return (
    <AleoWalletProvider
      wallets={[
        new ShieldWalletAdapter(),
        new LeoWalletAdapter(),
      ]}
      autoConnect={true}
      network={Network.TESTNET}
      decryptPermission={DecryptPermission.NoDecrypt}
      programs={["zkwhistle_kumar_v2.aleo"]}
      onError={(error) => console.error(error.message)}
    >
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
    </AleoWalletProvider>
  );
}
