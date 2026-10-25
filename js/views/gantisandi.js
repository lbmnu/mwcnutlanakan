import { supa } from '../lib/supa.js';
import { pesanGalat } from '../lib/util.js';

export function tampil(el, ctx) {
  el.innerHTML = `
  <div class="dalam-krem">
    <header class="bilah-hijau"><div class="salam"><small>Langkah pertama</small><strong>Ganti kata sandi</strong></div></header>
    <main class="isi">
      <p style="margin:0;line-height:1.55">Kata sandi Anda masih sementara. Buat kata sandi baru yang hanya Anda yang tahu, minimal 8 karakter.</p>
      <form class="form" id="f" novalidate>
        <div class="kolom"><label for="baru">Kata sandi baru</label><input id="baru" type="password" autocomplete="new-password" required></div>
        <div class="kolom"><label for="ulang">Ulangi kata sandi baru</label><input id="ulang" type="password" autocomplete="new-password" required></div>
        <p id="pesan" class="galat" role="alert" hidden></p>
        <button class="tombol tombol-hijau" type="submit">Simpan</button>
      </form>
    </main>
  </div>`;

  const f = el.querySelector('#f');
  const pesan = el.querySelector('#pesan');
  const tampilkanGalat = (t) => { pesan.textContent = t; pesan.hidden = !t; };

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    tampilkanGalat('');
    const baru = f.baru.value;
    if (baru.length < 8) return tampilkanGalat('Kata sandi minimal 8 karakter.');
    if (baru !== f.ulang.value) return tampilkanGalat('Kedua kata sandi tidak sama.');
    const tombol = f.querySelector('button');
    tombol.disabled = true;
    const { error } = await supa.auth.updateUser({ password: baru });
    if (error) { tombol.disabled = false; return tampilkanGalat(pesanGalat(error)); }
    const { error: e2 } = await supa.rpc('sudah_ganti_sandi');
    if (e2) { tombol.disabled = false; return tampilkanGalat(pesanGalat(e2)); }
    await ctx.segarkan();
  });
}
