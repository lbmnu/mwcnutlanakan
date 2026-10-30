import { supa } from '../lib/supa.js';
import { pasangMenu } from '../lib/kerangka.js';
import { bisaSetujui } from '../state.js';
import { esc, tanggalId } from '../lib/util.js';

// Daftar arsip rutinan (hanya untuk warga yang sudah masuk).
export async function tampil(el, ctx) {
  const boleh = bisaSetujui(ctx.state.profil);
  el.innerHTML = `
  <div class="dalam-krem ada-menu">
    <header class="bilah-hijau">
      <div class="salam"><small>Dokumentasi</small><strong>Arsip Rutinan</strong></div>
      ${boleh ? '<a class="lencana" href="#/panel/arsip">Tambah</a>' : ''}
    </header>
    <main class="isi">
      <section class="bagian"><p class="kosong">Foto dan catatan rutinan bulanan LBM. Hanya terlihat oleh warga yang sudah masuk.</p></section>
      <div id="daftar"><p class="kosong">Memuat…</p></div>
    </main>
  </div>`;
  pasangMenu(el, ctx.state.profil, 'beranda');
  const daftar = el.querySelector('#daftar');
  const { data, error } = await supa.rpc('arsip_daftar', { p_batas: 24, p_lewat: 0 });
  if (error) { daftar.innerHTML = '<p class="galat">Arsip belum bisa dimuat. Periksa koneksi lalu coba lagi.</p>'; return; }
  if (!data.length) { daftar.innerHTML = `<section class="bagian"><p class="kosong">Belum ada arsip.${boleh ? ' Tekan “Tambah” setelah rutinan selesai.' : ''}</p></section>`; return; }
  daftar.innerHTML = data.map((a) => `
    <a class="kartu-tautan kartu-arsip" href="#/arsip/${esc(a.id)}">
      <span class="foto-kecil" data-path="${esc(a.foto_pertama || '')}" aria-hidden="true"></span>
      <span class="isi-arsip">
        <strong>${esc(a.judul)}</strong>
        <small>${esc(tanggalId(a.tanggal))}${a.tempat ? ' · ' + esc(a.tempat) : ''}</small>
        <small>${a.jumlah_foto} foto${a.total_hadir !== null && a.total_hadir !== undefined ? ' · ' + a.total_hadir + ' warga hadir' : ''}</small>
      </span>
    </a>`).join('');
  // Gambar kecil: tautan bertanda tangan sementara dari Storage.
  const paths = [...new Set(data.map((a) => a.foto_pertama).filter(Boolean))];
  if (paths.length) {
    const { data: tanda } = await supa.storage.from('arsip').createSignedUrls(paths, 3600);
    const peta = new Map((tanda || []).map((t) => [t.path, t.signedUrl]));
    daftar.querySelectorAll('.foto-kecil').forEach((e) => { const u = peta.get(e.dataset.path); if (u) e.style.backgroundImage = `url("${u}")`; });
  }
}
