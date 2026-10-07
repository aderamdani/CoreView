import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import './App.css';
import { parseMikroTikConfig } from './utils/parser';
import { Landing } from './components/Landing';
import { Dashboard } from './components/Dashboard';
import { AboutPanel } from './components/AboutPanel';
import { Sun, Moon, Github, Search, X, AlertTriangle } from 'lucide-react';

function App() {
  const [config, setConfig] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    // Two conventions, one switch.
    //
    // index.css keys the design system off `html.light`, with dark as the
    // default. Tailwind and Evilcharts key their `dark:` variant off a `dark`
    // class. Both are toggled here so the two systems cannot disagree about
    // which theme is active.
    const root = document.documentElement;
    root.classList.toggle('light', !isDarkMode);
    root.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleFileParsed = (content) => {
    try {
      setConfig(parseMikroTikConfig(content));
      setParseError(null);
    } catch (error) {
      // Keep the previous state untouched: a failed upload must not wipe a
      // dashboard the user is currently reading.
      setParseError(error.message);
    }
  };

  const handleReset = () => {
    setConfig(null);
    setParseError(null);
    setSearchTerm('');
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="header-title text-gradient">CoreView</h1>

        {config && (
          <div className="header-search-wrapper">
            <Search size={14} className="header-search-icon" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Cari konfigurasi... (⌘K)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="header-search-input"
            />
            {searchTerm && (
              <button
                className="header-search-clear"
                onClick={() => setSearchTerm('')}
                title="Hapus pencarian"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <a
            href="https://github.com/aderamdani/CoreView"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            title="View on GitHub"
          >
            <Github size={20} />
          </a>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <AboutPanel />

          {config && (
            <button className="btn btn-primary animate-fade-in" onClick={handleReset}>
              ↑ Upload Baru
            </button>
          )}
        </div>
      </header>

      <main className="main-content">
        {parseError && (
          <div className="parse-error" role="alert">
            <AlertTriangle size={18} className="parse-error-icon" />
            <div>
              <p className="parse-error-title">Gagal membaca file</p>
              <p className="parse-error-message">{parseError}</p>
            </div>
          </div>
        )}

        {!config ? (
          <Landing onFileParsed={handleFileParsed} />
        ) : (
          <Dashboard config={config} searchTerm={searchTerm} />
        )}
      </main>
    </div>
  );
}

export default App;
