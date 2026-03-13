import React, { useState } from 'react';
import { Layers, Activity, Share2, Globe, Shield, Database, Settings, Server, Lock, ChevronDown, ChevronRight, BookOpen, Zap, Wifi, Cpu, Monitor, Key, Network, Radio } from 'lucide-react';

export const OsiTcpView = ({ config, onNavigate }) => {
  const [expandedLayer, setExpandedLayer] = useState(null);
  const [showIntro, setShowIntro] = useState(true);

  // Detailed explanations for each layer
  const layerDetails = {
    l7: {
      name: 'Application (L7)',
      shortDesc: 'End-user processes & network services',
      function: 'Layer ini adalah yang paling dekat dengan pengguna akhir. Menangani proses aplikasi dan layanan jaringan seperti web browsing, email, dan file transfer.',
      protocols: ['HTTP/HTTPS', 'FTP', 'SMTP', 'DNS', 'DHCP', 'Telnet', 'SSH'],
      example: 'Web browser (HTTP), Email client (SMTP), File transfer (FTP), Remote login (SSH)',
      mikrotikRelation: 'DHCP Server, DNS Settings, Hotspot, IP Services (SSH, Winbox)',
      mikrotikConfig: `/ip dhcp-server\n/ip dns\n/ip hotspot\n/ip service`
    },
    l6: {
      name: 'Presentation (L6)',
      shortDesc: 'Data formatting, encryption & decryption',
      function: 'Layer ini bertanggung jawab untuk presentasi data ke aplikasi. Menangani format data, enkripsi, dan kompresi agar data dapat dipahami oleh aplikasi.',
      protocols: ['SSL/TLS', 'MIME', 'ASCII', 'EBCDIC', 'JPEG', 'MPEG'],
      example: 'SSL/TLS encryption, JPEG image compression, Character set conversion',
      mikrotikRelation: 'VPN configurations (WireGuard, OpenVPN, L2TP) untuk enkripsi data end-to-end',
      mikrotikConfig: `/interface wireguard\n/interface ovpn-client\n/interface l2tp-client`
    },
    l5: {
      name: 'Session (L5)',
      shortDesc: 'Interhost communication, session management',
      function: 'Layer ini mengelola dialog/kontrol antara dua komputer. Menangani pembentukan, pengelolaan, dan terminasi sesi komunikasi.',
      protocols: ['NetBIOS', 'RPC', 'PPTP', 'SMB', 'NFS'],
      example: 'Database connections, Remote procedure calls (RPC), Network file systems, Chat applications',
      mikrotikRelation: 'Connection tracking di firewall untuk memantau sesi aktif',
      mikrotikConfig: `/ip firewall connection tracking\n/ip firewall filter`
    },
    l4: {
      name: 'Transport (L4)',
      shortDesc: 'End-to-end connections, reliability (TCP/UDP ports)',
      function: 'Layer ini menyediakan transfer data end-to-end yang reliable. Mengatur kontrol aliran, error recovery, dan segmentasi data.',
      protocols: ['TCP', 'UDP', 'SCTP'],
      example: 'TCP untuk reliable delivery (web, email), UDP untuk real-time data (streaming, gaming)',
      mikrotikRelation: 'Firewall filter rules berdasarkan port, NAT port forwarding, Mangle rules untuk port marking',
      mikrotikConfig: `/ip firewall filter add protocol=tcp dst-port=80\n/ip firewall nat add action=dst-nat protocol=tcp dst-port=80\n/ip firewall mangle`
    },
    l3: {
      name: 'Network (L3)',
      shortDesc: 'Path determination, logical addressing (IP)',
      function: 'Layer ini menentukan path terbaik untuk data melalui jaringan. Menangani logical addressing dan routing antar jaringan.',
      protocols: ['IP', 'ICMP', 'OSPF', 'RIP', 'BGP', 'EIGRP'],
      example: 'IP routing tables, Subnetting, Network address translation (NAT)',
      mikrotikRelation: 'IP addresses, routing table, IP pools, DHCP pools, firewall rules berdasarkan IP',
      mikrotikConfig: `/ip address add address=192.168.1.1/24\n/ip route add gateway=192.168.1.254\n/ip pool add name=dhcp-pool ranges=192.168.1.10-192.168.1.100`
    },
    l2: {
      name: 'Data Link (L2)',
      shortDesc: 'Physical addressing (MAC), switching',
      function: 'Layer ini menyediakan node-to-node transfer data. Menangani physical addressing (MAC) dan error detection dalam satu segmen jaringan.',
      protocols: ['Ethernet', 'PPP', 'HDLC', 'Frame Relay', 'Wi-Fi'],
      example: 'Ethernet switching, VLAN configuration, MAC address filtering, Bridge operations',
      mikrotikRelation: 'Bridge configuration, bridge ports, VLAN interfaces, interface MAC addresses',
      mikrotikConfig: `/interface bridge add name=bridge1\n/interface bridge port add bridge=bridge1 interface=ether1\n/interface vlan add name=vlan10 vlan-id=10 interface=ether1`
    },
    l1: {
      name: 'Physical (L1)',
      shortDesc: 'Media, signal, binary transmission',
      function: 'Layer ini menangani transmisi bit-bit melalui media fisik. Mendefinisikan electrical, mechanical, dan procedural interface.',
      protocols: ['RS-232', 'RS-485', 'Ethernet physical layer', 'USB', 'Bluetooth'],
      example: 'Ethernet cable specifications, Fiber optic connections, Wireless signal encoding',
      mikrotikRelation: 'Physical Ethernet interfaces, hardware ports, serial connections',
      mikrotikConfig: `/interface ethernet print\n/system routerboard print\n/interface serial print`
    }
  };

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
    { id: 'l7', bg: 'rgba(139, 92, 246, 0.15)', icon: <Monitor size={18} /> },
    { id: 'l6', bg: 'rgba(167, 139, 250, 0.15)', icon: <Key size={18} /> },
    { id: 'l5', bg: 'rgba(196, 181, 253, 0.15)', icon: <Activity size={18} /> },
    { id: 'l4', bg: 'rgba(59, 130, 246, 0.15)', icon: <Share2 size={18} /> },
    { id: 'l3', bg: 'rgba(16, 185, 129, 0.15)', icon: <Network size={18} /> },
    { id: 'l2', bg: 'rgba(245, 158, 11, 0.15)', icon: <Wifi size={18} /> },
    { id: 'l1', bg: 'rgba(217, 119, 6, 0.15)', icon: <Radio size={18} /> },
  ];

  return (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Layers className="summary-card-icon" />
        <h2 className="section-title">OSI & TCP/IP Model - Panduan Lengkap</h2>
      </div>

      {/* Introduction Section */}
      {showIntro && (
        <div style={{
          background: 'linear-gradient(135deg, var(--bg-active) 0%, var(--bg-elevated) 100%)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          marginBottom: '2rem',
          position: 'relative'
        }}>
          <button
            onClick={() => setShowIntro(false)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            ×
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <BookOpen size={24} style={{ color: 'var(--accent)' }} />
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Pengenalan Model Jaringan</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
            <div>
              <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>🔍 OSI 7-Layer Model</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Model referensi yang dikembangkan oleh ISO untuk memahami bagaimana protokol jaringan berinteraksi.
                Setiap layer memiliki fungsi spesifik dan berkomunikasi dengan layer di atas dan di bawahnya.
              </p>
              <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>7 Layer:</strong>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Application → Presentation → Session → Transport → Network → Data Link → Physical
                </div>
              </div>
            </div>
            <div>
              <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>🌐 TCP/IP Model</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Model praktis yang digunakan oleh internet. Lebih sederhana dari OSI dengan 4 layer utama.
                TCP/IP adalah dasar dari semua komunikasi internet modern.
              </p>
              <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>4 Layer:</strong>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Application → Transport → Internet → Network Access
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', margin: 0, textAlign: 'center' }}>
              <Zap size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              <strong>Klik pada setiap layer</strong> untuk melihat penjelasan detail dan hubungannya dengan konfigurasi MikroTik Anda
            </p>
          </div>
        </div>
      )}

      {/* Show Intro Button */}
      {!showIntro && (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <button
            onClick={() => setShowIntro(true)}
            style={{
              background: 'var(--bg-active)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1.5rem',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-active)';
              e.currentTarget.style.color = 'var(--accent)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <BookOpen size={16} />
            Tampilkan Panduan Lengkap
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* TCP/IP Model Side */}
        <div style={{ flex: '1', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(8px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2), 0 0 20px rgba(99,102,241,0.1)';
                e.currentTarget.style.borderLeftWidth = '6px';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0) scale(1)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderLeftWidth = '4px';
              }}
              onClick={() => setExpandedLayer(expandedLayer === `tcp-${tcp.name}` ? null : `tcp-${tcp.name}`)}
            >
              {tcp.name}
              {expandedLayer === `tcp-${tcp.name}` ?
                <ChevronDown size={16} style={{ position: 'absolute', right: '10px' }} /> :
                <ChevronRight size={16} style={{ position: 'absolute', right: '10px' }} />
              }
            </div>
          ))}
        </div>

        {/* TCP/IP Details Panel */}
        {expandedLayer && expandedLayer.startsWith('tcp-') && (
          <div style={{
            flex: '2',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            animation: 'slideDown 0.3s ease-out'
          }}>
            <h4 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>
              {expandedLayer.replace('tcp-', '')} Layer
            </h4>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Penjelasan detail untuk layer TCP/IP ini akan membantu Anda memahami fungsi dan perannya dalam komunikasi jaringan.
            </p>
          </div>
        )}

        {/* Separator */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', color: 'var(--border-color)', margin: '2rem 0' }}>
          {'↔'.repeat(5).split('').map((char, i) => <div key={i} style={{ opacity: 0.5 }}>{char}</div>)}
        </div>

        {/* OSI Model Side */}
        <div style={{ flex: '3', minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)' }}>OSI 7-Layer Model</h3>
          {osiConfig.map((layerInfo, index) => {
            const layerNum = 7 - index;
            const layerData = layers[layerInfo.id];
            const layerDetail = layerDetails[layerInfo.id];
            const isExpanded = expandedLayer === layerInfo.id;
            
            return (
              <div key={layerInfo.id}>
                <div 
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    boxShadow: isExpanded ? '0 4px 20px rgba(0,0,0,0.15)' : 'inset 0 0 20px rgba(0,0,0,0.1)'
                  }}
                  className="card-hover"
                  onClick={() => setExpandedLayer(isExpanded ? null : layerInfo.id)}
                  onMouseEnter={(e) => {
                    if (!isExpanded) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isExpanded) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.1)';
                    }
                  }}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TCP/IP: {layerData.tcp}</span>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate(item.tab);
                            }}
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
                
                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                    padding: '1.5rem',
                    marginTop: '-1rem',
                    marginBottom: '1rem',
                    animation: 'slideDown 0.3s ease-out',
                    borderTop: 'none'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div>
                        <h5 style={{ color: 'var(--accent)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>🔧 Fungsi Utama</h5>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                          {layerDetail.function}
                        </p>
                      </div>
                      
                      <div>
                        <h5 style={{ color: 'var(--accent)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>📋 Protokol & Teknologi</h5>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {layerDetail.protocols.map((protocol, idx) => (
                            <span key={idx} style={{
                              background: 'var(--bg-active)',
                              color: 'var(--text-primary)',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.7rem',
                              fontWeight: 500
                            }}>
                              {protocol}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h5 style={{ color: 'var(--accent)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>💡 Contoh Penggunaan</h5>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                          {layerDetail.example}
                        </p>
                      </div>
                      
                      <div>
                        <h5 style={{ color: 'var(--accent)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>🔗 Relasi MikroTik</h5>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                          {layerDetail.mikrotikRelation}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '1.5rem' }}>
                      <h5 style={{ color: 'var(--accent)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>⚙️ Konfigurasi MikroTik</h5>
                      <div style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '1rem',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        color: 'var(--text-primary)',
                        overflowX: 'auto'
                      }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                          {layerDetail.mikrotikConfig}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
