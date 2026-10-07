# Evilcharts (vendored)

Komponen ini berasal dari registry shadcn Evilcharts, bukan paket npm.
Sumbernya disalin ke dalam repo supaya bisa disesuaikan, dan sedapat mungkin
dibiarkan apa adanya agar bisa disinkronkan ulang.

- Sumber: <https://evilcharts.com/docs/recharts/installation>
- Registry: `@evilcharts/recharts-bar-chart`, `@evilcharts/recharts-pie-chart`
- Perintah pemasangan:

  ```bash
  npx shadcn@latest add @evilcharts/recharts-bar-chart @evilcharts/recharts-pie-chart
  ```

Konfigurasi ada di `components.json`. Dua pilihan di sana penting:

- `"tsx": false` membuat CLI mengeluarkan `.jsx`, sesuai keputusan proyek untuk
  tetap memakai JavaScript dengan pemeriksaan tipe lewat JSDoc, bukan TypeScript.
- `"css": "src/tailwind.css"` mengarahkan CLI ke berkas Tailwind proyek.

## Yang harus diulang setiap kali sinkronisasi ulang

Sinkronisasi ulang akan menimpa berkas di folder ini, jadi tiga hal ini harus
dikerjakan lagi sesudahnya:

1. **`// @ts-nocheck` di setiap berkas.** Registry mengirim TypeScript; CLI
   menghapus tipenya. Penghapusan itu mengubah properti opsional menjadi wajib
   dan cast menjadi `unknown`, sehingga pemeriksa tipe melaporkan 18 temuan yang
   merupakan artefak konversi, bukan cacat. Cakupan penggantinya adalah build dan
   `tests/render.smoke.jsx`.
2. **Aturan `react-refresh/only-export-components` dimatikan** untuk folder ini
   di `eslint.config.js`. Registry memang mengekspor fungsi bantuan di samping
   komponen, dan aturan itu melarangnya.
3. **Tailwind hanya memindai folder ini.** Lihat `@source` di
   `src/tailwind.css`. Pemindaian otomatis dimatikan seluruh proyek supaya
   utilitas tidak tergenerate dari string biasa, jadi folder ini harus terdaftar
   secara eksplisit.

## Ketergantungan

`recharts` (sudah ada sebelum migrasi), `motion` untuk animasi, dan
`clsx` + `tailwind-merge` untuk helper `cn` di `src/lib/utils.js`.

## Tema

Warna seri dikompilasi menjadi CSS variable per chart oleh `ChartStyle` di
`ui/recharts-chart.jsx`, dengan `THEMES = { light: '', dark: '.dark' }`. Artinya
warna tema terang tidak berprefix dan warna tema gelap berada di bawah `.dark`.
`App.jsx` menyalakan kelas `dark` dan `light` sekaligus, sehingga pergantian tema
terjadi murni lewat CSS tanpa render ulang dan tanpa kedip.
