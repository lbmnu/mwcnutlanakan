import { supa } from '../lib/supa.js';
import { normalisasiWa, pesanGalat } from '../lib/util.js';

export function tampil(el, ctx) {
  el.innerHTML = `
  <main class="gelap">
    <div class="kepala-dua-logo">
      <a href="#/masuk" aria-label="Kembali ke halaman masuk" style="display:flex;align-items:center;min-height:44px"><img src="./icons/logo-nu.svg" alt="Logo Nahdlatul Ulama" width="66" height="43"></a>
      <img src="./icons/logo-lbm.svg" alt="Logo LBM" width="76" height="55">
    </div>
    <h1 style="margin:10px 0 0;font-size:26px;line-height:1.3;font-weight:800">Atur Ulang Kata Sandi</h1>
    <p style="margin:8px 0 0;font-size:14px;line-height:1.5;color:rgba(255,255,255,.9)">Masukkan nomor WhatsApp dan kode pemulihan 12 huruf yang Anda simpan.</p>

    <form class="kaca form" id="f" style="margin-top:20px" novalidate>
      <div class="kolom"><label for="wa">Nomor WhatsApp</label><input id="wa" type="tel" inputmode="tel" autocomplete="username" placeholder="08xx, 628xx, atau +62 8xx" required></div>
      <div class="kolom"><label for="kode">Kode pemulihan</label><input id="kode" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX" required></div>
      <div class="kolom"><label for="baru">Kata sandi baru</label><input id="baru" type="password" autocomplete="new-password" placeholder="Minimal 8 karakter" required></div>
      <div class="kolom"><label for="ulang">Ulangi kata sandi baru</label><input id="ulang" type="password" autocomplete="new-password" required></div>
      <p id="pesan" class="galat" role="alert" hidden></p>
      <button class="tombol tombol-emas" type="submit">Simpan Kata Sandi Baru</button>
      <p class="teks-kecil-terang">Tidak punya kode? Hubungi pengurus LBM untuk disetel ulang.<br><a class="tautan-emas" href="#/masuk">Kembali ke Masuk</a></p>
    </form>
    <section class="kaca" id="selesai" style="align-items:center;text-align:center;margin-top:20px" hidden>
      <h2 style="margin:0;font-size:20px">Kata sandi sudah diganti</h2>
      <p style="margin:0;font-size:14px;line-height:1.5">Silakan masuk dengan kata sandi yang baru.</p>
      <a class="tombol tombol-emas" href="#/masuk">Masuk</a>
    </section>
  </main>`;

  const f = el.querySelector('#f');
  const pesan = el.querySelector('#pesan');
  const tombol = f.querySelector('button[type=submit]');
  const galat = (t) => { pesan.textContent = t; pesan.hidden = !t; };

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    galat('');
    if (!ctx.siap) return galat('Situs belum dihubungkan ke database. ' + ctx.alasanBelumSiap);
    const wa = normalisasiWa(f.wa.value);
    const kode = f.kode.value.replace(/[^A-Za-z0-9]/g, '');
    if (!wa) return galat('Nomor WhatsApp tidak valid. Boleh ditulis 08xx, 628xx, atau +62 8xx.');
    if (kode.length !== 12) return galat('Kode pemulihan terdiri dari 12 huruf dan angka.');
    if (f.baru.value.length < 8) return galat('Kata sandi minimal 8 karakter.');
    if (f.baru.value !== f.ulang.value) return galat('Kedua kata sandi tidak sama.');
    tombol.disabled = true; tombol.textContent = 'Menyimpan…';
    const { data, error } = await supa.rpc('reset_sandi', { p_wa: wa, p_kode: kode, p_sandi: f.baru.value });
    tombol.disabled = false; tombol.textContent = 'Simpan Kata Sandi Baru';
    if (error) return galat(pesanGalat(error));
    if (data === 'terkunci') return galat('Terlalu banyak percobaan. Coba lagi dalam 1 jam, atau hubungi pengurus.');
    if (data !== 'ok') return galat('Nomor WhatsApp atau kode pemulihan salah.');
    f.hidden = true; el.querySelector('#selesai').hidden = false;
  });
}
