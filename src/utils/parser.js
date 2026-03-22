/**
 * Parser for MikroTik RouterOS .rsc export files.
 * Transforms the text file into a structured JSON object.
 */
export const parseMikroTikConfig = (fileContent) => {
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
    vpn: {
      l2tp: [],
      pptp: [],
      ovpn: [],
      ovpnServers: [],
      wireguard: [],
      wireguardPeers: []
    },
    firewall: {
      filter: [],
      nat: [],
      mangle: [],
      raw: [],
      addressLists: [],
      connectionTracking: {}
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
      simple: []
    },
    routingTables: [],
    interfaceLists: [],
    interfaceListMembers: [],
    system: {
      clock: {},
      logging: []
    },
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
    rawSections: {}
  };

  let currentPath = '';
  
  // Pre-process lines for continuations (\ at the end of line)
  const mergedLines = [];
  let currentMergedLine = '';
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (line.endsWith('\\')) {
      currentMergedLine += line.slice(0, -1); // remove slash, DO NOT add extra space
    } else {
      currentMergedLine += line;
      if (currentMergedLine) mergedLines.push(currentMergedLine);
      currentMergedLine = '';
    }
  }

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
    if (currentPath && (line.startsWith('add ') || line.startsWith('set ') || line.startsWith('add') || line.startsWith('set'))) {
      const parsedCommand = parseCommandArgs(line);
      config.rawSections[currentPath].push({
        type: line.startsWith('add') ? 'add' : 'set',
        ...parsedCommand
      });
      mapToStructuredData(currentPath, parsedCommand, config);
    }
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
  
  parts.forEach(part => {
    const eqIdx = part.indexOf('=');
    if (eqIdx > -1) {
      const key = part.slice(0, eqIdx);
      const val = part.slice(eqIdx + 1).replace(/^"|"$/g, ''); // remove quotes
      args[key] = val;
    } else {
      // It might be an unnamed argument, or a specific set clause
      // like `[ find default-name=ether2 ]` which is complex.
    }
  });

  // Extract 'find' clauses if any (for set commands)
  const findMatch = line.match(/\[\s*find\s+([^\]]+)\s*\]/);
  if (findMatch) {
    const findArgs = parseCommandArgs(findMatch[1]);
    args._find = findArgs;
  }

  return args;
};

// Route parsed items to appropriate arrays in our structured config
const mapToStructuredData = (path, attrs, config) => {
  if (path === '/interface ethernet') {
    if (attrs._find && attrs._find['default-name']) {
      // It's a set command modifying an interface
      // Find or create the interface representation
      let iface = config.interfaces.find(i => i.defaultName === attrs._find['default-name']);
      if (!iface) {
        iface = { defaultName: attrs._find['default-name'], type: 'ethernet', disabled: 'no' };
        config.interfaces.push(iface);
      }
      Object.assign(iface, attrs);
    } else {
       config.interfaces.push({...attrs, type: 'ethernet'});
    }
  } else if (path === '/interface bridge') {
    config.interfaces.push({...attrs, type: 'bridge'});
    config.bridges.push({ ...attrs, ports: [] }); // Initialize with empty ports array
  } else if (path === '/interface bridge port') {
    config.bridgePorts.push(attrs);
  } else if (path === '/interface bridge vlan') {
    config.bridgeVlans.push(attrs);
  } else if (path === '/interface vlan') {
    config.interfaces.push({...attrs, type: 'vlan'});
    config.vlans.push(attrs);
  } else if (path === '/interface wireguard') {
    config.interfaces.push({...attrs, type: 'wireguard'});
    config.vpn.wireguard.push({...attrs, peers: []}); // init empty peers
  } else if (path === '/interface wireguard peers') {
    config.vpn.wireguardPeers = config.vpn.wireguardPeers || [];
    config.vpn.wireguardPeers.push(attrs);
  } else if (path === '/interface ovpn-client') {
    config.interfaces.push({...attrs, type: 'ovpn'});
    config.vpn.ovpn.push(attrs);
  } else if (path === '/interface l2tp-client') {
    config.interfaces.push({...attrs, type: 'l2tp'});
    config.vpn.l2tp.push(attrs);
  } else if (path === '/ip address') {
    config.ipAddresses.push(attrs);
  } else if (path === '/ip route') {
    config.routes.push(attrs);
  } else if (path === '/ip firewall filter') {
    config.firewall.filter.push(attrs);
  } else if (path === '/ip firewall nat') {
    config.firewall.nat.push(attrs);
  } else if (path === '/ip firewall mangle') {
    config.firewall.mangle.push(attrs);
  } else if (path === '/ip firewall raw') {
    config.firewall.raw.push(attrs);
  } else if (path === '/ip dhcp-server') {
    config.dhcp.servers.push(attrs);
  } else if (path === '/ip dhcp-server network') {
    config.dhcp.networks.push(attrs);
  } else if (path === '/ip dhcp-client') {
    config.dhcp.clients.push(attrs);
  } else if (path === '/ip pool') {
    config.pools.push(attrs);
  } else if (path === '/ip hotspot') {
    config.hotspot.servers.push(attrs);
  } else if (path === '/ip hotspot profile') {
    config.hotspot.profiles.push(attrs);
  } else if (path === '/ip hotspot user profile') {
    config.hotspot.userProfiles.push(attrs);
  } else if (path === '/ip hotspot user') {
    config.hotspot.users.push(attrs);
  } else if (path === '/ip hotspot ip-binding') {
    config.hotspot.bindings.push(attrs);
  } else if (path === '/ip hotspot service-port') {
    config.hotspot.servicePorts.push(attrs);
  } else if (path === '/ip hotspot walled-garden') {
    config.hotspot.walledGarden.push(attrs);
  } else if (path === '/ip hotspot walled-garden ip') {
    config.hotspot.walledGardenIp.push(attrs);
  } else if (path === '/queue type') {
    config.queues.types.push(attrs);
  } else if (path === '/queue tree') {
    config.queues.trees.push(attrs);
  } else if (path === '/routing table') {
    config.routingTables.push(attrs);
  } else if (path === '/interface list') {
    config.interfaceLists.push(attrs);
  } else if (path === '/interface list member') {
    config.interfaceListMembers.push(attrs);
  } else if (path === '/ip firewall address-list') {
    config.firewall.addressLists.push(attrs);
  } else if (path === '/system identity') {
    config.metadata.identity = attrs.name || '';
  } else if (path === '/system clock') {
    config.system.clock = attrs;
  } else if (path === '/system logging action') {
    config.system.logging.push(attrs);
  } else if (path === '/snmp') {
    config.snmp = attrs;
  } else if (path === '/port') {
    config.ports.push(attrs);
  } else if (path === '/ip service') {
    config.services.push(attrs);
  } else if (path === '/ip cloud') {
    config.cloud = attrs;
  } else if (path === '/tool graphing interface') {
    config.tools.graphingInterfaces.push(attrs);
  } else if (path === '/interface lte apn') {
    config.lteApns.push(attrs);
  } else if (path === '/snmp community') {
    config.snmpCommunities.push(attrs);
  } else if (path === '/ip settings') {
    config.settings = attrs;
  } else if (path === '/ipv6 settings') {
    config.ipv6Settings = attrs;
  } else if (path === '/interface detect-internet') {
    config.detectInternet = attrs;
  } else if (path === '/ip ipsec profile') {
    config.ipsecProfiles.push(attrs);
  } else if (path === '/routing bfd configuration') {
    config.routingBfd.push(attrs);
  } else if (path === '/routing rule') {
    config.routingRules.push(attrs);
  } else if (path === '/ip firewall connection tracking') {
    config.firewall.connectionTracking = attrs;
  } else if (path === '/interface ovpn-server server') {
    config.vpn.ovpnServers.push(attrs);
  } else if (path === '/ip dns') {
    if (attrs.servers) config.dns.servers = attrs.servers.split(',');
  } else if (path === '/ip dns static') {
    config.dns.static.push(attrs);
  }
};

const enrichDashboardData = (config) => {
  // Pass 0: Implicitly discover interfaces that might not be explicitly defined in /interface sections but are used
  const discoverInterface = (ifaceName) => {
    if (!ifaceName) return;
    const exists = config.interfaces.find(i => i.name === ifaceName || i.defaultName === ifaceName);
    if (!exists) {
      let type = 'unknown';
      if (ifaceName.match(/^(ether|sfp|combo|sfpplus|qsfp)/i)) type = 'ethernet';
      else if (ifaceName.match(/^wlan/i)) type = 'wireless';
      else if (ifaceName.match(/^bridge/i)) type = 'bridge';
      else if (ifaceName.match(/^vlan/i)) type = 'vlan';
      else if (ifaceName.match(/^pppoe/i)) type = 'pppoe';
      
      config.interfaces.push({
        name: ifaceName,
        defaultName: ifaceName,
        type: type,
        active: true,
        disabled: 'no',
        _implicit: true // Mark as implicitly discovered
      });
    }
  };

  config.ipAddresses.forEach(ip => discoverInterface(ip.interface));
  config.bridgePorts.forEach(bp => discoverInterface(bp.interface));
  config.dhcp.servers.forEach(ds => discoverInterface(ds.interface));
  config.dhcp.clients.forEach(dc => discoverInterface(dc.interface));
  config.routes.forEach(r => discoverInterface(r.gateway)); // some routes specify iface as gateway
  if (config.tools.graphingInterfaces) config.tools.graphingInterfaces.forEach(g => discoverInterface(g.interface));

  // First pass: Active status and naming for interfaces
  config.interfaces.forEach(i => {
    i.active = i.disabled !== 'yes';
    i.name = i.name || i.defaultName || 'Unknown';
    i.dhcpServers = []; // Prepare relation
    i.ipAddresses = []; // Prepare relation
  });

  // Second pass: Link IP Addresses to Interfaces
  config.ipAddresses.forEach(ip => {
    ip.active = ip.disabled !== 'yes';
    const iface = config.interfaces.find(i => i.name === ip.interface || i.defaultName === ip.interface);
    if (iface) {
      iface.hasIp = true;
      iface.ip = ip.address;
      iface.ipAddresses.push(ip);
      ip.interfaceObj = iface;
    }
  });

  // Link Bridge Ports to Bridges and Interfaces
  config.bridgePorts.forEach(bp => {
    const bridge = config.bridges.find(b => b.name === bp.bridge);
    if (bridge) {
      // Push only the interface name string – not the full object – to avoid React render crashes
      if (!bridge.ports.includes(bp.interface)) {
        bridge.ports.push(bp.interface);
      }
    }
    // Update interface to know it's a bridge port
    const ifaceObj = config.interfaces.find(i => i.name === bp.interface || i.defaultName === bp.interface);
    if (ifaceObj) {
      ifaceObj.bridge = bp.bridge;
    }
  });

  // Link Wireguard Peers into their respective wireguard interfaces
  if (config.vpn.wireguardPeers) {
    config.vpn.wireguardPeers.forEach(peer => {
      const wg = config.vpn.wireguard.find(w => w.name === peer.interface);
      if (wg) {
        wg.peers.push(peer);
      }
    });
  }

  // Third pass: Link DHCP Servers to Interfaces, Pools and Networks
  config.dhcp.servers.forEach(server => {
    server.active = server.disabled !== 'yes';
    
    // Link to Interface
    const iface = config.interfaces.find(i => i.name === server.interface || i.defaultName === server.interface);
    if (iface) {
      server.interfaceObj = iface;
      iface.dhcpServers.push(server);
    }

    // Link to Pool
    const pool = config.pools.find(p => p.name === server['address-pool']);
    if (pool) {
      server.poolObj = pool;
      pool.dhcpServer = server; // Back-link from Pool to Server
    }
    
    // Attempt to link to Network based on address space (simplified)
    // Often times we might just have one network per dhcp setup or they match by address/gateway
    // A simplified heuristic: link based on the network's address encompassing the DHCP interface's IP
    const net = config.dhcp.networks.find(n => {
       // Just grab the first network if there's only one, or match by string if possible
       // Mikrotik doesn't explicitly tie network -> server by ID in simple configs.
       // Usually they just align by CIDR. We'll attach the network to the server object.
       return n; 
    });
    if (net) server.networkObj = net; 
  });

  // Fourth pass: Link Hotspot Servers/Profiles and Queues
  config.hotspot.servers.forEach(hs => {
    hs.active = hs.disabled !== 'yes';
    if (hs['address-pool']) hs.poolObj = config.pools.find(p => p.name === hs['address-pool']);
    if (hs.interface) hs.interfaceObj = config.interfaces.find(i => i.name === hs.interface || i.defaultName === hs.interface);
    if (hs.profile) hs.profileObj = config.hotspot.profiles.find(p => p.name === hs.profile);
  });

  config.hotspot.userProfiles.forEach(up => {
    if (up['address-pool']) up.poolObj = config.pools.find(p => p.name === up['address-pool']);
  });

  // Link Interface List Members to Lists and Interfaces
  config.interfaceListMembers.forEach(member => {
    member.interfaceObj = config.interfaces.find(i => i.name === member.interface || i.defaultName === member.interface);
    member.listObj = config.interfaceLists.find(l => l.name === member.list);
    
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
