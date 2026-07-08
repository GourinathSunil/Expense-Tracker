import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [route, setRoute] = useState(window.location.hash || '#dashboard');

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#dashboard');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Redirect to login if not authenticated and not on register page
  useEffect(() => {
    if (!token && route !== '#register') {
      window.location.hash = '#login';
    } else if (token && (route === '#login' || route === '#register')) {
      window.location.hash = '#dashboard';
    }
  }, [token, route]);

  const handleLoginSuccess = (jwtToken, userData) => {
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    window.location.hash = '#dashboard';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    window.location.hash = '#login';
  };

  const renderNavbar = () => {
    if (!token) return null;

    return (
      <nav className="navbar">
        <div className="navbar-container">
          <a href="#dashboard" className="navbar-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-color)' }}>
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            ExpenseTracker
          </a>
          
          <div className="navbar-links">
            <a href="#dashboard" className={`navbar-link ${route === '#dashboard' ? 'active' : ''}`}>
              Dashboard
            </a>
            <a href="#transactions" className={`navbar-link ${route === '#transactions' ? 'active' : ''}`}>
              Transactions
            </a>
            <a href="#analytics" className={`navbar-link ${route === '#analytics' ? 'active' : ''}`}>
              Analytics
            </a>
          </div>

          <div className="navbar-user">
            <span className="username-display">Hi, <strong>{user?.username}</strong></span>
            <button className="btn btn-secondary btn-small" onClick={handleLogout} style={{ padding: '0.35rem 0.7rem' }}>
              Logout
            </button>
          </div>
        </div>
      </nav>
    );
  };

  const renderPage = () => {
    if (!token) {
      if (route === '#register') {
        return <Register onSwitchToLogin={() => window.location.hash = '#login'} />;
      }
      return <Login onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => window.location.hash = '#register'} />;
    }

    switch (route) {
      case '#dashboard':
        return <Dashboard token={token} />;
      case '#transactions':
        return <Transactions token={token} />;
      case '#analytics':
        return <Analytics token={token} />;
      default:
        return <Dashboard token={token} />;
    }
  };

  return (
    <div className="app-container">
      {renderNavbar()}
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}
