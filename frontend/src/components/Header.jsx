import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=DM+Sans:wght@300;400;500&display=swap');

  .rl-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2.5rem;
    background: rgba(10, 15, 13, 0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    font-family: 'DM Sans', sans-serif;
  }

  .rl-header-brand {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    text-decoration: none;
  }

  .rl-header-dot {
    width: 8px;
    height: 8px;
    background: #4ade80;
    border-radius: 50%;
    box-shadow: 0 0 10px #4ade80;
  }

  .rl-header-name {
    font-family: 'Playfair Display', serif;
    font-size: 1rem;
    font-weight: 600;
    color: #e2e8f0;
    letter-spacing: 0.04em;
  }

  .rl-header-nav {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .rl-header-link {
    padding: 0.45rem 1rem;
    font-size: 0.88rem;
    font-weight: 400;
    color: #94a3b8;
    text-decoration: none;
    border-radius: 7px;
    transition: all 0.2s ease;
  }

  .rl-header-link:hover {
    color: #e2e8f0;
    background: rgba(255,255,255,0.05);
  }

  .rl-header-link.active {
    color: #4ade80;
  }

  .rl-header-btn {
    padding: 0.45rem 1.1rem;
    background: linear-gradient(135deg, #4ade80, #16a34a);
    border: none;
    border-radius: 7px;
    font-size: 0.88rem;
    font-weight: 500;
    color: #052e16;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .rl-header-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 5px 15px rgba(74, 222, 128, 0.3);
  }

  .rl-header-role {
    font-size: 0.78rem;
    color: #4ade80;
    padding: 0.3rem 0.75rem;
    background: rgba(74, 222, 128, 0.08);
    border: 1px solid rgba(74, 222, 128, 0.2);
    border-radius: 20px;
    font-weight: 500;
    letter-spacing: 0.05em;
  }
`;

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <>
      <style>{styles}</style>
      <header className="rl-header">
        <Link to="/" className="rl-header-brand">
          <div className="rl-header-dot" />
          <span className="rl-header-name">Relief Ledger</span>
        </Link>

        <nav className="rl-header-nav">
          {token ? (
            <>
              {role && <span className="rl-header-role">{role}</span>}
              <button className="rl-header-btn" onClick={logout}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`rl-header-link ${location.pathname === '/login' ? 'active' : ''}`}
              >
                Sign In
              </Link>
              <Link to="/register">
                <button className="rl-header-btn">Get Started</button>
              </Link>
            </>
          )}
        </nav>
      </header>
    </>
  );
}