import { supa } from '../lib/supa.js';
import { layar } from '../lib/kerangka.js';
import { esc, tanggalId, RUBRIK, JENIS, BENTUK_TULISAN } from '../lib/util.js';

const ringkas = (t, n = 150) => { const s = String(t || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n).trimEnd() + '…' : s; };

// Pustaka: tempat membaca semua yang sudah terbit, dua tab (Jawaban LBM, Tulisan Warga).
// Alamat: #/pustaka?t=jawaban|tulisan&r=<rubrik atau bentuk>
export function tampil(el, ctx) {
  const query = new URLSearchParams(location.hash.split('?')[1] || '');
  let tab = query.get('t') === 'tulisan' ? 'tulisan' : 'jawaban';
  let pilih = query.get('r') || '';
  const isi = layar(el, ctx.state.profil, {
    aktif: 'rubrik',
    kecil: 'Telaah dan baca',
    judul: 'Pustaka',
    peran: false,
    isi: `
      <section class="bagian">
        <div class="tab" role="tablist" aria-label="Isi Pustaka" id="tab">
          <button type="button" role="tab" data-t="jawaban">Jawaban LBM</button>
          <button type="button" role="tab" data-t="tulisan">Tulisan Warga</button>
        </div>
        <div class="chips" role="group" id="chips" aria-label="Penyaring"></div>
      </section>
      <div id="hasil"><p class="kosong">Memuat…</p></div>
      <section class="bagian" id="ajakan"></section>`
  });
  const q = (s) => isi.querySelector(s);
  let nomor = 0;

  function gambarKepala() {
    isi.querySelectorAll('#tab [data-t]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.t === tab)));
    const daftar = tab === 'jawaban' ? RUBRIK : BENTUK_TULISAN;
    if (!daftar.includes(pilih)) pilih = '';
    q('#chips').innerHTML = `<button type="button" data-r="" aria-pressed="${pilih === ''}">Semua</button>` +
      daftar.map((r) => `<button type="button" data-r="${esc(r)}" aria-pressed="${r === pilih}">${esc(r)}</button>`).join('');
    q('#ajakan').innerHTML = tab === 'jawaban'
      ? '<h2>Punya pertanyaan?</h2><p class="kosong">Kirim ke Tim Penjawab. Nama Anda tidak ikut terbit.</p><a class="tombol tombol-hijau" href="#/tanya" style="margin-top:12px">Kirim Pertanyaan</a>'
      : '<h2>Punya tulisan?</h2><p class="kosong">Khotbah, kajian, artikel, kolom, atau esai. Tim Penyunting membantu merapikannya.</p><a class="tombol tombol-hijau" href="#/tulis" style="margin-top:12px">Kirim Tulisan</a>';
  }

  async function muat() {
    const saya = ++nomor; const hasil = q('#hasil');
    hasil.innerHTML = '<p class="kosong">Memuat…</p>';
    if (!ctx.siap) { hasil.innerHTML = `<p class="galat">${esc(ctx.alasanBelumSiap)}</p>`; return; }
    let kueri;
    if (tab === 'jawaban') {
      kueri = supa.from('jawaban_publik').select('id,jenis,judul,rubrik,isi,diterbitkan_pada').order('diterbitkan_pada', { ascending: false }).limit(50);
      if (pilih) kueri = kueri.eq('rubrik', pilih);
    } else {
      kueri = supa.from('tulisan_publik').select('id,bentuk,judul,isi,penulis,ranting,diterbitkan_pada').order('diterbitkan_pada', { ascending: false }).limit(50);
      if (pilih) kueri = kueri.eq('bentuk', pilih);
    }
    const { data, error } = await kueri;
    if (saya !== nomor) return;
    if (error) { hasil.innerHTML = '<p class="galat">Belum bisa dimuat. Periksa koneksi lalu coba lagi.</p>'; return; }
    if (!data.length) { hasil.innerHTML = `<div class="bagian"><p class="kosong">${pilih ? 'Belum ada yang terbit pada pilihan ini.' : tab === 'jawaban' ? 'Belum ada jawaban yang terbit.' : 'Belum ada tulisan yang terbit.'}</p></div>`; return; }
    hasil.innerHTML = tab === 'jawaban'
      ? data.map((j) => `
        <a class="kartu-tautan" href="#/jawaban/${esc(j.id)}">
          <span class="tag-baris"><span class="tag">${esc(j.rubrik)}</span><span class="tag tag-garis">${esc(JENIS[j.jenis] || '')}</span></span>
          <strong>${esc(j.judul)}</strong>
          <span class="ringkas">${esc(ringkas(j.isi))}</span>
          <small>Terbit ${esc(tanggalId(j.diterbitkan_pada))}</small>
        </a>`).join('')
      : data.map((t) => `
        <a class="kartu-tautan" href="#/tulisan/${esc(t.id)}">
          <span class="tag-baris"><span class="tag">${esc(t.bentuk)}</span></span>
          <strong>${esc(t.judul)}</strong>
          <span class="ringkas">${esc(ringkas(t.isi))}</span>
          <small>${t.penulis ? `${esc(t.penulis)}${t.ranting ? ' · Ranting NU ' + esc(t.ranting) : ''} · ` : ''}Terbit ${esc(tanggalId(t.diterbitkan_pada))}</small>
        </a>`).join('');
  }

  isi.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.t) { tab = b.dataset.t; pilih = ''; }
    else if (b.dataset.r !== undefined) pilih = b.dataset.r;
    else return;
    gambarKepala(); muat();
  });
  gambarKepala(); muat();
}
