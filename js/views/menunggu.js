import { supa } from '../lib/supa.js';
import { KONTAK_PENGURUS } from '../config.js';
import { esc, ikon } from '../lib/util.js';
import { kotakKode, pasangSalin } from '../lib/pemulihan.js';

export function tampil(el, ctx) {
  const p = ctx.state.profil;
  const galat = ctx.state.galatProfil;
  let judul = 'Pendaftaran terkirim';
  let isi = 'Pengurus akan memverifikasi data Anda. Anda bisa masuk setelah akun terverifikasi.';
  if (galat) { judul = 'Data akun belum bisa dimuat'; isi = 'Periksa koneksi internet, lalu coba lagi.'; }
  else if (!p) { judul = 'Akun sedang disiapkan'; isi = 'Mohon tunggu sebentar lalu muat ulang halaman ini.'; }
  else if (p.status === 'ditolak') { judul = 'Pendaftaran belum dapat disetujui'; isi = 'Silakan hubungi pengurus LBM untuk keterangan lebih lanjut.'; }
  else if (p.status === 'nonaktif') { judul = 'Akun dinonaktifkan'; isi = 'Silakan hubungi pengurus LBM bila ini keliru.'; }

  const pesan = encodeURIComponent('Assalamu’alaikum Wr. Wb. Saya ' + (p?.nama || '') + ', baru mendaftar di website LBM MWCNU Tlanakan. Mohon diverifikasi. Terima kasih.');
  const tombolWa = KONTAK_PENGURUS.filter((k) => k.wa).map((k, i) => `<a class="tombol ${i === 0 ? 'tombol-emas' : 'tombol-garis-terang'}" href="https://wa.me/${esc(k.wa)}?text=${pesan}">${ikon('wa')} Kabari ${esc(k.peran)}</a>`).join('');

  el.innerHTML = `
  <main class="gelap">
    <div class="pegas"></div>
    <section class="kaca" style="align-items:center;text-align:center">
      <div class="ikon-bulat">${ikon('cek')}</div>
      <h1 style="margin:0;font-size:22px;font-weight:800">${esc(judul)}</h1>
      <p style="margin:0;font-size:14px;line-height:1.55;color:rgba(255,255,255,.92)">${esc(isi)}</p>
      ${ctx.state.kodeBaru ? `<div style="width:100%"><h2 style="margin:0 0 6px;font-size:16px">Kode pemulihan Anda</h2><p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:rgba(255,255,255,.92)">Dipakai bila suatu saat lupa kata sandi.</p>${kotakKode(ctx.state.kodeBaru)}</div>` : ''}
      ${tombolWa}
      <button type="button" class="tombol tombol-garis-terang" id="muat">Periksa lagi</button>
      <button type="button" class="tautan-emas" id="keluar">Keluar</button>
    </section>
    <div class="pegas"></div>
  </main>`;

  pasangSalin(el);
  el.querySelector('#muat').addEventListener('click', () => ctx.segarkan());
  el.querySelector('#keluar').addEventListener('click', async () => { ctx.state.kodeBaru = null; await supa.auth.signOut(); location.hash = '#/'; ctx.segarkan(); });
}
