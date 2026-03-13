import React from 'react';
import { Layers, Activity, Share2, Globe, Shield, Database, Settings, Server, Lock } from 'lucide-react';

export const OsiTcpView = ({ config, onNavigate }) => {
  // Mapping parsed config elements to their respective layers
  const getMappedData = () => {
    return {
      l7: {
        name: 'Application (L7)',
        desc: 'End-user processes & network services.',
        tcp: 'Application',
        items: [
          { label: 'DHCP Server', count: config.dhcp.servers?.length, tab: 'ip-dhcp-server' },
          { label: 'DNS Settings', count: config.ipAddresses.some(i => i.interfaceObj?.dhcpServers) ? 'Active' : null, tab: 'ip-dns' },
          { label: 'Hotspot', count: config.hotspot.servers?.length, tab: 'ip-hotspot' },
          { label: 'IP Services (SSH, Winbox)', count: 'Active', tab: 'ip-services' },
        ].filter(i => i.count),
      },
      l6: {
        name: 'Presentation (L6)',
        desc: 'Data formatting, encryption & decryption.',
        tcp: 'Application',
        items: [
          { label: 'VPN (Encryption)', count: config.vpn.wireguard.length + config.vpn.ovpn.length + config.vpn.l2tp.length, tab: 'vpn' },
        ].filter(i => i.count),
      },
      l5: {
        name: 'Session (L5)',
        desc: 'Interhost communication, session management.',
        tcp: 'Application',
        items: [ // Difficult to map directly in RouterOS config, usually handled by endpoints
          { label: 'Connection Tracking', count: 'Active', tab: 'firewall-filter' },
        ],
      },
      l4: {
        name: 'Transport (L4)',
        desc: 'End-to-end connections, reliability (TCP/UDP ports).',
        tcp: 'Transport',
        items: [
          { label: 'Firewall Filter (Port Rules)', count: config.firewall.filter.filter(r => r.protocol).length, tab: 'firewall-filter' },
          { label: 'Firewall NAT (Port Forwarding)', count: config.firewall.nat.filter(r => r.protocol).length, tab: 'firewall-nat' },
          { label: 'Mangle (Port Marking)', count: config.firewall.mangle?.filter(r => r.protocol).length, tab: 'firewall-mangle' },
        ].filter(i => i.count),
      },
      l3: {
        name: 'Network (L3)',
        desc: 'Path determination, logical addressing (IP).',
        tcp: 'Internet',
        items: [
          { label: 'IP Addresses', count: config.ipAddresses.length, tab: 'ip-addresses' },
          { label: 'IP Routes', count: config.routes.length, tab: 'ip-routes' },
          { label: 'Firewall Rules (IP Based)', count: config.firewall.filter.length, tab: 'firewall-filter' },
          { label: 'IP Pools', count: config.dhcp.pools?.length, tab: 'ip-pool' },
        ].filter(i => i.count),
      },
      l2: {
        name: 'Data Link (L2)',
        desc: 'Physical addressing (MAC), switching.',
        tcp: 'Network Access',
        items: [
          { label: 'Bridges', count: config.bridges?.length, tab: 'bridge-list' },
          { label: 'Bridge Ports', count: config.bridgePorts?.length, tab: 'bridge-ports' },
          { label: 'VLANs', count: config.interfaces.filter(i => i.type === 'vlan').length, tab: 'interfaces-list' },
          { label: 'Interface MACs', count: config.interfaces.length, tab: 'interfaces-list' },
        ].filter(i => i.count),
      },
      l1: {
        name: 'Physical (L1)',
        desc: 'Media, signal, binary transmission.',
        tcp: 'Network Access',
        items: [
          { label: 'Physical Interfaces (Ethernet)', count: config.interfaces.filter(i => i.type === 'ether').length, tab: 'interfaces-list' },
          { label: 'Hardware Ports / Serial', count: 'Active', tab: 'system-ports' },
        ].filter(i => i.count),
      },
    };
  };

  const layers = getMappedData();
  const tcpLayers = [
    { name: 'Application', osi: ['l7', 'l6', 'l5'], flex: 3, bg: 'var(--bg-active)', border: 'var(--layer-app-border)' },
    { name: 'Transport', osi: ['l4'], flex: 1, bg: 'var(--bg-active)', border: 'var(--layer-trans-border)' },
    { name: 'Internet', osi: ['l3'], flex: 1, bg: 'var(--bg-active)', border: 'var(--layer-net-border)' },
    { name: 'Network Access', osi: ['l2', 'l1'], flex: 2, bg: 'var(--bg-active)', border: 'var(--layer-link-border)' },
  ];

  const osiConfig = [
    { id: 'l7', bg: 'rgba(139, 92, 246, 0.15)', icon: <Server size={18} /> },
    { id: 'l6', bg: 'rgba(167, 139, 250, 0.15)', icon: <Lock size={18} /> },
    { id: 'l5', bg: 'rgba(196, 181, 253, 0.15)', icon: <Activity size={18} /> },
    { id: 'l4', bg: 'rgba(59, 130, 246, 0.15)', icon: <Share2 size={18} /> },
    { id: 'l3', bg: 'rgba(16, 185, 129, 0.15)', icon: <Globe size={18} /> },
    { id: 'l2', bg: 'rgba(245, 158, 11, 0.15)', icon: <Share2 size={18} /> },
    { id: 'l1', bg: 'rgba(217, 119, 6, 0.15)', icon: <Database size={18} /> },
  ];

  return (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Layers className="summary-card-icon" />
        <h2 className="section-title">OSI & TCP/IP Model Mapping</h2>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Perbandingan visual representasi konfigurasi MikroTik Anda terhadap model referensi OSI (7 Layer) dan model TCP/IP.
        Klik pada badge konfigurasi untuk langsung menuju ke halaman pengaturannya.
      </p>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* TCP/IP Model Side */}
        <div style={{ flex: '1', minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)' }}>TCP/IP Model</h3>
          {tcpLayers.map((tcp, i) => (
            <div 
              key={i} 
              style={{
                flex: tcp.flex,
                background: tcp.bg,
                borderLeft: `4px solid ${tcp.border}`,
                borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                fontWeight: 600,
                fontSize: '1.1rem',
                color: tcp.border,
                minHeight: '80px',
              }}
            >
              {tcp.name}
            </div>
          ))}
        </div>

        {/* Separator / Connector (Visual only, hidden on small screens ideally) */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', color: 'var(--border-color)', margin: '2rem 0' }}>
          {'↔'.repeat(5).split('').map((char, i) => <div key={i} style={{ opacity: 0.5 }}>{char}</div>)}
        </div>

        {/* OSI Model Side */}
        <div style={{ flex: '3', minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)' }}>OSI 7-Layer Model</h3>
          {osiConfig.map(layerInfo => {
            const layerData = layers[layerInfo.id];
            return (
              <div 
                key={layerInfo.id}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  transition: 'transform 0.2s',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)'
                }}
                className="card-hover"
              >
                <div style={{ 
                  background: layerInfo.bg, 
                  padding: '10px', 
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)'
                }}>
                  {layerInfo.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{layerData.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TCP/IP: {layerData.tcp}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    {layerData.desc}
                  </div>
                  
                  {/* Config Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {layerData.items.length === 0 ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Tidak ada konfigurasi terkait</span>
                    ) : (
                      layerData.items.map((item, idx) => (
                        <span 
                          key={idx}
                          onClick={() => onNavigate(item.tab)}
                          title={`Navigasi ke ${item.label}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'var(--badge-bg)',
                            border: '1px solid var(--border)',
                            padding: '4px 10px',
                            borderRadius: '99px',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--badge-bg-hover)';
                            e.currentTarget.style.borderColor = 'var(--accent)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--badge-bg)';
                            e.currentTarget.style.borderColor = 'var(--border)';
                          }}
                        >
                          {item.label}
                          <span style={{ background: 'var(--accent)', color: 'white', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600 }}>
                            {item.count}
                          </span>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
