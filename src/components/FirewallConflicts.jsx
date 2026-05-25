import React, { useState } from 'react';
import { detectConflicts, detectDuplicates } from '../utils/detectConflicts';

const CHAIN_COLOR = {
  input:   { bg: 'rgba(99,102,241,0.12)',  border: '#6366f1', text: '#818cf8' },
  forward: { bg: 'rgba(34,197,94,0.10)',   border: '#22c55e', text: '#4ade80' },
  output:  { bg: 'rgba(249,115,22,0.10)',  border: '#f97316', text: '#fb923c' },
};

function RuleRef({ rule, idx, dim }) {
  const action = (rule.action || 'accept').toLowerCase();
  const color = action === 'accept' ? '#22c55e' : action === 'drop' ? '#ef4444' : '#f97316';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '4px 10px', borderRadius: '6px',
      background: `${color}18`, border: `1px solid ${color}50`,
      opacity: dim ? 0.7 : 1,
    }}>
      <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.72rem' }}>#{idx}</span>
      <span style={{ fontWeight: 600, color, fontSize: '0.8rem' }}>{action.toUpperCase()}</span>
      {rule.protocol && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{rule.protocol}</span>}
      {rule['dst-port'] && <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>:{rule['dst-port']}</span>}
      {rule['src-address'] && <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{rule['src-address']}</span>}
      {rule['dst-address'] && <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>→{rule['dst-address']}</span>}
      {rule.comment && <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontStyle: 'italic' }}>"{rule.comment}"</span>}
    </div>
  );
}

export function FirewallConflicts({ rules, onNavigate }) {
  const [activeChain, setActiveChain] = useState('all');
  const [showDupes, setShowDupes] = useState(true);

  const conflicts  = detectConflicts(rules);
  const duplicates = detectDuplicates(rules);

  const chains = ['all', ...new Set(rules.map(r => r.chain).filter(Boolean))];

  const filteredConflicts = activeChain === 'all'
    ? conflicts
    : conflicts.filter(c => c.chain === activeChain);

  const filteredDupes = activeChain === 'all'
    ? duplicates
    : duplicates.filter(d => d.chain === activeChain);

  const total = filteredConflicts.length + (showDupes ? filteredDupes.length : 0);

  if (rules.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Tidak ada firewall filter rules untuk dianalisis.
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {chains.map(c => {
            const cc = CHAIN_COLOR[c] || { bg: 'var(--bg-elevated)', border: 'var(--border)', text: 'var(--text-secondary)' };
            return (
              <button key={c} onClick={() => setActiveChain(c)}
                style={{
                  padding: '4px 12px', borderRadius: '6px', border: `1px solid ${activeChain === c ? cc.border : 'var(--border)'}`,
                  background: activeChain === c ? cc.bg : 'transparent',
                  color: activeChain === c ? cc.text : 'var(--text-muted)',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s',
                }}>
                {c === 'all' ? `Semua (${rules.length})` : c}
              </button>
            );
          })}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
          <input type="checkbox" checked={showDupes} onChange={e => setShowDupes(e.target.checked)} />
          Tampilkan duplikat ({duplicates.length})
        </label>
      </div>

      {/* Summary */}
      {total === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '12px', color: '#22c55e', fontWeight: 600 }}>
          ✅ Tidak ada konflik atau rule yang terbayang-bayangi ditemukan pada chain {activeChain === 'all' ? 'manapun' : activeChain}!
        </div>
      ) : (
        <div style={{ marginBottom: '8px', padding: '10px 14px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: '8px', fontSize: '0.85rem', color: '#f97316' }}>
          ⚠️ Ditemukan <strong>{total}</strong> masalah: {filteredConflicts.length} rule tersembunyi (shadowed) + {filteredDupes.length} duplikat
        </div>
      )}

      {/* Conflicts */}
      {filteredConflicts.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ padding: '2px 8px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: '4px', fontSize: '0.75rem' }}>SHADOWED</span>
            Rule Tersembunyi ({filteredConflicts.length})
          </h3>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.6 }}>
            Rule ini tidak akan pernah dieksekusi karena rule di atasnya sudah "menangkap" semua traffic yang sama terlebih dahulu.
          </div>
          {filteredConflicts.map((c, i) => (
            <div key={i} style={{
              marginBottom: '10px', padding: '14px 16px',
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <RuleRef rule={c.shadowingRule} idx={c.shadowingIndex} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>memblokir →</span>
                <RuleRef rule={c.shadowedRule}  idx={c.shadowedIndex} dim />
                <span style={{ marginLeft: 'auto', padding: '2px 8px', background: CHAIN_COLOR[c.chain]?.bg || 'var(--bg-elevated)', color: CHAIN_COLOR[c.chain]?.text || 'var(--text-secondary)', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
                  {c.chain}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong>Kenapa?</strong> Rule #{c.shadowingIndex} cocok dengan kondisi yang lebih luas: {c.reason} — sehingga paket yang seharusnya ditangani rule #{c.shadowedIndex} sudah diproses lebih dulu.
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#f97316' }}>
                <strong>Solusi:</strong> Pindahkan rule #{c.shadowedIndex} ke atas rule #{c.shadowingIndex}, atau perbesar kondisi di rule #{c.shadowedIndex} agar lebih spesifik.
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Duplicates */}
      {showDupes && filteredDupes.length > 0 && (
        <section>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ padding: '2px 8px', background: 'rgba(249,115,22,0.15)', color: '#f97316', borderRadius: '4px', fontSize: '0.75rem' }}>DUPLIKAT</span>
            Rule Duplikat ({filteredDupes.length})
          </h3>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.6 }}>
            Rule ini memiliki kondisi yang persis sama dengan rule lain. Salah satunya tidak perlu dan bisa dihapus.
          </div>
          {filteredDupes.map((d, i) => (
            <div key={i} style={{
              marginBottom: '10px', padding: '14px 16px',
              background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)',
              borderRadius: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <RuleRef rule={d.original}  idx={d.originalIndex} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>=</span>
                <RuleRef rule={d.duplicate} idx={d.duplicateIndex} dim />
                <span style={{ marginLeft: 'auto', padding: '2px 8px', background: CHAIN_COLOR[d.chain]?.bg || 'var(--bg-elevated)', color: CHAIN_COLOR[d.chain]?.text || 'var(--text-secondary)', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
                  {d.chain}
                </span>
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#f97316' }}>
                <strong>Solusi:</strong> Hapus rule #{d.duplicateIndex} karena identik dengan rule #{d.originalIndex}.
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
