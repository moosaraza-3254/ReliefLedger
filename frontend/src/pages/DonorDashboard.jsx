import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
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

  .dd-receipt-panel {
    margin-top: 18px;
    padding: 16px;
    background: rgba(15,23,42,0.55);
    border: 1px solid rgba(74,222,128,0.2);
    border-radius: 12px;
  }

  .dd-receipt-title {
    font-size: 0.82rem;
    color: #a7f3d0;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .dd-receipt-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 8px 16px;
    margin-bottom: 14px;
    font-size: 0.86rem;
    color: #cbd5e1;
  }

  .dd-receipt-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

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

  .dd-chat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    width: 100%;
  }

  .dd-chat-btn {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid rgba(74,222,128,0.25);
    background: rgba(74,222,128,0.08);
    color: #86efac;
    font-size: 0.8rem;
    cursor: pointer;
    white-space: nowrap;
  }

  .dd-chat-btn:hover {
    background: rgba(74,222,128,0.16);
  }

  .dd-chat-panel {
    border: 1px solid rgba(74,222,128,0.18);
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.45);
    padding: 16px;
  }

  .dd-chat-title {
    font-size: 0.9rem;
    color: #a7f3d0;
    margin-bottom: 8px;
  }

  .dd-chat-list {
    max-height: 280px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
    scrollbar-width: thin;
    scrollbar-color: rgba(74,222,128,0.55) rgba(255,255,255,0.06);
  }

  .dd-chat-list::-webkit-scrollbar {
    width: 10px;
  }

  .dd-chat-list::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.06);
    border-radius: 999px;
  }

  .dd-chat-list::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(74,222,128,0.7), rgba(22,163,74,0.7));
    border-radius: 999px;
    border: 2px solid rgba(8,15,13,0.8);
  }

  .dd-chat-list::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, rgba(134,239,172,0.85), rgba(74,222,128,0.85));
  }

  .dd-chat-msg {
    padding: 8px 10px;
    border-radius: 10px;
    font-size: 0.86rem;
    max-width: 85%;
  }

  .dd-chat-msg.me {
    align-self: flex-end;
    background: rgba(74,222,128,0.2);
    border: 1px solid rgba(74,222,128,0.25);
    color: #dcfce7;
  }

  .dd-chat-msg.other {
    align-self: flex-start;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    color: #e2e8f0;
  }

  .dd-chat-meta {
    font-size: 0.7rem;
    color: #64748b;
    margin-bottom: 4px;
  }

  .dd-chat-form {
    display: flex;
    gap: 8px;
  }

  .dd-chat-form .dd-input {
    margin: 0;
  }

  .dd-chat-send {
    padding: 0 14px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #4ade80, #16a34a);
    color: #052e16;
    font-weight: 600;
    cursor: pointer;
  }
`;

export default function DonorDashboard() {
  const [donations, setDonations] = useState({ totalDonated: 0, donationCount: 0 });
  const [donationHistory, setDonationHistory] = useState([]);
  const [approvedApplications, setApprovedApplications] = useState([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [chatThreads, setChatThreads] = useState([]);
  const [activeChatThread, setActiveChatThread] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [openingApplicationId, setOpeningApplicationId] = useState('');
  const socketRef = useRef(null);
  const chatListRef = useRef(null);
  const activeChatThreadIdRef = useRef(null);

  useEffect(() => { loadDonationData(); }, []);

  useEffect(() => {
    activeChatThreadIdRef.current = activeChatThread?.id ?? null;
  }, [activeChatThread]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return undefined;
    }

    const socket = io(process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000', {
      auth: { token }
    });

    socket.on('chat:new-message', ({ threadId, message: incomingMessage }) => {
      setChatThreads((current) => current
        .map((thread) => (thread.id === threadId ? { ...thread, last_message_at: incomingMessage.createdAt } : thread))
        .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at)));

      setChatMessages((current) => {
        if (activeChatThreadIdRef.current !== threadId) {
          return current;
        }
        if (current.some((item) => String(item.id) === String(incomingMessage.id))) {
          return current;
        }
        return [...current, incomingMessage];
      });
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!activeChatThread) {
      return;
    }

    const element = chatListRef.current;
    if (!element) {
      return;
    }

    element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
  }, [chatMessages, activeChatThread]);

  const loadDonationData = async () => {
    try {
      setLoading(true);
      const [historyData, approvedData, chatsData] = await Promise.all([
        donorAPI.getDonationHistory(),
        donorAPI.getApprovedApplications(),
        donorAPI.getChats()
      ]);

      setDonations({ totalDonated: historyData.totalDonated, donationCount: historyData.donationCount });
      setDonationHistory(historyData.donations);
      setApprovedApplications(approvedData.applications);
      setChatThreads(chatsData.chats || []);

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

      if (!paymentReference.trim()) {
        setError('Please enter payment transaction reference');
        return;
      }
      if (!paymentProofFile) {
        setError('Please upload payment proof screenshot');
        return;
      }

      const result = await donorAPI.makeDonation({
        application_id: selectedApplicationId,
        amount: parseFloat(donationAmount),
        message: donationMessage,
        payment_reference: paymentReference.trim(),
        proof_image: paymentProofFile
      });
      setMessage(`✓ Donation of $${donationAmount} sent to ${result.donation.recipient.name}. Receipt: ${result.donation.receipt_id}`);
      setActiveReceipt({
        receipt_id: result.donation.receipt_id,
        amount: result.donation.amount,
        date: result.donation.date,
        status: result.donation.status,
        recipient: result.donation.recipient,
        message: donationMessage,
        payment_reference: result.donation.payment_reference,
        payment_method: result.donation.payment_method
      });
      setDonationAmount('');
      setDonationMessage('');
      setPaymentReference('');
      setPaymentProofFile(null);
      await loadDonationData();
    } catch (err) {
      setError(err.msg || 'Failed to process donation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReceipt = async (receiptId) => {
    try {
      setError('');
      const receipt = await donorAPI.getReceipt(receiptId);
      setActiveReceipt(receipt);
    } catch (err) {
      setError(err.msg || 'Failed to fetch receipt');
    }
  };

  const handleExportReceipt = async (receiptId) => {
    try {
      setError('');
      const blob = await donorAPI.exportReceipt(receiptId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${receiptId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.msg);
    }
  };

  const handleOpenChat = async (application) => {
    try {
      setError('');
      setOpeningApplicationId(application.id);
      setChatLoading(true);
      const started = await donorAPI.startChat(application.id);
      const thread = started.thread;

      setChatThreads((current) => {
        const existing = current.find((item) => item.id === thread.id);
        if (existing) {
          return current.map((item) => (item.id === thread.id ? thread : item));
        }
        return [thread, ...current];
      });

      setActiveChatThread(thread);
      const data = await donorAPI.getChatMessages(thread.id);
      setChatMessages(data.messages || []);
    } catch (err) {
      setError(err.msg || 'Failed to open chat');
    } finally {
      setChatLoading(false);
      setOpeningApplicationId('');
    }
  };

  const openExistingChat = async (thread) => {
    if (activeChatThread && activeChatThread.id === thread.id) {
      setActiveChatThread(null);
      setChatMessages([]);
      return;
    }

    try {
      setError('');
      setChatLoading(true);
      setActiveChatThread(thread);
      const data = await donorAPI.getChatMessages(thread.id);
      setChatMessages(data.messages || []);
    } catch (err) {
      setError(err.msg || 'Failed to load chat messages');
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!activeChatThread || !chatInput.trim()) {
      return;
    }

    try {
      const payload = await donorAPI.sendChatMessage(activeChatThread.id, chatInput.trim());
      setChatMessages((current) => {
        if (current.some((item) => String(item.id) === String(payload.message.id))) {
          return current;
        }
        return [...current, payload.message];
      });
      setChatInput('');
    } catch (err) {
      setError(err.msg || 'Failed to send message');
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
            {activeReceipt && (
              <div className="dd-receipt-panel">
                <div className="dd-receipt-title">Donation Receipt</div>
                <div className="dd-receipt-grid">
                  <div><strong>Receipt ID:</strong> {activeReceipt.receipt_id}</div>
                  <div><strong>Date:</strong> {new Date(activeReceipt.date).toLocaleString()}</div>
                  <div><strong>Amount(USD):</strong> ${activeReceipt.amount}</div>
                  <div><strong>Status:</strong> {activeReceipt.status}</div>
                  <div><strong>Recipient:</strong> {activeReceipt.recipient?.name || 'N/A'}</div>
                  <div><strong>Method:</strong> {activeReceipt.payment_method || 'N/A'}</div>
                  <div><strong>Payment Ref:</strong> {activeReceipt.payment_reference || 'N/A'}</div>
                  <div><strong>Message:</strong> {activeReceipt.message || 'No message'}</div>
                </div>
                <div className="dd-receipt-actions">
                  <button
                    type="button"
                    className="dd-receipt-btn"
                    onClick={() => handleExportReceipt(activeReceipt.receipt_id)}
                  >
                    Export Receipt
                  </button>
                </div>
              </div>
            )}
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
                      <div className="dd-chat-row">
                        <div>
                          <div className="dd-donation-amount" style={{ fontSize: '1rem' }}>{application.recipient.name}</div>
                          <div className="dd-donation-meta">
                            Needs ${application.amount_requested} · Funded ${application.funded_amount} · Remaining ${application.remaining_amount}
                          </div>
                          <div className="dd-donation-msg" style={{ fontStyle: 'normal' }}>
                            Payment: {application.payment_details?.method} · {application.payment_details?.account_title} · {application.payment_details?.account_number}
                          </div>
                          <div className="dd-donation-msg" style={{ fontStyle: 'normal' }}>{application.reason}</div>
                        </div>
                        <button
                          type="button"
                          className="dd-chat-btn"
                          onClick={() => handleOpenChat(application)}
                          disabled={openingApplicationId === application.id}
                        >
                          {openingApplicationId === application.id ? 'Opening…' : 'Chat'}
                        </button>
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
                <label className="dd-label">Payment Reference ID</label>
                <div className="dd-input-wrap">
                  <input
                    type="text"
                    className="dd-input"
                    placeholder="Enter JazzCash/EasyPaisa transaction reference"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="dd-field">
                <label className="dd-label">Upload Payment Proof</label>
                <div className="dd-input-wrap">
                  <input
                    type="file"
                    className="dd-input"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)}
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

          <div className="dd-section">
            <div className="dd-section-title">Recipient Chats</div>
            <div className="dd-section-divider" />
            {chatThreads.length === 0 ? (
              <div className="dd-empty">Use the Chat button above to start a conversation with an approved recipient.</div>
            ) : (
              <>
                <div className="dd-receipt-actions" style={{ marginBottom: '12px' }}>
                  {chatThreads.map((thread) => (
                    <button
                      key={thread.id}
                      type="button"
                      className="dd-receipt-btn"
                      onClick={() => openExistingChat(thread)}
                    >
                      {thread.recipient?.name || 'Recipient'}
                    </button>
                  ))}
                </div>

                {activeChatThread && (
                  <div className="dd-chat-panel">
                    <div className="dd-chat-title">Chat with {activeChatThread.recipient?.name || 'Recipient'}</div>
                    <div className="dd-chat-list" ref={chatListRef}>
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`dd-chat-msg ${msg.sender?.role === 'DONOR' ? 'me' : 'other'}`}
                        >
                          <div className="dd-chat-meta">
                            {msg.sender?.name || msg.sender?.role} · {new Date(msg.createdAt).toLocaleString()}
                          </div>
                          <div>{msg.text}</div>
                        </div>
                      ))}
                    </div>
                    <form className="dd-chat-form" onSubmit={handleSendChatMessage}>
                      <input
                        className="dd-input"
                        type="text"
                        value={chatInput}
                        placeholder="Type a message"
                        onChange={(e) => setChatInput(e.target.value)}
                      />
                      <button type="submit" className="dd-chat-send">Send</button>
                    </form>
                  </div>
                )}
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
                        {donation.payment_reference ? ` · Ref: ${donation.payment_reference}` : ''}
                      </div>
                      {donation.message && (
                        <div className="dd-donation-msg">"{donation.message}"</div>
                      )}
                    </div>
                    <div className="dd-receipt-actions">
                      <button
                        type="button"
                        className="dd-receipt-btn"
                        onClick={() => handleViewReceipt(donation.receipt_id)}
                      >
                        View {donation.receipt_id}
                      </button>
                      <button
                        type="button"
                        className="dd-receipt-btn"
                        onClick={() => handleExportReceipt(donation.receipt_id)}
                      >
                        Export
                      </button>
                    </div>
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