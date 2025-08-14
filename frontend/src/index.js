import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.js';
import smartlookClient from 'smartlook-client';

smartlookClient.init('694fe74129901041c3dee54c4e8a93dc73dcfe33', { region: 'eu' });

// Identify user in Smartlook if username exists in localStorage
const smartlookUsername = localStorage.getItem('username');
if (smartlookUsername) {
  smartlookClient.identify(smartlookUsername);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
