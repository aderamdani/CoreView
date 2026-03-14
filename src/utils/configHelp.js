/**
 * Teks bantuan kontekstual untuk setiap bagian konfigurasi RouterOS.
 * - Istilah teknis jaringan tetap dalam bahasa Inggris
 * - Penjelasan menggunakan bahasa Indonesia
 * - relations: array string yang cocok dengan kunci di relationToTab (Dashboard.jsx)
 */
export const configHelp = {

  overview: {
    title: 'Informasi Perangkat',
    summary: 'Identitas umum dan informasi hardware router MikroTik ini. Metadata ini tersimpan di setiap file konfigurasi yang diekspor.',
    impact: [
      'Nama identity ditampilkan di Winbox, SNMP trap, alert Netwatch, dan log sistem — pastikan nama ini mudah dikenali.',
      'Informasi model menentukan fitur hardware yang tersedia, seperti port PoE, SFP, atau kapasitas throughput.',
      'Serial number digunakan untuk aktivasi MikroTik Cloud (DDNS) dan pencocokan lisensi perangkat.',
    ],
    relations: ['System → Identity', 'IP → Cloud', 'SNMP'],
  },

  'interfaces-list': {
    title: 'Network Interfaces',
    summary: 'Seluruh interface fisik dan virtual pada router ini, termasuk Ethernet, Bridge, VLAN, WireGuard, dan adapter OpenVPN.',
    impact: [
      'Setiap interface perlu memiliki IP address agar bisa meneruskan lalu lintas Layer 3. Tanpa IP, hanya Layer 2 (bridging) yang aktif.',
      'Status interface (enabled/disabled) langsung mengontrol apakah traffic dapat melewati port tersebut.',
      'Menonaktifkan interface akan memutus seluruh koneksi yang menggunakannya, termasuk DHCP lease, VPN tunnel, dan aturan NAT.',
      'MAC address dan MTU memengaruhi ARP resolution, fragmentasi paket, dan kompatibilitas PPPoE dengan ISP.',
    ],
    relations: ['IP → Addresses', 'Bridge → Ports', 'Interface Lists', 'DHCP Server', 'Firewall Filter'],
    prerequisites: [],
    nextSteps: ['IP → Addresses', 'Bridge'],
  },

  'interfaces-lists': {
    title: 'Interface Lists',
    summary: 'Kumpulan interface yang diberi nama sebagai grup logis, misalnya "WAN", "LAN", atau "LB". Berfungsi sebagai target shorthand dalam aturan Firewall, NAT, dan Routing.',
    impact: [
      'Aturan Firewall/NAT yang menargetkan Interface List akan otomatis berlaku untuk semua interface dalam grup tersebut — menambah interface baru ke list berarti aturan langsung aktif untuknya.',
      'List "WAN" biasa digunakan untuk membatasi masquerade NAT dan memblokir traffic inbound yang tidak diminta dari internet.',
      'List "LAN" atau "LB" digunakan untuk mendefinisikan jaringan tepercaya yang boleh mengakses layanan DHCP dan DNS router.',
    ],
    relations: ['Firewall Filter', 'Firewall → NAT', 'IP → Routes'],
  },

  'bridge-list': {
    title: 'Bridge',
    summary: 'Virtual Layer 2 switch yang menggabungkan beberapa interface fisik menjadi satu broadcast domain yang sama — seperti switch internal di dalam router.',
    impact: [
      'Semua port anggota bridge berbagi subnet IP dan ARP table yang sama, sehingga perangkat di port berbeda bisa berkomunikasi langsung tanpa proses routing.',
      'IP address sebaiknya dipasang di interface bridge (bukan di port fisik anggotanya) — ini adalah pola standar LAN gateway di MikroTik.',
      'STP/RSTP (protocol-mode) mencegah bridge loop ketika terdapat beberapa jalur fisik antara switch yang terhubung.',
      'Menonaktifkan bridge akan memutus seluruh konektivitas LAN untuk semua port anggotanya sekaligus.',
    ],
    relations: ['Bridge → Ports', 'IP → Addresses', 'DHCP Server', 'Firewall Filter'],
    prerequisites: ['Network Interfaces'],
    nextSteps: ['Bridge → Ports', 'IP → Addresses'],
  },

  'bridge-ports': {
    title: 'Bridge Ports',
    summary: 'Interface fisik atau virtual yang ditugaskan menjadi anggota sebuah bridge.',
    impact: [
      'Interface yang masuk sebagai bridge port kehilangan kemampuan routing individual — traffic diteruskan di Layer 2 melalui bridge induknya.',
      'PVID (Port VLAN ID) menentukan VLAN tag default untuk frame untagged yang masuk ke port ini — relevan untuk setup VLAN-aware bridge.',
      'Menonaktifkan sebuah bridge port akan mengisolasi interface fisik tersebut dari segmen LAN bridge.',
    ],
    relations: ['Bridge', 'IP → Addresses', 'Network Interfaces'],
    prerequisites: ['Bridge', 'Network Interfaces'],
    nextSteps: ['IP → Addresses'],
  },

  'ip-addresses': {
    title: 'IP Addresses',
    summary: 'Alamat IPv4 yang dikonfigurasi pada masing-masing interface router. Setiap address mendefinisikan segmen jaringan yang diikuti oleh router.',
    impact: [
      'Router menggunakan address ini sebagai default gateway untuk setiap subnet yang terhubung langsung.',
      'DHCP server, aturan firewall, dan static route divalidasi berdasarkan address yang dikonfigurasi pada interface.',
      'Menghapus IP address akan langsung memutus routing untuk subnet tersebut — semua perangkat di segmen itu kehilangan akses gateway.',
      'Besar prefix (misalnya /24 vs /28) menentukan jumlah host yang didukung — prefix terlalu kecil menyebabkan kehabisan alamat.',
    ],
    relations: ['Network Interfaces', 'DHCP Server', 'Firewall Filter', 'IP → Routes'],
    prerequisites: ['Network Interfaces', 'Bridge'],
    nextSteps: ['DHCP Server', 'IP → Routes', 'Firewall → NAT'],
  },

  'ip-dhcp-server': {
    title: 'DHCP Server',
    summary: 'Secara otomatis mendistribusikan IP address, gateway, dan DNS ke perangkat klien yang terhubung ke segmen LAN.',
    impact: [
      'Tanpa DHCP server, setiap perangkat harus dikonfigurasi IP statis secara manual — tidak praktis untuk jaringan besar.',
      'Kapasitas address pool menentukan batas maksimum klien yang bisa terlayani secara bersamaan. Pool yang habis membuat perangkat baru tidak mendapat IP.',
      'Pengaturan DNS server yang dikirim ke klien menentukan nameserver yang mereka gunakan — penting untuk implementasi split-horizon DNS atau resolver kustom.',
      'Lease time yang terlalu pendek meningkatkan overhead traffic DHCP; terlalu panjang membuat address pool terblokir oleh klien yang sudah tidak aktif.',
    ],
    relations: ['IP → Pools', 'IP → Addresses', 'DNS', 'Network Interfaces'],
    prerequisites: ['IP → Addresses', 'IP → Pools'],
    nextSteps: ['Firewall → NAT', 'DNS'],
  },

  'ip-dhcp-client': {
    title: 'DHCP Client',
    summary: 'Mengkonfigurasi interface agar menerima IP address secara dinamis dari penyedia upstream, seperti ISP, modem, atau router di atasnya.',
    impact: [
      '"Add Default Route" otomatis menyuntikkan default route 0.0.0.0/0 saat ISP memberikan IP — ini wajib ada agar internet bisa berjalan.',
      '"Use Peer DNS" menimpa konfigurasi DNS router dengan DNS yang diberikan ISP — nonaktifkan jika ingin menggunakan DNS kustom.',
      'Menonaktifkan DHCP client pada interface WAN akan langsung memutus koneksi internet jika tidak ada konfigurasi IP statis sebagai cadangan.',
    ],
    relations: ['IP → Routes', 'DNS', 'Network Interfaces'],
    prerequisites: ['Network Interfaces'],
    nextSteps: ['Firewall → NAT'],
  },

  'ip-dns': {
    title: 'DNS',
    summary: 'Mengontrol recursive DNS resolver bawaan RouterOS. Router ini bisa bertindak sebagai DNS server untuk seluruh klien LAN.',
    impact: [
      'Upstream DNS server (misalnya 8.8.8.8, 1.1.1.1) diakses untuk domain yang tidak ada di cache lokal router.',
      'Static DNS entry mengesampingkan resolusi untuk domain tertentu — berguna untuk split-horizon DNS atau pemblokiran domain spesifik.',
      'Jika "Allow Remote Requests" diaktifkan, klien LAN bisa menggunakan IP router sebagai DNS server mereka.',
      'DNS server yang tidak bisa dijangkau akan memperlambat semua aktivitas browsing internet untuk seluruh klien LAN.',
    ],
    relations: ['DHCP Server', 'IP → Addresses', 'Firewall Filter'],
    prerequisites: ['IP → Addresses'],
    nextSteps: ['DHCP Server'],
  },

  'ip-routes': {
    title: 'IP Routes',
    summary: 'Entri tabel routing statis yang menentukan next hop untuk lalu lintas IP keluar dari router.',
    impact: [
      'Default route (0.0.0.0/0) mengarahkan semua traffic yang tidak dikenali ke gateway ISP — tanpa ini, tidak ada akses internet sama sekali.',
      'Route yang lebih spesifik (/24, /32) memiliki prioritas lebih tinggi daripada default route — digunakan untuk VPN split tunneling atau konfigurasi multi-WAN.',
      'Routing mark pada route menargetkan traffic dari Mangle ke WAN link tertentu — esensial untuk load balancing PCC.',
      'Route yang salah atau hilang menyebabkan "black hole" — paket dibuang diam-diam tanpa notifikasi error ke pengirim.',
    ],
    relations: ['Routing Tables', 'Firewall → Mangle', 'Network Interfaces'],
    prerequisites: ['IP → Addresses', 'Routing Tables'],
    nextSteps: ['Firewall Filter', 'Firewall → Mangle'],
  },

  'ip-pool': {
    title: 'IP Pools',
    summary: 'Rentang alamat IP yang diberi nama dan dialokasikan untuk DHCP server, sesi Hotspot, atau koneksi VPN/PPP.',
    impact: [
      'Ukuran pool secara langsung membatasi jumlah DHCP lease atau sesi Hotspot yang aktif secara bersamaan.',
      'Rentang pool yang tumpang tindih dengan IP statis perangkat akan menyebabkan konflik IP — perangkat bisa tidak bisa dijangkau.',
      'Beberapa pool bisa dirantai (next-pool) — ketika pool pertama habis, overflow dialihkan ke pool berikutnya secara otomatis.',
    ],
    relations: ['DHCP Server', 'Hotspot', 'VPN'],
    prerequisites: ['IP → Addresses'],
    nextSteps: ['DHCP Server', 'VPN', 'Hotspot'],
  },

  'ip-cloud': {
    title: 'IP Cloud / MikroTik DDNS',
    summary: 'Layanan Dynamic DNS (DDNS) bawaan MikroTik. Memberikan hostname statis yang selalu menunjuk ke IP publik router saat ini, meski IP berubah.',
    impact: [
      'Memungkinkan akses Winbox, SSH, atau VPN jarak jauh meski ISP memberikan IP publik yang berubah-ubah (IP dinamis).',
      '"Update Time" menyinkronkan jam router ke NTP MikroTik — menonaktifkannya bisa menyebabkan masalah validasi sertifikat SSL/TLS.',
      'Fitur ini membutuhkan koneksi internet aktif dan akun MikroTik yang valid untuk registrasi hostname.',
    ],
    relations: ['IP → Services', 'System → Clock', 'VPN'],
  },

  'ip-hotspot': {
    title: 'Hotspot',
    summary: 'Sistem captive portal yang mengintersep traffic HTTP dan mengalihkan klien yang belum login ke halaman autentikasi sebelum diberikan akses internet.',
    impact: [
      'Hotspot server terikat ke satu interface tertentu — hanya klien pada interface tersebut yang terkena portal login.',
      'IP Binding memungkinkan MAC/IP tertentu melewati proses login (misalnya printer, server) atau diblokir secara permanen.',
      'Walled Garden mengizinkan akses ke domain/IP tertentu tanpa login, misalnya untuk halaman perusahaan atau payment gateway.',
      'User profile mendefinisikan batas bandwidth (rate-limit), durasi sesi, dan alokasi IP pool per tingkatan pengguna.',
      'Menonaktifkan Hotspot server memberikan akses internet bebas kepada semua klien di interface tersebut.',
    ],
    relations: ['IP → Pools', 'Firewall Filter', 'IP → Addresses', 'DHCP Server'],
    prerequisites: ['IP → Addresses', 'IP → Pools'],
    nextSteps: ['Firewall Filter'],
  },

  'ip-services': {
    title: 'IP Services',
    summary: 'Layanan akses manajemen yang berjalan di router: API, SSH, Telnet, Winbox, FTP, dan HTTP/HTTPS.',
    impact: [
      'Menonaktifkan Winbox (port 8291) memblokir seluruh akses manajemen GUI dari aplikasi Winbox.',
      'Menonaktifkan SSH (port 22) mencegah otomatisasi via script dan akses CLI jarak jauh.',
      'Membiarkan Telnet aktif berbahaya — password dikirim dalam plaintext dan bisa disadap di jaringan.',
      '"Available From" membatasi range IP yang boleh mengakses layanan tertentu — sangat penting untuk hardening keamanan router.',
      'Mengubah port default dari nilai bawaan mengurangi paparan terhadap pemindai otomatis di internet.',
    ],
    relations: ['Firewall Filter', 'IP → Addresses', 'System → Identity'],
  },

  'routing-tables': {
    title: 'Routing Tables',
    summary: 'Tabel routing yang diberi nama untuk keperluan policy-based routing. Traffic bisa diarahkan ke tabel tertentu menggunakan routing mark dari Firewall Mangle.',
    impact: [
      'Setiap routing table memiliki set route independen — traffic di tabel "to_isp1" mengikuti gateway ISP1, sementara "to_isp2" mengikuti ISP2.',
      'Esensial untuk skenario multi-WAN dan load balancing — tanpa tabel terpisah, semua traffic mengikuti satu main table.',
      'Routing mark di Mangle harus persis sama dengan nama tabel — typo sekecil apapun membuat traffic jatuh kembali ke main table.',
    ],
    relations: ['Firewall → Mangle', 'IP → Routes', 'Network Interfaces'],
  },

  'firewall-filter': {
    title: 'Firewall Filter Rules',
    summary: 'Mesin packet filtering stateful. Mengontrol traffic mana yang diterima (ACCEPT), dibuang (DROP), atau ditolak (REJECT) melalui tiga chain: INPUT, OUTPUT, dan FORWARD.',
    impact: [
      'Chain INPUT melindungi router itu sendiri — konfigurasi yang salah di sini bisa mengunci akses manajemen Anda ke router.',
      'Chain FORWARD mengatur traffic LAN→WAN dan WAN→LAN — di sinilah kebijakan akses internet dan perlindungan dari internet didefinisikan.',
      'Aturan dievaluasi dari atas ke bawah; match pertama menang. Aturan "accept" yang terlalu luas di atas akan mengalahkan aturan "drop" spesifik di bawahnya.',
      'Jika tidak ada aturan "accept established,related" sebelum aturan "drop", semua koneksi stateful (termasuk yang sudah terbuka) akan terputus.',
    ],
    relations: ['Interface Lists', 'IP → Addresses', 'Firewall Address Lists', 'Firewall → Mangle'],
    prerequisites: ['IP → Addresses', 'Interface Lists', 'Firewall Address Lists'],
    nextSteps: ['Firewall → NAT'],
  },

  'firewall-nat': {
    title: 'Firewall NAT Rules',
    summary: 'Network Address Translation. Chain SRCNAT/Masquerade menulis ulang IP sumber untuk traffic keluar; chain DSTNAT/Port-forwarding menulis ulang IP tujuan untuk traffic masuk.',
    impact: [
      'Aturan Masquerade SRCNAT adalah yang memungkinkan semua perangkat LAN berbagi satu IP publik untuk mengakses internet.',
      'DSTNAT (port forwarding) mengekspos server internal ke internet — konfigurasi yang salah bisa membuka layanan sensitif secara tidak sengaja.',
      'Menghapus aturan masquerade akan langsung memutus akses internet semua perangkat di LAN.',
      'Double-NAT (NAT di belakang NAT) sering menyebabkan masalah pada VoIP, gaming online, dan beberapa protokol VPN.',
    ],
    relations: ['Network Interfaces', 'IP → Addresses', 'Firewall Filter'],
    prerequisites: ['IP → Addresses', 'Interface Lists'],
    nextSteps: ['Firewall Filter', 'Firewall → Mangle'],
  },

  'firewall-mangle': {
    title: 'Firewall Mangle Rules',
    summary: 'Mesin penandaan paket (packet marking) untuk keperluan QoS, traffic shaping, policy routing, dan connection tracking. Memodifikasi metadata paket tanpa membuang atau meneruskannya.',
    impact: [
      'Routing mark mengarahkan traffic ke routing table tertentu — sangat kritis untuk implementasi multi-WAN load balancing dan failover.',
      'Packet mark dikonsumsi oleh Queue Tree untuk menerapkan batas bandwidth berdasarkan jenis traffic.',
      'Connection mark bertahan sepanjang umur koneksi — penandaan pada new-connection saja sudah cukup untuk menghindari overhead per-paket.',
      'Aturan ECMP per-koneksi menggunakan Mangle untuk memastikan semua paket dalam satu sesi keluar lewat WAN link yang sama.',
    ],
    relations: ['Routing Tables', 'Queue Tree', 'IP → Routes', 'Firewall Filter'],
    prerequisites: ['Firewall Filter', 'Firewall → NAT'],
    nextSteps: ['Queue Tree', 'Routing Tables'],
  },

  'firewall-raw': {
    title: 'Firewall Raw Rules',
    summary: 'Tabel pre-connection yang beroperasi sebelum mesin connection tracking dijalankan. Digunakan untuk mitigasi DDoS berkinerja tinggi dan pembuangan paket tidak valid.',
    impact: [
      'Aturan di sini melewati connection tracking — biaya CPU jauh lebih rendah, cocok untuk membuang traffic volume sangat tinggi.',
      'Digunakan untuk membuang sumber serangan yang sudah diketahui, IP spoofed, dan paket tidak valid sebelum mengonsumsi resource routing.',
      'Membuang traffic legitimate di Raw tidak memicu state conntrack — lebih sulit untuk di-debug dibanding Firewall Filter.',
    ],
    relations: ['Firewall Filter', 'Firewall Address Lists'],
  },

  'firewall-address-lists': {
    title: 'Firewall Address Lists',
    summary: 'Kumpulan IP address dan subnet yang diberi nama. Digunakan sebagai blocklist/allowlist statis atau dinamis yang direferensikan oleh aturan Firewall.',
    impact: [
      'Aturan firewall yang mencocokkan "src-address-list" atau "dst-address-list" akan mengevaluasi seluruh IP dalam list hanya dengan satu aturan.',
      'Penambahan dinamis: aturan Mangle atau Filter bisa otomatis menambahkan IP pelanggar ke dalam list (misalnya, port scanner).',
      'List besar seperti range IP negara atau CIDR streaming service bisa dikelola di sini tanpa perlu membuat aturan individual.',
      'Menghapus list yang masih direferensikan oleh aturan aktif akan membuat aturan tersebut tidak pernah match.',
    ],
    relations: ['Firewall Filter', 'Firewall → Mangle'],
  },

  'queues-tree': {
    title: 'Queue Tree',
    summary: 'Sistem manajemen bandwidth hierarkis. Membatasi dan memprioritaskan traffic per koneksi, pengguna, atau kelas traffic menggunakan packet mark dari Mangle.',
    impact: [
      'Parent queue menetapkan total batas bandwidth (misal max-limit=100M) yang dibagi bersama oleh semua child queue di bawahnya.',
      'Child queue mereferensikan packet-mark dari Mangle — traffic wajib diberi tanda (mark) sebelum bisa masuk ke queue.',
      'Priority (1=tertinggi, 8=terendah) memastikan traffic real-time seperti VoIP dan video call diproses lebih dahulu daripada unduhan besar.',
      'burst-limit/burst-time memungkinkan lonjakan bandwidth sementara di atas batas normal untuk pengalaman browsing yang lebih responsif.',
    ],
    relations: ['Firewall → Mangle', 'Queue Types', 'Network Interfaces'],
    prerequisites: ['Firewall → Mangle', 'Queue Types'],
    nextSteps: [],
  },

  'queues-types': {
    title: 'Queue Types',
    summary: 'Mendefinisikan algoritma antrean yang dipakai oleh Queue Tree atau Simple Queue (misalnya PCQ, FIFO, RED, SFQ).',
    impact: [
      'PCQ (Per Connection Queue) paling umum digunakan untuk keadilan antar pengguna — bandwidth tersedia dibagi merata secara otomatis.',
      'FIFO paling sederhana namun tidak adil — satu pengguna berat bisa menghabiskan semua bandwidth yang ada.',
      'SFQ (Stochastic Fairness Queuing) memberikan distribusi adil antar flow tanpa perlu konfigurasi per-IP.',
      'Pilihan algoritma secara langsung memengaruhi keadilan distribusi, latensi, dan responsivitas jaringan saat terjadi kemacetan.',
    ],
    relations: ['Queue Tree', 'Firewall → Mangle'],
  },

  'system-identity': {
    title: 'System Identity',
    summary: 'Nama hostname router ini. Ditampilkan di Winbox, SNMP, Netwatch, log sistem, dan neighbour discovery (MNDP/LLDP).',
    impact: [
      'Identity disiarkan via CDP/LLDP/MNDP sehingga terlihat oleh perangkat MikroTik lain dan sistem Network Management.',
      'SNMP trap dan syslog menyertakan identity dalam setiap pesan — penting untuk membedakan alert dari beberapa router sekaligus.',
    ],
    relations: ['SNMP', 'IP → Cloud', 'System → Logging'],
  },

  'system-clock': {
    title: 'System Clock',
    summary: 'Konfigurasi timezone dan sinkronisasi NTP. Waktu yang akurat sangat penting untuk validitas sertifikat, log yang bisa diandalkan, dan script terjadwal.',
    impact: [
      'Timezone yang salah membuat semua timestamp log tidak sesuai waktu nyata — menyulitkan investigasi insiden keamanan.',
      'Sertifikat TLS/SSL sensitif terhadap waktu — jam yang salah menyebabkan koneksi HTTPS gagal dengan error "certificate not yet valid".',
      'Scheduler script dan jadwal bandwidth berbasis waktu akan berjalan pada waktu yang salah jika timezone tidak dikonfigurasi benar.',
    ],
    relations: ['IP → Cloud', 'System → Logging', 'IP → Services'],
  },

  'system-logging': {
    title: 'System Logging',
    summary: 'Mengkonfigurasi ke mana pesan log dikirim: disk lokal, memori, remote syslog, atau email.',
    impact: [
      'Logging ke "disk" menyimpan log yang bertahan antar reboot — krusial untuk audit, forensik, dan kepatuhan regulasi.',
      'Remote syslog (action=remote) mengirim log ke server SIEM atau log aggregator terpusat.',
      'Topic log (firewall, dhcp, system) mengontrol detail log — logging terlalu granular pada traffic tinggi bisa memenuhi disk dengan cepat.',
    ],
    relations: ['System → Identity', 'System → Clock', 'Firewall Filter'],
  },

  'system-snmp': {
    title: 'SNMP',
    summary: 'Simple Network Management Protocol. Memungkinkan sistem monitoring eksternal seperti Zabbix, PRTG, atau LibreNMS untuk mengambil statistik dari router ini.',
    impact: [
      'SNMP v2c hanya menggunakan community string sebagai autentikasi — gunakan string yang tidak mudah ditebak agar tidak dibaca pihak lain.',
      'SNMP v3 menyediakan enkripsi dan autentikasi yang lebih kuat — disarankan untuk lingkungan yang memprioritaskan keamanan.',
      'Data yang bisa diambil mencakup counter traffic interface, beban CPU, penggunaan memori, dan tabel routing — berguna untuk capacity planning.',
      'Menonaktifkan SNMP akan memutus semua dashboard monitoring eksternal dan sistem alerting berbasis SNMP.',
    ],
    relations: ['System → Identity', 'Network Interfaces', 'Firewall Filter'],
  },

  'system-ports': {
    title: 'Serial / Hardware Ports',
    summary: 'Port konsol serial fisik pada router, digunakan untuk manajemen out-of-band ketika akses jaringan tidak tersedia sama sekali.',
    impact: [
      'Konsol serial adalah pilihan terakhir ketika router tidak bisa dijangkau lewat jaringan, misalnya akibat aturan firewall yang salah atau IP yang terkonfigurasi keliru.',
      'Baud rate harus cocok dengan pengaturan terminal emulator — ketidakcocokan menghasilkan output yang tidak terbaca (garbled).',
      'Beberapa model RouterBOARD menggunakan serial port untuk proses recovery firmware yang rusak via kabel konsol.',
    ],
    relations: ['System → Identity', 'IP → Services'],
  },

  'tools-graphing': {
    title: 'Interface Graphing',
    summary: 'Grafik riwayat traffic untuk interface yang dipilih, disimpan di disk atau RAM dan dapat dilihat melalui web interface bawaan router.',
    impact: [
      'Grafik tersedia dalam rentang 24 jam, 7 hari, dan 30 hari — membantu analisis tren penggunaan bandwidth.',
      '"Store on disk" mempertahankan data grafik antar reboot — menonaktifkannya berarti semua riwayat hilang setiap kali router restart.',
      '"Allow Address" membatasi siapa yang boleh melihat grafik — penting agar data traffic tidak terbuka ke semua orang.',
      'Interface dengan traffic tinggi menghasilkan file grafik yang besar — perlu pantau penggunaan storage disk secara berkala.',
    ],
    relations: ['Network Interfaces', 'IP → Services', 'System → Identity'],
  },

  vpn: {
    title: 'VPN Connections',
    summary: 'Tunnel Virtual Private Network: WireGuard (modern, performa tinggi), OpenVPN (kompatibilitas luas), dan L2TP/IPSec (native di Windows).',
    impact: [
      'WireGuard peer mendefinisikan klien atau site jarak jauh yang boleh terhubung, diverifikasi menggunakan kriptografi public key.',
      'Allowed-address pada setiap WireGuard peer adalah allowlist ketat — traffic dari IP selain yang terdaftar akan dibuang oleh peer.',
      'OpenVPN dan L2TP yang diakses dari internet membutuhkan aturan INPUT di Firewall untuk mengizinkan port tunnel terkait.',
      'Route VPN yang salah konfigurasi bisa menyebabkan seluruh traffic internet pengguna mengalir lewat VPN (full tunnel) tanpa disengaja.',
    ],
    relations: ['Firewall Filter', 'IP → Routes', 'IP → Addresses', 'Firewall → Mangle'],
    prerequisites: ['IP → Pools', 'IP → Addresses'],
    nextSteps: ['Firewall Filter', 'IP → Routes'],
  },

  'bridge-vlans': {
    title: 'Bridge VLANs',
    summary: 'Konfigurasi VLAN filtering pada bridge untuk segmentasi Layer 2 menggunakan VLAN ID dan daftar port tagged/untagged.',
    impact: [
      'Jika VLAN filtering aktif tetapi tabel VLAN tidak lengkap, traffic dapat terblokir total pada port tertentu.',
      'Pemilihan tagged/untagged menentukan apakah frame keluar membawa VLAN tag atau tidak.',
      'Kesalahan PVID dan membership VLAN menjadi penyebab umum perangkat tidak mendapat akses jaringan.',
    ],
    relations: ['Bridge', 'Bridge → Ports', 'IP → Addresses'],
  },

  'ip-dhcp-relay': {
    title: 'DHCP Relay',
    summary: 'Meneruskan request DHCP dari subnet lokal ke DHCP server yang berada di segmen jaringan lain.',
    impact: [
      'Tanpa relay, klien pada subnet terpisah tidak bisa menjangkau DHCP server pusat.',
      'IP helper/relay target yang salah membuat klien gagal mendapatkan lease.',
      'Relay mempermudah sentralisasi DHCP di jaringan multi-site.',
    ],
    relations: ['DHCP Server', 'IP → Addresses', 'IP → Routes'],
  },

  'ip-upnp': {
    title: 'UPnP',
    summary: 'Universal Plug and Play untuk membuka port forwarding otomatis dari perangkat klien ke router.',
    impact: [
      'Mempermudah aplikasi seperti game/VoIP, tetapi menambah risiko keamanan jika tidak dibatasi.',
      'UPnP yang aktif di interface WAN dapat membuka layanan internal tanpa kontrol ketat.',
      'Disarankan hanya aktif pada jaringan LAN tepercaya.',
    ],
    relations: ['Firewall → NAT', 'Firewall Filter', 'Interface Lists'],
  },

  'ip-socks': {
    title: 'SOCKS Proxy',
    summary: 'Layanan proxy SOCKS bawaan router untuk meneruskan traffic aplikasi melalui router.',
    impact: [
      'SOCKS tanpa pembatasan address dapat disalahgunakan sebagai open proxy.',
      'Penggunaan proxy menambah beban CPU router.',
      'Perlu firewall INPUT yang ketat saat layanan ini diaktifkan.',
    ],
    relations: ['IP → Services', 'Firewall Filter'],
  },

  'ip-proxy': {
    title: 'Web Proxy',
    summary: 'HTTP proxy bawaan RouterOS untuk caching, filtering sederhana, dan kontrol akses web.',
    impact: [
      'Caching dapat menghemat bandwidth untuk konten berulang.',
      'Proxy transparan yang salah aturan dapat memutus akses web klien.',
      'Proxy perlu resource memori/disk tambahan untuk performa stabil.',
    ],
    relations: ['Firewall → NAT', 'Firewall Filter', 'IP → Addresses'],
  },

  'ip-traffic-flow': {
    title: 'Traffic Flow',
    summary: 'Ekspor metadata flow (NetFlow/IPFIX style) ke collector untuk analisis traffic dan visibilitas jaringan.',
    impact: [
      'Membantu analisis top talker, aplikasi dominan, dan pola anomali traffic.',
      'Sampling/timeout yang terlalu detail meningkatkan overhead CPU router.',
      'Collector eksternal wajib tersedia agar data flow termonitor dengan baik.',
    ],
    relations: ['System → Logging', 'Network Interfaces', 'Firewall Filter'],
  },

  'ip-accounting': {
    title: 'IP Accounting',
    summary: 'Pencatatan statistik penggunaan traffic per host/per flow untuk kebutuhan audit dan billing sederhana.',
    impact: [
      'Memberikan visibilitas konsumsi bandwidth antar host.',
      'Pada traffic tinggi, akuntansi detail bisa menambah beban sistem.',
      'Data perlu diekspor/diarsipkan berkala untuk histori jangka panjang.',
    ],
    relations: ['System → Logging', 'Network Interfaces'],
  },

  'routing-rules': {
    title: 'Routing Rules',
    summary: 'Aturan policy routing yang menentukan traffic tertentu harus lookup ke routing table tertentu.',
    impact: [
      'Mengarahkan subnet/pengguna tertentu ke jalur WAN berbeda tanpa mengubah default route global.',
      'Rule yang terlalu umum dapat menimpa alur routing normal.',
      'Urutan rule penting: rule pertama yang match akan diterapkan.',
    ],
    relations: ['Routing Tables', 'IP → Routes', 'Firewall → Mangle'],
  },

  'routing-filters': {
    title: 'Routing Filters',
    summary: 'Filter kebijakan untuk menerima, memodifikasi, atau menolak route dari protokol routing dinamis.',
    impact: [
      'Mencegah route tidak diinginkan masuk ke tabel routing.',
      'Filter yang terlalu ketat bisa membuat route valid tidak pernah terpasang.',
      'Sangat penting pada lingkungan BGP/OSPF skala menengah-besar.',
    ],
    relations: ['Routing Tables', 'IP → Routes', 'routing-bgp', 'routing-ospf'],
  },

  'routing-ospf': {
    title: 'OSPF',
    summary: 'Open Shortest Path First, protokol routing dinamis internal (IGP) berbasis link-state.',
    impact: [
      'Memungkinkan konvergensi routing otomatis saat link berubah.',
      'Desain area OSPF memengaruhi skala dan stabilitas jaringan.',
      'Konfigurasi autentikasi OSPF meningkatkan keamanan adjacency.',
    ],
    relations: ['IP → Routes', 'Routing Tables', 'Network Interfaces'],
  },

  'routing-rip': {
    title: 'RIP',
    summary: 'Routing Information Protocol berbasis distance-vector dengan metrik hop count.',
    impact: [
      'Sederhana untuk jaringan kecil, namun kurang efisien pada jaringan besar.',
      'Batas hop count membuat RIP tidak cocok untuk topologi kompleks.',
      'Update periodik dapat meningkatkan chatter pada link lambat.',
    ],
    relations: ['IP → Routes', 'Routing Tables', 'Network Interfaces'],
  },

  'routing-bgp': {
    title: 'BGP',
    summary: 'Border Gateway Protocol untuk pertukaran route antar-AS atau multi-uplink tingkat lanjut.',
    impact: [
      'Memungkinkan kontrol traffic engineering inbound/outbound skala besar.',
      'Kesalahan policy BGP bisa mengakibatkan route leak yang berdampak luas.',
      'Perlu filtering prefix dan hardening session (TTL/auth) untuk keamanan.',
    ],
    relations: ['Routing Filters', 'IP → Routes', 'Routing Tables'],
  },

  'routing-mpls': {
    title: 'MPLS',
    summary: 'Multiprotocol Label Switching untuk forwarding berbasis label pada jaringan backbone/provider.',
    impact: [
      'Meningkatkan efisiensi forwarding untuk layanan L3VPN/TE tertentu.',
      'Desain label distribution dan IGP harus sinkron agar stabil.',
      'Troubleshooting MPLS lebih kompleks dibanding routing IP biasa.',
    ],
    relations: ['Routing Tables', 'OSPF', 'BGP'],
  },

  'routing-vrf': {
    title: 'VRF',
    summary: 'Virtual Routing and Forwarding untuk memisahkan tabel routing antar tenant/layanan dalam satu router.',
    impact: [
      'Memungkinkan isolasi traffic antar pelanggan/divisi.',
      'Route leaking antar VRF harus dirancang hati-hati agar tidak melanggar isolasi.',
      'Konfigurasi service (DNS, NTP, management) perlu mempertimbangkan konteks VRF.',
    ],
    relations: ['Routing Tables', 'IP → Routes', 'Firewall Filter'],
  },

  'firewall-layer7': {
    title: 'Layer7 Protocols',
    summary: 'Pencocokan pola regex payload untuk identifikasi trafik aplikasi tingkat tinggi.',
    impact: [
      'Fleksibel untuk klasifikasi trafik tertentu, namun berat di CPU.',
      'Regex yang buruk dapat memicu false positive/false negative.',
      'Disarankan gunakan selektif dan kombinasikan dengan metode matching lain.',
    ],
    relations: ['Firewall Filter', 'Firewall → Mangle', 'Queue Tree'],
  },

  'queues-simple': {
    title: 'Simple Queues',
    summary: 'Manajemen bandwidth cepat berbasis target host/subnet tanpa struktur hierarki kompleks.',
    impact: [
      'Mudah diterapkan untuk limit per-user atau per-subnet.',
      'Pada skala besar, performa bisa kalah dibanding Queue Tree + packet mark.',
      'Urutan simple queue memengaruhi evaluasi dan hasil shaping.',
    ],
    relations: ['Queue Types', 'Queue Tree', 'Firewall → Mangle'],
  },

  'queues-interfaces': {
    title: 'Interface Queues',
    summary: 'Queue pada level interface untuk mengendalikan output traffic langsung pada interface tertentu.',
    impact: [
      'Berguna untuk kontrol cepat pada uplink/downlink spesifik.',
      'Konfigurasi yang tidak selaras dengan queue lain bisa menyebabkan shaping tidak konsisten.',
      'Perlu pemahaman arah traffic (in/out) untuk hasil akurat.',
    ],
    relations: ['Network Interfaces', 'Queue Types', 'Queue Tree'],
  },

  'tools-ping': {
    title: 'Ping Tool',
    summary: 'Menguji reachability host dan latency dasar ICMP dari router.',
    impact: [
      'Mendeteksi cepat apakah host aktif/terjangkau.',
      'Latency tinggi/packet loss mengindikasikan kongesti atau link bermasalah.',
      'Dapat dipakai sebagai baseline troubleshooting konektivitas.',
    ],
    relations: ['IP → Routes', 'Network Interfaces', 'Firewall Filter'],
  },

  'tools-traceroute': {
    title: 'Traceroute Tool',
    summary: 'Melacak jalur hop-by-hop paket dari router ke target.',
    impact: [
      'Membantu mengetahui titik bottleneck atau jalur yang putus.',
      'Perbedaan jalur bisa terjadi karena policy routing/multi-WAN.',
      'Firewall upstream dapat menyembunyikan hop tertentu.',
    ],
    relations: ['IP → Routes', 'Routing Tables', 'Firewall Filter'],
  },

  'tools-bandwidth-test': {
    title: 'Bandwidth Test',
    summary: 'Pengujian throughput antar perangkat MikroTik untuk mengukur kapasitas link.',
    impact: [
      'Tes intensif dapat membebani CPU sehingga memengaruhi trafik produksi.',
      'Harus dijalankan saat maintenance atau window uji terkontrol.',
      'Berguna untuk validasi performa setelah perubahan QoS/routing.',
    ],
    relations: ['Queue Tree', 'Network Interfaces', 'IP → Routes'],
  },

  'tools-torch': {
    title: 'Torch',
    summary: 'Sniffer realtime ringan untuk melihat top talker per protocol/IP/port pada interface.',
    impact: [
      'Sangat berguna untuk investigasi lonjakan trafik.',
      'Pada trafik sangat tinggi, output dapat berubah cepat dan sulit dibaca.',
      'Membantu identifikasi host yang menghabiskan bandwidth.',
    ],
    relations: ['Network Interfaces', 'Queue Tree', 'Firewall Filter'],
  },

  'tools-packet-sniffer': {
    title: 'Packet Sniffer',
    summary: 'Capture paket detail untuk analisis protokol dan troubleshooting tingkat lanjut.',
    impact: [
      'Memberikan visibilitas mendalam hingga header payload/protocol.',
      'Capture tanpa filter dapat menghasilkan file besar dengan cepat.',
      'Data capture harus dilindungi karena bisa berisi informasi sensitif.',
    ],
    relations: ['Network Interfaces', 'Firewall Filter', 'IP → Services'],
  },

  'tools-profile': {
    title: 'Profile',
    summary: 'Monitoring penggunaan CPU per proses/fitur untuk diagnosis performa router.',
    impact: [
      'Menunjukkan service mana yang menjadi bottleneck CPU.',
      'Berguna untuk evaluasi dampak firewall, queue, atau VPN.',
      'Pemantauan periodik membantu capacity planning perangkat.',
    ],
    relations: ['System → Logging', 'Queue Tree', 'Firewall Filter'],
  },

  'tools-netwatch': {
    title: 'Netwatch',
    summary: 'Monitoring host berbasis reachability dengan trigger script up/down.',
    impact: [
      'Dapat dipakai untuk auto-failover, notifikasi, atau self-healing sederhana.',
      'Script otomatis yang salah dapat menimbulkan loop perubahan konfigurasi.',
      'Interval cek harus seimbang antara respons cepat dan overhead.',
    ],
    relations: ['IP → Routes', 'System → Logging', 'System → Scripts'],
  },

  'tools-sms': {
    title: 'SMS Tool',
    summary: 'Integrasi modem/SMS untuk notifikasi atau kontrol sederhana berbasis pesan.',
    impact: [
      'Berguna untuk alert out-of-band saat internet utama down.',
      'Perlu keamanan format command agar tidak disalahgunakan.',
      'Ketergantungan sinyal GSM memengaruhi reliabilitas pengiriman.',
    ],
    relations: ['System → Logging', 'IP → Services'],
  },

  'tools-email': {
    title: 'Email Tool',
    summary: 'Pengiriman email dari router untuk alert, report, atau backup notification.',
    impact: [
      'Membantu notifikasi otomatis insiden operasional.',
      'Perlu SMTP server, port, TLS, dan kredensial yang valid.',
      'Jam sistem harus akurat untuk validasi TLS sertifikat.',
    ],
    relations: ['System → Clock', 'System → Logging', 'System → Scripts'],
  },

  'tools-romon': {
    title: 'RoMON',
    summary: 'Router Management Overlay Network untuk manajemen MikroTik antar-hop tanpa IP langsung.',
    impact: [
      'Memudahkan akses perangkat di segmen sulit dijangkau secara IP.',
      'Butuh desain domain/port RoMON agar tidak membuka akses berlebihan.',
      'Salah konfigurasi dapat memperluas permukaan serangan manajemen.',
    ],
    relations: ['IP → Services', 'System → Identity', 'Firewall Filter'],
  },

  'tools-mac-server': {
    title: 'MAC Server',
    summary: 'Layanan manajemen berbasis MAC untuk akses perangkat di Layer 2.',
    impact: [
      'Berguna saat IP management bermasalah.',
      'Harus dibatasi ke interface tepercaya agar tidak disalahgunakan.',
      'Sering dipasangkan dengan pembatasan MAC Winbox.',
    ],
    relations: ['Network Interfaces', 'IP → Services', 'Firewall Filter'],
  },

  'tools-mac-winbox': {
    title: 'MAC Winbox',
    summary: 'Akses Winbox melalui alamat MAC tanpa ketergantungan routing IP.',
    impact: [
      'Membantu pemulihan saat konfigurasi IP salah.',
      'Jika terbuka luas, meningkatkan risiko akses tidak sah pada segmen L2.',
      'Disarankan hanya aktif pada interface admin internal.',
    ],
    relations: ['MAC Server', 'System → Identity', 'Firewall Filter'],
  },

  'tools-winbox': {
    title: 'Winbox Settings',
    summary: 'Pengaturan perilaku layanan Winbox untuk manajemen GUI router.',
    impact: [
      'Pengaturan yang tepat membantu keamanan akses manajemen.',
      'Port/default access yang terbuka ke WAN memperbesar risiko brute-force.',
      'Sebaiknya digabung dengan firewall INPUT dan allowlist admin.',
    ],
    relations: ['IP → Services', 'Firewall Filter', 'System → Identity'],
  },

  'wireless-interfaces': {
    title: 'Wireless Interfaces',
    summary: 'Konfigurasi radio interface WLAN/AP termasuk SSID, channel, mode, dan negara.',
    impact: [
      'Pemilihan channel dan bandwidth memengaruhi throughput serta interferensi.',
      'Regulatory domain yang benar penting untuk kepatuhan legal frekuensi.',
      'Mode AP/Station menentukan peran interface di topologi nirkabel.',
    ],
    relations: ['Wireless Security Profiles', 'Access List', 'Network Interfaces'],
  },

  'wireless-security': {
    title: 'Wireless Security Profiles',
    summary: 'Profil keamanan WLAN seperti WPA2/WPA3, cipher, dan metode autentikasi.',
    impact: [
      'Konfigurasi cipher lama menurunkan keamanan jaringan nirkabel.',
      'PSK lemah mudah dibobol dengan serangan dictionary.',
      'Perubahan profil berdampak ke semua SSID/interface yang mereferensikannya.',
    ],
    relations: ['Wireless Interfaces', 'Access List', 'Firewall Filter'],
  },

  'wireless-access-list': {
    title: 'Wireless Access List',
    summary: 'Daftar kebijakan MAC untuk mengizinkan/menolak klien wireless tertentu.',
    impact: [
      'Membantu kontrol akses perangkat spesifik di jaringan wireless.',
      'MAC spoofing tetap mungkin, jadi perlu dipadukan dengan WPA2/WPA3.',
      'Rule order penting jika terdapat rule allow/deny yang saling tumpang tindih.',
    ],
    relations: ['Wireless Interfaces', 'Wireless Security Profiles'],
  },

  'wireless-connect-list': {
    title: 'Wireless Connect List',
    summary: 'Daftar prioritas koneksi wireless yang digunakan perangkat mode station.',
    impact: [
      'Menentukan AP mana yang diprioritaskan untuk terkoneksi.',
      'Priority list membantu stabilitas roaming pada skenario beberapa AP.',
      'Credential/profile mismatch menyebabkan gagal asosiasi.',
    ],
    relations: ['Wireless Interfaces', 'Wireless Security Profiles'],
  },

  'ppp-profiles': {
    title: 'PPP Profiles',
    summary: 'Template parameter untuk koneksi PPP (PPPoE, L2TP, PPTP, SSTP, OVPN).',
    impact: [
      'Menyederhanakan provisioning user dengan parameter konsisten.',
      'Satu perubahan profile dapat berdampak ke banyak user PPP.',
      'Parameter rate-limit/profile binding memengaruhi QoS user VPN/PPP.',
    ],
    relations: ['PPP Secrets', 'VPN', 'IP → Pools'],
  },

  'ppp-secrets': {
    title: 'PPP Secrets',
    summary: 'Akun autentikasi PPP berisi username, password, profile, dan parameter layanan.',
    impact: [
      'Kredensial lemah meningkatkan risiko akses tidak sah ke VPN/PPP.',
      'Mapping profile menentukan limitasi dan kebijakan koneksi user.',
      'Audit berkala diperlukan untuk menonaktifkan akun tidak terpakai.',
    ],
    relations: ['PPP Profiles', 'VPN', 'System → Logging'],
  },

  'ppp-active': {
    title: 'PPP Active Connections',
    summary: 'Daftar sesi PPP yang sedang aktif real-time.',
    impact: [
      'Membantu verifikasi user online dan alokasi IP saat ini.',
      'Session tidak normal dapat menandakan masalah autentikasi atau link flap.',
      'Monitoring sesi aktif penting untuk troubleshooting kapasitas.',
    ],
    relations: ['PPP Secrets', 'IP → Pools', 'System → Logging'],
  },

  'files-list': {
    title: 'Files List',
    summary: 'Daftar file pada storage router: backup, export, script, package, dan log.',
    impact: [
      'Storage penuh dapat mengganggu pembuatan backup atau log.',
      'File sensitif (backup/script) harus diamankan dari akses tidak sah.',
      'Pembersihan berkala mencegah akumulasi file usang.',
    ],
    relations: ['System → Logging', 'Backup', 'System → Scripts'],
  },

  'files-backup': {
    title: 'Files Backup',
    summary: 'Manajemen file backup konfigurasi untuk restore cepat saat insiden.',
    impact: [
      'Backup rutin mempercepat recovery setelah kegagalan konfigurasi/perangkat.',
      'Backup harus disimpan juga di lokasi eksternal (off-router).',
      'Enkripsi backup penting untuk melindungi kredensial tersimpan.',
    ],
    relations: ['Files List', 'System → Logging', 'System → Identity'],
  },

  'user-manager-users': {
    title: 'User Manager Users',
    summary: 'Daftar akun pengguna pada User Manager (RADIUS billing/authentication).',
    impact: [
      'Menjadi pusat autentikasi untuk hotspot/PPP berbasis RADIUS.',
      'Konsistensi data user menentukan stabilitas proses login.',
      'Akun kedaluwarsa/nonaktif harus dibersihkan berkala.',
    ],
    relations: ['User Manager Profiles', 'User Manager Sessions', 'Hotspot'],
  },

  'user-manager-profiles': {
    title: 'User Manager Profiles',
    summary: 'Template layanan pengguna (rate-limit, quota, durasi) pada User Manager.',
    impact: [
      'Memudahkan penerapan paket layanan secara konsisten.',
      'Perubahan profile berdampak ke banyak user sekaligus.',
      'Kesalahan kuota/rate-limit memengaruhi pengalaman pelanggan.',
    ],
    relations: ['User Manager Users', 'User Manager Sessions', 'Queue Tree'],
  },

  'user-manager-sessions': {
    title: 'User Manager Sessions',
    summary: 'Riwayat dan sesi aktif autentikasi user dalam ekosistem User Manager.',
    impact: [
      'Memberi visibilitas sesi login, durasi, dan penggunaan layanan.',
      'Berguna untuk audit akses dan investigasi gangguan autentikasi.',
      'Data sesi penting untuk billing pada skenario berlangganan.',
    ],
    relations: ['User Manager Users', 'Hotspot', 'PPP Active Connections'],
  },

  'capsman-interfaces': {
    title: 'CAPsMAN Interfaces',
    summary: 'Interface radio yang dikelola secara terpusat melalui CAPsMAN.',
    impact: [
      'Memudahkan manajemen massal AP dari satu controller.',
      'Ketergantungan ke controller: outage CAPsMAN dapat mengganggu provisioning.',
      'Penamaan/interface mapping yang rapi memudahkan troubleshooting.',
    ],
    relations: ['capsman-provisioning', 'wireless-interfaces', 'Network Interfaces'],
  },

  'capsman-provisioning': {
    title: 'CAPsMAN Provisioning',
    summary: 'Aturan otomatis untuk menerapkan konfigurasi SSID/security ke CAP device.',
    impact: [
      'Mengurangi konfigurasi manual per-AP.',
      'Rule provisioning yang salah dapat menyebar ke banyak AP sekaligus.',
      'Pola identity/regexp yang tepat penting untuk assignment akurat.',
    ],
    relations: ['capsman-configuration', 'capsman-interfaces', 'wireless-security'],
  },

  'capsman-access-list': {
    title: 'CAPsMAN Access List',
    summary: 'Kebijakan kontrol klien wireless pada lingkungan CAPsMAN terpusat.',
    impact: [
      'Menerapkan kebijakan allow/deny klien secara global.',
      'Rule conflict dapat menyebabkan klien valid gagal tersambung.',
      'Perlu koordinasi dengan security profile dan VLAN policy.',
    ],
    relations: ['capsman-configuration', 'wireless-access-list', 'Firewall Filter'],
  },

  'capsman-configuration': {
    title: 'CAPsMAN Configuration',
    summary: 'Template SSID, channel, security, datapath untuk AP yang dikelola CAPsMAN.',
    impact: [
      'Satu template dapat diterapkan ke banyak AP sekaligus.',
      'Perubahan template berdampak luas dan sebaiknya melalui change window.',
      'Datapath/VLAN settings menentukan segmentasi klien wireless.',
    ],
    relations: ['capsman-provisioning', 'wireless-security', 'bridge-vlans'],
  },

  'lte-interfaces': {
    title: 'LTE Interfaces',
    summary: 'Konfigurasi modem LTE untuk konektivitas WAN seluler.',
    impact: [
      'Kualitas sinyal (RSRP/RSRQ/SINR) sangat memengaruhi throughput nyata.',
      'Fallback WAN via LTE membantu ketersediaan saat link utama gagal.',
      'APN dan mode jaringan harus sesuai operator agar koneksi stabil.',
    ],
    relations: ['lte-apn', 'IP → Routes', 'DHCP Client'],
  },

  'lte-apn': {
    title: 'LTE APN Profiles',
    summary: 'Profil APN untuk autentikasi dan parameter koneksi data seluler.',
    impact: [
      'APN salah membuat modem gagal attach ke jaringan operator.',
      'Beberapa operator membutuhkan username/password APN khusus.',
      'Profile APN menentukan jenis layanan data dan IP assignment.',
    ],
    relations: ['lte-interfaces', 'IP → Routes', 'IP → Addresses'],
  },

  'lte-info': {
    title: 'LTE Info',
    summary: 'Informasi status radio LTE: operator, band, sinyal, cell ID, dan statistik link.',
    impact: [
      'Mempercepat diagnosis masalah kualitas link seluler.',
      'Perubahan cell/band dapat menjelaskan fluktuasi latency/throughput.',
      'Monitoring berkala membantu optimasi posisi antena/modem.',
    ],
    relations: ['lte-interfaces', 'IP → Routes', 'System → Logging'],
  },

  'gps-settings': {
    title: 'GPS Settings',
    summary: 'Pengaturan modul GPS untuk sinkronisasi lokasi/waktu dan telemetri.',
    impact: [
      'Berguna untuk deployment bergerak atau integrasi lokasi perangkat.',
      'Kualitas sinyal satelit memengaruhi akurasi koordinat.',
      'Konfigurasi port/NMEA harus sesuai dengan modul yang digunakan.',
    ],
    relations: ['gps-monitor', 'System → Clock', 'System → Logging'],
  },

  'gps-monitor': {
    title: 'GPS Monitor',
    summary: 'Pemantauan status fix GPS, satelit, koordinat, dan kualitas sinyal.',
    impact: [
      'Membantu memastikan perangkat memperoleh GPS fix dengan benar.',
      'Tanpa fix yang stabil, data lokasi tidak dapat diandalkan.',
      'Dapat dipakai untuk validasi perangkat outdoor/vehicular.',
    ],
    relations: ['gps-settings', 'System → Logging'],
  },

  neighbors: {
    title: 'Neighbors',
    summary: 'Daftar perangkat tetangga yang terdeteksi via discovery protocol (MNDP/LLDP/CDP).',
    impact: [
      'Membantu inventaris cepat perangkat yang terhubung langsung.',
      'Informasi neighbor memudahkan pemetaan topologi fisik.',
      'Discovery sebaiknya dibatasi di segmen tidak tepercaya.',
    ],
    relations: ['System → Identity', 'Network Interfaces', 'SNMP'],
  },

  log: {
    title: 'Log',
    summary: 'Log runtime router untuk event sistem, keamanan, routing, dan layanan.',
    impact: [
      'Sumber utama analisis saat troubleshooting insiden.',
      'Retensi/tujuan log perlu disesuaikan agar tidak cepat penuh.',
      'Klasifikasi topic log mempercepat pencarian akar masalah.',
    ],
    relations: ['System → Logging', 'System → Clock', 'Firewall Filter'],
  },

  skin: {
    title: 'Skin',
    summary: 'Pengaturan tampilan antarmuka manajemen (tema/skin) untuk kenyamanan operasional.',
    impact: [
      'Tidak berdampak langsung ke forwarding traffic atau performa routing.',
      'Dapat meningkatkan produktivitas operator dengan layout yang konsisten.',
      'Perubahan skin sebaiknya tidak mengubah kebiasaan navigasi tim secara drastis.',
    ],
    relations: ['System → Identity', 'IP → Services'],
  },
};
