import { supa } from '../lib/supa.js';
import { esc, tanggalId, RUBRIK, JENIS } from '../lib/util.js';
import { pasangMenu } from '../lib/kerangka.js';

const ringkas = (t, n = 150) => { const s = String(t || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n).trimEnd() + '…' : s; };

export function tampil(el, ctx) {
  const masuk = !!ctx.state.session;
  const awal = new URLSearchParams(location.hash.split('?')[1] || '').get('r') || '';
  let rubrik = RUBRIK.includes(awal) ? awal : '';
  el.innerHTML = `
  <div class="dalam-krem">
    <header class="bilah-hijau">
      <div class="salam"><small>Terbuka untuk umum</small><strong>Jawaban LBM</strong></div>
      <a class="lencana" href="${masuk ? '#/dasbor' : '#/'}">${masuk ? 'Beranda' : 'Depan'}</a>
    </header>
    <main class="isi">
      <section class="bagian">
        <h2>Rubrik</h2>
        <div class="chips" role="group" aria-label="Pilih rubrik" id="rubrik">
          <button type="button" data-r="" aria-pressed="${rubrik === ''}">Semua</button>
          ${RUBRIK.map((r) => `<button type="button" data-r="${esc(r)}" aria-pressed="${r === rubrik}">${esc(r)}</button>`).join('')}
        </div>
      </section>
      <div id="hasil"><p class="kosong">Memuat…</p></div>
    </main>
  </div>`;

  const hasil = el.querySelector('#hasil');
  let nomor = 0;

  async function muat() {
    const saya = ++nomor;
    if (!ctx.siap) { hasil.innerHTML = `<p class="galat">${esc(ctx.alasanBelumSiap)}</p>`; return; }
    hasil.innerHTML = '<p class="kosong">Memuat…</p>';
    let q = supa.from('jawaban_publik').select('id,jenis,judul,rubrik,isi,diterbitkan_pada').order('diterbitkan_pada', { ascending: false }).limit(50);
    if (rubrik) q = q.eq('rubrik', rubrik);
    const { data, error } = await q;
    if (saya !== nomor) return; // pilihan rubrik sudah berganti
    if (error) { hasil.innerHTML = '<p class="galat">Jawaban belum bisa dimuat. Periksa koneksi lalu coba lagi.</p>'; return; }
    if (!data.length) { hasil.innerHTML = `<div class="bagian"><p class="kosong">${rubrik ? 'Belum ada jawaban terbit di rubrik ini.' : 'Belum ada jawaban yang terbit.'}</p></div>`; return; }
    hasil.innerHTML = data.map((j) => `
      <a class="kartu-tautan" href="#/jawaban/${esc(j.id)}">
        <span class="tag-baris"><span class="tag">${esc(j.rubrik)}</span><span class="tag tag-garis">${esc(JENIS[j.jenis] || '')}</span></span>
        <strong>${esc(j.judul)}</strong>
        <span class="ringkas">${esc(ringkas(j.isi))}</span>
        <small>Terbit ${esc(tanggalId(j.diterbitkan_pada))}</small>
      </a>`).join('');
  }

  el.querySelectorAll('#rubrik [data-r]').forEach((b) => b.addEventListener('click', () => {
    rubrik = b.dataset.r;
    el.querySelectorAll('#rubrik [data-r]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    muat();
  }));
  pasangMenu(el, ctx.state.profil, 'rubrik');
  muat();
}
