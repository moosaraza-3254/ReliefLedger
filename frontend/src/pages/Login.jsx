import React, { useState } from 'react';
import axios from '../api';
import { useNavigate, Link } from 'react-router-dom';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

  .rl-root {
    min-height: 100vh;
    display: flex;
    font-family: 'DM Sans', sans-serif;
    background: #0a0f0d;
    overflow: hidden;
    position: relative;
  }

  .rl-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 4rem 5rem;
    position: relative;
    z-index: 2;
  }

  .rl-right {
    width: 45%;
    position: relative;
    overflow: hidden;
  }

  .rl-right-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #1a3a2a 0%, #0d2018 40%, #071510 100%);
  }

  .rl-right-pattern {
    position: absolute;
    inset: 0;
    opacity: 0.07;
    background-image: radial-gradient(circle at 2px 2px, #4ade80 1px, transparent 0);
    background-size: 32px 32px;
  }

  .rl-right-glow {
    position: absolute;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(74, 222, 128, 0.15) 0%, transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: pulse 4s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
  }

  .rl-right-content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 3rem;
    text-align: center;
  }

  .rl-right-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #4ade80, #16a34a);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
    font-size: 2rem;
    box-shadow: 0 20px 60px rgba(74, 222, 128, 0.3);
    animation: float 3s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  .rl-right-title {
    font-family: 'Playfair Display', serif;
    font-size: 2.2rem;
    font-weight: 700;
    color: #f0fdf4;
    line-height: 1.2;
    margin-bottom: 1rem;
  }

  .rl-right-subtitle {
    font-size: 0.95rem;
    color: #6ee7a0;
    line-height: 1.7;
    max-width: 280px;
    font-weight: 300;
  }

  .rl-divider {
    width: 40px;
    height: 2px;
    background: linear-gradient(90deg, #4ade80, transparent);
    margin: 1.5rem auto;
  }



  .rl-heading {
    font-family: 'Playfair Display', serif;
    font-size: 2.8rem;
    font-weight: 700;
    color: #f8fafc;
    line-height: 1.15;
    margin-bottom: 0.75rem;
  }

  .rl-heading span {
    color: #4ade80;
  }

  .rl-subheading {
    font-size: 0.95rem;
    color: #94a3b8;
    font-weight: 300;
    margin-bottom: 2.5rem;
  }

  .rl-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    max-width: 380px;
  }

  .rl-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .rl-label {
    font-size: 0.8rem;
    font-weight: 500;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .rl-input-wrap {
    position: relative;
  }

  .rl-input {
    width: 100%;
    padding: 0.85rem 1rem 0.85rem 2.75rem;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    font-size: 0.95rem;
    color: #f1f5f9;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s ease;
    box-sizing: border-box;
    outline: none;
  }

  .rl-input:focus {
    border-color: #4ade80;
    background: rgba(74, 222, 128, 0.05);
    box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.1);
  }

  .rl-input::placeholder { color: #475569; }

  .rl-input-icon {
    position: absolute;
    left: 0.9rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1rem;
    opacity: 0.5;
  }

  .rl-btn {
    padding: 0.9rem;
    background: linear-gradient(135deg, #4ade80, #16a34a);
    border: none;
    border-radius: 10px;
    font-size: 0.95rem;
    font-weight: 500;
    color: #052e16;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 0.5rem;
    letter-spacing: 0.02em;
  }

  .rl-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(74, 222, 128, 0.35);
  }

  .rl-btn:active { transform: translateY(0); }

  .rl-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .rl-footer {
    margin-top: 1.5rem;
    font-size: 0.88rem;
    color: #64748b;
  }

  .rl-footer a {
    color: #4ade80;
    text-decoration: none;
    font-weight: 500;
  }

  .rl-footer a:hover { text-decoration: underline; }

  .rl-error {
    padding: 0.75rem 1rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 8px;
    font-size: 0.85rem;
    color: #fca5a5;
  }

  @media (max-width: 768px) {
    .rl-right { display: none; }
    .rl-left { padding: 2rem; }
    .rl-heading { font-size: 2rem; }
  }
`;

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
      if (role === 'ADMIN') navigate('/admin-dashboard', { replace: true });
      else if (role === 'DONOR') navigate('/donor-dashboard', { replace: true });
      else if (role === 'RECIPIENT') navigate('/recipient-dashboard', { replace: true });
    }
  }, []);

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      if (res.data.role === 'ADMIN') navigate('/admin-dashboard', { replace: true });
      else if (res.data.role === 'DONOR') navigate('/donor-dashboard', { replace: true });
      else if (res.data.role === 'RECIPIENT') navigate('/recipient-dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="rl-root">
        <div className="rl-left">
          <h1 className="rl-heading">
            Welcome<br /><span>back.</span>
          </h1>
          <p className="rl-subheading">Sign in to continue your mission</p>

          <form className="rl-form" onSubmit={onSubmit}>
            {error && <div className="rl-error">{error}</div>}

            <div className="rl-field">
              <label className="rl-label">Email Address</label>
              <div className="rl-input-wrap">
                <span className="rl-input-icon">✉</span>
                <input
                  className="rl-input"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={onChange}
                  required
                />
              </div>
            </div>

            <div className="rl-field">
              <label className="rl-label">Password</label>
              <div className="rl-input-wrap">
                <span className="rl-input-icon">🔒</span>
                <input
                  className="rl-input"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={onChange}
                  required
                />
              </div>
            </div>

            <button className="rl-btn" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <p className="rl-footer">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>

        <div className="rl-right">
          <div className="rl-right-bg" />
          <div className="rl-right-pattern" />
          <div className="rl-right-glow" />
          <div className="rl-right-content">
            <div className="rl-right-icon">🌿</div>
            <h2 className="rl-right-title">Aid that reaches<br />those who need it</h2>
            <div className="rl-divider" />
            <p className="rl-right-subtitle">
              Transparent, accountable, and efficient relief distribution for communities in need.
            </p>

          </div>
        </div>
      </div>
    </>
  );
}