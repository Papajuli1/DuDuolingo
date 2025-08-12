import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Brick.css';

const Brick = ({ brickData, onWordClick, onContinue, onBrickCompleted }) => {
  const [lockedScore, setLockedScore] = useState(null);
  const [randomizedWords, setRandomizedWords] = useState([]);
  const [clickedIndices, setClickedIndices] = useState([]);
  const [selectedWordIdx, setSelectedWordIdx] = useState(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const imageRef = useRef();
  const overlayRef = useRef();
  const lastBox = useRef(null);

  // All hooks must be top-level, never conditional
  const drawBox = useCallback((bbox, confidence, label) => {
    if (!overlayRef.current || !imageRef.current) return;
    overlayRef.current.innerHTML = '';
    const [x, y, w, h] = bbox;
    // Get actual rendered image size and position
    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    const parentRect = img.parentElement.getBoundingClientRect();
    const imgW = img.clientWidth;
    const imgH = img.clientHeight;
    // Calculate offset for centering
    const offsetX = rect.left - parentRect.left;
    const offsetY = rect.top - parentRect.top;
    // Detection box in pixels
    const px = x * imgW + offsetX;
    const py = y * imgH + offsetY;
    const pw = w * imgW;
    const ph = h * imgH;
    // Box
    const box = document.createElement('div');
    Object.assign(box.style, {
      position: 'absolute',
      left: `${px}px`,
      top: `${py}px`,
      width: `${pw}px`,
      height: `${ph}px`,
      border: '3px solid #2ecc40',
      borderRadius: '8px',
      background: 'rgba(46,204,64,0.08)',
      pointerEvents: 'none',
      zIndex: '11',
    });
    // Object label only (no percentage)
    const confLabel = document.createElement('div');
    confLabel.textContent = `${label || ''}`;
    Object.assign(confLabel.style, {
      position: 'absolute',
      left: `${px}px`,
      top: `${Math.max(py - 28, 0)}px`,
      background: '#2ecc40',
      color: '#fff',
      padding: '2px 8px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 'bold',
      pointerEvents: 'none',
      zIndex: '12',
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      userSelect: 'none',
    });
    overlayRef.current.appendChild(box);
    overlayRef.current.appendChild(confLabel);
    lastBox.current = { bbox, confidence, label };
  }, []);

  const clearOverlay = useCallback(() => {
    if (overlayRef.current) overlayRef.current.innerHTML = '';
    lastBox.current = null;
  }, []);

  const redrawBox = useCallback(() => {
    if (lastBox.current && imageRef.current) {
      drawBox(lastBox.current.bbox, lastBox.current.confidence, lastBox.current.label);
    }
  }, [drawBox]);

  useEffect(() => {
    // Always clear detection overlay immediately when brick changes
    if (overlayRef.current) overlayRef.current.innerHTML = '';
  }, [brickData, brickData?.group_id]);

  useEffect(() => {
    if (brickData && Array.isArray(brickData.words)) {
      // If words are objects, shuffle them
      const validWords = brickData.words.filter(word => word && word.text && word.text.trim() !== '');
      setRandomizedWords(shuffleArray(validWords));
      setClickedIndices([]);
      setSelectedWordIdx(null);
    }
  }, [brickData, brickData?.group_id]);

  // Check if all "Good" words have been clicked
  const goodIndices = randomizedWords
    .map((word, idx) => word.type === "Good" ? idx : null)
    .filter(idx => idx !== null);
  const allGoodClicked = goodIndices.every(idx => clickedIndices.includes(idx)) && goodIndices.length > 0;

  useEffect(() => {
    // Reset local completion state when brick changes
    setHasCompleted(false);
  }, [brickData, brickData?.group_id]);

  useEffect(() => {
    // Mark brick as completed in backend when all good words are clicked
    if (
      allGoodClicked &&
      brickData &&
      !brickData.completed &&
      !hasCompleted
    ) {
      setHasCompleted(true);
      // Calculate score
      const goodClicked = randomizedWords.filter((w, idx) => w.type === "Good" && clickedIndices.includes(idx)).length;
      const badClicked = randomizedWords.filter((w, idx) => w.type === "Bad" && clickedIndices.includes(idx)).length;
      const totalClicked = goodClicked + badClicked;
      const score = totalClicked > 0 ? Math.round((goodClicked / totalClicked) * 100) : 0;
      setLockedScore(score);
      // Send score to backend
      const username = localStorage.getItem('username');
      fetch('http://localhost:5000/user_brick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, group_id: brickData.group_id || brickData.id, score })
      });
      // Notify parent to update completed status and score
      if (onBrickCompleted) {
        onBrickCompleted(brickData.group_id || brickData.id, score);
      }
    }
  }, [allGoodClicked, brickData, onBrickCompleted, hasCompleted, randomizedWords, clickedIndices]);

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;
    const onLoad = () => {
      clearOverlay(); // Clear overlay when image loads for new brick
      redrawBox();
    };
    img.addEventListener('load', onLoad);
    const resizeObs = new window.ResizeObserver(() => redrawBox());
    resizeObs.observe(img);
    window.addEventListener('resize', redrawBox);
    return () => {
      img.removeEventListener('load', onLoad);
      resizeObs.disconnect();
      window.removeEventListener('resize', redrawBox);
      clearOverlay();
    };
  }, [redrawBox, clearOverlay]);

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleWordClick = async (word, index) => {
    // Prevent further clicks from affecting score after completion
    if (!clickedIndices.includes(index) && !allGoodClicked) {
      setClickedIndices([...clickedIndices, index]);
      setSelectedWordIdx(index);
      if (onWordClick) {
        onWordClick(word, index);
      }
    } else if (!clickedIndices.includes(index)) {
      // Allow UI feedback for word selection, but don't update score or send to backend
      setClickedIndices([...clickedIndices, index]);
      setSelectedWordIdx(index);
      if (onWordClick) {
        onWordClick(word, index);
      }
    }
    // Detection logic for Good words only
    if (word.type === 'Good' && imageRef.current && word.definition) {
      try {
        let blob;
        if (imageRef.current.src.startsWith('data:')) {
          const res = await fetch(imageRef.current.src);
          blob = await res.blob();
        } else {
          const canvas = document.createElement('canvas');
          canvas.width = imageRef.current.naturalWidth;
          canvas.height = imageRef.current.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(imageRef.current, 0, 0);
          blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        }
        const formData = new FormData();
        formData.append('file', blob, 'scene.png');
        const url = `http://localhost:5000/detect?target=${encodeURIComponent(word.definition)}`;
        const resp = await fetch(url, { method: 'POST', body: formData });
        const data = await resp.json();
        if (!resp.ok || typeof data !== 'object') throw new Error('Invalid response');
        if (data.found && Array.isArray(data.bbox) && data.bbox.length === 4) {
          drawBox(data.bbox, data.confidence, data.label);
        } else {
          clearOverlay(); // Do not show error toast if not found
        }
      } catch (err) {
        clearOverlay(); // Do not show error toast on error
      }
    }
  };

  if (!brickData) {
    return <div className="brick-container">No brick data available</div>;
  }

  return (
    <div className="brick-container">
      <div className="brick-header">
        <h3 className="brick-title">{brickData.brick}</h3>
        <span className={`brick-level${brickData.completed ? ' brick-level-completed' : ''}`}>
          Level {brickData.level ? brickData.level : 1}
        </span>
      </div>
      
      {brickData.image_url && (
        <div className="brick-image-container" style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <img 
            ref={imageRef}
            src={brickData.image_url} 
            alt={brickData.brick}
            className="brick-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
            style={{ display: 'block', maxWidth: '100%', height: 'auto', margin: '0 auto' }}
          />
          <div
            ref={overlayRef}
            style={{
              position: 'absolute',
              left: 0, top: 0, width: '100%', height: '100%',
              pointerEvents: 'none', zIndex: 10,
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
              data-type={word.type}
              data-definition={word.definition}
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
          <p className="brick-success-message">Good Job!</p>
          {/* Show score as integer out of 100, locked after completion */}
          <p className="brick-score-message">
            Score: {lockedScore !== null ? lockedScore : ''}
          </p>
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

