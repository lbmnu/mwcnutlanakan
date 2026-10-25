# Portal LBM MWCNU Tlanakan

Situs yang bisa dipasang di HP seperti aplikasi (PWA). Tahap 1: halaman depan, masuk, daftar, persetujuan pendaftar oleh pengurus, dan ganti kata sandi.

Tanpa proses build. Isinya HTML, CSS, dan JavaScript biasa, database dan akun memakai Supabase, hosting memakai GitHub Pages.

## Isi folder

| Folder / berkas | Fungsi |
|---|---|
| `index.html`, `manifest.webmanifest`, `sw.js` | Kerangka situs dan syarat agar bisa dipasang di HP |
| `js/` | Logika situs (`config.js` adalah satu-satunya yang perlu Anda isi) |
| `css/`, `icons/`, `fonts/`, `vendor/` | Tampilan, ikon, font, dan pustaka Supabase |
| `supabase/schema.sql` | Tabel dan aturan keamanan database |
| `scripts/` | Alat bantu yang dijalankan di laptop (bukan bagian situs) |
| `data/pengurus.csv` | Nomor WA pengurus. **Tidak ikut ke GitHub** (sudah diabaikan `.gitignore`) |

## Langkah 1: Siapkan alat di laptop

1. Pasang **Node.js** versi LTS dari nodejs.org.
2. Buka terminal di folder ini, lalu jalankan:

```
npm install
npm run vendor
```

`npm run vendor` menyalin pustaka Supabase dan font ke dalam situs. Situs tidak akan berjalan sebelum langkah ini.

## Langkah 2: Buat proyek Supabase

Gunakan email organisasi (lembagabahtsulmasailmwcnutlana@gmail.com).

1. Daftar di supabase.com, buat proyek baru. Region: **Singapore**. Catat kata sandi database di tempat aman.
2. **Authentication > Sign In / Providers > Email**: matikan **Confirm email**. (Situs memakai alamat email internal dari nomor WA, jadi tidak ada surat yang dikirim.)
3. **Authentication > Sign In / Providers**: pastikan pendaftaran baru (*Allow new users to sign up*) menyala.
4. **SQL Editor > New query**: tempel seluruh isi `supabase/schema.sql`, klik **Run**.
5. **Project Settings > API**: salin **Project URL** dan kunci **anon public**. Isikan ke `js/config.js`.

> Kunci `anon public` aman berada di kode publik karena data dijaga aturan akses di database. Kunci `service_role` **rahasia**: jangan pernah dimasukkan ke berkas situs atau diunggah ke GitHub.

Bila pendaftaran gagal dengan pesan alamat email tidak valid, ganti `DOMAIN_AKUN` di `js/config.js` (dan di langkah 3 bila sudah dibuat akunnya) dengan domain lain, lalu kabari saya.

## Langkah 3: Buat akun 11 pengurus + admin

1. Salin `data/pengurus.example.csv` menjadi `data/pengurus.csv`, isi nomor WA asli. Kolom `wa_normal` berformat `62...` tanpa spasi atau tanda hubung.
2. Di terminal:

```
export SUPABASE_URL="https://xxxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="(kunci service_role dari Project Settings > API)"
npm run seed
```

(Windows PowerShell: `$env:SUPABASE_URL="..."` dan `$env:SUPABASE_SERVICE_ROLE_KEY="..."`.)

3. Skrip menghasilkan `hasil-sandi-sementara.csv`. Kirim kata sandi sementara ke tiap pengurus lewat WA masing-masing (jangan di grup). Saat pertama masuk, mereka diminta membuat kata sandi sendiri. Setelah semua terkirim, hapus berkas itu.

Skrip aman dijalankan ulang: akun yang sudah ada dilewati.

## Langkah 4: Coba di laptop

```
npm start
```

Buka `http://localhost:8080`. Masuk dengan salah satu akun pengurus. Uji juga pendaftaran dari jendela penyamaran, lalu setujui dari akun Ketua, Wakil Ketua, atau Sekretaris.

## Langkah 5: Tayangkan di GitHub Pages

1. Daftar GitHub dengan email organisasi, pilih nama pengguna yang pendek dan final.
2. Buat repositori **publik** bernama `<namapengguna>.github.io` agar alamatnya tanpa garis miring tambahan. (GitHub Pages gratis mensyaratkan repositori publik, itulah mengapa tidak boleh ada rahasia di dalamnya.)
3. Unggah isi folder ini. Pastikan `data/pengurus.csv` dan `hasil-sandi-sementara.csv` **tidak** ikut.
4. **Settings > Pages**: sumber **Deploy from a branch**, cabang `main`, folder `/ (root)`.
5. Di Supabase: **Authentication > URL Configuration**, isi **Site URL** dengan alamat situs.

### Alamat akhir

Alamat gratis dipakai untuk uji coba bersama pengurus. **Sebelum alamat dibagikan ke warga**, beli domain atas nama organisasi dan sambungkan lewat Settings > Pages > Custom domain. Aplikasi yang sudah terpasang di HP terikat ke alamatnya; bila alamat berganti, warga harus memasang ulang.

## Langkah 6: Cegah proyek "tidur"

Supabase gratis dijeda setelah 1 minggu tanpa aktivitas, dan tidak ada cadangan otomatis. Pasang jadwal sederhana yang membuka situs atau memanggil API setiap beberapa hari (kami siapkan pada tahap berikutnya), dan unduh cadangan data berkala dari menu **Database > Backups** atau `pg_dump`.

## Keamanan akun layanan

- Aktifkan verifikasi 2 langkah di Gmail organisasi, Supabase, dan GitHub.
- Simpan kode cadangan (*backup codes*) pada Ketua atau Sekretaris.
- Nomor pemulihan: salah satu dari 3 admin (Ketua, Wakil Ketua, Sekretaris).

## Memasang di HP

Android (Chrome): buka situs, lalu tekan **Tambahkan ke Layar Utama** di kartu yang muncul (atau menu titik tiga > *Instal aplikasi*).
iPhone (Safari): tombol **Bagikan** > **Tambah ke Layar Utama**.
