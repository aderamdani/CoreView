import React, { useState, useCallback } from 'react';
import { UploadCloud, FileText, CheckCircle, ChevronDown, ChevronRight, Terminal, Download, HelpCircle, Shield, BarChart2 } from 'lucide-react';

export const Uploader = ({ onFileParsed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);

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

      {/* Tutorial Section */}
      <div style={{ marginTop: '3rem', maxWidth: '700px', width: '100%' }}>
        <button 
          onClick={() => setShowTutorial(!showTutorial)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: '1rem 1.5rem',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.target.style.background = 'var(--bg-elevated)'}
        >
          <HelpCircle size={20} />
          Cara Export Konfigurasi MikroTik
          {showTutorial ? <ChevronDown size={16} style={{ marginLeft: 'auto' }} /> : <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
        </button>

        {showTutorial && (
          <div style={{ 
            marginTop: '1rem', 
            background: 'var(--bg-elevated)', 
            border: '1px solid var(--border)', 
            borderRadius: 'var(--r-lg)',
            padding: '1.5rem',
            animation: 'slideDown 0.3s ease-out'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
                Ikuti langkah-langkah berikut untuk export konfigurasi MikroTik Anda:
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Step 1 */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '1rem',
                padding: '1rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)'
              }}>
                <div style={{
                  background: 'var(--accent)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  1
                </div>
                <div style={{ flex: 1 }}>
                  <h5 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: 600 }}>
                    Hubungkan ke router MikroTik
                  </h5>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    Buka Winbox, WebFig, atau hubungkan via SSH/Telnet ke perangkat MikroTik Anda.
                  </p>
                  <div style={{ 
                    background: 'var(--bg-base)', 
                    padding: '0.75rem', 
                    borderRadius: 'var(--r-sm)',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)'
                  }}>
                    <Terminal size={14} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    ssh admin@192.168.88.1
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '1rem',
                padding: '1rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)'
              }}>
                <div style={{
                  background: 'var(--accent)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  2
                </div>
                <div style={{ flex: 1 }}>
                  <h5 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: 600 }}>
                    Jalankan perintah export
                  </h5>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    Di terminal, jalankan perintah export untuk menghasilkan file konfigurasi.
                  </p>
                  <div style={{ 
                    background: 'var(--bg-base)', 
                    padding: '0.75rem', 
                    borderRadius: 'var(--r-sm)',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)'
                  }}>
                    <Terminal size={14} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    /export file=config-export
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    Ini akan membuat file bernama "config-export.rsc" di sistem file router.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '1rem',
                padding: '1rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)'
              }}>
                <div style={{
                  background: 'var(--accent)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  3
                </div>
                <div style={{ flex: 1 }}>
                  <h5 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: 600 }}>
                    Download file yang diekspor
                  </h5>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    Download file .rsc yang dihasilkan dari router MikroTik Anda.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ 
                      background: 'var(--bg-base)', 
                      padding: '0.5rem 0.75rem', 
                      borderRadius: 'var(--r-sm)',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <span style={{ fontWeight: 600 }}>Winbox:</span> Files → Download
                    </div>
                    <div style={{ 
                      background: 'var(--bg-base)', 
                      padding: '0.5rem 0.75rem', 
                      borderRadius: 'var(--r-sm)',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <span style={{ fontWeight: 600 }}>WebFig:</span> Files → Download
                    </div>
                    <div style={{ 
                      background: 'var(--bg-base)', 
                      padding: '0.5rem 0.75rem', 
                      borderRadius: 'var(--r-sm)',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <Download size={12} />
                      FTP/SFTP
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '1rem',
                padding: '1rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)'
              }}>
                <div style={{
                  background: 'var(--accent)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  4
                </div>
                <div style={{ flex: 1 }}>
                  <h5 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: 600 }}>
                    Upload di sini
                  </h5>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    Drag and drop file .rsc yang didownload ke area upload di atas.
                  </p>
                  <div style={{ 
                    background: 'var(--status-success-subtle)', 
                    padding: '0.75rem', 
                    borderRadius: 'var(--r-sm)',
                    border: '1px solid var(--status-success)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <CheckCircle size={16} style={{ color: 'var(--status-success)' }} />
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 500 }}>
                      Konfigurasi Anda akan di-parse dan divisualisasikan secara instan!
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              background: 'var(--bg-warning-subtle)', 
              border: '1px solid var(--status-warning)', 
              borderRadius: 'var(--r-md)',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)'
            }}>
              <strong style={{ color: 'var(--status-warning)' }}>💡 Tips:</strong> Perintah export akan menangkap semua konfigurasi router Anda termasuk interface, routing, firewall rules, dan lainnya. Pastikan Anda memiliki izin yang sesuai untuk export data konfigurasi yang sensitif.
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem', maxWidth: '700px', textAlign: 'center' }}>
        <div style={{ 
          background: 'var(--bg-elevated)', 
          border: '1px solid var(--border)', 
          borderRadius: 'var(--r-lg)',
          padding: '1.5rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Shield size={20} style={{ color: 'var(--status-success)' }} />
            <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1rem', fontWeight: 600 }}>
              🔒 Aman & Privat
            </h4>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>
            Tool ini akan mengurai file export MikroTik Anda secara lokal di browser. <strong style={{ color: 'var(--text-primary)' }}>Tidak ada data yang dikirim ke server manapun.</strong>
          </p>
        </div>

        <div style={{ 
          background: 'var(--bg-elevated)', 
          border: '1px solid var(--border)', 
          borderRadius: 'var(--r-lg)',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <BarChart2 size={20} style={{ color: 'var(--accent)' }} />
            <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1rem', fontWeight: 600 }}>
              ✨ Transformasi Visual
            </h4>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>
            Mengubah perintah routing yang kompleks menjadi <strong style={{ color: 'var(--text-primary)' }}>dashboard yang indah dan mudah dipahami</strong> dengan visualisasi interaktif.
          </p>
        </div>
      </div>
    </div>
  );
};
