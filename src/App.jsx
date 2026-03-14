import React, { useState, useEffect } from 'react';
import './index.css';
import './App.css';
import { parseMikroTikConfig } from './utils/parser';
import { Landing } from './components/Landing';
import { Dashboard } from './components/Dashboard';
import { Sun, Moon } from 'lucide-react';

function App() {
  const [config, setConfig] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (!isDarkMode) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [isDarkMode]);

  const handleFileParsed = (content) => {
    const parsedData = parseMikroTikConfig(content);
    console.log("Parsed configuration:", parsedData);
    setConfig(parsedData);
  };

  const handleReset = () => {
    setConfig(null);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="header-title text-gradient">CoreView</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{ 
              background: 'none', border: 'none', cursor: 'pointer', 
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' 
            }}
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {config && (
            <>
              <button className="btn btn-primary animate-fade-in" onClick={handleReset}>
                ↑ Upload Baru
              </button>
            </>
          )}
        </div>
      </header>

      <main className="main-content">
        {!config ? (
          <Landing onFileParsed={handleFileParsed} />
        ) : (
          <Dashboard config={config} />
        )}
      </main>
    </div>
  );
}

export default App;
