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
  },
};
