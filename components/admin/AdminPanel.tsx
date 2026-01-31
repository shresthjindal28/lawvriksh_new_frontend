import React from 'react';
import '../../styles/admin-styles/admin-panel.css';

interface Stat {
  label: string;
  value?: string | number;
  split?: { main: string | number; sub: string | number };
}

interface Action {
  user: string;
  action: string;
  timestamp: string;
  detailsUrl?: string;
}

interface AdminInfo {
  admin_id: string;
  admin_name: string;
  admin_email: string;
  role?: string;
  last_login?: string;
  dashboard_generated_at?: string;
}

interface AdminPanelProps {
  stats: Stat[];
  actions: Action[];
  adminInfo?: AdminInfo;
}

export default function AdminPanel({ stats, actions, adminInfo }: AdminPanelProps) {
  return (
    <div className="admin-panel">
      <div className="admin-content">
        {/* Title */}
        <div className="title-row">
          <div>
            <h1 className="page-title">Hello, {adminInfo?.admin_name || 'Admin'}</h1>
            <p className="page-sub">Here is an overview of key metrics and recent activities</p>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {stats.map((stat, idx) => (
            <div key={idx} className="stat-card">
              <p className="stat-label">{stat.label}</p>
              {stat.split ? (
                <div className="stat-split">
                  <p className="stat-value">{stat.split.main}</p>
                  <p className="stat-divider">/</p>
                  <p className="stat-muted">{stat.split.sub}</p>
                </div>
              ) : (
                <p className="stat-value">{stat.value}</p>
              )}
            </div>
          ))}
        </div>

        {/* Table */}
        <section className="table-wrap">
          <h2 className="section-title">Recent Admin Actions</h2>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Activity</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <span className={`source-badge ${row.user.toLowerCase()}`}>{row.user}</span>
                    </td>
                    <td className="muted">{row.action}</td>
                    <td className="muted">{row.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
