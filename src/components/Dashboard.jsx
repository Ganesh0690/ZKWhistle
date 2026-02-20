import React, { useEffect, useState } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import ConnectScreen from "./ConnectScreen";
import { getOrgCount, getTotalReports, getBlockHeight } from "../utils/aleo";
import { getOrgs, getReports, getMembers, getActivity } from "../utils/storage";

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

export default function Dashboard({ setActiveTab }) {
  const { connected } = useWallet();
  const [stats, setStats] = useState({ orgs: 0, reports: 0, block: 0 });
  const [loading, setLoading] = useState(true);
  const activity = getActivity();
  const savedOrgs = getOrgs();
  const savedReports = getReports();
  const savedMembers = getMembers();

  useEffect(() => {
    let c = false;
    async function load() {
      setLoading(true);
      const [orgs, reports, block] = await Promise.all([getOrgCount(), getTotalReports(), getBlockHeight()]);
      if (!c) { setStats({ orgs, reports, block }); setLoading(false); }
    }
    load();
    const iv = setInterval(load, 20000);
    return () => { c = true; clearInterval(iv); };
  }, []);

  if (!connected) return <ConnectScreen />;

  return (
    <div>
      <div className="hero">
        <div className="hero-content">
          <span className="hero-overline">Anonymous Reporting on Aleo</span>
          <h1 className="hero-title">Speak Truth.<br />Stay <span className="redacted">Hidden</span>.</h1>
          <p className="hero-subtitle">ZKWhistle lets organization members submit anonymous reports with zero-knowledge proof of membership. Your identity is never revealed.</p>
          <div className="hero-badges">
            <span className="hero-badge"><span className="hero-badge-dot amber"></span>ZK Proof of Membership</span>
            <span className="hero-badge"><span className="hero-badge-dot red"></span>Fully Anonymous Reports</span>
            <span className="hero-badge"><span className="hero-badge-dot green"></span>On-chain Verification</span>
            <span className="hero-badge"><span className="hero-badge-dot blue"></span>No Identity Exposure</span>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => setActiveTab("report")}>Submit Anonymous Report</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Organizations</div>
          <div className="stat-value accent">{loading ? <div className="skeleton" style={{width:40,height:28}}></div> : stats.orgs}</div>
          <div className="stat-footer">registered on-chain</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Reports Filed</div>
          <div className="stat-value">{loading ? <div className="skeleton" style={{width:40,height:28}}></div> : stats.reports}</div>
          <div className="stat-footer">anonymous submissions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Block Height</div>
          <div className="stat-value">{loading ? <div className="skeleton" style={{width:80,height:28}}></div> : stats.block.toLocaleString()}</div>
          <div className="stat-footer">Aleo testnet</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Privacy Level</div>
          <div className="stat-value accent">100%</div>
          <div className="stat-footer">zero-knowledge</div>
        </div>
      </div>

      {/* Saved Data Summary */}
      {(savedOrgs.length > 0 || savedReports.length > 0 || savedMembers.length > 0) && (
        <div className="section">
          <div className="section-header"><div><h2 className="section-title">Your Saved Data</h2><p className="section-desc">Auto-saved locally — never sent to any server</p></div></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setActiveTab("register")}>
              <div className="stat-label">Your Orgs</div>
              <div className="stat-value accent">{savedOrgs.length}</div>
              <div className="stat-footer">{savedOrgs.length > 0 ? savedOrgs[savedOrgs.length-1].name : "none yet"}</div>
            </div>
            <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setActiveTab("members")}>
              <div className="stat-label">Your Members</div>
              <div className="stat-value">{savedMembers.length}</div>
              <div className="stat-footer">{savedMembers.filter(m => m.secret).length} with secrets</div>
            </div>
            <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setActiveTab("view")}>
              <div className="stat-label">Your Reports</div>
              <div className="stat-value">{savedReports.length}</div>
              <div className="stat-footer">click to view</div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div className="section">
        <div className="section-header"><div><h2 className="section-title">Recent Activity</h2><p className="section-desc">Your local transaction history</p></div></div>
        <div className="card">
          <div className="card-body">
            {activity.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">No activity yet</div>
                <div className="empty-state-hint">Register an organization to get started</div>
                <div className="empty-state-action"><button className="btn btn-primary" onClick={() => setActiveTab("register")}>Register Organization</button></div>
              </div>
            ) : (
              <div className="activity-feed">
                {activity.slice(0, 10).map((a, i) => (
                  <div key={i} className="activity-item">
                    <div className={`activity-dot ${a.type}`}></div>
                    <div className="activity-content">
                      <div className="activity-text">{a.message}</div>
                      <div className="activity-time">{timeAgo(a.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-header"><div><h2 className="section-title">How It Works</h2><p className="section-desc">Three steps to anonymous, verified reporting</p></div></div>
        <div className="howit-grid">
          <div className="howit-card"><div className="howit-num">01</div><div className="howit-label">Register & Add Members</div><div className="howit-desc">An admin registers an org and adds members by their secret hash. Identities are never stored on-chain.</div></div>
          <div className="howit-card"><div className="howit-num">02</div><div className="howit-label">Submit Report</div><div className="howit-desc">A member submits a report using their private secret. The ZK circuit proves membership without revealing who.</div></div>
          <div className="howit-card"><div className="howit-num">03</div><div className="howit-label">Verify & Act</div><div className="howit-desc">Reports appear on-chain with severity and content hash. Admins review and update status. Reporter stays anonymous.</div></div>
        </div>
      </div>
    </div>
  );
}
