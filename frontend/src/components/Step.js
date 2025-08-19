import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Step.css';

const Step = ({ stepData, onWordClick, onContinue, onStepCompleted }) => {
  const [lockedScore, setLockedScore] = useState(null);
  const [randomizedWords, setRandomizedWords] = useState([]);
  const [clickedIndices, setClickedIndices] = useState([]);
  const [selectedWordIdx, setSelectedWordIdx] = useState(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const imageRef = useRef();
  const overlayRef = useRef();
  const lastBox = useRef(null);

  const drawBox = useCallback((bbox, confidence, label, hideLabel = false) => {
    if (!overlayRef.current || !imageRef.current) return;
    overlayRef.current.innerHTML = '';
    const [x, y, w, h] = bbox;
    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    const parentRect = img.parentElement.getBoundingClientRect();
    const imgW = img.clientWidth;
    const imgH = img.clientHeight;
    const offsetX = rect.left - parentRect.left;
    const offsetY = rect.top - parentRect.top;
    const px = x * imgW + offsetX;
    const py = y * imgH + offsetY;
    const pw = w * imgW;
    const ph = h * imgH;
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
      drawBox(lastBox.current.bbox, lastBox.current.confidence, lastBox.current.label, lastBox.current.hideLabel);
    }
  }, [drawBox]);

  useEffect(() => {
    if (overlayRef.current) overlayRef.current.innerHTML = '';
    // Play start sound when step loads
    playSound('start_sound.mp3');
  }, [stepData, stepData?.group_id]);

  useEffect(() => {
    if (stepData && Array.isArray(stepData.words)) {
      const validWords = stepData.words.filter(word => word && word.text && word.text.trim() !== '');
      setRandomizedWords(shuffleArray(validWords));
      setClickedIndices([]);
      setSelectedWordIdx(null);
    }
  }, [stepData, stepData?.group_id]);

  const goodIndices = randomizedWords
    .map((word, idx) => word.type === "Good" ? idx : null)
    .filter(idx => idx !== null);
  const allGoodClicked = goodIndices.every(idx => clickedIndices.includes(idx)) && goodIndices.length > 0;

  useEffect(() => {
    setHasCompleted(false);
    setHintCount(0); // Reset hint count when step changes
  }, [stepData, stepData?.group_id]);

  useEffect(() => {
    if (
      allGoodClicked &&
      stepData &&
      !stepData.completed &&
      !hasCompleted
    ) {
      setHasCompleted(true);
      // Mark step as completed immediately for UI
      stepData.completed = true;
      const goodClicked = randomizedWords.filter((w, idx) => w.type === "Good" && clickedIndices.includes(idx)).length;
      const badClicked = randomizedWords.filter((w, idx) => w.type === "Bad" && clickedIndices.includes(idx)).length;
      const totalClicked = goodClicked + badClicked;
      let score = totalClicked > 0 ? Math.round((goodClicked / totalClicked) * 100) : 0;
      score = Math.max(0, score - 20 * hintCount);
      setLockedScore(score);
      const username = localStorage.getItem('username');
      fetch('http://localhost:5000/user_step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, group_id: stepData.group_id || stepData.id, score })
      });
      // Do NOT call onStepCompleted here!
      // Only call onStepCompleted when user clicks the button below.
    }
  }, [allGoodClicked, stepData, onStepCompleted, hasCompleted, randomizedWords, clickedIndices, hintCount]);

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;
    const onLoad = () => {
      clearOverlay();
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
    if (!clickedIndices.includes(index) && !allGoodClicked) {
      setClickedIndices([...clickedIndices, index]);
      setSelectedWordIdx(index);
      if (onWordClick) {
        onWordClick(word, index);
      }
    } else if (!clickedIndices.includes(index)) {
      setClickedIndices([...clickedIndices, index]);
      setSelectedWordIdx(index);
      if (onWordClick) {
        onWordClick(word, index);
      }
    }
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
          clearOverlay();
        }
      } catch (err) {
        clearOverlay();
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

  const getVideoUrl = (video) => {
    if (!video || video === 'null') return null;
    // Use the value directly, it's already a public path
    return video;
  };

  if (!stepData) {
    return <div className="step-container">No step data available</div>;
  }

  console.log('stepData.video:', stepData.video);

  return (
    <div className="step-container">
      {/* Instruction above the step */}
      <div className="step-explanation">
        Select all the words that you recognize in the image. You can use up to 2 hints, but each hint reduces your score.
      </div>
      <div className="step-header">
        <h3 className="step-title">{stepData.language} Day {stepData.day}</h3>
        <span className={`step-level${stepData.completed ? ' step-level-completed' : ''}`}>
          {stepData.completed ? 'Completed' : 'In Progress'}
        </span>
      </div>
      {/* Show image before completion */}
      {!allGoodClicked && stepData.image_url && (
        <div className="step-image-container" style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '340px'
        }}>
          {/* Hint Button above the image */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', position: 'relative', zIndex: 21 }}>
            <button
              className={`step-hint-btn${hintCount >= 2 ? ' step-hint-btn-disabled' : ''}`}
              onClick={handleHint}
              type="button"
              disabled={hintCount >= 2}
            >
              {hintCount < 2 ? `Hint (-20) [${2 - hintCount} left]` : 'No hints left'}
            </button>
          </div>
          <img 
            ref={imageRef}
            src={stepData.image_url} 
            alt={`Step ${stepData.day}`}
            className="step-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
            style={{
              width: '320px',
              height: '320px',
              borderRadius: '18px',
              objectFit: 'cover',
              display: 'block',
              margin: '0 auto'
            }}
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
      {/* After completion: show video if available, otherwise show image */}
      {allGoodClicked && getVideoUrl(stepData.video) && (
        <div className="step-image-container" style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '320px'
        }}>
          <video
            src={getVideoUrl(stepData.video)}
            autoPlay
            muted
            poster={stepData.image_url || undefined}
            controls={false}
            style={{
              width: '320px',
              height: '320px',
              borderRadius: '18px',
              objectFit: 'cover',
              boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
              display: 'block',
              margin: '0 auto'
            }}
          />
        </div>
      )}
      {/* Fallback: show image if no video after completion */}
      {allGoodClicked && !getVideoUrl(stepData.video) && stepData.image_url && (
        <div className="step-image-container" style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '320px'
        }}>
          <img 
            ref={imageRef}
            src={stepData.image_url} 
            alt={`Step ${stepData.day}`}
            className="step-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
            style={{
              width: '320px',
              height: '320px',
              borderRadius: '18px',
              objectFit: 'cover',
              display: 'block',
              margin: '0 auto'
            }}
          />
        </div>
      )}
      <div className="step-words-grid">
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
        <div className="step-success">
          <p className="step-success-message">Good Job!</p>
          <p className="step-score-message">
            Score: {lockedScore !== null ? lockedScore : ''}
          </p>
          <button
            className="step-success-btn"
            onClick={() => {
              if (onStepCompleted) onStepCompleted();
            }}
          >
            Back to Steps List
          </button>
        </div>
      )}
    </div>
  );
};

export default Step;
