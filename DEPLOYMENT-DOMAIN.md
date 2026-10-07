# Migrasi Domain ke coreview.vertexdata.web.id

Status: **belum dieksekusi.** Tidak ada domain yang ditambahkan, tidak ada
record DNS yang dibuat, tidak ada redirect yang disetel. Dokumen ini berisi hasil
riset dan runbook, bukan catatan eksekusi.

| | |
|---|---|
| Domain lama | `coreview.aderamdani.web.id` |
| Domain baru | `coreview.vertexdata.web.id` |
| DNS | Cloudflare, zona `vertexdata.web.id` |
| Deploy | Vercel |

---

## Kenapa repo ini tidak perlu disentuh

Domain tidak di-hardcode di mana pun. `vercel.json` hanya berisi rewrite SPA,
tanpa bagian `domains`, dan tidak ada berkas `CNAME`. Konfigurasi domain
berada di level project Vercel, bukan di repositori. Jadi migrasi ini murni
urusan Vercel dan DNS Cloudflare.

`coreview` adalah **subdomain**, bukan apex. Zona `vertexdata.web.id` punya
situs lain yang dikelola lewat Cloudflare Tunnel. A record apex, NS, dan
konfigurasi zona **tidak boleh disentuh**. Yang ditambahkan hanya satu record
CNAME untuk label `coreview`.

---

## Lima koreksi terhadap rencana awal

Kelima asumsi berikut terbukti salah dan sudah diverifikasi ulang sebelum
dijalankan. Semua berasal dari dokumentasi resmi, bukan tebakan.

| Asumsi awal | Kenyataannya |
|---|---|
| Target CNAME `cname.vercel-dns.com` | Unik per project, bentuk `xxxxxxxx.vercel-dns-0xx.com` |
| CNAME ada di respons domain | Tidak ada. Berada di `recommendedCNAME` pada endpoint terpisah |
| Status = string "Valid Configuration" | Tidak ada enum status. Yang trustworthy: `verified` (boolean) dan `misconfigured` |
| Redirect lewat setelan terpisah | Field `redirect` pada objek domain, diatur lewat `PATCH` |
| `name` cukup label `coreview` | Harus FQDN: `coreview.vertexdata.web.id` |

Poin kedua dan ketiga paling mudah menjebak. Kalau hanya membaca
`GET /projects/{id}/domains`, tidak akan pernah menemukan nilai CNAME maupun
status verifikasi.

---

## Endpoint yang terverifikasi

### Vercel

Base `https://api.vercel.com`, header `Authorization: Bearer <token>`.

| Operasi | Method dan path |
|---|---|
| Cari project | `GET /v10/projects` |
| Detail project | `GET /v9/projects/{idAtauNama}` |
| Tambah domain | `POST /v10/projects/{idAtauNama}/domains` body `{"name":"..."}` |
| List domain | `GET /v9/projects/{idAtauNama}/domains?limit=100` |
| **Baca CNAME** | `GET /v6/domains/{domain}/config?projectIdOrName={idAtauNama}` |
| Minta verifikasi | `POST /v9/projects/{idAtauNama}/domains/{domain}/verify` |
| Set redirect | `PATCH /v9/projects/{idAtauNama}/domains/{domain}` |
| Hapus domain | `DELETE /v9/projects/{idAtauNama}/domains/{domain}` |

Nilai CNAME berada di `recommendedCNAME[].value`, ambil yang `rank = 1`.

Tantangan verifikasi TXT ada di `verification[]`, tiap item punya `domain`,
`type`, dan `value`. Untuk `type = "TXT"`, buat record TXT dengan nilai persis
`value` pada `domain`.

Tidak ada field berstatus string. Status ditentukan dari `verified` (boolean)
pada objek domain, ditambah `misconfigured` (boolean) pada endpoint config.

### Cloudflare

Base `https://api.cloudflare.com/client/v4`, header
`Authorization: Bearer <token>`.

| Operasi | Method dan path |
|---|---|
| Cari zone | `GET /zones?name=vertexdata.web.id` → `result[0].id` |
| List record | `GET /zones/{zone_id}/dns_records` |
| Buat record | `POST /zones/{zone_id}/dns_records` |
| Hapus record | `DELETE /zones/{zone_id}/dns_records/{id}` |

Body untuk membuat CNAME:

```json
{
  "type": "CNAME",
  "name": "coreview.vertexdata.web.id",
  "content": "<nilai recommendedCNAME dari Vercel>",
  "ttl": 300,
  "proxied": false,
  "comment": "CoreView"
}
```

`ttl` wajib ada di skema, 300 aman untuk record tanpa proxy. `proxied: false`
berarti DNS only (abu-abu di dashboard), supaya Vercel yang menangani TLS.
Label relatif seperti `coreview` memang diterima API dalam praktik, tapi
dokumentasi menyatakan `name` adalah nama lengkap, jadi pakai FQDN.

Izin token: `DNS Write` dan `DNS Read`, keduanya bisa di-scope ke satu zone.

---

## Runbook manual

### Vercel

1. Buka project CoreView, **Settings > Domains**, klik **Add Domain**.
2. Isi `coreview.vertexdata.web.id`.
3. Salin **persis** nilai CNAME yang ditampilkan. Jangan mengarang dan jangan
   memakai nilai dari dokumentasi.
4. Kalau Vercel meminta verifikasi lewat TXT, catat `domain` dan `value`-nya.
   Hanya boleh satu TXT verifikasi aktif sekaligus.
5. Jangan menyentuh domain lama dulu. Domain baru harus valid dulu.

### Cloudflare

1. Buka zona `vertexdata.web.id`, tab **DNS**, **Add record**.
2. **Type** `CNAME`, **Name** `coreview`, **Target** nilai dari langkah Vercel.
3. **Proxy status** DNS only. Jangan oranye.
4. Kalau ada TXT verifikasi, tambahkan juga dengan nama persis seperti yang
   Vercel minta.
5. **Periksa dulu** apakah record `coreview` sudah ada. Perilaku create untuk
   nama yang sudah ada tidak terdokumentasi, bisa error atau bisa membuat
   duplikat.

### Menunggu

Status Vercel berubah menjadi valid biasanya 5 sampai 20 menit. Kalau belum,
periksa lagi dengan `curl -I https://coreview.vertexdata.web.id`.

### Redirect domain lama

**Hanya setelah domain baru benar-benar valid.** Lalu di project yang sama,
**Settings > Domains**, pilih domain lama, **Edit**, isi kolom redirect ke
domain baru.

Domain lama **tidak** dihapus. Penghapusan butuh persetujuan eksplisit.

---

## Skrip yang sudah disiapkan

```
/private/var/folders/n8/_22byg_n0fd3sw0bfrym_0n40000gn/T/opencode/coreview-migrate.sh
```

Sifat penting:

- Tidak punya kode penghapusan sama sekali. Kata `DELETE` tidak muncul sekali
  pun, jadi penghapusan domain atau record tidak bisa terjadi dari skrip ini.
- Default-nya dry-run. Empat operasi tulis semuanya terkunci di balik
  `ALLOW_WRITE=1`.
- Nilai CNAME selalu dibaca dari respons Vercel, tidak pernah diisi manual.
- Berhenti kalau menemukan lebih dari satu project bernama CoreView, lebih dari
  satu zona, atau record `coreview` yang sudah ada.

Pemakaian:

```bash
cd /private/var/folders/n8/_22byg_n0fd3sw0bfrym_0n40000gn/T/opencode

VERCEL_TOKEN=... CLOUDFLARE_API_TOKEN=... ./coreview-migrate.sh audit
ALLOW_WRITE=1 ./coreview-migrate.sh add-domain
ALLOW_WRITE=1 ./coreview-migrate.sh dns "xxxxxxxx.vercel-dns-0xx.com"
./coreview-migrate.sh verify
ALLOW_WRITE=1 ./coreview-migrate.sh redirect <projectId>
```

Berkas ini ada di direktori sementara yang bisa dibersihkan sewaktu-waktu.
Salin ke tempat yang permanen kalau nanti dipakai lagi.

---

## Langkah manual yang tersisa

- Field **Website** di halaman About repositori GitHub masih menunjuk domain
  lama. Ini tidak bisa diubah lewat API mana pun, harus lewat browser.
- Token API Vercel dan Cloudflare, kalau sempat dibuat, perlu dicabut setelah
  migrasi selesai. Berikan masa berlaku singkat saat membuatnya.
