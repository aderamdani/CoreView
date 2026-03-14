import React, { useState, useEffect } from 'react';
import './index.css';
import './App.css';
import { parseMikroTikConfig } from './utils/parser';
import { Uploader } from './components/Uploader';
import { Dashboard } from './components/Dashboard';
import { Sun, Moon } from 'lucide-react';

function App() {
  const [view, setView] = useState('landing'); // landing | upload | dashboard
  const [config, setConfig] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (!isDarkMode) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [isDarkMode]);

  const demoConfig = {
    metadata: {
      identity: 'CoreView Demo Router',
      model: 'CCR2004-1G-12S+2XS',
      serialNumber: 'DEMO-001-CV',
      softwareId: 'CV-DEMO-2026',
      generatedAt: '2026-03-14 09:30:00',
    },
    interfaces: [
      { name: 'ether1', defaultName: 'ether1', type: 'ether', active: true, ip: '203.0.113.2/30', comment: 'WAN ISP' },
      { name: 'ether2', defaultName: 'ether2', type: 'ether', active: true, ip: '10.10.10.1/24', comment: 'LAN Office' },
      { name: 'ether3', defaultName: 'ether3', type: 'ether', active: true, ip: '10.20.20.1/24', comment: 'LAN Guest' },
      { name: 'wlan1', defaultName: 'wlan1', type: 'wlan', active: true, ip: '10.30.30.1/24', comment: 'WiFi AP' },
    ],
    interfaceLists: [{ name: 'WAN' }, { name: 'LAN' }, { name: 'GUEST' }],
    interfaceListMembers: [
      { list: 'WAN', interface: 'ether1' },
      { list: 'LAN', interface: 'ether2' },
      { list: 'LAN', interface: 'wlan1' },
      { list: 'GUEST', interface: 'ether3' },
    ],

    bridges: [
      { name: 'bridge-lan', arp: 'enabled', 'protocol-mode': 'rstp', disabled: 'no', ports: ['ether2', 'wlan1'] },
      { name: 'bridge-guest', arp: 'enabled', 'protocol-mode': 'rstp', disabled: 'no', ports: ['ether3'] },
    ],
    bridgePorts: [
      { interface: 'ether2', bridge: 'bridge-lan', pvid: '10', disabled: 'no' },
      { interface: 'wlan1', bridge: 'bridge-lan', pvid: '10', disabled: 'no' },
      { interface: 'ether3', bridge: 'bridge-guest', pvid: '20', disabled: 'no' },
    ],

    ipAddresses: [
      { address: '203.0.113.2/30', network: '203.0.113.0', interface: 'ether1', active: true, interfaceObj: { dhcpServers: [] } },
      { address: '10.10.10.1/24', network: '10.10.10.0', interface: 'bridge-lan', active: true, interfaceObj: { dhcpServers: [{ name: 'dhcp-lan' }] } },
      { address: '10.20.20.1/24', network: '10.20.20.0', interface: 'bridge-guest', active: true, interfaceObj: { dhcpServers: [{ name: 'dhcp-guest' }] } },
      { address: '10.30.30.1/24', network: '10.30.30.0', interface: 'wlan1', active: true, interfaceObj: { dhcpServers: [] } },
    ],
    routes: [
      { 'dst-address': '0.0.0.0/0', gateway: '203.0.113.1', distance: '1', static: 'yes', comment: 'Default route to ISP' },
      { 'dst-address': '10.100.0.0/16', gateway: '10.10.10.254', distance: '1', static: 'yes', comment: 'HQ Route' },
      { 'dst-address': '172.16.99.0/24', gateway: '10.20.20.254', distance: '2', static: 'yes', comment: 'Guest uplink route' },
    ],
    routingTables: [
      { name: 'main', fib: true, disabled: 'no' },
      { name: 'to-vpn', fib: true, disabled: 'no' },
    ],

    firewall: {
      filter: [
        { action: 'accept', chain: 'input', protocol: 'tcp', 'dst-port': '8291', 'src-address': '10.10.10.0/24', comment: 'Allow Winbox LAN', disabled: 'no' },
        { action: 'accept', chain: 'input', protocol: 'icmp', comment: 'Allow ICMP', disabled: 'no' },
        { action: 'drop', chain: 'input', comment: 'Drop invalid input', disabled: 'no' },
      ],
      nat: [
        { action: 'masquerade', chain: 'srcnat', 'src-address': '10.10.10.0/24', outInterface: 'ether1', comment: 'NAT LAN to WAN', disabled: 'no' },
        { action: 'dst-nat', chain: 'dstnat', protocol: 'tcp', 'dst-port': '8443', 'to-addresses': '10.10.10.10', comment: 'HTTPS Port Forward', disabled: 'no' },
      ],
      mangle: [
        { action: 'mark-routing', chain: 'prerouting', protocol: 'tcp', 'new-routing-mark': 'to-vpn', comment: 'Route marked traffic to VPN', disabled: 'no' },
      ],
      raw: [
        { action: 'drop', chain: 'prerouting', 'src-address': '198.51.100.0/24', comment: 'Drop known bad source range', disabled: 'no' },
      ],
      groupedAddressLists: [
        { name: 'blocked_ips', count: 2, items: [{ address: '198.51.100.10', comment: 'Scanner' }, { address: '198.51.100.33', comment: 'Bruteforce source' }] },
        { name: 'trusted_admins', count: 2, items: [{ address: '10.10.10.5', comment: 'NOC PC' }, { address: '10.10.10.6', comment: 'Engineer Laptop' }] },
      ],
    },

    dhcp: {
      servers: [
        { name: 'dhcp-lan', active: true, interface: 'bridge-lan', 'address-pool': 'pool-lan', poolObj: { ranges: '10.10.10.100-10.10.10.200' }, networkObj: { address: '10.10.10.0/24', gateway: '10.10.10.1' } },
        { name: 'dhcp-guest', active: true, interface: 'bridge-guest', 'address-pool': 'pool-guest', poolObj: { ranges: '10.20.20.100-10.20.20.240' }, networkObj: { address: '10.20.20.0/24', gateway: '10.20.20.1' } },
      ],
      clients: [
        { interface: 'ether1', 'add-default-route': 'yes', 'use-peer-dns': 'yes', 'use-peer-ntp': 'yes', disabled: 'no' },
      ],
    },
    dns: {
      servers: ['1.1.1.1', '8.8.8.8', '9.9.9.9'],
      static: [
        { name: 'nas.office.local', address: '10.10.10.20', ttl: '1d' },
        { name: 'printer.office.local', address: '10.10.10.30', ttl: '1d' },
      ],
    },
    pools: [
      { name: 'pool-lan', ranges: '10.10.10.100-10.10.10.200', dhcpServer: { name: 'dhcp-lan' } },
      { name: 'pool-guest', ranges: '10.20.20.100-10.20.20.240', dhcpServer: { name: 'dhcp-guest' } },
      { name: 'pool-vpn', ranges: '10.99.99.2-10.99.99.50' },
    ],
    cloud: { 'ddns-enabled': 'yes', 'update-time': 'yes' },

    hotspot: {
      servers: [
        { name: 'hs-guest', interface: 'bridge-guest', 'address-pool': 'pool-guest', profile: 'hsprof1', active: true, poolObj: { ranges: '10.20.20.100-10.20.20.240' } },
      ],
      userProfiles: [
        { name: 'default', 'shared-users': '1', 'address-pool': 'pool-guest', 'keepalive-timeout': '2m', poolObj: { ranges: '10.20.20.100-10.20.20.240' } },
      ],
      users: [
        { name: 'guest01', profile: 'default', 'mac-address': 'AA:BB:CC:11:22:33', comment: 'Guest voucher', disabled: 'no' },
      ],
      bindings: [
        { 'mac-address': 'AA:BB:CC:11:22:33', address: '10.20.20.110', type: 'bypassed', disabled: 'no' },
      ],
      walledGarden: [
        { action: 'allow', 'dst-host': '*.mikrotik.com' },
      ],
      walledGardenIp: [
        { action: 'accept', 'dst-address': '1.1.1.1/32' },
      ],
    },

    queues: {
      trees: [
        { name: 'total-download', parent: 'global', 'packet-mark': 'pm-download', 'limit-at': '20M', 'max-limit': '100M', priority: '4', disabled: 'no' },
      ],
      types: [
        { name: 'pcq-download-default', kind: 'pcq', 'pcq-classifier': 'dst-address', 'pcq-limit': '50' },
      ],
    },

    vpn: {
      wireguard: [
        { name: 'wg-office', 'listen-port': '13231', mtu: '1420' },
      ],
      wireguardPeers: [
        { interface: 'wg-office', 'public-key': 'demoPublicKey1234567890=', 'allowed-address': '10.99.99.2/32', 'endpoint-address': 'vpn.example.com', 'endpoint-port': '51820', comment: 'Main peer', disabled: 'no' },
      ],
      ovpn: [
        { name: 'ovpn-backup', user: 'ovpnuser', profile: 'default-encryption', disabled: 'no' },
      ],
      l2tp: [
        { name: 'l2tp-hq', user: 'branch-a', profile: 'default-encryption', disabled: 'no' },
      ],
    },

    tools: {
      graphingInterfaces: [
        { interface: 'ether1', 'allow-address': '10.10.10.0/24', 'store-on-disk': 'yes' },
        { interface: 'bridge-lan', 'allow-address': '10.10.10.0/24', 'store-on-disk': 'yes' },
      ],
    },

    services: [
      { name: 'ssh', port: '22', disabled: 'no', address: '10.10.10.0/24' },
      { name: 'www-ssl', port: '443', disabled: 'no', address: '10.10.10.0/24' },
      { name: 'api-ssl', port: '8729', disabled: 'no', address: '10.10.10.0/24' },
      { name: 'telnet', port: '23', disabled: 'yes', address: '0.0.0.0/0' },
    ],
    system: {
      identity: { name: 'CoreView Demo Router' },
      clock: { 'time-zone-name': 'Asia/Jakarta', 'time-zone-autodetect': 'no' },
      logging: [
        { target: 'memory', 'disk-file-name': 'memory-log' },
        { target: 'disk', 'disk-file-name': 'router.log' },
      ],
    },
    snmp: { enabled: 'yes', contact: 'noc@coreview.local' },
    ports: [
      { id: '0', name: 'serial0', 'baud-rate': '115200' },
      { id: '1', name: 'usb1', 'baud-rate': 'auto' },
    ],
  };

  const handleFileParsed = (content) => {
    const parsedData = parseMikroTikConfig(content);
    console.log('Parsed configuration:', parsedData);
    setConfig(parsedData);
    setView('dashboard');
  };

  const handleReset = () => {
    setConfig(null);
    setView('landing');
  };

  const handleOpenDemoDashboard = () => {
    setConfig(demoConfig);
    setView('dashboard');
  };

  const handleOpenUpload = () => {
    setConfig(null);
    setView('upload');
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="header-title text-gradient">CoreView</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
            }}
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {(view === 'upload' || view === 'dashboard') && (
            <button className="btn btn-primary animate-fade-in" onClick={handleReset}>
              ← Kembali ke Landing
            </button>
          )}
        </div>
      </header>

      <main className="main-content">
        {view === 'landing' && (
          <section className="landing-wrap">
            <div className="landing-card">
              <div className="landing-hero">
                <div className="landing-left">
                  <div className="landing-badge">Interactive MikroTik Visualizer</div>
                  <h2 className="landing-title">CoreView untuk Visualisasi Konfigurasi MikroTik</h2>
                  <p className="landing-subtitle">
                    CoreView membantu Anda memahami file konfigurasi RouterOS (.rsc/.txt) secara visual,
                    mulai dari identitas router, interface, IP address, routing, firewall, NAT, hingga service.
                    Pilih mode interaktif di bawah untuk mulai eksplorasi.
                  </p>

                  <div className="landing-features">
                    <div className="landing-feature-item">🔍 Parse konfigurasi otomatis</div>
                    <div className="landing-feature-item">🧭 Navigasi dashboard per-section</div>
                    <div className="landing-feature-item">🧪 Coba dashboard demo tanpa upload dulu</div>
                  </div>

                  <div className="landing-actions">
                    <button className="btn btn-primary" onClick={handleOpenDemoDashboard}>
                      Lihat Dashboard
                    </button>
                    <button className="btn btn-ghost" onClick={handleOpenUpload}>
                      Upload Konfigurasi
                    </button>
                  </div>
                </div>

                <div className="landing-right" aria-hidden="true">
                  <div className="landing-orb" />
                  <div className="landing-orb landing-orb-small" />
                </div>
              </div>
            </div>
          </section>
        )}

        {view === 'upload' && <Uploader onFileParsed={handleFileParsed} />}

        {view === 'dashboard' && config && <Dashboard config={config} />}
      </main>
    </div>
  );
}

export default App;
