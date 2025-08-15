import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [welcomeType, setWelcomeType] = useState('');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedWelcomeType = localStorage.getItem('welcomeType');
    if (!storedUsername) {
      navigate('/login');
      return;
    }
    setUsername(storedUsername);
    setWelcomeType(storedWelcomeType);
  }, [navigate]);

  const handleBrickModeClick = () => {
    navigate('/brick-mode');
  } 

  const handleLeaderboardClick = () => {
    navigate('/leaderboard');
  }

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('welcomeType');
    navigate('/login');
  };

  return (
    <div className="home-page">
      <button className="homepage-logout-btn" onClick={handleLogout}>Logout</button>
      <div className="hero-section">
        <h1 className="hero-title">DuDuolingo</h1>
        <p className="hero-subtitle">
          {welcomeType === 'existing' ? `Welcome back, ${username}!` : `Welcome, ${username}!`}
        </p>
      </div>
      <div className="main-content" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px'}}>
        <div style={{display: 'flex', justifyContent: 'center', gap: '24px'}}>
          <button 
            className="brick-mode-button"
            onClick={handleBrickModeClick}
            style={{
              width: '260px',
              height: '180px',
              fontSize: '1.3em',
              borderRadius: '18px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.12)'
            }}
          >
            Start Brick Mode
          </button>
          <button
            className="haki-week-button"
            onClick={() => navigate('/step-mode')}
            style={{
              width: '260px',
              height: '180px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              borderRadius: '18px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
              padding: '0',
              overflow: 'hidden'
            }}
          >
            <div style={{width: '100%', textAlign: 'center', marginTop: '16px', marginBottom: '4px'}}>
              <span style={{fontSize: '1.2em', fontWeight: 'bold', display: 'block'}}>The Haki Path</span>
              <span style={{fontSize: '0.95em', fontWeight: '500', display: 'block', marginTop: '2px'}}>One Step a Day</span>
            </div>
            <div style={{
              width: '100%',
              height: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              <video 
                src="/data/videos/Daily-0-video.mp4"
                autoPlay
                loop
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  display: 'block'
                }}
              />
            </div>
          </button>
        </div>
        <button
          className="leaderboard-button"
          onClick={handleLeaderboardClick}
        >
          Leaderboard
        </button>
      </div>
      <div className="bottom-sections">
        <div className="section">
          <h3>Learn</h3>
          <p>Interactive lessons</p>
        </div>
        <div className="section">
          <h3>Practice</h3>
          <p>Daily exercises</p>
        </div>
        <div className="section">
          <h3>Progress</h3>
          <p>Track your journey</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
