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
      <div className="main-content" style={{display: 'flex', justifyContent: 'center', gap: '24px'}}>
        <button 
          className="brick-mode-button"
          onClick={handleBrickModeClick}
        >
          Start Brick Mode
        </button>
        <button
          className="haki-week-button"
          onClick={() => navigate('/step-mode')}
        >
          <div className="haki-week-video-wrapper">
            <video src="/videos/Daily-0-video.mp4" width="220" height="60" autoPlay loop muted style={{borderRadius: '8px', background: '#000'}} />
            <span className="haki-week-label">Haki Week Journey</span>
          </div>
        </button>
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
