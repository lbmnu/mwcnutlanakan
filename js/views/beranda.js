import { pasangKartu } from '../lib/pasang.js';
import { esc, ikon } from '../lib/util.js';
import { jawabanTerbaru, agendaTerdekat } from '../lib/data.js';
import { hariTanggal } from '../lib/util.js';

export function tampil(el, ctx) {
  el.innerHTML = `
  <main class="gelap">
    <header class="kepala-merek">
      <img src="./icons/logo-nu.svg" alt="Logo Nahdlatul Ulama" width="66" height="43">
      <span>MWCNU Tlanakan</span>
    </header>
    <div class="pegas"></div>
    <section class="kaca" aria-labelledby="judul">
      <img class="logo-lbm" src="./icons/logo-lbm.svg" alt="Logo LBM" width="124" height="89">
      <div class="nama-lembaga"><span class="a">LEMBAGA BAHTSUL MASAIL</span><span class="b">MWCNU TLANAKAN</span></div>
      <h1 id="judul" class="tagline">RAWAT TRADISI<span>OLAH INOVASI</span></h1>
      <p class="sub-tagline">Aktif menyaring, memproses, dan membawa budaya menuju kemaslahatan umat.</p>
      <a class="tombol tombol-emas" href="#/masuk">${ikon('masuk')} Masuk</a>
      <p class="teks-kecil-terang">Belum memiliki akun? Silakan <a class="tautan-emas" href="#/daftar">mendaftar</a>, lalu tunggu verifikasi pengurus.</p>
    </section>
    ${ctx.siap ? '' : `<p class="galat" style="margin-top:16px">Mode pratinjau: ${ctx.alasanBelumSiap}</p>`}
    <div id="agenda-beranda" style="margin-top:16px"></div>
    <div id="terbaru-beranda" style="margin-top:16px"></div>
    <div id="pasang" style="margin-top:16px"></div>
    <div class="pegas"></div>
  </main>`;
  if (ctx.siap) {
    agendaTerdekat(1).then(([a]) => {
      const k = el.querySelector('#agenda-beranda');
      if (!k || !a) return;
      k.innerHTML = `<a class="pasang banner-jawaban" href="#/agenda/${esc(a.id)}"><p><small>Agenda rutinan · ${esc(hariTanggal(a.tanggal, true))}</small><strong>${esc(a.judul)}</strong></p>${ikon('panah')}</a>`;
    });
    jawabanTerbaru(1).then(([j]) => {
      const k = el.querySelector('#terbaru-beranda');
      if (!k) return;
      k.innerHTML = j
        ? `<a class="pasang banner-jawaban" href="#/jawaban/${esc(j.id)}"><p><small>Jawaban terbaru · ${esc(j.rubrik)}</small><strong>${esc(j.judul)}</strong></p>${ikon('panah')}</a>
           <p class="teks-kecil-terang" style="margin-top:10px"><a class="tautan-emas" href="#/jawaban">Lihat semua jawaban</a> · <a class="tautan-emas" href="#/tulisan">Baca tulisan warga</a></p>`
        : '';
    });
  }
  return pasangKartu(el.querySelector('#pasang'));
}
