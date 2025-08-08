import React, { useState, useEffect } from 'react';
import './Brick.css';

const Brick = ({ brickData, onWordClick }) => {
  const [randomizedWords, setRandomizedWords] = useState([]);

  useEffect(() => {
    if (brickData && Array.isArray(brickData.words)) {
      // Filter out empty/null words and randomize
      const validWords = brickData.words.filter(word => word && word.trim() !== '');
      setRandomizedWords(shuffleArray(validWords));
    }
  }, [brickData]);

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
    if (onWordClick) {
      onWordClick(word, index);
    }
  };

  return (
    <div className="brick-container">
      <div className="brick-header">
        <h3 className="brick-title">{brickData.brick}</h3>
        <span className="brick-level">Level {brickData.level}</span>
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
        {randomizedWords.map((word, index) => (
          <button
            key={`${word}-${index}`}
            className="word-button"
            onClick={() => handleWordClick(word, index)}
          >
            {word}
          </button>
        ))}
      </div>

      {brickData.definition && (
        <div className="brick-definition">
          <p>{brickData.definition}</p>
        </div>
      )}
    </div>
  );
};

export default Brick;
