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

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
        <h1>The Haki Path</h1>
        <p>Complete one step each day to master your Spanish skills!</p>
        <div className="stepmode-btn-row">
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
      </div>
      
      <div className="stepmode-week-section">
        <h2 className="stepmode-week-title">📅 Your Weekly Journey</h2>
        <div className="stepmode-week-grid">
          {steps
            .filter(step => step.language === language)
            .sort((a, b) => a.day - b.day)
            .map((step, idx) => {
              const userStep = userSteps.find(us => us.group_id === step.group_id);
              const isCompleted = userStep && userStep.score && userStep.score !== 0;
              const dayName = dayNames[step.day - 1] || `Day ${step.day}`;
              
              return (
                <div
                  key={step.group_id}
                  className={`stepmode-day-card${isCompleted ? ' completed' : ''}`}
                  onClick={() => handleStepClick(step)}
                >
                  <div className="stepmode-day-number">{step.day}</div>
                  <div className="stepmode-day-name">{dayName}</div>
                  <div className={`stepmode-day-status ${isCompleted ? 'completed' : 'pending'}`}>
                    {isCompleted ? 'Completed' : 'Start Now'}
                  </div>
                  {step.image_url && (
                    <img 
                      src={step.image_url} 
                      alt={`Day ${step.day}`} 
                      className="stepmode-day-image" 
                    />
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default StepModePage;
