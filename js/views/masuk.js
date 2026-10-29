import { supa } from '../lib/supa.js';
import { normalisasiWa, emailDariWa, pesanGalat } from '../lib/util.js';

export function tampil(el, ctx) {
  el.innerHTML = `
  <main class="gelap">
    <div class="kepala-dua-logo">
      <a href="#/" aria-label="Kembali ke beranda" style="display:flex;align-items:center;min-height:44px"><img src="./icons/logo-nu.svg" alt="Logo Nahdlatul Ulama" width="66" height="43"></a>
      <img src="./icons/logo-lbm.svg" alt="Logo LBM" width="76" height="55">
    </div>
    <h1 style="margin:10px 0 0;font-size:26px;line-height:1.3;font-weight:800">Selamat Datang</h1>
    <p style="margin:8px 0 0;font-size:14px;line-height:1.5;color:rgba(255,255,255,.9)">Silakan masuk menggunakan nomor WhatsApp yang telah terverifikasi.</p>

    <form class="kaca form" id="f" style="margin-top:20px" novalidate>
      <div class="kolom"><label for="wa">Nomor WhatsApp</label><input id="wa" name="wa" type="tel" inputmode="tel" autocomplete="username" placeholder="08xx, 628xx, atau +62 8xx" required></div>
      <div class="kolom"><label for="sandi">Kata sandi</label><input id="sandi" name="sandi" type="password" autocomplete="current-password" placeholder="Masukkan kata sandi" required></div>
      <p style="margin:0;font-size:13px;font-weight:600"><a class="tautan-emas" href="#/lupa-sandi" style="min-height:0">Lupa kata sandi?</a></p>
      <p id="pesan" class="galat" role="alert" hidden></p>
      <button class="tombol tombol-emas" type="submit">Masuk</button>
      <p class="teks-kecil-terang">Belum memiliki akun? <a class="tautan-emas" href="#/daftar">Daftar</a></p>
    </form>

    <section class="langkah" style="margin-top:16px" aria-label="Alur pendaftaran">
      <h2>Alur pendaftaran</h2>
      <ol>
        <li><b>1</b>Isi nama, Ranting NU, dan nomor WA</li>
        <li><b>2</b>Menunggu persetujuan pengurus</li>
        <li><b>3</b>Akun aktif, bisa masuk kapan saja</li>
      </ol>
    </section>
  </main>`;

  const f = el.querySelector('#f');
  const pesan = el.querySelector('#pesan');
  const tombol = f.querySelector('button[type=submit]');
  const tampilkanGalat = (t) => { pesan.textContent = t; pesan.hidden = !t; };

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    tampilkanGalat('');
    if (!ctx.siap) return tampilkanGalat('Situs belum dihubungkan ke database. ' + ctx.alasanBelumSiap);
    const wa = normalisasiWa(f.wa.value);
    if (!wa) return tampilkanGalat('Nomor WhatsApp tidak valid. Boleh ditulis 08xx, 628xx, atau +62 8xx.');
    if (!f.sandi.value) return tampilkanGalat('Kata sandi belum diisi.');
    tombol.disabled = true; tombol.textContent = 'Memeriksa…';
    const { error } = await supa.auth.signInWithPassword({ email: emailDariWa(wa), password: f.sandi.value });
    if (error) {
      tombol.disabled = false; tombol.textContent = 'Masuk';
      return tampilkanGalat(pesanGalat(error));
    }
    await ctx.segarkan();
  });
}
