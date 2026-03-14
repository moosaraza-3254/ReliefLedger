import React, { useState, useEffect } from 'react';
import donorAPI from '../api/donorAPI';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

  .dd-root {
    min-height: 100vh;
    background: #0a0f0d;
    font-family: 'DM Sans', sans-serif;
    color: #f1f5f9;
    position: relative;
    overflow-x: hidden;
  }

  .dd-bg-pattern {
    position: fixed;
    inset: 0;
    opacity: 0.04;
    background-image: radial-gradient(circle at 2px 2px, #4ade80 1px, transparent 0);
    background-size: 32px 32px;
    pointer-events: none;
    z-index: 0;
  }

  .dd-bg-glow {
    position: fixed;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%);
    bottom: -150px;
    left: -150px;
    pointer-events: none;
    z-index: 0;
  }

  .dd-wrap {
    position: relative;
    z-index: 1;
    padding: 120px 40px 60px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .dd-header { margin-bottom: 48px; }

  .dd-eyebrow {
    font-size: 0.75rem;
    font-weight: 500;
    color: #4ade80;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: 0.5rem;
  }

  .dd-title {
    font-family: 'Playfair Display', serif;
    font-size: 2.8rem;
    font-weight: 700;
    color: #f8fafc;
    line-height: 1.15;
    margin-bottom: 0.5rem;
  }

  .dd-title span { color: #4ade80; }

  .dd-subtitle {
    font-size: 0.95rem;
    color: #64748b;
    font-weight: 300;
  }

  /* Stats */
  .dd-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }

  .dd-stat-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 24px 28px;
    position: relative;
    overflow: hidden;
    transition: all 0.25s ease;
  }

  .dd-stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, #4ade80, transparent);
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .dd-stat-card:hover {
    border-color: rgba(74,222,128,0.25);
    background: rgba(74,222,128,0.04);
    transform: translateY(-2px);
  }

  .dd-stat-card:hover::before { opacity: 1; }

  .dd-stat-label {
    font-size: 0.72rem;
    font-weight: 500;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 12px;
  }

  .dd-stat-value {
    font-family: 'Playfair Display', serif;
    font-size: 2.4rem;
    font-weight: 700;
    color: #4ade80;
    line-height: 1;
  }

  /* Section */
  .dd-section {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 28px 32px;
    margin-bottom: 24px;
  }

  .dd-section-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.3rem;
    font-weight: 600;
    color: #e2e8f0;
    margin-bottom: 6px;
  }

  .dd-section-divider {
    width: 32px;
    height: 2px;
    background: linear-gradient(90deg, #4ade80, transparent);
    margin-bottom: 24px;
  }

  /* Form */
  .dd-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 480px;
  }

  .dd-field { display: flex; flex-direction: column; gap: 6px; }

  .dd-label {
    font-size: 0.72rem;
    font-weight: 500;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .dd-input-wrap { position: relative; }

  .dd-input {
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

  .dd-input:focus {
    border-color: #4ade80;
    background: rgba(74,222,128,0.04);
    box-shadow: 0 0 0 3px rgba(74,222,128,0.1);
  }

  .dd-input::placeholder { color: #334155; }

  .dd-btn {
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

  .dd-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(74,222,128,0.35);
  }

  .dd-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* History list */
  .dd-list { list-style: none; margin: 0; padding: 0; }

  .dd-list-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 18px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .dd-list-item:last-child { border-bottom: none; }

  .dd-donation-amount {
    font-family: 'Playfair Display', serif;
    font-size: 1.15rem;
    font-weight: 600;
    color: #4ade80;
    margin-bottom: 4px;
  }

  .dd-donation-meta {
    font-size: 0.8rem;
    color: #475569;
  }

  .dd-donation-msg {
    font-size: 0.85rem;
    color: #94a3b8;
    font-style: italic;
    margin-top: 4px;
  }

  .dd-receipt-btn {
    padding: 6px 14px;
    background: rgba(74,222,128,0.08);
    border: 1px solid rgba(74,222,128,0.25);
    color: #4ade80;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.75rem;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .dd-receipt-btn:hover { background: rgba(74,222,128,0.15); }

  /* Alerts */
  .dd-success {
    padding: 12px 16px;
    background: rgba(74,222,128,0.08);
    border: 1px solid rgba(74,222,128,0.2);
    border-radius: 10px;
    font-size: 0.88rem;
    color: #86efac;
    margin-bottom: 16px;
  }

  .dd-error {
    padding: 12px 16px;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.2);
    border-radius: 10px;
    font-size: 0.88rem;
    color: #fca5a5;
    margin-bottom: 16px;
  }

  /* Empty state */
  .dd-empty {
    text-align: center;
    padding: 40px;
    color: #475569;
    font-size: 0.9rem;
  }

  .dd-empty-icon { font-size: 2rem; margin-bottom: 10px; opacity: 0.5; }

  /* Spinner */
  .dd-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 12px;
    color: #4ade80;
    font-size: 0.9rem;
  }

  .dd-spinner {
    width: 20px; height: 20px;
    border: 2px solid rgba(74,222,128,0.2);
    border-top-color: #4ade80;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
`;

export default function DonorDashboard() {
  const [donations, setDonations] = useState({ totalDonated: 0, donationCount: 0 });
  const [donationHistory, setDonationHistory] = useState([]);
  const [approvedApplications, setApprovedApplications] = useState([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadDonationData(); }, []);

  const loadDonationData = async () => {
    try {
      setLoading(true);
      const [historyData, approvedData] = await Promise.all([
        donorAPI.getDonationHistory(),
        donorAPI.getApprovedApplications()
      ]);

      setDonations({ totalDonated: historyData.totalDonated, donationCount: historyData.donationCount });
      setDonationHistory(historyData.donations);
      setApprovedApplications(approvedData.applications);

      if (approvedData.applications.length > 0) {
        setSelectedApplicationId(current => current || approvedData.applications[0].id);
      } else {
        setSelectedApplicationId('');
      }
    } catch (err) {
      setError(err.msg || 'Failed to load donation data');
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');
    try {
      if (!selectedApplicationId) {
        setError('Please select an approved application to fund');
        return;
      }

      if (!donationAmount || parseFloat(donationAmount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      const selectedApplication = approvedApplications.find(application => application.id === selectedApplicationId);
      if (!selectedApplication) {
        setError('Selected application is no longer available');
        return;
      }

      if (parseFloat(donationAmount) > selectedApplication.remaining_amount) {
        setError(`Maximum allowed amount is $${selectedApplication.remaining_amount}`);
        return;
      }

      const result = await donorAPI.makeDonation(selectedApplicationId, parseFloat(donationAmount), donationMessage);
      setMessage(`✓ Donation of $${donationAmount} sent to ${result.donation.recipient.name}. Receipt: ${result.donation.receipt_id}`);
      setDonationAmount('');
      setDonationMessage('');
      await loadDonationData();
    } catch (err) {
      setError(err.msg || 'Failed to process donation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="dd-root">
          <div className="dd-bg-pattern" />
          <div className="dd-loading">
            <div className="dd-spinner" />
            Loading donation data…
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="dd-root">
        <div className="dd-bg-pattern" />
        <div className="dd-bg-glow" />

        <div className="dd-wrap">
          {/* Header */}
          <div className="dd-header">
            <div className="dd-eyebrow">💚 Donor Portal</div>
            <h1 className="dd-title">Donor <span>Dashboard</span></h1>
            <p className="dd-subtitle">Thank you for your generosity — track your impact here.</p>
          </div>

          {/* Stats */}
          <div className="dd-stats">
            <div className="dd-stat-card">
              <div className="dd-stat-label">Total Donated</div>
              <div className="dd-stat-value">${donations.totalDonated}</div>
            </div>
            <div className="dd-stat-card">
              <div className="dd-stat-label">Donations Made</div>
              <div className="dd-stat-value">{donations.donationCount}</div>
            </div>
          </div>

          {/* Donate Form */}
          <div className="dd-section">
            <div className="dd-section-title">Fund Approved Recipient Applications</div>
            <div className="dd-section-divider" />
            {message && <div className="dd-success">{message}</div>}
            {error && <div className="dd-error">{error}</div>}
            {approvedApplications.length === 0 ? (
              <div className="dd-empty">
                <div className="dd-empty-icon">🕒</div>
                No approved applications are waiting for donor funding right now.
              </div>
            ) : (
              <>
                <ul className="dd-list" style={{ marginBottom: '16px' }}>
                  {approvedApplications.map(application => (
                    <li key={application.id} className="dd-list-item" style={{ alignItems: 'center' }}>
                      <div>
                        <div className="dd-donation-amount" style={{ fontSize: '1rem' }}>{application.recipient.name}</div>
                        <div className="dd-donation-meta">
                          Needs ${application.amount_requested} · Funded ${application.funded_amount} · Remaining ${application.remaining_amount}
                        </div>
                        <div className="dd-donation-msg" style={{ fontStyle: 'normal' }}>{application.reason}</div>
                      </div>
                    </li>
                  ))}
                </ul>

            <form className="dd-form" onSubmit={handleDonate}>
              <div className="dd-field">
                <label className="dd-label">Select Approved Application</label>
                <div className="dd-input-wrap">
                  <select
                    className="dd-input"
                    value={selectedApplicationId}
                    onChange={(e) => setSelectedApplicationId(e.target.value)}
                    disabled={submitting}
                  >
                    {approvedApplications.map(application => (
                      <option key={application.id} value={application.id}>
                        {application.recipient.name} - Remaining ${application.remaining_amount}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="dd-field">
                <label className="dd-label">Amount (USD)</label>
                <div className="dd-input-wrap">
                  <input
                    type="number"
                    className="dd-input"
                    placeholder="Enter donation amount"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    min="1"
                    step="0.01"
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="dd-field">
                <label className="dd-label">Message (Optional)</label>
                <div className="dd-input-wrap">
                  <input
                    type="text"
                    className="dd-input"
                    placeholder="Leave a message with your donation"
                    value={donationMessage}
                    onChange={(e) => setDonationMessage(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
              <button className="dd-btn" type="submit" disabled={submitting}>
                {submitting ? 'Processing…' : 'Send Direct Donation →'}
              </button>
            </form>
              </>
            )}
          </div>

          {/* History */}
          <div className="dd-section">
            <div className="dd-section-title">Donation History</div>
            <div className="dd-section-divider" />
            {donationHistory.length === 0 ? (
              <div className="dd-empty">
                <div className="dd-empty-icon">💚</div>
                No donations yet. Start making a difference today!
              </div>
            ) : (
              <ul className="dd-list">
                {donationHistory.map(donation => (
                  <li key={donation.id} className="dd-list-item">
                    <div>
                      <div className="dd-donation-amount">${donation.amount}</div>
                      <div className="dd-donation-meta">
                        {new Date(donation.date).toLocaleDateString()} · {donation.status}
                        {donation.recipient ? ` · Recipient: ${donation.recipient.name}` : ''}
                      </div>
                      {donation.message && (
                        <div className="dd-donation-msg">"{donation.message}"</div>
                      )}
                    </div>
                    <button className="dd-receipt-btn">
                      {donation.receipt_id}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}