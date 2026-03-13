import React, { useState, useEffect } from 'react';
import './index.css';
import './App.css';
import { parseMikroTikConfig } from './utils/parser';
import { Uploader } from './components/Uploader';
import { Dashboard } from './components/Dashboard';
import { Sun, Moon, Search, Download } from 'lucide-react';

function App() {
  const [config, setConfig] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
    setSearchTerm('');
  };

  const handleExportJson = () => {
    if (!config) return;
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coreview_export_${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
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
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '4px 12px' }}>
                <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
                <input 
                  type="text" 
                  placeholder="Search configuration..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem', width: '200px' }}
                />
              </div>
              <button className="btn" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} onClick={handleExportJson} title="Export as JSON">
                <Download size={16} /> JSON
              </button>
              <button className="btn btn-primary animate-fade-in" onClick={handleReset}>
                ↑ Upload New
              </button>
            </>
          )}
        </div>
      </header>

      <main className="main-content">
        {!config ? (
          <Uploader onFileParsed={handleFileParsed} />
        ) : (
          <Dashboard config={config} searchTerm={searchTerm} />
        )}
      </main>
    </div>
  );
}

export default App;
