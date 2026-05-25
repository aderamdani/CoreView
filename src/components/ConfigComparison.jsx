import React, { useState, useMemo, useCallback } from 'react';
import { parseMikroTikConfig } from '../utils/parser';

function flattenConfig(config, prefix = '') {
  const result = {};
  if (!config || typeof config !== 'object') return result;

  for (const [key, val] of Object.entries(config)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(val)) {
      val.forEach((item, i) => {
        if (item && typeof item === 'object') {
          const itemKey = item.name || item.chain || item.interface || item.comment || `[${i}]`;
          const subPath = `${path}[${itemKey}]`;
          Object.assign(result, flattenConfig(item, subPath));
        } else {
          result[`${path}[${i}]`] = String(item ?? '');
        }
      });
    } else if (val && typeof val === 'object') {
      Object.assign(result, flattenConfig(val, path));
    } else {
      result[path] = String(val ?? '');
    }
  }
  return result;
}

function summarizeConfig(config) {
  return {
    identity:     config?.system?.identity?.name || config?.metadata?.identity || 'Unknown',
    filterRules:  config?.firewall?.filter?.length || 0,
    natRules:     config?.firewall?.nat?.length    || 0,
    interfaces:   config?.interfaces?.length       || 0,
    routes:       config?.routes?.length           || 0,
    dhcpServers:  config?.dhcp?.servers?.length    || 0,
    pools:        config?.pools?.length            || 0,
    vpn:          (config?.vpn?.wireguard?.length || 0) + (config?.vpn?.ovpn?.length || 0) + (config?.vpn?.l2tp?.length || 0),
  };
}

function DiffRow({ path, valA, valB }) {
  const added   = valA === undefined && valB !== undefined;
  const removed = valA !== undefined && valB === undefined;
  const changed = valA !== undefined && valB !== undefined && valA !== valB;

  const bg     = added   ? 'rgba(34,197,94,0.08)'  : removed ? 'rgba(239,68,68,0.08)'  : 'rgba(99,102,241,0.08)';
  const border = added   ? 'rgba(34,197,94,0.3)'   : removed ? 'rgba(239,68,68,0.3)'   : 'rgba(99,102,241,0.3)';
  const label  = added   ? '+ BARU'                 : removed ? '− HILANG'               : '~ BERUBAH';
  const color  = added   ? '#22c55e'                : removed ? '#ef4444'                : '#818cf8';

  const tdStyle = { padding: '6px 10px', fontSize: '0.78rem', verticalAlign: 'top', borderBottom: `1px solid ${border}` };

  return (
    <tr style={{ background: bg }}>
      <td style={{ ...tdStyle, width: '70px' }}>
        <span style={{ padding: '1px 6px', borderRadius: '3px', background: `${color}25`, color, fontSize: '0.68rem', fontWeight: 700 }}>
          {label}
        </span>
      </td>
      <td style={{ ...tdStyle, color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all', maxWidth: '280px' }}>
        {path}
      </td>
      <td style={{ ...tdStyle, color: '#ef4444', fontFamily: 'monospace', wordBreak: 'break-all' }}>
        {removed || changed ? (valA ?? '—') : '—'}
      </td>
      <td style={{ ...tdStyle, color: '#22c55e', fontFamily: 'monospace', wordBreak: 'break-all' }}>
        {added || changed ? (valB ?? '—') : '—'}
      </td>
    </tr>
  );
}

export function ConfigComparison() {
  const [configA, setConfigA] = useState(null);
  const [configB, setConfigB] = useState(null);
  const [nameA, setNameA]     = useState('');
  const [nameB, setNameB]     = useState('');
  const [filter, setFilter]   = useState('all'); // all | added | removed | changed
  const [searchTerm, setSearch] = useState('');
  const [loading, setLoading] = useState({ a: false, b: false });

  const loadFile = useCallback((side) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.rsc,.txt,.cfg,text/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setLoading(prev => ({ ...prev, [side]: true }));
      try {
        const text = await file.text();
        const parsed = parseMikroTikConfig(text);
        if (side === 'a') { setConfigA(parsed); setNameA(file.name); }
        else              { setConfigB(parsed); setNameB(file.name); }
      } finally {
        setLoading(prev => ({ ...prev, [side]: false }));
      }
    };
    input.click();
  }, []);

  const { diffs, stats } = useMemo(() => {
    if (!configA || !configB) return { diffs: [], stats: {} };
    const flatA = flattenConfig(configA);
    const flatB = flattenConfig(configB);
    const allKeys = new Set([...Object.keys(flatA), ...Object.keys(flatB)]);

    const result = [];
    let added = 0, removed = 0, changed = 0;

    for (const key of Array.from(allKeys).sort()) {
      const vA = flatA[key];
      const vB = flatB[key];
      if (vA === vB) continue;
      if (vA === undefined) added++;
      else if (vB === undefined) removed++;
      else changed++;
      result.push({ path: key, valA: vA, valB: vB });
    }

    return { diffs: result, stats: { added, removed, changed, total: result.length } };
  }, [configA, configB]);

  const summaryA = useMemo(() => configA ? summarizeConfig(configA) : null, [configA]);
  const summaryB = useMemo(() => configB ? summarizeConfig(configB) : null, [configB]);

  const filtered = useMemo(() => {
    let d = diffs;
    if (filter === 'added')   d = d.filter(x => x.valA === undefined);
    if (filter === 'removed') d = d.filter(x => x.valB === undefined);
    if (filter === 'changed') d = d.filter(x => x.valA !== undefined && x.valB !== undefined);
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      d = d.filter(x => x.path.toLowerCase().includes(t) || String(x.valA||'').toLowerCase().includes(t) || String(x.valB||'').toLowerCase().includes(t));
    }
    return d;
  }, [diffs, filter, searchTerm]);

  const LIMIT = 200;

  return (
    <div className="animate-fade-in">
      {/* File pickers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '1.5rem' }}>
        {[
          { side: 'a', config: configA, name: nameA, label: 'Konfigurasi Lama', color: '#ef4444' },
          { side: 'b', config: configB, name: nameB, label: 'Konfigurasi Baru',  color: '#22c55e' },
        ].map(({ side, config: cfg, name, label, color }) => (
          <div key={side} style={{
            padding: '20px', border: `2px dashed ${cfg ? color : 'var(--border)'}`,
            borderRadius: '12px', background: cfg ? `${color}08` : 'var(--bg-elevated)',
            textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
          }} onClick={() => loadFile(side)}>
            {cfg ? (
              <>
                <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{side === 'a' ? '📂' : '📂'}</div>
                <div style={{ fontWeight: 700, color, fontSize: '0.9rem' }}>{name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{label} — klik untuk ganti</div>
                {cfg && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {Object.entries(summarizeConfig(cfg)).slice(1).map(([k, v]) => (
                      <span key={k} style={{ padding: '2px 7px', background: `${color}20`, color, borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600 }}>{k}: {v}</span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>+</div>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Klik untuk memuat file .rsc</div>
              </>
            )}
          </div>
        ))}
      </div>

      {!configA || !configB ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Muat dua file konfigurasi untuk melihat perbedaannya.
        </div>
      ) : diffs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '12px', color: '#22c55e', fontWeight: 600 }}>
          ✅ Kedua konfigurasi identik — tidak ada perbedaan.
        </div>
      ) : (
        <>
          {/* Stats bar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
            {[
              { key: 'all',     label: `Semua (${stats.total})`,      color: 'var(--accent)' },
              { key: 'added',   label: `+ Baru (${stats.added})`,     color: '#22c55e' },
              { key: 'removed', label: `− Hilang (${stats.removed})`, color: '#ef4444' },
              { key: 'changed', label: `~ Berubah (${stats.changed})`,color: '#818cf8' },
            ].map(({ key, label, color }) => (
              <button key={key} onClick={() => setFilter(key)}
                style={{
                  padding: '5px 12px', borderRadius: '6px', border: `1px solid ${filter === key ? color : 'var(--border)'}`,
                  background: filter === key ? `${color}18` : 'transparent',
                  color: filter === key ? color : 'var(--text-muted)',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s',
                }}>
                {label}
              </button>
            ))}
            <input
              placeholder="Cari path / nilai..."
              value={searchTerm}
              onChange={e => setSearch(e.target.value)}
              style={{
                marginLeft: 'auto', padding: '5px 12px', borderRadius: '6px',
                border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                color: 'var(--text-primary)', fontSize: '0.82rem', minWidth: '180px',
              }}
            />
          </div>

          {/* Diff table */}
          <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)' }}>
                  {['Status', 'Field / Path', `Lama (${nameA})`, `Baru (${nameB})`].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, LIMIT).map((d, i) => (
                  <DiffRow key={i} path={d.path} valA={d.valA} valB={d.valB} />
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > LIMIT && (
            <div style={{ textAlign: 'center', padding: '12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Menampilkan {LIMIT} dari {filtered.length} perbedaan.
            </div>
          )}
        </>
      )}
    </div>
  );
}
