import React, { useState, useMemo } from 'react';
import { ChevronDown, Filter, RotateCcw, Zap } from 'lucide-react';

/* ── Constants ───────────────────────────────────────────────────── */
const CHAINS = ['input', 'forward', 'output'];

const CHAIN_DESC = {
  input:   'Traffic menuju ke router (SSH, Winbox, Ping ke router)',
  forward: 'Traffic melewati router (LAN ke Internet, antar subnet)',
  output:  'Traffic yang dikirim dari router keluar',
};

const ACTION_STYLE = {
  accept:        { border: '#22c55e', text: '#22c55e', badge: 'rgba(34,197,94,0.15)',   bg: 'rgba(34,197,94,0.05)'   },
  drop:          { border: '#ef4444', text: '#ef4444', badge: 'rgba(239,68,68,0.15)',   bg: 'rgba(239,68,68,0.05)'   },
  reject:        { border: '#f97316', text: '#f97316', badge: 'rgba(249,115,22,0.15)',  bg: 'rgba(249,115,22,0.05)'  },
  passthrough:   { border: '#6366f1', text: '#818cf8', badge: 'rgba(99,102,241,0.15)',  bg: 'rgba(99,102,241,0.04)'  },
  log:           { border: '#64748b', text: '#94a3b8', badge: 'rgba(100,116,139,0.15)', bg: 'transparent'            },
  'add-to-list': { border: '#eab308', text: '#eab308', badge: 'rgba(234,179,8,0.15)',   bg: 'rgba(234,179,8,0.04)'   },
};

const CHIP_COLORS = {
  'src':       '#93c5fd',
  'dst':       '#86efac',
  'proto':     '#c4b5fd',
  'dport':     '#fcd34d',
  'sport':     '#fcd34d',
  'in':        '#f9a8d4',
  'out':       '#f9a8d4',
  'state':     '#94a3b8',
  'src-list':  '#93c5fd',
  'dst-list':  '#86efac',
};

/* ── Sub-components ──────────────────────────────────────────────── */
const Chip = ({ label, value }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '1px 6px', borderRadius: 99, fontSize: '0.67rem',
    fontFamily: 'monospace', background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
  }}>
    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
    <span style={{ color: CHIP_COLORS[label] || 'var(--text-secondary)', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
  </span>
);

const RuleCard = ({ rule, position, onGoTrace }) => {
  const [open, setOpen] = useState(false);
  const action = (rule.action || 'accept').toLowerCase();
  const sty    = ACTION_STYLE[action] || ACTION_STYLE.log;
  const off    = rule.disabled === 'yes';

  /* Build condition chips */
  const chips = [
    rule['src-address']      && { label: 'src',      value: rule['src-address'] },
    rule['dst-address']      && { label: 'dst',      value: rule['dst-address'] },
    rule.protocol            && { label: 'proto',    value: rule.protocol.toUpperCase() },
    rule['dst-port']         && { label: 'dport',    value: rule['dst-port'] },
    rule['src-port']         && { label: 'sport',    value: rule['src-port'] },
    rule['in-interface']     && { label: 'in',       value: rule['in-interface'] },
    rule['out-interface']    && { label: 'out',      value: rule['out-interface'] },
    rule['connection-state'] && { label: 'state',    value: rule['connection-state'] },
    rule['src-address-list'] && { label: 'src-list', value: rule['src-address-list'] },
    rule['dst-address-list'] && { label: 'dst-list', value: rule['dst-address-list'] },
  ].filter(Boolean);

  const noConditions = chips.length === 0;

  return (
    <div
      style={{
        borderRadius: 7,
        border: `1px solid ${off ? 'var(--border)' : sty.border + '44'}`,
        borderLeft: `3px solid ${off ? 'var(--border)' : sty.border}`,
        background: off ? 'transparent' : sty.bg,
        opacity: off ? 0.45 : 1,
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => !off && (e.currentTarget.style.boxShadow = `0 0 0 1px ${sty.border}55`)}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Card header */}
      <div
        style={{ padding: '8px 9px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 6 }}
        onClick={() => setOpen(o => !o)}
      >
        {/* Position */}
        <span style={{ fontSize: '0.66rem', fontFamily: 'monospace', color: 'var(--text-muted)', minWidth: 22, marginTop: 2, flexShrink: 0 }}>{position}</span>

        {/* Action badge */}
        <span style={{
          padding: '1px 6px', borderRadius: 99, fontSize: '0.62rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
          background: sty.badge, color: sty.text, border: `1px solid ${sty.border}44`,
        }}>{action}</span>

        {off && (
          <span style={{ padding: '1px 5px', borderRadius: 99, fontSize: '0.6rem', background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)', flexShrink: 0 }}>off</span>
        )}

        {/* Right side: comment + chips */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {rule.comment && (
            <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: chips.length ? 4 : 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {rule.comment}
            </div>
          )}
          {noConditions
            ? <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>cocok semua paket</span>
            : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>{chips.map((c, i) => <Chip key={i} {...c} />)}</div>
          }
        </div>

        <ChevronDown size={10} style={{ opacity: 0.3, flexShrink: 0, marginTop: 4, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ padding: '0 9px 9px', borderTop: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', marginTop: 7 }}>
            <tbody>
              {[
                ['chain',            rule.chain],
                ['action',           rule.action],
                ['protocol',         rule.protocol],
                ['src-address',      rule['src-address']],
                ['dst-address',      rule['dst-address']],
                ['src-address-list', rule['src-address-list']],
                ['dst-address-list', rule['dst-address-list']],
                ['src-port',         rule['src-port']],
                ['dst-port',         rule['dst-port']],
                ['in-interface',     rule['in-interface']],
                ['out-interface',    rule['out-interface']],
                ['connection-state', rule['connection-state']],
                ['tcp-flags',        rule['tcp-flags']],
                ['limit',            rule.limit],
                ['comment',          rule.comment],
              ].filter(([, v]) => v).map(([k, v]) => (
                <tr key={k}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', paddingRight: 8, paddingBottom: 3, verticalAlign: 'top', whiteSpace: 'nowrap' }}>{k}</td>
                  <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Quick trace button for terminal actions */}
          {(action === 'drop' || action === 'reject') && onGoTrace && (
            <button
              onClick={e => { e.stopPropagation(); onGoTrace(rule); }}
              style={{
                marginTop: 8, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                color: '#818cf8', fontSize: '0.72rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
              }}
            >
              <Zap size={11} /> Uji di Packet Tracer
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Main component ──────────────────────────────────────────────── */
export const FirewallSwimlane = ({ rules, onNavigate }) => {
  const [filterAction,  setFilterAction]  = useState('all');
  const [filterProto,   setFilterProto]   = useState('all');
  const [showDisabled,  setShowDisabled]  = useState(false);

  /* Per-chain stats (before filter) */
  const stats = useMemo(() => CHAINS.reduce((acc, ch) => {
    const cr = rules.filter(r => r.chain === ch);
    acc[ch] = {
      total:    cr.length,
      accept:   cr.filter(r => r.action === 'accept').length,
      drop:     cr.filter(r => r.action === 'drop' || r.action === 'reject').length,
      disabled: cr.filter(r => r.disabled === 'yes').length,
    };
    return acc;
  }, {}), [rules]);

  /* Filtered rules */
  const filtered = useMemo(() => rules.filter(r => {
    if (!showDisabled && r.disabled === 'yes') return false;
    if (filterAction !== 'all' && r.action !== filterAction) return false;
    if (filterProto  !== 'all' && (r.protocol || '').toLowerCase() !== filterProto) return false;
    return true;
  }), [rules, filterAction, filterProto, showDisabled]);

  const dirty = filterAction !== 'all' || filterProto !== 'all';
  const selStyle = { padding: '5px 10px', borderRadius: 'var(--r-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' };

  return (
    <div>
      {/* ── Filter bar ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <Filter size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

        <select style={selStyle} value={filterAction} onChange={e => setFilterAction(e.target.value)}>
          <option value="all">Semua Aksi</option>
          <option value="accept">Accept</option>
          <option value="drop">Drop</option>
          <option value="reject">Reject</option>
          <option value="passthrough">Passthrough</option>
          <option value="log">Log</option>
        </select>

        <select style={selStyle} value={filterProto} onChange={e => setFilterProto(e.target.value)}>
          <option value="all">Semua Protokol</option>
          <option value="tcp">TCP</option>
          <option value="udp">UDP</option>
          <option value="icmp">ICMP</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" checked={showDisabled} onChange={e => setShowDisabled(e.target.checked)} />
          Tampilkan rule disabled
        </label>

        {dirty && (
          <button
            onClick={() => { setFilterAction('all'); setFilterProto('all'); }}
            style={{ ...selStyle, display: 'flex', alignItems: 'center', gap: 4, color: '#818cf8', border: '1px solid rgba(99,102,241,0.35)' }}
          >
            <RotateCcw size={10} /> Reset
          </button>
        )}

        <span style={{ marginLeft: 'auto', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          {filtered.length} / {rules.filter(r => showDisabled || r.disabled !== 'yes').length} rules
        </span>

        {/* Navigate to Packet Tracer */}
        <button
          onClick={() => onNavigate?.('packet-tracer')}
          style={{ ...selStyle, display: 'flex', alignItems: 'center', gap: 5, color: '#818cf8', border: '1px solid rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.08)' }}
        >
          <Zap size={12} /> Packet Tracer
        </button>
      </div>

      {/* ── Legend ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
        {Object.entries(ACTION_STYLE).map(([action, s]) => (
          <span key={action} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 3, height: 14, background: s.border, borderRadius: 2, flexShrink: 0 }} />
            <span style={{ color: s.text, fontWeight: 600 }}>{action}</span>
          </span>
        ))}
        <span style={{ opacity: 0.5 }}>border kiri = warna aksi rule</span>
      </div>

      {/* ── 3-column swimlane ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem', alignItems: 'start' }}>
        {CHAINS.map(chain => {
          const s = stats[chain] || { total: 0, accept: 0, drop: 0, disabled: 0 };
          const chainFiltered = filtered.filter(r => r.chain === chain);
          const allChainRules = rules.filter(r => r.chain === chain);

          return (
            <div key={chain}>
              {/* Column header */}
              <div style={{
                padding: '10px 12px', borderRadius: '8px 8px 0 0',
                background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderBottom: 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', fontSize: '0.8rem' }}>
                    {chain}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.total} rules</span>
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: '0.68rem', marginBottom: 5 }}>
                  <span style={{ color: '#22c55e' }}>✓ {s.accept} accept</span>
                  <span style={{ color: '#ef4444' }}>✕ {s.drop} drop/reject</span>
                  {s.disabled > 0 && <span style={{ color: 'var(--text-muted)' }}>⊘ {s.disabled} off</span>}
                </div>
                <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{CHAIN_DESC[chain]}</div>
              </div>

              {/* Rules column body */}
              <div style={{
                border: '1px solid var(--border)', borderRadius: '0 0 8px 8px',
                padding: 7, background: 'var(--bg-surface, var(--bg-base))',
                minHeight: 100, display: 'flex', flexDirection: 'column', gap: 3,
              }}>
                {chainFiltered.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem', textAlign: 'center', padding: '1.25rem 0.5rem', fontStyle: 'italic', lineHeight: 1.5 }}>
                    {s.total === 0
                      ? `Tidak ada rules di chain ${chain}`
                      : 'Tidak ada rules cocok dengan filter aktif'}
                  </div>
                ) : (
                  chainFiltered.map((rule, i) => {
                    const pos = allChainRules.indexOf(rule) + 1;
                    return (
                      <RuleCard
                        key={i}
                        rule={rule}
                        position={pos}
                        onGoTrace={() => onNavigate?.('packet-tracer')}
                      />
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Other chains (custom jump chains, etc.) */}
      {(() => {
        const otherChains = [...new Set(rules.map(r => r.chain).filter(c => !CHAINS.includes(c)))];
        if (otherChains.length === 0) return null;
        return (
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Custom chains (jump targets)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {otherChains.map(chain => {
                const cr = filtered.filter(r => r.chain === chain);
                const allCr = rules.filter(r => r.chain === chain);
                return (
                  <div key={chain}>
                    <div style={{ padding: '8px 12px', borderRadius: '8px 8px 0 0', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderBottom: 'none' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.78rem', fontFamily: 'monospace' }}>{chain}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 8 }}>{allCr.length} rules</span>
                    </div>
                    <div style={{ border: '1px solid var(--border)', borderRadius: '0 0 8px 8px', padding: 6, background: 'var(--bg-surface, var(--bg-base))', display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {cr.map((rule, i) => <RuleCard key={i} rule={rule} position={allCr.indexOf(rule) + 1} onGoTrace={() => onNavigate?.('packet-tracer')} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
