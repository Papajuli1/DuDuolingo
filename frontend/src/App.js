import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LeaderboardPage from './pages/LeaderboardPage';
import BrickModePage from './pages/BrickModePage';
import LoginPage from './pages/LoginPage';
import StepModePage from './pages/StepModePage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/brick-mode" element={<BrickModePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/step-mode" element={<StepModePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
