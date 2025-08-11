import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [welcomeType, setWelcomeType] = useState('');
  const [bricks, setBricks] = useState([]);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedWelcomeType = localStorage.getItem('welcomeType');
    if (!storedUsername) {
      navigate('/login');
      return;
    }
    setUsername(storedUsername);
    setWelcomeType(storedWelcomeType);
    fetch(`http://localhost:5000/user_bricks/${storedUsername}`)
      .then(res => res.json())
      .then(data => setBricks(data.bricks || []));
  }, [navigate]);

  const handleBrickModeClick = () => {
    navigate('/brick-mode');
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('welcomeType');
    navigate('/login');
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1 className="hero-title">DuDuolingo</h1>
        <p className="hero-subtitle">
          {welcomeType === 'existing' ? `Welcome back, ${username}!` : `Welcome, ${username}!`}
        </p>
        <button className="logout-button" onClick={handleLogout} style={{marginTop: '16px'}}>Logout</button>
      </div>
      <div className="main-content">
        <button 
          className="brick-mode-button"
          onClick={handleBrickModeClick}
        >
          Start Brick Mode
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
