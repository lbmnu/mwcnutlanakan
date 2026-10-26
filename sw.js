// Service worker LBM MWCNU Tlanakan.
// Menyimpan kerangka situs supaya terbuka cepat dan tetap menampilkan halaman saat sinyal hilang.
// Data (jawaban, kas, absen) tidak pernah disimpan di sini; selalu diambil dari server.
const VERSI = 'lbm-v9';
const KERANGKA = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/fonts.css',
  './css/tokens.css',
  './css/app.css',
  './js/main.js',
  './js/config.js',
  './js/state.js',
  './js/lib/supa.js',
  './js/lib/util.js',
  './js/lib/pasang.js',
  './js/lib/data.js',
  './js/views/beranda.js',
  './js/views/masuk.js',
  './js/views/daftar.js',
  './js/views/menunggu.js',
  './js/views/dasbor.js',
  './js/views/ruang-warga.js',
  './js/views/panel-pengurus.js',
  './js/views/rubrik.js',
  './js/views/kas.js',
  './js/views/profil.js',
  './js/lib/kerangka.js',
  './js/lib/pemulihan.js',
  './js/lib/lihat-sandi.js',
  './js/lib/qr.js',
  './js/lib/absen.js',
  './js/lib/pindai.js',
  './js/lib/kartu-absen.js',
  './js/lib/ring-hadir.js',
  './js/views/absen.js',
  './js/views/kartu.js',
  './js/views/majelis.js',
  './js/views/kehadiran.js',
  './js/views/lupa-sandi.js',
  './js/views/gantisandi.js',
  './js/views/jawaban-daftar.js',
  './js/views/jawaban-baca.js',
  './js/views/tanya.js',
  './js/views/panel-pertanyaan.js',
  './js/views/panel-jawab.js',
  './js/views/tulis.js',
  './js/views/tulisan-saya.js',
  './js/views/tulisan-daftar.js',
  './js/views/tulisan-baca.js',
  './js/views/panel-tulisan.js',
  './js/views/panel-sunting.js',
  './vendor/supabase.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/logo-lbm.svg',
  './icons/logo-nu.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSI);
    // allSettled: satu berkas yang belum ada tidak menggagalkan pemasangan.
    await Promise.allSettled(KERANGKA.map((u) => cache.add(u)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const nama = await caches.keys();
    await Promise.all(nama.filter((n) => n !== VERSI).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // API Supabase dan lainnya: langsung ke jaringan

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(VERSI);
        cache.put('./index.html', res.clone());
        return res;
      } catch (_) {
        return (await caches.match('./index.html')) || (await caches.match('./'));
      }
    })());
    return;
  }

  // Kode situs (js, css, html, manifest): jaringan dulu supaya pembaruan langsung terlihat, cache hanya cadangan saat offline.
  if (/\.(js|mjs|css|html|webmanifest|json)$/.test(url.pathname)) {
    e.respondWith((async () => {
      const cache = await caches.open(VERSI);
      try {
        const res = await fetch(req, { cache: 'no-cache' });
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch (_) {
        return (await cache.match(req)) || Response.error();
      }
    })());
    return;
  }

  // Gambar dan font jarang berubah: dari cache dulu, perbarui di latar belakang.
  e.respondWith((async () => {
    const cache = await caches.open(VERSI);
    const tersimpan = await cache.match(req);
    const dariJaringan = fetch(req).then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    return tersimpan || (await dariJaringan) || Response.error();
  })());
});
