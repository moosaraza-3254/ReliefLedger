import React, { useState, useEffect } from 'react';
import adminAPI from '../api/adminAPI';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

  .ad-root {
    min-height: 100vh;
    background: #0a0f0d;
    font-family: 'DM Sans', sans-serif;
    color: #f1f5f9;
    position: relative;
    overflow-x: hidden;
  }

  .ad-bg-pattern {
    position: fixed;
    inset: 0;
    opacity: 0.04;
    background-image: radial-gradient(circle at 2px 2px, #4ade80 1px, transparent 0);
    background-size: 32px 32px;
    pointer-events: none;
    z-index: 0;
  }

  .ad-bg-glow {
    position: fixed;
    width: 700px;
    height: 700px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(74, 222, 128, 0.07) 0%, transparent 70%);
    top: -200px;
    right: -200px;
    pointer-events: none;
    z-index: 0;
  }

  .ad-wrap {
    position: relative;
    z-index: 1;
    padding: 120px 40px 60px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .ad-header {
    margin-bottom: 48px;
  }

  .ad-eyebrow {
    font-size: 0.75rem;
    font-weight: 500;
    color: #4ade80;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: 0.5rem;
  }

  .ad-title {
    font-family: 'Playfair Display', serif;
    font-size: 2.8rem;
    font-weight: 700;
    color: #f8fafc;
    line-height: 1.15;
    margin-bottom: 0.5rem;
  }

  .ad-title span { color: #4ade80; }

  .ad-subtitle {
    font-size: 0.95rem;
    color: #64748b;
    font-weight: 300;
  }

  /* Stats Grid */
  .ad-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }

  .ad-stat-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 24px 28px;
    position: relative;
    overflow: hidden;
    transition: all 0.25s ease;
  }

  .ad-stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, #4ade80, transparent);
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .ad-stat-card:hover {
    border-color: rgba(74, 222, 128, 0.25);
    background: rgba(74, 222, 128, 0.04);
    transform: translateY(-2px);
  }

  .ad-stat-card:hover::before { opacity: 1; }

  .ad-stat-label {
    font-size: 0.72rem;
    font-weight: 500;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 12px;
  }

  .ad-stat-value {
    font-family: 'Playfair Display', serif;
    font-size: 2.4rem;
    font-weight: 700;
    color: #4ade80;
    line-height: 1;
    margin-bottom: 8px;
  }

  .ad-stat-meta {
    font-size: 0.75rem;
    color: #475569;
  }

  /* Tabs */
  .ad-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 28px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 6px;
    width: fit-content;
  }

  .ad-tab {
    padding: 10px 20px;
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.88rem;
    font-family: 'DM Sans', sans-serif;
    border-radius: 8px;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .ad-tab:hover { color: #94a3b8; background: rgba(255,255,255,0.03); }

  .ad-tab.active {
    background: rgba(74, 222, 128, 0.12);
    color: #4ade80;
    font-weight: 500;
  }

  .ad-tab-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: rgba(239, 68, 68, 0.85);
    color: white;
    border-radius: 50%;
    font-size: 0.65rem;
    margin-left: 7px;
    font-weight: 600;
  }

  /* Section */
  .ad-section {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 28px 32px;
    margin-bottom: 24px;
  }

  .ad-section-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.3rem;
    font-weight: 600;
    color: #e2e8f0;
    margin-bottom: 6px;
  }

  .ad-section-divider {
    width: 32px;
    height: 2px;
    background: linear-gradient(90deg, #4ade80, transparent);
    margin-bottom: 24px;
  }

  .ad-sub-title {
    font-size: 0.88rem;
    font-weight: 500;
    color: #4ade80;
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .ad-sub-title.blue { color: #60a5fa; }

  /* Table */
  .ad-table-wrap { overflow-x: auto; }

  .ad-table {
    width: 100%;
    border-collapse: collapse;
  }

  .ad-table th {
    text-align: left;
    padding: 10px 14px;
    color: #475569;
    font-weight: 500;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .ad-table td {
    padding: 14px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    font-size: 0.88rem;
    color: #cbd5e1;
  }

  .ad-table tbody tr:hover td {
    background: rgba(74, 222, 128, 0.03);
  }

  .ad-table-row-clickable {
    cursor: pointer;
  }

  .ad-table tbody tr:last-child td { border-bottom: none; }

  /* Badges */
  .ad-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .ad-badge-admin   { background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); }
  .ad-badge-donor   { background: rgba(74,222,128,0.12); color: #4ade80; border: 1px solid rgba(74,222,128,0.2); }
  .ad-badge-recipient { background: rgba(251,146,60,0.12); color: #fb923c; border: 1px solid rgba(251,146,60,0.2); }
  .ad-badge-pending { background: rgba(251,146,60,0.12); color: #fb923c; border: 1px solid rgba(251,146,60,0.2); }
  .ad-badge-verified { background: rgba(74,222,128,0.12); color: #4ade80; border: 1px solid rgba(74,222,128,0.2); }
  .ad-badge-flagged { background: rgba(239,68,68,0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
  .ad-badge-withdrawn { background: rgba(148,163,184,0.12); color: #94a3b8; border: 1px solid rgba(148,163,184,0.25); }
  .ad-badge-rejected { background: rgba(239,68,68,0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }

  /* Action Buttons */
  .ad-btn {
    padding: 6px 14px;
    border-radius: 7px;
    font-size: 0.78rem;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-right: 6px;
    border: 1px solid #4ade80;
    background: rgba(74,222,128,0.08);
    color: #4ade80;
  }

  .ad-btn:hover { background: rgba(74,222,128,0.18); transform: translateY(-1px); }

  .ad-btn.danger {
    border-color: #ef4444;
    background: rgba(239,68,68,0.08);
    color: #f87171;
  }

  .ad-btn.danger:hover { background: rgba(239,68,68,0.18); }

  .ad-btn.blue {
    border-color: #60a5fa;
    background: rgba(96,165,250,0.08);
    color: #60a5fa;
  }

  .ad-btn.blue:hover { background: rgba(96,165,250,0.18); }

  /* File link */
  .ad-file-link {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    background: rgba(59,130,246,0.1);
    color: #60a5fa;
    border-radius: 6px;
    text-decoration: none;
    font-size: 0.75rem;
    margin-left: 8px;
    transition: background 0.2s;
  }
  .ad-file-link:hover { background: rgba(59,130,246,0.2); }

  /* Toast */
  .ad-toast {
    position: fixed;
    bottom: 32px;
    right: 32px;
    padding: 14px 20px;
    background: rgba(10,15,13,0.95);
    border: 1px solid rgba(74,222,128,0.3);
    border-radius: 12px;
    color: #4ade80;
    font-size: 0.88rem;
    font-weight: 500;
    z-index: 1000;
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from { transform: translateY(16px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  /* Empty state */
  .ad-empty {
    text-align: center;
    padding: 48px 20px;
    color: #475569;
    font-size: 0.9rem;
  }

  .ad-empty-icon {
    font-size: 2rem;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  /* Spinner */
  .ad-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 12px;
    color: #4ade80;
    font-size: 0.9rem;
  }

  .ad-spinner {
    width: 20px; height: 20px;
    border: 2px solid rgba(74,222,128,0.2);
    border-top-color: #4ade80;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .ad-section-gap { margin-bottom: 32px; }

  .ad-group {
    margin-bottom: 26px;
  }

  .ad-group:last-child {
    margin-bottom: 0;
  }

  .ad-group-note {
    font-size: 0.85rem;
    color: #64748b;
    padding: 10px 0 2px;
  }

  .ad-detail-card {
    margin-top: 24px;
    padding: 20px;
    border: 1px solid rgba(74, 222, 128, 0.2);
    border-radius: 14px;
    background: rgba(74, 222, 128, 0.04);
  }

  .ad-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .ad-detail-title {
    font-size: 1rem;
    color: #e2e8f0;
    font-weight: 600;
  }

  .ad-detail-meta {
    color: #94a3b8;
    font-size: 0.85rem;
  }

  .ad-detail-reason {
    color: #cbd5e1;
    line-height: 1.6;
    margin-top: 8px;
    white-space: pre-wrap;
  }

  .ad-doc-list {
    margin-top: 16px;
    display: grid;
    gap: 10px;
  }

  .ad-doc-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    padding: 10px 12px;
    flex-wrap: wrap;
  }

  .ad-doc-type {
    font-size: 0.78rem;
    color: #4ade80;
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }

  .ad-doc-name {
    color: #e2e8f0;
    font-size: 0.88rem;
  }
`;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [approvedApplications, setApprovedApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');

  useEffect(() => { loadAdminData(); }, []);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData, appsData, approvedAppsData, ledgerData] = await Promise.all([
        adminAPI.getSystemStats(),
        adminAPI.getAllUsers(),
        adminAPI.getPendingApplications(),
        adminAPI.getApprovedApplications(),
        adminAPI.getTransactionLedger('', 20)
      ]);
      setStats(statsData);
      setUsers(usersData.users);
      setApplications(appsData.applications);
      setApprovedApplications(approvedAppsData.applications);
      setLedger(ledgerData.transactions);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const combinedApplications = [...applications, ...approvedApplications];

    if (combinedApplications.length === 0) {
      setSelectedApplication(null);
      return;
    }

    if (!selectedApplication || !combinedApplications.some(app => app.id === selectedApplication.id)) {
      setSelectedApplication(combinedApplications[0]);
    }
  }, [applications, approvedApplications, selectedApplication]);

  const handleFlagTransaction = async (txnId) => {
    try {
      await adminAPI.flagTransaction(txnId, 'Suspicious activity detected');
      setMessage('✓ Transaction flagged for review');
      await loadAdminData();
    } catch (err) { console.error('Error flagging transaction:', err); }
  };

  const handleReviewApplication = async (appId, approved, amount = null) => {
    try {
      await adminAPI.reviewApplication(appId, approved, amount || 0, approved ? 'Application approved' : 'Application rejected');
      setMessage(`✓ Application ${approved ? 'approved' : 'rejected'}`);
      await loadAdminData();
    } catch (err) { console.error('Error reviewing application:', err); }
  };

  const userGroups = [
    { key: 'ADMIN', title: 'Admins', users: users.filter(user => user.role === 'ADMIN') },
    { key: 'DONOR', title: 'Donors', users: users.filter(user => user.role === 'DONOR') },
    { key: 'RECIPIENT', title: 'Recipients', users: users.filter(user => user.role === 'RECIPIENT') },
  ];

  const getApplicationStatusBadgeClass = (status) => {
    if (status === 'APPROVED' || status === 'DISBURSED') return 'ad-badge-verified';
    if (status === 'REJECTED') return 'ad-badge-rejected';
    if (status === 'WITHDRAWN') return 'ad-badge-withdrawn';
    return 'ad-badge-pending';
  };

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="ad-root">
          <div className="ad-bg-pattern" />
          <div className="ad-loading">
            <div className="ad-spinner" />
            Loading system data…
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="ad-root">
        <div className="ad-bg-pattern" />
        <div className="ad-bg-glow" />

        <div className="ad-wrap">
          {/* Header */}
          <div className="ad-header">
            <div className="ad-eyebrow">⚙️ Control Center</div>
            <h1 className="ad-title">Admin <span>Dashboard</span></h1>
            <p className="ad-subtitle">System overview and management center</p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="ad-stats">
              <div className="ad-stat-card">
                <div className="ad-stat-label">Total Users</div>
                <div className="ad-stat-value">{stats.users.total}</div>
                <div className="ad-stat-meta">Admin: {stats.users.admins} · Donor: {stats.users.donors} · Recipient: {stats.users.recipients}</div>
              </div>
              <div className="ad-stat-card">
                <div className="ad-stat-label">Total Donations</div>
                <div className="ad-stat-value">${stats.donations.total}</div>
                <div className="ad-stat-meta">{stats.donations.count} donations received</div>
              </div>
              <div className="ad-stat-card">
                <div className="ad-stat-label">Applications</div>
                <div className="ad-stat-value">{stats.applications.total}</div>
                <div className="ad-stat-meta">Approved: {stats.applications.approved} · Pending: {stats.applications.pending}</div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="ad-tabs">
            {[
              { key: 'overview', label: 'Users Overview' },
              { key: 'applications', label: 'Applications', count: applications.length + approvedApplications.length },
              { key: 'ledger', label: 'Ledger' },
            ].map(t => (
              <button
                key={t.key}
                className={`ad-tab ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
                {t.count > 0 && <span className="ad-tab-count">{t.count}</span>}
              </button>
            ))}
          </div>

          {/* Users Overview */}
          {activeTab === 'overview' && (
            <div className="ad-section">
              <div className="ad-section-title">All Users</div>
              <div className="ad-section-divider" />
              {users.length === 0 ? (
                <div className="ad-empty"><div className="ad-empty-icon">👤</div>No users found</div>
              ) : (
                userGroups.map(group => (
                  <div key={group.key} className="ad-group">
                    <div className="ad-sub-title">{group.title} ({group.users.length})</div>
                    {group.users.length === 0 ? (
                      <div className="ad-group-note">No {group.title.toLowerCase()} found.</div>
                    ) : (
                      <div className="ad-table-wrap">
                        <table className="ad-table">
                          <thead>
                            <tr>
                              <th>Name</th><th>Email</th><th>Status</th><th>Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.users.map(user => (
                              <tr key={user.id}>
                                <td style={{ color: '#f1f5f9', fontWeight: 500 }}>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{user.status}</td>
                                <td>
                                  {user.role === 'DONOR' && `Donated: $${user.totalDonated || 0}`}
                                  {user.role === 'RECIPIENT' && `Apps: ${user.applications || 0}`}
                                  {user.role === 'ADMIN' && 'System access'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Applications */}
          {activeTab === 'applications' && (
            <div className="ad-section">
              <div className="ad-section-title">Application Management</div>
              <div className="ad-section-divider" />

              <div className="ad-section-gap">
                <div className="ad-sub-title">Pending Applications ({applications.length})</div>
                {applications.length === 0 ? (
                  <div className="ad-empty"><div className="ad-empty-icon">📋</div>No pending applications</div>
                ) : (
                  <div className="ad-table-wrap">
                    <table className="ad-table">
                      <thead>
                        <tr><th>Recipient</th><th>Amount</th><th>Reason</th><th>Submitted</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {applications.map(app => (
                          <tr key={app.id} className="ad-table-row-clickable" onClick={() => setSelectedApplication(app)}>
                            <td style={{ color: '#f1f5f9' }}>{app.recipient.name} <span style={{ color: '#475569' }}>({app.recipient.email})</span></td>
                            <td style={{ color: '#4ade80', fontWeight: 600 }}>${app.amount_requested}</td>
                            <td>{app.reason.length > 50 ? `${app.reason.substring(0, 50)}...` : app.reason}</td>
                            <td>{new Date(app.submittedAt).toLocaleDateString()}</td>
                            <td>
                              {app.status === 'WITHDRAWN' ? (
                                <span className="ad-badge ad-badge-withdrawn">Withdrawn</span>
                              ) : (
                                <>
                                  <button className="ad-btn" onClick={(e) => { e.stopPropagation(); handleReviewApplication(app.id, true); }}>Approve</button>
                                  <button className="ad-btn danger" onClick={(e) => { e.stopPropagation(); handleReviewApplication(app.id, false); }}>Reject</button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <div className="ad-sub-title blue">Closed Applications ({approvedApplications.length})</div>
                {approvedApplications.length === 0 ? (
                  <div className="ad-empty"><div className="ad-empty-icon">📁</div>No closed applications yet</div>
                ) : (
                  <div className="ad-table-wrap">
                    <table className="ad-table">
                      <thead>
                        <tr><th>Recipient</th><th>Amount</th><th>Reason</th><th>Closed</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {approvedApplications.map(app => (
                          <tr key={app.id} className="ad-table-row-clickable" onClick={() => setSelectedApplication(app)}>
                            <td style={{ color: '#f1f5f9' }}>{app.recipient.name} <span style={{ color: '#475569' }}>({app.recipient.email})</span></td>
                            <td style={{ color: '#4ade80', fontWeight: 600 }}>${app.amount_requested}</td>
                            <td>{app.reason.length > 50 ? `${app.reason.substring(0, 50)}...` : app.reason}</td>
                            <td>{new Date(app.closedAt).toLocaleDateString()}</td>
                            <td>
                              <span className={`ad-badge ${getApplicationStatusBadgeClass(app.status)}`}>{app.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="ad-detail-card">
                {!selectedApplication ? (
                  <div className="ad-group-note">Click any application row above to view complete details.</div>
                ) : (
                  <>
                    <div className="ad-detail-header">
                      <div className="ad-detail-title">Application Details</div>
                      <span className={`ad-badge ${getApplicationStatusBadgeClass(selectedApplication.status)}`}>
                        {selectedApplication.status}
                      </span>
                    </div>

                    <div className="ad-detail-meta">
                      Recipient: {selectedApplication.recipient.name} ({selectedApplication.recipient.email})
                    </div>
                    <div className="ad-detail-meta">Amount Requested: ${selectedApplication.amount_requested}</div>

                    <div className="ad-detail-reason">{selectedApplication.reason}</div>

                    <div className="ad-sub-title" style={{ marginTop: '16px', marginBottom: '8px' }}>Uploaded Documents</div>
                    {selectedApplication.documents?.length ? (
                      <div className="ad-doc-list">
                        {selectedApplication.documents.map(doc => (
                          <div key={doc.id} className="ad-doc-item">
                            <div>
                              <div className="ad-doc-type">{doc.type.replace(/_/g, ' ')}</div>
                              <div className="ad-doc-name">{doc.fileName}</div>
                              <div className="ad-detail-meta">{doc.status} · {new Date(doc.uploadedAt).toLocaleDateString()}</div>
                            </div>
                            <a
                              href={`http://localhost:5000/uploads/documents/${doc.fileName}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ad-file-link"
                            >
                              ↓ Download
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="ad-group-note">No documents uploaded by this recipient yet.</div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Ledger */}
          {activeTab === 'ledger' && (
            <div className="ad-section">
              <div className="ad-section-title">Transaction Ledger</div>
              <div className="ad-section-divider" />
              {ledger.length === 0 ? (
                <div className="ad-empty"><div className="ad-empty-icon">📒</div>No transactions yet</div>
              ) : (
                <div className="ad-table-wrap">
                  <table className="ad-table">
                    <thead>
                      <tr><th>Transaction ID</th><th>From</th><th>To</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {ledger.map(txn => (
                        <tr key={txn.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#64748b' }}>{txn.transaction_id}</td>
                          <td>{txn.from?.name || 'System'}</td>
                          <td>{txn.to?.name || 'System'}</td>
                          <td>{txn.type}</td>
                          <td style={{ color: '#4ade80', fontWeight: 600 }}>${txn.amount}</td>
                          <td>
                            <span className={`ad-badge ${txn.status === 'FLAGGED' ? 'ad-badge-flagged' : 'ad-badge-verified'}`}>
                              {txn.status}
                            </span>
                          </td>
                          <td>{new Date(txn.createdAt).toLocaleDateString()}</td>
                          <td>
                            {!txn.flagged && (
                              <button className="ad-btn danger" onClick={() => handleFlagTransaction(txn.id)}>Flag</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {message && <div className="ad-toast">{message}</div>}
      </div>
    </>
  );
}