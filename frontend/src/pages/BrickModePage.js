import React from 'react';
import { useNavigate } from 'react-router-dom';

const BrickModePage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <h1>Brick Mode</h1>
      <p>Welcome to Brick Mode! Here you'll build your language skills brick by brick.</p>
      <button 
        onClick={handleGoBack}
        style={{
          padding: '10px 20px',
          fontSize: '1rem',
          backgroundColor: '#58cc02',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Back to Home
      </button>
    </div>
  );
};

export default BrickModePage;
