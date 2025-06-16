// src/index.js (version compatible avec React 17 et antérieur)
import React from 'react';
import ReactDOM from 'react-dom';
import "./index.css";
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);