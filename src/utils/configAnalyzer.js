/**
 * Analyzes a parsed MikroTik config object and returns:
 *  - score (0–100)
 *  - grade / gradeLabel / gradeColor
 *  - issues[]  — each issue has { severity, category, icon, title, description, fix, tab }
 *  - plainSummary — human-readable paragraph for beginners
 */
export function analyzeConfig(config) {
  const issues = [];

  const filterRules  = config.firewall?.filter || [];
  const natRules     = config.firewall?.nat    || [];
  const services     = config.services || [];
  const routes       = config.routes   || [];
  const logging      = config.system?.logging  || [];
  const ntpClient    = config.system?.ntpClient;
  const dns          = config.dns;
  const snmpComs     = config.snmpCommunities  || [];
  const interfaces   = config.interfaces || [];
  const dhcpServers  = config.dhcp?.servers    || [];
  const vpnTotal     = (config.vpn?.wireguard?.length || 0)
                     + (config.vpn?.ovpn?.length       || 0)
                     + (config.vpn?.l2tp?.length        || 0);

  // ─── SECURITY ──────────────────────────────────────────────────────────────

  if (filterRules.length === 0) {
    issues.push({
      severity: 'critical',
      category: 'Keamanan',
      icon: '🛡️',
      title: 'Tidak ada aturan Firewall sama sekali',
      description:
        'Router tidak memiliki satu pun aturan firewall. Artinya semua koneksi dari mana saja — termasuk internet — ' +
        'bisa masuk langsung ke router tanpa hambatan. Ini sama seperti rumah tanpa kunci dan tanpa penjaga.',
      fix: 'Buat aturan firewall minimal: izinkan koneksi yang sudah ada (established/related), ' +
           'blokir traffic invalid, dan DROP semua sisa traffic INPUT dari internet.',
      tab: 'firewall-filter',
      commands: [
        '# Izinkan koneksi yang sudah ada (wajib ada agar internet tetap jalan)',
        '/ip firewall filter add chain=input connection-state=established,related action=accept comment="Allow Established/Related"',
        '/ip firewall filter add chain=input connection-state=invalid action=drop comment="Drop Invalid"',
        '/ip firewall filter add chain=input protocol=icmp action=accept comment="Allow ICMP"',
        '# Blokir semua INPUT lainnya (taruh di PALING BAWAH)',
        '/ip firewall filter add chain=input action=drop comment="Drop All Other INPUT"',
        '',
        '/ip firewall filter add chain=forward connection-state=established,related action=accept comment="Allow Established/Related FWD"',
        '/ip firewall filter add chain=forward connection-state=invalid action=drop comment="Drop Invalid FWD"',
        '/ip firewall filter add chain=forward action=drop comment="Drop All Other Forward"',
      ],
    });
  } else {
    const hasInputDrop = filterRules.some(
      r => r.chain === 'input' && (r.action === 'drop' || r.action === 'reject')
    );
    if (!hasInputDrop) {
      issues.push({
        severity: 'warning',
        category: 'Keamanan',
        icon: '⚠️',
        title: 'Pintu masuk router tidak dikunci (INPUT chain)',
        description:
          'Tidak ada aturan pemblokiran (drop/reject) untuk traffic yang masuk langsung ke router. ' +
          'Ini berarti siapapun di internet bisa mencoba mengakses panel manajemen, SSH, atau Winbox router Anda.',
        fix: 'Tambahkan aturan "chain=input action=drop" sebagai baris terakhir di INPUT chain. ' +
             'Ini adalah "pintu kunci default" — hanya koneksi yang sudah diizinkan sebelumnya yang boleh masuk.',
        tab: 'firewall-filter',
        commands: [
          '/ip firewall filter add chain=input connection-state=established,related action=accept comment="Allow Established"',
          '/ip firewall filter add chain=input connection-state=invalid action=drop comment="Drop Invalid"',
          '# Baris drop default INPUT (taruh paling bawah)',
          '/ip firewall filter add chain=input action=drop comment="Drop All Other INPUT"',
        ],
      });
    }

    const hasForwardDrop = filterRules.some(
      r => r.chain === 'forward' && (r.action === 'drop' || r.action === 'reject')
    );
    if (!hasForwardDrop) {
      issues.push({
        severity: 'warning',
        category: 'Keamanan',
        icon: '⚠️',
        title: 'Traffic antar jaringan tidak dikontrol (FORWARD chain)',
        description:
          'Tidak ada aturan blokir pada FORWARD chain. Artinya perangkat di jaringan Anda bisa saling mengakses ' +
          'secara bebas dan traffic dari internet bisa diteruskan ke mana saja tanpa filter.',
        fix: 'Tambahkan aturan "chain=forward action=drop" sebagai baris terakhir di FORWARD chain. ' +
             'Pastikan sebelumnya ada aturan yang mengizinkan koneksi established/related agar internet tetap jalan.',
        tab: 'firewall-filter',
        commands: [
          '/ip firewall filter add chain=forward connection-state=established,related action=accept comment="Allow Established FWD"',
          '/ip firewall filter add chain=forward connection-state=invalid action=drop comment="Drop Invalid FWD"',
          '# Baris drop default FORWARD (taruh paling bawah)',
          '/ip firewall filter add chain=forward action=drop comment="Drop All Other Forward"',
        ],
      });
    }
  }

  // Telnet aktif
  const telnetSvc = services.find(s => s.name === 'telnet');
  if (telnetSvc && telnetSvc.disabled !== 'yes') {
    issues.push({
      severity: 'warning',
      category: 'Keamanan',
      icon: '🔓',
      title: 'Telnet aktif — komunikasi tidak terenkripsi',
      description:
        'Telnet mengirimkan username, password, dan semua perintah dalam teks biasa yang bisa dibaca siapapun. ' +
        'Bayangkan mengirim surat rahasia dalam amplop transparan — semua orang bisa membacanya.',
      fix: 'Nonaktifkan Telnet di IP → Services dan gunakan SSH sebagai gantinya. ' +
           'SSH mengenkripsi semua komunikasi sehingga tidak bisa disadap.',
      tab: 'ip-services',
      commands: ['/ip service disable telnet'],
    });
  }

  // FTP aktif
  const ftpSvc = services.find(s => s.name === 'ftp');
  if (ftpSvc && ftpSvc.disabled !== 'yes') {
    issues.push({
      severity: 'warning',
      category: 'Keamanan',
      icon: '📁',
      title: 'FTP aktif — transfer file tidak aman',
      description:
        'FTP mengirimkan file dan kredensial tanpa enkripsi. Sangat rentan terhadap penyadapan di jaringan yang sama.',
      fix: 'Nonaktifkan FTP di IP → Services. Gunakan SCP atau SFTP via SSH untuk transfer file yang aman.',
      tab: 'ip-services',
      commands: ['/ip service disable ftp'],
    });
  }

  // Layanan manajemen terbuka ke semua IP
  const openServices = services.filter(s => {
    if (s.disabled === 'yes') return false;
    const addr = s.address || '';
    const noRestriction = addr === '' || addr === '0.0.0.0/0' || addr === '::/0';
    return noRestriction && ['ssh', 'winbox', 'www', 'www-ssl', 'api', 'api-ssl'].includes(s.name);
  });
  if (openServices.length > 0) {
    issues.push({
      severity: 'info',
      category: 'Keamanan',
      icon: '🌐',
      title: `${openServices.length} layanan manajemen bisa diakses dari semua IP`,
      description:
        `Layanan ${openServices.map(s => s.name).join(', ')} dapat diakses dari IP manapun di internet. ` +
        'Walaupun dilindungi password, serangan brute-force tetap bisa mencoba ribuan kombinasi password.',
      fix: 'Di IP → Services, isi kolom "Available From" dengan IP atau subnet khusus tim IT Anda ' +
           '(contoh: 192.168.1.0/24). Ini memastikan hanya jaringan Anda yang bisa login.',
      tab: 'ip-services',
      commands: openServices.map(s => `/ip service set ${s.name} address=192.168.1.0/24   # ganti dengan IP management Anda`),
    });
  }

  // SNMP community "public"
  const publicSnmp = snmpComs.find(c => c.name === 'public');
  if (publicSnmp) {
    issues.push({
      severity: 'warning',
      category: 'Keamanan',
      icon: '🔑',
      title: 'SNMP menggunakan community string default "public"',
      description:
        '"public" adalah community string bawaan yang diketahui semua orang. Siapapun bisa membaca ' +
        'statistik router Anda (traffic, CPU, tabel routing) hanya dengan mengetahui IP router.',
      fix: 'Ganti community string "public" dengan nama yang unik di System → SNMP → Communities. ' +
           'Atau nonaktifkan SNMP jika tidak digunakan untuk monitoring.',
      tab: 'system-snmp-comm',
      commands: [
        '# Ganti "nama-rahasia-saya" dengan string unik Anda',
        '/snmp community set public name=nama-rahasia-saya',
        '# Atau nonaktifkan SNMP sepenuhnya jika tidak dipakai',
        '/snmp set enabled=no',
      ],
    });
  }

  // ─── KONEKTIVITAS ──────────────────────────────────────────────────────────

  // Tidak ada default route
  const hasDefaultRoute = routes.some(
    r => (r['dst-address'] === '0.0.0.0/0' || r['dst-address'] === '::/0') && r.active !== false
  );
  if (!hasDefaultRoute && routes.length > 0) {
    issues.push({
      severity: 'warning',
      category: 'Konektivitas',
      icon: '🛣️',
      title: 'Tidak ada jalur internet (default route)',
      description:
        'Default route (0.0.0.0/0) adalah "jalan utama" ke internet. Tanpanya, router tidak tahu ' +
        'harus mengirim paket ke mana jika tujuannya tidak ada di tabel routing lokal.',
      fix: 'Tambahkan route baru: dst-address=0.0.0.0/0, gateway=<IP gateway ISP Anda> di IP → Routes.',
      tab: 'ip-routes',
      commands: ['# Ganti 1.2.3.4 dengan IP gateway dari ISP Anda', '/ip route add dst-address=0.0.0.0/0 gateway=1.2.3.4 comment="Default Route - Internet"'],
    });
  }

  // Tidak ada NAT/masquerade tapi ada DHCP server
  const hasMasquerade = natRules.some(r => r.action === 'masquerade');
  if (!hasMasquerade && dhcpServers.length > 0 && hasDefaultRoute) {
    issues.push({
      severity: 'info',
      category: 'Konektivitas',
      icon: '🔄',
      title: 'NAT Masquerade belum dikonfigurasi',
      description:
        'Router Anda melayani perangkat lewat DHCP, tetapi tidak ada aturan NAT Masquerade. ' +
        'Ini berarti perangkat di jaringan lokal mungkin tidak bisa mengakses internet. ' +
        'NAT adalah "penerjemah" yang mengubah IP lokal menjadi IP publik saat keluar ke internet.',
      fix: 'Buat aturan NAT di Firewall → NAT: chain=srcnat, out-interface=<interface WAN Anda>, action=masquerade.',
      tab: 'firewall-nat',
      commands: ['# Ganti "ether1" dengan nama interface WAN Anda', '/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade comment="Internet Sharing"'],
    });
  }

  // DNS belum dikonfigurasi (padahal ada DHCP server)
  const dnsServers = dns?.servers || [];
  if (dnsServers.length === 0 && dhcpServers.length > 0) {
    issues.push({
      severity: 'info',
      category: 'Konektivitas',
      icon: '🔍',
      title: 'DNS server belum dikonfigurasi',
      description:
        'Router punya DHCP Server (membagi IP ke perangkat) tapi DNS belum diset. ' +
        'Tanpa DNS, perangkat klien tidak bisa membuka website menggunakan nama (misal google.com) — ' +
        'hanya bisa dengan IP langsung.',
      fix: 'Tambahkan DNS server di IP → DNS. Contoh: isi "8.8.8.8" (Google) atau "1.1.1.1" (Cloudflare) ' +
           'dan aktifkan "Allow Remote Requests".',
      tab: 'ip-dns',
      commands: ['/ip dns set servers=8.8.8.8,1.1.1.1 allow-remote-requests=yes'],
    });
  }

  // ─── MONITORING ────────────────────────────────────────────────────────────

  // NTP belum dikonfigurasi
  const ntpEnabled = ntpClient?.enabled === 'yes';
  const ntpServers = ntpClient?.servers
    || ntpClient?.['server-dns-names']
    || (ntpClient?.['primary-ntp'] ? ntpClient['primary-ntp'] : null);
  if (!ntpEnabled && !ntpServers) {
    issues.push({
      severity: 'info',
      category: 'Monitoring',
      icon: '🕐',
      title: 'Sinkronisasi waktu (NTP) belum aktif',
      description:
        'Jam router yang tidak akurat membuat semua log menjadi tidak bisa dipercaya. ' +
        'Ketika terjadi insiden keamanan, timestamp yang salah membuat investigasi sangat sulit. ' +
        'Bayangkan CCTV yang jam-nya salah 3 jam.',
      fix: 'Aktifkan NTP Client di System → NTP Client, tambahkan server: pool.ntp.org. ' +
           'Pastikan juga timezone sudah benar di System → Clock.',
      tab: 'system-ntp-client',
      commands: [
        '/system ntp client set enabled=yes servers=pool.ntp.org',
        '# Atur timezone sesuai lokasi Anda (contoh Asia/Jakarta)',
        '/system clock set time-zone-name=Asia/Jakarta',
      ],
    });
  }

  // Logging belum dikonfigurasi
  if (logging.length === 0) {
    issues.push({
      severity: 'info',
      category: 'Monitoring',
      icon: '📝',
      title: 'Tidak ada aturan logging (pencatatan aktivitas)',
      description:
        'Tanpa logging, semua aktivitas di router tidak tercatat: login gagal, perubahan konfigurasi, ' +
        'koneksi mencurigakan — semuanya hilang tanpa jejak. Seperti gedung tanpa buku tamu.',
      fix: 'Konfigurasi System → Logging. Minimal tambahkan aturan untuk topic "error" dan "warning" ' +
           'dengan action "memory" atau "disk" agar bisa diperiksa nanti.',
      tab: 'system-logging',
      commands: [
        '/system logging add topics=error action=memory',
        '/system logging add topics=warning action=memory',
        '/system logging add topics=info action=memory',
        '/system logging add topics=critical action=disk',
      ],
    });
  }

  // ─── SCORE ─────────────────────────────────────────────────────────────────

  let score = 100;
  issues.forEach(issue => {
    if (issue.severity === 'critical') score -= 25;
    else if (issue.severity === 'warning') score -= 12;
    else score -= 5;
  });
  score = Math.max(0, Math.min(100, score));

  let grade, gradeLabel, gradeColor;
  if      (score >= 90) { grade = 'A'; gradeLabel = 'Sangat Baik';     gradeColor = '#22c55e'; }
  else if (score >= 75) { grade = 'B'; gradeLabel = 'Baik';            gradeColor = '#84cc16'; }
  else if (score >= 60) { grade = 'C'; gradeLabel = 'Cukup';           gradeColor = '#eab308'; }
  else if (score >= 40) { grade = 'D'; gradeLabel = 'Perlu Perhatian'; gradeColor = '#f97316'; }
  else                  { grade = 'F'; gradeLabel = 'Berbahaya';       gradeColor = '#ef4444'; }

  // ─── PLAIN SUMMARY ─────────────────────────────────────────────────────────

  const identity = config.metadata?.identity || 'Router';
  const activeIfaces = interfaces.filter(i => i.active).length;

  const summaryParts = [];

  if (dhcpServers.length > 0)
    summaryParts.push(`melayani perangkat klien melalui ${dhcpServers.length} DHCP Server (membagikan IP otomatis)`);
  if (hasDefaultRoute && hasMasquerade)
    summaryParts.push('membagikan akses internet ke jaringan lokal menggunakan NAT');
  else if (hasDefaultRoute)
    summaryParts.push('memiliki jalur ke internet');
  if (filterRules.length > 0)
    summaryParts.push(`dilindungi oleh ${filterRules.length} aturan keamanan firewall`);
  if (vpnTotal > 0)
    summaryParts.push(`memiliki ${vpnTotal} tunnel VPN aktif`);
  if (activeIfaces > 0)
    summaryParts.push(`menggunakan ${activeIfaces} interface jaringan aktif`);

  const plainSummary = summaryParts.length > 0
    ? `Router "${identity}" ini sedang: ${summaryParts.join(', ')}.`
    : `Router "${identity}" terdeteksi dengan konfigurasi minimal.`;

  return {
    score,
    grade,
    gradeLabel,
    gradeColor,
    issues,
    criticalCount: issues.filter(i => i.severity === 'critical').length,
    warningCount:  issues.filter(i => i.severity === 'warning').length,
    infoCount:     issues.filter(i => i.severity === 'info').length,
    plainSummary,
  };
}
