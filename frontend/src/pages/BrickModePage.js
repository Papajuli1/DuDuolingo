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

  useEffect(() => {
    fetchBricks();
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
    // Add word click logic here
  };

  const handleContinue = async () => {
    if (selectedBrick) {
      const brickIdentifier = selectedBrick.group_id;
      await fetch('http://localhost:5000/api/brick/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brick_id: brickIdentifier })
      });
      // Refresh bricks to get updated completion status
      const response = await fetch('http://localhost:5000/api/bricks');
      const updatedBricks = await response.json();
      setBricks(updatedBricks);

      // Find the next uncompleted brick after the current one using group_id
      let nextIdx = updatedBricks.findIndex(b => b.group_id === brickIdentifier) + 1;
      while (nextIdx < updatedBricks.length && updatedBricks[nextIdx].completed) {
        nextIdx++;
      }
      if (nextIdx < updatedBricks.length) {
        setSelectedBrick(updatedBricks[nextIdx]);
      } else {
        setSelectedBrick(null);
      }
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
        <Brick brickData={selectedBrick} onWordClick={handleWordClick} onContinue={handleContinue} />
      </div>
    );
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

      <div className="brickmode-grid">
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
          filteredBricks.map((brick) => (
            <div
              key={brick.group_id}
              className={`brickmode-card${brick.completed ? ' brickmode-card-completed' : ''}`}
              onClick={() => handleBrickClick(brick)}
            >
              <h3 className="brickmode-card-title">{brick.brick}</h3>
              <p className={`brickmode-card-level${brick.completed ? ' brickmode-card-level-completed' : ''}`}>
                Level {brick.level}
              </p>
              {brick.definition && (
                <p className="brickmode-card-def">
                  {brick.definition.substring(0, 100)}...
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BrickModePage;


