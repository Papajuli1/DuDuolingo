import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  const handleBrickModeClick = () => {
    navigate('/brick-mode');
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1 className="hero-title">DuDuolingo</h1>
        <p className="hero-subtitle">Welcome to your language learning journey!</p>
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
