/**
 * Parser for MikroTik RouterOS .rsc export files.
 * Transforms the text file into a structured JSON object.
 */

// Thrown when the input cannot be a MikroTik export at all. The UI shows
// `message` verbatim, so it must read as a user-facing sentence, not a
// developer-facing one.
export class ConfigParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigParseError';
  }
}

/**
 * Join a continued line with the next fragment.
 * RouterOS wraps long lines with a trailing backslash. The backslash itself is
 * not a token separator, so a space has to be restored when neither side
 * already provides one. Without this, `comment=abc\` + `disabled=no` collapses
 * into the single token `comment=abcdisabled=no`.
 */
const joinContinued = (buffer, next) => {
  if (!buffer) return next;
  const needsSpace = !/\s$/.test(buffer) && !/^\s/.test(next);
  return needsSpace ? `${buffer} ${next}` : buffer + next;
};

export const parseMikroTikConfig = (fileContent) => {
  if (typeof fileContent !== 'string' || !fileContent.trim()) {
    throw new ConfigParseError(
      'File kosong atau tidak terbaca. Pilih file .rsc hasil export dari MikroTik.'
    );
  }

  const lines = fileContent.split('\n');
  const config = {
    metadata: {
      model: '',
      serialNumber: '',
      softwareId: '',
      generatedAt: '',
      identity: ''
    },
    interfaces: [],
    ipAddresses: [],
    pools: [],
    routes: [],
    wireless: {
      interfaces: [],
      securityProfiles: [],
      accessList: [],
      connectList: []
    },
    vpn: {
      l2tp: [],
      pptp: [],
      ovpn: [],
      ovpnServers: [],
      wireguard: [],
      wireguardPeers: []
    },
    ppp: {
      pppoeServers: [],
      profiles: [],
      secrets: []
    },
    firewall: {
      filter: [],
      nat: [],
      mangle: [],
      raw: [],
      addressLists: [],
      connectionTracking: {},
      layer7: []
    },
    vlans: [],
    bridgeVlans: [],
    hotspot: {
      servers: [],
      profiles: [],
      userProfiles: [],
      users: [],
      bindings: [],
      servicePorts: [],
      walledGarden: [],
      walledGardenIp: []
    },
    queues: {
      types: [],
      trees: [],
      simple: [],
      interfaceQueues: []
    },
    routingTables: [],
    interfaceLists: [],
    interfaceListMembers: [],
    system: {
      clock: {},
      logging: [],
      users: [],
      groups: [],
      ntpClient: {},
      ntpServer: {},
      scheduler: [],
      scripts: [],
      watchdog: {}
    },
    systemLogActions: [],
    snmp: {},
    ports: [],
    services: [],
    dhcp: {
      servers: [],
      networks: [],
      clients: []
    },
    dns: {
      static: [],
      servers: []
    },
    bridges: [],
    bridgePorts: [],
    cloud: {},
    tools: {
      graphingInterfaces: []
    },
    lteApns: [],
    snmpCommunities: [],
    settings: {},
    ipv6Settings: {},
    detectInternet: {},
    ipsecProfiles: [],
    routingBfd: [],
    routingRules: [],
    routingBgpTmpl: [],
    routingBgpConn: [],
    routingFilterRules: [],
    rawSections: {}
  };

  let currentPath = '';
  let sawCommand = false;

  // Gabungkan baris yang diakhiri backslash sebelum baris lain diproses.
  const mergedLines = [];
  let currentMergedLine = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.endsWith('\\')) {
      currentMergedLine = joinContinued(currentMergedLine, line.slice(0, -1));
    } else {
      currentMergedLine = joinContinued(currentMergedLine, line);
      if (currentMergedLine) mergedLines.push(currentMergedLine);
      currentMergedLine = '';
    }
  }
  // Baris terakhir yang diakhiri backslash tidak pernah masuk cabang di atas,
  // jadi sisa teksnya harus dikeluarkan di sini. Kalau dibuang, perintah
  // terakhir export hilang tanpa jejak.
  if (currentMergedLine) mergedLines.push(currentMergedLine);

  for (let line of mergedLines) {
    if (!line || line === '#') continue;

    // Parse Metadata from comments
    if (line.startsWith('#')) {
      if (line.includes('by RouterOS')) config.metadata.generatedAt = line.replace('#', '').trim();
      else if (line.includes('software id =')) config.metadata.softwareId = line.split('=')[1].trim();
      else if (line.includes('model =')) config.metadata.model = line.split('=')[1].trim();
      else if (line.includes('serial number =')) config.metadata.serialNumber = line.split('=')[1].trim();
      continue;
    }

    // Change context path
    if (line.startsWith('/')) {
      currentPath = line;
      if (!config.rawSections[currentPath]) {
        config.rawSections[currentPath] = [];
      }
      continue;
    }

    // Accumulate commands in rawSections
    if (currentPath && ADD_SET_RE.test(line)) {
      const parsedCommand = parseCommandArgs(line);
      config.rawSections[currentPath].push({
        type: line.startsWith('add') ? 'add' : 'set',
        ...parsedCommand
      });
      mapToStructuredData(currentPath, parsedCommand, config);
      sawCommand = true;
    }
  }

  // An export always contains at least one section path, and usually at least
  // one command. Without this check a plain text file produces a fully shaped
  // but completely empty config, which the UI cannot distinguish from a real
  // but minimal router.
  if (!sawCommand && Object.keys(config.rawSections).length === 0) {
    throw new ConfigParseError(
      'File ini bukan export konfigurasi MikroTik. Tidak ditemukan baris section yang diawali "/" atau perintah add/set.'
    );
  }

  // Post process some data to make it dashboard friendly
  enrichDashboardData(config);

  return config;
};

// Extremely simple key-value parser for strings like: add address=192.168.88.1/24 comment=defconf disabled=yes interface=ether13
// This regex isn't perfect for all Mikrotik edge cases, but covers 90% of basic exports.
const parseCommandArgs = (line) => {
  const args = {};
  const cleaned = line.replace(/^(add|set)\s+/, '');
  
  // A naive approach: splitting by spaces that are not inside quotes
  const parts = cleaned.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx > -1) {
      const key = part.slice(0, eqIdx);
      const val = part.slice(eqIdx + 1).replace(/^"|"$/g, ''); // remove quotes
      args[key] = val;
    }
  }

  // Extract 'find' clauses if any (for set commands)
  const findMatch = line.match(/\[\s*find\s+([^\]]+)\s*\]/);
  if (findMatch) {
    const findArgs = parseCommandArgs(findMatch[1]);
    args._find = findArgs;
  }

  return args;
};

// Matches a RouterOS command line. Requires a word boundary after the verb so
// that a path line such as "/ip address" is never mistaken for an "add".
const ADD_SET_RE = /^(add|set)(\s|$)/;

const ipToInt = (ip) => ip.split('.').reduce((acc, oct) => (acc << 8 >>> 0) + Number(oct), 0);

/**
 * Attach a parent link without making it visible to JSON.stringify.
 *
 * The dashboard links children to parents (ip -> interface, dhcp server ->
 * interface, pool -> server). Those references are inherently cyclic, so a
 * plain assignment makes the whole config unserialisable: any JSON.stringify
 * over the graph throws "Converting circular structure to JSON", which is what
 * broke search filtering and the HTML report export.
 *
 * Non-enumerable keeps `child.parent` working for rendering while hiding the
 * link from Object.keys, JSON.stringify, and spread-based copies.
 */
const linkTo = (child, key, parent) => {
  Object.defineProperty(child, key, {
    value: parent, writable: true, configurable: true, enumerable: false,
  });
};

/**
 * Per-parse interface index, stored on the config under a non-enumerable key.
 *
 * `set [ find default-name=etherN ]` is the most common line in a MikroTik
 * export, and resolving it with a linear scan made parsing quadratic: at 16.000
 * interfaces the scan accounted for about 1.0s of a 1.07s parse. The map is
 * built once and reused by both the ethernet and wireless branches.
 */
const interfaceIndex = (config) => {
  if (!config._ifaceIndex) {
    const map = new Map();
    for (const i of config.interfaces) {
      if (i.name && !map.has(i.name)) map.set(i.name, i);
      if (i.defaultName && !map.has(i.defaultName)) map.set(i.defaultName, i);
    }
    Object.defineProperty(config, '_ifaceIndex', {
      value: map, writable: true, configurable: true, enumerable: false,
    });
  }
  return config._ifaceIndex;
};

const registerInterface = (config, iface) => {
  if (iface.name) interfaceIndex(config).set(iface.name, iface);
  if (iface.defaultName) interfaceIndex(config).set(iface.defaultName, iface);
};

const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;

const cidrPrefix = (cidr) => {
  const slashAt = cidr.indexOf('/');
  if (slashAt === -1) return null;
  const prefix = Number(cidr.slice(slashAt + 1));
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return null;
  const base = cidr.slice(0, slashAt);
  return IPV4_RE.test(base) ? { base, prefix } : null;
};

/**
 * True when `ip` sits inside `cidr`. Only plain IPv4 is handled: that is what
 * `/ip address` and `/ip dhcp-server network` use, and a wrong answer from an
 * exotic input is worse than no answer at all, so anything else returns false.
 *
 * `ip` may itself carry a prefix length ("192.168.1.1/24"); the host part is
 * what gets compared, because the interface address comes from `/ip address`
 * and arrives in exactly that form.
 */
const isIpInCidr = (ip, cidr) => {
  if (typeof ip !== 'string' || typeof cidr !== 'string') return false;

  const host = ip.includes('/') ? ip.slice(0, ip.indexOf('/')) : ip;
  if (!IPV4_RE.test(host)) return false;

  const target = cidrPrefix(cidr);
  if (!target) return false;
  if (target.prefix === 0) return true;

  const mask = (0xFFFFFFFF << (32 - target.prefix)) >>> 0;
  return (ipToInt(host) & mask) === (ipToInt(target.base) & mask);
};

// Route parsed items to appropriate arrays in our structured config
const mapToStructuredData = (path, attrs, config) => {
  // `_find` describes the lookup target of a "set [ find ... ]" clause, not a
  // configuration attribute. Only /interface ethernet acts on it, so it is
  // peeled off here and everything downstream receives the clean attributes.
  // Leaving it in leaks an internal key into objects the UI renders.
  const { _find: findClause, ...rest } = attrs;

  if (path === '/interface ethernet') {
    if (findClause && findClause['default-name']) {
      // It's a set command modifying an interface
      // Find or create the interface representation
      const index = interfaceIndex(config);
      const key = findClause['default-name'];
      let iface = index.get(key);
      if (!iface) {
        iface = { defaultName: key, type: 'ethernet', disabled: 'no' };
        config.interfaces.push(iface);
        index.set(key, iface);
      }
      Object.assign(iface, rest);
    } else {
       const iface = { ...rest, type: 'ethernet' };
       config.interfaces.push(iface);
       registerInterface(config, iface);
    }
  } else if (path === '/interface bridge') {
    config.interfaces.push({...rest, type: 'bridge'});
    config.bridges.push({ ...rest, ports: [] }); // Initialize with empty ports array
  } else if (path === '/interface bridge port') {
    config.bridgePorts.push(rest);
  } else if (path === '/interface bridge vlan') {
    config.bridgeVlans.push(rest);
  } else if (path === '/interface vlan') {
    config.interfaces.push({...rest, type: 'vlan'});
    config.vlans.push(rest);
  } else if (path === '/interface wireguard') {
    config.interfaces.push({...rest, type: 'wireguard'});
    config.vpn.wireguard.push({...rest, peers: []}); // init empty peers
  } else if (path === '/interface wireguard peers') {
    config.vpn.wireguardPeers = config.vpn.wireguardPeers || [];
    config.vpn.wireguardPeers.push(rest);
  } else if (path === '/interface ovpn-client') {
    config.interfaces.push({...rest, type: 'ovpn'});
    config.vpn.ovpn.push(rest);
  } else if (path === '/interface l2tp-client') {
    config.interfaces.push({...rest, type: 'l2tp'});
    config.vpn.l2tp.push(rest);
  } else if (path === '/ip address') {
    config.ipAddresses.push(rest);
  } else if (path === '/ip route') {
    config.routes.push(rest);
  } else if (path === '/ip firewall filter') {
    config.firewall.filter.push(rest);
  } else if (path === '/ip firewall nat') {
    config.firewall.nat.push(rest);
  } else if (path === '/ip firewall mangle') {
    config.firewall.mangle.push(rest);
  } else if (path === '/ip firewall raw') {
    config.firewall.raw.push(rest);
  } else if (path === '/ip dhcp-server') {
    config.dhcp.servers.push(rest);
  } else if (path === '/ip dhcp-server network') {
    config.dhcp.networks.push(rest);
  } else if (path === '/ip dhcp-client') {
    config.dhcp.clients.push(rest);
  } else if (path === '/ip pool') {
    config.pools.push(rest);
  } else if (path === '/ip hotspot') {
    config.hotspot.servers.push(rest);
  } else if (path === '/ip hotspot profile') {
    config.hotspot.profiles.push(rest);
  } else if (path === '/ip hotspot user profile') {
    config.hotspot.userProfiles.push(rest);
  } else if (path === '/ip hotspot user') {
    config.hotspot.users.push(rest);
  } else if (path === '/ip hotspot ip-binding') {
    config.hotspot.bindings.push(rest);
  } else if (path === '/ip hotspot service-port') {
    config.hotspot.servicePorts.push(rest);
  } else if (path === '/ip hotspot walled-garden') {
    config.hotspot.walledGarden.push(rest);
  } else if (path === '/ip hotspot walled-garden ip') {
    config.hotspot.walledGardenIp.push(rest);
  } else if (path === '/queue type') {
    config.queues.types.push(rest);
  } else if (path === '/queue tree') {
    config.queues.trees.push(rest);
  } else if (path === '/queue simple') {
    config.queues.simple.push(rest);
  } else if (path === '/routing table') {
    config.routingTables.push(rest);
  } else if (path === '/interface list') {
    config.interfaceLists.push(rest);
  } else if (path === '/interface list member') {
    config.interfaceListMembers.push(rest);
  } else if (path === '/ip firewall address-list') {
    config.firewall.addressLists.push(rest);
  } else if (path === '/system identity') {
    config.metadata.identity = rest.name || '';
  } else if (path === '/system clock') {
    config.system.clock = rest;
  } else if (path === '/system logging action') {
    config.systemLogActions.push(rest);
  } else if (path === '/system logging') {
    config.system.logging.push(rest);
  } else if (path === '/snmp') {
    config.snmp = rest;
  } else if (path === '/port') {
    config.ports.push(rest);
  } else if (path === '/ip service') {
    config.services.push(rest);
  } else if (path === '/ip cloud') {
    config.cloud = rest;
  } else if (path === '/tool graphing interface') {
    config.tools.graphingInterfaces.push(rest);
  } else if (path === '/interface lte apn') {
    config.lteApns.push(rest);
  } else if (path === '/snmp community') {
    config.snmpCommunities.push(rest);
  } else if (path === '/ip settings') {
    config.settings = rest;
  } else if (path === '/ipv6 settings') {
    config.ipv6Settings = rest;
  } else if (path === '/interface detect-internet') {
    config.detectInternet = rest;
  } else if (path === '/ip ipsec profile') {
    config.ipsecProfiles.push(rest);
  } else if (path === '/routing bfd configuration') {
    config.routingBfd.push(rest);
  } else if (path === '/routing rule') {
    config.routingRules.push(rest);
  } else if (path === '/routing bgp template') {
    config.routingBgpTmpl.push(rest);
  } else if (path === '/routing bgp connection') {
    config.routingBgpConn.push(rest);
  } else if (path === '/routing filter rule') {
    config.routingFilterRules.push(rest);
  } else if (path === '/interface pppoe-server server') {
    config.ppp.pppoeServers.push(rest);
  } else if (path === '/ip firewall connection tracking') {
    config.firewall.connectionTracking = rest;
  } else if (path === '/interface ovpn-server server') {
    config.vpn.ovpnServers.push(rest);
  } else if (path === '/ip dns') {
    // "/ip dns" adalah section tunggal, jadi export bisa memunculkannya
    // beberapa kali (add lalu set). Atribut lain harus terakumulasi lintas
    // baris tersebut, sementara `servers` tetap boleh diganti baris
    // berikutnya karena itu memang perilaku yang benar di RouterOS.
    const { servers, ...dnsAttrs } = rest;
    config.dns = { ...config.dns, ...dnsAttrs };
    if (servers) {
      config.dns.servers = servers
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }
  } else if (path === '/ip dns static') {
    config.dns.static.push(rest);
  } else if (path === '/interface wireless') {
    config.wireless.interfaces.push({...rest, type: 'wireless'});
    const index = interfaceIndex(config);
    const known = (rest.name && index.get(rest.name)) || (rest['default-name'] && index.get(rest['default-name']));
    if (!known) {
      const iface = { ...rest, type: 'wireless' };
      config.interfaces.push(iface);
      registerInterface(config, iface);
    }
  } else if (path === '/interface wireless security-profiles') {
    config.wireless.securityProfiles.push(rest);
  } else if (path === '/interface wireless access-list') {
    config.wireless.accessList.push(rest);
  } else if (path === '/interface wireless connect-list') {
    config.wireless.connectList.push(rest);
  } else if (path === '/ppp profile') {
    config.ppp.profiles.push(rest);
  } else if (path === '/ppp secret') {
    config.ppp.secrets.push(rest);
  } else if (path === '/user') {
    config.system.users.push(rest);
  } else if (path === '/user group') {
    config.system.groups.push(rest);
  } else if (path === '/system ntp client') {
    config.system.ntpClient = {...config.system.ntpClient, ...rest};
  } else if (path === '/system ntp server') {
    config.system.ntpServer = {...config.system.ntpServer, ...rest};
  } else if (path === '/system scheduler') {
    config.system.scheduler.push(rest);
  } else if (path === '/system script') {
    config.system.scripts.push(rest);
  } else if (path === '/system watchdog') {
    config.system.watchdog = {...config.system.watchdog, ...rest};
  } else if (path === '/ip firewall layer7-protocol') {
    config.firewall.layer7.push(rest);
  } else if (path === '/queue interface') {
    config.queues.interfaceQueues.push(rest);
  }
};

const enrichDashboardData = (config) => {
  // Built up front and kept current as interfaces are added, so every relation
  // pass below is a map hit instead of a linear scan. With a .find() per
  // lookup, a config of n interfaces and n addresses cost n^2: a single parse of
  // 8.000 interfaces took 1.5s, versus 11ms with this index.
  const ifaceByName = new Map();
  const addToIndex = (iface) => {
    if (iface.name && !ifaceByName.has(iface.name)) ifaceByName.set(iface.name, iface);
    if (iface.defaultName && !ifaceByName.has(iface.defaultName)) ifaceByName.set(iface.defaultName, iface);
  };
  config.interfaces.forEach(addToIndex);

  // Pass 0: Implicitly discover interfaces that might not be explicitly defined in /interface sections but are used
  const discoverInterface = (ifaceName) => {
    if (!ifaceName) return;
    if (!ifaceByName.has(ifaceName)) {
      let type = 'unknown';
      if (ifaceName.match(/^(ether|sfp|combo|sfpplus|qsfp)/i)) type = 'ethernet';
      else if (ifaceName.match(/^wlan/i)) type = 'wireless';
      else if (ifaceName.match(/^bridge/i)) type = 'bridge';
      else if (ifaceName.match(/^vlan/i)) type = 'vlan';
      else if (ifaceName.match(/^pppoe/i)) type = 'pppoe';
      
      addToIndex({
        name: ifaceName,
        defaultName: ifaceName,
        type: type,
        active: true,
        disabled: 'no',
        _implicit: true, // Mark as implicitly discovered
      });
      config.interfaces.push(ifaceByName.get(ifaceName));
    }
  };

  config.ipAddresses.forEach(ip => discoverInterface(ip.interface));
  config.bridgePorts.forEach(bp => discoverInterface(bp.interface));
  config.dhcp.servers.forEach(ds => discoverInterface(ds.interface));
  config.dhcp.clients.forEach(dc => discoverInterface(dc.interface));
  // `gateway` on a route is always an IP address, never an interface name.
  // Passing it through discoverInterface invented interfaces for every gateway,
  // inflating the interface count, the sidebar badges, and the health summary.
  // RouterOS names the egress interface `interface=`, so that is what is used.
  config.routes.forEach(r => discoverInterface(r.interface));
  if (config.tools.graphingInterfaces) config.tools.graphingInterfaces.forEach(g => discoverInterface(g.interface));

  // First pass: Active status and naming for interfaces
  config.interfaces.forEach(i => {
    i.active = i.disabled !== 'yes';
    i.name = i.name || i.defaultName || 'Unknown';
    i.dhcpServers = []; // Prepare relation
    i.ipAddresses = []; // Prepare relation
  });

  const poolByName = new Map(config.pools.map(p => [p.name, p]));
  const bridgeByName = new Map(config.bridges.map(b => [b.name, b]));

  const dhcpNetworkByName = new Map(config.dhcp.networks.map(n => [n.name, n]));
  // Bucketed by first octet for the CIDR fallback. A /8 or wider network spans
  // every bucket, so those go into `wideNetworks` and are always considered.
  const networksByOctet = new Map();
  const wideNetworks = [];
  for (const n of config.dhcp.networks) {
    const parsed = cidrPrefix(n.address);
    if (!parsed || parsed.prefix <= 8) { wideNetworks.push(n); continue; }
    const octet = parsed.base.split('.')[0];
    if (!networksByOctet.has(octet)) networksByOctet.set(octet, []);
    networksByOctet.get(octet).push(n);
  }
  const networksInOctet = (ip) => {
    const host = typeof ip === 'string' ? (ip.includes('/') ? ip.slice(0, ip.indexOf('/')) : ip) : '';
    if (!IPV4_RE.test(host)) return null;
    const bucket = networksByOctet.get(host.split('.')[0]);
    if (!bucket) return wideNetworks.length ? wideNetworks : null;
    return wideNetworks.length ? [...wideNetworks, ...bucket] : bucket;
  };

  // Second pass: Link IP Addresses to Interfaces
  config.ipAddresses.forEach(ip => {
    ip.active = ip.disabled !== 'yes';
    const iface = ifaceByName.get(ip.interface);
    if (iface) {
      iface.hasIp = true;
      iface.ip = ip.address;
      iface.ipAddresses.push(ip);
      linkTo(ip, 'interfaceObj', iface);
    }
  });

  // Link Bridge Ports to Bridges and Interfaces
  config.bridgePorts.forEach(bp => {
    const bridge = bridgeByName.get(bp.bridge);
    if (bridge) {
      // Push only the interface name string – not the full object – to avoid React render crashes
      if (!bridge.ports.includes(bp.interface)) {
        bridge.ports.push(bp.interface);
      }
    }
    // Update interface to know it's a bridge port
    const ifaceObj = ifaceByName.get(bp.interface);
    if (ifaceObj) {
      ifaceObj.bridge = bp.bridge;
    }
  });

  // Remaining lookups reuse the maps built above. Only the DHCP network matching
  // still scans, because it needs CIDR containment and longest-prefix
  // comparison rather than an exact name hit.
  const hotspotProfileByName = new Map(config.hotspot.profiles.map(p => [p.name, p]));
  const interfaceListByName = new Map(config.interfaceLists.map(l => [l.name, l]));

  // Link Wireguard Peers into their respective wireguard interfaces
  if (config.vpn.wireguardPeers) {
    const wgByName = new Map(config.vpn.wireguard.map(w => [w.name, w]));
    config.vpn.wireguardPeers.forEach(peer => {
      const wg = wgByName.get(peer.interface);
      if (wg) {
        wg.peers.push(peer);
      }
    });
  }

  // Third pass: Link DHCP Servers to Interfaces, Pools and Networks
  config.dhcp.servers.forEach(server => {
    server.active = server.disabled !== 'yes';

    // Link to Interface
    const iface = ifaceByName.get(server.interface);
    if (iface) {
      linkTo(server, 'interfaceObj', iface);
      iface.dhcpServers.push(server);
    }

    // Link to Pool
    const pool = poolByName.get(server['address-pool']);
    if (pool) {
      linkTo(server, 'poolObj', pool);
      linkTo(pool, 'dhcpServer', server); // Back-link from Pool to Server
    }

    // Link to the matching /ip dhcp-server network entry.
    // Matching order:
    //   1. the `network=` attribute, which is the authoritative reference
    //   2. CIDR containment against the IP already assigned to the server's
    //      interface, used when the export omits `network=`
    // When neither matches the link is left unset. Attaching an arbitrary
    // network would show the wrong gateway and address range in the UI.
    //
    // Name matching uses a map; the CIDR fallback buckets networks by their
    // first octet, so the scan is limited to the plausible candidates instead of
    // walking the whole list for every server.
    let net = dhcpNetworkByName.get(server.network);

    if (!net && server.interfaceObj && server.interfaceObj.ip) {
      const ifaceIp = server.interfaceObj.ip;
      const candidates = networksInOctet(ifaceIp) || config.dhcp.networks;
      // Several networks can contain the same address, so keep the one with the
      // longest prefix. Comparing the first match alone would let a 0.0.0.0/0
      // entry win over the 192.168.1.0/24 that actually describes the link.
      let best = null;
      let bestPrefix = -1;
      for (const n of candidates) {
        if (!isIpInCidr(ifaceIp, n.address)) continue;
        const prefix = cidrPrefix(n.address)?.prefix ?? -1;
        if (prefix > bestPrefix) {
          best = n;
          bestPrefix = prefix;
        }
      }
      net = best;
    }

    if (net) linkTo(server, 'networkObj', net);
  });

  // Fourth pass: Link Hotspot Servers/Profiles and Queues
  config.hotspot.servers.forEach(hs => {
    hs.active = hs.disabled !== 'yes';
    if (hs['address-pool']) linkTo(hs, 'poolObj', poolByName.get(hs['address-pool']));
    if (hs.interface) linkTo(hs, 'interfaceObj', ifaceByName.get(hs.interface));
    if (hs.profile) linkTo(hs, 'profileObj', hotspotProfileByName.get(hs.profile));
  });

  config.hotspot.userProfiles.forEach(up => {
    if (up['address-pool']) linkTo(up, 'poolObj', poolByName.get(up['address-pool']));
  });

  // Link Interface List Members to Lists and Interfaces
  config.interfaceListMembers.forEach(member => {
    linkTo(member, 'interfaceObj', ifaceByName.get(member.interface));
    linkTo(member, 'listObj', interfaceListByName.get(member.list));
    
    // Reverse link from Interface to List
    if (member.interfaceObj) {
      if (!member.interfaceObj.lists) member.interfaceObj.lists = [];
      member.interfaceObj.lists.push(member.list);
    }
  });

  // Group Firewall Address Lists by list name natively to make rendering easier
  const listGroups = {};
  config.firewall.addressLists.forEach((al) => {
     if (!listGroups[al.list]) listGroups[al.list] = [];
     listGroups[al.list].push(al);
  });
  config.firewall.groupedAddressLists = Object.entries(listGroups).map(([name, items]) => ({
     name,
     count: items.length,
     items: items
  }));
};
