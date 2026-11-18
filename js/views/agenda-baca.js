import { supa } from '../lib/supa.js';
import { pasangMenu } from '../lib/kerangka.js';
import { esc, ikon, paragraf, hariTanggal, hurufButir, salin, tautanAgenda, teksBagikanAgenda, tautanWa } from '../lib/util.js';
import { bisaAgenda } from '../state.js';

// Satu agenda rutinan: waktu, tempat, deskripsi masalah, dan butir pertanyaan. Terbuka untuk umum.
export async function tampil(el, ctx) {
  el.innerHTML = `
  <div class="dalam-krem">
    <header class="bilah-hijau">
      <div class="salam"><small>Terbuka untuk umum</small><strong>Agenda Rutinan</strong></div>
      <a class="lencana" href="#/agenda">Semua agenda</a>
    </header>
    <main class="isi"><div class="bagian"><p class="kosong">Memuat…</p></div></main>
  </div>`;
  pasangMenu(el, ctx.state.profil, 'beranda');
  const isi = () => el.querySelector('main.isi');
  if (!ctx.siap) { isi().innerHTML = `<p class="galat">${esc(ctx.alasanBelumSiap)}</p>`; return; }

  const { data: a, error } = await supa.from('agenda_publik').select('*').eq('id', ctx.params.id).maybeSingle();
  if (!el.isConnected) return;
  if (error) { isi().innerHTML = '<p class="galat">Agenda belum bisa dimuat. Periksa koneksi lalu coba lagi.</p>'; return; }
  if (!a) { isi().innerHTML = '<div class="bagian"><h2>Agenda tidak ditemukan</h2><p class="kosong">Tautan ini keliru atau agendanya belum diumumkan.</p><a class="tombol tombol-hijau" href="#/agenda" style="margin-top:12px">Lihat semua agenda</a></div>'; return; }

  document.title = `${a.judul} · LBM MWCNU Tlanakan`;
  const info = [
    ['Hari/Tanggal', `${hariTanggal(a.tanggal)}${a.hijriah ? ` · ${a.hijriah}` : ''}`],
    a.waktu ? ['Waktu', a.waktu] : null,
    ['Tempat', a.tempat],
    a.sail ? ['Sā’il (penanya)', a.sail] : null
  ].filter(Boolean);

  isi().innerHTML = `
    <article class="bagian">
      <div class="tag-baris"><span class="tag">Bahtsul Masail</span></div>
      <h1 class="judul-baca">${esc(a.judul)}</h1>
      <dl class="info-acara">${info.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    </article>
    ${a.deskripsi ? `<section class="bagian"><h2>Deskripsi masalah</h2><div class="teks-baca">${paragraf(a.deskripsi)}</div></section>` : ''}
    <section class="bagian">
      <h2>Pertanyaan</h2>
      <ol class="soal">${a.pertanyaan.map((q, i) => `<li><span class="huruf">${esc(hurufButir(i))}</span><span>${esc(q)}</span></li>`).join('')}</ol>
    </section>
    ${a.catatan ? `<section class="bagian"><h2>Catatan panitia</h2><div class="teks-baca">${paragraf(a.catatan)}</div></section>` : ''}
    <section class="bagian">
      <div class="dua-tombol">
        <button type="button" class="tombol tombol-garis" id="salin">${ikon('salin')} <span>Salin Tautan</span></button>
        <a class="tombol tombol-hijau" target="_blank" rel="noopener" href="${esc(tautanWa(teksBagikanAgenda(a)))}">${ikon('wa')} Bagikan ke WA</a>
      </div>
      ${bisaAgenda(ctx.state.profil) ? '<a class="tombol tombol-garis" style="color:var(--hijau-tengah);margin-top:10px" href="#/panel/agenda">Kelola agenda</a>' : ''}
    </section>`;

  const tombol = el.querySelector('#salin');
  tombol.addEventListener('click', async () => {
    const ok = await salin(tautanAgenda(a.id));
    tombol.querySelector('span').textContent = ok ? 'Tautan tersalin' : 'Salin manual dari alamat';
    setTimeout(() => { tombol.querySelector('span').textContent = 'Salin Tautan'; }, 2200);
  });
}
