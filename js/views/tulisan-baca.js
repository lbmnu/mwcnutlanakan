import { supa } from '../lib/supa.js';
import { pasangMenu } from '../lib/kerangka.js';
import { esc, ikon, paragraf, tanggalId, salin, tautanTulisan, teksBagikanTulisan, tautanWa } from '../lib/util.js';

export async function tampil(el, ctx) {
  const masuk = !!ctx.state.session;
  el.innerHTML = `
  <div class="dalam-krem">
    <header class="bilah-hijau">
      <div class="salam"><small>Terbuka untuk umum</small><strong id="bentuk-kepala">Tulisan</strong></div>
      <a class="lencana" href="#/tulisan">Semua tulisan</a>
    </header>
    <main class="isi"><div class="bagian"><p class="kosong">Memuat…</p></div></main>
  </div>`;
  pasangMenu(el, ctx.state.profil, 'rubrik');
  const isi = el.querySelector('main.isi');
  if (!ctx.siap) { isi.innerHTML = `<p class="galat">${esc(ctx.alasanBelumSiap)}</p>`; return; }
  const { data: t, error } = await supa.from('tulisan_publik').select('*').eq('id', ctx.params.id).maybeSingle();
  if (error) { isi.innerHTML = '<p class="galat">Tulisan belum bisa dimuat. Periksa koneksi lalu coba lagi.</p>'; return; }
  if (!t) { isi.innerHTML = '<div class="bagian"><h2>Tulisan tidak ditemukan</h2><p class="kosong">Tautan ini keliru atau tulisannya belum terbit.</p><a class="tombol tombol-hijau" href="#/tulisan" style="margin-top:12px">Lihat semua tulisan</a></div>'; return; }
  document.title = `${t.judul} · LBM MWCNU Tlanakan`;
  el.querySelector('#bentuk-kepala').textContent = t.bentuk;
  const oleh = t.penulis ? `${esc(t.penulis)}${t.ranting ? ', Ranting NU ' + esc(t.ranting) : ''}` : 'Penulis tanpa nama';

  isi.innerHTML = `
    <article class="bagian">
      <div class="tag-baris"><span class="tag">${esc(t.bentuk)}</span></div>
      <h1 class="judul-baca">${esc(t.judul)}</h1>
      <p class="meta">Oleh ${oleh} · Terbit ${esc(tanggalId(t.diterbitkan_pada))}</p>
      <div class="teks-baca" dir="auto">${paragraf(t.isi)}</div>
    </article>
    ${t.rujukan ? `<section class="bagian"><h2>Rujukan</h2><p class="sumber">${esc(t.rujukan).replace(/\n/g, '<br>')}</p></section>` : ''}
    <section class="bagian">
      <div class="dua-tombol">
        <button type="button" class="tombol tombol-garis" id="salin">${ikon('salin')} <span>Salin Tautan</span></button>
        <a class="tombol tombol-hijau" id="wa" target="_blank" rel="noopener" href="${esc(tautanWa(teksBagikanTulisan(t)))}">${ikon('wa')} Bagikan ke WA</a>
      </div>
    </section>
    <section class="bagian">
      <h2>Punya tulisan?</h2>
      ${masuk
        ? '<p class="kosong">Kirimkan khotbah, artikel, kolom, atau esai Anda. Tim Penyunting akan membantu merapikannya.</p><a class="tombol tombol-hijau" href="#/tulis" style="margin-top:12px">Kirim Tulisan</a>'
        : '<p class="kosong">Masuk sebagai warga untuk mengirim tulisan.</p><a class="tombol tombol-hijau" href="#/masuk" style="margin-top:12px">Masuk</a>'}
    </section>`;
  const tombolSalin = el.querySelector('#salin');
  tombolSalin.addEventListener('click', async () => {
    const ok = await salin(tautanTulisan(t.id));
    tombolSalin.querySelector('span').textContent = ok ? 'Tautan tersalin' : 'Salin manual dari alamat';
    setTimeout(() => { tombolSalin.querySelector('span').textContent = 'Salin Tautan'; }, 2200);
  });
}
