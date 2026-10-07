
/**
 * Menu entries that only render the "under development" panel.
 *
 * The sidebar marks these so the navigation does not promise sections that have
 * no content yet. The list is declared once here rather than inferred at render
 * time, and tests/menus.test.js cross-checks it against the routing in
 * Dashboard.jsx, so an entry cannot silently drift out of sync.
 */
export const PLACEHOLDER_TABS = new Set([
  'capsman-access-list',
  'capsman-configuration',
  'capsman-interfaces',
  'capsman-provisioning',
  'files-backup',
  'files-list',
  'gps-settings',
  'ip-accounting',
  'ip-dhcp-relay',
  'ip-proxy',
  'ip-socks',
  'ip-traffic-flow',
  'ip-upnp',
  'lte-apn',
  'lte-interfaces',
  'routing-mpls',
  'routing-ospf',
  'routing-rip',
  'routing-vrf',
  'skin',
  'system-api',
  'system-backup',
  'system-ftp',
  'system-leds',
  'system-packages',
  'system-passwords',
  'system-reset',
  'system-ssh',
  'system-telnet',
  'system-www',
  'tools-bandwidth-test',
  'tools-email',
  'tools-mac-server',
  'tools-mac-winbox',
  'tools-netwatch',
  'tools-packet-sniffer',
  'tools-ping',
  'tools-profile',
  'tools-romon',
  'tools-sms',
  'tools-torch',
  'tools-traceroute',
  'tools-winbox',
  'user-manager-profiles',
  'user-manager-sessions',
  'user-manager-users',
]);
