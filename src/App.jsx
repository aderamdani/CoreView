import React, { useState } from 'react';
import './index.css';
import './App.css';
import { parseMikroTikConfig } from './utils/parser';
import { Uploader } from './components/Uploader';
import { Dashboard } from './components/Dashboard';

function App() {
  const [config, setConfig] = useState(null);

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
        <h1 className="header-title text-gradient">DashMik</h1>
        {config && (
          <button className="btn btn-primary animate-fade-in" onClick={handleReset}>
            ↑ Upload New File
          </button>
        )}
      </header>

      <main className="main-content">
        {!config ? (
          <Uploader onFileParsed={handleFileParsed} />
        ) : (
          <Dashboard config={config} />
        )}
      </main>
    </div>
  );
}

export default App;
