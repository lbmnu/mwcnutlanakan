import { supa } from '../lib/supa.js';
import { pasangMenu } from '../lib/kerangka.js';
import { esc, tanggalId, BENTUK_TULISAN } from '../lib/util.js';

const ringkas = (t, n = 150) => { const s = String(t || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n).trimEnd() + '…' : s; };

export function tampil(el, ctx) {
  const masuk = !!ctx.state.session;
  let bentuk = '';
  if (masuk) { location.replace('#/pustaka?t=tulisan'); return; }
  el.innerHTML = `
  <div class="dalam-krem">
    <header class="bilah-hijau">
      <div class="salam"><small>Terbuka untuk umum</small><strong>Tulisan Warga</strong></div>
      <a class="lencana" href="${masuk ? '#/dasbor' : '#/'}">${masuk ? 'Beranda' : 'Depan'}</a>
    </header>
    <main class="isi">
      <section class="bagian">
        <h2>Bentuk</h2>
        <div class="chips" role="group" aria-label="Pilih bentuk tulisan" id="bentuk">
          <button type="button" data-b="" aria-pressed="true">Semua</button>
          ${BENTUK_TULISAN.map((b) => `<button type="button" data-b="${esc(b)}" aria-pressed="false">${esc(b)}</button>`).join('')}
        </div>
        ${masuk ? '<a class="tombol tombol-hijau" href="#/tulis" style="margin-top:12px">Kirim Tulisan Anda</a>' : ''}
      </section>
      <div id="hasil"><p class="kosong">Memuat…</p></div>
    </main>
  </div>`;
  const hasil = el.querySelector('#hasil'); let nomor = 0;

  async function muat() {
    const saya = ++nomor;
    if (!ctx.siap) { hasil.innerHTML = `<p class="galat">${esc(ctx.alasanBelumSiap)}</p>`; return; }
    hasil.innerHTML = '<p class="kosong">Memuat…</p>';
    let q = supa.from('tulisan_publik').select('id,bentuk,judul,isi,penulis,ranting,diterbitkan_pada').order('diterbitkan_pada', { ascending: false }).limit(50);
    if (bentuk) q = q.eq('bentuk', bentuk);
    const { data, error } = await q;
    if (saya !== nomor) return;
    if (error) { hasil.innerHTML = '<p class="galat">Tulisan belum bisa dimuat. Periksa koneksi lalu coba lagi.</p>'; return; }
    if (!data.length) { hasil.innerHTML = `<div class="bagian"><p class="kosong">${bentuk ? 'Belum ada tulisan terbit pada bentuk ini.' : 'Belum ada tulisan yang terbit.'}</p></div>`; return; }
    hasil.innerHTML = data.map((t) => `
      <a class="kartu-tautan" href="#/tulisan/${esc(t.id)}">
        <span class="tag-baris"><span class="tag">${esc(t.bentuk)}</span></span>
        <strong>${esc(t.judul)}</strong>
        <span class="ringkas">${esc(ringkas(t.isi))}</span>
        <small>${t.penulis ? `${esc(t.penulis)}${t.ranting ? ' · Ranting NU ' + esc(t.ranting) : ''} · ` : ''}Terbit ${esc(tanggalId(t.diterbitkan_pada))}</small>
      </a>`).join('');
  }
  el.querySelectorAll('#bentuk [data-b]').forEach((b) => b.addEventListener('click', () => {
    bentuk = b.dataset.b;
    el.querySelectorAll('#bentuk [data-b]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    muat();
  }));
  pasangMenu(el, ctx.state.profil, 'rubrik');
  muat();
}
