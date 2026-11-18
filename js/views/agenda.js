import { supa } from '../lib/supa.js';
import { esc, hariTanggal, hariIniWib } from '../lib/util.js';
import { pasangMenu } from '../lib/kerangka.js';
import { bisaAgenda } from '../state.js';

// Daftar agenda rutinan yang sudah terbit. Terbuka untuk umum.
export async function tampil(el, ctx) {
  const masuk = !!ctx.state.session;
  const kelola = bisaAgenda(ctx.state.profil);
  el.innerHTML = `
  <div class="dalam-krem">
    <header class="bilah-hijau">
      <div class="salam"><small>Terbuka untuk umum</small><strong>Agenda Rutinan</strong></div>
      <a class="lencana" href="${masuk ? '#/dasbor' : '#/'}">${masuk ? 'Beranda' : 'Depan'}</a>
    </header>
    <main class="isi">
      ${kelola ? '<a class="tombol tombol-garis" style="color:var(--hijau-tengah)" href="#/panel/agenda">Kelola agenda dan draf soal</a>' : ''}
      <div id="hasil"><p class="kosong">Memuat…</p></div>
    </main>
  </div>`;
  pasangMenu(el, ctx.state.profil, 'beranda');
  const hasil = el.querySelector('#hasil');
  if (!ctx.siap) { hasil.innerHTML = `<p class="galat">${esc(ctx.alasanBelumSiap)}</p>`; return; }

  const { data, error } = await supa.from('agenda_publik')
    .select('id,tanggal,hijriah,waktu,tempat,judul,pertanyaan')
    .order('tanggal', { ascending: false }).limit(60);
  if (!el.isConnected) return;
  if (error) { hasil.innerHTML = '<p class="galat">Agenda belum bisa dimuat. Periksa koneksi lalu coba lagi.</p>'; return; }
  if (!data.length) { hasil.innerHTML = '<div class="bagian"><p class="kosong">Belum ada agenda yang diumumkan.</p></div>'; return; }

  const hariIni = hariIniWib();
  const akan = data.filter((a) => a.tanggal >= hariIni).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  const lalu = data.filter((a) => a.tanggal < hariIni);
  const kartu = (a) => `
    <a class="kartu-tautan" href="#/agenda/${esc(a.id)}">
      <span class="tag-baris"><span class="tag">${esc(hariTanggal(a.tanggal, true))}</span>${a.hijriah ? `<span class="tag tag-garis">${esc(a.hijriah)}</span>` : ''}</span>
      <strong>${esc(a.judul)}</strong>
      <span class="ringkas">${esc(a.tempat)}</span>
      <small>${a.pertanyaan.length} butir pertanyaan</small>
    </a>`;
  hasil.innerHTML = `
    ${akan.length ? `<section class="bagian"><h2>Akan datang</h2></section>${akan.map(kartu).join('')}` : '<div class="bagian"><p class="kosong">Belum ada agenda yang akan datang.</p></div>'}
    ${lalu.length ? `<section class="bagian" style="margin-top:16px"><h2>Sudah lewat</h2></section>${lalu.map(kartu).join('')}` : ''}`;
}
