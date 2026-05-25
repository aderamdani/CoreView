import React, { useState, useCallback } from 'react';
import { Zap, Play, ChevronDown, RotateCcw, AlertCircle, CheckCircle2, Info, Shield } from 'lucide-react';
import { tracePacket } from '../utils/packetTracer';

/* ── Preset scenarios ────────────────────────────────────────────── */
const PRESETS = [
  { label: 'SSH dari Internet',     icon: '🔑', f: { srcIp:'1.2.3.4',         dstIp:'192.168.1.1', protocol:'tcp',  srcPort:'54321', dstPort:'22',   chain:'input',   connectionState:'new' } },
  { label: 'Ping dari WAN',         icon: '📡', f: { srcIp:'1.2.3.4',         dstIp:'192.168.1.1', protocol:'icmp', srcPort:'',      dstPort:'',     chain:'input',   connectionState:'new' } },
  { label: 'Winbox (8291)',         icon: '🖥️', f: { srcIp:'1.2.3.4',         dstIp:'192.168.1.1', protocol:'tcp',  srcPort:'54321', dstPort:'8291', chain:'input',   connectionState:'new' } },
  { label: 'HTTP dari LAN',         icon: '🌐', f: { srcIp:'192.168.1.100',   dstIp:'8.8.8.8',     protocol:'tcp',  srcPort:'54321', dstPort:'80',   chain:'forward', connectionState:'new' } },
  { label: 'DNS dari LAN',          icon: '🔍', f: { srcIp:'192.168.1.100',   dstIp:'8.8.8.8',     protocol:'udp',  srcPort:'54321', dstPort:'53',   chain:'forward', connectionState:'new' } },
  { label: 'Return traffic (established)', icon: '↩️', f: { srcIp:'8.8.8.8', dstIp:'192.168.1.100', protocol:'tcp', srcPort:'80',  dstPort:'54321', chain:'forward', connectionState:'established' } },
  { label: 'Telnet (port 23)',       icon: '⚠️', f: { srcIp:'1.2.3.4',        dstIp:'192.168.1.1', protocol:'tcp',  srcPort:'54321', dstPort:'23',   chain:'input',   connectionState:'new' } },
  { label: 'HTTPS ke internet',      icon: '🔐', f: { srcIp:'192.168.1.100',  dstIp:'1.1.1.1',     protocol:'tcp',  srcPort:'54321', dstPort:'443',  chain:'forward', connectionState:'new' } },
];

/* ── Verdict config ──────────────────────────────────────────────── */
const VERDICT = {
  accept: {
    icon: '✅', label: 'DITERIMA (ACCEPT)', color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.3)',
    explain: (rule, chain) =>
      `Paket DITERIMA oleh firewall chain "${chain}".${rule?.comment ? ` Rule yang cocok: "${rule.comment}".` : ''} Koneksi ini diizinkan masuk/lewat router.`,
  },
  drop: {
    icon: '🚫', label: 'DIBUANG (DROP)', color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)',
    explain: (rule, chain) =>
      `Paket DIBUANG secara diam-diam oleh chain "${chain}".${rule?.comment ? ` Rule: "${rule.comment}".` : ''} Pengirim tidak mendapat respons apapun — koneksi langsung "mati" tanpa pemberitahuan. Ini pilihan paling aman untuk memblokir traffic berbahaya.`,
  },
  reject: {
    icon: '⛔', label: 'DITOLAK (REJECT)', color: '#f97316',
    bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.3)',
    explain: (rule, chain) =>
      `Paket DITOLAK oleh chain "${chain}".${rule?.comment ? ` Rule: "${rule.comment}".` : ''} Berbeda dengan DROP, pengirim mendapat pesan "connection refused" atau "host unreachable". Berguna untuk jaringan internal agar tidak menunggu timeout.`,
  },
  'no-match': {
    icon: '⚠️', label: 'TIDAK ADA RULE YANG COCOK', color: '#eab308',
    bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.3)',
    explain: (rule, chain) =>
      `Tidak ada rule di chain "${chain}" yang cocok dengan paket ini. RouterOS secara default MENERIMA paket jika tidak ada rule yang menanganinya. Ini bisa menjadi celah keamanan jika chain "${chain}" tidak memiliki aturan "drop all" di baris terakhir!`,
  },
};

/* ── Small components ────────────────────────────────────────────── */
const ActionBadge = ({ action }) => {
  const map = {
    accept:      { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e',  border: 'rgba(34,197,94,0.3)'   },
    drop:        { bg: 'rgba(239,68,68,0.15)',    color: '#ef4444',  border: 'rgba(239,68,68,0.3)'   },
    reject:      { bg: 'rgba(249,115,22,0.15)',   color: '#f97316',  border: 'rgba(249,115,22,0.3)'  },
    passthrough: { bg: 'rgba(99,102,241,0.15)',   color: '#818cf8',  border: 'rgba(99,102,241,0.3)'  },
    log:         { bg: 'rgba(100,116,139,0.15)',  color: '#94a3b8',  border: 'rgba(100,116,139,0.3)' },
    'add-to-list': { bg: 'rgba(234,179,8,0.15)', color: '#eab308',  border: 'rgba(234,179,8,0.3)'   },
  };
  const c = map[action] || map.log;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700,
      letterSpacing: '0.05em', textTransform: 'uppercase',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`, flexShrink: 0,
    }}>{action}</span>
  );
};

const FieldVal = ({ label, value }) => (
  <div style={{ background: 'var(--bg-elevated)', borderRadius: 6, padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', gap: 6, alignItems: 'center', border: '1px solid var(--border)' }}>
    <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
    <code style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{value || '—'}</code>
  </div>
);

/* ── Main component ──────────────────────────────────────────────── */
export const PacketTracer = ({ config, onNavigate }) => {
  const filterRules = config.firewall?.filter || [];

  const [form, setForm] = useState({
    srcIp: '1.2.3.4', dstIp: '192.168.1.1',
    protocol: 'tcp', srcPort: '54321', dstPort: '22',
    chain: 'input', inInterface: '', connectionState: 'new',
  });
  const [result, setResult]   = useState(null);
  const [expanded, setExpanded] = useState({});

  const activeRules = filterRules.filter(r => r.disabled !== 'yes');
  const chainCount  = activeRules.filter(r => r.chain === form.chain).length;

  const update = (k, v) => { setForm(f => ({ ...f, [k]: v })); setResult(null); };
  const applyPreset = p => { setForm(p.f); setResult(null); setExpanded({}); };
  const handleTrace = useCallback(() => {
    setResult(tracePacket(form, filterRules));
    setExpanded({});
  }, [form, filterRules]);

  const inp = {
    width: '100%', padding: '8px 12px', borderRadius: 'var(--r-sm)',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'monospace',
    outline: 'none', boxSizing: 'border-box',
  };
  const lbl = {
    fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 5, display: 'block',
  };

  return (
    <div className="animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="glass-panel config-section" style={{ marginBottom: '1.25rem' }}>
        <div className="section-header" style={{ marginBottom: '0.75rem' }}>
          <Zap className="summary-card-icon" />
          <h2 className="section-title">Packet Tracer — Simulator Firewall</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7, margin: '0 0 0.75rem' }}>
          Simulasikan apakah sebuah koneksi akan <strong style={{ color: '#22c55e' }}>diterima</strong> atau{' '}
          <strong style={{ color: '#ef4444' }}>diblokir</strong> oleh firewall router ini.
          Sistem mengikuti logika <em>first-match</em> RouterOS — rule pertama yang cocok menang.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>📋 Rules aktif: <strong style={{ color: 'var(--text-primary)' }}>{activeRules.length}</strong></span>
          <span>🔍 Rules di chain <code style={{ background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: 4 }}>{form.chain}</code>:
            <strong style={{ color: 'var(--text-primary)' }}> {chainCount}</strong>
          </span>
          {filterRules.length === 0 && (
            <span style={{ color: '#f97316', fontWeight: 600 }}>
              ⚠️ Tidak ada firewall rules — semua traffic akan diterima default
            </span>
          )}
        </div>
      </div>

      {/* ── Preset Buttons ──────────────────────────────────────── */}
      <div className="glass-panel config-section" style={{ marginBottom: '1.25rem' }}>
        <div style={lbl}>Skenario Umum — klik untuk isi form otomatis</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PRESETS.map((p, i) => (
            <button
              key={i} onClick={() => applyPreset(p)}
              style={{
                padding: '6px 13px', borderRadius: 'var(--r-sm)', cursor: 'pointer',
                fontSize: '0.82rem', background: 'var(--bg-elevated)',
                border: '1px solid var(--border)', color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-light)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Form ────────────────────────────────────────────────── */}
      <div className="glass-panel config-section" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>

          <div>
            <label style={lbl}>IP Sumber <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400 }}>(pengirim)</span></label>
            <input style={inp} value={form.srcIp} onChange={e => update('srcIp', e.target.value)} placeholder="1.2.3.4" />
          </div>

          <div>
            <label style={lbl}>IP Tujuan <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400 }}>(penerima)</span></label>
            <input style={inp} value={form.dstIp} onChange={e => update('dstIp', e.target.value)} placeholder="192.168.1.1" />
          </div>

          <div>
            <label style={lbl}>Protokol</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={form.protocol} onChange={e => update('protocol', e.target.value)}>
              <option value="tcp">TCP — web, SSH, FTP</option>
              <option value="udp">UDP — DNS, VoIP, game</option>
              <option value="icmp">ICMP — Ping</option>
              <option value="gre">GRE — VPN L2TP</option>
            </select>
          </div>

          <div>
            <label style={lbl}>Arah / Chain</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={form.chain} onChange={e => update('chain', e.target.value)}>
              <option value="input">INPUT — menuju router</option>
              <option value="forward">FORWARD — melewati router</option>
              <option value="output">OUTPUT — dari router</option>
            </select>
          </div>

          {form.protocol !== 'icmp' && (
            <>
              <div>
                <label style={lbl}>Port Sumber</label>
                <input style={inp} value={form.srcPort} onChange={e => update('srcPort', e.target.value)} placeholder="54321" />
              </div>
              <div>
                <label style={lbl}>Port Tujuan</label>
                <input style={inp} value={form.dstPort} onChange={e => update('dstPort', e.target.value)} placeholder="22, 80, 443..." />
              </div>
            </>
          )}

          <div>
            <label style={lbl}>Interface Masuk <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400 }}>(opsional)</span></label>
            <input style={inp} value={form.inInterface} onChange={e => update('inInterface', e.target.value)} placeholder="ether1 (kosong = skip)" />
          </div>

          <div>
            <label style={lbl}>Status Koneksi</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={form.connectionState} onChange={e => update('connectionState', e.target.value)}>
              <option value="new">new — koneksi baru</option>
              <option value="established">established — sudah ada</option>
              <option value="related">related — terkait</option>
              <option value="invalid">invalid</option>
            </select>
          </div>

        </div>

        {/* Packet summary */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1rem', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: 4, alignSelf: 'center' }}>Simulasi:</span>
          <FieldVal label="src"  value={form.srcIp} />
          <FieldVal label="dst"  value={form.dstIp} />
          <FieldVal label="proto" value={form.protocol.toUpperCase()} />
          {form.protocol !== 'icmp' && form.dstPort && <FieldVal label="dport" value={form.dstPort} />}
          <FieldVal label="chain" value={form.chain} />
          <FieldVal label="state" value={form.connectionState} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleTrace}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px',
              background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: 'var(--r-sm)', cursor: 'pointer', fontWeight: 700,
              fontSize: '0.92rem', fontFamily: 'inherit', transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Play size={15} /> Trace Packet
          </button>
          {result && (
            <button
              onClick={() => { setResult(null); setExpanded({}); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
                background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-sm)', cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'inherit',
              }}
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Result ──────────────────────────────────────────────── */}
      {result && (() => {
        const v = VERDICT[result.verdict];
        const { steps, matchedStep } = result;
        const stepsChecked = steps.length;

        return (
          <>
            {/* Verdict banner */}
            <div style={{
              borderRadius: 'var(--r-md)', padding: '1.5rem 2rem', marginBottom: '1.25rem',
              background: v.bg, border: `2px solid ${v.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ fontSize: 40, lineHeight: 1 }}>{v.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: v.color, marginBottom: 8 }}>{v.label}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {v.explain(result.matchedRule, form.chain)}
                  </div>
                  {matchedStep && (
                    <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)', fontSize: '0.83rem', border: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Cocok pada</span>
                      <strong style={{ color: v.color }}>Rule #{matchedStep.ruleIndex}</strong>
                      {result.matchedRule?.comment && <span style={{ color: 'var(--text-secondary)' }}>— "{result.matchedRule.comment}"</span>}
                      <button
                        onClick={() => onNavigate?.('firewall-filter')}
                        style={{ marginLeft: 6, padding: '2px 8px', borderRadius: 4, background: v.bg, border: `1px solid ${v.border}`, color: v.color, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        Buka Firewall →
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                  <div>{stepsChecked} rule diperiksa</div>
                  <div>{steps.filter(s => s.matched).length} rule cocok</div>
                </div>
              </div>
            </div>

            {/* Trace steps */}
            <div className="glass-panel config-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontWeight: 700 }}>
                  Trace Log — Chain <code style={{ background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 4, fontSize: '0.83rem' }}>{form.chain}</code>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
                  <span style={{ color: '#22c55e' }}>✅ = cocok</span>
                  <span style={{ color: '#ef4444' }}>❌ = kondisi gagal</span>
                  <span style={{ opacity: 0.5 }}>↷ = dilewati</span>
                </div>
              </div>

              {steps.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2.5rem', fontSize: '0.9rem' }}>
                  Tidak ada rule aktif di chain "{form.chain}".
                  {filterRules.length > 0 && <div style={{ marginTop: 8 }}>Rules ada, tapi di chain lain. Cek chain INPUT/FORWARD/OUTPUT.</div>}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {steps.map((step, idx) => {
                    const isFinalMatch = step.matched && step.ruleIndex === (result.matchedStep?.ruleIndex);
                    const isExpanded = expanded[idx];
                    const rowBorder = isFinalMatch ? v.border : step.matched ? 'rgba(99,102,241,0.25)' : 'var(--border)';
                    const rowBg = isFinalMatch ? v.bg : step.matched ? 'rgba(99,102,241,0.05)' : 'transparent';

                    return (
                      <div key={idx} style={{ borderRadius: 8, border: `1px solid ${rowBorder}`, background: rowBg, opacity: !step.matched && !isFinalMatch ? 0.55 : 1, transition: 'opacity 0.15s' }}>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', flexWrap: 'wrap' }}
                          onClick={() => setExpanded(p => ({ ...p, [idx]: !p[idx] }))}
                        >
                          <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: 28 }}>#{step.ruleIndex}</span>

                          <ActionBadge action={step.rule.action} />

                          <span style={{ flex: 1, fontSize: '0.84rem', color: 'var(--text-secondary)', minWidth: 80 }}>
                            {step.rule.comment || <span style={{ opacity: 0.45, fontStyle: 'italic' }}>tanpa komentar</span>}
                          </span>

                          {/* conditions pill */}
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {step.conditions.length} kondisi
                          </span>

                          {/* match status badge */}
                          <span style={{
                            padding: '2px 9px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700,
                            border: `1px solid ${isFinalMatch ? v.border : step.matched ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
                            background: isFinalMatch ? v.bg : step.matched ? 'rgba(99,102,241,0.12)' : 'transparent',
                            color: isFinalMatch ? v.color : step.matched ? '#818cf8' : 'var(--text-muted)',
                          }}>
                            {isFinalMatch ? `★ ${result.verdict.toUpperCase()}` : step.matched ? '● PASS' : '↷ SKIP'}
                          </span>

                          <ChevronDown size={12} style={{ opacity: 0.4, flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </div>

                        {isExpanded && (
                          <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--border)' }}>

                            {/* No conditions = match all */}
                            {step.conditions.length === 0 && step.unknownChecks.length === 0 && (
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 10, fontStyle: 'italic' }}>
                                Rule ini tidak memiliki kondisi — cocok dengan SEMUA paket di chain ini.
                              </div>
                            )}

                            {/* Evaluated conditions */}
                            {step.conditions.length > 0 && (
                              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {step.conditions.map((c, ci) => (
                                  <div key={ci} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.82rem' }}>
                                    <span style={{ flexShrink: 0 }}>{c.matched ? '✅' : '❌'}</span>
                                    <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', minWidth: 140, fontSize: '0.76rem', flexShrink: 0 }}>{c.field}</span>
                                    <span style={{ color: c.matched ? 'var(--text-secondary)' : '#f87171', flex: 1 }}>{c.desc}</span>
                                    {!c.matched && (
                                      <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontFamily: 'monospace', flexShrink: 0 }}>
                                        ← nilai paket: {
                                          c.field === 'src-address' ? form.srcIp
                                          : c.field === 'dst-address' ? form.dstIp
                                          : c.field === 'dst-port' ? form.dstPort
                                          : c.field === 'src-port' ? form.srcPort
                                          : c.field === 'protocol' ? form.protocol
                                          : c.field === 'connection-state' ? form.connectionState
                                          : c.field === 'in-interface' ? (form.inInterface || 'tidak diisi')
                                          : '?'
                                        }
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Unknown checks (address-list, interface-list) */}
                            {step.unknownChecks.length > 0 && (
                              <div style={{ marginTop: 8 }}>
                                {step.unknownChecks.map((u, ui) => (
                                  <div key={ui} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.79rem', opacity: 0.7, marginTop: 4 }}>
                                    <span>❓</span>
                                    <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', minWidth: 140, fontSize: '0.76rem' }}>{u.field}</span>
                                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                      "{u.value}" — tidak dapat dievaluasi (butuh data {u.field.includes('address') ? 'address-list' : 'interface-list'})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Skip reason */}
                            {!step.matched && step.failedFields.length > 0 && (
                              <div style={{ marginTop: 8, padding: '5px 10px', background: 'rgba(100,116,139,0.1)', borderRadius: 6, fontSize: '0.77rem', color: 'var(--text-muted)' }}>
                                Dilewati karena: <strong style={{ color: 'var(--text-secondary)' }}>{step.failedFields.join(', ')}</strong> tidak cocok
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Final "end of chain" row */}
                  {result.verdict === 'no-match' && (
                    <div style={{ borderRadius: 8, border: '1px dashed var(--border)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, opacity: 0.7, marginTop: 4 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: 28 }}>—</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        End of chain — tidak ada rule yang cocok → RouterOS default: ACCEPT
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        );
      })()}

      {/* ── Empty state hint ─────────────────────────────────────── */}
      {!result && filterRules.length > 0 && (
        <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <Zap size={32} style={{ opacity: 0.2, margin: '0 auto 1rem', display: 'block' }} />
          Pilih skenario di atas atau isi form, lalu klik <strong>Trace Packet</strong>
        </div>
      )}
    </div>
  );
};
