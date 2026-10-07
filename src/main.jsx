import React from 'react';
import ReactDOM from 'react-dom/client';
// Imported before the app so Tailwind's layers are established first and the
// hand-written design system in index.css wins any property they share.
import './tailwind.css';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
