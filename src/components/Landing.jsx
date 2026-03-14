import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, Terminal, Download, Shield, BarChart2, Zap, Play, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';
import heroImage from '../assets/hero.png';

export const Landing = ({ onFileParsed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const processFile = (file) => {
    if (!file) return;
    const isValidType = file.name.endsWith('.rsc') || file.name.endsWith('.txt') || file.type === 'text/plain';
    if (!isValidType) {
      setError('Harap unggah file konfigurasi MikroTik (.rsc atau .txt).');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      onFileParsed(e.target.result);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const loadDemo = async (filename) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/demo/${filename}`);
      if (!response.ok) throw new Error('Gagal mengambil file demo');
      const content = await response.text();
      onFileParsed(content);
    } catch (err) {
      setError('Gagal memuat demo konfigurasi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-container animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Zap size={14} className="hero-badge-icon" />
            <span>v1.0 - Transformasi Visual MikroTik</span>
          </div>
          <h1 className="hero-title">
            Visualisasikan Konfigurasi <span className="text-gradient">MikroTik</span> Anda
          </h1>
          <p className="hero-description">
            Ubah baris perintah <code>.rsc</code> yang kompleks menjadi dashboard interaktif yang indah. 
            Analisis interface, routing, dan firewall dalam hitungan detik secara lokal di browser Anda.
          </p>
          
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => document.getElementById('file-upload').click()}>
              <UploadCloud size={18} /> Mulai Sekarang
            </button>
            <div className="demo-group">
              <span className="demo-label">Atau coba demo:</span>
              <div className="demo-buttons">
                <button className="demo-btn" onClick={() => loadDemo('test-mikrotik.rsc')} disabled={loading}>
                  <Play size={14} /> Full Config
                </button>
                <button className="demo-btn" onClick={() => loadDemo('script.rsc')} disabled={loading}>
                  <Play size={14} /> Basic Setup
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="hero-image-container">
            <img src={heroImage} alt="CoreView Hero" className="hero-image" />
            <div className="hero-glow"></div>
          </div>
        </div>
      </section>

      {/* Upload & Info Section */}
      <section className="info-section">
        <div 
          className={`uploader-container ${isDragging ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload').click()}
        >
          <UploadCloud className="uploader-icon" />
          <h3 className="uploader-title">Seret & Lepas File Konfigurasi</h3>
          <p className="uploader-sub">Mendukung format .rsc atau .txt hasil dari /export</p>
          
          <input 
            id="file-upload"
            type="file" 
            className="file-input" 
            accept=".rsc,.txt,text/plain"
            onChange={(e) => processFile(e.target.files[0])}
          />
          
          {error && <div className="uploader-error">{error}</div>}
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <Shield size={24} className="feature-icon success" />
            <h4>Aman & Privat</h4>
            <p>Semua proses parsing dilakukan 100% lokal di browser Anda. Tidak ada data yang dikirim ke server.</p>
          </div>
          <div className="feature-card">
            <BarChart2 size={24} className="feature-icon accent" />
            <h4>Visualisasi Instan</h4>
            <p>Ubah script mentah menjadi mind map, tabel routing, dan ringkasan langkah-demi-langkah.</p>
          </div>
          <div className="feature-card">
            <FileText size={24} className="feature-icon blue" />
            <h4>Export-Ready</h4>
            <p>Download hasil analisis sebagai resume konfigurasi yang mudah dibagikan ke tim.</p>
          </div>
        </div>
      </section>

      {/* Tutorial Accordion */}
      <section className="tutorial-section">
        <button 
          className="tutorial-toggle"
          onClick={() => setShowTutorial(!showTutorial)}
        >
          <HelpCircle size={20} />
          <span>Cara Export Konfigurasi MikroTik</span>
          {showTutorial ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>

        {showTutorial && (
          <div className="tutorial-content animate-slide-down">
            <div className="steps-container">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-info">
                  <h5>Buka Terminal</h5>
                  <p>Akses router via Winbox Terminal, WebFig, atau SSH/Telnet.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-info">
                  <h5>Jalankan Export</h5>
                  <div className="code-snippet">
                    <Terminal size={14} /> <code>/export file=config-export</code>
                  </div>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-info">
                  <h5>Unduh File</h5>
                  <p>Buka menu <strong>Files</strong> di router dan download <code>config-export.rsc</code>.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
      
      <footer className="landing-footer">
        <p>CoreView &copy; 2026 • Dibuat untuk Network Engineer Indonesia</p>
      </footer>
    </div>
  );
};
