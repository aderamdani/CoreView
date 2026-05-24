export const generateItemExplanation = (type, item) => {
  if (!item) return '-';

  switch (type) {

    case 'interface': {
      const t = item.type || 'unknown';
      const n = item.name || item.defaultName || 'unnamed';
      const disabled = item.disabled === 'yes' || !item.active;
      let desc = '';
      if (t === 'bridge') {
        desc = `Virtual switch bridge '${n}' — menggabungkan beberapa port fisik menjadi satu broadcast domain LAN.`;
      } else if (t === 'vlan') {
        desc = `VLAN interface ID ${item['vlan-id'] || '?'} di atas '${item['vlan-over'] || item.interface || '?'}'. Memisahkan lalu lintas Layer 2 secara logis tanpa kabel fisik terpisah.`;
      } else if (t === 'wlan' || t === 'wlan2') {
        desc = `Interface wireless '${n}'${item.ssid ? `, SSID: "${item.ssid}"` : ''}. Menangani asosiasi klien nirkabel.`;
      } else if (t === 'wireguard') {
        desc = `WireGuard VPN '${n}' — modern, cepat, kriptografi Curve25519. Listen port: ${item['listen-port'] || '?'}.`;
      } else if (t === 'pppoe-out' || t === 'ppp-out') {
        desc = `Koneksi PPPoE/PPP ke ISP '${n}'. Autentikasi CHAP/PAP, IP didapat dari server PPPoE.`;
      } else if (t === 'ethernet') {
        desc = `Port Ethernet fisik '${n}'${item.speed ? `, kecepatan: ${item.speed}` : ''}${item['mac-address'] ? `, MAC: ${item['mac-address']}` : ''}.`;
      } else if (t === 'loopback') {
        desc = `Loopback '${n}' — selalu aktif, tidak bergantung interface fisik. Ideal sebagai Router-ID OSPF/BGP.`;
      } else if (t === 'lte') {
        desc = `Modem LTE '${n}' — konektivitas WAN seluler. Kualitas sinyal menentukan throughput.`;
      } else if (t === 'ovpn-client' || t === 'ovpn-out') {
        desc = `OpenVPN client '${n}' — tunnel TLS terenkripsi ke server VPN.`;
      } else if (t === 'l2tp-client' || t === 'l2tp-out') {
        desc = `L2TP/IPSec client '${n}' — VPN native di Windows/macOS.`;
      } else if (t === 'gre') {
        desc = `GRE tunnel '${n}' — enkapsulasi IP-in-IP tanpa enkripsi, biasa dikombinasikan dengan IPSec.`;
      } else {
        desc = `Interface ${t} '${n}'.`;
      }
      if (disabled) desc += ' ⚠ Dinonaktifkan — tidak ada traffic yang melewati interface ini.';
      if (item.comment) desc += ` [${item.comment}]`;
      return desc;
    }

    case 'interfaces-ethernet': {
      const n = item.name || item.defaultName || 'unnamed';
      let desc = `Port Ethernet '${n}'.`;
      if (item['auto-negotiation'] === 'no') {
        desc += ` Kecepatan dikunci paksa ke ${item.speed || '?'} — risiko duplex mismatch jika perangkat lawan menggunakan auto-negotiation.`;
      } else {
        desc += ` Auto-negotiation aktif${item.speed ? `, terdeteksi: ${item.speed}` : ''}.`;
      }
      if (item['mac-address']) desc += ` MAC: ${item['mac-address']}.`;
      if (item.mtu && item.mtu !== '1500') {
        desc += ` MTU ${item.mtu} (non-standard) — perhatikan overhead fragmentasi untuk PPPoE/VPN.`;
      }
      return desc;
    }

    case 'interface-list': {
      const n = item.name || 'unnamed';
      let desc = `Grup interface '${n}'.`;
      const lc = n.toLowerCase();
      if (lc.includes('wan') || lc.includes('internet') || lc.includes('isp') || lc.includes('uplink')) {
        desc += ' Grup WAN/uplink — biasa dipakai sebagai out-interface-list pada aturan masquerade NAT dan firewall INPUT.';
      } else if (lc.includes('lan') || lc.includes('local') || lc.includes('internal')) {
        desc += ' Grup LAN/internal — biasa untuk mengizinkan layanan DHCP, DNS, dan akses manajemen dari jaringan lokal.';
      } else {
        desc += ' Shorthand dalam aturan Firewall/NAT/Routing untuk mengelompokkan interface sekaligus.';
      }
      return desc;
    }

    case 'bridge': {
      const n = item.name || 'unnamed';
      let desc = `Bridge '${n}'`;
      const proto = item['protocol-mode'];
      if (proto === 'rstp') desc += ' — RSTP aktif, mencegah loop, konvergensi ~1-2 detik.';
      else if (proto === 'stp') desc += ' — STP aktif, konvergensi lambat ~30-50 detik. Pertimbangkan RSTP.';
      else if (proto === 'mstp') desc += ' — MSTP aktif, multiple spanning tree per VLAN.';
      else desc += ' — tanpa spanning tree. Aman hanya jika tidak ada loop fisik.';
      if (item['vlan-filtering'] === 'yes') desc += ' VLAN filtering aktif — bridge beroperasi sebagai switch VLAN-aware.';
      return desc;
    }

    case 'bridge-port': {
      const pvid = item.pvid || '1';
      let desc = `Port '${item.interface}' bergabung ke bridge '${item.bridge}'.`;
      if (pvid !== '1') {
        desc += ` PVID ${pvid} — frame untagged masuk dianggap VLAN ${pvid}.`;
      }
      if (item.edge === 'yes' || item.edge === 'auto-edge') {
        desc += ' Edge/PortFast aktif — langsung masuk forwarding state. Gunakan hanya untuk port yang terhubung ke host, bukan switch.';
      }
      return desc;
    }

    case 'ip-address': {
      const addr = item.address || '?';
      const iface = item.interface || '?';
      const prefix = parseInt((addr.split('/')[1]) || '24');
      const hostCount = prefix <= 30 ? Math.pow(2, 32 - prefix) - 2 : (prefix === 31 ? 2 : 1);
      let desc = `IP ${addr} pada interface '${iface}'.`;
      if (item.network) desc += ` Subnet ${item.network}/${prefix} (maks ${hostCount} host).`;
      const isPrivate = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(addr);
      if (!isPrivate && prefix <= 30) desc += ' ⚡ Kemungkinan IP Publik — pastikan firewall INPUT sudah mengamankan akses.';
      if (!item.active || item.disabled === 'yes') desc += ' ⚠ Dinonaktifkan.';
      return desc;
    }

    case 'dhcp-server': {
      const n = item.name || '?';
      let desc = `DHCP Server '${n}' di interface '${item.interface || '?'}', pool '${item['address-pool'] || '?'}'.`;
      if (item.poolObj?.ranges) {
        const m = item.poolObj.ranges.match(/\.(\d+)-[^.]*\.(\d+)/);
        if (m) desc += ` Kapasitas pool: ${parseInt(m[2]) - parseInt(m[1]) + 1} alamat.`;
      }
      const lt = item.leaseTime || item['lease-time'];
      if (lt) desc += ` Lease time: ${lt}.`;
      if (!item.active) desc += ' ⚠ Server dihentikan — klien tidak mendapat IP otomatis.';
      return desc;
    }

    case 'dhcp-client': {
      let desc = `DHCP Client di '${item.interface || '?'}' meminta IP dari upstream (ISP/modem).`;
      if (item['add-default-route'] === 'no') {
        desc += ' ⚠ "Add Default Route" nonaktif — harus buat default route manual.';
      } else {
        desc += ' Default route dari ISP ditambahkan otomatis.';
      }
      if (item['use-peer-dns'] === 'no') desc += ' DNS dari ISP diabaikan.';
      if (item.disabled === 'yes') desc += ' ⚠ Client dinonaktifkan.';
      return desc;
    }

    case 'dns-static': {
      const name = item.name || '?';
      const address = item.address || '?';
      if (address === '127.0.0.1' || address === '0.0.0.0') {
        return `⚡ DNS sinkhole: '${name}' diblokir (diarahkan ke ${address}). Teknik pemblokiran iklan/malware.`;
      }
      if (name.startsWith('*.')) {
        return `DNS wildcard: semua subdomain '${name.slice(2)}' → ${address}. Berguna untuk split-DNS internal.`;
      }
      return `DNS statis: '${name}' → ${address} (TTL: ${item.ttl || 'default'}). Mengesampingkan resolver publik untuk domain ini.`;
    }

    case 'route': {
      const dst = item['dst-address'] || '0.0.0.0/0';
      const gw = item.gateway || '?';
      const dist = item.distance || '1';
      const mark = item['routing-mark'] || item['routing-table'];
      if (dst === '0.0.0.0/0') {
        let desc = `Default route → gateway ${gw}.`;
        if (parseInt(dist) > 1) desc += ` Distance ${dist} — ini rute backup/failover.`;
        if (mark) desc += ` Terikat ke routing table '${mark}' (multi-WAN policy routing).`;
        return desc;
      }
      if (dst.endsWith('/32')) {
        return `Host route spesifik ke ${dst} via ${gw}. Biasa untuk mengecualikan IP dari VPN atau mencapai peering BGP.`;
      }
      let desc = `Rute ke ${dst} via ${gw} (distance: ${dist}).`;
      if (mark) desc += ` Policy routing table: '${mark}'.`;
      if (item.disabled === 'yes') desc += ' ⚠ Dinonaktifkan.';
      if (item.comment) desc += ` [${item.comment}]`;
      return desc;
    }

    case 'pool': {
      const ranges = item.ranges || '?';
      let desc = `Pool '${item.name || '?'}': ${ranges}.`;
      const m = ranges.match(/\.(\d+)-[^.]*\.(\d+)/);
      if (m) {
        const size = parseInt(m[2]) - parseInt(m[1]) + 1;
        desc += ` Kapasitas: ${size} alamat.`;
        if (size < 10) desc += ' ⚠ Pool sangat kecil!';
      }
      if (item['next-pool']) desc += ` Overflow ke '${item['next-pool']}'.`;
      if (item.dhcpServer) desc += ` Digunakan DHCP Server '${item.dhcpServer.name}'.`;
      else desc += ' Untuk VPN/Hotspot/PPP.';
      return desc;
    }

    case 'hotspot-server': {
      let desc = `Hotspot server '${item.name || '?'}' di interface '${item.interface || '?'}'.`;
      if (item['address-pool']) desc += ` Pool: '${item['address-pool']}'.`;
      if (!item.active) desc += ' ⚠ Server nonaktif — klien tidak diarahkan ke portal login.';
      else desc += ' Semua perangkat baru akan diarahkan ke captive portal sebelum akses internet.';
      return desc;
    }

    case 'hotspot-user-profile': {
      let desc = `Profil Hotspot '${item.name || '?'}'.`;
      if (item['rate-limit']) {
        const rl = item['rate-limit'];
        const [dl, ul] = rl.split(' ')[0].split('/');
        desc += ` Limit: Download ${dl || rl}, Upload ${ul || rl}.`;
      }
      const shared = parseInt(item['shared-users']);
      if (shared === 1) desc += ' Satu perangkat per akun.';
      else if (shared > 1) desc += ` Bisa digunakan ${shared} perangkat bersamaan.`;
      if (item['session-timeout']) desc += ` Session timeout: ${item['session-timeout']}.`;
      return desc;
    }

    case 'hotspot-user': {
      let desc = `Akun '${item.name || '?'}' (profil: ${item.profile || 'default'}).`;
      if (item['mac-address']) desc += ` Dibatasi hanya untuk MAC ${item['mac-address']}.`;
      if (item.disabled === 'yes') desc += ' ⚠ Akun dinonaktifkan.';
      if (item.comment) desc += ` [${item.comment}]`;
      return desc;
    }

    case 'routing-table': {
      const n = item.name || '?';
      let desc = `Routing table '${n}' untuk policy-based routing.`;
      if (item.fib !== undefined) desc += ' FIB aktif — digunakan untuk forwarding paket aktual.';
      if (n.toLowerCase().includes('isp') || n.toLowerCase().includes('wan') || /\d/.test(n)) {
        desc += ' Kemungkinan untuk load balancing/failover multi-WAN.';
      }
      if (item.disabled === 'yes') desc += ' ⚠ Dinonaktifkan.';
      return desc;
    }

    case 'firewall-filter': {
      const action = item.action || 'accept';
      const chain = item.chain || '?';
      const actionMap = {
        accept: '✅ Izinkan',
        drop: '🚫 Drop (diam-diam)',
        reject: '❌ Reject + ICMP',
        'add-src-to-address-list': '📋 Tambah src ke address list',
        'add-dst-to-address-list': '📋 Tambah dst ke address list',
        log: '📝 Log',
        jump: '↪ Jump ke chain lain',
        return: '↩ Return',
      };
      const chainMap = {
        input: 'traffic MASUK ke router',
        forward: 'traffic MELEWATI router (LAN↔WAN)',
        output: 'traffic KELUAR dari router',
      };
      let desc = `${actionMap[action] || action} — ${chainMap[chain] || `chain ${chain}`}.`;
      const cs = item['connection-state'];
      if (cs) {
        if (cs === 'established,related' && action === 'accept') {
          desc += ' (Aturan stateful wajib — izinkan reply dari koneksi aktif)';
        } else {
          desc += ` State: ${cs}.`;
        }
      }
      if (item.protocol && item['dst-port']) {
        const portNames = { '22':'SSH', '23':'Telnet', '80':'HTTP', '443':'HTTPS', '53':'DNS',
          '8291':'Winbox', '3389':'RDP', '1194':'OpenVPN', '51820':'WireGuard', '500':'IKE', '1701':'L2TP' };
        desc += ` ${item.protocol.toUpperCase()} port ${item['dst-port']}${portNames[item['dst-port']] ? ` (${portNames[item['dst-port']]})` : ''}.`;
      } else if (item.protocol) {
        desc += ` Protokol: ${item.protocol}.`;
      }
      if (item['src-address'] || item['src-address-list']) desc += ` Src: ${item['src-address'] || 'list:'+item['src-address-list']}.`;
      if (item['dst-address'] || item['dst-address-list']) desc += ` Dst: ${item['dst-address'] || 'list:'+item['dst-address-list']}.`;
      if (item['in-interface'] || item['in-interface-list']) desc += ` In: ${item['in-interface'] || item['in-interface-list']}.`;
      if (item.disabled === 'yes') desc += ' ⚠ Dinonaktifkan.';
      if (item.comment) desc += ` [${item.comment}]`;
      return desc;
    }

    case 'firewall-nat': {
      const action = item.action || '?';
      if (action === 'masquerade') {
        let desc = '🌐 Masquerade: semua traffic LAN keluar menggunakan IP publik router.';
        if (item['out-interface']) desc += ` Interface keluar: '${item['out-interface']}'.`;
        if (item['out-interface-list']) desc += ` Grup: '${item['out-interface-list']}'.`;
        if (item.disabled === 'yes') desc += ' ⚠ NONAKTIF — perangkat LAN tidak bisa akses internet!';
        return desc;
      }
      if (action === 'dst-nat') {
        let desc = `🔀 Port Forwarding → ${item['to-addresses'] || '?'}${item['to-ports'] ? ':'+item['to-ports'] : ''}.`;
        if (item.protocol && item['dst-port']) {
          const sensitive = { '22':'SSH', '3389':'RDP', '3306':'MySQL', '5432':'PostgreSQL' };
          desc += ` Traffic ${item.protocol.toUpperCase()} port ${item['dst-port']} dari internet diteruskan.`;
          if (sensitive[item['dst-port']]) desc += ` ⚠ Layanan sensitif (${sensitive[item['dst-port']]}) terekspos — filter IP sumber!`;
        }
        if (item.disabled === 'yes') desc += ' ⚠ Dinonaktifkan.';
        return desc;
      }
      if (action === 'redirect') {
        return `Redirect port ${item['dst-port'] || '?'} → port ${item['to-ports'] || '?'} di router sendiri. Pola umum transparent proxy.`;
      }
      let desc = `NAT ${action} pada chain '${item.chain}'`;
      if (item['to-addresses']) desc += ` → ${item['to-addresses']}`;
      if (item['to-ports']) desc += `:${item['to-ports']}`;
      desc += '.';
      if (item.disabled === 'yes') desc += ' ⚠ Dinonaktifkan.';
      if (item.comment) desc += ` [${item.comment}]`;
      return desc;
    }

    case 'firewall-mangle': {
      const action = item.action || '?';
      const actionMap = {
        'mark-connection': '📌 Tandai koneksi',
        'mark-routing': '🗺 Tandai routing (policy routing)',
        'mark-packet': '📦 Tandai paket (untuk Queue)',
        'change-mss': '📐 Ubah MSS',
        'change-ttl': '⏱ Ubah TTL',
        'passthrough': '⏩ Passthrough (statistik saja)',
        'sniff-tzsp': '👁 Mirror ke sniffer',
      };
      let desc = `${actionMap[action] || `Mangle: ${action}`} — chain '${item.chain}'.`;
      const newMark = item['new-connection-mark'] || item['new-routing-mark'] || item['new-packet-mark'];
      if (newMark) {
        desc += ` Mark: '${newMark}'.`;
        if (action === 'mark-routing') desc += ` Traffic diarahkan ke routing table '${newMark}' — kritis untuk multi-WAN.`;
        else if (action === 'mark-packet') desc += ` Queue Tree yang menggunakan packet-mark '${newMark}' akan memproses paket ini.`;
        else if (action === 'mark-connection') desc += ` Seluruh koneksi ditandai — paket berikutnya bisa di-mark berdasarkan connection-mark ini.`;
      }
      if (action === 'change-mss' && item['new-mss']) {
        desc += ` MSS baru: ${item['new-mss']} — mengatasi masalah MTU pada PPPoE/VPN (PMTUD workaround).`;
      }
      if (item['connection-state'] === 'new') desc += ' Hanya pada koneksi baru — efisien, tidak proses tiap paket.';
      if (item.disabled === 'yes') desc += ' ⚠ Dinonaktifkan.';
      if (item.comment) desc += ` [${item.comment}]`;
      return desc;
    }

    case 'firewall-raw': {
      const action = item.action || '?';
      const rawMap = {
        drop: '🚫 Drop SEBELUM connection tracking',
        accept: '✅ Izinkan, lewati raw',
        notrack: '⚡ Bypass conntrack — performa maksimal',
      };
      let desc = `${rawMap[action] || action} — chain '${item.chain}'.`;
      if (action === 'notrack') desc += ' Traffic ini tidak dilacak conntrack — cocok untuk server/backbone volume tinggi.';
      else if (action === 'drop') desc += ' Lebih efisien dari filter biasa — tidak membuat conntrack entry. Ideal mitigasi DDoS.';
      if (item['src-address'] || item['src-address-list']) desc += ` Sumber: ${item['src-address'] || 'list:'+item['src-address-list']}.`;
      if (item.disabled === 'yes') desc += ' ⚠ Dinonaktifkan.';
      if (item.comment) desc += ` [${item.comment}]`;
      return desc;
    }

    case 'queue-tree': {
      const n = item.name || '?';
      const parent = item.parent;
      const maxLimit = item['max-limit'];
      const pm = item['packet-mark'];
      const prio = item.priority;
      let desc = `Queue tree '${n}'`;
      if (!parent || parent === 'global' || parent === 'global-in' || parent === 'global-out') {
        desc += ' (root queue)';
      } else {
        desc += ` (child dari '${parent}')`;
      }
      desc += maxLimit ? ` — max: ${maxLimit}.` : ' — tanpa batas max.';
      if (item['limit-at']) desc += ` Garanteed: ${item['limit-at']}.`;
      if (pm) desc += ` Memproses paket mark '${pm}' (harus ada aturan Mangle).`;
      if (prio) {
        const p = parseInt(prio);
        const pl = p <= 3 ? 'TINGGI (cocok VoIP/video)' : p >= 7 ? 'RENDAH (bulk download)' : 'menengah';
        desc += ` Priority ${prio} (${pl}).`;
      }
      return desc;
    }

    case 'queue-type': {
      const kind = item.kind || '?';
      const kindMap = {
        pcq: 'PCQ — membagi bandwidth merata antar pengguna otomatis',
        sfq: 'SFQ — distribusi adil antar flow tanpa konfigurasi per-IP',
        red: 'RED — membuang paket acak sebelum buffer penuh (anti-congestion)',
        fifo: 'FIFO — sederhana, tidak adil, satu user bisa monopoli bandwidth',
        bfifo: 'BFIFO — FIFO berbasis bytes',
        pfifo: 'PFIFO — FIFO berbasis paket',
        'fq-codel': 'FQ-CoDel — algoritma modern anti-bufferbloat, latensi sangat rendah',
        cake: 'CAKE — algoritma terbaru, fairness terbaik, anti-bufferbloat',
      };
      let desc = `Queue type '${item.name || '?'}': ${kindMap[kind] || `Algoritma: ${kind}`}.`;
      if (kind === 'pcq' && item['pcq-classifier']) {
        desc += ` Classifier: ${item['pcq-classifier']} — bandwidth dibagi per ${item['pcq-classifier'].includes('dst') ? 'IP tujuan' : 'IP sumber'}.`;
      }
      if (kind === 'pcq' && item['pcq-rate']) {
        desc += ` Batas per bucket: ${item['pcq-rate']}.`;
      }
      return desc;
    }

    case 'queue-simple': {
      const n = item.name || '?';
      const target = item.target || '?';
      const maxLimit = item['max-limit'];
      let desc = `Simple Queue '${n}' → target '${target}'.`;
      if (maxLimit) {
        const [dl, ul] = maxLimit.split('/');
        desc += dl && ul ? ` Limit ↓${dl} ↑${ul}.` : ` Limit: ${maxLimit}.`;
      }
      if (item['limit-at']) desc += ` Dijamin: ${item['limit-at']}.`;
      if (target.match(/\/32$/) || target.match(/^\d+\.\d+\.\d+\.\d+$/)) desc += ' Per-host.';
      else if (target.match(/\/\d+$/) && !target.endsWith('/32')) desc += ' Per-subnet.';
      if (item.disabled === 'yes') desc += ' ⚠ Dinonaktifkan.';
      return desc;
    }

    case 'vpn-wireguard': {
      const port = item['listen-port'] || '?';
      let desc = `WireGuard server '${item.name}' listen UDP port ${port}.`;
      if (port === '51820') desc += ' Port default WireGuard.';
      if (item.mtu) desc += ` MTU: ${item.mtu}${parseInt(item.mtu) < 1420 ? ' (dikurangi untuk menghindari fragmentasi)' : ''}.`;
      desc += ' Kriptografi Curve25519 — sangat aman dan efisien.';
      return desc;
    }

    case 'vpn-legacy': {
      const t = item._type || item.type || 'VPN';
      const typeDesc = {
        'ovpn-client': 'OpenVPN client — enkripsi TLS, cross-platform',
        'ovpn-out': 'OpenVPN client — enkripsi TLS, cross-platform',
        'l2tp-client': 'L2TP/IPSec — native di Windows/macOS',
        'l2tp-out': 'L2TP/IPSec — native di Windows/macOS',
        'pptp-client': '⚠ PPTP — protokol lama dengan kelemahan keamanan diketahui, pertimbangkan migrasi',
        'pptp-out': '⚠ PPTP — protokol lama dengan kelemahan keamanan diketahui',
        'sstp-client': 'SSTP (port 443) — menembus firewall korporat yang blokir non-HTTPS',
      };
      return `VPN ${typeDesc[t] || t} '${item.name}'.`;
    }

    case 'vpn-wireguard-peer': {
      const allowed = item['allowed-address'] || '?';
      let desc = '';
      if (allowed === '0.0.0.0/0' || allowed === '0.0.0.0/0,::/0') {
        desc = '⚡ Full-tunnel: SEMUA traffic peer (termasuk internet) melewati tunnel ini.';
      } else {
        desc = `Split-tunnel: subnet diizinkan melewati tunnel: ${allowed}.`;
      }
      if (item['endpoint-address'] && item['endpoint-port']) {
        desc += ` Endpoint: ${item['endpoint-address']}:${item['endpoint-port']} (IP publik statis).`;
      } else {
        desc += ' Tanpa endpoint statis — peer di belakang NAT (butuh persistent-keepalive).';
      }
      if (item['persistent-keepalive']) desc += ` Keepalive: ${item['persistent-keepalive']}s.`;
      if (item.comment) desc += ` [${item.comment}]`;
      return desc;
    }

    case 'tool-graphing': {
      let desc = `Grafik traffic interface '${item.interface || '?'}' diaktifkan.`;
      if (item['store-on-disk'] !== 'no') desc += ' Data tersimpan di disk (persisten setelah reboot).';
      else desc += ' Data di RAM saja (hilang saat reboot).';
      if (item['allow-address']) desc += ` Akses dibatasi dari: ${item['allow-address']}.`;
      return desc;
    }

    case 'ip-service': {
      const n = (item.name || '').toLowerCase();
      const port = item.port || '?';
      const disabled = item.disabled === 'yes';
      const serviceInfo = {
        api: 'RouterOS API (otomatisasi)',
        'api-ssl': 'RouterOS API over SSL (aman)',
        ftp: 'FTP transfer file',
        ssh: 'SSH — CLI terenkripsi ✅',
        telnet: '⚠ Telnet — CLI TIDAK terenkripsi (hindari!)',
        winbox: 'Akses GUI Winbox',
        www: '⚠ HTTP WebFig (tidak terenkripsi)',
        'www-ssl': 'HTTPS WebFig (terenkripsi) ✅',
      };
      let desc = `${serviceInfo[n] || `Layanan '${item.name}'`} — port ${port}.`;
      if (disabled) {
        desc += ' (Dinonaktifkan)';
      } else {
        const af = item['available-from'];
        if (!af || af === '0.0.0.0/0' || af === '::/0') {
          desc += ' ⚠ Terbuka dari semua IP — pertimbangkan pembatasan "Available From".';
        } else {
          desc += ` Dibatasi dari: ${af} ✅`;
        }
      }
      return desc;
    }

    case 'system-logging': {
      const topics = item.topics || 'default';
      const action = item.action || 'memory';
      const actionStr = { memory:'RAM (hilang reboot)', disk:'disk permanen', remote:'server syslog remote', email:'email', echo:'console' }[action] || action;
      let desc = `Log topic '${topics}' → ${actionStr}.`;
      if (action === 'memory') desc += ' ⚠ Tidak persisten — pertimbangkan logging ke disk atau remote syslog.';
      else if (action === 'disk') desc += ' Persisten, hati-hati volume log memenuhi storage.';
      else if (action === 'remote') desc += ' Cocok untuk SIEM/Zabbix.';
      return desc;
    }

    case 'port': {
      let desc = `Port serial '${item.name || '?'}'`;
      if (item['baud-rate']) desc += ` baud rate ${item['baud-rate']}`;
      desc += '. Akses manajemen out-of-band ketika jaringan tidak tersedia.';
      return desc;
    }

    case 'lte-apn': {
      let desc = `APN '${item.apn || '?'}' (profil: ${item.name || '?'}).`;
      if (item['use-network-apn'] === 'yes') desc += ' Menggunakan APN bawaan operator otomatis.';
      if (item.user) desc += ` Kredensial: ${item.user} (APN korporat/M2M).`;
      if (item['ip-type']) desc += ` Tipe IP: ${item['ip-type']}.`;
      return desc;
    }

    case 'snmp-community': {
      const n = item.name || '?';
      const addr = item.addresses || '::/0';
      let desc = `SNMP community '${n}'.`;
      if (n === 'public') desc += ' ⚠ Nama default "public" sangat mudah ditebak penyerang!';
      if (addr === '::/0' || addr === '0.0.0.0/0') {
        desc += ' ⚠ Terbuka dari SEMUA IP — batasi ke IP server monitoring saja.';
      } else {
        desc += ` Dibatasi dari: ${addr} ✅`;
      }
      return desc;
    }

    case 'ipsec-profile': {
      const enc = item['enc-algorithm'] || 'aes-128';
      const hash = item['hash-algorithm'] || 'sha1';
      const dh = item['dh-group'] || 'modp1024';
      let desc = `IPSec: enkripsi ${enc}, hash ${hash}, DH ${dh}.`;
      if (enc.includes('des') || enc === '3des') desc += ' ⚠ 3DES/DES lemah secara kriptografi — upgrade ke AES-256.';
      else if (enc.includes('aes-256')) desc += ' AES-256 — keamanan terkuat.';
      if (dh === 'modp1024' || dh === 'modp768') desc += ` ⚠ DH group ${dh} sudah tidak direkomendasikan — pakai modp2048+.`;
      if (hash === 'md5') desc += ' ⚠ MD5 tidak aman — pakai SHA-256.';
      return desc;
    }

    case 'routing-bfd': {
      const minTx = item['min-tx'];
      const mult = item.multiplier || '5';
      let desc = `BFD di '${item.interfaces || 'semua interface'}'.`;
      if (minTx && mult) {
        const det = parseInt(minTx) * parseInt(mult);
        if (!isNaN(det)) desc += ` Deteksi kegagalan dalam ~${det}ms.`;
      }
      desc += ' Memungkinkan OSPF/BGP bereaksi terhadap link failure dalam milidetik, bukan menit.';
      return desc;
    }

    case 'routing-rule': {
      const table = item.table || '?';
      let desc = `Policy routing: traffic → tabel '${table}'.`;
      if (item['src-address']) desc += ` Src: ${item['src-address']}.`;
      if (item['dst-address']) desc += ` Dst: ${item['dst-address']}.`;
      if (item['routing-mark']) desc += ` Mark: ${item['routing-mark']}.`;
      if (item.disabled === 'yes') desc += ' ⚠ Dinonaktifkan.';
      return desc;
    }

    case 'vpn-ovpn-server': {
      const proto = item.protocol || 'tcp';
      let desc = `OpenVPN Server '${item.name || '?'}' port ${item.port || '1194'}/${proto.toUpperCase()}.`;
      if (proto === 'tcp') desc += ' TCP menembus firewall korporat, tapi ada overhead TCP-over-TCP.';
      else if (proto === 'udp') desc += ' UDP lebih efisien untuk koneksi stabil.';
      if (item.auth === 'null') desc += ' ⚠ Autentikasi NULL — tidak aman untuk produksi!';
      return desc;
    }

    case 'pppoe-server': {
      let desc = `PPPoE Server '${item['service-name'] || '?'}' di interface '${item.interface || '?'}'.`;
      if (item['max-sessions']) desc += ` Maks sesi: ${item['max-sessions']}.`;
      if (item.authentication) {
        if (item.authentication.includes('pap')) desc += ' ⚠ PAP diizinkan — password tidak terenkripsi!';
        else if (item.authentication.includes('mschap2')) desc += ' MSCHAPv2 — autentikasi aman.';
      }
      return desc;
    }

    case 'routing-bgp-tmpl': {
      let desc = `BGP template '${item.name || '?'}' AS ${item.as || '?'}.`;
      if (item['route-reflect'] === 'yes') desc += ' Route Reflector — distribusi route iBGP tanpa full-mesh.';
      if (item.multihop === 'yes') desc += ` Multihop (TTL: ${item['multihop-ttl'] || '?'}).`;
      return desc;
    }

    case 'routing-bgp-conn': {
      const remoteAs = item['remote.as'] || '?';
      const localAs = item['local.as'] || item.as || '?';
      const type = (localAs !== '?' && remoteAs !== '?' && localAs === remoteAs) ? 'iBGP' : 'eBGP';
      let desc = `Sesi ${type} ke ${item['remote.address'] || '?'} (AS ${remoteAs}).`;
      if (type === 'eBGP') desc += ' Koneksi ke AS lain — upstream/IX provider.';
      else desc += ' Koneksi dalam AS yang sama — distribusi route internal.';
      if (item.disabled === 'yes') desc += ' ⚠ Sesi nonaktif — tidak ada route yang ditukar.';
      return desc;
    }

    case 'routing-filter': {
      const chain = item.chain || '?';
      const rule = item.rule || '?';
      let desc = `Filter routing chain '${chain}'.`;
      if (rule.includes('accept')) desc += ' Terima route yang cocok.';
      else if (rule.includes('reject') || rule.includes('discard')) desc += ' Tolak route yang cocok.';
      if (rule.includes('bgp-communities')) desc += ' Berdasarkan BGP community.';
      else if (rule.includes('as-path')) desc += ' Berdasarkan AS-PATH.';
      if (item.disabled === 'yes') desc += ' ⚠ Filter dinonaktifkan.';
      return desc;
    }

    case 'log-action': {
      const target = item.target || 'memory';
      const targetMap = {
        memory: 'RAM sementara',
        disk: 'disk permanen',
        remote: `syslog remote${item.remote ? ` ${item.remote}:${item['remote-port'] || '514'}` : ''}`,
        echo: 'terminal output',
        email: `email ke ${item['email-to'] || '?'}`,
      };
      return `Log action '${item.name || '?'}': kirim ke ${targetMap[target] || target}.`;
    }

    case 'ppp-profile': {
      let desc = `PPP Profile '${item.name || '?'}' — template untuk koneksi VPN/PPPoE.`;
      if (item['rate-limit']) {
        const [dl, ul] = item['rate-limit'].split('/');
        desc += ` Rate limit: ↓${dl || item['rate-limit']} ↑${ul || item['rate-limit']}.`;
      }
      if (item['local-address']) desc += ` IP lokal: ${item['local-address']}.`;
      if (item['remote-address']) desc += ` IP remote (klien): ${item['remote-address']}.`;
      if (item['dns-server']) desc += ` DNS ke klien: ${item['dns-server']}.`;
      return desc;
    }

    case 'ppp-secret': {
      let desc = `Akun PPP '${item.name || '?'}' layanan ${item.service || 'any'}, profil: ${item.profile || 'default'}.`;
      if (item['local-address']) desc += ` IP lokal: ${item['local-address']}.`;
      if (item['remote-address']) desc += ` IP dialokasikan: ${item['remote-address']}.`;
      if (item.disabled === 'yes') desc += ' ⚠ Akun dinonaktifkan.';
      return desc;
    }

    case 'address-list':
    case 'firewall-address-list': {
      const list = item.list || '?';
      const address = item.address || '?';
      let desc = `Address list '${list}': ${address}.`;
      if (item.timeout) {
        desc += ` ⏱ Entry sementara, hapus otomatis dalam ${item.timeout}. Kemungkinan ditambahkan dinamis oleh firewall.`;
      } else {
        desc += ' Entry permanen.';
      }
      const lc = list.toLowerCase();
      if (lc.includes('block') || lc.includes('ban') || lc.includes('deny') || lc.includes('scanner')) {
        desc += ` IP ${address} sedang diblokir/ditandai berbahaya.`;
      } else if (lc.includes('allow') || lc.includes('white') || lc.includes('trust')) {
        desc += ` IP ${address} mendapat akses istimewa.`;
      }
      return desc;
    }

    default:
      return 'Detail tersedia — klik tombol Detail untuk melihat selengkapnya.';
  }
};
