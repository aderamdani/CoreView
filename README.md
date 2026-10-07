<h1 align="center">
  <br>
  🌐 CoreView
  <br>
</h1>

<p align="center">
  <b>Dashboard Visualisasi Konfigurasi MikroTik RouterOS</b><br>
  Transformasi file export <code>.rsc</code> menjadi dashboard interaktif yang mudah dipahami.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=flat-square" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white&style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

---

## 📋 Daftar Isi

- [Tentang CoreView](#-tentang-coreview)
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Cara Memulai](#-cara-memulai)
- [Cara Menggunakan](#-cara-menggunakan)
- [Struktur Proyek](#-struktur-proyek)
- [Versi dan Changelog](#-versi-dan-changelog)
- [Deployment](#-deployment)
- [Privasi & Keamanan](#-privasi--keamanan)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)

---

## 🚀 Tentang CoreView

**CoreView** adalah aplikasi web berbasis browser yang membantu network engineer dan administrator jaringan untuk **memahami dan memvisualisasikan konfigurasi MikroTik RouterOS** secara cepat dan intuitif.

Cukup upload file export konfigurasi (`.rsc` atau `.txt`) dari router MikroTik Anda, dan CoreView akan langsung memparsing serta menampilkannya dalam bentuk dashboard yang terstruktur dan interaktif, **tanpa perlu kirim data ke server manapun**. Semua pemrosesan dilakukan lokal di browser Anda.

### Masalah yang Diselesaikan

> Membaca dan menganalisis file `.rsc` MikroTik secara manual sangat memakan waktu dan rawan kesalahan. CoreView mengubahnya menjadi tampilan visual yang terorganisir dalam hitungan detik.

---

## ✨ Fitur Utama

### 📊 Overview Dashboard
Ringkasan lengkap kondisi router: identitas perangkat, model, serial number, jumlah interface aktif, total aturan firewall, dan ringkasan konfigurasi dalam 8 langkah naratif yang mudah dipahami.

### 🗺️ Mind Map
Visualisasi hubungan antar komponen konfigurasi router dalam bentuk peta pikiran interaktif menggunakan **ReactFlow + Dagre**, sehingga mudah melihat ketergantungan antar bagian.

### 🔌 Network Interfaces
Tabel detail seluruh interface jaringan:
- **All Interfaces** – Ethernet, Bridge, VLAN, WireGuard, OVPN
- **Interface Lists** – Pengelompokan interface untuk firewall & routing

### 🌐 IP & Layanan Jaringan
- **Addresses** – Semua IP statis yang dikonfigurasi
- **Routes** – Tabel routing (statis & dinamis)
- **DHCP Server / Client** – Konfigurasi pembagian IP otomatis
- **DNS** – Server DNS dan entri statis
- **IP Pools** – Pool alamat untuk DHCP & PPP
- **Hotspot** – Server, profil, user, dan walled garden
- **IP Cloud, Services, UPnP, SOCKS, Proxy, Traffic Flow**

### 🛡️ Firewall
Visualisasi lengkap semua lapisan keamanan:
- **Filter Rules** – Aturan allow/drop/reject traffic
- **NAT** – Port forwarding & masquerade
- **Mangle** – Penandaan & modifikasi packet
- **Raw** – Filtering awal sebelum connection tracking
- **Address Lists** – Daftar IP untuk kebijakan keamanan

### 🔒 VPN & Remote Access
Ringkasan semua konfigurasi VPN: **PPTP, L2TP, SSTP, OpenVPN, WireGuard** beserta peer dan konfigurasi terkait.

### 📶 QoS & Bandwidth Management
- **Queue Tree** – Hierarki kontrol bandwidth (HTB)
- **Simple Queues** – Limit per IP/interface
- **Queue Types** – Algoritma PCQ, RED, SFQ

### 🖥️ System & Tools
- **Identity, Clock, NTP, Logging, Users, SSH, SNMP**
- **Graphing, Netwatch, Bandwidth Test, RoMON**

### 🌍 OSI & TCP/IP View
Panduan visual lapisan OSI dan TCP/IP yang dipetakan dengan komponen konfigurasi router yang relevan.

### 💡 Help Panel Kontekstual
Setiap bagian dilengkapi panel bantuan yang dapat diklik untuk memahami:
- Apa fungsinya
- Dampak & pertimbangan konfigurasi
- Bagian terkait (navigasi langsung)
- Prerequisites & langkah selanjutnya

### 🎨 Dark / Light Mode
Toggle tema gelap dan terang sesuai preferensi.

---

## 🛠️ Tech Stack

| Kategori | Teknologi |
|---|---|
| Framework | [React 19](https://react.dev) |
| Build Tool | [Vite 8](https://vitejs.dev) |
| Graph / Flow | [ReactFlow](https://reactflow.dev) + [Dagre](https://github.com/dagrejs/dagre) |
| Charts | [Recharts](https://recharts.org) |
| Icons | [Lucide React](https://lucide.dev) |
| Linter | [ESLint](https://eslint.org) |
| Deployment | [Vercel](https://vercel.com) |

---

## 🏁 Cara Memulai

### Prasyarat

Pastikan sudah terinstal:
- [Node.js](https://nodejs.org/) v18 atau lebih baru
- npm (sudah termasuk bersama Node.js)

### Instalasi

```bash
# 1. Clone repositori ini
git clone https://github.com/aderamdani/CoreView.git
cd CoreView

# 2. Install semua dependency
npm install

# 3. Jalankan development server
npm run dev
```

Buka browser dan akses `http://localhost:5173` (atau port yang ditampilkan di terminal).

### Script yang Tersedia

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan development server dengan Hot Module Reload |
| `npm run build` | Build untuk production ke folder `dist/` |
| `npm run preview` | Preview hasil build production secara lokal |
| `npm run lint` | Jalankan ESLint untuk pengecekan kode |

---

## 📖 Cara Menggunakan

### Langkah 1: Export Konfigurasi dari MikroTik

Hubungkan ke router MikroTik Anda (via Winbox, WebFig, SSH, atau Telnet), lalu jalankan perintah:

```
/export file=config-export
```

Ini akan membuat file `config-export.rsc` di sistem file router.

### Langkah 2: Download File `.rsc`

Download file tersebut melalui:
- **Winbox**: Menu `Files` → Download
- **WebFig**: Menu `Files` → Download
- **FTP/SFTP**: Ambil langsung dari router

### Langkah 3: Upload ke CoreView

1. Buka CoreView di browser
2. Drag & drop file `.rsc` ke area upload, atau klik untuk browse
3. Konfigurasi akan langsung di-parse dan ditampilkan sebagai dashboard

> **💡 Tips:** Klik tombol **"Cara Export Konfigurasi MikroTik"** di halaman upload untuk panduan lengkap dengan ilustrasi langkah demi langkah.

---

## 📁 Struktur Proyek

```
CoreView/
├── public/
│   └── demo/                # Contoh konfigurasi untuk tombol "coba demo"
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx      # Dashboard utama: sidebar + semua tab
│   │   ├── Landing.jsx        # Halaman awal, tempat upload file
│   │   ├── MindMap.jsx        # Visualisasi mind map konfigurasi
│   │   ├── OsiTcpView.jsx     # Panduan visual lapisan OSI & TCP/IP
│   │   ├── NetworkTopology.jsx  # Topologi jaringan dari interface & IP
│   │   ├── PacketTracer.jsx   # Simulasikan alur paket melewati firewall
│   │   ├── FirewallConflicts.jsx  # Deteksi rule yang tertutup / duplikat
│   │   ├── FirewallSwimlane.jsx  # Visualisasi rule firewall per chain
│   │   ├── ConfigComparison.jsx  # Bandingkan dua file konfigurasi
│   │   ├── DHCPRangeVisualizer.jsx  # Visualisasi rentang IP DHCP
│   │   ├── AboutPanel.jsx     # Chip versi + catatan rilis
│   │   ├── menus.jsx          # Definisi menu sidebar
│   │   └── GlossaryTip.jsx    # Tooltip istilah jaringan
│   ├── utils/
│   │   ├── parser.js            # Parser file .rsc → JSON terstruktur
│   │   ├── configHelp.js        # Bantuan kontekstual per seksi
│   │   ├── configAnalyzer.js    # Health check & saran perbaikan
│   │   ├── detectConflicts.js   # Deteksi konflik & duplikat firewall
│   │   ├── packetTracer.js      # Logika simulasi packet tracer
│   │   ├── changelog.js         # Baca CHANGELOG.md untuk panel rilis
│   │   └── itemExplainer.js     # Penjelasan per item konfigurasi
│   ├── App.jsx                # Root: state file, pencarian, theme
│   ├── App.css                # Styling komponen
│   ├── index.css              # Design system & CSS variables
│   └── main.jsx               # Entry point
├── tests/                    # Tes (node --test)
├── CHANGELOG.md              # Riwayat versi
├── DEPLOYMENT-DOMAIN.md      # Panduan migrasi domain
├── index.html                # HTML template
├── vite.config.js            # Konfigurasi Vite
├── eslint.config.js          # Konfigurasi ESLint
├── vercel.json               # Deployment Vercel (SPA rewrite)
└── package.json              # Dependency & scripts
```

### Alur Data

```
File .rsc  →  parser.js  →  Structured JSON  →  Dashboard.jsx  →  UI
              (parsing)      (enrichment)        (rendering)
```

- **`parser.js`**: Membaca setiap baris file `.rsc`, mengekstrak context path (`/ip firewall filter`, dll.), dan memetakannya ke objek JSON terstruktur. Setelah parsing, fungsi `enrichDashboardData` menghubungkan relasi antar objek (misalnya: DHCP server → interface → pool). Input yang bukan export MikroTik ditolak dengan pesan yang bisa dibaca pengguna.
- **`configHelp.js`**: Berisi deskripsi bahasa Indonesia untuk setiap seksi konfigurasi, digunakan oleh `HelpPanel` di dalam Dashboard.

---

## 🔖 Versi dan Changelog

Versi proyek disimpan di satu tempat saja, yaitu field `version` pada
`package.json`. Nilai itu diteruskan ke aplikasi lewat `define` di
`vite.config.js` sebagai `__APP_VERSION__`, jadi angka yang tampil di aplikasi
tidak bisa berbeda dari yang tertulis di `package.json`.

Di aplikasi, nomor versi tampil sebagai chip di header. Mengkliknya membuka
catatan rilis untuk versi yang sedang berjalan. Isi panel itu dibaca langsung
dari `CHANGELOG.md` saat build, bukan disalin ke berkas terpisah, sehingga
catatan rilis dan berkas changelog tidak bisa saling menyimpang.

Riwayat lengkap ada di [`CHANGELOG.md`](CHANGELOG.md). Formatnya mengikuti
Keep a Changelog, dan penomoran versinya mengikuti Semantic Versioning.

### Alur rilis

```bash
# 1. Naikkan versi di package.json, lalu tulis bagian barunya di CHANGELOG.md.
#    Judul bagian harus persis "## [x.y.z] - YYYY-MM-DD".

# 2. Pastikan bersih.
npm run check
npm run build

# 3. Commit, tag, push.
git add -A
git commit -m "chore(release): vX.Y.Z"
git tag -a vX.Y.Z -m "CoreView vX.Y.Z"
git push && git push --tags

# 4. Buat GitHub Release dari tag tersebut, dengan isi bagian changelog
#    versi itu sebagai keterangan rilis.
```

Kalau langkah 1 terlewat dan `CHANGELOG.md` belum punya bagian untuk versi yang
baru, panel catatan rilis akan menampilkan kalimat bahwa catatan belum
tersedia, bukan panel kosong.

---

## 🚀 Deployment

Proyek ini dikonfigurasi untuk deploy otomatis ke **Vercel**.

File `vercel.json` sudah dikonfigurasi dengan SPA rewrite agar routing React bekerja dengan benar:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Deploy Manual ke Vercel

```bash
# Install Vercel CLI (jika belum)
npm install -g vercel

# Deploy
vercel
```

Atau hubungkan repositori GitHub Anda ke [Vercel Dashboard](https://vercel.com/dashboard) untuk deploy otomatis setiap push ke branch `main`.

### Domain Kustom

Domain kustom dikonfigurasi di level project Vercel, bukan di repositori, jadi
tidak ada yang perlu diubah di kode.

Untuk panduan memindahkan domain ke `coreview.vertexdata.web.id`, termasuk
endpoint API yang terverifikasi dan runbook langkah demi langkah, lihat
[`DEPLOYMENT-DOMAIN.md`](DEPLOYMENT-DOMAIN.md).

---

## 🔒 Privasi & Keamanan

> **File konfigurasi Anda tidak pernah dikirim ke server manapun.**

Semua parsing dan pemrosesan dilakukan **sepenuhnya di browser** menggunakan JavaScript. File `.rsc` yang Anda upload hanya dibaca oleh `FileReader` API browser dan langsung diproses di memori lokal.

---

## 🤝 Kontribusi

Kontribusi sangat disambut! Silakan:

1. Fork repositori ini
2. Buat branch fitur baru (`git checkout -b feature/nama-fitur`)
3. Commit perubahan Anda (`git commit -m 'feat: tambah fitur X'`)
4. Push ke branch (`git push origin feature/nama-fitur`)
5. Buat Pull Request

---

## 📄 Lisensi

Proyek ini menggunakan lisensi **MIT**. Lihat file `LICENSE` untuk detail lebih lanjut.

---

<p align="center">
  Dibuat dengan ❤️ untuk komunitas jaringan Indonesia
</p>
