import React, { useState, useEffect } from 'react';
import './Brick.css';

const Brick = ({ brickData, onWordClick, onContinue, onBrickCompleted }) => {
  const [randomizedWords, setRandomizedWords] = useState([]);
  const [clickedIndices, setClickedIndices] = useState([]);
  const [selectedWordIdx, setSelectedWordIdx] = useState(null);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    if (brickData && Array.isArray(brickData.words)) {
      // If words are objects, shuffle them
      const validWords = brickData.words.filter(word => word && word.text && word.text.trim() !== '');
      setRandomizedWords(shuffleArray(validWords));
      setClickedIndices([]);
      setSelectedWordIdx(null);
    }
  }, [brickData.group_id]); // Only reset when the brick changes

  // Check if all "Good" words have been clicked
  const goodIndices = randomizedWords
    .map((word, idx) => word.type === "Good" ? idx : null)
    .filter(idx => idx !== null);
  const allGoodClicked = goodIndices.every(idx => clickedIndices.includes(idx)) && goodIndices.length > 0;

  useEffect(() => {
    // Reset local completion state when brick changes
    setHasCompleted(false);
  }, [brickData.group_id]);

  useEffect(() => {
    // Mark brick as completed in backend when all good words are clicked
    if (
      allGoodClicked &&
      brickData &&
      !brickData.completed &&
      !hasCompleted
    ) {
      setHasCompleted(true);
      fetch('http://localhost:5000/api/brick/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brick_id: brickData.group_id || brickData.id })
      });
      // Notify parent to update completed status
      if (onBrickCompleted) {
        onBrickCompleted(brickData.group_id || brickData.id);
      }
    }
  }, [allGoodClicked, brickData, onBrickCompleted, hasCompleted]);

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  if (!brickData) {
    return <div className="brick-container">No brick data available</div>;
  }

  const handleWordClick = (word, index) => {
    if (!clickedIndices.includes(index)) {
      setClickedIndices([...clickedIndices, index]);
      setSelectedWordIdx(index);
      if (onWordClick) {
        onWordClick(word, index);
      }
    }
  };

  return (
    <div className="brick-container">
      <div className="brick-header">
        <h3 className="brick-title">{brickData.brick}</h3>
        <span className={`brick-level${brickData.completed ? ' brick-level-completed' : ''}`}>
          Level {brickData.level ? brickData.level : 1}
        </span>
      </div>
      
      {brickData.image_url && (
        <div className="brick-image-container">
          <img 
            src={brickData.image_url} 
            alt={brickData.brick}
            className="brick-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="brick-words-grid">
        {randomizedWords.map((word, index) => {
          let buttonClass = "word-button";
          if (clickedIndices.includes(index)) {
            if (word.type === "Good") buttonClass += " word-good";
            else if (word.type === "Bad") buttonClass += " word-bad";
          }
          return (
            <button
              key={`${word.text}-${index}`}
              className={buttonClass}
              onClick={() => handleWordClick(word, index)}
              type="button"
              disabled={clickedIndices.includes(index)}
            >
              {word.text}
            </button>
          );
        })}
      </div>

      {selectedWordIdx !== null && randomizedWords[selectedWordIdx] && (
        <div className="word-definition">
          <p>
            <strong>{randomizedWords[selectedWordIdx].text}:</strong>
            {" "}
            {randomizedWords[selectedWordIdx].definition
              ? randomizedWords[selectedWordIdx].definition
              : "No definition available."}
          </p>
        </div>
      )}

      {allGoodClicked && (
        <div className="brick-success">
          <p className="brick-success-message">Good Job</p>
          <button className="brick-success-btn" onClick={onContinue}>
            Continue to the next Brick
          </button>
        </div>
      )}

      {brickData.definition && (
        <div className="brick-definition">
          <p>{brickData.definition}</p>
        </div>
      )}
    </div>
  );
};

export default Brick;

