import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BrickModePage from './pages/BrickModePage';
import LoginPage from './pages/LoginPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/brick-mode" element={<BrickModePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
