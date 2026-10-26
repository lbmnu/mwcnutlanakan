import { supa } from '../lib/supa.js';
import { pasangMenu } from '../lib/kerangka.js';
import { esc, pesanGalat, BENTUK_TULISAN } from '../lib/util.js';

// Kirim tulisan baru, atau merevisi tulisan yang dikembalikan (#/tulis?id=...).
export async function tampil(el, ctx) {
  const idRevisi = new URLSearchParams(location.hash.split('?')[1] || '').get('id') || '';
  el.innerHTML = `
  <div class="dalam-krem">
    <header class="bilah-hijau">
      <div class="salam"><small>Redaksi LBM</small><strong id="judul-layar">Kirim Tulisan</strong></div>
      <a class="lencana" href="#/tulisan-saya">Tulisan Saya</a>
    </header>
    <main class="isi">
      <section class="bagian" id="catatan-penyunting" hidden></section>
      <form class="form" id="f" novalidate>
        <div class="kolom"><label for="bentuk">Bentuk tulisan</label>
          <select id="bentuk">${BENTUK_TULISAN.map((b) => `<option>${esc(b)}</option>`).join('')}</select></div>
        <div class="kolom"><label for="judul">Judul</label>
          <input id="judul" type="text" maxlength="150" autocomplete="off" placeholder="Judul tulisan Anda"></div>
        <div class="kolom"><label for="isi">Isi tulisan</label>
          <textarea id="isi" rows="14" maxlength="20000" placeholder="Tulis naskah di sini. Pisahkan paragraf dengan satu baris kosong. Kutipan Arab boleh ditulis langsung."></textarea>
          <p class="petunjuk"><span id="hitung">0</span> dari 20.000 huruf (minimal 100).</p></div>
        <div class="kolom"><label for="rujukan">Rujukan kitab (boleh dikosongkan)</label>
          <textarea id="rujukan" rows="3" maxlength="1500" placeholder="Mis. Ihya’ Ulumiddin juz 2 hlm. 200; Fathul Qarib bab shalat"></textarea></div>
        <label class="centang"><input type="checkbox" id="nama" checked> <span>Cantumkan nama dan ranting saya sebagai penulis</span></label>
        <p id="pesan" class="galat" role="alert" hidden></p>
        <button class="tombol tombol-hijau" type="submit" id="kirim">Kirim ke Penyunting</button>
      </form>
      <section class="bagian">
        <h2>Apresiasi untuk Karya Anda</h2>
        <p class="kosong">Setiap tulisan dihargai. Tim Penyunting hanya merapikan bahasa dan menyelaraskan rujukan dengan kitab-kitab mu’tabarah Ahlussunnah wal Jama’ah, dengan menjaga isi gagasan Anda. Bila ada perubahan yang menyentuh makna, Anda diminta menyetujuinya lebih dulu. Naskah asli Anda tidak pernah ditimpa.</p>
      </section>
    </main>
  </div>`;
  pasangMenu(el, ctx.state.profil, 'beranda');

  const f = el.querySelector('#f'); const pesan = el.querySelector('#pesan'); const tombol = el.querySelector('#kirim');
  const q = (s) => el.querySelector(s);
  q('#isi').addEventListener('input', () => { q('#hitung').textContent = Number(q('#isi').value.length).toLocaleString('id-ID'); });

  if (idRevisi) {
    q('#judul-layar').textContent = 'Revisi Tulisan';
    tombol.textContent = 'Kirim Ulang ke Penyunting';
    const { data: t, error } = await supa.from('tulisan').select('*').eq('id', idRevisi).eq('penulis_id', ctx.state.profil.id).maybeSingle();
    if (error || !t || !['dikirim', 'dikembalikan'].includes(t.status)) {
      el.querySelector('main.isi').innerHTML = '<div class="bagian"><h2>Tulisan tidak bisa diubah</h2><p class="kosong">Tulisan ini tidak ditemukan atau sedang diproses penyunting.</p><a class="tombol tombol-hijau" href="#/tulisan-saya" style="margin-top:12px">Tulisan Saya</a></div>';
      return;
    }
    q('#bentuk').value = t.bentuk; q('#judul').value = t.judul; q('#isi').value = t.isi; q('#rujukan').value = t.rujukan; q('#nama').checked = t.tampil_nama;
    q('#hitung').textContent = Number(t.isi.length).toLocaleString('id-ID');
    if (t.catatan_penyunting && t.status === 'dikembalikan') {
      const c = q('#catatan-penyunting'); c.hidden = false;
      c.innerHTML = `<h2>Catatan penyunting</h2><p class="kosong">${esc(t.catatan_penyunting)}</p>`;
    }
  }

  f.addEventListener('submit', async (e) => {
    e.preventDefault(); pesan.hidden = true;
    const judul = q('#judul').value.trim(); const isi = q('#isi').value.trim();
    if (judul.length < 5) { pesan.textContent = 'Judul terlalu pendek. Tulis minimal 5 huruf.'; pesan.hidden = false; q('#judul').focus(); return; }
    if (isi.length < 100) { pesan.textContent = 'Isi tulisan terlalu pendek. Tulis minimal 100 huruf.'; pesan.hidden = false; q('#isi').focus(); return; }
    tombol.disabled = true; const label = tombol.textContent; tombol.textContent = 'Mengirim…';
    const arg = { p_bentuk: q('#bentuk').value, p_judul: judul, p_isi: isi, p_rujukan: q('#rujukan').value.trim(), p_tampil_nama: q('#nama').checked };
    const { error } = idRevisi ? await supa.rpc('revisi_tulisan', { p_id: idRevisi, ...arg }) : await supa.rpc('kirim_tulisan', arg);
    tombol.disabled = false; tombol.textContent = label;
    if (error) { pesan.textContent = pesanGalat(error); pesan.hidden = false; return; }
    ctx.pindah('/tulisan-saya');
  });
}
