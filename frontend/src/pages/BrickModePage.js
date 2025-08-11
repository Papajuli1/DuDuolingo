import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Brick from '../components/Brick';
import './BrickModePage.css';

const BrickModePage = () => {
  const navigate = useNavigate();
  const [bricks, setBricks] = useState([]);
  const [selectedBrick, setSelectedBrick] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('Spanish');

  const [userBricks, setUserBricks] = useState([]);
  useEffect(() => {
    fetchBricks();
    const username = localStorage.getItem('username');
    if (username) {
      fetch(`http://localhost:5000/user_bricks/${username}`)
        .then(res => res.json())
        .then(data => setUserBricks(data.bricks || []));
    }
  }, []);

  // Debug: log bricks and their brick_language property
  useEffect(() => {
    if (bricks.length > 0) {
      console.log('Selected language:', language);
      console.log('First brick keys:', Object.keys(bricks[0]));
      console.log('First 5 brick_language values:', bricks.slice(0, 5).map(b => b.brick_language));
      console.log('Bricks:', bricks.map(b => ({
        group_id: b.group_id,
        brick_language: b.brick_language,
        language: b.language,
        matches_brick_language: b.brick_language === language,
        matches_language: b.language === language
      })));
    }
  }, [bricks, language]);

  const fetchBricks = async () => {
    try {
      setLoading(true);
      console.log('Attempting to fetch bricks from backend...');
      
      const response = await fetch('http://localhost:5000/api/bricks');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch bricks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched bricks data:', data);
      setBricks(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  const handleBrickClick = (brick) => {
    setSelectedBrick(brick);
  };

  const handleBackToBricksList = () => {
    setSelectedBrick(null);
  };

  const handleWordClick = (word, index) => {
    console.log(`Clicked word: ${word} at index: ${index}`);
  };

  const handleContinue = async () => {
    if (selectedBrick) {
      const brickIdentifier = selectedBrick.group_id;
      let nextIdx = bricks.findIndex(b => b.group_id === brickIdentifier) + 1;
      setSelectedBrick(nextIdx < bricks.length ? bricks[nextIdx] : null);
    }
  };

  const handleResetProgress = async () => {
    // Try to reset on backend, but always update UI
    fetch('http://localhost:5000/api/bricks/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language })
    }).finally(() => {
      setSelectedBrick(null);
      setBricks(prevBricks =>
        prevBricks.map(brick =>
          ((brick.brick_language && brick.brick_language === language) ||
            (!brick.brick_language && brick.language === language))
            ? { ...brick, completed: 0 }
            : brick
        )
      );
      setError(null);
    });
  };

  // Callback for Brick to mark as completed
  const handleBrickCompleted = (groupId, score = 1) => {
    setUserBricks(prev => {
      const idx = prev.findIndex(b => b.group_id === groupId);
      if (idx !== -1) {
        // Update score for existing entry
        const updated = [...prev];
        updated[idx] = { ...updated[idx], score };
        return updated;
      } else {
        // Add new entry
        return [...prev, { group_id: groupId, score }];
      }
    });
  };

  if (loading) {
    return (
      <div className="brickmode-loading">
        <h1>Loading Bricks...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="brickmode-error">
        <h1>Error</h1>
        <p>{error}</p>
        <button className="brickmode-back-btn" onClick={handleGoBack}>
          Back to Home
        </button>
      </div>
    );
  }

  // Filter bricks by selected language, fallback to 'language' if 'brick_language' is empty
  const filteredBricks = bricks.filter(brick =>
    (brick.brick_language && brick.brick_language === language) ||
    (!brick.brick_language && brick.language === language)
  );

  // Show individual brick view
  if (selectedBrick) {
    return (
      <div className="brickmode-individual">
        <div className="brickmode-individual-header">
          <button 
            className="brickmode-back-btn"
            onClick={handleBackToBricksList}
          >
            Back to Bricks List
          </button>
          <button 
            className="brickmode-home-btn"
            onClick={handleGoBack}
          >
            Home
          </button>
        </div>
        <Brick
          brickData={selectedBrick}
          onWordClick={handleWordClick}
          onContinue={handleContinue}
          onBrickCompleted={(groupId, score) => handleBrickCompleted(groupId, score)}
        />
      </div>
    );
  }

  // Determine unlocked level
  const levels = Array.from(new Set(filteredBricks.map(b => b.level))).sort((a, b) => a - b);
  let unlockedLevel = levels[0];
  for (let lvl of levels) {
    const bricksInLevel = filteredBricks.filter(b => b.level === lvl);
    const allCompleted = bricksInLevel.every(b => {
      const userBrick = userBricks.find(ub => ub.group_id === b.group_id);
      return userBrick && userBrick.score && userBrick.score !== 0;
    });
    if (allCompleted) {
      unlockedLevel = lvl + 1;
    } else {
      break;
    }
  }

  // Show bricks list view


  return (
    <div className="brickmode-container">
      <div className="brickmode-header">
        <h1>Brick Mode</h1>
        <p>Choose a brick to practice with:</p>
        <button 
          className="brickmode-back-btn"
          onClick={handleGoBack}
        >
          Back to Home
        </button>
        <button
          className="brickmode-back-btn"
          onClick={() => setLanguage(language === 'Spanish' ? 'German' : 'Spanish')}
        >
          Switch to {language === 'Spanish' ? 'German' : 'Spanish'}
        </button>
        <button
          className="brickmode-back-btn"
          onClick={handleResetProgress}
        >
          Reset Progress
        </button>
      </div>

      {/* Group bricks by level and display each level in its own div */}
      {filteredBricks.length === 0 ? (
        <div className="brickmode-empty">
          <p>No bricks available for "{language}".</p>
          <p>Available brick_language values:</p>
          <ul>
            {Array.from(new Set(bricks.map(b => String(b.brick_language)))).map((val, idx) => (
              <li key={idx}>{JSON.stringify(val)}</li>
            ))}
          </ul>
        </div>
      ) : (
        levels.map(level => {
          const bricksInLevel = filteredBricks.filter(b => b.level === level);
          const isLevelUnlocked = level <= unlockedLevel;
          return (
            <div key={level} className="brickmode-level-section">
              <h2 className="brickmode-level-title">Level {level}</h2>
              {!isLevelUnlocked && (
                <div className="brickmode-locked-message" style={{marginBottom:'10px'}}>Complete all previous bricks to unlock this level</div>
              )}
              <div className="brickmode-level-grid">
                {bricksInLevel.map((brick, idx) => {
                  const userBrick = userBricks.find(ub => ub.group_id === brick.group_id);
                  const isCompleted = userBrick && userBrick.score && userBrick.score !== 0;
                  const isUnlocked = brick.level <= unlockedLevel;
                  return (
                    <div
                      key={brick.group_id}
                      className={`brickmode-card${isCompleted ? ' brickmode-card-completed' : ''}${!isUnlocked ? ' brickmode-card-locked' : ''}`}
                      onClick={isUnlocked ? () => handleBrickClick(brick) : undefined}
                      style={{ pointerEvents: isUnlocked ? 'auto' : 'none' }}
                      title={!isUnlocked ? 'Complete all previous bricks to unlock this level' : ''}
                    >
                      <h3 className="brickmode-card-title">
                        {!isUnlocked && (
                          <span style={{marginRight: '8px', verticalAlign: 'middle'}}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="10" cy="10" r="10" fill="#bbb" />
                              <path d="M6 10V8a4 4 0 1 1 8 0v2" stroke="#666" strokeWidth="1.5" fill="none" />
                              <rect x="6" y="10" width="8" height="5" rx="1.5" fill="#eee" stroke="#666" strokeWidth="1.5" />
                              <circle cx="10" cy="12.5" r="1" fill="#666" />
                            </svg>
                          </span>
                        )}
                        {brick.brick}
                      </h3>
                      <p className="brickmode-card-level">
                        Level {brick.level}
                      </p>
                      {!isUnlocked && (
                        <p className="brickmode-card-locked-text" style={{color:'#888', fontSize:'0.95em', margin:'4px 0'}}>Locked</p>
                      )}
                      {brick.definition && (
                        <p className="brickmode-card-def">
                          {brick.definition.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default BrickModePage;


