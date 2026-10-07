import {
  Server, Activity, Shield, Wifi, Share2, Route, DownloadCloud,
  Lock, Globe, Settings, Terminal, Monitor, Key, BarChart2, Layers, FileText,
  Heart, Zap,
} from 'lucide-react';

// Sidebar definition. Kept in its own module so the 136-entry array is not
// rebuilt on every render. The two counts come from healthAnalysis, which is
// per-config, so they are arguments rather than module constants.
export const buildMenus = ({ criticalCount, warningCount }) => [
  { id: 'overview', label: 'Overview', icon: <Server size={15} /> },
  {
    id: 'health-check',
    label: 'Cek Kesehatan',
    icon: <Heart size={15} />,
    badge: criticalCount > 0
      ? { count: criticalCount, color: '#ef4444' }
      : warningCount > 0
        ? { count: warningCount, color: '#f97316' }
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
