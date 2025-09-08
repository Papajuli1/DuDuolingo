import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Brick.css';

const Brick = ({ brickData, onWordClick, onContinue, onBrickCompleted, onBackToBricksList }) => {
  const [randomizedWords, setRandomizedWords] = useState([]);
  const [clickedIndices, setClickedIndices] = useState([]);
  const [selectedWordIdx, setSelectedWordIdx] = useState(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [lockedScore, setLockedScore] = useState(null);
  const imageRef = useRef();
  const overlayRef = useRef();
  const lastBox = useRef(null);

  // All hooks must be top-level, never conditional
  const drawBox = useCallback((bbox, confidence, label, hideLabel = false) => {
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
    overlayRef.current.appendChild(box);
    if (!hideLabel) {
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
      overlayRef.current.appendChild(confLabel);
    }
    lastBox.current = { bbox, confidence, label, hideLabel };
  }, []);

  const clearOverlay = useCallback(() => {
    if (overlayRef.current) overlayRef.current.innerHTML = '';
    lastBox.current = null;
  }, []);

  const redrawBox = useCallback(() => {
    if (lastBox.current && imageRef.current) {
      drawBox(
        lastBox.current.bbox,
        lastBox.current.confidence,
        lastBox.current.label,
        lastBox.current.hideLabel
      );
    }
  }, [drawBox]);

  useEffect(() => {
    // Always clear detection overlay immediately when brick changes
    if (overlayRef.current) overlayRef.current.innerHTML = '';
    // Play start sound when brick loads
    playSound('start_sound.mp3');
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
    setHintCount(0); // Reset hint count when brick changes
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
      let score = totalClicked > 0 ? Math.round((goodClicked / totalClicked) * 100) : 0;
      score = Math.max(0, score - 20 * hintCount);
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
        // The parent receives the score here and can use it to show different styles in the brick list
        onBrickCompleted(brickData.group_id || brickData.id, score);
      }
    }
  }, [allGoodClicked, brickData, onBrickCompleted, hasCompleted, randomizedWords, clickedIndices, hintCount]);

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

  // Helper to play a sound file
  const playSound = (filename) => {
    const audio = new window.Audio(`http://localhost:5000/sound/${filename}`);
    audio.volume = 0.15;
    audio.play();
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleWordClick = async (word, index) => {
    // Play sound for good/bad word immediately
    if (word.type === 'Good') {
      playSound('right_answer.mp3');
    } else if (word.type === 'Bad') {
      playSound('wrong_answer.mp3');
    }
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

  const handleHint = async () => {
    let unclickedGoodIndices = randomizedWords
      .map((word, idx) => word.type === "Good" && !clickedIndices.includes(idx) ? idx : null)
      .filter(idx => idx !== null);

    if (unclickedGoodIndices.length === 0 || hintCount >= 2) return;

    // Try each unclicked good word until a detection is found
    let found = false;
    for (let i = 0; i < unclickedGoodIndices.length; i++) {
      const idx = unclickedGoodIndices[i];
      const word = randomizedWords[idx];
      if (imageRef.current && word.definition) {
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
          if (resp.ok && typeof data === 'object' && data.found && Array.isArray(data.bbox) && data.bbox.length === 4) {
            drawBox(data.bbox, data.confidence, '', true); // Hide label
            found = true;
            break;
          }
        } catch (err) {
          // ignore and try next
        }
      }
    }
    // If none found, just clear overlay (no green box)
    if (!found) {
      clearOverlay();
    }
    setHintCount(hintCount + 1);
  };

  if (!brickData) {
    return <div className="brick-container">No brick data available</div>;
  }

  return (
    <div>
      {/* Top navigation buttons - outside the container like in Step */}
        <div className="brick-nav-buttons">
          <button className="brick-nav-button" onClick={() => {
            if (onBackToBricksList) onBackToBricksList();
          }}>
            Back to Bricks List
          </button>
          <button className="brick-nav-button" onClick={() => window.location.href = '/'}>
            Home
          </button>
        </div>
        
        <div className="brick-container">
        <div className="brick-explanation">
        <div className="brick-explanation-icon">🎯</div>
        <div className="brick-explanation-text">
          <strong>Your Task:</strong> Select all the words that you recognize in the image.
          <br />
          <span className="brick-explanation-hint">💡 You can use up to 2 hints, but each hint reduces your score by 20 points.</span>
        </div>
      </div>
      <div className="brick-header">
        <h3 className="brick-title">{brickData.brick}</h3>
        <span className={`brick-level${brickData.completed ? ' brick-level-completed' : ''}`}>
          Level {brickData.level ? brickData.level : 1}
        </span>
      </div>
      
      {brickData.image_url && (
        <div className="brick-image-container" style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px'
        }}>
          {/* Hint Button above the image */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', position: 'relative', zIndex: 21 }}>
            <button
              className={`brick-hint-btn${hintCount >= 2 ? ' brick-hint-btn-disabled' : ''}`}
              onClick={handleHint}
              type="button"
              disabled={hintCount >= 2}
            >
              {hintCount < 2 ? `Hint (-20) [${2 - hintCount} left]` : 'No hints left'}
            </button>
          </div>
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
          <div className="word-definition-header">
            <span className="word-definition-icon">📖</span>
            <strong className="word-definition-title">{randomizedWords[selectedWordIdx].text}</strong>
          </div>
          <p className="word-definition-content">
            {randomizedWords[selectedWordIdx].definition
              ? randomizedWords[selectedWordIdx].definition
              : "No definition available."}
          </p>
        </div>
      )}

      {allGoodClicked && (
        <div className="brick-success">
          <p className="brick-success-message">Good Job!</p>
          <p className="brick-score-message">
            Score: {lockedScore !== null ? lockedScore : ''}
          </p>
          <button className="brick-success-btn" onClick={onContinue}>
            Continue to the next brick
          </button>
        </div>
      )}

      {brickData.definition && (
        <div className="brick-definition">
          <p>{brickData.definition}</p>
        </div>
      )}
    </div>
  </div>
  );
};

export default Brick;

