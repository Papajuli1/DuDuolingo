import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Step from '../components/Step';
import './StepModePage.css';

const StepModePage = () => {
  const [showResetMsg, setShowResetMsg] = useState(false);
  const navigate = useNavigate();
  const [steps, setSteps] = useState([]);
  const [selectedStep, setSelectedStep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userSteps, setUserSteps] = useState([]);
  const [language] = useState('Spanish');

  useEffect(() => {
    fetchSteps();
    fetchUserSteps();
  }, []);

  const fetchSteps = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/steps');
      if (!response.ok) {
        throw new Error(`Failed to fetch steps: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setSteps(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSteps = async () => {
    const username = localStorage.getItem('username');
    if (username) {
      try {
        const res = await fetch(`http://localhost:5000/user_steps/${username}`);
        if (!res.ok) throw new Error('Failed to fetch user steps');
        const data = await res.json();
        setUserSteps(data.steps || []);
      } catch (err) {
        setError('Could not fetch user steps. Is the backend running?');
        setUserSteps([]);
      }
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  const handleStepClick = (step) => {
    setSelectedStep(step);
  };

  const handleBackToStepsList = () => {
    setSelectedStep(null);
  };

  const handleWordClick = (word, index) => {
    // Optional: handle word click logic
  };

  const handleResetProgress = async () => {
    const username = localStorage.getItem('username');
    if (!username) return;
    // Get language from the first filtered step, fallback to state if not available
    const filteredSteps = steps.filter(step => step.language === language);
    const stepLang = filteredSteps.length > 0 ? filteredSteps[0].language : language;
    console.log('Resetting progress for language:', stepLang); // Debug
    try {
      await fetch(`http://localhost:5000/user_steps/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, language: stepLang })
      });
      setUserSteps(prev =>
        prev.map(us => {
          const step = steps.find(s => s.group_id === us.group_id);
          if (step && step.language === stepLang) {
            return { ...us, score: 0 };
          }
          return us;
        })
      );
      setSelectedStep(null);
      setError(null);
      setShowResetMsg(true);
      setTimeout(() => setShowResetMsg(false), 5000);
    } catch (err) {
      setError('Failed to reset progress');
    }
  };

  const handleStepCompleted = () => {
    setSelectedStep(null);
    fetchUserSteps();
  };

  if (loading) {
    return (
      <div className="stepmode-loading">
        <h1>Loading Steps...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stepmode-error">
        <h1>Error</h1>
        <p>{error}</p>
        <button className="stepmode-back-btn" onClick={handleGoBack}>
          Back to Home
        </button>
      </div>
    );
  }

  if (selectedStep) {
    return (
      <div className="stepmode-individual">
        <div className="stepmode-individual-header">
          <button 
            className="stepmode-back-btn"
            onClick={handleBackToStepsList}
          >
            Back to Steps List
          </button>
          <button 
            className="stepmode-home-btn"
            onClick={handleGoBack}
          >
            Home
          </button>
        </div>
        <Step
          stepData={selectedStep}
          onWordClick={handleWordClick}
          onStepCompleted={handleStepCompleted}
        />
      </div>
    );
  }

  return (
    <div className="stepmode-container">
      <button className="stepmode-logout-btn" onClick={() => { localStorage.removeItem('username'); navigate('/login'); }}>Logout</button>
      {showResetMsg && (
        <div className="stepmode-reset-msg">Progress has been reset!</div>
      )}
      <div className="stepmode-header">
        <h1>Step Mode</h1>
        <p>Choose a step to practice with:</p>
        <button 
          className="stepmode-back-btn"
          onClick={handleGoBack}
        >
          Back to Home
        </button>
        <button
          className="stepmode-back-btn"
          onClick={handleResetProgress}
        >
          Reset Progress
        </button>
      </div>
      <div className="stepmode-grid">
        {steps
          .filter(step => step.language === language)
          .map((step, idx) => {
            const userStep = userSteps.find(us => us.group_id === step.group_id);
            const isCompleted = userStep && userStep.score && userStep.score !== 0;
            return (
              <div
                key={step.group_id}
                className={`stepmode-card${isCompleted ? ' stepmode-card-completed' : ''}`}
                onClick={() => handleStepClick(step)}
                style={{ pointerEvents: 'auto' }}
              >
                <h3 className="stepmode-card-title">
                  Step {step.day} - {step.language}
                  {step.language === 'Spanish' && (
                    <img
                      src="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f1ea-1f1f8.svg"
                      alt="Spanish flag"
                      style={{
                        width: '1.5em',
                        height: '1.5em',
                        verticalAlign: 'middle',
                        marginLeft: '8px',
                        filter: 'drop-shadow(0 0 2px #222)'
                      }}
                    />
                  )}
                </h3>
                <p className="stepmode-card-level">
                  {isCompleted ? 'Completed' : 'In Progress'}
                </p>
                {step.image_url && (
                  <img src={step.image_url} alt={`Step ${step.day}`} className="stepmode-card-image" />
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default StepModePage;
