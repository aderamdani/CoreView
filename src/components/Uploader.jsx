import React, { useState, useCallback } from 'react';
import { UploadCloud, FileText, CheckCircle } from 'lucide-react';

export const Uploader = ({ onFileParsed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const processFile = (file) => {
    if (!file) return;
    
    // Accept .rsc or .txt
    const isValidType = file.name.endsWith('.rsc') || file.name.endsWith('.txt') || file.type === 'text/plain';
    if (!isValidType) {
      setError('Please upload a valid .rsc or .txt MikroTik configuration file.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      try {
        onFileParsed(content);
      } catch (err) {
        setError('Failed to parse file. Is it a valid RouterOS export?');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [onFileParsed]);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div 
        className={`uploader-container ${isDragging ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload').click()}
      >
        <UploadCloud className="uploader-icon" />
        <h3 className="uploader-title">Upload RouterOS Config</h3>
        <p className="uploader-sub">Drag & Drop your .rsc or .txt file here, or click to browse.</p>
        
        <input 
          id="file-upload"
          type="file" 
          className="file-input" 
          accept=".rsc,.txt,text/plain"
          onChange={handleChange}
        />
        
        {error && (
          <div style={{ marginTop: '1rem', color: 'var(--status-error)', fontSize: '0.9rem', fontWeight: 600 }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem', maxWidth: '600px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        <p>This tool will safely parse your MikroTik export file locally in your browser. No data is sent to any server.</p>
        <p style={{ marginTop: '0.5rem' }}>It transforms complex routing commands into a beautiful, easy-to-understand dashboard.</p>
      </div>
    </div>
  );
};
