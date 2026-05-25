import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  MarkerType, Handle, Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

/* ── Helpers ─────────────────────────────────────────────────────── */
const spreadX = (count, centerX, spacing) => {
  const start = centerX - ((count - 1) * spacing) / 2;
  return Array.from({ length: count }, (_, i) => start + i * spacing);
};

const baseNode = (extra = {}) => ({
  padding: '10px 14px',
  borderRadius: '10px',
  fontSize: '12px',
  fontFamily: 'inherit',
  cursor: 'pointer',
  minWidth: '140px',
  textAlign: 'center',
  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  border: '1px solid',
  userSelect: 'none',
  ...extra,
});

const chip = (text, bg, color = '#fff') => (
  <div style={{ marginTop: 4, padding: '2px 7px', background: bg, borderRadius: 99, fontSize: 9, color, display: 'inline-block' }}>
    {text}
  </div>
);

/* ── Custom node components ──────────────────────────────────────── */
const InternetNode = ({ data }) => (
  <div style={baseNode({ background: 'linear-gradient(135deg,#0d2137,#143352)', borderColor: '#2980b9', color: '#85c1e9' })}>
    <Handle type="source" position={Position.Bottom} style={{ background: '#2980b9' }} />
    <div style={{ fontSize: 26, marginBottom: 4 }}>🌐</div>
    <div style={{ fontWeight: 700, fontSize: 13, color: '#aed6f1' }}>Internet / ISP</div>
    {data.wanCount > 1 && <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{data.wanCount} uplink</div>}
  </div>
);

const RouterNode = ({ data }) => (
  <div
    onClick={() => data.onNavigate?.('overview')}
    style={baseNode({
      background: 'linear-gradient(135deg,#1a1e2a,#252a3a)', borderColor: '#6366f1',
      color: '#c7d2fe', minWidth: 180, cursor: 'pointer',
    })}
    title="Klik untuk lihat ringkasan"
  >
    <Handle type="target" position={Position.Top} style={{ background: '#6366f1' }} />
    <Handle type="source" position={Position.Bottom} style={{ background: '#6366f1' }} />
    <Handle type="source" position={Position.Right} id="right" style={{ background: '#6366f1' }} />
    <div style={{ fontSize: 22, marginBottom: 4 }}>🔀</div>
    <div style={{ fontWeight: 800, fontSize: 14, color: '#e0e7ff' }}>{data.label}</div>
    {data.model && <div style={{ fontSize: 10, opacity: 0.55, marginTop: 2 }}>{data.model}</div>}
    {chip('MikroTik Router', 'rgba(99,102,241,0.25)', '#818cf8')}
  </div>
);

const IfaceNode = ({ data }) => {
  const wan = data.isWan;
  const col = wan
    ? { bg: 'linear-gradient(135deg,#2c1a54,#3b1f6e)', border: '#9b59b6', text: '#d7bde2' }
    : { bg: 'linear-gradient(135deg,#0d3b22,#155a34)', border: '#27ae60', text: '#82e0aa' };
  return (
    <div
      onClick={() => data.onNavigate?.(wan ? 'ip-dhcp-client' : 'ip-addresses')}
      style={baseNode({ background: col.bg, borderColor: col.border, color: col.text, cursor: 'pointer' })}
      title={`Klik untuk lihat detail interface ${data.label}`}
    >
      <Handle type="target" position={Position.Top} style={{ background: col.border }} />
      <Handle type="source" position={Position.Bottom} style={{ background: col.border }} />
      <div style={{ fontSize: 16, marginBottom: 3 }}>{wan ? '📡' : '🔌'}</div>
      <div style={{ fontWeight: 700, fontSize: 12 }}>{data.label}</div>
      {data.ips?.slice(0, 2).map((ip, i) => (
        <div key={i} style={{ fontSize: 10, opacity: 0.75, marginTop: 1, fontFamily: 'monospace' }}>{ip}</div>
      ))}
      {data.isDhcpClient && chip('DHCP Client', 'rgba(155,89,182,0.25)', '#c39bd3')}
      {!wan && data.hasDhcp && chip('DHCP Server', 'rgba(39,174,96,0.25)', '#82e0aa')}
      {data.active === false && chip('DISABLED', 'rgba(239,68,68,0.25)', '#f87171')}
    </div>
  );
};

const SubnetNode = ({ data }) => (
  <div
    onClick={() => data.onNavigate?.('ip-dhcp-server')}
    style={baseNode({
      background: 'linear-gradient(135deg,#0a2e18,#0d3d20)', borderColor: '#1e8449',
      borderStyle: 'dashed', color: '#82e0aa', minWidth: 130, cursor: 'pointer',
    })}
    title="Klik untuk lihat DHCP Server"
  >
    <Handle type="target" position={Position.Top} style={{ background: '#1e8449' }} />
    <div style={{ fontSize: 16, marginBottom: 2 }}>🖥️</div>
    <div style={{ fontWeight: 600, fontSize: 11 }}>Jaringan Lokal</div>
    <div style={{ fontSize: 10, opacity: 0.75, fontFamily: 'monospace', marginTop: 2 }}>{data.subnet}</div>
    {data.pool && <div style={{ fontSize: 9, opacity: 0.55, marginTop: 1 }}>Pool: {data.pool}</div>}
    {chip('Perangkat Klien', 'rgba(30,132,73,0.3)', '#82e0aa')}
  </div>
);

const VpnNode = ({ data }) => (
  <div
    onClick={() => data.onNavigate?.('vpn')}
    style={baseNode({
      background: 'linear-gradient(135deg,#1e0a36,#2d0f52)', borderColor: '#9b59b6',
      borderStyle: 'dashed', color: '#d7bde2', cursor: 'pointer',
    })}
    title="Klik untuk lihat VPN"
  >
    <Handle type="target" position={Position.Left} style={{ background: '#9b59b6' }} />
    <div style={{ fontSize: 16, marginBottom: 2 }}>🔒</div>
    <div style={{ fontWeight: 700, fontSize: 11 }}>{data.label}</div>
    <div style={{ fontSize: 9, opacity: 0.65, marginTop: 1 }}>{data.type}</div>
    {data.peers > 0 && chip(`${data.peers} peer`, 'rgba(155,89,182,0.25)', '#d7bde2')}
  </div>
);

/* Must be defined outside component to avoid ReactFlow re-registering on every render */
const NODE_TYPES = {
  internet: InternetNode,
  router: RouterNode,
  wanIface: IfaceNode,
  lanIface: IfaceNode,
  subnet: SubnetNode,
  vpn: VpnNode,
};

/* ── Build graph from config ─────────────────────────────────────── */
function buildGraph(config, onNavigate) {
  const nodes = [];
  const edges = [];

  const interfaces  = config.interfaces  || [];
  const ipAddresses = config.ipAddresses || [];
  const routes      = config.routes      || [];
  const nat         = config.firewall?.nat || [];
  const dhcpSrvs    = config.dhcp?.servers  || [];
  const dhcpClis    = config.dhcp?.clients  || [];
  const wgIfaces    = config.vpn?.wireguard  || [];
  const wgPeers     = config.vpn?.wireguardPeers || [];
  const ovpn        = config.vpn?.ovpn || [];
  const l2tp        = config.vpn?.l2tp || [];

  /* IP map: name → [address, ...] */
  const ipMap = {};
  ipAddresses.forEach(a => {
    (ipMap[a.interface] = ipMap[a.interface] || []).push(a.address);
  });

  /* WAN detection: NAT masquerade out-interface, DHCP clients */
  const wanByNat  = new Set(nat.filter(r => r.action === 'masquerade').map(r => r['out-interface']).filter(Boolean));
  const wanByDhcp = new Set(dhcpClis.map(c => c.interface).filter(Boolean));
  let wanSet = new Set([...wanByNat, ...wanByDhcp]);

  /* Fallback: use first interface with a default route as WAN */
  if (wanSet.size === 0) {
    const gwIface = routes.find(r => r['dst-address'] === '0.0.0.0/0')?.gateway;
    if (gwIface) {
      const match = interfaces.find(i => i.name === gwIface || ipAddresses.some(a => a.interface === i.name && a.address?.startsWith(gwIface?.split('.').slice(0,3).join('.'))));
      if (match) wanSet.add(match.name);
    }
    if (wanSet.size === 0 && interfaces.length > 0) {
      const conv = interfaces.find(i => /^(ether1|sfp1|sfp-sfpplus|wan|internet|ppp)/i.test(i.name || ''));
      if (conv) wanSet.add(conv.name);
      else wanSet.add(interfaces[0].name);
    }
  }

  /* LAN detection: interfaces with DHCP servers, or static IPs not WAN */
  const dhcpSrvMap = {};
  dhcpSrvs.forEach(s => { dhcpSrvMap[s.interface] = s; });
  const lanSet = new Set(
    Object.keys(ipMap).filter(n => !wanSet.has(n))
  );
  dhcpSrvs.forEach(s => { if (!wanSet.has(s.interface)) lanSet.add(s.interface); });

  const CX = 420; // center x

  /* Internet */
  nodes.push({ id: 'internet', type: 'internet', position: { x: CX - 70, y: 20 }, data: { wanCount: wanSet.size, onNavigate } });

  /* WAN interfaces */
  const wanList = [...wanSet].slice(0, 4);
  const wanXs = spreadX(wanList.length, CX, 220);
  wanList.forEach((name, i) => {
    const iface = interfaces.find(f => f.name === name) || {};
    nodes.push({
      id: `wan-${name}`, type: 'wanIface',
      position: { x: wanXs[i] - 70, y: 160 },
      data: { label: name, ips: ipMap[name] || [], isDhcpClient: wanByDhcp.has(name), active: iface.active, isWan: true, onNavigate },
    });
    edges.push({ id: `e-inet-${name}`, source: 'internet', target: `wan-${name}`, animated: iface.active !== false, style: { stroke: '#8b5cf6', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } });
    edges.push({ id: `e-${name}-r`, source: `wan-${name}`, target: 'router', animated: iface.active !== false, style: { stroke: '#8b5cf6', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' } });
  });

  /* Router core */
  nodes.push({
    id: 'router', type: 'router',
    position: { x: CX - 90, y: 320 },
    data: { label: config.metadata?.identity || 'MikroTik', model: config.metadata?.model, onNavigate },
  });

  /* LAN interfaces */
  const lanList = [...lanSet].slice(0, 5);
  const lanXs = spreadX(lanList.length, CX, 220);
  lanList.forEach((name, i) => {
    const iface = interfaces.find(f => f.name === name) || {};
    const srv = dhcpSrvMap[name];
    nodes.push({
      id: `lan-${name}`, type: 'lanIface',
      position: { x: lanXs[i] - 70, y: 480 },
      data: { label: name, ips: ipMap[name] || [], hasDhcp: !!srv, active: iface.active, isWan: false, onNavigate },
    });
    edges.push({ id: `e-r-${name}`, source: 'router', target: `lan-${name}`, style: { stroke: '#27ae60', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#27ae60' } });

    if (srv) {
      const subnet = ipMap[name]?.[0] || name;
      nodes.push({
        id: `sub-${name}`, type: 'subnet',
        position: { x: lanXs[i] - 65, y: 640 },
        data: { subnet, pool: srv['address-pool'], onNavigate },
      });
      edges.push({ id: `e-${name}-sub`, source: `lan-${name}`, target: `sub-${name}`, style: { stroke: '#27ae60', strokeDasharray: '5 3', strokeWidth: 1.5 } });
    }
  });

  /* VPN nodes */
  const vpnAll = [
    ...wgIfaces.map(v => ({ label: v.name, type: 'WireGuard', peers: wgPeers.filter(p => p.interface === v.name).length })),
    ...ovpn.map(v  => ({ label: v.name || 'OpenVPN', type: 'OpenVPN', peers: 0 })),
    ...l2tp.map(v  => ({ label: v.name || 'L2TP', type: 'L2TP/IPSec', peers: 0 })),
  ].slice(0, 4);
  vpnAll.forEach((v, i) => {
    nodes.push({
      id: `vpn-${i}`, type: 'vpn',
      position: { x: CX + 280 + i * 10, y: 320 + i * 130 },
      data: { ...v, onNavigate },
    });
    edges.push({ id: `e-r-vpn-${i}`, source: 'router', target: `vpn-${i}`, sourceHandle: 'right', style: { stroke: '#9b59b6', strokeDasharray: '6 3', strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#9b59b6' } });
  });

  return { nodes, edges };
}

/* ── Main component ──────────────────────────────────────────────── */
export const NetworkTopology = ({ config, onNavigate }) => {
  const { nodes: init, edges: initE } = useMemo(() => buildGraph(config, onNavigate), [config, onNavigate]);
  const [nodes, , onNodesChange] = useNodesState(init);
  const [edges, , onEdgesChange] = useEdgesState(initE);

  return (
    <div className="animate-fade-in">
      <div className="glass-panel config-section" style={{ marginBottom: '1rem' }}>
        <div className="section-header">
          <span style={{ fontSize: 20 }}>🗺️</span>
          <h2 className="section-title">Topologi Jaringan</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7 }}>
          Peta visual jaringan yang dibangun otomatis dari konfigurasi router.
          Klik node mana saja untuk membuka bagian konfigurasi terkait. Drag untuk menggeser, scroll untuk zoom.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {[
            { color: '#8b5cf6', label: 'Jalur WAN (ke Internet)' },
            { color: '#27ae60', label: 'Jaringan LAN (lokal)' },
            { color: '#9b59b6', label: 'Tunnel VPN', dashed: true },
          ].map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 24, height: 2, background: l.color, borderTop: l.dashed ? '2px dashed' : 'none', borderColor: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: '70vh', borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.3}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="var(--border)" gap={24} size={1} />
          <Controls style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
          <MiniMap
            nodeColor={n => {
              if (n.type === 'internet') return '#2980b9';
              if (n.type === 'router')   return '#6366f1';
              if (n.type === 'wanIface') return '#8b5cf6';
              if (n.type === 'lanIface') return '#27ae60';
              if (n.type === 'subnet')   return '#1e8449';
              return '#9b59b6';
            }}
            maskColor="rgba(10,12,20,0.7)"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }}
          />
        </ReactFlow>
      </div>
    </div>
  );
};
