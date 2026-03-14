import React, { useEffect, useRef, useState } from 'react';
import recipientAPI from '../api/recipientAPI';

const DOCUMENT_TYPES = [
  { type: 'ID_PROOF', label: 'ID Proof' },
  { type: 'ADDRESS_PROOF', label: 'Address Proof' },
  { type: 'INCOME_PROOF', label: 'Income Proof' },
];

const REQUIRED_DOCUMENT_TYPES = DOCUMENT_TYPES.map(document => document.type);

const getCurrentDocumentsByType = (documents) => documents.reduce((accumulator, document) => {
  if (!accumulator[document.type]) {
    accumulator[document.type] = document;
  }
  return accumulator;
}, {});

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

  .rd-root {
    min-height: 100vh;
    background: #0a0f0d;
    font-family: 'DM Sans', sans-serif;
    color: #f1f5f9;
    position: relative;
    overflow-x: hidden;
  }

  .rd-bg-pattern {
    position: fixed;
    inset: 0;
    opacity: 0.04;
    background-image: radial-gradient(circle at 2px 2px, #4ade80 1px, transparent 0);
    background-size: 32px 32px;
    pointer-events: none;
    z-index: 0;
  }

  .rd-bg-glow {
    position: fixed;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%);
    top: 50%;
    right: -200px;
    transform: translateY(-50%);
    pointer-events: none;
    z-index: 0;
  }

  .rd-wrap {
    position: relative;
    z-index: 1;
    padding: 120px 40px 60px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .rd-header { margin-bottom: 48px; }

  .rd-eyebrow {
    font-size: 0.75rem;
    font-weight: 500;
    color: #4ade80;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: 0.5rem;
  }

  .rd-title {
    font-family: 'Playfair Display', serif;
    font-size: 2.8rem;
    font-weight: 700;
    color: #f8fafc;
    line-height: 1.15;
    margin-bottom: 0.5rem;
  }

  .rd-title span { color: #4ade80; }

  .rd-subtitle {
    font-size: 0.95rem;
    color: #64748b;
    font-weight: 300;
  }

  /* Stats */
  .rd-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }

  .rd-stat-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 24px 28px;
    position: relative;
    overflow: hidden;
    transition: all 0.25s ease;
  }

  .rd-stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, #4ade80, transparent);
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .rd-stat-card:hover {
    border-color: rgba(74,222,128,0.25);
    background: rgba(74,222,128,0.04);
    transform: translateY(-2px);
  }

  .rd-stat-card:hover::before { opacity: 1; }

  .rd-stat-label {
    font-size: 0.72rem;
    font-weight: 500;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 12px;
  }

  .rd-stat-value {
    font-family: 'Playfair Display', serif;
    font-size: 2.4rem;
    font-weight: 700;
    color: #4ade80;
    line-height: 1;
  }

  /* Section */
  .rd-section {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 28px 32px;
    margin-bottom: 24px;
  }

  .rd-section-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.3rem;
    font-weight: 600;
    color: #e2e8f0;
    margin-bottom: 6px;
  }

  .rd-section-divider {
    width: 32px;
    height: 2px;
    background: linear-gradient(90deg, #4ade80, transparent);
    margin-bottom: 24px;
  }

  /* Form */
  .rd-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 480px;
  }

  .rd-field { display: flex; flex-direction: column; gap: 6px; }

  .rd-label {
    font-size: 0.72rem;
    font-weight: 500;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .rd-input, .rd-textarea {
    width: 100%;
    padding: 0.85rem 1rem;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    font-size: 0.92rem;
    color: #f1f5f9;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s ease;
    box-sizing: border-box;
    outline: none;
  }

  .rd-input:focus, .rd-textarea:focus {
    border-color: #4ade80;
    background: rgba(74,222,128,0.04);
    box-shadow: 0 0 0 3px rgba(74,222,128,0.1);
  }

  .rd-input::placeholder, .rd-textarea::placeholder { color: #334155; }

  .rd-textarea {
    resize: vertical;
    min-height: 100px;
  }

  .rd-btn {
    padding: 0.9rem 2rem;
    background: linear-gradient(135deg, #4ade80, #16a34a);
    border: none;
    border-radius: 10px;
    font-size: 0.95rem;
    font-weight: 500;
    color: #052e16;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
    width: fit-content;
    letter-spacing: 0.02em;
  }

  .rd-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(74,222,128,0.35);
  }

  .rd-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* Document upload row */
  .rd-doc-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 480px;
  }

  .rd-doc-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .rd-doc-label {
    font-size: 0.72rem;
    font-weight: 500;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .rd-file-input {
    padding: 10px 14px;
    background: rgba(255,255,255,0.03);
    border: 1px dashed rgba(74,222,128,0.2);
    border-radius: 10px;
    color: #94a3b8;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .rd-file-input:hover {
    border-color: rgba(74,222,128,0.4);
    background: rgba(74,222,128,0.03);
  }

  .rd-file-input-hidden {
    display: none;
  }

  .rd-doc-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding: 14px 16px;
    background: rgba(255,255,255,0.03);
    border: 1px dashed rgba(74,222,128,0.2);
    border-radius: 10px;
  }

  .rd-doc-file {
    font-size: 0.9rem;
    font-weight: 500;
    color: #e2e8f0;
    margin-bottom: 4px;
    word-break: break-word;
  }

  .rd-doc-meta {
    font-size: 0.8rem;
    color: #64748b;
  }

  .rd-doc-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .rd-doc-action {
    padding: 0.65rem 1rem;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .rd-doc-action:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .rd-doc-action-secondary {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: #e2e8f0;
  }

  .rd-doc-action-secondary:hover:not(:disabled) {
    border-color: rgba(74,222,128,0.35);
    color: #4ade80;
  }

  .rd-doc-action-danger {
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.22);
    color: #fca5a5;
  }

  .rd-doc-action-danger:hover:not(:disabled) {
    background: rgba(239,68,68,0.14);
  }

  .rd-doc-submit {
    margin-top: 8px;
  }

  .rd-doc-note {
    font-size: 0.82rem;
    color: #475569;
    margin-bottom: 16px;
  }

  /* Applications list */
  .rd-app-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .rd-app-item:last-child { border-bottom: none; }

  .rd-app-reason {
    font-weight: 500;
    color: #e2e8f0;
    margin-bottom: 5px;
  }

  .rd-app-meta {
    font-size: 0.8rem;
    color: #475569;
  }

  .rd-app-disbursed {
    font-size: 0.82rem;
    color: #4ade80;
    margin-top: 4px;
  }

  .rd-status {
    display: inline-flex;
    align-items: center;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.72rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }

  .rd-status-PENDING   { background: rgba(251,146,60,0.12); color: #fb923c; border: 1px solid rgba(251,146,60,0.2); }
  .rd-status-APPROVED  { background: rgba(74,222,128,0.12); color: #4ade80; border: 1px solid rgba(74,222,128,0.2); }
  .rd-status-REJECTED  { background: rgba(239,68,68,0.12);  color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
  .rd-status-DISBURSED { background: rgba(96,165,250,0.12); color: #60a5fa; border: 1px solid rgba(96,165,250,0.2); }
  .rd-status-WITHDRAWN { background: rgba(148,163,184,0.12); color: #94a3b8; border: 1px solid rgba(148,163,184,0.25); }

  .rd-app-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .rd-link-btn {
    border: 1px solid rgba(239,68,68,0.25);
    background: rgba(239,68,68,0.08);
    color: #fca5a5;
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 0.78rem;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
  }

  .rd-link-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Alerts */
  .rd-success {
    padding: 12px 16px;
    background: rgba(74,222,128,0.08);
    border: 1px solid rgba(74,222,128,0.2);
    border-radius: 10px;
    font-size: 0.88rem;
    color: #86efac;
    margin-bottom: 16px;
  }

  .rd-error {
    padding: 12px 16px;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.2);
    border-radius: 10px;
    font-size: 0.88rem;
    color: #fca5a5;
    margin-bottom: 16px;
  }

  /* Empty */
  .rd-empty {
    text-align: center;
    padding: 40px;
    color: #475569;
    font-size: 0.9rem;
  }

  .rd-empty-icon { font-size: 2rem; margin-bottom: 10px; opacity: 0.5; }

  /* Spinner */
  .rd-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 12px;
    color: #4ade80;
    font-size: 0.9rem;
  }

  .rd-spinner {
    width: 20px; height: 20px;
    border: 2px solid rgba(74,222,128,0.2);
    border-top-color: #4ade80;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 700px) {
    .rd-doc-card {
      flex-direction: column;
      align-items: flex-start;
    }

    .rd-doc-actions {
      width: 100%;
      justify-content: stretch;
    }

    .rd-doc-action {
      flex: 1;
      text-align: center;
    }
  }
`;

export default function RecipientDashboard() {
  const [wallet, setWallet] = useState({ balance: 0, pending: 0, total: 0 });
  const [applications, setApplications] = useState([]);
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [withdrawingApplicationId, setWithdrawingApplicationId] = useState('');
  const [activeDocumentType, setActiveDocumentType] = useState('');
  const [removingDocumentId, setRemovingDocumentId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ amount: '', reason: '' });
  const fileInputRefs = useRef({});

  useEffect(() => { loadRecipientData(); }, []);

  const loadRecipientData = async () => {
    try {
      setLoading(true);
      const [walletData, applicationsData, documentsData] = await Promise.all([
        recipientAPI.getWallet(),
        recipientAPI.getApplications(),
        recipientAPI.getDocuments()
      ]);
      setWallet(walletData);
      setApplications(applicationsData.applications);
      setDocuments(getCurrentDocumentsByType(documentsData.documents));
    } catch (err) {
      setError(err.msg || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async (e) => {
    e?.preventDefault();
    setSubmittingApplication(true);
    setMessage('');
    setError('');
    try {
      const missingDocumentLabels = DOCUMENT_TYPES
        .filter(document => !documents[document.type])
        .map(document => document.label);

      if (missingDocumentLabels.length > 0) {
        setError(`Please upload all required documents first: ${missingDocumentLabels.join(', ')}`);
        return;
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      if (!formData.reason || formData.reason.length < 10) {
        setError('Please provide a detailed reason (minimum 10 characters)');
        return;
      }
      await recipientAPI.submitApplication(parseFloat(formData.amount), formData.reason);
      setMessage('✓ Application submitted successfully! Admin will review it soon.');
      setFormData({ amount: '', reason: '' });
      await loadRecipientData();
    } catch (err) {
      setError(err.msg || 'Failed to submit application');
    } finally {
      setSubmittingApplication(false);
    }
  };

  const handleUploadDocument = async (docType, file) => {
    if (!file) { setError('Please select a file to upload'); return; }
    const allowedTypes = ['application/pdf','image/jpeg','image/jpg','image/png','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only PDF, JPG, PNG, DOC, and DOCX files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large. Maximum size is 5MB.');
      return;
    }
    setActiveDocumentType(docType);
    setMessage('');
    setError('');
    try {
      await recipientAPI.uploadDocument(docType, file);
      setMessage(`✓ Document "${file.name}" uploaded successfully!`);
      await loadRecipientData();
    } catch (err) {
      setError(err.msg || 'Failed to upload document');
    } finally {
      setActiveDocumentType('');
    }
  };

  const handleWithdrawApplication = async (applicationId) => {
    setWithdrawingApplicationId(applicationId);
    setMessage('');
    setError('');
    try {
      await recipientAPI.withdrawApplication(applicationId);
      setMessage('✓ Application withdrawn successfully.');
      await loadRecipientData();
    } catch (err) {
      setError(err.msg || 'Failed to withdraw application');
    } finally {
      setWithdrawingApplicationId('');
    }
  };

  const handleRemoveDocument = async (documentId) => {
    setRemovingDocumentId(documentId);
    setMessage('');
    setError('');
    try {
      await recipientAPI.deleteDocument(documentId);
      setMessage('✓ Document removed successfully. You can upload a replacement any time.');
      await loadRecipientData();
    } catch (err) {
      setError(err.msg || 'Failed to remove document');
    } finally {
      setRemovingDocumentId('');
    }
  };

  const openFilePicker = (docType) => {
    fileInputRefs.current[docType]?.click();
  };

  const isBusy = submittingApplication || Boolean(activeDocumentType) || Boolean(removingDocumentId) || Boolean(withdrawingApplicationId);
  const hasAllRequiredDocuments = REQUIRED_DOCUMENT_TYPES.every(type => Boolean(documents[type]));

  const getStatusClass = (status) => `rd-status rd-status-${status}`;

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="rd-root">
          <div className="rd-bg-pattern" />
          <div className="rd-loading">
            <div className="rd-spinner" />
            Loading your data…
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="rd-root">
        <div className="rd-bg-pattern" />
        <div className="rd-bg-glow" />

        <div className="rd-wrap">
          {/* Header */}
          <div className="rd-header">
            <div className="rd-eyebrow">🤝 Recipient Portal</div>
            <h1 className="rd-title">Recipient <span>Dashboard</span></h1>
            <p className="rd-subtitle">Your funds and applications will appear here.</p>
          </div>

          {/* Wallet Stats */}
          <div className="rd-stats">
            <div className="rd-stat-card">
              <div className="rd-stat-label">Wallet Balance</div>
              <div className="rd-stat-value">${wallet.balance}</div>
            </div>
            <div className="rd-stat-card">
              <div className="rd-stat-label">Pending Funds</div>
              <div className="rd-stat-value">${wallet.pending}</div>
            </div>
            <div className="rd-stat-card">
              <div className="rd-stat-label">Total Received</div>
              <div className="rd-stat-value">${wallet.total}</div>
            </div>
          </div>

          {message && <div className="rd-success">{message}</div>}
          {error && <div className="rd-error">{error}</div>}

          {/* Apply for Aid */}
          <div className="rd-section">
            <div className="rd-section-title">Apply for Relief Aid</div>
            <div className="rd-section-divider" />
            <div className="rd-form">
              <div className="rd-field">
                <label className="rd-label">Amount Requested (USD)</label>
                <input
                  type="number"
                  className="rd-input"
                  placeholder="Enter amount needed"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  min="1"
                  step="0.01"
                  disabled={isBusy}
                />
              </div>
              <div className="rd-field">
                <label className="rd-label">Reason for Request</label>
                <textarea
                  className="rd-textarea"
                  placeholder="Explain why you need this assistance (min 10 characters)"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  disabled={isBusy}
                />
              </div>
            </div>
          </div>

          {/* Upload Documents */}
          <div className="rd-section">
            <div className="rd-section-title">Upload Documents</div>
            <div className="rd-section-divider" />
            <p className="rd-doc-note">Upload required documents for verification — PDF, JPG, PNG, DOC, DOCX · Max 5MB each</p>
            <div className="rd-doc-grid">
              {DOCUMENT_TYPES.map(({ type, label }) => {
                const document = documents[type];
                const isReplacing = activeDocumentType === type;
                const isRemoving = removingDocumentId === document?.id;

                return (
                  <div key={type} className="rd-doc-item">
                    <label className="rd-doc-label">{label}</label>
                    {document ? (
                      <>
                        <div className="rd-doc-card">
                          <div>
                            <div className="rd-doc-file">{document.fileName}</div>
                            <div className="rd-doc-meta">
                              {document.status} · Uploaded {new Date(document.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="rd-doc-actions">
                            <button
                              type="button"
                              className="rd-doc-action rd-doc-action-danger"
                              onClick={() => handleRemoveDocument(document.id)}
                              disabled={isBusy}
                            >
                              {isRemoving ? 'Removing…' : 'Remove'}
                            </button>
                            <button
                              type="button"
                              className="rd-doc-action rd-doc-action-secondary"
                              onClick={() => openFilePicker(type)}
                              disabled={isBusy}
                            >
                              {isReplacing ? 'Replacing…' : 'Replace'}
                            </button>
                          </div>
                        </div>
                        <input
                          type="file"
                          className="rd-file-input-hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          ref={(element) => {
                            fileInputRefs.current[type] = element;
                          }}
                          onChange={(e) => {
                            handleUploadDocument(type, e.target.files[0]);
                            e.target.value = '';
                          }}
                          disabled={isBusy}
                        />
                      </>
                    ) : (
                      <input
                        type="file"
                        className="rd-file-input"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => handleUploadDocument(type, e.target.files[0])}
                        disabled={isBusy}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <button className="rd-btn rd-doc-submit" type="button" onClick={handleSubmitApplication} disabled={isBusy || !hasAllRequiredDocuments}>
              {submittingApplication ? 'Submitting…' : 'Submit Application →'}
            </button>
            {!hasAllRequiredDocuments && (
              <p className="rd-doc-note">Upload ID Proof, Address Proof, and Income Proof to enable application submission.</p>
            )}
          </div>

          {/* My Applications */}
          <div className="rd-section">
            <div className="rd-section-title">My Applications</div>
            <div className="rd-section-divider" />
            {applications.length === 0 ? (
              <div className="rd-empty">
                <div className="rd-empty-icon">📋</div>
                No applications yet. Submit one above to get started.
              </div>
            ) : (
              applications.map(app => (
                <div key={app.id} className="rd-app-item">
                  <div>
                    <div className="rd-app-reason">{app.reason}</div>
                    <div className="rd-app-meta">
                      Requested: ${app.amount_requested} · {new Date(app.createdAt).toLocaleDateString()}
                    </div>
                    {app.amount_disbursed > 0 && (
                      <div className="rd-app-disbursed">Disbursed: ${app.amount_disbursed}</div>
                    )}
                  </div>
                  <div className="rd-app-actions">
                    {app.status === 'PENDING' && (
                      <button
                        type="button"
                        className="rd-link-btn"
                        onClick={() => handleWithdrawApplication(app.id)}
                        disabled={isBusy}
                      >
                        {withdrawingApplicationId === app.id ? 'Withdrawing…' : 'Withdraw'}
                      </button>
                    )}
                    <span className={getStatusClass(app.status)}>{app.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}