import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  Terminal,
  Shield,
  BarChart2,
  Zap,
  Play,
  HelpCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import heroImage from '../assets/hero.png';

export const Landing = ({ onFileParsed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  // The drop zone is the single upload surface. The hero button and the drop
  // zone both reach the one input through these refs, instead of querying the
  // DOM with getElementById.
  const fileInputRef = useRef(null);
  const uploaderRef = useRef(null);

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
    const isValidType =
      file.name.endsWith('.rsc') || file.name.endsWith('.txt') || file.type === 'text/plain';
    if (!isValidType) {
      setError('Harap unggah file konfigurasi MikroTik (.rsc atau .txt).');
      return;
    }

    setError('');
    // FileReader is genuinely asynchronous, so the loading state follows real
    // work rather than a delay added to make the spinner appear.
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setLoading(false);
      onFileParsed(e.target.result);
    };
    reader.onerror = () => {
      setLoading(false);
      setError('Gagal membaca file. Coba pilih ulang.');
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

  const openFilePicker = () => {
    if (!loading) fileInputRef.current?.click();
  };

  // Brings the upload surface into view and focuses it. The hero button must
  // not open a second file picker for the same input.
  const focusUploader = () => {
    uploaderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    uploaderRef.current?.focus({ preventScroll: true });
  };

  const loadDemo = async (filename) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/demo/${filename}`);
      if (!response.ok) throw new Error(`demo ${filename} tidak tersedia`);
      onFileParsed(await response.text());
    } catch {
      // Parsing happens in the parent, which reports its own error. This catch
      // only covers fetching the demo file, so the message stays about loading.
      setError('Gagal memuat demo konfigurasi. Periksa koneksi lalu coba lagi.');
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
            <span>{`v${__APP_VERSION__} - Transformasi Visual MikroTik`}</span>
          </div>
          <h1 className="hero-title">
            Visualisasikan Konfigurasi <span className="text-gradient">MikroTik</span> Anda
          </h1>
          <p className="hero-description">
            Ubah baris perintah <code>.rsc</code> yang kompleks menjadi dashboard interaktif yang indah.
            Analisis interface, routing, dan firewall dalam hitungan detik secara lokal di browser Anda.
          </p>

          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={focusUploader} disabled={loading}>
              <UploadCloud size={18} /> {loading ? 'Memproses...' : 'Mulai Sekarang'}
            </button>
            <div className="demo-group">
              <span className="demo-label">Atau coba demo:</span>
              <div className="demo-buttons">
                <button className="demo-btn" onClick={() => loadDemo('test-mikrotik.rsc')} disabled={loading}>
                  <Play size={14} /> Konfigurasi Lengkap
                </button>
                <button className="demo-btn" onClick={() => loadDemo('script.rsc')} disabled={loading}>
                  <Play size={14} /> Setup Dasar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-image-container">
            <img src={heroImage} alt="Pratinjau antarmuka CoreView" className="hero-image" />
          </div>
        </div>
      </section>

      {/* Upload & Info Section */}
      <section className="info-section">
        <div
          ref={uploaderRef}
          className={`uploader-container ${isDragging ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFilePicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openFilePicker();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Pilih atau seret file konfigurasi MikroTik"
        >
          {loading ? <div className="uploader-spinner" /> : <UploadCloud className="uploader-icon" />}
          <h3 className="uploader-title">
            {loading ? 'Memproses konfigurasi...' : 'Seret & Lepas File Konfigurasi'}
          </h3>
          <p className="uploader-sub">Mendukung format .rsc atau .txt hasil dari /export</p>

          <input
            ref={fileInputRef}
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
            <p>
              Semua proses parsing dilakukan 100% lokal di browser Anda. Tidak ada data yang dikirim ke
              server.
            </p>
          </div>
          <div className="feature-card">
            <BarChart2 size={24} className="feature-icon accent" />
            <h4>Visualisasi Instan</h4>
            <p>Ubah script mentah menjadi mind map, tabel routing, dan ringkasan langkah-demi-langkah.</p>
          </div>
          <div className="feature-card feature-card-pending">
            <FileText size={24} className="feature-icon blue" />
            <h4>
              Export-Ready
              <span className="soon-badge">Segera</span>
            </h4>
            <p>Fitur untuk mengunduh hasil analisis sebagai resume konfigurasi masih dalam pengembangan.</p>
          </div>
        </div>
      </section>

      {/* Tutorial Accordion */}
      <section className="tutorial-section">
        <button className="tutorial-toggle" onClick={() => setShowTutorial(!showTutorial)}>
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
                  <p>
                    Buka menu <strong>Files</strong> di router dan download <code>config-export.rsc</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <footer className="landing-footer">
        <p>CoreView &copy; 2026</p>
      </footer>
    </div>
  );
};
