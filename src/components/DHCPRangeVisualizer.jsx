import React, { useMemo } from 'react';

function ipToInt(ip) {
  const p = ip.split('.').map(Number);
  return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
}

function intToIp(n) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

function parseRange(rangeStr) {
  if (!rangeStr) return null;
  const parts = rangeStr.split(',')[0].trim(); // take first range segment
  if (parts.includes('-')) {
    const [s, e] = parts.split('-').map(ip => ip.trim());
    if (!s || !e) return null;
    return { start: ipToInt(s), end: ipToInt(e), startIp: s, endIp: e };
  }
  // single IP
  const n = ipToInt(parts);
  return { start: n, end: n, startIp: parts, endIp: parts };
}

function parseCIDR(cidr) {
  if (!cidr) return null;
  const [network, prefix] = cidr.split('/');
  const prefixLen = parseInt(prefix || '24', 10);
  const mask = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0;
  const netInt = ipToInt(network) & mask;
  const broadcast = netInt | (~mask >>> 0);
  return { netInt, broadcast, prefixLen, total: broadcast - netInt + 1 };
}

export function DHCPRangeVisualizer({ server }) {
  const data = useMemo(() => {
    const pool = server.poolObj;
    const net  = server.networkObj;
    if (!pool?.ranges) return null;

    const range  = parseRange(pool.ranges);
    if (!range) return null;

    const subnet = net?.address ? parseCIDR(net.address) : null;

    const poolSize = range.end - range.start + 1;

    // subnet bounds for bar scaling
    const barStart = subnet ? subnet.netInt    : range.start;
    const barEnd   = subnet ? subnet.broadcast : range.end;
    const barTotal = barEnd - barStart + 1;

    const poolLeft  = ((range.start - barStart) / barTotal) * 100;
    const poolWidth = (poolSize / barTotal) * 100;

    // reserved = gateway + network addr + broadcast (not in pool)
    const reserved = subnet ? (subnet.total - poolSize - 2) : 0; // -2 for network+broadcast

    return {
      range, poolSize, subnet, barLeft: poolLeft, barWidth: poolWidth,
      subnetTotal: subnet ? subnet.total - 2 : poolSize, // usable
      reserved: Math.max(0, reserved),
      gateway: net?.gateway || null,
      network: net?.address || null,
    };
  }, [server]);

  if (!data) return (
    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.82rem', marginTop: '6px' }}>
      Pool range tidak tersedia untuk visualisasi.
    </div>
  );

  const pct = Math.round((data.poolSize / (data.subnetTotal || data.poolSize)) * 100);

  return (
    <div style={{ marginTop: '10px', padding: '14px 16px', background: 'var(--bg-base)', borderRadius: '10px', border: '1px solid var(--border)' }}>
      {/* Header stats */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <Stat label="Pool tersedia" value={data.poolSize} color="#22c55e" />
        {data.subnet && <Stat label="Total subnet" value={data.subnetTotal} color="var(--accent)" />}
        {data.reserved > 0 && <Stat label="Direservasi" value={data.reserved} color="var(--text-muted)" />}
        <Stat label="Terpakai pool" value={`${pct}%`} color={pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#22c55e'} />
      </div>

      {/* Range bar */}
      <div style={{ position: 'relative', height: '28px', background: 'var(--bg-elevated)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {/* reserved / non-pool (left) */}
        {data.barLeft > 0 && (
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${data.barLeft}%`,
            background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(100,100,100,0.15) 4px, rgba(100,100,100,0.15) 8px)',
            borderRight: '1px solid rgba(255,255,255,0.15)',
          }} />
        )}
        {/* pool range */}
        <div style={{
          position: 'absolute',
          left: `${data.barLeft}%`,
          width: `${Math.max(data.barWidth, 2)}%`,
          top: 0, bottom: 0,
          background: 'linear-gradient(90deg, #22c55e, #16a34a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.72rem', fontWeight: 700, color: '#fff',
          overflow: 'hidden',
          transition: 'width 0.5s ease',
        }}>
          {data.barWidth > 8 && `${data.poolSize} IP`}
        </div>
        {/* gateway marker */}
        {data.gateway && data.subnet && (() => {
          const gwInt = ipToInt(data.gateway);
          if (gwInt < data.subnet.netInt || gwInt > data.subnet.broadcast) return null;
          const gwPos = ((gwInt - (data.subnet ? data.subnet.netInt : data.range.start)) /
                        (data.subnet ? data.subnet.total : data.poolSize)) * 100;
          return (
            <div style={{
              position: 'absolute', left: `${gwPos}%`, top: 0, bottom: 0,
              width: '2px', background: '#f59e0b',
            }} title={`Gateway: ${data.gateway}`} />
          );
        })()}
      </div>

      {/* IP range labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <span>{data.range.startIp} (pool start)</span>
        <span>{data.range.endIp} (pool end)</span>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '14px', marginTop: '8px', flexWrap: 'wrap' }}>
        <LegendItem color="#22c55e" label="Range pool DHCP" />
        {data.barLeft > 0 && <LegendItem color="rgba(100,100,100,0.3)" label="Di luar pool (reserved/gateway)" hatched />}
        {data.gateway && <LegendItem color="#f59e0b" label={`Gateway (${data.gateway})`} />}
      </div>

      {/* Plain language */}
      <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(34,197,94,0.08)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', borderLeft: '3px solid #22c55e' }}>
        💡 Router ini bisa memberikan IP secara otomatis ke maksimal <strong>{data.poolSize}</strong> device
        {data.network && <> di jaringan <strong>{data.network}</strong></>}
        {data.gateway && <>, dengan gateway <strong>{data.gateway}</strong></>}.
        {pct > 80 && <span style={{ color: '#ef4444', fontWeight: 600 }}> Pool hampir penuh! Pertimbangkan untuk memperluas range.</span>}
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center', minWidth: '70px' }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '1px' }}>{label}</div>
    </div>
  );
}

function LegendItem({ color, label, hatched }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
      <div style={{
        width: '14px', height: '10px', borderRadius: '2px', flexShrink: 0,
        background: hatched
          ? 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(100,100,100,0.3) 2px, rgba(100,100,100,0.3) 4px)'
          : color,
        border: '1px solid var(--border)',
      }} />
      {label}
    </div>
  );
}
