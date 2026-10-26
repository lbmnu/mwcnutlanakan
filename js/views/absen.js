import { esc } from '../lib/util.js';
import { kirimKode, ambilKode } from '../lib/absen.js';

// Tujuan tautan QR majelis: #/absen?k=123456. Memerlukan masuk; setelah masuk kembali ke sini.
export async function tampil(el, ctx) {
  const k = new URLSearchParams(location.hash.split('?')[1] || '').get('k') || '';
  const kode = ambilKode(`?k=${k}`);
  el.innerHTML = `
  <div class="dalam-krem">
    <header class="bilah-hijau"><div class="salam"><small>Absen rutinan</small><strong>Mencatat kehadiran</strong></div></header>
    <main class="isi">
      <section class="bagian" id="hasil"><p class="kosong">Memeriksa kode…</p></section>
      <a class="tombol tombol-hijau" href="#/dasbor">Ke Beranda</a>
    </main>
  </div>`;
  const hasil = el.querySelector('#hasil');
  if (!kode) { hasil.innerHTML = '<h2>Kode tidak terbaca</h2><p class="kosong">Pindai ulang QR di layar majelis, atau ketik kode 6 digit di Beranda.</p>'; return; }
  const r = await kirimKode(kode);
  const ok = r.status === 'ok' || r.status === 'sudah';
  hasil.innerHTML = `<h2>${ok ? 'Alhamdulillah, tercatat hadir' : 'Absen belum tercatat'}</h2><p class="${ok ? 'sukses' : 'galat'}" style="margin-top:10px">${esc(r.teks)}</p>`;
}
