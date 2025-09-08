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
        <div className="hero-content">
          <h1 className="hero-title">
            <img src="/DuDuolingo_icon.png" alt="DuDuolingo" className="hero-icon" />
            DuDuolingo
          </h1>
          <p className="hero-subtitle">
            {welcomeType === 'existing' ? `Welcome back, ${username}!` : `Welcome, ${username}!`}
          </p>
        </div>
      </div>
      
      <div className="main-content">
        <h2 className="section-title">Choose Your Learning Path</h2>
        <div className="learning-modes">
          <div className="mode-card brick-mode-card" onClick={handleBrickModeClick}>
            <div className="mode-icon">🧱</div>
            <h3 className="mode-title">Brick Mode</h3>
            <p className="mode-description">Build your vocabulary brick by brick</p>
            <div className="mode-badge">Interactive Learning</div>
          </div>
          
          <div className="mode-card haki-mode-card" onClick={() => navigate('/step-mode')}>
            <div className="mode-icon">⚡</div>
            <h3 className="mode-title">The Haki Path</h3>
            <p className="mode-description">One step a day keeps the rust away</p>
            <div className="mode-video">
              <video 
                src="/data/videos/Daily-0-video.mp4"
                autoPlay
                loop
                muted
                className="mode-preview-video"
              />
            </div>
          </div>
        </div>
        
        <div className="secondary-actions">
          <button className="leaderboard-button" onClick={handleLeaderboardClick}>
            <span className="button-icon">🏆</span>
            View Leaderboard
          </button>
        </div>
      </div>
      <div className="motivation-banner" style={{
        width: '100%',
        marginTop: '32px',
        padding: '28px 0',
        background: 'linear-gradient(90deg, #1cb0f6 0%, #2ecc40 100%)',
        color: '#fff',
        textAlign: 'center',
        borderRadius: '18px',
        fontSize: '1.25em',
        fontWeight: '500',
        boxShadow: '0 2px 16px rgba(0,0,0,0.10)'
      }}>
        🚀 Ready to level up your language skills? <br />
        <span style={{fontWeight: 'bold', fontSize: '1.35em'}}>Practice daily, unlock achievements, and become a language master!</span>
      </div>
    </div>
  );
};

export default HomePage;
