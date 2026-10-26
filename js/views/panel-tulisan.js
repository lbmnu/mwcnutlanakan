import { supa } from '../lib/supa.js';
import { adalahPenyunting } from '../state.js';
import { esc, tanggalId } from '../lib/util.js';

const KELOMPOK = {
  proses: ['dikirim', 'ditelaah', 'disetujui'],
  penulis: ['menunggu_penulis', 'dikembalikan'],
  terbit: ['terbit']
};
const LABEL = { dikirim: ['Baru', 'baru'], ditelaah: ['Sedang disunting', 'ditelaah'], disetujui: ['Disetujui penulis', 'terjawab'], menunggu_penulis: ['Menunggu penulis', 'lama'], dikembalikan: ['Dikembalikan', 'lama'], terbit: ['Terbit', 'terjawab'] };

// Antrean penyunting: naskah yang perlu dikerjakan, yang menunggu penulis, dan yang sudah terbit.
export async function tampil(el, ctx) {
  if (!adalahPenyunting(ctx.state.profil)) { ctx.pindah('/dasbor'); return; }
  el.innerHTML = `
  <div class="dalam-krem">
    <header class="bilah-hijau">
      <div class="salam"><small>Khusus Tim Penyunting</small><strong>Antrean Tulisan</strong></div>
      <a class="lencana" href="#/dasbor">Panel</a>
    </header>
    <main class="isi">
      <section class="bagian">
        <div class="tab" role="tablist" aria-label="Tahap tulisan">
          <button type="button" role="tab" data-t="proses" aria-selected="true">Perlu Disunting <b id="n-proses">0</b></button>
          <button type="button" role="tab" data-t="penulis" aria-selected="false">Di Penulis <b id="n-penulis">0</b></button>
          <button type="button" role="tab" data-t="terbit" aria-selected="false">Terbit <b id="n-terbit">0</b></button>
        </div>
      </section>
      <div id="hasil"><p class="kosong">Memuat…</p></div>
    </main>
  </div>`;
  const hasil = el.querySelector('#hasil'); let semua = []; let tab = 'proses';

  function gambar() {
    for (const k of Object.keys(KELOMPOK)) el.querySelector('#n-' + k).textContent = String(semua.filter((t) => KELOMPOK[k].includes(t.status)).length);
    const isi = semua.filter((t) => KELOMPOK[tab].includes(t.status));
    if (!isi.length) {
      hasil.innerHTML = `<div class="bagian"><p class="kosong">${{ proses: 'Tidak ada naskah yang menunggu.', penulis: 'Tidak ada naskah yang sedang di tangan penulis.', terbit: 'Belum ada tulisan yang terbit.' }[tab]}</p></div>`;
      return;
    }
    hasil.innerHTML = isi.map((t) => {
      const [label, kelas] = LABEL[t.status];
      return `
      <a class="kartu-tautan" href="#/panel/tulisan/${esc(t.id)}">
        <span class="tag-baris"><span class="tag">${esc(t.bentuk)}</span><span class="status status-${kelas}">${esc(label)}</span></span>
        <strong>${esc(t.judul)}</strong>
        <small>${esc(t.penulis?.nama || 'Penulis')}${t.penulis?.ranting?.nama ? ' · Ranting NU ' + esc(t.penulis.ranting.nama) : ''} · ${esc(tanggalId(t.dibuat_pada))}</small>
      </a>`;
    }).join('');
  }
  el.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => {
    tab = b.dataset.t;
    el.querySelectorAll('[data-t]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    gambar();
  }));

  const { data, error } = await supa.from('tulisan')
    .select('id,bentuk,judul,status,dibuat_pada,penulis:profil!penulis_id(nama,ranting(nama))')
    .order('dibuat_pada', { ascending: true }).limit(300);
  if (error) { hasil.innerHTML = '<p class="galat">Antrean belum bisa dimuat. Periksa koneksi lalu coba lagi.</p>'; return; }
  semua = data;
  gambar();
}
