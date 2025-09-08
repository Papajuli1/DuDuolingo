import React, { useState } from 'react';
import './LoginPage.css';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        localStorage.setItem('username', data.username);
        localStorage.setItem('welcomeType', data.status);
        navigate('/');
      }
    } catch (err) {
      setError('Server error');
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1 className="login-title">
          <img src="/DuDuolingo_icon.png" alt="DuDuolingo" className="login-icon" />
          DuDuolingo
        </h1>
        <h2 className="login-subtitle">Login</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            className="login-input"
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <button className="login-button" type="submit">Login</button>
        </form>
        {error && <div className="login-error">{error}</div>}
      </div>
    </div>
  );
}

export default LoginPage;
