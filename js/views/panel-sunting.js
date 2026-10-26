import { supa } from '../lib/supa.js';
import { adalahPenyunting, adalahAdmin } from '../state.js';
import { esc, ikon, pesanGalat, tanggalId, paragraf, tautanTulisan, teksBagikanTulisan, tautanWa, salin } from '../lib/util.js';

const LABEL = { dikirim: 'Baru masuk', ditelaah: 'Sedang disunting', disetujui: 'Disetujui penulis', menunggu_penulis: 'Menunggu persetujuan penulis', dikembalikan: 'Dikembalikan ke penulis', ditolak: 'Ditolak', terbit: 'Terbit' };

export async function tampil(el, ctx) {
  const saya = ctx.state.profil;
  if (!adalahPenyunting(saya)) { ctx.pindah('/dasbor'); return; }
  const id = ctx.params.id;
  el.innerHTML = `
  <div class="dalam-krem">
    <header class="bilah-hijau">
      <div class="salam"><small>Khusus Tim Penyunting</small><strong>Sunting Tulisan</strong></div>
      <a class="lencana" href="#/panel/tulisan">Antrean</a>
    </header>
    <main class="isi" id="badan"><div class="bagian"><p class="kosong">Memuat…</p></div></main>
  </div>`;
  const badan = el.querySelector('#badan');

  async function muat() {
    const { data: t, error } = await supa.from('tulisan').select('*, penulis:profil!penulis_id(nama,wa,ranting(nama))').eq('id', id).maybeSingle();
    if (error) { badan.innerHTML = '<p class="galat">Naskah belum bisa dimuat. Periksa koneksi lalu coba lagi.</p>'; return; }
    if (!t) { badan.innerHTML = '<div class="bagian"><h2>Naskah tidak ditemukan</h2><a class="tombol tombol-hijau" href="#/panel/tulisan" style="margin-top:12px">Kembali ke antrean</a></div>'; return; }
    gambar(t);
  }

  function gambar(t) {
    const terkunci = ['menunggu_penulis', 'dikembalikan', 'ditolak', 'terbit'].includes(t.status);
    const dasarJudul = t.judul_sunting ?? t.judul; const dasarIsi = t.isi_sunting ?? t.isi; const dasarRujukan = t.rujukan_sunting ?? t.rujukan;
    const oleh = `${t.penulis?.nama || 'Penulis'}${t.penulis?.ranting?.nama ? ', Ranting NU ' + t.penulis.ranting.nama : ''}`;
    const waPenulis = t.penulis?.wa ? `https://wa.me/${esc(t.penulis.wa)}` : '';
    badan.innerHTML = `
      <section class="bagian">
        <span class="tag-baris"><span class="tag">${esc(t.bentuk)}</span><span class="status status-${t.status === 'terbit' ? 'terjawab' : t.status === 'menunggu_penulis' || t.status === 'dikembalikan' || t.status === 'ditolak' ? 'lama' : 'ditelaah'}">${esc(LABEL[t.status])}</span></span>
        <h2 style="margin-top:10px">${esc(t.judul)}</h2>
        <p class="catatan">Oleh ${esc(oleh)} · ${esc(tanggalId(t.dibuat_pada))} · ${t.tampil_nama ? 'nama dicantumkan' : 'ingin tanpa nama'}${waPenulis ? ` · <a class="tautan-hijau" target="_blank" rel="noopener" href="${waPenulis}">WA penulis</a>` : ''}</p>
        ${t.catatan_penulis ? `<div class="catatan-sunting"><b>Catatan penulis atas suntingan</b><p>${esc(t.catatan_penulis)}</p></div>` : ''}
        <details class="banding"><summary>Naskah asli penulis</summary>
          <p class="judul-mini">${esc(t.judul)}</p><div class="teks-baca" dir="auto">${paragraf(t.isi)}</div>
          ${t.rujukan ? `<p class="sumber">Rujukan: ${esc(t.rujukan)}</p>` : ''}
        </details>
      </section>
      ${terkunci ? `
      <section class="bagian">
        <h2>${{ terbit: 'Sudah terbit', menunggu_penulis: 'Menunggu persetujuan penulis', ditolak: 'Naskah ditolak' }[t.status] || 'Dikembalikan ke penulis'}</h2>
        ${t.catatan_penyunting ? `<div class="catatan-sunting"><b>${t.status === 'ditolak' ? 'Alasan penolakan (dilihat penulis)' : 'Catatan Anda'}</b><p>${esc(t.catatan_penyunting)}</p></div>` : ''}
        <p class="kosong">${t.status === 'ditolak' ? 'Naskah ini tidak akan terbit. Penulis melihat alasannya di Tulisan Saya.' : t.status === 'terbit' ? 'Tulisan ini terbuka untuk umum.' : t.status === 'menunggu_penulis' ? 'Suntingan yang menyentuh makna menunggu persetujuan penulis. Anda bisa menghubungi penulis lewat WA.' : 'Penulis akan merevisi naskahnya, lalu naskah masuk antrean lagi.'}</p>
        ${t.status === 'ditolak' ? '<button type="button" class="tombol tombol-hijau" id="buka-kembali" style="margin-top:12px">Buka Kembali ke Antrean</button><p class="galat" id="galat" role="alert" hidden></p>' : ''}
        ${t.status === 'terbit' ? `
          <div class="dua-tombol" style="margin-top:12px">
            <a class="tombol tombol-hijau" target="_blank" rel="noopener" href="${esc(tautanWa(teksBagikanTulisan({ id: t.id, judul: t.judul_sunting ?? t.judul, penulis: t.tampil_nama ? t.penulis?.nama : '' })))}">${ikon('wa')} Bagikan ke WA</a>
            <a class="tombol tombol-garis" style="color:var(--hijau-tengah)" href="#/tulisan/${esc(t.id)}">Lihat tampilan publik</a>
          </div>
          <button type="button" class="tautan-tombol tautan-bata" id="turunkan" style="margin-top:12px">Turunkan dari terbit</button>
          <p class="galat" id="galat" role="alert" hidden></p>` : ''}
      </section>` : `
      <form class="form bagian" id="f" novalidate>
        <h2>Suntingan Anda</h2>
        <div class="kolom"><label for="judul">Judul</label><input id="judul" type="text" maxlength="150" value="${esc(dasarJudul)}"></div>
        <div class="kolom"><label for="isi">Isi tulisan</label><textarea id="isi" rows="14" maxlength="20000">${esc(dasarIsi)}</textarea></div>
        <div class="kolom"><label for="rujukan">Rujukan kitab</label><textarea id="rujukan" rows="3" maxlength="1500">${esc(dasarRujukan)}</textarea></div>
        <label class="centang"><input type="checkbox" id="makna"${t.sentuh_makna ? ' checked' : ''}> <span>Perubahan ini menyentuh makna, minta persetujuan penulis</span></label>
        <div class="kolom"><label for="catatan">Catatan untuk penulis</label><textarea id="catatan" rows="3" maxlength="1000" placeholder="Wajib bila naskah dikembalikan atau ditolak. Boleh dikosongkan saat menyimpan.">${esc(t.catatan_penyunting)}</textarea></div>
        <p class="galat" id="galat" role="alert" hidden></p>
        <p class="sukses" id="info" role="status" hidden></p>
        <button class="tombol tombol-hijau" type="button" id="terbit">Terbitkan</button>
        <div class="dua-tombol">
          <button class="tombol tombol-garis" type="button" id="simpan" style="color:var(--hijau-tengah)">Simpan Suntingan</button>
          <button class="tombol tombol-garis" type="button" id="kembali" style="color:var(--bata)">Kembalikan ke Penulis</button>
        </div>
        <button class="tombol tombol-garis" type="button" id="tolak" style="color:var(--bata)">Tolak Naskah (tidak sesuai arah LBM)</button>
        <p class="petunjuk-kas">Bila hanya merapikan bahasa, biarkan kotak “menyentuh makna” kosong. Bila Anda mengubah isi gagasan atau hukum, centang kotak itu agar penulis menyetujui lebih dulu.</p>
      </form>`}
      ${adalahAdmin(saya) && t.status !== 'terbit' ? '<section class="bagian"><button type="button" class="tautan-tombol tautan-bata" id="hapus">Hapus permanen (khusus admin)</button><p class="galat" id="galat-hapus" role="alert" hidden></p></section>' : ''}`;

    badan.querySelector('#hapus')?.addEventListener('click', async () => {
      if (!confirm('Hapus PERMANEN naskah ini? Tindakan ini tidak bisa dibatalkan.')) return;
      const { error } = await supa.rpc('hapus_tulisan', { p_id: id });
      if (error) { const g = badan.querySelector('#galat-hapus'); g.textContent = pesanGalat(error); g.hidden = false; return; }
      ctx.pindah('/panel/tulisan');
    });
    badan.querySelector('#buka-kembali')?.addEventListener('click', async () => {
      const { error } = await supa.rpc('buka_kembali_tulisan', { p_id: id });
      if (error) { const g = badan.querySelector('#galat'); g.textContent = pesanGalat(error); g.hidden = false; return; }
      muat();
    });

    if (t.status === 'terbit') {
      badan.querySelector('#turunkan')?.addEventListener('click', async () => {
        if (!confirm('Turunkan tulisan ini dari rubrik Tulisan? Tulisan kembali ke tahap disunting.')) return;
        const { error } = await supa.rpc('turunkan_tulisan', { p_id: id });
        if (error) { const g = badan.querySelector('#galat'); g.textContent = pesanGalat(error); g.hidden = false; return; }
        muat();
      });
      return;
    }
    if (terkunci) return;

    const q = (s) => badan.querySelector(s);
    const galat = q('#galat'); const info = q('#info');
    const tampilGalat = (m) => { galat.textContent = m; galat.hidden = false; info.hidden = true; };
    const kosongkan = () => { galat.hidden = true; info.hidden = true; };
    const nilai = () => ({ judul: q('#judul').value.trim(), isi: q('#isi').value.trim(), rujukan: q('#rujukan').value.trim() });
    const berubah = () => { const n = nilai(); return n.judul !== dasarJudul.trim() || n.isi !== dasarIsi.trim() || n.rujukan !== dasarRujukan.trim(); };
    const tombol = ['#terbit', '#simpan', '#kembali', '#tolak'].map((s) => q(s));
    const kunci = (v) => tombol.forEach((b) => { b.disabled = v; });

    async function simpan() {
      const n = nilai();
      if (n.judul.length < 5) { tampilGalat('Judul terlalu pendek (minimal 5 huruf).'); return false; }
      if (n.isi.length < 100) { tampilGalat('Isi tulisan terlalu pendek (minimal 100 huruf).'); return false; }
      const { error } = await supa.rpc('sunting_tulisan', { p_id: id, p_judul: n.judul, p_isi: n.isi, p_rujukan: n.rujukan, p_catatan: q('#catatan').value.trim(), p_sentuh_makna: q('#makna').checked });
      if (error) { tampilGalat(pesanGalat(error)); return false; }
      return true;
    }

    q('#simpan').addEventListener('click', async () => {
      kosongkan(); kunci(true);
      const ok = await simpan(); kunci(false);
      if (ok) muat();
    });
    q('#kembali').addEventListener('click', async () => {
      kosongkan();
      if (q('#catatan').value.trim().length < 3) { tampilGalat('Isi catatan untuk penulis agar tahu yang perlu diperbaiki.'); return; }
      kunci(true);
      const { error } = await supa.rpc('kembalikan_tulisan', { p_id: id, p_catatan: q('#catatan').value.trim() });
      kunci(false);
      if (error) { tampilGalat(pesanGalat(error)); return; }
      muat();
    });
    q('#tolak').addEventListener('click', async () => {
      kosongkan();
      if (q('#catatan').value.trim().length < 3) { tampilGalat('Isi alasan penolakan di kotak catatan. Penulis akan membacanya.'); return; }
      if (!confirm('Tolak naskah ini? Penulis melihat alasannya dan naskah tidak akan terbit.')) return;
      kunci(true);
      const { error } = await supa.rpc('tolak_tulisan', { p_id: id, p_alasan: q('#catatan').value.trim() });
      kunci(false);
      if (error) { tampilGalat(pesanGalat(error)); return; }
      muat();
    });
    q('#terbit').addEventListener('click', async () => {
      kosongkan(); kunci(true);
      // Simpan dulu bila ada perubahan, atau bila kotak "menyentuh makna" berubah.
      if (berubah() || q('#makna').checked !== !!t.sentuh_makna) {
        if (!(await simpan())) { kunci(false); return; }
        if (q('#makna').checked && t.penulis_id !== saya.id) { kunci(false); muat(); return; } // menunggu persetujuan penulis
      }
      const { error } = await supa.rpc('terbitkan_tulisan', { p_id: id });
      kunci(false);
      if (error) { tampilGalat(pesanGalat(error)); return; }
      muat();
    });
  }
  muat();
}
