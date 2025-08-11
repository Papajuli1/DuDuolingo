import React, { useState } from 'react';
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
    <div className="login-page" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #58cc02 0%, #1cb0f6 100%)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        padding: '40px 32px',
        minWidth: '320px',
        maxWidth: '90vw',
        textAlign: 'center',
      }}>
        <h1 style={{color:'#58cc02', marginBottom:'16px', fontSize:'2.2rem'}}>DuDuolingo</h1>
        <h2 style={{color:'#1cb0f6', marginBottom:'24px', fontWeight:'normal'}}>Login</h2>
        <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'18px'}}>
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{
              padding: '12px 16px',
              fontSize: '1.1rem',
              borderRadius: '8px',
              border: '2px solid #eee',
              outline: 'none',
              marginBottom: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'border 0.2s',
            }}
            onFocus={e => e.target.style.border = '2px solid #58cc02'}
            onBlur={e => e.target.style.border = '2px solid #eee'}
          />
          <button type="submit" style={{
            background: 'linear-gradient(90deg, #58cc02 0%, #1cb0f6 100%)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            marginTop: '8px',
            letterSpacing: '0.03em',
            transition: 'background 0.2s',
          }}>Login</button>
        </form>
        {error && <div style={{color:'#e74c3c', marginTop:'16px', fontWeight:'bold'}}>{error}</div>}
      </div>
    </div>
  );
}

export default LoginPage;
