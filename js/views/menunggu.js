import { supa } from '../lib/supa.js';
import { KONTAK_WA } from '../config.js';
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

  const wa = KONTAK_WA ? `https://wa.me/${esc(KONTAK_WA)}?text=${encodeURIComponent('Assalamu’alaikum Wr. Wb. Saya ' + (p?.nama || '') + ', baru mendaftar di website LBM MWCNU Tlanakan. Mohon diverifikasi. Terima kasih.')}` : '';

  el.innerHTML = `
  <main class="gelap">
    <div class="pegas"></div>
    <section class="kaca" style="align-items:center;text-align:center">
      <div class="ikon-bulat">${ikon('cek')}</div>
      <h1 style="margin:0;font-size:22px;font-weight:800">${esc(judul)}</h1>
      <p style="margin:0;font-size:14px;line-height:1.55;color:rgba(255,255,255,.92)">${esc(isi)}</p>
      ${ctx.state.kodeBaru ? `<div style="width:100%"><h2 style="margin:0 0 6px;font-size:16px">Kode pemulihan Anda</h2><p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:rgba(255,255,255,.92)">Dipakai bila suatu saat lupa kata sandi.</p>${kotakKode(ctx.state.kodeBaru)}</div>` : ''}
      ${wa ? `<a class="tombol tombol-emas" href="${wa}">${ikon('wa')} Kabari Pengurus via WA</a>` : ''}
      <button type="button" class="tombol tombol-garis-terang" id="muat">Periksa lagi</button>
      <button type="button" class="tautan-emas" id="keluar">Keluar</button>
    </section>
    <div class="pegas"></div>
  </main>`;

  pasangSalin(el);
  el.querySelector('#muat').addEventListener('click', () => ctx.segarkan());
  el.querySelector('#keluar').addEventListener('click', async () => { ctx.state.kodeBaru = null; await supa.auth.signOut(); location.hash = '#/'; ctx.segarkan(); });
}
