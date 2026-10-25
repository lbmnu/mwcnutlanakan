import { supa } from '../lib/supa.js';
import { esc, ikon, paragraf, tanggalId, JENIS, salin, tautanJawaban, teksBagikan, tautanWa } from '../lib/util.js';

export async function tampil(el, ctx) {
  const masuk = !!ctx.state.session;
  const kerangka = (isi, judulKecil = 'Terbuka untuk umum') => `
  <div class="dalam-krem">
    <header class="bilah-hijau">
      <div class="salam"><small>${esc(judulKecil)}</small><strong id="rubrik-kepala">Jawaban LBM</strong></div>
      <a class="lencana" href="#/jawaban">Semua jawaban</a>
    </header>
    <main class="isi">${isi}</main>
  </div>`;

  el.innerHTML = kerangka('<div class="bagian"><p class="kosong">Memuat…</p></div>');
  const isi = () => el.querySelector('main.isi');

  if (!ctx.siap) { isi().innerHTML = `<p class="galat">${esc(ctx.alasanBelumSiap)}</p>`; return; }
  const { data: j, error } = await supa.from('jawaban_publik').select('*').eq('id', ctx.params.id).maybeSingle();
  if (error) { isi().innerHTML = '<p class="galat">Jawaban belum bisa dimuat. Periksa koneksi lalu coba lagi.</p>'; return; }
  if (!j) { isi().innerHTML = '<div class="bagian"><h2>Jawaban tidak ditemukan</h2><p class="kosong">Tautan ini keliru atau jawabannya belum terbit.</p><a class="tombol tombol-hijau" href="#/jawaban" style="margin-top:12px">Lihat semua jawaban</a></div>'; return; }

  document.title = `${j.judul} · LBM MWCNU Tlanakan`;
  el.querySelector('#rubrik-kepala').textContent = j.rubrik;

  const rujukan = (j.rujukan_arab || j.rujukan_sumber) ? `
    <section class="bagian">
      <h2>Dasar rujukan (ibarat kitab)</h2>
      ${j.rujukan_arab ? `<p class="arab" lang="ar" dir="rtl">${esc(j.rujukan_arab).replace(/\n/g, '<br>')}</p>` : ''}
      ${j.rujukan_sumber ? `<p class="sumber">${esc(j.rujukan_sumber)}</p>` : ''}
    </section>` : '';

  isi().innerHTML = `
    <article class="bagian">
      <div class="tag-baris"><span class="tag">${esc(j.rubrik)}</span><span class="tag tag-garis">${esc(JENIS[j.jenis] || '')}</span></div>
      <h1 class="judul-baca">${esc(j.judul)}</h1>
      <p class="meta">Terbit ${esc(tanggalId(j.diterbitkan_pada))} · Tim Penjawab LBM MWCNU Tlanakan</p>
    </article>
    <section class="bagian"><h2>Pertanyaan</h2><div class="teks-baca">${paragraf(j.pertanyaan)}</div></section>
    <section class="bagian"><h2>Jawaban</h2><div class="teks-baca">${paragraf(j.isi)}</div></section>
    ${rujukan}
    <section class="bagian">
      <div class="dua-tombol">
        <button type="button" class="tombol tombol-garis" id="salin">${ikon('salin')} <span>Salin Tautan</span></button>
        <a class="tombol tombol-hijau" id="wa" target="_blank" rel="noopener" href="${esc(tautanWa(teksBagikan(j)))}">${ikon('wa')} Bagikan ke WA</a>
      </div>
    </section>
    <section class="bagian">
      <h2>Punya pertanyaan?</h2>
      ${masuk
        ? '<p class="kosong">Kirimkan pertanyaan Anda kepada Tim Penjawab. Nama Anda tidak ikut terbit.</p><a class="tombol tombol-hijau" href="#/tanya" style="margin-top:12px">Kirim Pertanyaan</a>'
        : '<p class="kosong">Masuk sebagai warga untuk bertanya.</p><a class="tombol tombol-hijau" href="#/masuk" style="margin-top:12px">Masuk</a>'}
    </section>`;

  const tombolSalin = el.querySelector('#salin');
  tombolSalin.addEventListener('click', async () => {
    const ok = await salin(tautanJawaban(j.id));
    tombolSalin.querySelector('span').textContent = ok ? 'Tautan tersalin' : 'Salin manual dari alamat';
    setTimeout(() => { tombolSalin.querySelector('span').textContent = 'Salin Tautan'; }, 2200);
  });
}
