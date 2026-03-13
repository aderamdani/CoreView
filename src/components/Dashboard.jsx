import React, { useState } from 'react';
import { 
  Server, Activity, Shield, Wifi, Share2, Route, DownloadCloud, 
  Lock, Globe, Cpu, AlertCircle, CheckCircle2, ChevronDown, ChevronRight,
  Settings, Clock, Terminal, Monitor, Key, Cloud, Search, BarChart2, HelpCircle, Tag, ArrowLeft, ArrowRight, Layers
} from 'lucide-react';
import { configHelp } from '../utils/configHelp';
import { MindMap } from './MindMap';
import { OsiTcpView } from './OsiTcpView';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';

// Safely converts any value to a renderable string (prevents "Objects are not valid as React children" errors)
const safeStr = (val, fallback = '-') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

// Error boundary – wraps each section so one crash doesn't blank the whole dashboard
class SectionErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontFamily: 'monospace', fontSize: '0.85rem' }}>
          <strong>⚠ Section render error:</strong> {this.state.error?.message}
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── Relation label → sidebar tab ID mapping ──────────────────── */
const RELATION_TO_TAB = {
  'Network Interfaces':      'interfaces-list',
  'Interface Lists':         'interfaces-lists',
  'Bridge':                  'bridge-list',
  'Bridge → Ports':          'bridge-ports',
  'IP → Addresses':          'ip-addresses',
  'DHCP Server':             'ip-dhcp-server',
  'DHCP Client':             'ip-dhcp-client',
  'DNS':                     'ip-dns',
  'IP → Routes':             'ip-routes',
  'Routing Tables':          'routing-tables',
  'IP → Pools':              'ip-pool',
  'IP → Cloud':              'ip-cloud',
  'Hotspot':                 'ip-hotspot',
  'IP → Services':           'ip-services',
  'Firewall Filter':         'firewall-filter',
  'Firewall → NAT':          'firewall-nat',
  'Firewall → Mangle':       'firewall-mangle',
  'Firewall → Raw':          'firewall-raw',
  'Firewall Address Lists':  'firewall-address-lists',
  'Queue Tree':              'queues-tree',
  'Queue Types':             'queues-types',
  'VPN':                     'vpn',
  'System → Identity':       'system-identity',
  'System → Clock':          'system-clock',
  'System → Logging':        'system-logging',
  'SNMP':                    'system-snmp',
  'Hardware Ports':          'system-ports',
  'Interface Graphing':      'tools-graphing',
};

/* ─── HelpPanel ────────────────────────────────────────────────────
 * Collapsible contextual help shown at the top of each config section.
 * onNavigate = setActiveTab from Dashboard so relation tags can deep-link.
 */
const HelpPanel = ({ id, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const help = configHelp[id];
  if (!help) return null;

  return (
    <div style={{
      marginBottom: '1.5rem',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      overflow: 'hidden',
      background: 'var(--bg-elevated, #1a1e2a)',
    }}>
      {/* Header – always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--accent-light, #818cf8)',
          fontSize: '0.82rem',
          fontFamily: 'inherit',
          fontWeight: 500,
          textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <HelpCircle size={14} />
          {open ? 'Sembunyikan bantuan' : `Apa itu ${help.title}?`}
        </span>
        <ChevronDown
          size={14}
          style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', opacity: 0.5 }}
        />
      </button>

      {/* Expandable body */}
      {open && (
        <div style={{ padding: '0 14px 16px', borderTop: '1px solid var(--border)' }}>

          {/* Summary */}
          <p style={{ margin: '12px 0 14px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {help.summary}
          </p>

          {/* Impact bullets */}
          {help.impact && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Dampak &amp; Pertimbangan
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {help.impact.map((point, i) => (
                  <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    <span style={{ color: 'var(--accent, #6366f1)', marginTop: '4px', flexShrink: 0 }}>▸</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Relations – clickable if they have a mapped tab */}
          {help.relations && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Bagian Terkait
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {help.relations.map((rel, i) => {
                  const tabId = RELATION_TO_TAB[rel];
                  const isNavigable = !!tabId && !!onNavigate;
                  return (
                    <span
                      key={i}
                      onClick={isNavigable ? () => { onNavigate(tabId); setOpen(false); } : undefined}
                      title={isNavigable ? `Navigasi ke ${rel}` : rel}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '3px 10px', borderRadius: '99px',
                        fontSize: '0.75rem', fontWeight: 500,
                        background: isNavigable ? 'rgba(99,102,241,0.12)' : 'rgba(75,85,99,0.2)',
                        color: isNavigable ? 'var(--accent-light, #818cf8)' : 'var(--text-secondary)',
                        border: `1px solid ${isNavigable ? 'rgba(99,102,241,0.3)' : 'rgba(75,85,99,0.4)'}`,
                        cursor: isNavigable ? 'pointer' : 'default',
                        transition: 'background 0.15s, border-color 0.15s',
                        userSelect: 'none',
                      }}
                      onMouseEnter={isNavigable ? e => {
                        e.currentTarget.style.background = 'rgba(99,102,241,0.22)';
                        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)';
                      } : undefined}
                      onMouseLeave={isNavigable ? e => {
                        e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
                        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                      } : undefined}
                    >
                      <Tag size={10} />
                      {rel}
                      {isNavigable && <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>→</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {/* Prerequisites */}
          {help.prerequisites && help.prerequisites.length > 0 && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Langkah Sebelumnya (Prerequisites)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {help.prerequisites.map((rel, i) => {
                  const tabId = RELATION_TO_TAB[rel];
                  const isNavigable = !!tabId && !!onNavigate;
                  return (
                    <span
                      key={`prereq-${i}`}
                      onClick={isNavigable ? () => { onNavigate(tabId); setOpen(false); } : undefined}
                      title={isNavigable ? `Navigasi ke ${rel}` : rel}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '3px 10px', borderRadius: '99px',
                        fontSize: '0.75rem', fontWeight: 500,
                        background: 'var(--bg-warning-subtle)', // Yellowish warning/prereq
                        color: 'var(--status-warning)',
                        border: '1px solid var(--bg-warning-subtle-hover)',
                        cursor: isNavigable ? 'pointer' : 'default',
                        transition: 'background 0.15s, border-color 0.15s',
                        userSelect: 'none',
                      }}
                      onMouseEnter={isNavigable ? e => {
                        e.currentTarget.style.background = 'var(--bg-warning-subtle-hover)';
                      } : undefined}
                      onMouseLeave={isNavigable ? e => {
                        e.currentTarget.style.background = 'var(--bg-warning-subtle)';
                      } : undefined}
                    >
                      <ArrowLeft size={10} />
                      {rel}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {help.nextSteps && help.nextSteps.length > 0 && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Langkah Selanjutnya (Next Steps)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {help.nextSteps.map((rel, i) => {
                  const tabId = RELATION_TO_TAB[rel];
                  const isNavigable = !!tabId && !!onNavigate;
                  return (
                    <span
                      key={`next-${i}`}
                      onClick={isNavigable ? () => { onNavigate(tabId); setOpen(false); } : undefined}
                      title={isNavigable ? `Navigasi ke ${rel}` : rel}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '3px 10px', borderRadius: '99px',
                        fontSize: '0.75rem', fontWeight: 500,
                        background: 'var(--bg-success-subtle)', // Greenish success/next
                        color: 'var(--status-success)',
                        border: '1px solid var(--bg-success-subtle-hover)',
                        cursor: isNavigable ? 'pointer' : 'default',
                        transition: 'background 0.15s, border-color 0.15s',
                        userSelect: 'none',
                      }}
                      onMouseEnter={isNavigable ? e => {
                        e.currentTarget.style.background = 'var(--bg-success-subtle-hover)';
                      } : undefined}
                      onMouseLeave={isNavigable ? e => {
                        e.currentTarget.style.background = 'var(--bg-success-subtle)';
                      } : undefined}
                    >
                      {rel}
                      <ArrowRight size={10} />
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


export const Dashboard = ({ config, searchTerm = '' }) => {
  // Since 'firewall' expands, let's default the first submenu as active or 'overview'
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedMenus, setExpandedMenus] = useState({ firewall: true });

  // A helper function to filter arrays based on searchTerm
  const applyFilter = (arr) => {
    if (!searchTerm) return arr;
    const lowerTerm = searchTerm.toLowerCase();
    return arr.filter(item => 
      Object.values(item).some(val => safeStr(val).toLowerCase().includes(lowerTerm))
    );
  };

  const { metadata, interfaces, ipAddresses, routes, vpn, firewall, dhcp } = config;
  
  // Calculate summaries
  const totalInterfaces = interfaces.length;
  const activeInterfaces = interfaces.filter(i => i.active).length;
  const totalVpns = vpn.wireguard.length + vpn.ovpn.length + vpn.l2tp.length;
  const totalRoutes = routes.length;
  const firewallRules = firewall.filter.length + firewall.nat.length + (firewall.mangle?.length || 0) + (firewall.raw?.length || 0);

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const renderSidebar = () => {
    const menus = [
      { id: 'overview', label: 'Overview', icon: <Server size={15} /> },
      { id: 'mindmap', label: 'Mind Map', icon: <Share2 size={15} /> },
      { id: 'osi-tcp', label: 'OSI & TCP/IP', icon: <Layers size={15} /> },
      { 
        id: 'interfaces', 
        label: 'Interfaces', 
        icon: <Activity size={15} />,
        submenus: [
          { id: 'interfaces-list', label: 'All Interfaces' },
          { id: 'interfaces-lists', label: 'Interface Lists' }
        ]
      },
      { 
        id: 'bridge', 
        label: 'Bridge', 
        icon: <Share2 size={15} />,
        submenus: [
          { id: 'bridge-list', label: 'Bridges' },
          { id: 'bridge-ports', label: 'Ports' }
        ]
      },
      { 
        id: 'ip', 
        label: 'IP', 
        icon: <Globe size={15} />,
        submenus: [
          { id: 'ip-addresses', label: 'Addresses' },
          { id: 'ip-dhcp-server', label: 'DHCP Server' },
          { id: 'ip-dhcp-client', label: 'DHCP Client' },
          { id: 'ip-dns', label: 'DNS' },
          { id: 'ip-routes', label: 'Routes' },
          { id: 'ip-pool', label: 'Pools' },
          { id: 'ip-cloud', label: 'Cloud' },
          { id: 'ip-hotspot', label: 'Hotspot' },
          { id: 'ip-services', label: 'Services' }
        ]
      },
      { 
        id: 'routing', 
        label: 'Routing', 
        icon: <Route size={15} />,
        submenus: [
          { id: 'routing-tables', label: 'Tables' }
        ]
      },
      {
        id: 'firewall', 
        label: 'Firewall', 
        icon: <Shield size={15} />,
        submenus: [
          { id: 'firewall-filter', label: 'Filter Rules' },
          { id: 'firewall-nat', label: 'NAT' },
          { id: 'firewall-mangle', label: 'Mangle' },
          { id: 'firewall-raw', label: 'Raw' },
          { id: 'firewall-address-lists', label: 'Address Lists' }
        ]
      },
      { 
        id: 'queues', 
        label: 'Queues', 
        icon: <DownloadCloud size={15} />,
        submenus: [
          { id: 'queues-tree', label: 'Queue Tree' },
          { id: 'queues-types', label: 'Queue Types' }
        ]
      },
      { 
        id: 'system', 
        label: 'System', 
        icon: <Settings size={15} />,
        submenus: [
          { id: 'system-identity', label: 'Identity' },
          { id: 'system-clock', label: 'Clock' },
          { id: 'system-logging', label: 'Logging' },
          { id: 'system-snmp', label: 'SNMP' },
          { id: 'system-ports', label: 'Ports' }
        ]
      },
      { 
        id: 'tools', 
        label: 'Tools', 
        icon: <BarChart2 size={15} />,
        submenus: [
          { id: 'tools-graphing', label: 'Graphing' }
        ]
      },
      { id: 'vpn', label: 'VPN', icon: <Lock size={15} /> }
    ];

    return (
      <aside className="sidebar">
        <div className="sidebar-logo">
          {config?.system?.identity?.name || config?.metadata?.identity || 'DashMik'}
        </div>
        <ul className="sidebar-menu">
          {menus.map(menu => {
            const hasSubmenus = !!menu.submenus;
            const isMenuExpanded = expandedMenus[menu.id];
            const isParentActive = hasSubmenus && menu.submenus.some(s => s.id === activeTab);
            const isActive = activeTab === menu.id;

            return (
              <li key={menu.id}>
                <div 
                  className={`sidebar-item ${
                    isActive && !hasSubmenus ? 'active'
                    : isParentActive ? 'parent-active'
                    : ''
                  }`}
                  onClick={() => {
                    if (hasSubmenus) {
                      toggleMenu(menu.id);
                      if (!isMenuExpanded && !isParentActive) setActiveTab(menu.submenus[0].id);
                    } else {
                      setActiveTab(menu.id);
                    }
                  }}
                >
                  <div className="sidebar-item-content">
                    {menu.icon}
                    <span>{menu.label}</span>
                  </div>
                  {hasSubmenus && (
                    <ChevronRight
                      size={13}
                      className={`sidebar-chevron ${isMenuExpanded ? 'open' : ''}`}
                    />
                  )}
                </div>

                {hasSubmenus && isMenuExpanded && (
                  <div className="sidebar-submenus">
                    {menu.submenus.map(sub => (
                      <div 
                        key={sub.id}
                        className={`sidebar-subitem ${activeTab === sub.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(sub.id)}
                      >
                        {sub.label}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </aside>
    );
  };


  const renderOverview = () => {
    // Interactive Config Story Logic
    const storySteps = [];
    
    // Step 1: Identity & Access
    const identity = config?.system?.identity?.name || metadata.identity || 'MikroTik';
    let usersCount = 0;
    if (config?.user) usersCount = config.user.length;
    storySteps.push({
      id: 'step-identity',
      icon: <Server size={18} />,
      title: 'Identitas & Akses Sistem',
      color: 'var(--blue)',
      description: `Perangkat Anda dikonfigurasi dengan nama **${identity}**.${usersCount > 0 ? ` Terdapat ${usersCount} user yang terdaftar di konfigurasi ini.` : ''}`,
      detailType: 'system-identity'
    });

    // Step 2: Interfaces
    const activeIfaces = interfaces.filter(i => i.active).length;
    const bridges = config?.interface?.bridge?.length || 0;
    storySteps.push({
      id: 'step-interfaces',
      icon: <Activity size={18} />,
      title: 'Antarmuka Jaringan (Interfaces)',
      color: 'var(--green)',
      description: `Terdapat **${activeIfaces}** interface fisik/virtual yang berstatus aktif.${bridges > 0 ? ` Perangkat ini juga memiliki ${bridges} interface Bridge untuk menggabungkan port.` : ''}`,
      detailType: 'interfaces-list'
    });

    // Step 3: IP Addressing
    const staticIps = ipAddresses.length;
    let dhcpDesc = '';
    const dhcpServers = config?.ip?.['dhcp-server']?.length || 0;
    const dhcpClients = config?.ip?.['dhcp-client']?.length || 0;
    if (dhcpServers > 0 && dhcpClients > 0) dhcpDesc = ` Perangkat ini beroperasi sebagai DHCP Server (${dhcpServers} aktif) sekaligus DHCP Client (${dhcpClients} aktif).`;
    else if (dhcpServers > 0) dhcpDesc = ` Layanan DHCP Server aktif pada ${dhcpServers} network untuk membagikan IP Address secara otomatis terhadap klien.`;
    else if (dhcpClients > 0) dhcpDesc = ` Beroperasi sebagai DHCP Client (${dhcpClients} aktif) untuk mendapatkan IP otomatis dari ISP/Upstream.`;

    storySteps.push({
      id: 'step-ip',
      icon: <Globe size={18} />,
      title: 'Pengalamatan IP (IP Addressing)',
      color: 'var(--yellow)',
      description: `Sebanyak **${staticIps}** konfigurasi IP statis ditemukan pada router.${dhcpDesc}`,
      detailType: 'ip-addresses'
    });

    // Step 4: Routing & Internet
    let routingDesc = '';
    const hasMasquerade = (config?.ip?.firewall?.nat || []).some(r => r.action === 'masquerade');
    const defaultRoutes = routes.filter(r => r.dstAddress === '0.0.0.0/0' || !r.dstAddress).length;
    
    if (hasMasquerade && defaultRoutes > 0) {
      routingDesc = `Aturan NAT (Masquerade) sudah ada untuk mengizinkan klien terhubung ke internet, didukung oleh ${defaultRoutes} rute default (0.0.0.0/0).`;
    } else if (defaultRoutes > 0) {
      routingDesc = `Memiliki ${defaultRoutes} rute default (0.0.0.0/0), namun belum ditemukan aturan NAT (Masquerade) yang jelas.`;
    } else {
      routingDesc = `Terdapat ${routes.length} tabel routing, pastikan rute Internet (0.0.0.0/0) sudah terkonfigurasi jika butuh akses global.`;
    }

    storySteps.push({
      id: 'step-routing',
      icon: <Route size={18} />,
      title: 'Routing & Akses Internet',
      color: 'var(--accent)',
      description: routingDesc,
      detailType: 'routing-tables'
    });

    // Step 5: Firewall & VPN
    const fwRules = (config?.ip?.firewall?.filter || []).length;
    let secDesc = fwRules > 0 ? `Keamanan jaringan dari/ke luar diatur menggunakan **${fwRules}** aturan Firewall Filter.` : 'Belum ada aturan Firewall Filter yang kuat dikonfigurasi pada perangkat ini.';
    
    if (totalVpns > 0) secDesc += ` Mendeteksi konfigurasi VPN (seperti L2TP, PPTP, atau OpenVPN) dengan total ${totalVpns} profil/secret.`;

    storySteps.push({
      id: 'step-security',
      icon: <Shield size={18} />,
      title: 'Keamanan & Akses Jauh (Firewall & VPN)',
      color: 'var(--red)',
      description: secDesc,
      detailType: 'firewall-filter'
    });


    return (
      <div className="animate-fade-in delay-100">
        <div className="glass-panel config-section" style={{ marginBottom: '1.5rem' }}>
          <div className="section-header">
            <Server className="summary-card-icon" />
            <h2 className="section-title">Device Information</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Router Identity</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{metadata.identity || 'MikroTik'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Model</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{metadata.model || 'Unknown Device'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Serial Number</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{metadata.serialNumber || 'N/A'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Software ID</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{metadata.softwareId || 'N/A'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Generated At</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{metadata.generatedAt || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="glass-panel summary-card card-hover" onClick={() => setActiveTab('interfaces-list')} style={{cursor: 'pointer'}}>
            <div className="summary-card-header">
              <Activity className="summary-card-icon" size={20} />
              INTERFACES
            </div>
            <div className="summary-card-value">
              {activeInterfaces} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {totalInterfaces} Active</span>
            </div>
          </div>
          <div className="glass-panel summary-card card-hover delay-100" onClick={() => setActiveTab('vpn')} style={{cursor: 'pointer'}}>
            <div className="summary-card-header">
              <Lock className="summary-card-icon" size={20} />
              VPN CONNECTIONS
            </div>
            <div className="summary-card-value">{totalVpns}</div>
          </div>
          <div className="glass-panel summary-card card-hover delay-200" onClick={() => setActiveTab('routing-tables')} style={{cursor: 'pointer'}}>
            <div className="summary-card-header">
              <Route className="summary-card-icon" size={20} />
              ROUTES
            </div>
            <div className="summary-card-value">{totalRoutes}</div>
          </div>
          <div className="glass-panel summary-card card-hover delay-300" onClick={() => setActiveTab('firewall-filter')} style={{cursor: 'pointer'}}>
            <div className="summary-card-header">
              <Shield className="summary-card-icon" size={20} />
              FIREWALL RULES
            </div>
            <div className="summary-card-value">{firewallRules}</div>
          </div>
        </div>

        {/* Interactive Configuration Story */}
        <div className="glass-panel config-section" style={{ minHeight: '300px' }}>
          <div className="section-header" style={{ marginBottom: '2rem' }}>
            <Activity className="summary-card-icon" />
            <h2 className="section-title">Configuration Story</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Berikut adalah penjelasan interaktif mengenai apa saja yang dikonfigurasi pada perangkat ini dari awal hingga akhir. Klik tiap langkah untuk melompat ke bagian konfigurasi terkait.
          </p>

          <div style={{ position: 'relative', paddingLeft: '30px' }}>
            {/* Timeline Line */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '12px', width: '2px', background: 'var(--border)', borderRadius: '2px' }}></div>

            {storySteps.map((step, idx) => (
              <div key={idx} style={{ position: 'relative', paddingBottom: idx === storySteps.length - 1 ? 0 : '2.5rem' }}>
                {/* Node Dot */}
                <div style={{ 
                  position: 'absolute', left: '-30px', top: 0, 
                  width: '28px', height: '28px', borderRadius: '50%', 
                  background: 'var(--bg-elevated)', border: `2px solid ${step.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: step.color, zIndex: 2
                }}>
                  {step.icon}
                </div>

                {/* Content Box */}
                <div 
                  className="card-hover"
                  onClick={() => setActiveTab(step.detailType)}
                  style={{ 
                    background: 'var(--badge-bg)', border: '1px solid var(--border)', 
                    borderRadius: 'var(--r-md)', padding: '1.25rem', cursor: 'pointer',
                    transition: 'all 0.2s', marginLeft: '1rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = step.color;
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {step.title}
                    <ChevronRight size={14} style={{ opacity: 0.5 }} />
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                    {/* Simple bold parser for markdown double asterisks */}
                    {step.description.split(/(\*\*.*?\*\*)/).map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
                      }
                      return part;
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderInterfaces = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Activity className="summary-card-icon" />
        <h2 className="section-title">Network Interfaces</h2>
      </div>
      <HelpPanel id="interfaces-list" onNavigate={setActiveTab} />
      
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Name</th>
              <th>Type</th>
              <th>IP Address</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {applyFilter(interfaces).length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Interfaces match search.</td></tr>
            ) : (
              applyFilter(interfaces).map((iface, idx) => (
              <tr key={idx}>
                <td>
                  {iface.active 
                    ? <span className="badge badge-success"><CheckCircle2 size={12} style={{marginRight: '4px'}}/> Active</span>
                    : <span className="badge badge-neutral"><AlertCircle size={12} style={{marginRight: '4px'}}/> Disabled</span>
                  }
                </td>
                <td style={{ fontWeight: 600 }}>{iface.name || iface.defaultName}</td>
                <td><span className="badge badge-info">{iface.type}</span></td>
                <td>{iface.ip || <span style={{color: 'var(--text-muted)'}}>-</span>}</td>
                <td style={{ color: 'var(--text-muted)' }}>{iface.comment || '-'}</td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInterfaceLists = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Activity className="summary-card-icon" />
        <h2 className="section-title">Interface Lists</h2>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Logical grouping of interfaces for simplified firewall and routing rules.
      </p>
      
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>List Name</th>
              <th>Member Interfaces</th>
            </tr>
          </thead>
          <tbody>
            {config.interfaceLists.length === 0 ? (
              <tr><td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Interface Lists configured.</td></tr>
            ) : (
              config.interfaceLists.map((list, idx) => {
                const members = config.interfaceListMembers.filter(m => m.list === list.name);
                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{list.name}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {members.length === 0 ? <span style={{color: 'var(--text-muted)'}}>No members</span> : members.map((m, i) => (
                           <span key={i} className="badge badge-info">{m.interface}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBridges = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Share2 className="summary-card-icon" />
        <h2 className="section-title">Network Bridges</h2>
      </div>
      <HelpPanel id="bridge-list" onNavigate={setActiveTab} />
      
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Name</th>
              <th>ARP</th>
              <th>STP / Protocol</th>
              <th>Member Ports</th>
            </tr>
          </thead>
          <tbody>
            {(!config.bridges || config.bridges.length === 0) ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Bridges configured.</td></tr>
            ) : (
              config.bridges.map((bridge, idx) => {
                const isActive = bridge.disabled !== 'yes';
                return (
                  <tr key={idx} style={{ opacity: isActive ? 1 : 0.6 }}>
                    <td>
                      {isActive 
                        ? <span className="badge badge-success"><CheckCircle2 size={12} style={{marginRight: '4px'}}/> Active</span>
                        : <span className="badge badge-neutral"><AlertCircle size={12} style={{marginRight: '4px'}}/> Disabled</span>
                      }
                    </td>
                    <td style={{ fontWeight: 600 }}>{bridge.name || bridge.defaultName}</td>
                    <td>{bridge.arp || 'Enabled'}</td>
                    <td>{bridge['protocol-mode'] || 'none'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {!bridge.ports || bridge.ports.length === 0 ? <span style={{color: 'var(--text-muted)'}}>-</span> : bridge.ports.map((port, i) => (
                           <span key={i} className="badge badge-info">{port}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBridgePorts = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Activity className="summary-card-icon" />
        <h2 className="section-title">Bridge Ports</h2>
      </div>
      <HelpPanel id="bridge-ports" onNavigate={setActiveTab} />
      
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Interface</th>
              <th>Bridge Name</th>
              <th>PVID / VLAN</th>
            </tr>
          </thead>
          <tbody>
            {(!config.bridgePorts || config.bridgePorts.length === 0) ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Bridge Ports configured.</td></tr>
            ) : (
              config.bridgePorts.map((bp, idx) => {
                const isActive = bp.disabled !== 'yes';
                return (
                  <tr key={idx} style={{ opacity: isActive ? 1 : 0.6 }}>
                    <td>
                      {isActive 
                        ? <span className="badge badge-success">Active</span>
                        : <span className="badge badge-neutral">Disabled</span>
                      }
                    </td>
                    <td style={{ fontWeight: 600 }}>{bp.interface}</td>
                    <td>{bp.bridge}</td>
                    <td>{bp.pvid || '1'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderIPAddresses = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Server className="summary-card-icon" />
        <h2 className="section-title">IP Addresses</h2>
      </div>
      <HelpPanel id="ip-addresses" onNavigate={setActiveTab} />

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Address</th>
              <th>Network</th>
              <th>Interface</th>
              <th>Services Attached</th>
            </tr>
          </thead>
          <tbody>
            {applyFilter(ipAddresses).length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No IP Addresses match search.</td></tr>
            ) : (
              applyFilter(ipAddresses).map((ip, idx) => {
                const hasDHCP = ip.interfaceObj?.dhcpServers?.length > 0;
                return (
                  <tr key={idx} style={{ opacity: ip.active ? 1 : 0.6 }}>
                    <td>
                      {ip.active 
                        ? <span className="badge badge-success"><CheckCircle2 size={12} style={{marginRight: '4px'}}/> Active</span>
                        : <span className="badge badge-neutral"><AlertCircle size={12} style={{marginRight: '4px'}}/> Disabled</span>
                      }
                    </td>
                    <td style={{ fontWeight: 600 }}>{ip.address}</td>
                    <td>{ip.network || '-'}</td>
                    <td>{ip.interface || '-'}</td>
                    <td>
                      {hasDHCP && <span className="badge badge-info" style={{marginRight: '4px'}}>DHCP Server</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDHCPServers = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Share2 className="summary-card-icon" />
        <h2 className="section-title">DHCP Servers</h2>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        DHCP servers automatically assign IP addresses to clients on specific interfaces.
      </p>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name / Status</th>
              <th>Interface</th>
              <th>Address Pool</th>
              <th>Network segment</th>
              <th>Gateway</th>
            </tr>
          </thead>
          <tbody>
            {dhcp.servers.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No DHCP Servers configured.</td></tr>
            ) : (
              dhcp.servers.map((server, idx) => (
                <tr key={idx} style={{ opacity: server.active ? 1 : 0.6 }}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{server.name}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                      {server.active 
                        ? <span className="badge badge-success">Running</span>
                        : <span className="badge badge-neutral">Stopped</span>}
                    </div>
                  </td>
                  <td>{server.interface || '-'}</td>
                  <td>
                    {server['address-pool'] || '-'}
                    {server.poolObj && <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px'}}>{server.poolObj.ranges}</div>}
                  </td>
                  <td>{server.networkObj?.address || '-'}</td>
                  <td>{server.networkObj?.gateway || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDHCPClients = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <DownloadCloud className="summary-card-icon" />
        <h2 className="section-title">DHCP Clients</h2>
      </div>
      <HelpPanel id="ip-dhcp-client" onNavigate={setActiveTab} />

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Interface</th>
              <th>Add Default Route</th>
              <th>Use Peer DNS/NTP</th>
            </tr>
          </thead>
          <tbody>
            {(!config.dhcp.clients || config.dhcp.clients.length === 0) ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No DHCP Clients configured.</td></tr>
            ) : (
              config.dhcp.clients.map((client, idx) => (
                <tr key={idx} style={{ opacity: client.disabled === 'yes' ? 0.6 : 1 }}>
                  <td>
                    {client.disabled !== 'yes' 
                        ? <span className="badge badge-success">Active</span>
                        : <span className="badge badge-neutral">Disabled</span>}
                  </td>
                  <td style={{ fontWeight: 600 }}>{client.interface}</td>
                  <td>{client['add-default-route'] || 'yes'}</td>
                  <td>
                    {client['use-peer-dns'] !== 'no' && <span className="badge badge-info" style={{marginRight: '4px'}}>DNS</span>}
                    {client['use-peer-ntp'] !== 'no' && <span className="badge badge-info">NTP</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDNS = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Globe className="summary-card-icon" />
        <h2 className="section-title">DNS Configuration</h2>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Upstream DNS servers and static local DNS entries.
      </p>

      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--accent-secondary)' }}>DNS Servers</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {config.dns.servers.length === 0 ? (
            <span style={{ color: 'var(--text-muted)' }}>No DNS servers set.</span>
          ) : (
            config.dns.servers.map((s, idx) => (
              <span key={idx} className="badge badge-info" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>{s}</span>
            ))
          )}
        </div>
      </div>

      <h3 style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }}>Static DNS Entries ({config.dns.static.length})</h3>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>TTL</th>
            </tr>
          </thead>
          <tbody>
            {config.dns.static.length === 0 ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No static DNS entries.</td></tr>
            ) : (
              config.dns.static.map((entry, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{entry.name}</td>
                  <td>{entry.address}</td>
                  <td>{entry.ttl || 'Default'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderIPRoutes = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Route className="summary-card-icon" />
        <h2 className="section-title">IP Routes</h2>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Routing table determining path selection for IP traffic.
      </p>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Destination</th>
              <th>Gateway</th>
              <th>Distance</th>
              <th>Notes / Comment</th>
            </tr>
          </thead>
          <tbody>
            {routes.length === 0 ? (
               <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No routes configured.</td></tr>
            ) : (
              routes.map((rt, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: rt['dst-address'] === '0.0.0.0/0' ? 'var(--status-info)' : 'inherit' }}>
                    {rt['dst-address'] || '0.0.0.0/0'}
                  </td>
                  <td>{rt.gateway || '-'}</td>
                  <td>{rt.distance || '1'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {rt.disabled === 'yes' && <span className="badge badge-neutral" style={{marginRight: '8px'}}>Disabled</span>}
                    {rt.comment || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderIPPools = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Activity className="summary-card-icon" />
        <h2 className="section-title">IP Pools</h2>
      </div>
      <HelpPanel id="ip-pool" onNavigate={setActiveTab} />

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pool Name</th>
              <th>Ranges</th>
              <th>Used By</th>
            </tr>
          </thead>
          <tbody>
            {(!config.pools || config.pools.length === 0) ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No IP pools configured.</td></tr>
            ) : (
              config.pools.map((pool, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{pool.name}</td>
                  <td>{pool.ranges || '-'}</td>
                  <td>
                    {pool.dhcpServer ? (
                      <span className="badge badge-success">DHCP: {pool.dhcpServer.name}</span>
                    ) : (
                      <span className="badge badge-neutral">Unlinked / VPN / Hotspot</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderIPCloud = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Cloud className="summary-card-icon" />
        <h2 className="section-title">MikroTik Cloud (DDNS)</h2>
      </div>
      <HelpPanel id="ip-cloud" onNavigate={setActiveTab} />
      
      <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          padding: '2rem', 
          borderRadius: 'var(--radius-md)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          border: '1px solid var(--border-color)'
      }}>
        <Cloud size={32} style={{ color: 'var(--status-info)' }}/>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>DDNS Status</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
             {config.cloud?.['ddns-enabled'] === 'yes' ? 'Enabled' : 'Disabled / Not Configured'}
          </div>
          {config.cloud?.['update-time'] === 'no' && (
             <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--status-warning)' }}>Time Update is turned OFF</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderHotspot = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Wifi className="summary-card-icon" />
        <h2 className="section-title">Hotspot Servers</h2>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Hotspot gateways providing authentication for network access.
      </p>
      
      <div className="data-table-container" style={{ marginBottom: '2rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name / Status</th>
              <th>Interface</th>
              <th>Address Pool</th>
              <th>Profile</th>
            </tr>
          </thead>
          <tbody>
            {config.hotspot.servers.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Hotspot Servers configured.</td></tr>
            ) : (
              config.hotspot.servers.map((server, idx) => (
                <tr key={idx} style={{ opacity: server.active ? 1 : 0.6 }}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{server.name}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                      {server.active 
                        ? <span className="badge badge-success">Running</span>
                        : <span className="badge badge-neutral">Disabled</span>}
                    </div>
                  </td>
                  <td>{server.interface || '-'}</td>
                  <td>
                    {server['address-pool'] || '-'}
                    {server.poolObj && <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px'}}>{server.poolObj.ranges}</div>}
                  </td>
                  <td>{server.profile || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginBottom: '1rem', color: 'var(--accent-secondary)' }}>User Profiles ({config.hotspot.userProfiles.length})</h3>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Profile Name</th>
              <th>Shared Users</th>
              <th>Address Pool</th>
              <th>Keepalive Timeout</th>
            </tr>
          </thead>
          <tbody>
            {config.hotspot.userProfiles.map((up, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600 }}>{up.name}</td>
                <td>{up['shared-users'] || '1'}</td>
                <td>
                  {up['address-pool'] || '-'}
                  {up.poolObj && <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px'}}>{up.poolObj.ranges}</div>}
                </td>
                <td>{up['keepalive-timeout'] || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 style={{ marginBottom: '1rem', color: 'var(--accent-secondary)' }}>Hotspot Users ({config.hotspot.users?.length || 0})</h3>
      <div className="data-table-container" style={{ marginBottom: '2rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Username</th>
              <th>Profile</th>
              <th>MAC Address</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {(!config.hotspot.users || config.hotspot.users.length === 0) ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Hotspot Users configured.</td></tr>
            ) : (
              config.hotspot.users.map((u, idx) => (
                <tr key={idx} style={{ opacity: u.disabled === 'yes' ? 0.6 : 1 }}>
                  <td>{u.disabled !== 'yes' ? <span className="badge badge-success">Active</span> : <span className="badge badge-neutral">Disabled</span>}</td>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td><span className="badge badge-info">{u.profile || 'default'}</span></td>
                  <td>{u['mac-address'] || 'Any'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.comment || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        <div>
           <h3 style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }}>IP Bindings (Bypass)</h3>
           <div className="data-table-container">
             <table className="data-table">
               <thead><tr><th>MAC</th><th>Address</th><th>Type</th></tr></thead>
               <tbody>
                 {(!config.hotspot.bindings || config.hotspot.bindings.length === 0) ? (
                   <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>None</td></tr>
                 ) : (
                   config.hotspot.bindings.map((b, idx) => (
                     <tr key={idx} style={{ opacity: b.disabled === 'yes'? 0.6 : 1 }}>
                       <td>{b['mac-address'] || '-'}</td>
                       <td>{b.address || '-'}</td>
                       <td><span className={`badge ${b.type === 'bypassed' ? 'badge-success' : 'badge-neutral'}`}>{b.type || 'regular'}</span></td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
        </div>

        <div>
           <h3 style={{ marginBottom: '1rem', color: 'var(--status-info)' }}>Walled Garden</h3>
           <div className="data-table-container">
             <table className="data-table">
               <thead><tr><th>Action</th><th>Dst Host / IP</th></tr></thead>
               <tbody>
                 {(!config.hotspot.walledGarden && !config.hotspot.walledGardenIp) ? (
                   <tr><td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>None</td></tr>
                 ) : (
                   <>
                     {config.hotspot.walledGarden?.map((wg, idx) => (
                       <tr key={`wg-${idx}`}>
                         <td><span className={`badge ${wg.action === 'allow' ? 'badge-success' : 'badge-error'}`}>{wg.action}</span></td>
                         <td>{wg['dst-host']}</td>
                       </tr>
                     ))}
                     {config.hotspot.walledGardenIp?.map((wgip, idx) => (
                       <tr key={`wgip-${idx}`}>
                         <td><span className={`badge ${wgip.action === 'accept' ? 'badge-success' : 'badge-error'}`}>{wgip.action}</span> <span style={{fontSize:'0.75rem', color: 'var(--text-muted)'}}>[IP]</span></td>
                         <td>{wgip['dst-address'] || wgip['src-address'] || 'Any'}</td>
                       </tr>
                     ))}
                   </>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );

  const renderRoutingTables = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Route className="summary-card-icon" />
        <h2 className="section-title">Routing Tables (FIB)</h2>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Forwarding Information Bases for policy routing.
      </p>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Table Name</th>
              <th>FIB Enabled</th>
            </tr>
          </thead>
          <tbody>
            {config.routingTables.length === 0 ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Routing Tables configured.</td></tr>
            ) : (
              config.routingTables.map((rt, idx) => (
                <tr key={idx} style={{ opacity: rt.disabled === 'yes' ? 0.6 : 1 }}>
                  <td>
                    {rt.disabled !== 'yes' 
                        ? <span className="badge badge-success">Active</span>
                        : <span className="badge badge-neutral">Disabled</span>}
                  </td>
                  <td style={{ fontWeight: 600 }}>{rt.name}</td>
                  <td>{rt.fib !== undefined ? 'Yes' : 'No'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFirewallFilter = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Shield className="summary-card-icon" />
        <h2 className="section-title">Firewall Filter Rules</h2>
      </div>
      <HelpPanel id="firewall-filter" onNavigate={setActiveTab} />
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Filter rules determine whether traffic is allowed or dropped based on various conditions.
      </p>
      
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Chain</th>
              <th>Protocol / Port</th>
              <th>Src Address</th>
              <th>Dst Address</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {applyFilter(firewall.filter).length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Filter rules match search.</td></tr>
            ) : (
              applyFilter(firewall.filter).map((rule, idx) => (
                <tr key={idx} style={{ opacity: rule.disabled === 'yes' ? 0.6 : 1 }}>
                  <td>
                    <span className={`badge ${rule.action === 'accept' ? 'badge-success' : rule.action === 'drop' ? 'badge-error' : 'badge-neutral'}`}>
                      {rule.action || 'accept'}
                    </span>
                  </td>
                  <td>{rule.chain}</td>
                  <td>{rule.protocol && rule['dst-port'] ? `${rule.protocol}:${rule['dst-port']}` : 'Any'}</td>
                  <td>{rule['src-address'] || 'Any'}</td>
                  <td>{rule['dst-address'] || 'Any'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{rule.comment || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFirewallNAT = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Share2 className="summary-card-icon" />
        <h2 className="section-title">Firewall NAT Rules</h2>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Network Address Translation modifies IP addresses of passing packets.
      </p>
      
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Chain</th>
              <th>Protocol / Port</th>
              <th>To Addresses</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {applyFilter(firewall.nat).length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No NAT rules match search.</td></tr>
            ) : (
              applyFilter(firewall.nat).map((rule, idx) => (
                <tr key={idx} style={{ opacity: rule.disabled === 'yes' ? 0.6 : 1 }}>
                  <td>
                    <span className={`badge ${rule.action === 'masquerade' ? 'badge-info' : 'badge-warning'}`}>
                      {rule.action}
                    </span>
                  </td>
                  <td>{rule.chain}</td>
                  <td>{rule.protocol && rule['dst-port'] ? `${rule.protocol}:${rule['dst-port']}` : 'Any'}</td>
                  <td>{rule['to-addresses'] || '-'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{rule.comment || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFirewallMangle = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Cpu className="summary-card-icon" />
        <h2 className="section-title">Firewall Mangle Rules</h2>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Mangle rules mark packets for future processing by routing marks or QoS.
      </p>
      
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Chain</th>
              <th>Protocol</th>
              <th>New Mark</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {(!firewall.mangle || applyFilter(firewall.mangle).length === 0) ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Mangle rules match search.</td></tr>
            ) : (
              applyFilter(firewall.mangle).map((rule, idx) => (
                <tr key={idx} style={{ opacity: rule.disabled === 'yes' ? 0.6 : 1 }}>
                  <td><span className="badge badge-info">{rule.action}</span></td>
                  <td>{rule.chain}</td>
                  <td>{rule.protocol || 'Any'}</td>
                  <td>{rule['new-connection-mark'] || rule['new-routing-mark'] || rule['new-packet-mark'] || '-'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{rule.comment || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFirewallRaw = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <AlertCircle className="summary-card-icon" />
        <h2 className="section-title">Firewall Raw Rules</h2>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Raw rules can selectively bypass connection tracking to increase routing performance.
      </p>
      
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Chain</th>
              <th>Protocol / Port</th>
              <th>Target Address</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {(!firewall.raw || applyFilter(firewall.raw).length === 0) ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Raw rules match search.</td></tr>
            ) : (
              applyFilter(firewall.raw).map((rule, idx) => (
                <tr key={idx} style={{ opacity: rule.disabled === 'yes' ? 0.6 : 1 }}>
                  <td>
                    <span className={`badge ${rule.action === 'drop' ? 'badge-error' : 'badge-neutral'}`}>
                      {rule.action}
                    </span>
                  </td>
                  <td>{rule.chain}</td>
                  <td>{rule.protocol && rule['dst-port'] ? `${rule.protocol}:${rule['dst-port']}` : 'Any'}</td>
                  <td>{rule['src-address'] || rule['dst-address'] || 'Any'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{rule.comment || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFirewallAddressLists = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Shield className="summary-card-icon" />
        <h2 className="section-title">Firewall Address Lists</h2>
      </div>
      <HelpPanel id="firewall-address-lists" onNavigate={setActiveTab} />
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Groupings of IP addresses used in firewall filter, NAT, and mangle rules.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        {config.firewall.groupedAddressLists.length === 0 ? (
           <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No Address Lists configured.</div>
        ) : (
          config.firewall.groupedAddressLists.map((group, idx) => (
            <details key={idx} style={{ 
              background: 'rgba(255, 255, 255, 0.02)', 
              padding: '1rem', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <summary style={{ 
                fontWeight: 600, 
                cursor: 'pointer', 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{group.name}</span>
                <span className="badge badge-info">{group.count} Entries</span>
              </summary>
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                background: 'rgba(0,0,0,0.2)', 
                borderRadius: 'var(--radius-sm)',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                <table className="data-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: 'monospace' }}>{item.address}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{item.comment || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );

  const renderQueueTree = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <DownloadCloud className="summary-card-icon" />
        <h2 className="section-title">Queue Tree</h2>
      </div>
      <HelpPanel id="queues-tree" onNavigate={setActiveTab} />
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Hierarchical bandwidth management using Packet Marks.
      </p>

      <div className="data-table-container" style={{ marginBottom: '2rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Name</th>
              <th>Parent</th>
              <th>Packet Mark</th>
              <th>Limit At</th>
              <th>Max Limit</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            {config.queues.trees.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Queue Trees configured.</td></tr>
            ) : (
              config.queues.trees.map((qt, idx) => (
                <tr key={idx} style={{ opacity: qt.disabled === 'yes' ? 0.6 : 1 }}>
                   <td>
                    {qt.disabled !== 'yes' 
                        ? <span className="badge badge-success">Active</span>
                        : <span className="badge badge-neutral">Disabled</span>}
                  </td>
                  <td style={{ fontWeight: 600 }}>{qt.name}</td>
                  <td>{qt.parent || '-'}</td>
                  <td>{qt['packet-mark'] ? <span className="badge badge-info">{qt['packet-mark']}</span> : 'Any'}</td>
                  <td>{qt['limit-at'] || '-'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--status-warning)' }}>{qt['max-limit'] || '-'}</td>
                  <td>{qt.priority || '8'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderQueueTypes = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Cpu className="summary-card-icon" />
        <h2 className="section-title">Queue Types</h2>
      </div>
      <HelpPanel id="queues-types" onNavigate={setActiveTab} />
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Custom queueing disciplines (PCQ, SFQ, RED) used by limits.
      </p>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Kind</th>
              <th>Classifier (PCQ)</th>
              <th>Limit (PCQ)</th>
            </tr>
          </thead>
          <tbody>
            {config.queues.types.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Queue Types configured.</td></tr>
            ) : (
              config.queues.types.map((qt, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{qt.name}</td>
                  <td><span className="badge badge-info">{qt.kind}</span></td>
                  <td>{qt['pcq-classifier'] || '-'}</td>
                  <td>{qt['pcq-limit'] || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderVPN = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Lock className="summary-card-icon" />
        <h2 className="section-title">Virtual Private Networks</h2>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Overview of configured VPN interfaces (WireGuard, OpenVPN, L2TP).
      </p>

      <h3 style={{ marginBottom: '1rem', color: 'var(--accent-secondary)' }}>WireGuard Tunnels ({vpn.wireguard.length})</h3>
      <div className="data-table-container" style={{ marginBottom: '2rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Interface / Name</th>
              <th>Listen Port</th>
              <th>MTU</th>
            </tr>
          </thead>
          <tbody>
            {vpn.wireguard.map((wg, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600 }}>{wg.name}</td>
                <td>{wg['listen-port']}</td>
                <td>{wg.mtu}</td>
              </tr>
            ))}
            {vpn.wireguard.length === 0 && (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No WireGuard connections found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }}>OpenVPN / L2TP ({vpn.ovpn.length + vpn.l2tp.length})</h3>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>User / Profile</th>
            </tr>
          </thead>
          <tbody>
            {[...vpn.ovpn.map(v => ({...v, _type: 'OpenVPN'})), ...vpn.l2tp.map(v => ({...v, _type: 'L2TP'}))].map((conn, idx) => (
              <tr key={idx} style={{ opacity: conn.disabled === 'yes' ? 0.6 : 1 }}>
                <td><span className="badge badge-info">{conn._type}</span></td>
                <td style={{ fontWeight: 600 }}>{conn.name}</td>
                <td>{conn.user || conn.profile || '-'}</td>
              </tr>
            ))}
            {(vpn.ovpn.length + vpn.l2tp.length) === 0 && (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No legacy VPN connections found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginBottom: '1rem', color: 'var(--status-info)' }}>WireGuard Peers ({vpn.wireguardPeers?.length || 0})</h3>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Interface</th>
              <th>Public Key</th>
              <th>Allowed Address</th>
              <th>Endpoint</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {(!vpn.wireguardPeers || vpn.wireguardPeers.length === 0) ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No WireGuard peers configured.</td></tr>
            ) : (
              vpn.wireguardPeers.map((peer, idx) => (
                <tr key={idx} style={{ opacity: peer.disabled === 'yes' ? 0.6 : 1 }}>
                  <td>{peer.disabled !== 'yes' ? <span className="badge badge-success">Active</span> : <span className="badge badge-neutral">Disabled</span>}</td>
                  <td style={{ fontWeight: 600 }}>{peer.interface}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{peer['public-key']}</td>
                  <td>{peer['allowed-address'] || 'Any'}</td>
                  <td>{peer['endpoint-address'] ? `${peer['endpoint-address']}:${peer['endpoint-port']||''}` : 'Dynamic'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{peer.comment || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderToolsGraphing = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <BarChart2 className="summary-card-icon" />
        <h2 className="section-title">Interface Graphing</h2>
      </div>
      <HelpPanel id="tools-graphing" onNavigate={setActiveTab} />

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Interface</th>
              <th>Allow Address</th>
              <th>Store on Disk</th>
            </tr>
          </thead>
          <tbody>
            {(!config.tools || !config.tools.graphingInterfaces || config.tools.graphingInterfaces.length === 0) ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Interface Graphing configured.</td></tr>
            ) : (
              config.tools.graphingInterfaces.map((g, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{g.interface}</td>
                  <td>{g['allow-address'] || 'Any'}</td>
                  <td>{g['store-on-disk'] === 'no' ? 'No' : 'Yes'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderIPServices = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Monitor className="summary-card-icon" />
        <h2 className="section-title">IP Services</h2>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Configured management services like Winbox, SSH, API, Web.
      </p>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Service Name</th>
              <th>Port</th>
              <th>Address Mask</th>
            </tr>
          </thead>
          <tbody>
            {config.services.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Services specified in config.</td></tr>
            ) : (
              config.services.map((svc, idx) => (
                <tr key={idx} style={{ opacity: svc.disabled === 'yes' ? 0.6 : 1 }}>
                  <td>
                    {svc.disabled !== 'yes' 
                        ? <span className="badge badge-success">Active</span>
                        : <span className="badge badge-neutral">Disabled</span>}
                  </td>
                  <td style={{ fontWeight: 600 }}>{svc.name}</td>
                  <td>{svc.port || '-'}</td>
                  <td>{svc.address || 'Any'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSystemIdentity = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Settings className="summary-card-icon" />
        <h2 className="section-title">System Identity</h2>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        The hostname of this specific network device.
      </p>
      
      <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          padding: '2rem', 
          borderRadius: 'var(--radius-md)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem' 
      }}>
        <Server size={32} style={{ color: 'var(--accent-primary)' }}/>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Router Name</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{metadata.identity || 'MikroTik'}</div>
        </div>
      </div>
    </div>
  );

  const renderSystemClock = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Clock className="summary-card-icon" />
        <h2 className="section-title">System Clock</h2>
      </div>
      <HelpPanel id="system-clock" onNavigate={setActiveTab} />
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Timezone and NTP configuration parameters.
      </p>
      <div className="data-table-container">
        <table className="data-table">
          <tbody>
            <tr>
              <td style={{ width: '200px', fontWeight: 600, color: 'var(--text-muted)' }}>Time Zone Name</td>
              <td>{config.system.clock['time-zone-name'] || 'Auto'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Time Zone Autodetect</td>
              <td>{config.system.clock['time-zone-autodetect'] === 'no' ? 'Off' : 'On'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSystemLogging = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Terminal className="summary-card-icon" />
        <h2 className="section-title">Logging Actions</h2>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Destinations for system log events.
      </p>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID/Action</th>
              <th>Disk File Name</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            {config.system.logging.length === 0 ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No specific logging actions defined.</td></tr>
            ) : (
              config.system.logging.map((log, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>Action {idx + 1}</td>
                  <td>{log['disk-file-name'] || '-'}</td>
                  <td>{log.target || 'disk'}</td>
                </tr>
              ))
            )}
           </tbody>
        </table>
      </div>
    </div>
  );

  const renderSNMP = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Activity className="summary-card-icon" />
        <h2 className="section-title">SNMP Configuration</h2>
      </div>
      
      <div style={{ 
          background: 'rgba(255, 255, 255, 0.02)', 
          padding: '2rem', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--border-color)' 
      }}>
        <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
          SNMP State
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
           {config.snmp?.enabled === 'yes' ? <span className="badge badge-success">Enabled</span> : <span className="badge badge-neutral">Disabled (or missing value)</span>}
        </div>
        {config.snmp?.contact && (
          <div style={{ marginTop: '1rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Contact: </span>
            {config.snmp.contact}
          </div>
        )}
      </div>
    </div>
  );

  const renderPorts = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Key className="summary-card-icon" />
        <h2 className="section-title">Serial / Hardware Ports</h2>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Baud Rate</th>
            </tr>
          </thead>
          <tbody>
            {config.ports.length === 0 ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Ports configured.</td></tr>
            ) : (
              config.ports.map((p, idx) => (
                <tr key={idx}>
                  <td>{p[0] || p.id || idx}</td>
                  <td style={{ fontWeight: 600 }}>{p.name || `serial${idx}`}</td>
                  <td>{p['baud-rate'] || 'auto'}</td>
                </tr>
              ))
            )}
           </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="dashboard-layout">
      {renderSidebar()}
      
      <div className="main-view">
        <SectionErrorBoundary>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'mindmap' && <MindMap config={config} onNavigate={setActiveTab} />}
        {activeTab === 'osi-tcp' && <OsiTcpView config={config} onNavigate={setActiveTab} />}
        {activeTab === 'interfaces-list' && renderInterfaces()}
        {activeTab === 'interfaces-lists' && renderInterfaceLists()}
        
        {/* Bridge Menus */}
        {activeTab === 'bridge-list' && renderBridges()}
        {activeTab === 'bridge-ports' && renderBridgePorts()}

        {/* Fallback for interfaces parent click if submenus logic routes there */}
        {activeTab === 'interfaces' && renderInterfaces()}
        
        {/* IP Menus */}
        {activeTab === 'ip-addresses' && renderIPAddresses()}
        {activeTab === 'ip-dhcp-server' && renderDHCPServers()}
        {activeTab === 'ip-dhcp-client' && renderDHCPClients()}
        {activeTab === 'ip-dns' && renderDNS()}
        {activeTab === 'ip-routes' && renderIPRoutes()}
        {activeTab === 'ip-pool' && renderIPPools()}
        {activeTab === 'ip-cloud' && renderIPCloud()}
        {activeTab === 'ip-hotspot' && renderHotspot()}
        {activeTab === 'ip-services' && renderIPServices()}

        {/* System Menus */}
        {activeTab === 'system-identity' && renderSystemIdentity()}
        {activeTab === 'system-clock' && renderSystemClock()}
        {activeTab === 'system-logging' && renderSystemLogging()}
        {activeTab === 'system-snmp' && renderSNMP()}
        {activeTab === 'system-ports' && renderPorts()}

        {/* Routing Menus */}
        {activeTab === 'routing-tables' && renderRoutingTables()}

        {/* Firewall Menus */}
        {activeTab === 'firewall-filter' && renderFirewallFilter()}
        {activeTab === 'firewall-nat' && renderFirewallNAT()}
        {activeTab === 'firewall-mangle' && renderFirewallMangle()}
        {activeTab === 'firewall-raw' && renderFirewallRaw()}
        {activeTab === 'firewall-address-lists' && renderFirewallAddressLists()}
        
        {/* Queues */}
        {activeTab === 'queues-tree' && renderQueueTree()}
        {activeTab === 'queues-types' && renderQueueTypes()}
        
        {/* Tools Menu */}
        {activeTab === 'tools-graphing' && renderToolsGraphing()}

        {/* VPN */}
        {activeTab === 'vpn' && renderVPN()}
        </SectionErrorBoundary>
      </div>
    </div>
  );
};
