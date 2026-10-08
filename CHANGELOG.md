# Changelog

Semua perubahan penting proyek ini dicatat di berkas ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/), dan
versi mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [1.3.0] - 2026-10-08

### Diubah

- Seluruh emoji dihapus dari repositori, 204 di antaranya. Emoji yang menandai
  konsep atau aksi di antarmuka diganti ikon lucide yang sudah dipakai
  aplikasi, misalnya glyph node topologi, ikon preset packet tracer, tombol
  favorit, dan enam kartu ringkasan di dashboard. Emoji di dalam string teks
  dihapus karena ikon React tidak bisa masuk ke sana, dan emoji dekorasi pada
  judul ikut dihapus tanpa pengganti.
- Panah blok Arrows dipertahankan. Itu tipografi penghubung, bukan emoji, dan
  183 di antaranya adalah bagian dari kunci pencarian navigasi di
  `configHelp.js`.
- Emoji dicabut dari 12 heading README, dan 11 link Daftar Isi diperbarui dari
  `#-xxx` menjadi `#xxx`. Anchor lama memuat tanda hubung di depan karena emoji
  yang tercabut, sehingga seluruh link akan patah tanpa perubahan ini.
- Glyph panah pada tombol Upload Baru diganti ikon Upload dari lucide.
- Dua puluh enam pasang handler `onMouseEnter` dan `onMouseLeave` yang menulis
  ke `style.color`, `style.background`, dan `style.borderColor` diganti kelas
  dengan `:hover`. Dua di antaranya juga memindahkan elemen dan menambahkan
  glow berwarna; keduanya dihapus karena dekorasi, bukan hierarki.
- Dua puluh satu warna hardcode di `index.css` dan `App.css` diubah menjadi
  token, masing-masing dengan padanan tema terang. Yang paling nyata: thumb
  scrollbar memakai putih 10 persen sehingga praktis tak terlihat di tema
  terang.
- `.text-gradient` memakai token `accent-light` dan `accent-secondary`, bukan
  lagi literal `#818cf8` dan `#a78bfa`.
- Versi pada hero Landing dibaca dari `__APP_VERSION__`, sumber yang sama
  dengan chip di header. Sebelumnya tertulis `v1.0` sementara aplikasi sudah
  `v1.2.0`, sehingga ada dua sumber versi yang bisa berbeda.
- Tooltip berbahasa Inggris di Indonesiakan, termasuk `View on GitHub`,
  `Toggle Theme`, `Keyboard shortcuts`, dan `alt` pada gambar hero.
- Kartu Export-Ready memakai penanda `Segera` yang sama dengan sidebar, bukan
  `opacity: 0.8` yang terbaca sebagai nonaktif alih-alih belum jadi.

### Diperbaiki

- Rotasi 90 derajat pada `.btn-close:hover` dihapus. Perubahan warna sudah cukup
  sebagai umpan balik, dan memutar ikon tutup tidak melayani apa pun.
- Field `icon` pada `configAnalyzer.js` dihapus. Ikon severity sudah lama
  didefinisikan di `severityConfig` Dashboard tetapi tidak pernah dirender,
  sehingga ikonnya kini diambil dari sana. Laporan HTML memakai label severity
  dalam kata, supaya maknanya tidak bergantung pada warna saja.

### Ditambahkan

- Guard emoji di `tests/emoji.test.js`, memindai `src/`, seluruh `.md`, dan
  `.html` untuk rentang emoji, dengan daftar putih satu entri (U+2318, simbol
  tombol Command) yang wajib punya alasan tertulis.
- Augmentasi tipe di `src/env.d.ts` untuk properti CSS kustom, supaya satu
  komponen bisa menyalurkan warna per item lewat variabel tanpa cast ke `any`.

### Catatan

- Seluruh perubahan diverifikasi di browser sungguhan pada kedua tema, dengan
  nol error konsol saat berpindah panel.

## [1.2.0] - 2026-10-08

### Ditambahkan

- Grafik dipindahkan ke Evilcharts. Kedua chart di panel Analisis Konfigurasi,
  yaitu donut distribusi firewall dan batang tipe interface, kini memakai
  komponen dari registry shadcn Evilcharts yang divendorkan ke
  `src/components/evilcharts/`.
- `chartConfig` per chart: satu objek untuk label dan warna tiap seri, dengan
  varian warna terang dan gelap. Evilcharts mengompilasinya menjadi CSS variable
  per chart di bawah selektor `.dark`, sehingga pergantian tema terjadi murni
  lewat CSS, tanpa render ulang dan tanpa kedip warna.
- Empty state eksplisit untuk kedua chart. Sebelumnya blok chart hanya
  disembunyikan saat data kosong, sehingga panel tampak rusak.
- Pemeriksaan render di `tests/render.smoke.jsx` kini mencakup kedua komponen
  chart, dari 13 menjadi 15 komponen.
- Prettier sebagai formatter, dengan `format:check` masuk `npm run check`.
- Pemeriksaan tipe lewat JSDoc (`tsc --noEmit` dengan `allowJs` dan `checkJs`),
  juga masuk `npm run check`.
- Tombol "Coba lagi" pada panel yang gagal dirender.

### Diperbaiki

- Donut distribusi firewall tampil sebagai wadah kosong. Recharts `Sector`
  mengembalikan `null` ketika `startAngle === endAngle`, yaitu frame pertama
  animasi masuknya, dan animasi itu terbukti tidak pernah maju meski
  `requestAnimationFrame` berjalan normal dan animasi motion.dev pada chart
  sebelah selesai. Sektornya kini dirender langsung.
- Label sumbu chart gagal ambang kontras AA: `fill="#666"` bawaan Recharts di
  atas latar panel menghasilkan 3,15:1. Komponen vendored mencoba menimpanya
  lewat varian Tailwind yang menargetkan `.recharts-cartesian-axis-tick text`,
  sedangkan kelas yang benar-benar dirender Recharts adalah
  `.recharts-cartesian-axis-tick-value`, sehingga aturan itu tidak pernah cocok.
  Setelah diperbaiki: 12,18:1 di tema gelap dan 7,58:1 di tema terang.
- Token tema shadcn yang dirujuk komponen vendored, seperti `text-border` dan
  `bg-background`, tidak terdefinisi karena `shadcn init` sengaja dilewati.
  Utilitasnya menunjuk variabel yang tidak ada, sehingga warnanya diam-diam
  jatuh ke nilai warisan. Token itu kini dipetakan ke variabel design system.
- Tombol "Uji di Packet Tracer" membuang rule yang dipilih. Handler-nya
  mengabaikan argumen rule, sehingga form tracer selalu terbuka dengan nilai
  bawaan. Rule kini disalurkan sampai ke form, dengan 10 tes untuk pemetaannya.
- Layout mind map dihitung di atas graf dagre yang tidak pernah direset, jadi
  node dan edge dari konfigurasi sebelumnya ikut memengaruhi perankingan.
- Satu panel yang gagal dirender mematikan seluruh dashboard sampai aplikasi
  dimuat ulang, karena error boundary tidak punya jalur reset. Boundary kini
  pulih saat pengguna berpindah tab.
- Pemotongan senyap di topologi jaringan. Graf membatasi 4 interface WAN, 5 LAN,
  dan 4 koneksi VPN tanpa memberi tahu, sehingga node Internet melaporkan 7
  uplink sementara hanya 4 yang digambar. Kini ada keterangan "menampilkan N
  dari M".

### Diubah

- Tailwind dipasang berdampingan dengan design system, tanpa preflight, dan
  hanya memindai folder komponen chart. Preflight mereset gaya dasar elemen dan
  akan bertabrakan dengan `index.css` serta `App.css`.
- Kelas `delay-100/200/300` diganti nama menjadi `stagger-1/2/3` karena
  bertabrakan dengan namespace utilitas Tailwind.
- `App.jsx` menyalakan kelas `dark` dan `light` sekaligus, supaya konvensi
  design system dan konvensi Tailwind tidak bisa berbeda pendapat.
- Dua inline style yang berulang diubah menjadi kelas: pasangan ukuran dan warna
  teks sekunder yang ditulis 41 kali, dan warna teks redup yang ditulis 21 kali.
- Em dash dihapus dari seluruh `src/`, termasuk komentar komponen vendored.

### Dihapus

- `TODO.md`, catatan progres task yang sudah selesai dan tidak dirujuk siapa pun.
- Selector `.search-match`, yang mendefinisikan sorotan hasil pencarian padahal
  pencarian hanya menyaring baris tabel.

### Catatan

- Seluruh teks pada kedua chart diukur terhadap ambang kontras WCAG AA di
  browser sungguhan: legenda 18,08:1 dan 17,85:1, tooltip 19,17:1, label sumbu
  12,18:1 dan 7,58:1.
- Berkas komponen Evilcharts disimpan sedekat mungkin dengan sumber aslinya agar
  bisa disinkronkan ulang. Penyesuaian yang diperlukan dicatat di
  `src/components/evilcharts/README.md`.
- Em dash nol di seluruh repositori, dijaga oleh tes.

## [1.1.0] - 2026-10-08

### Ditambahkan

- Penanda `Segera` pada menu sidebar yang panelnya masih placeholder, supaya
  navigasi tidak menjanjikan seksi yang belum ada isinya. Ada 46 menu seperti
  itu. Daftarnya dideklarasikan sekali di `src/components/placeholderTabs.js`
  dan diperiksa silang terhadap routing Dashboard oleh `tests/menus.test.js`.

### Diubah

- 37 pesan kosong berbahasa Inggris diseragamkan ke bahasa Indonesia, dengan
  dua pola: `Tidak ada ... yang cocok dengan pencarian.` untuk hasil pencarian,
  dan `Belum ada ... yang dikonfigurasi.` untuk seksi yang belum diisi.
- Sembilan em dash pada teks laporan HTML, banner pencarian, dan daftar istilah
  diganti. Tidak ada lagi em dash di seluruh `src/`.
- Inline style yang berulang diubah menjadi kelas. Sel kosong pada tabel
  (`table-empty-cell`) muncul 55 kali dan tombol Detail per baris (`btn-detail`)
  16 kali, masing-masing dengan gaya yang sama persis, sehingga satu perubahan
  gaya harus disunting di puluhan tempat.
- Elemen penanda di ujung baris sidebar dikelompokkan dalam satu wadah. Dengan
  `space-between`, penanda jumlah, tombol favorit, dan chevron saling tersebar,
  dan menambah satu elemen lagi memperburuknya.

### Catatan

- Target memangkas `Dashboard.jsx` lebih dari 50 persen tidak tercapai, dan
  memang tidak bisa dicapai dengan refactor yang aman. Berkas itu besar karena
  memuat 116 seksi dengan isi yang berbeda-beda, bukan karena pengulangan yang
  bisa diseragamkan. Ekstraksi yang benar-benar mengurangi pengulangan hanya
  menyentuh 71 tempat dari 4.600 baris. Menekan angka itu lebih jauh menuntut
  penulisan ulang berbasis data, yang merupakan perancangan ulang arsitektur,
  bukan pekerjaan merapikan.

## [1.0.1] - 2026-10-08

### Diperbaiki

- Dashboard gagal dirender di produksi dengan `ReferenceError: Server is not
  defined`. Berkas `src/components/menus.jsx` memakai 18 ikon lucide tanpa
  pernah mengimpornya, sehingga saat runtime nama ikon itu menjadi referensi
  global yang tidak ada.
- Entri changelog di panel catatan rilis terpotong di akhir baris pertama,
  karena butir yang dibungkus ke baris berikutnya tidak disambung. Panel
  menampilkan kalimat yang putus di tengah.
- Kekosongan placeholder `-` pada pembanding konfigurasi dan packet tracer
  memakai em dash, sehingga terbaca sebagai tanda pisah.

### Ditambahkan

- `tests/render.smoke.jsx`, yang me-render 13 komponen dengan konfigurasi contoh.
  Kelas kesalahan yang lolos dari lint maupun build akhirnya tertangkap di sini.
- Aturan `react/jsx-no-undef` pada lint. Aturan bawaan `no-undef` tidak
  memeriksa nama elemen JSX, dan itulah celah yang meloloskan kesalahan ikon di
  atas. Ditambah `react/jsx-uses-vars` dan `react/jsx-key`.
- Pemeriksaan render ikut dijalankan di CI, dan `npm run check` kini mencakup
  lint, tes, dan pemeriksaan render.

### Diubah

- Prosa antarmuka tidak lagi memakai em dash. Sekitar 190 kemunculan di
  `itemExplainer.js`, `configHelp.js`, `PacketTracer.jsx`, `GlossaryTip.jsx`,
  `configAnalyzer.js`, `ConfigComparison.jsx`, dan dua berkas lain diganti
  dengan titik, koma, atau titik dua sesuai konteks kalimatnya.
- 254 baris CSS mati di `src/index.css` dihapus, bersama dua selector yang tidak
  terpakai di `src/App.css`.

## [1.0.0] - 2026-10-08

Rilis pertama yang diberi nomor. Sebelum ini proyek belum punya versi, jadi
catatan di bawah merangkum kondisi awal sekaligus perbaikan yang menyertainya.

### Ditambahkan

- Panel bantuan kontekstual per seksi konfigurasi (`configHelp.js`), dapat
  dinavigasi lewat chip relasi antar seksi.
- Health check konfigurasi (`configAnalyzer.js`): skor, temuan berprioritas,
  dan ringkasan bahasa sederhana.
- Deteksi konflik firewall: rule yang tertutup rule sebelumnya, dan rule
  duplikat (`detectConflicts.js`).
- Packet tracer interaktif untuk menelusuri alur paket melewati rule firewall.
- Peta topologi jaringan dari interface, alamat IP, dan gateway.
- Pembanding dua file konfigurasi, dengan ringkasan selisih per field.
- Visualisasi rentang IP pool DHCP terhadap subnet tempat pool itu dipakai.
- Analisis firewall per chain (`FirewallSwimlane.jsx`).
- Field bantuan "Uji di Packet Tracer" dari halaman konflik firewall.
- Tombol salin laporan: ekspor HTML dan ekspor CSV.
- Berkas `LICENSE` (MIT), yang sebelumnya dirujuk README tetapi tidak ada.
- Tes otomatis di `tests/parser.test.js`, dijalankan dengan `node --test`.
- Alur CI di `.github/workflows/ci.yml`: lint, tes, dan build.
- Panduan migrasi domain di `DEPLOYMENT-DOMAIN.md`.
- Chip versi di header dan panel catatan rilis. Isinya dibaca dari
  `CHANGELOG.md` saat build, bukan disalin ke berkas terpisah, sehingga panel
  dan berkas changelog tidak bisa saling menyimpang.

### Diperbaiki

- Tautan DHCP server ke network selalu menunjuk network pertama, sehingga kolom
  Network dan Gateway bisa menampilkan data yang salah. Sekarang dicocokkan
  lewat atribut `network=`, dengan cadangan pencocokan CIDR.
- Penyambungan baris dengan backslash tidak menyisipkan pemisah token, sehingga
  `comment=abc` + `disabled=no` menyatu menjadi satu token. Nilai berquoted yang
  terpotong antar baris juga ikut rusak, dan sekarang diperbaiki.
- Baris terakhir hilang bila berkas berakhir dengan backslash tanpa newline.
- `/ip dns` hanya membaca atribut `servers`, sementara atribut lain seperti
  `allow-remote-requests` dan `cache-size` dibuang. Sekarang seluruh atribut
  digabung antar baris.
- Kunci internal `_find` bocor ke objek interface dan rule firewall, ikut
  terkirim ke UI.
- Berkas kosong atau bukan export MikroTik menghasilkan dashboard kosong tanpa
  penjelasan. Sekarang ditolak dengan pesan yang bisa dibaca pengguna.
- Pencarian dan ekspor HTML gagal begitu konfigurasi memuat satu rule pun.
  Penyebabnya `tdStyle` dipakai sebelum dideklarasikan.
- Mengetik di kotak pencarian bisa melempar error karena back-reference antar
  objek membentuk siklus saat diserialisasi. Back-reference sekarang
  non-enumerable, dan konfigurasi tetap bisa diserialisasi.
- Ekspor HTML laporan tidak meng-escape data dari berkas, sehingga komentar
  berisi markup bisa berjalan saat laporan dibuka. Sekarang seluruh data
  pengguna di-escape.
- Kapasitas pool DHCP dihitung dari oktet ketiga, bukan oktet terakhir. Pool
  253 alamat terbaca sebagai -1 dan memicu peringatan "pool sangat kecil" palsu.
- Pembanding konfigurasi menabrakkan kunci pada item tanpa nama, sehingga dua
  alamat IP pada satu interface atau dua rule pada satu chain saling menimpa
  dan selisihnya tidak muncul.
- Setiap alamat IP gateway berubah menjadi interface palsu, yang membuat jumlah
  interface, badge sidebar, dan ringkasan health check ikut menggelembung.
- Nomor rule pada laporan duplikat menunjuk rule yang salah saat ada rule
  dinonaktifkan di depan.
- Peringatan pembatasan akses `/ip service` dan algoritma `/ip ipsec profile`
  membaca nama atribut yang tidak ada di RouterOS, sehingga keduanya selalu
  memunculkan peringatan tanpa memandang isi konfigurasi sebenarnya.
- Pencocokan CIDR gagal pada daftar alamat yang dipisah koma, sehingga rule
  penjaring tidak pernah dilaporkan menutup rule lain.
- Rule masquerade yang dinonaktifkan tetap dihitung sebagai NAT yang bekerja.
- Alasan pada laporan konflik tidak menyebut field yang justru membedakan rule,
  sehingga kondisinya terbaca lebih longgar daripada kenyataannya.
- Saran perbaikan konflik menyuruh memperbesar kondisi rule yang tertutup,
  langkah yang tidak memperbaiki apa pun.
- Badge jumlah pada menu induk sidebar dihitung lalu dibuang.
- Badge status di halaman OSI/TCP-IP menampilkan teks tetap alih-alih menghitung
  data.
- Sepuluh pelanggaran lint yang sudah ada sebelumnya, termasuk kunci objek
  duplikat `routing-bgp` di `configHelp.js`.

### Diubah

- `enrichDashboardData` memakai indeks Map untuk pencarian relasi. Sebelumnya
  setiap pencarian memindai seluruh array, dan pencarian interface lewat
  `set [ find default-name=... ]` mendominasi biaya parsing.
- Definisi sidebar dipindah ke `src/components/menus.jsx` dan dihitung sekali
  lewat `useMemo`, bukan disusun ulang pada setiap render.
- Waktu format laporan memakai `toLocaleString('id-ID')`, dan bagian dinamis
  pada laporan disusun memakai template literal di satu tempat.
- Aturan ESLint `no-unused-vars` diberlakukan, termasuk pada variabel sisa
  refactor.

### Dihapus

- `src/components/Uploader.jsx` (410 baris). Komponen ini tidak pernah
  diimpor; `Landing.jsx` sudah menjalankan alur unggah sendiri.
- `test_parser.js` dan `test_render.js` di akar proyek. Keduanya membaca berkas
  contoh yang tidak ada di repositori dan menelan error tanpa menandai gagal,
  jadi keduanya tidak pernah benar-benar menguji apa pun.
- `src/utils/test_parser.js`, skrip tanpa assertion.
- Blok `@keyframes slideDown` yang terselip di dalam `:root` pada `index.css`.
  Posisinya tidak valid tanpa dukungan CSS Nesting, dan definisi yang benar
  sudah ada di `App.css`.

### Catatan

- Perbaikan parser memangkas waktu parse konfigurasi berukuran 16.000 entri dari
  sekitar 3,0 detik menjadi sekitar 88 milidetik, dan mengubah pertumbuhannya
  dari kuadratis menjadi linear.
- Seluruh teks pada panel rilis diukur terhadap ambang kontras WCAG AA, dengan
  rasio terendah 6,01:1 pada kedua tema. Elemen yang gagal ambang itu diperbaiki
  sebelum rilis.
