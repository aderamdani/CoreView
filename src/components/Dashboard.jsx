import React, { useState } from 'react';
import { 
  Server, Activity, Shield, Wifi, Share2, Route, DownloadCloud, 
  Lock, Globe, Cpu, AlertCircle, CheckCircle2, ChevronDown, ChevronRight, ChevronLeft,
  Settings, Clock, Terminal, Monitor, Key, Cloud, Search, BarChart2, HelpCircle, Tag, ArrowLeft, ArrowRight, Layers, FileText
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
          { id: 'bridge-ports', label: 'Ports' },
          { id: 'bridge-vlans', label: 'VLANs' }
        ]
      },
      { 
        id: 'wireless', 
        label: 'Wireless', 
        icon: <Wifi size={15} />,
        submenus: [
          { id: 'wireless-interfaces', label: 'Interfaces' },
          { id: 'wireless-security', label: 'Security Profiles' },
          { id: 'wireless-access-list', label: 'Access List' },
          { id: 'wireless-connect-list', label: 'Connect List' }
        ]
      },
      { 
        id: 'ppp', 
        label: 'PPP', 
        icon: <Lock size={15} />,
        submenus: [
          { id: 'ppp-profiles', label: 'Profiles' },
          { id: 'ppp-secrets', label: 'Secrets' },
          { id: 'ppp-active', label: 'Active Connections' }
        ]
      },
      { 
        id: 'ip', 
        label: 'IP', 
        icon: <Globe size={15} />,
        submenus: [
          { id: 'ip-addresses', label: 'Addresses' },
          { id: 'ip-routes', label: 'Routes' },
          { id: 'ip-pools', label: 'Pools' },
          { id: 'ip-dhcp-server', label: 'DHCP Server' },
          { id: 'ip-dhcp-client', label: 'DHCP Client' },
          { id: 'ip-dhcp-relay', label: 'DHCP Relay' },
          { id: 'ip-dns', label: 'DNS' },
          { id: 'ip-cloud', label: 'Cloud' },
          { id: 'ip-hotspot', label: 'Hotspot' },
          { id: 'ip-upnp', label: 'UPnP' },
          { id: 'ip-services', label: 'Services' },
          { id: 'ip-socks', label: 'SOCKS' },
          { id: 'ip-proxy', label: 'Proxy' },
          { id: 'ip-traffic-flow', label: 'Traffic Flow' },
          { id: 'ip-accounting', label: 'Accounting' }
        ]
      },
      { 
        id: 'routing', 
        label: 'Routing', 
        icon: <Route size={15} />,
        submenus: [
          { id: 'routing-tables', label: 'Tables' },
          { id: 'routing-rules', label: 'Rules' },
          { id: 'routing-filters', label: 'Filters' },
          { id: 'routing-ospf', label: 'OSPF' },
          { id: 'routing-rip', label: 'RIP' },
          { id: 'routing-bgp', label: 'BGP' },
          { id: 'routing-mpls', label: 'MPLS' },
          { id: 'routing-vrf', label: 'VRF' }
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
          { id: 'firewall-address-lists', label: 'Address Lists' },
          { id: 'firewall-layer7', label: 'Layer7 Protocols' }
        ]
      },
      { 
        id: 'queues', 
        label: 'Queues', 
        icon: <DownloadCloud size={15} />,
        submenus: [
          { id: 'queues-tree', label: 'Queue Tree' },
          { id: 'queues-simple', label: 'Simple Queues' },
          { id: 'queues-types', label: 'Queue Types' },
          { id: 'queues-interfaces', label: 'Interface Queues' }
        ]
      },
      { 
        id: 'system', 
        label: 'System', 
        icon: <Settings size={15} />,
        submenus: [
          { id: 'system-identity', label: 'Identity' },
          { id: 'system-clock', label: 'Clock' },
          { id: 'system-ntp-client', label: 'NTP Client' },
          { id: 'system-ntp-server', label: 'NTP Server' },
          { id: 'system-logging', label: 'Logging' },
          { id: 'system-log', label: 'Log' },
          { id: 'system-history', label: 'History' },
          { id: 'system-users', label: 'Users' },
          { id: 'system-groups', label: 'Groups' },
          { id: 'system-passwords', label: 'Passwords' },
          { id: 'system-ssh', label: 'SSH' },
          { id: 'system-telnet', label: 'Telnet' },
          { id: 'system-www', label: 'WebFig' },
          { id: 'system-api', label: 'API' },
          { id: 'system-ftp', label: 'FTP' },
          { id: 'system-snmp', label: 'SNMP' },
          { id: 'system-ports', label: 'Ports' },
          { id: 'system-packages', label: 'Packages' },
          { id: 'system-resources', label: 'Resources' },
          { id: 'system-routerboard', label: 'RouterBoard' },
          { id: 'system-health', label: 'Health' },
          { id: 'system-leds', label: 'LEDs' },
          { id: 'system-watchdog', label: 'Watchdog' },
          { id: 'system-scheduler', label: 'Scheduler' },
          { id: 'system-scripts', label: 'Scripts' },
          { id: 'system-backup', label: 'Backup' },
          { id: 'system-reset', label: 'Reset Configuration' }
        ]
      },
      { 
        id: 'tools', 
        label: 'Tools', 
        icon: <BarChart2 size={15} />,
        submenus: [
          { id: 'tools-ping', label: 'Ping' },
          { id: 'tools-traceroute', label: 'Traceroute' },
          { id: 'tools-bandwidth-test', label: 'Bandwidth Test' },
          { id: 'tools-torch', label: 'Torch' },
          { id: 'tools-packet-sniffer', label: 'Packet Sniffer' },
          { id: 'tools-profile', label: 'Profile' },
          { id: 'tools-netwatch', label: 'Netwatch' },
          { id: 'tools-sms', label: 'SMS' },
          { id: 'tools-email', label: 'Email' },
          { id: 'tools-graphing', label: 'Graphing' },
          { id: 'tools-romon', label: 'RoMON' },
          { id: 'tools-mac-server', label: 'MAC Server' },
          { id: 'tools-mac-winbox', label: 'MAC Winbox' },
          { id: 'tools-winbox', label: 'Winbox Settings' }
        ]
      },
      { 
        id: 'files', 
        label: 'Files', 
        icon: <FileText size={15} />,
        submenus: [
          { id: 'files-list', label: 'File List' },
          { id: 'files-backup', label: 'Backup' }
        ]
      },
      { 
        id: 'user-manager', 
        label: 'User Manager', 
        icon: <Key size={15} />,
        submenus: [
          { id: 'user-manager-users', label: 'Users' },
          { id: 'user-manager-profiles', label: 'Profiles' },
          { id: 'user-manager-sessions', label: 'Active Sessions' }
        ]
      },
      { 
        id: 'capsman', 
        label: 'CAPsMAN', 
        icon: <Wifi size={15} />,
        submenus: [
          { id: 'capsman-interfaces', label: 'Interfaces' },
          { id: 'capsman-provisioning', label: 'Provisioning' },
          { id: 'capsman-access-list', label: 'Access List' },
          { id: 'capsman-configuration', label: 'Configuration' }
        ]
      },
      { 
        id: 'lte', 
        label: 'LTE', 
        icon: <Globe size={15} />,
        submenus: [
          { id: 'lte-interfaces', label: 'Interfaces' },
          { id: 'lte-apn', label: 'APN Profiles' },
          { id: 'lte-info', label: 'LTE Info' }
        ]
      },
      { 
        id: 'gps', 
        label: 'GPS', 
        icon: <Globe size={15} />,
        submenus: [
          { id: 'gps-settings', label: 'GPS Settings' },
          { id: 'gps-monitor', label: 'GPS Monitor' }
        ]
      },
      { id: 'neighbors', label: 'Neighbors', icon: <Share2 size={15} /> },
      { id: 'log', label: 'Log', icon: <Terminal size={15} /> },
      { id: 'skin', label: 'Skin', icon: <Monitor size={15} /> }
    ];

    return (
      <aside className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Sidebar Header with Collapse Toggle */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            {sidebarCollapsed ? 'CV' : (config?.system?.identity?.name || config?.metadata?.identity || 'CoreView')}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
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
                  title={sidebarCollapsed ? menu.label : ''}
                >
                  <div className="sidebar-item-content">
                    {menu.icon}
                    {!sidebarCollapsed && <span>{menu.label}</span>}
                  </div>
                  {hasSubmenus && !sidebarCollapsed && (
                    <ChevronRight
                      size={13}
                      className={`sidebar-chevron ${isMenuExpanded ? 'open' : ''}`}
                    />
                  )}
                </div>

                {hasSubmenus && isMenuExpanded && !sidebarCollapsed && (
                  <div className="sidebar-submenus">
                    {menu.submenus.map(sub => (
                      <div 
                        key={sub.id}
                        className={`sidebar-subitem ${activeTab === sub.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(sub.id)}
                        title={sub.label}
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
    // Interactive Config Story Logic - Detailed Step by Step
    const storySteps = [];
    
    // Step 1: System Identity & Basic Setup
    const identity = config?.system?.identity?.name || metadata.identity || 'MikroTik';
    let usersCount = 0;
    if (config?.user) usersCount = config.user.length;
    const systemClock = config?.system?.clock;
    const systemLogging = config?.system?.logging;
    
    storySteps.push({
      id: 'step-system',
      icon: <Server size={18} />,
      title: '1. Sistem & Identitas Perangkat',
      color: 'var(--blue)',
      description: `**Router Identity:** ${identity} - Nama unik perangkat ini di jaringan.\n\n**User Management:** ${usersCount > 0 ? `${usersCount} user terdaftar` : 'Belum ada user tambahan dikonfigurasi'}.\n\n**System Clock:** ${systemClock ? `Timezone ${systemClock.timeZone || 'default'}` : 'Menggunakan waktu default sistem'}.\n\n**System Logging:** ${systemLogging ? `${systemLogging.length} aturan logging aktif` : 'Logging sistem belum dikonfigurasi'}.`,
      detailType: 'system-identity',
      expandedInfo: {
        identity: 'Nama perangkat yang muncul di Winbox/WebFig dan digunakan untuk identifikasi jaringan',
        users: 'Akun login untuk mengakses router via berbagai metode (SSH, Telnet, WebFig, dll)',
        clock: 'Konfigurasi waktu dan timezone untuk logging dan scheduling yang akurat',
        logging: 'Sistem pencatatan aktivitas router untuk troubleshooting dan monitoring'
      }
    });

    // Step 2: Network Interfaces Configuration
    const activeIfaces = interfaces.filter(i => i.active).length;
    const totalIfaces = interfaces.length;
    const bridges = config?.interface?.bridge?.length || 0;
    const interfaceLists = config?.interface?.['interface-list']?.length || 0;
    
    storySteps.push({
      id: 'step-interfaces',
      icon: <Activity size={18} />,
      title: '2. Konfigurasi Antarmuka Jaringan',
      color: 'var(--green)',
      description: `**Interface Status:** ${activeIfaces}/${totalIfaces} interface aktif dari total ${totalIfaces} interface.\n\n**Bridge Configuration:** ${bridges > 0 ? `${bridges} bridge interface untuk menggabungkan port` : 'Belum ada bridge yang dikonfigurasi'}.\n\n**Interface Lists:** ${interfaceLists > 0 ? `${interfaceLists} grup interface untuk keperluan firewall dan routing` : 'Belum ada interface list yang dikonfigurasi'}.`,
      detailType: 'interfaces-list',
      expandedInfo: {
        physical: 'Interface fisik seperti ether1, ether2, wlan1 untuk koneksi hardware',
        virtual: 'Interface virtual seperti VLAN, Bridge, PPP untuk segmentasi jaringan',
        bridge: 'Menggabungkan multiple interface menjadi satu broadcast domain',
        lists: 'Pengelompokan interface untuk aturan firewall dan routing yang lebih efisien'
      }
    });

    // Step 3: IP Addressing & DHCP Services
    const staticIps = ipAddresses.length;
    const dhcpServers = config?.ip?.['dhcp-server']?.length || 0;
    const dhcpClients = config?.ip?.['dhcp-client']?.length || 0;
    const dnsServers = config?.ip?.dns?.servers?.length || 0;
    const ipPools = config?.ip?.pool?.length || 0;
    
    storySteps.push({
      id: 'step-ip-services',
      icon: <Globe size={18} />,
      title: '3. Layanan IP & DHCP',
      color: 'var(--yellow)',
      description: `**IP Addresses:** ${staticIps} konfigurasi IP statis pada interface.\n\n**DHCP Server:** ${dhcpServers > 0 ? `${dhcpServers} server DHCP aktif untuk pembagian IP otomatis` : 'Belum ada DHCP server yang dikonfigurasi'}.\n\n**DHCP Client:** ${dhcpClients > 0 ? `${dhcpClients} client DHCP untuk mendapatkan IP dari upstream` : 'Tidak beroperasi sebagai DHCP client'}.\n\n**DNS Configuration:** ${dnsServers > 0 ? `${dnsServers} server DNS untuk resolusi nama domain` : 'Menggunakan DNS default sistem'}.\n\n**IP Pools:** ${ipPools > 0 ? `${ipPools} pool IP untuk DHCP dan PPP` : 'Belum ada IP pool yang dikonfigurasi'}.`,
      detailType: 'ip-addresses',
      expandedInfo: {
        static: 'IP address tetap yang tidak berubah untuk server dan perangkat penting',
        dhcpServer: 'Layanan pembagian IP otomatis kepada client di jaringan lokal',
        dhcpClient: 'Mengambil IP address otomatis dari provider internet',
        dns: 'Domain Name System untuk mengubah nama domain menjadi IP address',
        pools: 'Koleksi IP address yang dapat digunakan oleh DHCP atau koneksi PPP'
      }
    });

    // Step 4: Routing & Internet Access
    const totalRoutes = routes.length;
    const defaultRoutes = routes.filter(r => r.dstAddress === '0.0.0.0/0' || !r.dstAddress).length;
    const staticRoutes = routes.filter(r => r.static === 'yes').length;
    const dynamicRoutes = totalRoutes - staticRoutes;
    const hasMasquerade = (config?.ip?.firewall?.nat || []).some(r => r.action === 'masquerade');
    const routingTables = config?.routing?.table?.length || 0;
    
    storySteps.push({
      id: 'step-routing',
      icon: <Route size={18} />,
      title: '4. Routing & Akses Internet',
      color: 'var(--accent)',
      description: `**Total Routes:** ${totalRoutes} rute dalam tabel routing (${staticRoutes} statis, ${dynamicRoutes} dinamis).\n\n**Default Routes:** ${defaultRoutes} rute default (0.0.0.0/0) untuk akses internet.\n\n**NAT Configuration:** ${hasMasquerade ? 'Masquerade rule aktif untuk sharing internet' : 'Belum ada aturan NAT untuk internet sharing'}.\n\n**Routing Tables:** ${routingTables > 0 ? `${routingTables} tabel routing tambahan` : 'Menggunakan tabel routing default'}.`,
      detailType: 'routing-tables',
      expandedInfo: {
        static: 'Rute tetap yang dikonfigurasi manual untuk jaringan tertentu',
        dynamic: 'Rute yang dipelajari otomatis dari protokol routing (OSPF, RIP, BGP)',
        default: 'Rute fallback untuk traffic yang tidak cocok dengan rute spesifik',
        nat: 'Network Address Translation untuk mengubah IP private ke public',
        tables: 'Multiple routing table untuk policy-based routing'
      }
    });

    // Step 5: Firewall & Security
    const filterRules = (config?.ip?.firewall?.filter || []).length;
    const natRules = (config?.ip?.firewall?.nat || []).length;
    const mangleRules = (config?.ip?.firewall?.mangle || []).length;
    const rawRules = (config?.ip?.firewall?.raw || []).length;
    const addressLists = (config?.ip?.firewall?.['address-list'] || []).length;
    
    storySteps.push({
      id: 'step-firewall',
      icon: <Shield size={18} />,
      title: '5. Firewall & Keamanan Jaringan',
      color: 'var(--red)',
      description: `**Filter Rules:** ${filterRules} aturan filter untuk kontrol traffic masuk/keluar.\n\n**NAT Rules:** ${natRules} aturan NAT untuk port forwarding dan masquerade.\n\n**Mangle Rules:** ${mangleRules} aturan mangle untuk modifikasi packet.\n\n**Raw Rules:** ${rawRules} aturan raw untuk performance dan filtering awal.\n\n**Address Lists:** ${addressLists} daftar alamat IP untuk kebijakan keamanan.`,
      detailType: 'firewall-filter',
      expandedInfo: {
        filter: 'Aturan utama untuk allow/deny traffic berdasarkan kriteria tertentu',
        nat: 'Network Address Translation untuk mengubah IP dan port',
        mangle: 'Modifikasi packet untuk QoS, marking, dan routing khusus',
        raw: 'Filtering awal sebelum connection tracking untuk performa',
        lists: 'Koleksi IP address untuk kebijakan firewall yang konsisten'
      }
    });

    // Step 6: VPN & Remote Access
    const pptpSecrets = config?.ppp?.['pptp-secret']?.length || 0;
    const l2tpSecrets = config?.ppp?.['l2tp-secret']?.length || 0;
    const sstpSecrets = config?.ppp?.['sstp-secret']?.length || 0;
    const ovpnSecrets = config?.ppp?.['ovpn-server']?.length || 0;
    const wireguard = config?.interface?.wireguard?.length || 0;
    const totalVpns = pptpSecrets + l2tpSecrets + sstpSecrets + ovpnSecrets + wireguard;
    
    storySteps.push({
      id: 'step-vpn',
      icon: <Lock size={18} />,
      title: '6. VPN & Akses Remote',
      color: 'var(--accent-light)',
      description: `**Total VPN Connections:** ${totalVpns} konfigurasi VPN aktif.\n\n**PPTP:** ${pptpSecrets} secret PPTP untuk koneksi VPN klasik.\n\n**L2TP:** ${l2tpSecrets} secret L2TP dengan enkripsi yang lebih baik.\n\n**SSTP:** ${sstpSecrets} secret SSTP untuk Windows integration.\n\n**OpenVPN:** ${ovpnSecrets} server OpenVPN untuk akses remote.\n\n**WireGuard:** ${wireguard} interface WireGuard untuk VPN modern berperforma tinggi.`,
      detailType: 'vpn',
      expandedInfo: {
        pptp: 'Point-to-Point Tunneling Protocol - VPN klasik dengan setup mudah',
        l2tp: 'Layer 2 Tunneling Protocol - Kombinasi L2TP dan IPSec untuk keamanan',
        sstp: 'Secure Socket Tunneling Protocol - Terintegrasi dengan Windows SSTP client',
        openvpn: 'OpenVPN - Fleksibel dan cross-platform dengan konfigurasi advanced',
        wireguard: 'WireGuard - VPN modern dengan performa tinggi dan setup sederhana'
      }
    });

    // Step 7: Quality of Service (QoS)
    const queueTrees = config?.queue?.tree?.length || 0;
    const queueTypes = config?.queue?.type?.length || 0;
    const simpleQueues = config?.queue?.simple?.length || 0;
    
    storySteps.push({
      id: 'step-qos',
      icon: <BarChart2 size={18} />,
      title: '7. Quality of Service (QoS)',
      color: 'var(--status-warning)',
      description: `**Queue Tree:** ${queueTrees} struktur hierarki untuk bandwidth management.\n\n**Queue Types:** ${queueTypes} tipe antrian untuk algoritma scheduling berbeda.\n\n**Simple Queues:** ${simpleQueues} aturan QoS sederhana per IP/interface.\n\nQoS memastikan traffic penting mendapat prioritas bandwidth yang cukup.`,
      detailType: 'queues-tree',
      expandedInfo: {
        tree: 'Hierarchical Token Bucket untuk kontrol bandwidth yang presisi',
        types: 'Algoritma antrian seperti PCQ, RED, SFQ untuk fairness',
        simple: 'Konfigurasi QoS cepat untuk limit bandwidth per user/service',
        priority: 'Marking dan queuing untuk VoIP, video, dan traffic bisnis'
      }
    });

    // Step 8: Monitoring & Management
    const snmp = config?.snmp;
    const graphing = config?.tool?.graphing;
    const netwatch = config?.tool?.['netwatch']?.length || 0;
    const bandwidthTest = config?.tool?.['bandwidth-test'];
    
    storySteps.push({
      id: 'step-monitoring',
      icon: <Monitor size={18} />,
      title: '8. Monitoring & Manajemen',
      color: 'var(--status-success)',
      description: `**SNMP:** ${snmp ? 'Aktif untuk monitoring via protokol SNMP' : 'Belum dikonfigurasi untuk monitoring eksternal'}.\n\n**Interface Graphing:** ${graphing ? 'Grafik traffic interface aktif' : 'Grafik interface belum diaktifkan'}.\n\n**Netwatch:** ${netwatch > 0 ? `${netwatch} host monitoring untuk uptime check` : 'Belum ada monitoring host'}.\n\n**Bandwidth Test:** ${bandwidthTest ? 'Server bandwidth test tersedia' : 'Bandwidth test server belum dikonfigurasi'}.`,
      detailType: 'tools-graphing',
      expandedInfo: {
        snmp: 'Simple Network Management Protocol untuk monitoring oleh NMS',
        graphing: 'Grafik real-time traffic, CPU, memory di WebFig',
        netwatch: 'Monitoring uptime dan konektivitas host penting',
        bandwidth: 'Server untuk mengukur kecepatan koneksi jaringan'
      }
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
        <div className="glass-panel config-section" style={{ minHeight: '400px' }}>
          <div className="section-header" style={{ marginBottom: '2rem' }}>
            <Activity className="summary-card-icon" />
            <h2 className="section-title">Panduan Konfigurasi Lengkap</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Berikut adalah panduan step-by-step lengkap mengenai semua konfigurasi yang ada pada perangkat MikroTik ini. 
            Setiap langkah menjelaskan fungsi dan detail konfigurasi. Klik untuk melihat detail lengkap.
          </p>

          <div style={{ position: 'relative', paddingLeft: '30px' }}>
            {/* Timeline Line */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '12px', width: '2px', background: 'var(--border)', borderRadius: '2px' }}></div>

            {storySteps.map((step, idx) => (
              <div key={idx} style={{ position: 'relative', paddingBottom: idx === storySteps.length - 1 ? 0 : '3rem' }}>
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
                    borderRadius: 'var(--r-md)', padding: '1.5rem', cursor: 'pointer',
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
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {step.title}
                    <ChevronRight size={14} style={{ opacity: 0.5 }} />
                  </h3>
                  
                  {/* Main Description */}
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem', whiteSpace: 'pre-line' }}>
                    {/* Simple bold parser for markdown double asterisks */}
                    {step.description.split(/(\*\*.*?\*\*)/).map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
                      }
                      return part;
                    })}
                  </div>

                  {/* Expanded Info Section */}
                  {step.expandedInfo && (
                    <div style={{ 
                      background: 'var(--bg-surface)', 
                      border: '1px solid var(--border)', 
                      borderRadius: 'var(--r-sm)',
                      padding: '1rem',
                      marginTop: '1rem'
                    }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                        📋 Detail Konfigurasi:
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                        {Object.entries(step.expandedInfo).map(([key, value]) => (
                          <div key={key} style={{ 
                            background: 'var(--bg-base)', 
                            padding: '0.5rem 0.75rem', 
                            borderRadius: 'var(--r-sm)',
                            border: '1px solid var(--border)'
                          }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: step.color, textTransform: 'capitalize', marginBottom: '0.25rem' }}>
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

  // Placeholder render functions for new menus - to be implemented
  const renderPlaceholder = (title) => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Settings className="summary-card-icon" />
        <h2 className="section-title">{title}</h2>
      </div>
      <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🚧</div>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Fitur Dalam Pengembangan</h3>
        <p style={{ fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto' }}>
          Menu <strong>{title}</strong> sedang dalam tahap pengembangan. 
          Fitur ini akan segera tersedia dalam versi mendatang.
        </p>
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.8rem', margin: 0 }}>
            💡 <strong>Catatan:</strong> Semua menu Winbox telah ditambahkan ke sidebar untuk kelengkapan. 
            Fitur-fitur ini akan diimplementasikan secara bertahap.
          </p>
        </div>
      </div>
    </div>
  );

  // System Menu Placeholders
  const renderSystemNTPClient = () => renderPlaceholder('NTP Client');
  const renderSystemNTPServer = () => renderPlaceholder('NTP Server');
  const renderSystemLog = () => renderPlaceholder('System Log');
  const renderSystemHistory = () => renderPlaceholder('System History');
  const renderSystemUsers = () => renderPlaceholder('System Users');
  const renderSystemGroups = () => renderPlaceholder('System Groups');
  const renderSystemPasswords = () => renderPlaceholder('System Passwords');
  const renderSystemSSH = () => renderPlaceholder('SSH');
  const renderSystemTelnet = () => renderPlaceholder('Telnet');
  const renderSystemWebFig = () => renderPlaceholder('WebFig');
  const renderSystemAPI = () => renderPlaceholder('API');
  const renderSystemFTP = () => renderPlaceholder('FTP');
  const renderSystemPackages = () => renderPlaceholder('Packages');
  const renderSystemResources = () => renderPlaceholder('Resources');
  const renderSystemRouterBoard = () => renderPlaceholder('RouterBoard');
  const renderSystemHealth = () => renderPlaceholder('Health');
  const renderSystemLEDs = () => renderPlaceholder('LEDs');
  const renderSystemWatchdog = () => renderPlaceholder('Watchdog');
  const renderSystemScheduler = () => renderPlaceholder('Scheduler');
  const renderSystemScripts = () => renderPlaceholder('Scripts');
  const renderSystemBackup = () => renderPlaceholder('Backup');
  const renderSystemReset = () => renderPlaceholder('Reset Configuration');

  // IP Menu Placeholders
  const renderDHCPRelay = () => renderPlaceholder('DHCP Relay');
  const renderUPnP = () => renderPlaceholder('UPnP');
  const renderSOCKS = () => renderPlaceholder('SOCKS');
  const renderProxy = () => renderPlaceholder('Proxy');
  const renderTrafficFlow = () => renderPlaceholder('Traffic Flow');
  const renderAccounting = () => renderPlaceholder('Accounting');

  // Bridge Menu Placeholders
  const renderBridgeVLANs = () => renderPlaceholder('Bridge VLANs');

  // Routing Menu Placeholders
  const renderRoutingRules = () => renderPlaceholder('Routing Rules');
  const renderRoutingFilters = () => renderPlaceholder('Routing Filters');
  const renderOSPF = () => renderPlaceholder('OSPF');
  const renderRIP = () => renderPlaceholder('RIP');
  const renderBGP = () => renderPlaceholder('BGP');
  const renderMPLS = () => renderPlaceholder('MPLS');
  const renderVRF = () => renderPlaceholder('VRF');

  // Firewall Menu Placeholders
  const renderLayer7Protocols = () => renderPlaceholder('Layer7 Protocols');

  // Queues Menu Placeholders
  const renderSimpleQueues = () => renderPlaceholder('Simple Queues');
  const renderInterfaceQueues = () => renderPlaceholder('Interface Queues');

  // Tools Menu Placeholders
  const renderPing = () => renderPlaceholder('Ping');
  const renderTraceroute = () => renderPlaceholder('Traceroute');
  const renderBandwidthTest = () => renderPlaceholder('Bandwidth Test');
  const renderTorch = () => renderPlaceholder('Torch');
  const renderPacketSniffer = () => renderPlaceholder('Packet Sniffer');
  const renderProfile = () => renderPlaceholder('Profile');
  const renderNetwatch = () => renderPlaceholder('Netwatch');
  const renderSMS = () => renderPlaceholder('SMS');
  const renderEmail = () => renderPlaceholder('Email');
  const renderRoMON = () => renderPlaceholder('RoMON');
  const renderMACServer = () => renderPlaceholder('MAC Server');
  const renderMACWinbox = () => renderPlaceholder('MAC Winbox');
  const renderWinboxSettings = () => renderPlaceholder('Winbox Settings');

  // Wireless Menu Placeholders
  const renderWirelessInterfaces = () => renderPlaceholder('Wireless Interfaces');
  const renderWirelessSecurity = () => renderPlaceholder('Wireless Security Profiles');
  const renderWirelessAccessList = () => renderPlaceholder('Wireless Access List');
  const renderWirelessConnectList = () => renderPlaceholder('Wireless Connect List');

  // PPP Menu Placeholders
  const renderPPPProfiles = () => renderPlaceholder('PPP Profiles');
  const renderPPPSecrets = () => renderPlaceholder('PPP Secrets');
  const renderPPPActive = () => renderPlaceholder('PPP Active Connections');

  // Files Menu Placeholders
  const renderFilesList = () => renderPlaceholder('Files List');
  const renderFilesBackup = () => renderPlaceholder('Files Backup');

  // User Manager Menu Placeholders
  const renderUserManagerUsers = () => renderPlaceholder('User Manager Users');
  const renderUserManagerProfiles = () => renderPlaceholder('User Manager Profiles');
  const renderUserManagerSessions = () => renderPlaceholder('User Manager Sessions');

  // CAPsMAN Menu Placeholders
  const renderCAPsMANInterfaces = () => renderPlaceholder('CAPsMAN Interfaces');
  const renderCAPsMANProvisioning = () => renderPlaceholder('CAPsMAN Provisioning');
  const renderCAPsMANAccessList = () => renderPlaceholder('CAPsMAN Access List');
  const renderCAPsMANConfiguration = () => renderPlaceholder('CAPsMAN Configuration');

  // LTE Menu Placeholders
  const renderLTEInterfaces = () => renderPlaceholder('LTE Interfaces');
  const renderLTEAPN = () => renderPlaceholder('LTE APN Profiles');
  const renderLTEInfo = () => renderPlaceholder('LTE Info');

  // GPS Menu Placeholders
  const renderGPSSettings = () => renderPlaceholder('GPS Settings');
  const renderGPSMonitor = () => renderPlaceholder('GPS Monitor');

  // Standalone Menu Placeholders
  const renderNeighbors = () => renderPlaceholder('Neighbors');
  const renderLog = () => renderPlaceholder('Log');
  const renderSkin = () => renderPlaceholder('Skin');

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

        {/* New System Menus */}
        {activeTab === 'system-ntp-client' && renderSystemNTPClient()}
        {activeTab === 'system-ntp-server' && renderSystemNTPServer()}
        {activeTab === 'system-log' && renderSystemLog()}
        {activeTab === 'system-history' && renderSystemHistory()}
        {activeTab === 'system-users' && renderSystemUsers()}
        {activeTab === 'system-groups' && renderSystemGroups()}
        {activeTab === 'system-passwords' && renderSystemPasswords()}
        {activeTab === 'system-ssh' && renderSystemSSH()}
        {activeTab === 'system-telnet' && renderSystemTelnet()}
        {activeTab === 'system-www' && renderSystemWebFig()}
        {activeTab === 'system-api' && renderSystemAPI()}
        {activeTab === 'system-ftp' && renderSystemFTP()}
        {activeTab === 'system-packages' && renderSystemPackages()}
        {activeTab === 'system-resources' && renderSystemResources()}
        {activeTab === 'system-routerboard' && renderSystemRouterBoard()}
        {activeTab === 'system-health' && renderSystemHealth()}
        {activeTab === 'system-leds' && renderSystemLEDs()}
        {activeTab === 'system-watchdog' && renderSystemWatchdog()}
        {activeTab === 'system-scheduler' && renderSystemScheduler()}
        {activeTab === 'system-scripts' && renderSystemScripts()}
        {activeTab === 'system-backup' && renderSystemBackup()}
        {activeTab === 'system-reset' && renderSystemReset()}

        {/* New IP Menus */}
        {activeTab === 'ip-pools' && renderIPPools()}
        {activeTab === 'ip-dhcp-relay' && renderDHCPRelay()}
        {activeTab === 'ip-upnp' && renderUPnP()}
        {activeTab === 'ip-socks' && renderSOCKS()}
        {activeTab === 'ip-proxy' && renderProxy()}
        {activeTab === 'ip-traffic-flow' && renderTrafficFlow()}
        {activeTab === 'ip-accounting' && renderAccounting()}

        {/* New Bridge Menus */}
        {activeTab === 'bridge-vlans' && renderBridgeVLANs()}

        {/* New Routing Menus */}
        {activeTab === 'routing-rules' && renderRoutingRules()}
        {activeTab === 'routing-filters' && renderRoutingFilters()}
        {activeTab === 'routing-ospf' && renderOSPF()}
        {activeTab === 'routing-rip' && renderRIP()}
        {activeTab === 'routing-bgp' && renderBGP()}
        {activeTab === 'routing-mpls' && renderMPLS()}
        {activeTab === 'routing-vrf' && renderVRF()}

        {/* New Firewall Menus */}
        {activeTab === 'firewall-layer7' && renderLayer7Protocols()}

        {/* New Queues Menus */}
        {activeTab === 'queues-simple' && renderSimpleQueues()}
        {activeTab === 'queues-interfaces' && renderInterfaceQueues()}

        {/* New Tools Menus */}
        {activeTab === 'tools-ping' && renderPing()}
        {activeTab === 'tools-traceroute' && renderTraceroute()}
        {activeTab === 'tools-bandwidth-test' && renderBandwidthTest()}
        {activeTab === 'tools-torch' && renderTorch()}
        {activeTab === 'tools-packet-sniffer' && renderPacketSniffer()}
        {activeTab === 'tools-profile' && renderProfile()}
        {activeTab === 'tools-netwatch' && renderNetwatch()}
        {activeTab === 'tools-sms' && renderSMS()}
        {activeTab === 'tools-email' && renderEmail()}
        {activeTab === 'tools-romon' && renderRoMON()}
        {activeTab === 'tools-mac-server' && renderMACServer()}
        {activeTab === 'tools-mac-winbox' && renderMACWinbox()}
        {activeTab === 'tools-winbox' && renderWinboxSettings()}

        {/* New Wireless Menus */}
        {activeTab === 'wireless-interfaces' && renderWirelessInterfaces()}
        {activeTab === 'wireless-security' && renderWirelessSecurity()}
        {activeTab === 'wireless-access-list' && renderWirelessAccessList()}
        {activeTab === 'wireless-connect-list' && renderWirelessConnectList()}

        {/* New PPP Menus */}
        {activeTab === 'ppp-profiles' && renderPPPProfiles()}
        {activeTab === 'ppp-secrets' && renderPPPSecrets()}
        {activeTab === 'ppp-active' && renderPPPActive()}

        {/* New Files Menus */}
        {activeTab === 'files-list' && renderFilesList()}
        {activeTab === 'files-backup' && renderFilesBackup()}

        {/* New User Manager Menus */}
        {activeTab === 'user-manager-users' && renderUserManagerUsers()}
        {activeTab === 'user-manager-profiles' && renderUserManagerProfiles()}
        {activeTab === 'user-manager-sessions' && renderUserManagerSessions()}

        {/* New CAPsMAN Menus */}
        {activeTab === 'capsman-interfaces' && renderCAPsMANInterfaces()}
        {activeTab === 'capsman-provisioning' && renderCAPsMANProvisioning()}
        {activeTab === 'capsman-access-list' && renderCAPsMANAccessList()}
        {activeTab === 'capsman-configuration' && renderCAPsMANConfiguration()}

        {/* New LTE Menus */}
        {activeTab === 'lte-interfaces' && renderLTEInterfaces()}
        {activeTab === 'lte-apn' && renderLTEAPN()}
        {activeTab === 'lte-info' && renderLTEInfo()}

        {/* New GPS Menus */}
        {activeTab === 'gps-settings' && renderGPSSettings()}
        {activeTab === 'gps-monitor' && renderGPSMonitor()}

        {/* New Standalone Menus */}
        {activeTab === 'neighbors' && renderNeighbors()}
        {activeTab === 'log' && renderLog()}
        {activeTab === 'skin' && renderSkin()}

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
