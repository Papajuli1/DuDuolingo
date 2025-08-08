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

  useEffect(() => {
    fetchBricks();
  }, []);

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
        <Brick brickData={selectedBrick} onWordClick={handleWordClick} />
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
      </div>

      <div className="brickmode-grid">
        {bricks.map((brick) => (
          <div
            key={brick.id}
            className="brickmode-card"
            onClick={() => handleBrickClick(brick)}
          >
            <h3 className="brickmode-card-title">{brick.brick}</h3>
            <p className="brickmode-card-level">
              Level {brick.level}
            </p>
            {brick.definition && (
              <p className="brickmode-card-def">
                {brick.definition.substring(0, 100)}...
              </p>
            )}
          </div>
        ))}
      </div>

      {bricks.length === 0 && (
        <div className="brickmode-empty">
          <p>No bricks available yet.</p>
        </div>
      )}
    </div>
  );
};

export default BrickModePage;
