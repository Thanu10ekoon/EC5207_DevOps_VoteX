import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export default function App() {
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      setView('dashboard');
    }
  }, [token]);

  function submit(e) {
    e.preventDefault();
    setMessage('');
    const path = view === 'login' ? 'login' : 'register';
    fetch(`${API_URL}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || data.message || 'Error');
      if (view === 'login') {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setView('dashboard');
      } else {
        setMessage('Registration successful! Please login.');
        setView('login');
        setPassword('');
      }
    }).catch(err => setMessage(err.message));
  }

  function logout() {
    setToken('');
    localStorage.removeItem('token');
    setView('login');
    setEmail('');
    setPassword('');
  }

  if (view === 'dashboard' && token) {
    return <Dashboard token={token} onLogout={logout} />;
  }

  return (
    <div className="app-container">
      <div className="brand">
        <h1>VoteX</h1>
        <small>Create and vote on polls</small>
      </div>

      <div className="auth-toggle">
        <button
          className={view === 'login' ? 'active' : ''}
          onClick={() => { setView('login'); setMessage(''); }}
        >
          Login
        </button>
        <button
          className={view === 'register' ? 'active' : ''}
          onClick={() => { setView('register'); setMessage(''); }}
        >
          Register
        </button>
      </div>

      <form onSubmit={submit}>
        <label>Email
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label>Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        <button type="submit">{view === 'login' ? 'Login' : 'Register'}</button>
      </form>

      {message && <div className={message.includes('successful') ? 'success' : 'error'}>{message}</div>}
    </div>
  );
}
