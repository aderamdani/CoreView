# Changelog

Semua perubahan penting proyek ini dicatat di berkas ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/), dan
versi mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [1.0.1] - 2026-10-08

### Diperbaiki

- Dashboard gagal dirender di produksi dengan `ReferenceError: Server is not
  defined`. Berkas `src/components/menus.jsx` memakai 18 ikon lucide tanpa
  pernah mengimpornya, sehingga saat runtime nama ikon itu menjadi referensi
  global yang tidak ada. Kesalahan ini lolos dari lint karena aturan `no-undef`
  tidak memeriksa nama elemen JSX, dan lolos dari build karena identifier yang
  belum terdefinisi adalah JavaScript yang sah.

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
