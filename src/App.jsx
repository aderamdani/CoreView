import React, { useState, useEffect } from 'react';
import './index.css';
import './App.css';
import { parseMikroTikConfig } from './utils/parser';
import { Landing } from './components/Landing';
import { Dashboard } from './components/Dashboard';
import { Sun, Moon, Github } from 'lucide-react';

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
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <a 
            href="https://github.com/aderamdani/CoreView" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: 'var(--text-secondary)', 
              display: 'flex', 
              alignItems: 'center',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            title="View on GitHub"
          >
            <Github size={20} />
          </a>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{ 
              background: 'none', border: 'none', cursor: 'pointer', 
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
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
