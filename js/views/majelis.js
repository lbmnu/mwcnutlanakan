import { supa } from '../lib/supa.js';
import { bisaSetujui } from '../state.js';
import { qrSvg } from '../lib/qr.js';
import { esc } from '../lib/util.js';
import { sesiAktif, judulSesi, tautanAbsen } from '../lib/absen.js';

// Layar proyektor majelis: QR dan kode 6 digit yang berganti tiap 15 detik.
export function tampil(el, ctx) {
  if (!bisaSetujui(ctx.state.profil)) { ctx.pindah('/dasbor'); return; }
  el.innerHTML = `
  <main class="majelis">
    <header class="majelis-atas">
      <img src="./icons/logo-nu.svg" alt="" width="66" height="43"><div><small>LBM MWCNU Tlanakan</small><strong id="m-judul">Absen rutinan</strong></div><img src="./icons/logo-lbm.svg" alt="" width="76" height="55">
    </header>
    <section class="majelis-tengah" id="m-isi"><p>Memuat…</p></section>
    <footer class="majelis-bawah">
      <span id="m-hadir"></span>
      <span class="majelis-aksi"><button type="button" class="tombol tombol-garis-terang tombol-kecil" id="m-penuh">Layar penuh</button><a class="tombol tombol-garis-terang tombol-kecil" href="#/dasbor">Tutup layar</a></span>
    </footer>
  </main>`;

  let hidup = true; let sesi = null; let sisa = 0; let timerDetik = null; let timerHadir = null; let sedangAmbil = false; let totalWarga = null;
  const isi = el.querySelector('#m-isi');
  el.querySelector('#m-penuh').addEventListener('click', () => { (el.requestFullscreen || (() => {})).call(el); });

  // Menahan layar agar tidak mati selama acara (didukung Chrome/Edge/Safari baru; yang lain diabaikan).
  let kunciLayar = null;
  async function tahanLayar() {
    try { if (hidup && document.visibilityState === 'visible' && navigator.wakeLock) kunciLayar = await navigator.wakeLock.request('screen'); } catch (_) {}
  }
  const saatTampak = () => { if (document.visibilityState === 'visible') tahanLayar(); };
  document.addEventListener('visibilitychange', saatTampak);
  tahanLayar();

  async function ambilKode() {
    if (sedangAmbil || !hidup) return; sedangAmbil = true;
    const { data, error } = await supa.rpc('kode_sesi', { p_id: sesi.id });
    sedangAmbil = false;
    if (!hidup) return;
    const b = Array.isArray(data) ? data[0] : data;
    if (error || !b) { isi.innerHTML = '<p class="majelis-galat">Kode belum bisa dimuat. Memeriksa lagi…</p>'; sisa = 3; return; }
    sisa = b.sisa;
    const bagi = `${b.kode.slice(0, 3)} ${b.kode.slice(3)}`;
    isi.innerHTML = `
      <div class="majelis-qr">${qrSvg(tautanAbsen(b.kode), { ukuran: 360 })}</div>
      <div class="majelis-kode" aria-live="polite">${esc(bagi)}</div>
      <p class="majelis-petunjuk">Pindai QR dengan kamera HP, atau ketik kode di Beranda aplikasi LBM.</p>
      <div class="majelis-bar" aria-hidden="true"><i style="width:${Math.round((sisa / 15) * 100)}%"></i></div>`;
  }

  async function muatHadir() {
    if (!sesi || !hidup) return;
    const [h, w] = await Promise.all([
      supa.from('absensi').select('id', { count: 'exact', head: true }).eq('sesi_id', sesi.id),
      totalWarga === null ? supa.from('profil').select('id', { count: 'exact', head: true }).eq('status', 'aktif') : Promise.resolve({ count: totalWarga })
    ]);
    if (!hidup) return;
    if (w.count !== null && w.count !== undefined) totalWarga = w.count;
    const badan = el.querySelector('#m-hadir');
    if (badan && !h.error) badan.textContent = `Hadir: ${h.count}${totalWarga ? ' dari ' + totalWarga + ' warga terdaftar' : ''}`;
  }

  (async () => {
    sesi = await sesiAktif();
    if (!hidup) return;
    if (!sesi || sesi.status !== 'buka') {
      isi.innerHTML = '<p class="majelis-galat">Sesi absen belum dibuka. Buka sesi dari Panel, lalu tampilkan layar ini.</p><a class="tombol tombol-emas" href="#/dasbor" style="max-width:280px">Ke Panel</a>';
      return;
    }
    el.querySelector('#m-judul').textContent = judulSesi(sesi);
    await ambilKode();
    muatHadir();
    timerDetik = setInterval(() => {
      sisa -= 1;
      const bar = el.querySelector('.majelis-bar i');
      if (bar) bar.style.width = `${Math.max(0, Math.round((sisa / 15) * 100))}%`;
      if (sisa <= 0) ambilKode();
    }, 1000);
    timerHadir = setInterval(muatHadir, 8000);
  })();
  return () => {
    hidup = false; clearInterval(timerDetik); clearInterval(timerHadir);
    document.removeEventListener('visibilitychange', saatTampak);
    try { kunciLayar?.release(); } catch (_) {}
  };
}
