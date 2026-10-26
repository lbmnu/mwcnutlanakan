import { supa } from '../lib/supa.js';
import { pasangMenu } from '../lib/kerangka.js';
import { esc, pesanGalat, tanggalId, paragraf, STATUS_TULISAN } from '../lib/util.js';

// Daftar tulisan milik sendiri, lengkap dengan statusnya dan tanggapan atas suntingan.
export async function tampil(el, ctx) {
  el.innerHTML = `
  <div class="dalam-krem">
    <header class="bilah-hijau">
      <div class="salam"><small>Redaksi LBM</small><strong>Tulisan Saya</strong></div>
      <a class="lencana" href="#/tulis">Tulis baru</a>
    </header>
    <main class="isi"><div id="daftar"><p class="kosong">Memuat…</p></div></main>
  </div>`;
  pasangMenu(el, ctx.state.profil, 'beranda');
  const daftar = el.querySelector('#daftar');

  async function muat() {
    const { data, error } = await supa.from('tulisan').select('*').eq('penulis_id', ctx.state.profil.id).order('dibuat_pada', { ascending: false });
    if (error) { daftar.innerHTML = '<p class="galat">Tulisan belum bisa dimuat. Periksa koneksi lalu coba lagi.</p>'; return; }
    if (!data.length) { daftar.innerHTML = '<div class="bagian"><p class="kosong">Belum ada tulisan. Khotbah, artikel, kolom, atau esai Anda akan tampil di sini beserta statusnya.</p><a class="tombol tombol-hijau" href="#/tulis" style="margin-top:12px">Tulis Sekarang</a></div>'; return; }
    daftar.innerHTML = data.map(kartu).join('');
  }

  function kartu(t) {
    const [label, kelas] = STATUS_TULISAN[t.status] || [t.status, 'menunggu'];
    let aksi = '';
    let tambahan = '';
    if (t.status === 'terbit') aksi = `<a class="tautan-hijau" href="#/tulisan/${esc(t.id)}">Baca di rubrik Tulisan</a>`;
    if (t.status === 'dikirim' && t.catatan_penulis) tambahan = `<p class="catatan">Catatan Anda atas suntingan: ${esc(t.catatan_penulis)}</p>`;
    if (t.status === 'dikembalikan') {
      tambahan = `<div class="catatan-sunting"><b>Catatan penyunting</b><p>${esc(t.catatan_penyunting)}</p></div>`;
      aksi = `<a class="tombol tombol-hijau tombol-kecil" href="#/tulis?id=${esc(t.id)}">Perbaiki dan kirim ulang</a>`;
    }
    if (t.status === 'ditolak') tambahan = `<div class="catatan-sunting"><b>Mohon maaf, naskah ini belum dapat diterbitkan</b><p>${esc(t.catatan_penyunting)}</p></div>`;
    if (t.status === 'dikirim') aksi = `<a class="tautan-hijau" href="#/tulis?id=${esc(t.id)}">Ubah naskah</a>`;
    if (t.status === 'menunggu_penulis') {
      tambahan = `
        <div class="catatan-sunting"><b>Penyunting mengubah bagian yang menyentuh makna</b>${t.catatan_penyunting ? `<p>${esc(t.catatan_penyunting)}</p>` : ''}</div>
        <details class="banding"><summary>Lihat naskah Anda dan suntingannya</summary>
          <div class="dua-versi">
            <div><h3>Naskah Anda</h3><p class="judul-mini">${esc(t.judul)}</p><div class="teks-baca">${paragraf(t.isi)}</div></div>
            <div><h3>Suntingan</h3><p class="judul-mini">${esc(t.judul_sunting)}</p><div class="teks-baca">${paragraf(t.isi_sunting)}</div></div>
          </div></details>
        <div class="kolom"><label for="c-${esc(t.id)}">Catatan bila tidak setuju</label><input id="c-${esc(t.id)}" type="text" maxlength="1000" autocomplete="off" placeholder="Mis. makna paragraf 2 berubah"></div>
        <p class="galat" role="alert" hidden></p>
        <div class="baris-tombol"><button type="button" class="tombol tombol-hijau tombol-kecil" data-setuju="${esc(t.id)}">Setuju</button><button type="button" class="tombol tombol-garis tombol-kecil" data-tolak="${esc(t.id)}">Tidak setuju</button></div>`;
    }
    const bisaTarik = t.status !== 'terbit' && t.status !== 'menunggu_penulis';
    return `
      <section class="bagian kartu-tulisan-saya" data-id="${esc(t.id)}">
        <span class="tag-baris"><span class="tag">${esc(t.bentuk)}</span><span class="status status-${esc(kelas)}">${esc(label)}</span></span>
        <strong class="isi-ringkas">${esc(t.judul)}</strong>
        <small>Dikirim ${esc(tanggalId(t.dibuat_pada))}</small>
        ${tambahan}
        <div class="baris-tombol" style="margin-top:6px">${aksi}${bisaTarik ? `<button type="button" class="tautan-tombol tautan-bata" data-tarik="${esc(t.id)}">${t.status === 'ditolak' ? 'Hapus dari riwayat' : 'Tarik naskah'}</button>` : ''}</div>
        <p class="galat gl" role="alert" hidden></p>
      </section>`;
  }

  daftar.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const kotak = b.closest('.kartu-tulisan-saya'); const galat = kotak.querySelector('.galat');
    galat.hidden = true;
    if (b.dataset.tarik) {
      if (!confirm('Tarik naskah ini? Naskah akan dihapus dari antrean penyunting.')) return;
      const { error } = await supa.rpc('tarik_tulisan', { p_id: b.dataset.tarik });
      if (error) { galat.textContent = pesanGalat(error); galat.hidden = false; return; }
      muat();
    } else if (b.dataset.setuju || b.dataset.tolak) {
      const id = b.dataset.setuju || b.dataset.tolak; const setuju = !!b.dataset.setuju;
      const catatan = kotak.querySelector('input')?.value.trim() || '';
      if (!setuju && catatan.length < 3) { galat.textContent = 'Tulis catatan singkat bila tidak setuju.'; galat.hidden = false; return; }
      b.disabled = true;
      const { error } = await supa.rpc('tanggapi_sunting', { p_id: id, p_setuju: setuju, p_catatan: catatan });
      b.disabled = false;
      if (error) { galat.textContent = pesanGalat(error); galat.hidden = false; return; }
      muat();
    }
  });
  muat();
}
