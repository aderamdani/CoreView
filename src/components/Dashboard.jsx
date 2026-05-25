import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Server, Activity, Shield, Wifi, Share2, Route, DownloadCloud,
  Lock, Globe, Cpu, AlertCircle, CheckCircle2, ChevronDown, ChevronRight, ChevronLeft,
  Settings, Clock, Terminal, Monitor, Key, Cloud, Search, BarChart2, HelpCircle, Tag, ArrowLeft, ArrowRight, Layers, FileText, X,
  Heart, AlertTriangle, Info, TrendingUp, BookOpen, Lightbulb, Zap
} from 'lucide-react';
import { configHelp } from '../utils/configHelp';
import { generateItemExplanation } from '../utils/itemExplainer';
import { analyzeConfig } from '../utils/configAnalyzer';
import { MindMap } from './MindMap';
import { OsiTcpView } from './OsiTcpView';
import { NetworkTopology } from './NetworkTopology';
import { PacketTracer } from './PacketTracer';
import { FirewallSwimlane } from './FirewallSwimlane';
import { DHCPRangeVisualizer } from './DHCPRangeVisualizer';
import { GlossaryTip } from './GlossaryTip';
import { FirewallConflicts } from './FirewallConflicts';
import { detectConflicts, detectDuplicates } from '../utils/detectConflicts';
import { ConfigComparison } from './ConfigComparison';
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

/* ─── Animated number counter ──────────────────────────────────── */
const CountUp = ({ target, duration = 700, suffix = '' }) => {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let frame = 0;
    const totalFrames = Math.round(duration / 16);
    const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const timer = setInterval(() => {
      frame++;
      setCount(Math.round(ease(frame / totalFrames) * target));
      if (frame >= totalFrames) { setCount(target); clearInterval(timer); }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <>{count}{suffix}</>;
};

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
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)', marginBottom: '8px' }}>
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
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)', marginBottom: '8px' }}>
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
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)', marginBottom: '8px' }}>
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
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)', marginBottom: '8px' }}>
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
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [firewallViewMode, setFirewallViewMode] = useState('table');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('coreview-favorites') || '[]'); } catch { return []; }
  });
  const toggleFavorite = useCallback((id, e) => {
    e?.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('coreview-favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  // A helper function to filter arrays based on searchTerm
  const applyFilter = (arr) => {
    if (!searchTerm) return arr;
    const lowerTerm = searchTerm.toLowerCase();
    return arr.filter(item => 
      Object.values(item).some(val => safeStr(val).toLowerCase().includes(lowerTerm))
    );
  };

  const { metadata, interfaces, ipAddresses, routes, vpn, firewall, dhcp, bridgeVlans } = config;
  
  // Calculate summaries
  const totalInterfaces = interfaces.length;
  const activeInterfaces = interfaces.filter(i => i.active).length;
  const firewallRules = firewall.filter.length + firewall.nat.length + (firewall.mangle?.length || 0) + (firewall.raw?.length || 0);
  const totalRoutes = routes.length;
  const totalVpns = (vpn.wireguard?.length || 0) + (vpn.ovpn?.length || 0) + (vpn.l2tp?.length || 0);

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const inInput = tag === 'input' || tag === 'textarea' || tag === 'select';
      if (e.key === 'Escape') {
        setSelectedItemDetail(null);
        setShowShortcuts(false);
        return;
      }
      if (e.key === '?' && !inInput) { setShowShortcuts(v => !v); return; }
      if (inInput) return;
      const shortcuts = {
        'o': 'overview', 'h': 'health-check', 't': 'network-topology',
        'p': 'packet-tracer', 'f': 'firewall-filter', 'n': 'firewall-nat',
        'r': 'ip-routes', 'd': 'ip-dhcp-server', 'c': 'config-compare',
        'x': 'firewall-conflicts',
      };
      if (shortcuts[e.key.toLowerCase()]) {
        e.preventDefault();
        setActiveTab(shortcuts[e.key.toLowerCase()]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const conflictAnalysis = useMemo(() => ({
    conflicts:  detectConflicts(firewall.filter  || []),
    duplicates: detectDuplicates(firewall.filter || []),
  }), [firewall.filter]);

  // Counts for sidebar badges
  const dataCounts = {
    'interfaces-list':       interfaces.length,
    'interfaces-ethernet':   interfaces.filter(i => i.type === 'ethernet').length,
    'interfaces-lte':        interfaces.filter(i => i.type === 'lte-apn' || i.type === 'lte').length,
    'interfaces-lists':      config.interfaceLists?.length || 0,
    'bridge-list':           config.bridges?.length || 0,
    'bridge-ports':          config.bridgePorts?.length || 0,
    'bridge-vlans':          config.bridgeVlans?.length || 0,
    'wireless-interfaces':   config.wireless?.interfaces?.length || 0,
    'wireless-security':     config.wireless?.securityProfiles?.length || 0,
    'wireless-access-list':  config.wireless?.accessList?.length || 0,
    'vpn':                   totalVpns,
    'vpn-ipsec':             config.vpn?.ipsec?.length || 0,
    'ppp-pppoe-server':      config.ppp?.pppoeServers?.length || 0,
    'ppp-profiles':          config.ppp?.profiles?.length || 0,
    'ppp-secrets':           config.ppp?.secrets?.length || 0,
    'ip-addresses':          ipAddresses.length,
    'ip-routes':             routes.length,
    'ip-pool':               config.pools?.length || 0,
    'ip-pools':              config.pools?.length || 0,
    'ip-dhcp-server':        dhcp.servers?.length || 0,
    'ip-dhcp-client':        dhcp.clients?.length || 0,
    'ip-dns':                (config.dns?.servers?.length || 0) + (config.dns?.static?.length || 0),
    'ip-hotspot':            (config.hotspot?.servers?.length || 0) + (config.hotspot?.users?.length || 0),
    'ip-services':           config.services?.length || 0,
    'routing-tables':        config.routingTables?.length || 0,
    'routing-bgp':           config.bgp?.connections?.length || 0,
    'firewall-filter':       firewall.filter?.length || 0,
    'firewall-conflicts':    conflictAnalysis.conflicts.length + conflictAnalysis.duplicates.length,
    'firewall-nat':          firewall.nat?.length || 0,
    'firewall-mangle':       firewall.mangle?.length || 0,
    'firewall-raw':          firewall.raw?.length || 0,
    'firewall-address-lists':firewall.addressLists?.length || 0,
    'queues-tree':           config.queues?.trees?.length || 0,
    'queues-simple':         config.queues?.simple?.length || 0,
    'queues-types':          config.queues?.types?.length || 0,
    'system-logging':        config.system?.logging?.length || 0,
  };

  const healthAnalysis   = useMemo(() => analyzeConfig(config), [config]);

  // ── Column filters ─────────────────────────────────────────────────────────
  const [tableColFilters, setTableColFilters] = useState({
    'firewall-filter': { action: '', chain: '', protocol: '' },
    'firewall-nat':    { action: '', chain: '', protocol: '' },
    'ip-routes':       { status: '' },
  });
  const setColFilter = useCallback((table, col, val) => {
    setTableColFilters(prev => ({ ...prev, [table]: { ...prev[table], [col]: val } }));
  }, []);
  const resetColFilters = useCallback((table) => {
    setTableColFilters(prev => {
      const blank = Object.fromEntries(Object.keys(prev[table]).map(k => [k, '']));
      return { ...prev, [table]: blank };
    });
  }, []);
  const applyColFilter = useCallback((table, arr) => {
    const cols = tableColFilters[table] || {};
    return arr.filter(item => {
      if (cols.action   && (item.action   || 'accept') !== cols.action)   return false;
      if (cols.chain    && item.chain !== cols.chain)                       return false;
      if (cols.protocol && (item.protocol || '') !== cols.protocol)        return false;
      if (cols.status) {
        const active = item.disabled !== 'yes';
        if (cols.status === 'active'   && !active)  return false;
        if (cols.status === 'disabled' &&  active)  return false;
      }
      return true;
    });
  }, [tableColFilters]);

  // ── Toast notification ─────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }, []);
  const copyCell = useCallback((value) => {
    if (!value || value === '-') return;
    navigator.clipboard?.writeText(String(value)).then(() => showToast(`Disalin: ${value}`));
  }, [showToast]);

  const exportHTMLReport = useCallback(() => {
    const { score, grade, gradeColor, gradeLabel, issues, criticalCount, warningCount, infoCount, plainSummary } = healthAnalysis;
    const identity = config?.system?.identity?.name || config?.metadata?.identity || 'Router';
    const now = new Date().toLocaleString('id-ID');

    const severityBg = { critical: '#fef2f2', warning: '#fff7ed', info: '#eef2ff' };
    const severityBorder = { critical: '#ef4444', warning: '#f97316', info: '#6366f1' };

    const issueRows = issues.map(iss => `
      <div style="margin-bottom:12px;padding:12px 16px;background:${severityBg[iss.severity]};border-left:4px solid ${severityBorder[iss.severity]};border-radius:6px;">
        <div style="font-weight:700;font-size:14px;color:${severityBorder[iss.severity]}">${iss.icon} ${iss.title}</div>
        <div style="color:#374151;margin-top:4px;font-size:13px">${iss.description}</div>
        <div style="color:#6b7280;margin-top:4px;font-size:12px"><strong>Solusi:</strong> ${iss.fix}</div>
        ${iss.commands?.length ? `<pre style="background:#1f2937;color:#d1fae5;padding:8px 12px;border-radius:4px;font-size:11px;margin-top:6px;overflow-x:auto">${iss.commands.join('\n')}</pre>` : ''}
      </div>`).join('');

    const filterRows = (firewall.filter || []).map((r, i) => `
      <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}">
        <td style="${tdStyle}">${i + 1}</td>
        <td style="${tdStyle}"><span style="padding:2px 8px;border-radius:4px;background:${r.action === 'accept' ? '#dcfce7' : r.action === 'drop' ? '#fee2e2' : '#e0e7ff'};color:${r.action === 'accept' ? '#166534' : r.action === 'drop' ? '#991b1b' : '#3730a3'};font-size:12px;font-weight:600">${r.action || 'accept'}</span></td>
        <td style="${tdStyle}">${r.chain || '-'}</td>
        <td style="${tdStyle}">${r.protocol || 'any'}</td>
        <td style="${tdStyle}">${r['src-address'] || 'any'}</td>
        <td style="${tdStyle}">${r['dst-address'] || 'any'}</td>
        <td style="${tdStyle}">${r.comment || '-'}</td>
      </tr>`).join('');

    const natRows = (firewall.nat || []).map((r, i) => `
      <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}">
        <td style="${tdStyle}">${r.action || '-'}</td>
        <td style="${tdStyle}">${r.chain || '-'}</td>
        <td style="${tdStyle}">${r.protocol || 'any'}</td>
        <td style="${tdStyle}">${r['to-addresses'] || '-'}</td>
        <td style="${tdStyle}">${r.comment || '-'}</td>
      </tr>`).join('');

    const tdStyle = 'padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;';
    const thStyle = 'padding:8px 12px;background:#f3f4f6;font-size:12px;font-weight:700;text-align:left;border-bottom:2px solid #d1d5db;';

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Laporan Konfigurasi — ${identity}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; max-width: 900px; margin: 0 auto; padding: 32px 24px; background: #f9fafb; }
  h1 { font-size: 28px; font-weight: 900; color: #1f2937; margin: 0 0 4px; }
  h2 { font-size: 18px; font-weight: 700; color: #374151; margin: 24px 0 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
  .meta { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
  .score-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
  .score-card { padding: 16px 24px; border-radius: 10px; background: #fff; border: 2px solid ${gradeColor}; text-align: center; min-width: 100px; }
  .grade { font-size: 36px; font-weight: 900; color: ${gradeColor}; }
  .stat-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
  .stat { padding: 10px 16px; background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center; min-width: 80px; }
  .stat-val { font-size: 22px; font-weight: 700; }
  .stat-lbl { font-size: 11px; color: #9ca3af; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 16px; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
  @media print { body { background: #fff; } }
</style>
</head>
<body>
<h1>📋 Laporan Konfigurasi Router</h1>
<div class="meta">Router: <strong>${identity}</strong> &nbsp;·&nbsp; Dibuat: ${now} &nbsp;·&nbsp; CoreView</div>

<h2>🏥 Kesehatan Jaringan</h2>
<div class="score-row">
  <div class="score-card">
    <div class="grade">${grade}</div>
    <div style="font-size:13px;color:${gradeColor};font-weight:600">${score}/100</div>
    <div style="font-size:12px;color:#6b7280;margin-top:4px">${gradeLabel}</div>
  </div>
  <div style="flex:1;min-width:200px;padding:12px 16px;background:#fff;border-radius:10px;border:1px solid #e5e7eb;">
    <div style="font-size:13px;color:#374151;line-height:1.7">${plainSummary}</div>
  </div>
</div>
<div class="stat-row">
  <div class="stat"><div class="stat-val" style="color:#ef4444">${criticalCount}</div><div class="stat-lbl">Kritis</div></div>
  <div class="stat"><div class="stat-val" style="color:#f97316">${warningCount}</div><div class="stat-lbl">Peringatan</div></div>
  <div class="stat"><div class="stat-val" style="color:#6366f1">${infoCount}</div><div class="stat-lbl">Saran</div></div>
  <div class="stat"><div class="stat-val">${(firewall.filter || []).length}</div><div class="stat-lbl">Filter Rules</div></div>
  <div class="stat"><div class="stat-val">${(firewall.nat || []).length}</div><div class="stat-lbl">NAT Rules</div></div>
  <div class="stat"><div class="stat-val">${routes.length}</div><div class="stat-lbl">Routes</div></div>
  <div class="stat"><div class="stat-val">${dhcp.servers.length}</div><div class="stat-lbl">DHCP Servers</div></div>
</div>

${issues.length > 0 ? `<h2>⚠️ Temuan (${issues.length})</h2>${issueRows}` : '<div style="color:#22c55e;font-weight:600;margin-bottom:20px">✅ Tidak ada masalah terdeteksi!</div>'}

<h2>🛡️ Firewall Filter Rules (${(firewall.filter || []).length})</h2>
${(firewall.filter || []).length > 0 ? `
<table>
  <thead><tr><th style="${thStyle}">#</th><th style="${thStyle}">Action</th><th style="${thStyle}">Chain</th><th style="${thStyle}">Protocol</th><th style="${thStyle}">Src</th><th style="${thStyle}">Dst</th><th style="${thStyle}">Comment</th></tr></thead>
  <tbody>${filterRows}</tbody>
</table>` : '<p style="color:#9ca3af">Tidak ada filter rules.</p>'}

<h2>🔄 NAT Rules (${(firewall.nat || []).length})</h2>
${(firewall.nat || []).length > 0 ? `
<table>
  <thead><tr><th style="${thStyle}">Action</th><th style="${thStyle}">Chain</th><th style="${thStyle}">Protocol</th><th style="${thStyle}">To</th><th style="${thStyle}">Comment</th></tr></thead>
  <tbody>${natRows}</tbody>
</table>` : '<p style="color:#9ca3af">Tidak ada NAT rules.</p>'}

<div class="footer">Dibuat oleh CoreView — MikroTik Config Visualizer &nbsp;·&nbsp; ${now}</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-${(identity || 'router').replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0,10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Laporan HTML berhasil diekspor!');
  }, [healthAnalysis, config, firewall, routes, dhcp, showToast]);

  const exportCSV = useCallback((headers, rows, filename) => {
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }, []);

  const renderSidebar = () => {
    const menus = [
      { id: 'overview', label: 'Overview', icon: <Server size={15} /> },
      {
        id: 'health-check',
        label: 'Cek Kesehatan',
        icon: <Heart size={15} />,
        badge: healthAnalysis.criticalCount > 0
          ? { count: healthAnalysis.criticalCount, color: '#ef4444' }
          : healthAnalysis.warningCount > 0
            ? { count: healthAnalysis.warningCount, color: '#f97316' }
            : null,
      },
      { id: 'network-topology', label: 'Topologi Jaringan', icon: <Globe size={15} /> },
      { id: 'packet-tracer',    label: 'Packet Tracer',    icon: <Zap size={15} /> },
      { id: 'config-compare',   label: 'Config Comparison', icon: <BarChart2 size={15} /> },
      { id: 'mindmap', label: 'Mind Map', icon: <Share2 size={15} /> },
      { id: 'osi-tcp', label: 'OSI & TCP/IP', icon: <Layers size={15} /> },
      { 
        id: 'interfaces', 
        label: 'Interfaces', 
        icon: <Activity size={15} />,
        submenus: [
          { id: 'interfaces-list', label: 'All Interfaces' },
          { id: 'interfaces-ethernet', label: 'Ethernet' },
          { id: 'interfaces-lte', label: 'LTE APNs' },
          { id: 'interfaces-lists', label: 'Interface Lists' }
        ]
      },
      { 
        id: 'bridge', 
        label: 'Bridge', 
        icon: <Share2 size={15} />,
        submenus: [
          { id: 'bridge-list', label: 'Bridge' },
          { id: 'bridge-ports', label: 'Port' },
          { id: 'bridge-vlans', label: 'VLAN' }
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
        id: 'vpn', 
        label: 'VPN', 
        icon: <Shield size={15} />,
        submenus: [
          { id: 'vpn', label: 'VPN Interfaces' },
          { id: 'vpn-ipsec', label: 'IPsec Profiles' },
          { id: 'vpn-ovpn-server', label: 'OpenVPN Server' }
        ]
      },
      { 
        id: 'ppp', 
        label: 'PPP', 
        icon: <Lock size={15} />,
        submenus: [
          { id: 'ppp-pppoe-server', label: 'PPPoE Servers' },
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
          { id: 'routing-bfd', label: 'BFD' },
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
          { id: 'firewall-conflicts', label: 'Conflict Detector' },
          { id: 'firewall-nat', label: 'NAT' },
          { id: 'firewall-mangle', label: 'Mangle' },
          { id: 'firewall-raw', label: 'Raw' },
          { id: 'firewall-address-lists', label: 'Address Lists' },
          { id: 'firewall-tracking', label: 'Connection Tracking' },
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
          { id: 'system-settings', label: 'General Settings' },
          { id: 'system-ntp-client', label: 'NTP Client' },
          { id: 'system-ntp-server', label: 'NTP Server' },
          { id: 'system-logging', label: 'Logging' },
          { id: 'system-log', label: 'Log' },
          { id: 'system-users', label: 'Users' },
          { id: 'system-groups', label: 'Groups' },
          { id: 'system-passwords', label: 'Passwords' },
          { id: 'system-ssh', label: 'SSH' },
          { id: 'system-telnet', label: 'Telnet' },
          { id: 'system-www', label: 'WebFig' },
          { id: 'system-api', label: 'API' },
          { id: 'system-ftp', label: 'FTP' },
          { id: 'system-snmp', label: 'SNMP' },
          { id: 'system-snmp-comm', label: 'SNMP Communities' },
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
          {/* Favorites section */}
          {!sidebarCollapsed && favorites.length > 0 && (() => {
            const allItems = menus.flatMap(m => [
              { id: m.id, label: m.label, isTop: !m.submenus },
              ...(m.submenus || []).map(s => ({ id: s.id, label: s.label, isTop: false })),
            ]);
            const favItems = favorites.map(fid => allItems.find(i => i.id === fid)).filter(Boolean);
            return (
              <li key="__favorites__">
                <div style={{ padding: '6px 12px 2px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  ⭐ Favorit
                </div>
                <div className="sidebar-submenus" style={{ paddingTop: 0 }}>
                  {favItems.map(item => (
                    <div
                      key={item.id}
                      className={`sidebar-subitem ${activeTab === item.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(item.id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <span>⭐ {item.label}</span>
                      <button onClick={(e) => toggleFavorite(item.id, e)} title="Hapus dari favorit"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', padding: '0 2px', lineHeight: 1, fontSize: '0.78rem' }}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 12px 6px' }} />
              </li>
            );
          })()}

          {menus.map(menu => {
            const hasSubmenus = !!menu.submenus;
            const isMenuExpanded = expandedMenus[menu.id];
            const isParentActive = hasSubmenus && menu.submenus.some(s => s.id === activeTab);
            const isActive = activeTab === menu.id;
            const isFav = favorites.includes(menu.id);

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
                  {!sidebarCollapsed && (() => {
                    if (menu.badge) {
                      return (
                        <span className="sidebar-count-badge" style={{ background: menu.badge.color, color: '#fff' }}>
                          {menu.badge.count}
                        </span>
                      );
                    }
                    const parentCount = hasSubmenus
                      ? menu.submenus.reduce((s, sub) => s + (dataCounts[sub.id] || 0), 0)
                      : (dataCounts[menu.id] || 0);
                    if (parentCount > 0 && !hasSubmenus) {
                      return <span className="sidebar-count-badge">{parentCount}</span>;
                    }
                    return null;
                  })()}
                  {!sidebarCollapsed && !hasSubmenus && (
                    <button onClick={(e) => toggleFavorite(menu.id, e)} title={isFav ? 'Hapus dari favorit' : 'Tambah ke favorit'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: isFav ? '#f59e0b' : 'var(--text-muted)', padding: '0 2px', lineHeight: 1, fontSize: '0.85rem', opacity: isFav ? 1 : 0.4, transition: 'opacity 0.2s' }}>
                      {isFav ? '⭐' : '☆'}
                    </button>
                  )}
                  {hasSubmenus && !sidebarCollapsed && (
                    <ChevronRight
                      size={13}
                      className={`sidebar-chevron ${isMenuExpanded ? 'open' : ''}`}
                    />
                  )}
                </div>

                {hasSubmenus && isMenuExpanded && !sidebarCollapsed && (
                  <div className="sidebar-submenus">
                    {menu.submenus.map(sub => {
                      const isSubFav = favorites.includes(sub.id);
                      return (
                        <div
                          key={sub.id}
                          className={`sidebar-subitem ${activeTab === sub.id ? 'active' : ''}`}
                          onClick={() => setActiveTab(sub.id)}
                          title={sub.label}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        >
                          <span>{sub.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            {dataCounts[sub.id] > 0 && (
                              <span className="sidebar-count-badge" style={{ marginLeft: '4px' }}>{dataCounts[sub.id]}</span>
                            )}
                            <button onClick={(e) => toggleFavorite(sub.id, e)} title={isSubFav ? 'Hapus dari favorit' : 'Tambah ke favorit'}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: isSubFav ? '#f59e0b' : 'var(--text-muted)', padding: '0 2px', lineHeight: 1, fontSize: '0.78rem', opacity: isSubFav ? 1 : 0.35, transition: 'opacity 0.2s' }}>
                              {isSubFav ? '⭐' : '☆'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </aside>
    );
  };


  const renderHealthCheck = () => {
    const { score, grade, gradeColor, gradeLabel, issues, criticalCount, warningCount, infoCount, plainSummary } = healthAnalysis;

    const severityConfig = {
      critical: { label: 'KRITIS',   color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   icon: <AlertCircle size={18} /> },
      warning:  { label: 'PERINGATAN', color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)', icon: <AlertTriangle size={18} /> },
      info:     { label: 'SARAN',    color: '#6366f1', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.25)', icon: <Info size={18} /> },
    };

    return (
      <div className="animate-fade-in">
        {/* Header + Score */}
        <div className="glass-panel config-section" style={{ marginBottom: '1.5rem' }}>
          <div className="section-header" style={{ marginBottom: '1.5rem' }}>
            <Heart className="summary-card-icon" />
            <h2 className="section-title">Cek Kesehatan Jaringan</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            Halaman ini menganalisis konfigurasi router dan memberikan rekomendasi dalam bahasa yang mudah dipahami.
            Cocok untuk Anda yang baru belajar networking atau ingin memastikan router sudah dikonfigurasi dengan aman.
          </p>

          {/* Score Circle + Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
            <div style={{
              width: 120, height: 120, borderRadius: '50%', flexShrink: 0,
              border: `6px solid ${gradeColor}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: `${gradeColor}15`, position: 'relative',
            }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, color: gradeColor, lineHeight: 1 }}>{grade}</span>
              <span style={{ fontSize: '0.75rem', color: gradeColor, fontWeight: 600 }}><CountUp target={score} /> / 100</span>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: gradeColor, marginBottom: '4px' }}>{gradeLabel}</div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '8px' }}>
                {[
                  { count: criticalCount, label: 'Kritis',    color: '#ef4444' },
                  { count: warningCount,  label: 'Peringatan', color: '#f97316' },
                  { count: infoCount,     label: 'Saran',     color: '#6366f1' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: s.color }}>{s.count}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{s.label}</span>
                  </div>
                ))}
              </div>
              {issues.length === 0 && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontWeight: 600 }}>
                  <CheckCircle2 size={18} /> Tidak ada masalah terdeteksi!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Plain Language Summary */}
        <div className="glass-panel config-section" style={{ marginBottom: '1.5rem' }}>
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <BookOpen className="summary-card-icon" />
            <h2 className="section-title">Dalam Bahasa Sederhana</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.8, background: 'var(--bg-elevated)', padding: '1rem 1.25rem', borderRadius: 'var(--r-md)', borderLeft: '3px solid var(--accent)' }}>
            {plainSummary}
          </p>

          {/* What do these numbers mean */}
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Apa arti angka-angka ini?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {[
                { icon: '🛡️', term: 'Firewall Rules', desc: 'Aturan penjaga yang memutuskan traffic mana yang boleh masuk/keluar, seperti satpam yang memeriksa tamu.' },
                { icon: '📡', term: 'DHCP Server', desc: 'Layanan pembagi alamat IP otomatis ke perangkat, seperti resepsionis yang memberi nomor kamar.' },
                { icon: '🗺️', term: 'Routes', desc: 'Peta jalan untuk data — memberitahu router harus kirim paket ke mana.' },
                { icon: '🔒', term: 'VPN Tunnel', desc: 'Terowongan terenkripsi untuk koneksi aman dari jauh, seperti lorong rahasia antara dua gedung.' },
                { icon: '🔄', term: 'NAT / Masquerade', desc: 'Menerjemahkan IP lokal ke IP publik agar semua perangkat bisa berbagi satu koneksi internet.' },
                { icon: '📝', term: 'Logging', desc: 'Buku catatan aktivitas router — siapa login, traffic apa, error apa. Penting untuk investigasi insiden.' },
              ].map((item, i) => (
                <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)', padding: '0.75rem', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '6px' }}>{item.icon}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{item.term}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* All Good */}
        {issues.length === 0 && (
          <div className="glass-panel config-section" style={{ textAlign: 'center', padding: '3rem' }}>
            <CheckCircle2 size={48} style={{ color: '#22c55e', margin: '0 auto 1rem' }} />
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#22c55e', marginBottom: '8px' }}>Konfigurasi Terlihat Baik!</div>
            <div style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto' }}>
              Tidak ada masalah keamanan atau konfigurasi yang terdeteksi. Router Anda sudah dikonfigurasi sesuai praktik yang baik.
            </div>
          </div>
        )}

        {/* Issues List */}
        {issues.length > 0 && (
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '12px' }}>
              {issues.length} Masalah Ditemukan — diurutkan dari yang paling penting
            </div>
            {['critical', 'warning', 'info'].map(sev => {
              const sevIssues = issues.filter(i => i.severity === sev);
              if (sevIssues.length === 0) return null;
              const cfg = severityConfig[sev];
              return (
                <div key={sev} style={{ marginBottom: '1rem' }}>
                  {sevIssues.map((issue, idx) => (
                    <div key={idx} style={{
                      background: cfg.bg, border: `1px solid ${cfg.border}`,
                      borderRadius: 'var(--r-md)', padding: '1.25rem 1.5rem', marginBottom: '0.75rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{issue.icon}</div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            <span style={{
                              fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.06em',
                              padding: '2px 8px', borderRadius: '99px',
                              background: cfg.color, color: '#fff',
                            }}>{cfg.label}</span>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{issue.title}</span>
                          </div>
                          <p style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 12px' }}>
                            {issue.description}
                          </p>
                          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)', padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                            <Lightbulb size={14} style={{ color: '#eab308', flexShrink: 0, marginTop: 2 }} />
                            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                              <strong style={{ color: 'var(--text-primary)' }}>Cara memperbaiki: </strong>
                              {issue.fix}
                            </div>
                          </div>
                          {issue.commands && issue.commands.length > 0 && (
                            <div style={{ marginTop: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
                                  Perintah CLI (RouterOS Terminal)
                                </span>
                                <button
                                  onClick={() => {
                                    const cmds = issue.commands.filter(c => !c.startsWith('#') && c.trim()).join('\n');
                                    navigator.clipboard?.writeText(cmds).then(() => showToast('Semua perintah disalin!'));
                                  }}
                                  style={{ padding: '3px 10px', borderRadius: 'var(--r-sm)', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: 'var(--accent-light)', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                                >
                                  Salin Semua
                                </button>
                              </div>
                              <div style={{ background: '#0d0f14', borderRadius: 'var(--r-sm)', padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.78rem', lineHeight: 1.8, overflowX: 'auto' }}>
                                {issue.commands.map((cmd, ci) => (
                                  <div
                                    key={ci}
                                    onClick={() => cmd && !cmd.startsWith('#') && copyCell(cmd)}
                                    title={!cmd.startsWith('#') ? 'Klik untuk salin baris ini' : ''}
                                    style={{
                                      color: cmd.startsWith('#') ? '#6b7280' : '#a5b4fc',
                                      cursor: cmd && !cmd.startsWith('#') ? 'copy' : 'default',
                                      padding: '1px 0',
                                      transition: 'color 0.1s',
                                    }}
                                    onMouseEnter={e => { if (!cmd.startsWith('#') && cmd) e.currentTarget.style.color = '#e0e7ff'; }}
                                    onMouseLeave={e => { if (!cmd.startsWith('#') && cmd) e.currentTarget.style.color = '#a5b4fc'; }}
                                  >
                                    {cmd || <>&nbsp;</>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {issue.tab && (
                          <button
                            onClick={() => setActiveTab(issue.tab)}
                            style={{
                              flexShrink: 0, padding: '6px 14px', borderRadius: 'var(--r-sm)',
                              background: cfg.color, color: '#fff', border: 'none', cursor: 'pointer',
                              fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap',
                              display: 'flex', alignItems: 'center', gap: '5px',
                            }}
                          >
                            Buka <ChevronRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderOverview = () => {
    // Interactive Config Story Logic - Detailed Step by Step
    const storySteps = [];
    
    // Step 1: System Identity & Basic Setup
    const identity = metadata.identity || 'MikroTik';
    const systemClock = config?.system?.clock;
    const systemLogging = config?.system?.logging;
    
    storySteps.push({
      id: 'step-system',
      icon: <Server size={18} />,
      title: '1. Sistem & Identitas Perangkat',
      color: 'var(--blue)',
      description: `**Router Identity:** ${identity} - Nama unik perangkat ini di jaringan.\n\n**System Clock:** ${systemClock?.['time-zone-name'] ? `Timezone ${systemClock['time-zone-name']}` : 'Menggunakan waktu default sistem'}.\n\n**System Logging:** ${systemLogging && systemLogging.length > 0 ? `${systemLogging.length} aturan logging aktif` : 'Logging sistem belum dikonfigurasi'}.`,
      detailType: 'system-identity',
      expandedInfo: {
        identity: 'Nama perangkat yang muncul di Winbox/WebFig dan digunakan untuk identifikasi jaringan',
        clock: 'Konfigurasi waktu dan timezone untuk logging dan scheduling yang akurat',
        logging: 'Sistem pencatatan aktivitas router untuk troubleshooting dan monitoring'
      }
    });

    // Step 2: Network Interfaces Configuration
    const activeIfaces = interfaces.filter(i => i.active).length;
    const totalIfaces = interfaces.length;
    const bridges = config?.bridges?.length || 0;
    const interfaceLists = config?.interfaceLists?.length || 0;
    
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
    const dhcpServersCount = config?.dhcp?.servers?.length || 0;
    const dhcpClientsCount = config?.dhcp?.clients?.length || 0;
    const dnsServersCount = config?.dns?.servers?.length || 0;
    const ipPoolsCount = config?.pools?.length || 0;
    
    storySteps.push({
      id: 'step-ip-services',
      icon: <Globe size={18} />,
      title: '3. Layanan IP & DHCP',
      color: 'var(--yellow)',
      description: `**IP Addresses:** ${staticIps} konfigurasi IP statis pada interface.\n\n**DHCP Server:** ${dhcpServersCount > 0 ? `${dhcpServersCount} server DHCP aktif untuk pembagian IP otomatis` : 'Belum ada DHCP server yang dikonfigurasi'}.\n\n**DHCP Client:** ${dhcpClientsCount > 0 ? `${dhcpClientsCount} client DHCP untuk mendapatkan IP dari upstream` : 'Tidak beroperasi sebagai DHCP client'}.\n\n**DNS Configuration:** ${dnsServersCount > 0 ? `${dnsServersCount} server DNS untuk resolusi nama domain` : 'Menggunakan DNS default sistem'}.\n\n**IP Pools:** ${ipPoolsCount > 0 ? `${ipPoolsCount} pool IP untuk DHCP dan PPP` : 'Belum ada IP pool yang dikonfigurasi'}.`,
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
    const storyTotalRoutes = routes.length;
    const storyDefaultRoutes = routes.filter(r => r['dst-address'] === '0.0.0.0/0').length;
    const storyHasMasquerade = (config?.firewall?.nat || []).some(r => r.action === 'masquerade');
    const storyRoutingTables = config?.routingTables?.length || 0;
    
    storySteps.push({
      id: 'step-routing',
      icon: <Route size={18} />,
      title: '4. Routing & Akses Internet',
      color: 'var(--accent)',
      description: `**Total Routes:** ${storyTotalRoutes} rute dalam tabel routing.\n\n**Default Routes:** ${storyDefaultRoutes} rute default (0.0.0.0/0) untuk akses internet.\n\n**NAT Configuration:** ${storyHasMasquerade ? 'Masquerade rule aktif untuk sharing internet' : 'Belum ada aturan NAT untuk internet sharing'}.\n\n**Routing Tables:** ${storyRoutingTables > 0 ? `${storyRoutingTables} tabel routing tambahan` : 'Menggunakan tabel routing default'}.`,
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
    const filterRules = (config?.firewall?.filter || []).length;
    const natRules = (config?.firewall?.nat || []).length;
    const mangleRules = (config?.firewall?.mangle || []).length;
    const rawRules = (config?.firewall?.raw || []).length;
    const addressListsCount = (config?.firewall?.addressLists || []).length;
    
    storySteps.push({
      id: 'step-firewall',
      icon: <Shield size={18} />,
      title: '5. Firewall & Keamanan Jaringan',
      color: 'var(--red)',
      description: `**Filter Rules:** ${filterRules} aturan filter untuk kontrol traffic masuk/keluar.\n\n**NAT Rules:** ${natRules} aturan NAT untuk port forwarding dan masquerade.\n\n**Mangle Rules:** ${mangleRules} aturan mangle untuk modifikasi packet.\n\n**Raw Rules:** ${rawRules} aturan raw untuk performance dan filtering awal.\n\n**Address Lists:** ${addressListsCount} daftar alamat IP untuk kebijakan keamanan.`,
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
    const storyWireguard = config?.vpn?.wireguard?.length || 0;
    const storyOvpn = config?.vpn?.ovpn?.length || 0;
    const storyL2tp = config?.vpn?.l2tp?.length || 0;
    const storyWireguardPeers = config?.vpn?.wireguardPeers?.length || 0;
    const storyTotalVpns = storyWireguard + storyOvpn + storyL2tp;
    
    storySteps.push({
      id: 'step-vpn',
      icon: <Lock size={18} />,
      title: '6. VPN & Akses Remote',
      color: 'var(--accent-light)',
      description: `**Total VPN Interfaces:** ${storyTotalVpns} interface VPN dikonfigurasi.\n\n**WireGuard:** ${storyWireguard > 0 ? `${storyWireguard} interface WireGuard${storyWireguardPeers > 0 ? ` (${storyWireguardPeers} peer)` : ''}` : 'Tidak ada interface WireGuard'}.\n\n**OpenVPN:** ${storyOvpn > 0 ? `${storyOvpn} client OpenVPN` : 'Tidak ada OpenVPN client'}.\n\n**L2TP:** ${storyL2tp > 0 ? `${storyL2tp} client L2TP` : 'Tidak ada L2TP client'}.`,
      detailType: 'vpn',
      expandedInfo: {
        wireguard: 'WireGuard - VPN modern dengan performa tinggi dan setup sederhana',
        openvpn: 'OpenVPN - Fleksibel dan cross-platform dengan konfigurasi advanced',
        l2tp: 'Layer 2 Tunneling Protocol - Kombinasi L2TP dan IPSec untuk keamanan'
      }
    });

    // Step 7: Quality of Service (QoS)
    const queueTrees = config?.queues?.trees?.length || 0;
    const queueTypes = config?.queues?.types?.length || 0;
    const simpleQueues = config?.queues?.simple?.length || 0;
    
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
    const hasSnmp = config?.snmp && Object.keys(config.snmp).length > 0;
    const graphingInterfaces = config?.tools?.graphingInterfaces?.length || 0;
    const hasServices = (config?.services?.length || 0) > 0;
    
    storySteps.push({
      id: 'step-monitoring',
      icon: <Monitor size={18} />,
      title: '8. Monitoring & Manajemen',
      color: 'var(--status-success)',
      description: `**SNMP:** ${hasSnmp ? `Aktif${config.snmp.contact ? ` (Contact: ${config.snmp.contact})` : ''}` : 'Belum dikonfigurasi untuk monitoring eksternal'}.\n\n**Interface Graphing:** ${graphingInterfaces > 0 ? `${graphingInterfaces} interface dengan grafik traffic aktif` : 'Grafik interface belum diaktifkan'}.\n\n**IP Services:** ${hasServices ? `${config.services.length} layanan (Winbox, SSH, Web, API, dll) dikonfigurasi` : 'Layanan IP menggunakan konfigurasi default'}.`,
      detailType: 'tools-graphing',
      expandedInfo: {
        snmp: 'Simple Network Management Protocol untuk monitoring oleh NMS',
        graphing: 'Grafik real-time traffic, CPU, memory di WebFig',
        services: 'IP Services untuk Winbox, SSH, Telnet, API, Web management',
        bandwidth: 'Server untuk mengukur kecepatan koneksi jaringan'
      }
    });


    return (
      <div className="animate-fade-in delay-100">
        <div className="glass-panel config-section" style={{ marginBottom: '1.5rem' }}>
          <div className="section-header" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Server className="summary-card-icon" />
              <h2 className="section-title">Device Information</h2>
            </div>
            <button className="btn-export" onClick={exportHTMLReport} title="Ekspor laporan lengkap sebagai HTML">
              📄 Export Laporan HTML
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Router Identity</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{metadata.identity || 'MikroTik'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Model</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{metadata.model || 'Unknown Device'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Serial Number</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{metadata.serialNumber || 'N/A'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Software ID</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{metadata.softwareId || 'N/A'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Generated At</div>
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
              <CountUp target={activeInterfaces} />
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}> / <CountUp target={totalInterfaces} /> Active</span>
            </div>
          </div>
          <div className="glass-panel summary-card card-hover delay-100" onClick={() => setActiveTab('vpn')} style={{cursor: 'pointer'}}>
            <div className="summary-card-header">
              <Lock className="summary-card-icon" size={20} />
              VPN CONNECTIONS
            </div>
            <div className="summary-card-value"><CountUp target={totalVpns} /></div>
          </div>
          <div className="glass-panel summary-card card-hover delay-200" onClick={() => setActiveTab('routing-tables')} style={{cursor: 'pointer'}}>
            <div className="summary-card-header">
              <Route className="summary-card-icon" size={20} />
              ROUTES
            </div>
            <div className="summary-card-value"><CountUp target={totalRoutes} /></div>
          </div>
          <div className="glass-panel summary-card card-hover delay-300" onClick={() => setActiveTab('firewall-filter')} style={{cursor: 'pointer'}}>
            <div className="summary-card-header">
              <Shield className="summary-card-icon" size={20} />
              FIREWALL RULES
            </div>
            <div className="summary-card-value"><CountUp target={firewallRules} /></div>
          </div>
        </div>

        {/* Health Score Mini Card */}
        {(() => {
          const { score, grade, gradeColor, gradeLabel, criticalCount, warningCount, issues } = healthAnalysis;
          return (
            <div
              className="glass-panel card-hover"
              onClick={() => setActiveTab('health-check')}
              style={{
                marginBottom: '1.5rem', cursor: 'pointer', padding: '1.25rem 1.5rem',
                borderLeft: `4px solid ${gradeColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                  border: `3px solid ${gradeColor}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: `${gradeColor}18`,
                }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: gradeColor, lineHeight: 1 }}>{grade}</span>
                  <span style={{ fontSize: '0.55rem', color: gradeColor, fontWeight: 600 }}>{score}/100</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>Kesehatan Jaringan: {gradeLabel}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {issues.length === 0
                      ? 'Tidak ada masalah terdeteksi — konfigurasi terlihat baik!'
                      : `${criticalCount > 0 ? `${criticalCount} kritis, ` : ''}${warningCount} peringatan, ${healthAnalysis.infoCount} saran — klik untuk detail`}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: gradeColor, fontSize: '0.83rem', fontWeight: 600 }}>
                <Heart size={14} />
                Lihat Laporan Lengkap
                <ChevronRight size={14} />
              </div>
            </div>
          );
        })()}

        {/* Config Analysis Charts */}
        {(firewallRules > 0 || totalInterfaces > 0) && (() => {
          const fwData = [
            { name: 'Filter', value: firewall.filter?.length || 0, color: '#ef4444' },
            { name: 'NAT',    value: firewall.nat?.length || 0,    color: '#f59e0b' },
            { name: 'Mangle', value: firewall.mangle?.length || 0, color: '#6366f1' },
            { name: 'Raw',    value: firewall.raw?.length || 0,    color: '#64748b' },
          ].filter(d => d.value > 0);

          const ifaceTypeMap = interfaces.reduce((acc, iface) => {
            const t = iface.type || 'other';
            acc[t] = (acc[t] || 0) + 1;
            return acc;
          }, {});
          const ifaceData = Object.entries(ifaceTypeMap).map(([type, count]) => ({ type, count })).sort((a,b) => b.count - a.count).slice(0, 6);

          return (
            <div className="glass-panel config-section" style={{ marginBottom: '1.5rem' }}>
              <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                <BarChart2 className="summary-card-icon" />
                <h2 className="section-title">Analisis Konfigurasi</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

                {fwData.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      Distribusi Firewall Rules ({firewallRules} total)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <ResponsiveContainer width={120} height={120}>
                        <PieChart>
                          <Pie data={fwData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2}>
                            {fwData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.8rem' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {fwData.map((d, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                            <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600, marginLeft: 'auto' }}>{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {ifaceData.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      Interface berdasarkan Tipe
                    </div>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={ifaceData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="type" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.8rem' }} />
                        <Bar dataKey="count" fill="var(--accent)" radius={[4,4,0,0]} name="Jumlah" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Ringkasan Cepat
                  </div>
                  {[
                    { label: 'Interface Aktif', value: `${interfaces.filter(i=>i.active).length}/${interfaces.length}`, color: 'var(--green)' },
                    { label: 'IP Addresses', value: ipAddresses.length, color: 'var(--blue)' },
                    { label: 'Routes', value: routes.length, color: 'var(--accent-light)' },
                    { label: 'DHCP Servers', value: dhcp.servers?.length || 0, color: 'var(--yellow)' },
                    { label: 'VPN Tunnels', value: totalVpns, color: 'var(--accent-secondary)' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)' }}>
                      <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          );
        })()}

        {/* Interactive Configuration Story */}
        <div className="glass-panel config-section" style={{ minHeight: '400px' }}>
          <div className="section-header" style={{ marginBottom: '2rem' }}>
            <Activity className="summary-card-icon" />
            <h2 className="section-title">Panduan Konfigurasi Lengkap</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
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
      <div className="section-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity className="summary-card-icon" />
          <h2 className="section-title">Network Interfaces</h2>
          <span className="badge badge-neutral">{interfaces.length}</span>
        </div>
        <button className="btn-export" onClick={() => exportCSV(
          ['Status','Name','Type','IP Address','Comment'],
          interfaces.map(i => [i.active ? 'Active' : 'Disabled', i.name || i.defaultName, i.type, i.ip || '', i.comment || ''])
          , 'interfaces.csv')}>
          ↓ CSV
        </button>
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
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {applyFilter(interfaces).length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Interfaces match search.</td></tr>
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
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('interface', iface)}</td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEthernet = () => {
    const ethernetIfaces = interfaces.filter(i => i.type === 'ethernet');
    
    return (
      <div className="glass-panel config-section animate-fade-in">
        <div className="section-header">
          <Activity className="summary-card-icon" />
          <h2 className="section-title">Ethernet Interfaces</h2>
        </div>
        <HelpPanel id="interfaces-ethernet" onNavigate={setActiveTab} />

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Name</th>
                <th>MAC Address</th>
                <th>MTU / L2MTU</th>
                <th>Auto-Neg / Speed</th>
                <th>Aksi</th>
                <th>Comment</th>
                <th>Penjelasan</th>
              </tr>
            </thead>
            <tbody>
              {applyFilter(ethernetIfaces).length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Ethernet interfaces match search.</td></tr>
              ) : (
                applyFilter(ethernetIfaces).map((iface, idx) => (
                <tr key={idx} style={{ opacity: iface.active ? 1 : 0.6 }}>
                  <td>
                    {iface.active 
                      ? <span className="badge badge-success"><CheckCircle2 size={12} style={{marginRight: '4px'}}/> Active</span>
                      : <span className="badge badge-neutral"><AlertCircle size={12} style={{marginRight: '4px'}}/> Disabled</span>
                    }
                  </td>
                  <td style={{ fontWeight: 600 }}>{iface.name || iface.defaultName}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{iface['mac-address'] || '-'}</td>
                  <td>{iface.mtu || '1500'} {iface.l2mtu ? `/ ${iface.l2mtu}` : ''}</td>
                  <td>
                    {iface['auto-negotiation'] === 'no' 
                      ? <span className="badge badge-warning">Fixed: {iface.speed || 'Unknown'}</span> 
                      : <span className="badge badge-info">Auto{iface.speed ? ` / ${iface.speed}`: ''}</span>}
                  </td>
                  <td>
                    <button className="btn btn-primary" onClick={() => setSelectedItemDetail(iface)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      <Activity size={14} /> Detail
                    </button>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{iface.comment || '-'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('interfaces-ethernet', iface)}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {selectedItemDetail && (
          <div className="modal-overlay" onClick={() => setSelectedItemDetail(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Detail: {selectedItemDetail.name || selectedItemDetail.defaultName || 'Interface'}</h3>
                <button className="btn-close" onClick={() => setSelectedItemDetail(null)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <table className="detail-table">
                  <tbody>
                    {Object.entries(selectedItemDetail).map(([k, v]) => {
                      if (k === '_implicit' || k === 'ipAddresses' || k === 'dhcpServers') return null;
                      return (
                        <tr key={k}>
                          <td className="detail-key" style={{ textTransform: 'capitalize' }}>{k.replace(/-/g, ' ')}</td>
                          <td style={{ wordBreak: 'break-all' }}>{String(v)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInterfaceLists = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Activity className="summary-card-icon" />
        <h2 className="section-title">Interface Lists</h2>
      </div>
      <HelpPanel id="interfaces-lists" onNavigate={setActiveTab} />

      
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>List Name</th>
              <th>Member Interfaces</th>
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {config.interfaceLists.length === 0 ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Interface Lists configured.</td></tr>
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
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('interface-list', list)}</td>
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
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {(!config.bridges || config.bridges.length === 0) ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Bridges configured.</td></tr>
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
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('bridge', bridge)}</td>
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
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {(!config.bridgePorts || config.bridgePorts.length === 0) ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Bridge Ports configured.</td></tr>
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
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('bridge-port', bp)}</td>
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
      <div className="section-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Server className="summary-card-icon" />
          <h2 className="section-title">IP Addresses</h2>
          <span className="badge badge-neutral">{ipAddresses.length}</span>
        </div>
        <button className="btn-export" onClick={() => exportCSV(
          ['Status','Address','Network','Interface'],
          ipAddresses.map(ip => [ip.active ? 'Active' : 'Disabled', ip.address, ip.network || '', ip.interface || ''])
          , 'ip-addresses.csv')}>
          ↓ CSV
        </button>
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
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {applyFilter(ipAddresses).length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No IP Addresses match search.</td></tr>
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
                    <td
                      style={{ fontWeight: 600, cursor: 'copy' }}
                      onClick={() => copyCell(ip.address)}
                      title="Klik untuk salin"
                    >{ip.address}</td>
                    <td
                      style={{ cursor: 'copy', fontFamily: 'monospace', fontSize: '0.83rem' }}
                      onClick={() => copyCell(ip.network)}
                      title="Klik untuk salin"
                    >{ip.network || '-'}</td>
                    <td>{ip.interface || '-'}</td>
                    <td>
                      {hasDHCP && <span className="badge badge-info" style={{marginRight: '4px'}}>DHCP Server</span>}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('ip-address', ip)}</td>
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
      <HelpPanel id="ip-dhcp-server" onNavigate={setActiveTab} />
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        DHCP servers automatically assign IP addresses to clients on specific interfaces.
      </p>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name / Status</th>
              <th><GlossaryTip term="Interface">Interface</GlossaryTip></th>
              <th><GlossaryTip term="DHCP">Address Pool</GlossaryTip></th>
              <th><GlossaryTip term="Subnet">Network segment</GlossaryTip></th>
              <th><GlossaryTip term="Gateway">Gateway</GlossaryTip></th>
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {dhcp.servers.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No DHCP Servers configured.</td></tr>
            ) : (
              dhcp.servers.map((server, idx) => (
                <React.Fragment key={idx}>
                  <tr style={{ opacity: server.active ? 1 : 0.6 }}>
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
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('dhcp-server', server)}</td>
                  </tr>
                  {server.poolObj?.ranges && (
                    <tr style={{ background: 'var(--bg-base)' }}>
                      <td colSpan="6" style={{ padding: '0 12px 12px' }}>
                        <DHCPRangeVisualizer server={server} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {(!config.dhcp.clients || config.dhcp.clients.length === 0) ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No DHCP Clients configured.</td></tr>
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
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('dhcp-client', client)}</td>
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
      <HelpPanel id="ip-dns" onNavigate={setActiveTab} />
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
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {config.dns.static.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No static DNS entries.</td></tr>
            ) : (
              config.dns.static.map((entry, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{entry.name}</td>
                  <td>{entry.address}</td>
                  <td>{entry.ttl || 'Default'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('dns-static', entry)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderColFilterBar = (tableKey, fieldDefs) => {
    const filters = tableColFilters[tableKey] || {};
    const hasAny = Object.values(filters).some(v => v !== '');
    const selectStyle = {
      padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)',
      background: 'var(--bg-elevated)', color: 'var(--text-primary)',
      fontSize: '0.82rem', cursor: 'pointer',
    };
    return (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '4px' }}>FILTER:</span>
        {fieldDefs.map(({ key, label, options }) => (
          <select key={key} value={filters[key] || ''} onChange={e => setColFilter(tableKey, key, e.target.value)} style={selectStyle}>
            <option value="">{label}: Semua</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ))}
        {hasAny && (
          <button onClick={() => resetColFilters(tableKey)} style={{ ...selectStyle, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>
            × Reset
          </button>
        )}
        {hasAny && (
          <span style={{ fontSize: '0.78rem', color: 'var(--accent)', marginLeft: 'auto' }}>
            Filter aktif
          </span>
        )}
      </div>
    );
  };

  const renderIPRoutes = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Route className="summary-card-icon" />
          <h2 className="section-title">IP Routes</h2>
          <span className="badge badge-neutral">{routes.length}</span>
        </div>
        <button className="btn-export" onClick={() => exportCSV(
          ['Destination','Gateway','Distance','Comment'],
          routes.map(r => [r['dst-address'] || '0.0.0.0/0', r.gateway || '', r.distance || '1', r.comment || ''])
          , 'routes.csv')}>
          ↓ CSV
        </button>
      </div>
      <HelpPanel id="ip-routes" onNavigate={setActiveTab} />
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Routing table determining path selection for IP traffic.
      </p>
      {renderColFilterBar('ip-routes', [
        { key: 'status', label: 'Status', options: ['active', 'disabled'] },
      ])}

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th><GlossaryTip term="Subnet">Destination</GlossaryTip></th>
              <th><GlossaryTip term="Gateway">Gateway</GlossaryTip></th>
              <th>Distance</th>
              <th>Notes / Comment</th>
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const filtered = applyColFilter('ip-routes', applyFilter(routes));
              return filtered.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No routes match filter.</td></tr>
              ) : filtered.map((rt, idx) => (
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
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('route', rt)}</td>
                </tr>
              ));
            })()}
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
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {(!config.pools || config.pools.length === 0) ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No IP pools configured.</td></tr>
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
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('pool', pool)}</td>
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
      <HelpPanel id="ip-hotspot" onNavigate={setActiveTab} />

      
      <div className="data-table-container" style={{ marginBottom: '2rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name / Status</th>
              <th>Interface</th>
              <th>Address Pool</th>
              <th>Profile</th>
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {config.hotspot.servers.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Hotspot Servers configured.</td></tr>
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
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('hotspot-server', server)}</td>
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
              <th>Penjelasan</th>
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
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('hotspot-user-profile', up)}</td>
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
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {(!config.hotspot.users || config.hotspot.users.length === 0) ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Hotspot Users configured.</td></tr>
            ) : (
              config.hotspot.users.map((u, idx) => (
                <tr key={idx} style={{ opacity: u.disabled === 'yes' ? 0.6 : 1 }}>
                  <td>{u.disabled !== 'yes' ? <span className="badge badge-success">Active</span> : <span className="badge badge-neutral">Disabled</span>}</td>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td><span className="badge badge-info">{u.profile || 'default'}</span></td>
                  <td>{u['mac-address'] || 'Any'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.comment || '-'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('hotspot-user', u)}</td>
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
      <HelpPanel id="routing-tables" onNavigate={setActiveTab} />


      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Table Name</th>
              <th>FIB Enabled</th>
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {config.routingTables.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Routing Tables configured.</td></tr>
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
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('routing-table', rt)}</td>
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
      <div className="section-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield className="summary-card-icon" />
          <h2 className="section-title">Firewall Filter Rules</h2>
          <span className="badge badge-neutral">{firewall.filter?.length || 0}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '8px', padding: '3px', gap: '3px' }}>
            <button
              onClick={() => setFirewallViewMode('table')}
              style={{
                padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                background: firewallViewMode === 'table' ? 'var(--accent)' : 'transparent',
                color: firewallViewMode === 'table' ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}>
              ☰ Tabel
            </button>
            <button
              onClick={() => setFirewallViewMode('swimlane')}
              style={{
                padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                background: firewallViewMode === 'swimlane' ? 'var(--accent)' : 'transparent',
                color: firewallViewMode === 'swimlane' ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}>
              🏊 Swimlane
            </button>
          </div>
          <button className="btn-export" onClick={() => exportCSV(
            ['Action','Chain','Protocol','Src Address','Dst Address','Comment'],
            (firewall.filter || []).map(r => [r.action || 'accept', r.chain, r.protocol || 'any', r['src-address'] || 'any', r['dst-address'] || 'any', r.comment || ''])
            , 'firewall-filter.csv')}>
            ↓ CSV
          </button>
        </div>
      </div>
      <HelpPanel id="firewall-filter" onNavigate={setActiveTab} />

      {firewallViewMode === 'swimlane' ? (
        <FirewallSwimlane rules={applyFilter(firewall.filter)} onNavigate={setActiveTab} />
      ) : (
        <>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Filter rules determine whether traffic is allowed or dropped based on various conditions.
          </p>
          {renderColFilterBar('firewall-filter', [
            { key: 'action',   label: 'Action',   options: ['accept', 'drop', 'reject', 'log', 'passthrough', 'add-src-to-address-list', 'add-dst-to-address-list'] },
            { key: 'chain',    label: 'Chain',    options: ['input', 'forward', 'output'] },
            { key: 'protocol', label: 'Protokol', options: ['tcp', 'udp', 'icmp', 'gre', 'ipsec-esp', 'ipsec-ah'] },
          ])}
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th><GlossaryTip term="Accept">Action</GlossaryTip></th>
                  <th><GlossaryTip term="Chain">Chain</GlossaryTip></th>
                  <th>Protocol / Port</th>
                  <th><GlossaryTip term="CIDR">Src Address</GlossaryTip></th>
                  <th><GlossaryTip term="CIDR">Dst Address</GlossaryTip></th>
                  <th>Comment</th>
                  <th>Penjelasan</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filtered = applyColFilter('firewall-filter', applyFilter(firewall.filter));
                  return filtered.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Filter rules match.</td></tr>
                  ) : filtered.map((rule, idx) => (
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
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('firewall-filter', rule)}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );

  const renderFirewallNAT = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Share2 className="summary-card-icon" />
        <h2 className="section-title">Firewall NAT Rules</h2>
      </div>
      <HelpPanel id="firewall-nat" onNavigate={setActiveTab} />
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Network Address Translation modifies IP addresses of passing packets.
      </p>
      {renderColFilterBar('firewall-nat', [
        { key: 'action',   label: 'Action',   options: ['masquerade', 'dst-nat', 'src-nat', 'netmap', 'redirect', 'accept'] },
        { key: 'chain',    label: 'Chain',    options: ['srcnat', 'dstnat'] },
        { key: 'protocol', label: 'Protokol', options: ['tcp', 'udp', 'icmp'] },
      ])}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th><GlossaryTip term="Masquerade">Action</GlossaryTip></th>
              <th><GlossaryTip term="Chain">Chain</GlossaryTip></th>
              <th>Protocol / Port</th>
              <th><GlossaryTip term="NAT">To Addresses</GlossaryTip></th>
              <th>Comment</th>
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const filtered = applyColFilter('firewall-nat', applyFilter(firewall.nat));
              return filtered.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No NAT rules match.</td></tr>
              ) : filtered.map((rule, idx) => (
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
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('firewall-nat', rule)}</td>
                </tr>
              ));
            })()}
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
      <HelpPanel id="firewall-mangle" onNavigate={setActiveTab} />
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
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {(!firewall.mangle || applyFilter(firewall.mangle).length === 0) ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Mangle rules match search.</td></tr>
            ) : (
              applyFilter(firewall.mangle).map((rule, idx) => (
                <tr key={idx} style={{ opacity: rule.disabled === 'yes' ? 0.6 : 1 }}>
                  <td><span className="badge badge-info">{rule.action}</span></td>
                  <td>{rule.chain}</td>
                  <td>{rule.protocol || 'Any'}</td>
                  <td>{rule['new-connection-mark'] || rule['new-routing-mark'] || rule['new-packet-mark'] || '-'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{rule.comment || '-'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('firewall-mangle', rule)}</td>
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
      <HelpPanel id="firewall-raw" onNavigate={setActiveTab} />
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
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {(!firewall.raw || applyFilter(firewall.raw).length === 0) ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Raw rules match search.</td></tr>
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
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('firewall-raw', rule)}</td>
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
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {config.queues.trees.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Queue Trees configured.</td></tr>
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
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('queue-tree', qt)}</td>
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


      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Kind</th>
              <th>Classifier (PCQ)</th>
              <th>Limit (PCQ)</th>
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {config.queues.types.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Queue Types configured.</td></tr>
            ) : (
              config.queues.types.map((qt, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{qt.name}</td>
                  <td><span className="badge badge-info">{qt.kind}</span></td>
                  <td>{qt['pcq-classifier'] || '-'}</td>
                  <td>{qt['pcq-limit'] || '-'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('queue-type', qt)}</td>
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
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {vpn.wireguard.map((wg, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600 }}>{wg.name}</td>
                <td>{wg['listen-port']}</td>
                <td>{wg.mtu}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('vpn-wireguard', wg)}</td>
              </tr>
            ))}
            {vpn.wireguard.length === 0 && (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No WireGuard connections found.</td></tr>
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
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {[...vpn.ovpn.map(v => ({...v, _type: 'OpenVPN'})), ...vpn.l2tp.map(v => ({...v, _type: 'L2TP'}))].map((conn, idx) => (
              <tr key={idx} style={{ opacity: conn.disabled === 'yes' ? 0.6 : 1 }}>
                <td><span className="badge badge-info">{conn._type}</span></td>
                <td style={{ fontWeight: 600 }}>{conn.name}</td>
                <td>{conn.user || conn.profile || '-'}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('vpn-legacy', conn)}</td>
              </tr>
            ))}
            {(vpn.ovpn.length + vpn.l2tp.length) === 0 && (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No legacy VPN connections found.</td></tr>
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
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {(!vpn.wireguardPeers || vpn.wireguardPeers.length === 0) ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No WireGuard peers configured.</td></tr>
            ) : (
              vpn.wireguardPeers.map((peer, idx) => (
                <tr key={idx} style={{ opacity: peer.disabled === 'yes' ? 0.6 : 1 }}>
                  <td>{peer.disabled !== 'yes' ? <span className="badge badge-success">Active</span> : <span className="badge badge-neutral">Disabled</span>}</td>
                  <td style={{ fontWeight: 600 }}>{peer.interface}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{peer['public-key']}</td>
                  <td>{peer['allowed-address'] || 'Any'}</td>
                  <td>{peer['endpoint-address'] ? `${peer['endpoint-address']}:${peer['endpoint-port']||''}` : 'Dynamic'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{peer.comment || '-'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('vpn-wireguard-peer', peer)}</td>
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
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {(!config.tools || !config.tools.graphingInterfaces || config.tools.graphingInterfaces.length === 0) ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Interface Graphing configured.</td></tr>
            ) : (
              config.tools.graphingInterfaces.map((g, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{g.interface}</td>
                  <td>{g['allow-address'] || 'Any'}</td>
                  <td>{g['store-on-disk'] === 'no' ? 'No' : 'Yes'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('tool-graphing', g)}</td>
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
      <HelpPanel id="ip-services" onNavigate={setActiveTab} />


      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Service Name</th>
              <th>Port</th>
              <th>Address Mask</th>
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {config.services.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Services specified in config.</td></tr>
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
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('ip-service', svc)}</td>
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
      <HelpPanel id="system-identity" onNavigate={setActiveTab} />

      
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
        <h2 className="section-title">System Logging</h2>
      </div>
      <HelpPanel id="system-logging" onNavigate={setActiveTab} />
      
      <div className="data-table-container">
        <h3>Logging Actions</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Target</th>
              <th>Aksi</th>
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {config.systemLogActions.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No custom logging actions defined.</td></tr>
            ) : (
              config.systemLogActions.map((act, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{act.name || '-'}</td>
                  <td>{act.target || 'memory'}</td>
                  <td>
                    <button className="btn btn-primary" onClick={() => setSelectedItemDetail(act)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      <Activity size={14} /> Detail
                    </button>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('log-action', act)}</td>
                </tr>
              ))
            )}
           </tbody>
        </table>
      </div>

      <div className="data-table-container" style={{ marginTop: '20px' }}>
        <h3>Logging Rules</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Topics</th>
              <th>Action (Target)</th>
              <th>Aksi</th>
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {config.system.logging.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No specific logging rules defined.</td></tr>
            ) : (
              config.system.logging.map((log, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{log.topics || 'all'}</td>
                  <td>{log.action || 'memory'}</td>
                  <td>
                    <button className="btn btn-primary" onClick={() => setSelectedItemDetail(log)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      <Activity size={14} /> Detail
                    </button>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('log-rule', log)}</td>
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
      <HelpPanel id="system-snmp" onNavigate={setActiveTab} />
      
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

  const renderLTEApns = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Activity className="summary-card-icon" />
        <h2 className="section-title">LTE APN Profiles</h2>
      </div>
      <HelpPanel id="interfaces-lte" onNavigate={setActiveTab} />
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>APN Name</th><th>IP Type</th><th>Use Network APN</th><th>Penjelasan</th></tr></thead>
          <tbody>
            {config.lteApns?.map((item, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600 }}>{item.apn || 'default'}</td>
                <td>{item['ip-type'] || 'auto'}</td>
                <td>{item['use-network-apn'] === 'no' ? <span className="badge badge-warning">No</span> : <span className="badge badge-success">Yes</span>}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('lte-apn', item)}</td>
              </tr>
            ))}
            {(!config.lteApns || config.lteApns.length === 0) && (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada konfigurasi LTE APN.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSNMPCommunities = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Activity className="summary-card-icon" />
        <h2 className="section-title">SNMP Communities</h2>
      </div>
      <HelpPanel id="system-snmp-comm" onNavigate={setActiveTab} />
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Allowed Addresses</th><th>Penjelasan</th></tr></thead>
          <tbody>
            {config.snmpCommunities?.map((item, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600 }}>{item.name}</td>
                <td>{item.addresses || '::/0'}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('snmp-community', item)}</td>
              </tr>
            ))}
            {(!config.snmpCommunities || config.snmpCommunities.length === 0) && (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada konfigurasi SNMP Community.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderGeneralSettings = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Settings className="summary-card-icon" />
        <h2 className="section-title">General IP & System Settings</h2>
      </div>
      <HelpPanel id="system-settings" onNavigate={setActiveTab} />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }}>IP Settings</h3>
          <div><span style={{ color: 'var(--text-muted)' }}>Max Neighbor Entries: </span>{config.settings?.['max-neighbor-entries'] || '-'}</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--accent-secondary)' }}>IPv6 Settings</h3>
          <div><span style={{ color: 'var(--text-muted)' }}>IPv6 Status: </span>{config.ipv6Settings?.['disable-ipv6'] === 'yes' ? <span className="badge badge-warning">Disabled</span> : <span className="badge badge-success">Enabled</span>}</div>
          <div style={{ marginTop: '0.5rem' }}><span style={{ color: 'var(--text-muted)' }}>Max Neighbor Entries: </span>{config.ipv6Settings?.['max-neighbor-entries'] || '-'}</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--status-info)' }}>Detect Internet</h3>
          <div><span style={{ color: 'var(--text-muted)' }}>Detect Interface List: </span>{config.detectInternet?.['detect-interface-list'] || '-'}</div>
        </div>
      </div>
    </div>
  );

  const renderIpsecProfiles = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Lock className="summary-card-icon" />
        <h2 className="section-title">IPsec Profiles</h2>
      </div>
      <HelpPanel id="vpn-ipsec" onNavigate={setActiveTab} />
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>DPD Interval</th><th>DPD Max Failures</th><th>Penjelasan</th></tr></thead>
          <tbody>
            {config.ipsecProfiles?.map((item, idx) => (
              <tr key={idx}>
                <td>{item['dpd-interval'] || '-'}</td>
                <td>{item['dpd-maximum-failures'] || '-'}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('ipsec-profile', item)}</td>
              </tr>
            ))}
            {(!config.ipsecProfiles || config.ipsecProfiles.length === 0) && (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada konfigurasi IPsec Profile.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRoutingBfd = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Route className="summary-card-icon" />
        <h2 className="section-title">Routing BFD</h2>
      </div>
      <HelpPanel id="routing-bfd" onNavigate={setActiveTab} />
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Interfaces</th><th>Min Rx</th><th>Min Tx</th><th>Multiplier</th><th>Penjelasan</th></tr></thead>
          <tbody>
            {config.routingBfd?.map((item, idx) => (
              <tr key={idx} style={{ opacity: item.disabled === 'yes' ? 0.6 : 1 }}>
                <td style={{ fontWeight: 600 }}>{item.interfaces || 'all'}</td>
                <td>{item['min-rx'] || '-'}</td>
                <td>{item['min-tx'] || '-'}</td>
                <td>{item.multiplier || '-'}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('routing-bfd', item)}</td>
              </tr>
            ))}
            {(!config.routingBfd || config.routingBfd.length === 0) && (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada konfigurasi Routing BFD.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRoutingRules = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Route className="summary-card-icon" />
        <h2 className="section-title">Routing Rules</h2>
      </div>
      <HelpPanel id="routing-rules" onNavigate={setActiveTab} />
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Action</th><th>Src Address</th><th>Dst Address</th><th>Table</th><th>Penjelasan</th></tr></thead>
          <tbody>
            {config.routingRules?.map((item, idx) => (
              <tr key={idx} style={{ opacity: item.disabled === 'yes' ? 0.6 : 1 }}>
                <td>{item.action || 'lookup'}</td>
                <td>{item['src-address'] || 'Any'}</td>
                <td>{item['dst-address'] || 'Any'}</td>
                <td style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>{item.table || 'main'}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('routing-rule', item)}</td>
              </tr>
            ))}
            {(!config.routingRules || config.routingRules.length === 0) && (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada konfigurasi Routing Rules.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderConnectionTracking = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Shield className="summary-card-icon" />
        <h2 className="section-title">Connection Tracking</h2>
      </div>
      <HelpPanel id="firewall-tracking" onNavigate={setActiveTab} />
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        {config.firewall?.connectionTracking ? (
          <div>
            <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>UDP Timeout</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{config.firewall.connectionTracking['udp-timeout'] || '-'}</div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Pengaturan default atau tidak ditemukan.</div>
        )}
      </div>
    </div>
  );

  const renderOpenVPNServer = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Lock className="summary-card-icon" />
        <h2 className="section-title">OpenVPN Server</h2>
      </div>
      <HelpPanel id="vpn-ovpn-server" onNavigate={setActiveTab} />
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Server Name</th><th>Auth</th><th>MAC Address</th><th>Penjelasan</th></tr></thead>
          <tbody>
            {config.vpn?.ovpnServers?.map((item, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600 }}>{item.name || 'Server'}</td>
                <td>{item.auth || 'any'}</td>
                <td>{item['mac-address'] || '-'}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('vpn-ovpn-server', item)}</td>
              </tr>
            ))}
            {(!config.vpn?.ovpnServers || config.vpn.ovpnServers.length === 0) && (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada layanan OpenVPN Server.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPorts = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Key className="summary-card-icon" />
        <h2 className="section-title">Serial / Hardware Ports</h2>
      </div>
      <HelpPanel id="system-ports" onNavigate={setActiveTab} />

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Baud Rate</th>
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {config.ports.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Ports configured.</td></tr>
            ) : (
              config.ports.map((p, idx) => (
                <tr key={idx}>
                  <td>{p[0] || p.id || idx}</td>
                  <td style={{ fontWeight: 600 }}>{p.name || `serial${idx}`}</td>
                  <td>{p['baud-rate'] || 'auto'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('port', p)}</td>
                </tr>
              ))
            )}
           </tbody>
        </table>
      </div>
    </div>
  );

  // Placeholder render functions for new menus - to be implemented
  const renderPlaceholder = (title, helpId = null) => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Settings className="summary-card-icon" />
        <h2 className="section-title">{title}</h2>
      </div>
      {helpId && <HelpPanel id={helpId} onNavigate={setActiveTab} />}
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

  const renderSystemNTPClient = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Clock className="summary-card-icon" />
        <h2 className="section-title">NTP Client</h2>
      </div>
      <HelpPanel id="system-ntp-client" onNavigate={setActiveTab} />
      <div className="data-table-container">
        <table className="data-table">
          <tbody>
            <tr>
              <td style={{ width: '220px', fontWeight: 600, color: 'var(--text-muted)' }}>Enabled</td>
              <td>{config.system?.ntpClient?.enabled === 'yes'
                ? <span className="badge badge-success">Yes</span>
                : <span className="badge badge-neutral">No</span>}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Mode</td>
              <td>{config.system?.ntpClient?.mode || '-'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Servers</td>
              <td style={{ fontFamily: 'monospace' }}>
                {config.system?.ntpClient?.servers ||
                 config.system?.ntpClient?.['server-dns-names'] ||
                 (config.system?.ntpClient?.['primary-ntp']
                   ? `${config.system.ntpClient['primary-ntp']}${config.system.ntpClient['secondary-ntp'] ? `, ${config.system.ntpClient['secondary-ntp']}` : ''}`
                   : 'Tidak dikonfigurasi')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {(!config.system?.ntpClient || Object.keys(config.system.ntpClient).length === 0) && (
        <p style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>NTP Client tidak dikonfigurasi secara eksplisit.</p>
      )}
    </div>
  );

  const renderSystemNTPServer = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Clock className="summary-card-icon" />
        <h2 className="section-title">NTP Server</h2>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <tbody>
            <tr>
              <td style={{ width: '220px', fontWeight: 600, color: 'var(--text-muted)' }}>Enabled</td>
              <td>{config.system?.ntpServer?.enabled === 'yes'
                ? <span className="badge badge-success">Yes</span>
                : <span className="badge badge-neutral">No</span>}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Broadcast</td>
              <td>{config.system?.ntpServer?.broadcast === 'yes' ? 'Yes' : 'No'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Broadcast Addresses</td>
              <td style={{ fontFamily: 'monospace' }}>{config.system?.ntpServer?.['broadcast-addresses'] || '-'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Manycast</td>
              <td>{config.system?.ntpServer?.manycast === 'yes' ? 'Yes' : 'No'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {(!config.system?.ntpServer || Object.keys(config.system.ntpServer).length === 0) && (
        <p style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>NTP Server tidak dikonfigurasi.</p>
      )}
    </div>
  );

  // System Menu Placeholders (kept)
  const renderLiveData = (title) => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Activity className="summary-card-icon" />
        <h2 className="section-title">{title}</h2>
      </div>
      <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.5 }}>📡</div>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Data Live Router</h3>
        <p style={{ fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto' }}>
          <strong>{title}</strong> menampilkan data real-time dari router yang sedang aktif.
          Informasi ini tidak tersedia dalam file ekspor konfigurasi <code>.rsc</code>.
        </p>
      </div>
    </div>
  );

  const renderSystemLog = () => renderLiveData('System Log');
  const renderSystemHistory = () => renderLiveData('System History');

  const renderSystemUsers = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Key className="summary-card-icon" />
        <h2 className="section-title">System Users</h2>
      </div>
      <HelpPanel id="system-users" onNavigate={setActiveTab} />
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Group</th>
              <th>Allowed Addresses</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {(!config.system?.users || config.system.users.length === 0) ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada user custom. (User 'admin' default tidak tereksport ke .rsc)</td></tr>
            ) : (
              config.system.users.map((u, idx) => (
                <tr key={idx} style={{ opacity: u.disabled === 'yes' ? 0.6 : 1 }}>
                  <td style={{ fontWeight: 600 }}>{u.name || '-'}</td>
                  <td><span className="badge badge-info">{u.group || 'read'}</span></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{u.address || 'All'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.comment || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSystemGroups = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Key className="summary-card-icon" />
        <h2 className="section-title">System Groups</h2>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Policy</th>
              <th>Skin</th>
            </tr>
          </thead>
          <tbody>
            {(!config.system?.groups || config.system.groups.length === 0) ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada group custom. (Group default tidak tereksport)</td></tr>
            ) : (
              config.system.groups.map((g, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{g.name || '-'}</td>
                  <td style={{ fontSize: '0.8rem', maxWidth: '300px', wordBreak: 'break-word' }}>{g.policy || '-'}</td>
                  <td>{g.skin || 'default'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSystemPasswords = () => renderPlaceholder('System Passwords', 'system-passwords');
  const renderSystemSSH = () => renderPlaceholder('SSH', 'system-ssh');
  const renderSystemTelnet = () => renderPlaceholder('Telnet', 'system-telnet');
  const renderSystemWebFig = () => renderPlaceholder('WebFig', 'system-www');
  const renderSystemAPI = () => renderPlaceholder('API', 'system-api');
  const renderSystemFTP = () => renderPlaceholder('FTP', 'system-ftp');
  const renderSystemPackages = () => renderPlaceholder('Packages', 'system-packages');
  const renderSystemResources = () => renderLiveData('Resources');
  const renderSystemRouterBoard = () => renderLiveData('RouterBoard Info');
  const renderSystemHealth = () => renderLiveData('Health Monitor');
  const renderSystemLEDs = () => renderPlaceholder('LEDs', 'system-leds');

  const renderSystemWatchdog = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Activity className="summary-card-icon" />
        <h2 className="section-title">Watchdog</h2>
      </div>
      {(!config.system?.watchdog || Object.keys(config.system.watchdog).length === 0) ? (
        <p style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Watchdog tidak dikonfigurasi secara eksplisit (menggunakan pengaturan default sistem).
        </p>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <tbody>
              <tr>
                <td style={{ width: '220px', fontWeight: 600, color: 'var(--text-muted)' }}>Auto Send Supout</td>
                <td>{config.system.watchdog['auto-send-supout'] === 'yes' ? <span className="badge badge-success">Yes</span> : <span className="badge badge-neutral">No</span>}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Auto Update</td>
                <td>{config.system.watchdog['auto-update'] === 'yes' ? <span className="badge badge-success">Yes</span> : <span className="badge badge-neutral">No</span>}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Watch Address</td>
                <td style={{ fontFamily: 'monospace' }}>{config.system.watchdog['watch-address'] || 'Tidak dikonfigurasi'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Watchdog Timer</td>
                <td>{config.system.watchdog['watchdog-timer'] === 'yes' ? <span className="badge badge-success">Active</span> : <span className="badge badge-neutral">Inactive</span>}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderSystemScheduler = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Clock className="summary-card-icon" />
        <h2 className="section-title">Scheduler</h2>
      </div>
      <HelpPanel id="system-scheduler" onNavigate={setActiveTab} />
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Start Time</th>
              <th>Interval</th>
              <th>On Event</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(!config.system?.scheduler || config.system.scheduler.length === 0) ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada Scheduler yang dikonfigurasi.</td></tr>
            ) : (
              config.system.scheduler.map((sch, idx) => (
                <tr key={idx} style={{ opacity: sch.disabled === 'yes' ? 0.6 : 1 }}>
                  <td style={{ fontWeight: 600 }}>{sch.name || '-'}</td>
                  <td>{sch['start-time'] || 'startup'}</td>
                  <td>{sch.interval || '-'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sch['on-event'] || '-'}
                  </td>
                  <td>
                    {sch.disabled === 'yes'
                      ? <span className="badge badge-neutral">Disabled</span>
                      : <span className="badge badge-success">Active</span>}
                  </td>
                  <td>
                    <button className="btn btn-primary" onClick={() => setSelectedItemDetail(sch)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      <Activity size={14} /> Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSystemScripts = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Terminal className="summary-card-icon" />
        <h2 className="section-title">Scripts</h2>
      </div>
      <HelpPanel id="system-scripts" onNavigate={setActiveTab} />
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Policy</th>
              <th>Source (preview)</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(!config.system?.scripts || config.system.scripts.length === 0) ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada Script yang dikonfigurasi.</td></tr>
            ) : (
              config.system.scripts.map((sc, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{sc.name || '-'}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{sc.policy || 'default'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sc.source || '-'}
                  </td>
                  <td>
                    <button className="btn btn-primary" onClick={() => setSelectedItemDetail(sc)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      <Activity size={14} /> Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSystemBackup = () => renderPlaceholder('Backup', 'system-backup');
  const renderSystemReset = () => renderPlaceholder('Reset Configuration', 'system-reset');

  // IP Menu Placeholders
  const renderDHCPRelay = () => renderPlaceholder('DHCP Relay', 'ip-dhcp-relay');
  const renderUPnP = () => renderPlaceholder('UPnP', 'ip-upnp');
  const renderSOCKS = () => renderPlaceholder('SOCKS', 'ip-socks');
  const renderProxy = () => renderPlaceholder('Proxy', 'ip-proxy');
  const renderTrafficFlow = () => renderPlaceholder('Traffic Flow', 'ip-traffic-flow');
  const renderAccounting = () => renderPlaceholder('Accounting', 'ip-accounting');

  // Bridge Menu Placeholders
  const renderBridgeVLANs = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Layers className="summary-card-icon" />
        <h2 className="section-title">Bridge VLANs</h2>
      </div>
      <HelpPanel id="bridge-vlans" onNavigate={setActiveTab} />
      
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Bridge</th>
              <th>VLAN IDs</th>
              <th>Tagged</th>
              <th>Untagged</th>
            </tr>
          </thead>
          <tbody>
            {!bridgeVlans || bridgeVlans.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Bridge VLANs configured.</td></tr>
            ) : (
              bridgeVlans.map((vlan, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{vlan.bridge}</td>
                  <td><span className="badge badge-primary">{vlan['vlan-ids']}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {vlan.tagged ? vlan.tagged.split(',').map((t, i) => (
                        <span key={i} className="badge badge-info">{t}</span>
                      )) : '-'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {vlan.untagged ? vlan.untagged.split(',').map((u, i) => (
                        <span key={i} className="badge badge-success">{u}</span>
                      )) : '-'}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Routing Menu Placeholders
  const renderRoutingFilters = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Route className="summary-card-icon" />
        <h2 className="section-title">Routing Filters</h2>
      </div>
      <HelpPanel id="routing-filters" onNavigate={setActiveTab} />
      
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Chain</th>
              <th>Action</th>
              <th>Aksi</th>
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {config.routingFilterRules.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No routing filter rules defined.</td></tr>
            ) : (
              config.routingFilterRules.map((flt, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{flt.chain || 'unknown'}</td>
                  <td>{flt.action || 'accept'}</td>
                  <td>
                    <button className="btn btn-primary" onClick={() => setSelectedItemDetail(flt)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      <Activity size={14} /> Detail
                    </button>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('routing-filter', flt)}</td>
                </tr>
              ))
            )}
           </tbody>
        </table>
      </div>
    </div>
  );

  const renderOSPF = () => renderPlaceholder('OSPF', 'routing-ospf');
  const renderRIP = () => renderPlaceholder('RIP', 'routing-rip');

  const renderBGP = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Route className="summary-card-icon" />
        <h2 className="section-title">Border Gateway Protocol (BGP)</h2>
      </div>
      <HelpPanel id="routing-bgp" onNavigate={setActiveTab} />
      
      <div className="data-table-container">
        <h3>BGP Templates</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>AS Number</th>
              <th>Router ID</th>
              <th>Aksi</th>
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {config.routingBgpTmpl.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No BGP templates defined.</td></tr>
            ) : (
              config.routingBgpTmpl.map((bgp, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{bgp.name || 'default'}</td>
                  <td>{bgp.as || '-'}</td>
                  <td>{bgp['router-id'] || 'auto'}</td>
                  <td>
                    <button className="btn btn-primary" onClick={() => setSelectedItemDetail(bgp)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      <Activity size={14} /> Detail
                    </button>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('routing-bgp-tmpl', bgp)}</td>
                </tr>
              ))
            )}
           </tbody>
        </table>
      </div>

      <div className="data-table-container" style={{ marginTop: '20px' }}>
        <h3>BGP Connections (Peers)</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Remote Address</th>
              <th>Remote AS</th>
              <th>Aksi</th>
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {config.routingBgpConn.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No BGP connections defined.</td></tr>
            ) : (
              config.routingBgpConn.map((conn, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{conn.name || `peer-${idx}`}</td>
                  <td>{conn['remote.address'] || '-'}</td>
                  <td>{conn['remote.as'] || '-'}</td>
                  <td>
                    <button className="btn btn-primary" onClick={() => setSelectedItemDetail(conn)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      <Activity size={14} /> Detail
                    </button>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('routing-bgp-conn', conn)}</td>
                </tr>
              ))
            )}
           </tbody>
        </table>
      </div>
    </div>
  );

  const renderPPPoEServers = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Lock className="summary-card-icon" />
        <h2 className="section-title">PPPoE Servers</h2>
      </div>
      <HelpPanel id="ppp-pppoe-server" onNavigate={setActiveTab} />
      
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Service Name</th>
              <th>Interface</th>
              <th>Default Profile</th>
              <th>Aksi</th>
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {config.ppp.pppoeServers.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No PPPoE Servers defined.</td></tr>
            ) : (
              config.ppp.pppoeServers.map((srv, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{srv['service-name'] || 'service1'}</td>
                  <td>{srv.interface || '-'}</td>
                  <td>{srv['default-profile'] || 'default'}</td>
                  <td>
                    <button className="btn btn-primary" onClick={() => setSelectedItemDetail(srv)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      <Activity size={14} /> Detail
                    </button>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('pppoe-server', srv)}</td>
                </tr>
              ))
            )}
           </tbody>
        </table>
      </div>
    </div>
  );
  const renderMPLS = () => renderPlaceholder('MPLS', 'routing-mpls');
  const renderVRF = () => renderPlaceholder('VRF', 'routing-vrf');

  const renderLayer7Protocols = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Shield className="summary-card-icon" />
        <h2 className="section-title">Layer7 Protocols</h2>
      </div>
      <HelpPanel id="firewall-layer7" onNavigate={setActiveTab} />
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Regexp (preview)</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(!config.firewall?.layer7 || config.firewall.layer7.length === 0) ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada Layer7 Protocol yang dikonfigurasi.</td></tr>
            ) : (
              config.firewall.layer7.map((l7, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{l7.name || '-'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l7.regexp || '-'}
                  </td>
                  <td>
                    <button className="btn btn-primary" onClick={() => setSelectedItemDetail(l7)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      <Activity size={14} /> Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Queues Menu Placeholders
  const renderSimpleQueues = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Activity className="summary-card-icon" />
        <h2 className="section-title">Simple Queues</h2>
      </div>
      <HelpPanel id="queues-simple" onNavigate={setActiveTab} />
      
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Target</th>
              <th>Max Limit</th>
              <th>Aksi</th>
              <th>Penjelasan</th>
            </tr>
          </thead>
          <tbody>
            {config.queues.simple.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Simple Queues defined.</td></tr>
            ) : (
              config.queues.simple.map((sq, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{sq.name || `queue-${idx}`}</td>
                  <td>{sq.target || '-'}</td>
                  <td>{sq['max-limit'] || 'unlimited'}</td>
                  <td>
                    <button className="btn btn-primary" onClick={() => setSelectedItemDetail(sq)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      <Activity size={14} /> Detail
                    </button>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{generateItemExplanation('queue-simple', sq)}</td>
                </tr>
              ))
            )}
           </tbody>
        </table>
      </div>
    </div>
  );
  const renderInterfaceQueues = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <DownloadCloud className="summary-card-icon" />
        <h2 className="section-title">Interface Queues</h2>
      </div>
      <HelpPanel id="queues-interfaces" onNavigate={setActiveTab} />
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Interface</th>
              <th>Queue Type</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(!config.queues?.interfaceQueues || config.queues.interfaceQueues.length === 0) ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada konfigurasi Interface Queue. (Menggunakan pengaturan default per interface)</td></tr>
            ) : (
              config.queues.interfaceQueues.map((q, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{safeStr(q.name || q.interface)}</td>
                  <td>{safeStr(q['queue-type'] || 'default-small')}</td>
                  <td>
                    <button className="btn btn-primary" onClick={() => setSelectedItemDetail(q)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      <Activity size={14} /> Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Tools Menu Placeholders
  const renderPing = () => renderPlaceholder('Ping', 'tools-ping');
  const renderTraceroute = () => renderPlaceholder('Traceroute', 'tools-traceroute');
  const renderBandwidthTest = () => renderPlaceholder('Bandwidth Test', 'tools-bandwidth-test');
  const renderTorch = () => renderPlaceholder('Torch', 'tools-torch');
  const renderPacketSniffer = () => renderPlaceholder('Packet Sniffer', 'tools-packet-sniffer');
  const renderProfile = () => renderPlaceholder('Profile', 'tools-profile');
  const renderNetwatch = () => renderPlaceholder('Netwatch', 'tools-netwatch');
  const renderSMS = () => renderPlaceholder('SMS', 'tools-sms');
  const renderEmail = () => renderPlaceholder('Email', 'tools-email');
  const renderRoMON = () => renderPlaceholder('RoMON', 'tools-romon');
  const renderMACServer = () => renderPlaceholder('MAC Server', 'tools-mac-server');
  const renderMACWinbox = () => renderPlaceholder('MAC Winbox', 'tools-mac-winbox');
  const renderWinboxSettings = () => renderPlaceholder('Winbox Settings', 'tools-winbox');

  const renderWirelessInterfaces = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Wifi className="summary-card-icon" />
        <h2 className="section-title">Wireless Interfaces</h2>
      </div>
      <HelpPanel id="wireless-interfaces" onNavigate={setActiveTab} />
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>SSID</th>
              <th>Mode</th>
              <th>Band</th>
              <th>Frequency</th>
              <th>Security Profile</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(!config.wireless?.interfaces || config.wireless.interfaces.length === 0) ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada konfigurasi Wireless Interface.</td></tr>
            ) : (
              config.wireless.interfaces.map((iface, idx) => (
                <tr key={idx} style={{ opacity: iface.disabled === 'yes' ? 0.6 : 1 }}>
                  <td style={{ fontWeight: 600 }}>{iface.name || iface['default-name'] || '-'}</td>
                  <td>{iface.ssid || '-'}</td>
                  <td><span className="badge badge-info">{iface.mode || '-'}</span></td>
                  <td>{iface.band || '-'}</td>
                  <td>{iface.frequency || iface.channel || '-'}</td>
                  <td>{iface['security-profile'] || 'default'}</td>
                  <td>
                    {iface.disabled === 'yes'
                      ? <span className="badge badge-neutral">Disabled</span>
                      : <span className="badge badge-success">Active</span>}
                  </td>
                  <td>
                    <button className="btn btn-primary" onClick={() => setSelectedItemDetail(iface)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      <Activity size={14} /> Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderWirelessSecurity = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Shield className="summary-card-icon" />
        <h2 className="section-title">Wireless Security Profiles</h2>
      </div>
      <HelpPanel id="wireless-security" onNavigate={setActiveTab} />
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Mode</th>
              <th>Auth Types</th>
              <th>Unicast Ciphers</th>
              <th>Group Ciphers</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(!config.wireless?.securityProfiles || config.wireless.securityProfiles.length === 0) ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada Security Profile yang dikonfigurasi.</td></tr>
            ) : (
              config.wireless.securityProfiles.map((sp, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{sp.name || '-'}</td>
                  <td><span className="badge badge-info">{sp.mode || 'none'}</span></td>
                  <td>{sp['authentication-types'] || '-'}</td>
                  <td>{sp['unicast-ciphers'] || '-'}</td>
                  <td>{sp['group-ciphers'] || '-'}</td>
                  <td>
                    <button className="btn btn-primary" onClick={() => setSelectedItemDetail(sp)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      <Activity size={14} /> Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderWirelessAccessList = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Wifi className="summary-card-icon" />
        <h2 className="section-title">Wireless Access List</h2>
      </div>
      <HelpPanel id="wireless-access-list" onNavigate={setActiveTab} />
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>MAC Address</th>
              <th>Interface</th>
              <th>Action</th>
              <th>Signal Range</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {(!config.wireless?.accessList || config.wireless.accessList.length === 0) ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada konfigurasi Access List.</td></tr>
            ) : (
              config.wireless.accessList.map((item, idx) => (
                <tr key={idx} style={{ opacity: item.disabled === 'yes' ? 0.6 : 1 }}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item['mac-address'] || 'any'}</td>
                  <td>{item.interface || 'any'}</td>
                  <td>
                    <span className={`badge ${item.action === 'accept' ? 'badge-success' : item.action === 'reject' ? 'badge-error' : 'badge-neutral'}`}>
                      {item.action || 'accept'}
                    </span>
                  </td>
                  <td>{item['signal-range'] ? `${item['signal-range']} dBm` : '-'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.comment || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderWirelessConnectList = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Wifi className="summary-card-icon" />
        <h2 className="section-title">Wireless Connect List</h2>
      </div>
      <HelpPanel id="wireless-connect-list" onNavigate={setActiveTab} />
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>SSID</th>
              <th>MAC Address</th>
              <th>Interface</th>
              <th>Security Profile</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(!config.wireless?.connectList || config.wireless.connectList.length === 0) ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada konfigurasi Connect List.</td></tr>
            ) : (
              config.wireless.connectList.map((item, idx) => (
                <tr key={idx} style={{ opacity: item.disabled === 'yes' ? 0.6 : 1 }}>
                  <td style={{ fontWeight: 600 }}>{item.ssid || 'any'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{item['mac-address'] || 'any'}</td>
                  <td>{item.interface || 'any'}</td>
                  <td>{item['security-profile'] || 'default'}</td>
                  <td>
                    {item.disabled === 'yes'
                      ? <span className="badge badge-neutral">Disabled</span>
                      : <span className="badge badge-success">Active</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPPPProfiles = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Lock className="summary-card-icon" />
        <h2 className="section-title">PPP Profiles</h2>
      </div>
      <HelpPanel id="ppp-profiles" onNavigate={setActiveTab} />
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Local Address</th>
              <th>Remote Address</th>
              <th>Rate Limit</th>
              <th>DNS Server</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(!config.ppp?.profiles || config.ppp.profiles.length === 0) ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada PPP Profile yang dikonfigurasi.</td></tr>
            ) : (
              config.ppp.profiles.map((p, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{p.name || '-'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{p['local-address'] || '-'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{p['remote-address'] || '-'}</td>
                  <td>{p['rate-limit'] || 'unlimited'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{p['dns-server'] || '-'}</td>
                  <td>
                    <button className="btn btn-primary" onClick={() => setSelectedItemDetail(p)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      <Activity size={14} /> Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPPPSecrets = () => (
    <div className="glass-panel config-section animate-fade-in">
      <div className="section-header">
        <Key className="summary-card-icon" />
        <h2 className="section-title">PPP Secrets</h2>
      </div>
      <HelpPanel id="ppp-secrets" onNavigate={setActiveTab} />
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Service</th>
              <th>Profile</th>
              <th>Local Address</th>
              <th>Remote Address</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(!config.ppp?.secrets || config.ppp.secrets.length === 0) ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada PPP Secret yang dikonfigurasi.</td></tr>
            ) : (
              config.ppp.secrets.map((s, idx) => (
                <tr key={idx} style={{ opacity: s.disabled === 'yes' ? 0.6 : 1 }}>
                  <td style={{ fontWeight: 600 }}>{s.name || '-'}</td>
                  <td><span className="badge badge-info">{s.service || 'any'}</span></td>
                  <td>{s.profile || 'default'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{s['local-address'] || '-'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{s['remote-address'] || '-'}</td>
                  <td>
                    {s.disabled === 'yes'
                      ? <span className="badge badge-neutral">Disabled</span>
                      : <span className="badge badge-success">Active</span>}
                  </td>
                  <td>
                    <button className="btn btn-primary" onClick={() => setSelectedItemDetail(s)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      <Activity size={14} /> Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPPPActive = () => renderLiveData('PPP Active Connections');

  // Files Menu Placeholders
  const renderFilesList = () => renderPlaceholder('Files List', 'files-list');
  const renderFilesBackup = () => renderPlaceholder('Files Backup', 'files-backup');

  // User Manager Menu Placeholders
  const renderUserManagerUsers = () => renderPlaceholder('User Manager Users', 'user-manager-users');
  const renderUserManagerProfiles = () => renderPlaceholder('User Manager Profiles', 'user-manager-profiles');
  const renderUserManagerSessions = () => renderPlaceholder('User Manager Sessions', 'user-manager-sessions');

  // CAPsMAN Menu Placeholders
  const renderCAPsMANInterfaces = () => renderPlaceholder('CAPsMAN Interfaces', 'capsman-interfaces');
  const renderCAPsMANProvisioning = () => renderPlaceholder('CAPsMAN Provisioning', 'capsman-provisioning');
  const renderCAPsMANAccessList = () => renderPlaceholder('CAPsMAN Access List', 'capsman-access-list');
  const renderCAPsMANConfiguration = () => renderPlaceholder('CAPsMAN Configuration', 'capsman-configuration');

  const renderLTEInterfaces = () => renderPlaceholder('LTE Interfaces', 'lte-interfaces');
  const renderLTEAPN = () => renderPlaceholder('LTE APN Profiles', 'lte-apn');
  const renderLTEInfo = () => renderLiveData('LTE Info');
  const renderGPSSettings = () => renderPlaceholder('GPS Settings', 'gps-settings');
  const renderGPSMonitor = () => renderLiveData('GPS Monitor');

  const renderNeighbors = () => renderLiveData('Neighbors (LLDP/CDP)');
  const renderLog = () => renderLiveData('Log');
  const renderSkin = () => renderPlaceholder('Skin', 'skin');

  return (
    <>
    <div className="dashboard-layout">
      {renderSidebar()}
      
      <div className="main-view">
        {searchTerm && (
          <div className="search-active-banner">
            <Search size={12} />
            Mencari: <strong>"{searchTerm}"</strong> — tabel menampilkan baris yang cocok saja
            <button onClick={() => {}} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '0.78rem', opacity: 0.7 }}>
              (gunakan ⌘K atau search bar untuk ubah)
            </button>
          </div>
        )}
        {/* Keyboard shortcut hint button */}
        <button onClick={() => setShowShortcuts(true)} title="Keyboard shortcuts (?)"
          style={{
            position: 'fixed', bottom: 28, left: sidebarCollapsed ? '76px' : '268px',
            zIndex: 100, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.75rem',
            color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'left 0.2s',
          }}>
          <kbd style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>?</kbd>
          Shortcuts
        </button>

        <SectionErrorBoundary>
        {activeTab === 'health-check' && renderHealthCheck()}
        {activeTab === 'network-topology' && <NetworkTopology config={config} onNavigate={setActiveTab} />}
        {activeTab === 'packet-tracer' && <PacketTracer config={config} onNavigate={setActiveTab} />}
        {activeTab === 'config-compare' && (
          <div className="glass-panel config-section animate-fade-in">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <BarChart2 className="summary-card-icon" />
              <h2 className="section-title">Config Comparison</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              Bandingkan dua file konfigurasi MikroTik (.rsc) dan lihat apa yang berubah — berguna untuk review sebelum upgrade atau audit perubahan konfigurasi.
            </p>
            <ConfigComparison />
          </div>
        )}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'mindmap' && <MindMap config={config} onNavigate={setActiveTab} />}
        {activeTab === 'osi-tcp' && <OsiTcpView config={config} onNavigate={setActiveTab} />}
        {activeTab === 'interfaces-list' && renderInterfaces()}
        {activeTab === 'interfaces-ethernet' && renderEthernet()}
        {activeTab === 'interfaces-lists' && renderInterfaceLists()}
        
        {/* Bridge Menus */}
        {activeTab === 'bridge-list' && renderBridges()}
        {activeTab === 'bridge-ports' && renderBridgePorts()}

        {/* Fallback for interfaces parent click if submenus logic routes there */}
        {activeTab === 'interfaces' && renderInterfaces()}
        {activeTab === 'interfaces-lte' && renderLTEApns()}
        
        {/* VPN */}
        {activeTab === 'vpn-ipsec' && renderIpsecProfiles()}
        {activeTab === 'vpn-ovpn-server' && renderOpenVPNServer()}
        
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
        {activeTab === 'system-snmp-comm' && renderSNMPCommunities()}
        {activeTab === 'system-settings' && renderGeneralSettings()}

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
        {activeTab === 'routing-bfd' && renderRoutingBfd()}
        {activeTab === 'routing-rules' && renderRoutingRules()}
        {activeTab === 'routing-filters' && renderRoutingFilters()}
        {activeTab === 'routing-ospf' && renderOSPF()}
        {activeTab === 'routing-rip' && renderRIP()}
        {activeTab === 'routing-bgp' && renderBGP()}
        {activeTab === 'routing-mpls' && renderMPLS()}
        {activeTab === 'routing-vrf' && renderVRF()}

        {/* New Firewall Menus */}
        {activeTab === 'firewall-tracking' && renderConnectionTracking()}
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
        {activeTab === 'ppp-pppoe-server' && renderPPPoEServers()}
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
        {activeTab === 'firewall-conflicts' && (
          <div className="glass-panel config-section animate-fade-in">
            <div className="section-header" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield className="summary-card-icon" />
                <h2 className="section-title">Firewall Conflict Detector</h2>
                {(conflictAnalysis.conflicts.length + conflictAnalysis.duplicates.length) > 0 && (
                  <span className="badge badge-error">{conflictAnalysis.conflicts.length + conflictAnalysis.duplicates.length} masalah</span>
                )}
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.7 }}>
              Alat ini mendeteksi firewall rules yang <strong>tidak akan pernah dieksekusi</strong> karena tertutup oleh rule sebelumnya, dan rules <strong>duplikat</strong> yang perlu dibersihkan.
            </p>
            <FirewallConflicts rules={firewall.filter || []} onNavigate={setActiveTab} />
          </div>
        )}
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

    {/* Keyboard shortcuts panel */}
    {showShortcuts && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={() => setShowShortcuts(false)}>
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '28px 32px', minWidth: '360px', maxWidth: '480px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>⌨️ Keyboard Shortcuts</h3>
            <button onClick={() => setShowShortcuts(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>×</button>
          </div>
          <div style={{ display: 'grid', gap: '6px' }}>
            {[
              ['O', 'Overview'],
              ['H', 'Cek Kesehatan (Health Check)'],
              ['T', 'Topologi Jaringan'],
              ['P', 'Packet Tracer'],
              ['F', 'Firewall Filter Rules'],
              ['X', 'Firewall Conflict Detector'],
              ['N', 'Firewall NAT'],
              ['R', 'IP Routes'],
              ['D', 'DHCP Server'],
              ['C', 'Config Comparison'],
              ['?', 'Tampilkan/Sembunyikan panel ini'],
              ['Esc', 'Tutup modal / panel'],
            ].map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-base)' }}>
                <kbd style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: '36px', padding: '2px 8px', borderRadius: '4px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace',
                  boxShadow: '0 2px 0 var(--border)',
                }}>{key}</kbd>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '16px', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Shortcuts tidak aktif ketika cursor ada di dalam input field
          </div>
        </div>
      </div>
    )}

    {/* Toast notification */}
    {toast && (
      <div style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
        background: 'var(--bg-elevated)', border: '1px solid var(--accent)',
        borderRadius: 'var(--r-md)', padding: '10px 18px',
        color: 'var(--text-primary)', fontSize: '0.84rem', fontWeight: 500,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', gap: '10px',
        animation: 'fadeIn 0.18s ease',
        maxWidth: 320,
      }}>
        <CheckCircle2 size={15} style={{ color: 'var(--accent-light)', flexShrink: 0 }} />
        {toast}
      </div>
    )}
    </>
  );
};
