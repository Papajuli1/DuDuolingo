import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Brick from '../components/Brick';
import './BrickModePage.css';

const BrickModePage = () => {
  const [showResetMsg, setShowResetMsg] = useState(false);
  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('welcomeType');
    navigate('/login');
  };
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

  // Helper to refresh user bricks from backend
  const refreshUserBricks = async () => {
    const username = localStorage.getItem('username');
    if (username) {
      try {
        const res = await fetch(`http://localhost:5000/user_bricks/${username}`);
        const data = await res.json();
        setUserBricks(data.bricks || []);
      } catch (err) {
        // Optionally handle error
      }
    }
  };

  const handleBackToBricksList = async () => {
    await refreshUserBricks(); // Ensure latest scores before showing list
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
    const username = localStorage.getItem('username');
    if (!username) return;
    // Make sure language is either 'Spanish' or 'German'
    const validLanguage = (language === 'Spanish' || language === 'German') ? language : 'Spanish';
    try {
      await fetch(`http://localhost:5000/user_bricks/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, language: validLanguage })
      });
      setUserBricks(prev =>
        prev.map(ub => {
          const brick = bricks.find(b => b.group_id === ub.group_id);
          if (brick && ((brick.brick_language && brick.brick_language === validLanguage) || (!brick.brick_language && brick.language === validLanguage))) {
            return { ...ub, score: 0 };
          }
          return ub;
        })
      );
      setSelectedBrick(null);
      setError(null);
      setShowResetMsg(true);
      setTimeout(() => setShowResetMsg(false), 5000);
    } catch (err) {
      setError('Failed to reset progress');
    }
  };

  // Callback for Brick to mark as completed
  const handleBrickCompleted = async (groupId, score = 1) => {
    // Convert score to percentage (0-100)
    const scoreInt = Math.round(score * 100);
    setUserBricks(prev => {
      const idx = prev.findIndex(b => b.group_id === groupId);
      if (idx !== -1) {
        // Update score for existing entry
        const updated = [...prev];
        updated[idx] = { ...updated[idx], score: scoreInt };
        return updated;
      } else {
        // Add new entry
        return [...prev, { group_id: groupId, score: scoreInt }];
      }
    });
    // Optionally refresh immediately, but main refresh is on back to list
    // await refreshUserBricks();
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
        <Brick
          brickData={selectedBrick}
          onWordClick={handleWordClick}
          onContinue={handleContinue}
          onBrickCompleted={(groupId, score) => handleBrickCompleted(groupId, score)}
          onBackToBricksList={handleBackToBricksList}
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
      {!selectedBrick && <button className="brickmode-logout-btn" onClick={handleLogout}>Logout</button>}
      {showResetMsg && (
        <div className="brickmode-reset-msg">Progress has been reset!</div>
      )}
      <div className="brickmode-header">
        <h1>Brick Mode</h1>
        <p>Choose a brick to practice with:</p>
        <div className="brickmode-btn-row">
          <button 
            className="brickmode-back-btn brickmode-btn"
            onClick={handleGoBack}
          >
            Back to Home
          </button>
          <button
            className="brickmode-back-btn brickmode-btn"
            onClick={() => setLanguage(language === 'Spanish' ? 'German' : 'Spanish')}
          >
            Switch to {language === 'Spanish' ? 'German' : 'Spanish'}
            <img
              src={language === 'Spanish'
                ? 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f1e9-1f1ea.svg'
                : 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f1ea-1f1f8.svg'
              }
              alt={language === 'Spanish' ? 'German flag' : 'Spanish flag'}
              style={{
                width: '1.2em',
                height: '1.2em',
                verticalAlign: 'middle',
                marginLeft: '8px',
                filter: 'drop-shadow(0 0 2px #222)'
              }}
            />
          </button>
          <button
            className="brickmode-back-btn brickmode-btn"
            onClick={handleResetProgress}
          >
            Reset Progress
          </button>
        </div>
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
                  // Only treat as completed if score > 0 and score is not null/undefined
                  const isCompleted = userBrick && typeof userBrick.score === 'number' && userBrick.score > 0;
                  const isUnlocked = brick.level <= unlockedLevel;
                  const isPerfect = isCompleted && userBrick.score === 100;
                  const isPartial = isCompleted && userBrick.score < 100;
                  const showPressToStart = !isCompleted && isUnlocked;
                    return (
                    <div
                      key={brick.group_id}
                      className={
                      `brickmode-card` +
                      (isPerfect ? ' brickmode-card-perfect' : '') +
                      (isPartial ? ' brickmode-card-partial' : '') +
                      (!isUnlocked ? ' brickmode-card-locked' : '')
                      }
                      onClick={isUnlocked ? () => handleBrickClick(brick) : undefined}
                      style={{ pointerEvents: isUnlocked ? 'auto' : 'none' }}
                      title={!isUnlocked ? 'Complete all previous bricks to unlock this level' : ''}
                    >
                      <h3 className="brickmode-card-title">
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap'}}>
                          {!isUnlocked && (
                            <span style={{fontSize: '1.2rem', opacity: 0.7}}>🔒</span>
                          )}
                          <span style={{fontSize: '1.3rem'}}>🧱</span>
                          <span>{brick.brick}</span>
                        </div>
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
                      {/* Show completion status only if completed */}
                      {isPerfect && (
                      <div className="brickmode-card-status brickmode-card-status-perfect">
                        <span role="img" aria-label="perfect" style={{marginRight:'6px'}}>🏆</span>
                        Perfect!
                      </div>
                      )}
                      {isPartial && (
                      <div className="brickmode-card-status brickmode-card-status-partial">
                        <span role="img" aria-label="partial" style={{marginRight:'6px'}}>✅</span>
                        Completed
                      </div>
                      )}
                      {/* Show "Press to start" for unlocked, not completed bricks */}
                      {showPressToStart && (
                      <div className="brickmode-card-status" style={{color:'#1cb0f6', fontWeight:'bold', marginTop:'6px'}}>
                        Press to start
                      </div>
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


