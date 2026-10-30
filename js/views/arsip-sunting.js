import { supa } from '../lib/supa.js';
import { pasangMenu } from '../lib/kerangka.js';
import { bisaSetujui } from '../state.js';
import { esc, pesanGalat, hariIniWib, bulanTahun } from '../lib/util.js';
import { kecilkanFoto, BATAS_FOTO } from '../lib/foto.js';

// Buat arsip baru (#/panel/arsip) atau ubah arsip lama beserta fotonya (#/panel/arsip/<id>).
export async function tampil(el, ctx) {
  const saya = ctx.state.profil;
  if (!bisaSetujui(saya)) { ctx.pindah('/dasbor'); return; }
  const id = ctx.params?.id || '';
  el.innerHTML = `
  <div class="dalam-krem ada-menu">
    <header class="bilah-hijau">
      <div class="salam"><small>Khusus pengurus</small><strong>${id ? 'Ubah Arsip' : 'Arsip Baru'}</strong></div>
      <a class="lencana" href="${id ? '#/arsip/' + esc(id) : '#/arsip'}">${id ? 'Lihat' : 'Batal'}</a>
    </header>
    <main class="isi">
      <form class="form bagian" id="f" novalidate>
        <div class="kolom"><label for="judul">Judul</label><input id="judul" type="text" maxlength="120" autocomplete="off" placeholder="Mis. Rutinan Oktober 2026"></div>
        <div class="kolom"><label for="tanggal">Tanggal rutinan</label><input id="tanggal" type="date"></div>
        <div class="kolom"><label for="tempat">Tempat (boleh dikosongkan)</label><input id="tempat" type="text" maxlength="120" autocomplete="off" placeholder="Mis. Masjid Al-Hikmah, Ranting Ambat"></div>
        <div class="kolom"><label for="sesi">Rekap kehadiran dari sesi absen</label><select id="sesi"><option value="">Tanpa rekap kehadiran</option></select>
          <p class="petunjuk">Yang tampil hanya persentase hadir per ranting, tanpa nama.</p></div>
        <div class="kolom"><label for="ringkasan">Ringkasan acara (boleh dikosongkan)</label><textarea id="ringkasan" rows="7" maxlength="5000" placeholder="Pokok pembahasan, hasil musyawarah, pesan penting."></textarea></div>
        <p id="pesan" class="galat" role="alert" hidden></p>
        <button class="tombol tombol-hijau" type="submit" id="simpan">${id ? 'Simpan Perubahan' : 'Simpan, lalu Tambah Foto'}</button>
      </form>
      <section class="bagian" id="bag-foto" ${id ? '' : 'hidden'}>
        <h2>Foto <span id="n-foto"></span></h2>
        <p class="kosong">Maksimal ${BATAS_FOTO} foto. Foto dikecilkan otomatis di HP ini sebelum diunggah (sekitar 300 KB).</p>
        <div class="kisi-foto" id="kisi"></div>
        <label class="tombol tombol-garis" id="label-foto" style="color:var(--hijau-tengah);margin-top:10px" for="berkas">Pilih foto</label>
        <input id="berkas" type="file" accept="image/*" multiple class="sembunyi-berkas">
        <p id="status-foto" class="kosong" role="status" aria-live="polite"></p>
        <p id="galat-foto" class="galat" role="alert" hidden></p>
      </section>
    </main>
  </div>`;
  pasangMenu(el, saya, 'beranda');
  const q = (s) => el.querySelector(s);
  const f = q('#f'); const pesan = q('#pesan');
  const galat = (t) => { pesan.textContent = t; pesan.hidden = !t; };
  q('#tanggal').value = hariIniWib();

  // Pilihan sesi absen.
  const { data: sesi } = await supa.rpc('sesi_untuk_arsip');
  (sesi || []).forEach((s) => {
    const o = document.createElement('option');
    o.value = s.id; o.dataset.dipakai = s.sudah_diarsipkan ? '1' : '';
    o.textContent = `${bulanTahun(s.bulan)} · ${s.hadir} hadir${s.status === 'buka' ? ' (masih dibuka)' : ''}${s.sudah_diarsipkan ? ' · sudah punya arsip' : ''}`;
    q('#sesi').appendChild(o);
  });

  let fotoSaya = [];
  async function muatArsip() {
    const { data, error } = await supa.rpc('arsip_detail', { p_id: id });
    if (error || !data || !data[0]) { galat('Arsip belum bisa dimuat.'); return; }
    const a = data[0];
    q('#judul').value = a.judul; q('#tanggal').value = a.tanggal; q('#tempat').value = a.tempat; q('#ringkasan').value = a.ringkasan;
    if (a.sesi_id) q('#sesi').value = a.sesi_id;
    fotoSaya = a.foto; await gambarFoto();
  }
  async function gambarFoto() {
    q('#n-foto').textContent = `(${fotoSaya.length}/${BATAS_FOTO})`;
    const kisi = q('#kisi');
    if (!fotoSaya.length) { kisi.innerHTML = ''; }
    else {
      const { data: tanda } = await supa.storage.from('arsip').createSignedUrls(fotoSaya.map((x) => x.path), 3600);
      const peta = new Map((tanda || []).map((t) => [t.path, t.signedUrl]));
      kisi.innerHTML = fotoSaya.map((x, i) => `<div class="kotak-foto"><img src="${esc(peta.get(x.path) || '')}" alt="Foto ${i + 1}"><button type="button" class="hapus-foto" data-hapus="${esc(x.id)}" aria-label="Hapus foto ${i + 1}">×</button></div>`).join('');
    }
    q('#label-foto').hidden = fotoSaya.length >= BATAS_FOTO;
  }
  if (id) await muatArsip();

  f.addEventListener('submit', async (e) => {
    e.preventDefault(); galat('');
    const judul = q('#judul').value.trim();
    if (judul.length < 3) return galat('Judul arsip belum diisi.');
    if (!q('#tanggal').value) return galat('Tanggal rutinan belum diisi.');
    if (q('#sesi').selectedOptions[0]?.dataset.dipakai === '1' && q('#sesi').value && (!id)) return galat('Sesi absen ini sudah punya arsip. Pilih sesi lain atau ubah arsip yang ada.');
    const tombol = q('#simpan'); tombol.disabled = true;
    const { data, error } = await supa.rpc('simpan_arsip', { p_id: id || null, p_tanggal: q('#tanggal').value, p_judul: judul, p_tempat: q('#tempat').value.trim(), p_ringkasan: q('#ringkasan').value.trim(), p_sesi: q('#sesi').value || null });
    tombol.disabled = false;
    if (error || !data) return galat(error ? pesanGalat(error) : 'Belum berhasil menyimpan. Coba lagi.');
    if (!id) { ctx.pindah('/panel/arsip/' + data); return; }
    galat(''); q('#simpan').textContent = 'Tersimpan ✓'; setTimeout(() => { q('#simpan').textContent = 'Simpan Perubahan'; }, 1800);
  });

  const galatFoto = (t) => { const g = q('#galat-foto'); g.textContent = t; g.hidden = !t; };
  q('#berkas').addEventListener('change', async (e) => {
    const berkas = [...e.target.files]; e.target.value = ''; galatFoto('');
    if (!berkas.length) return;
    const sisa = BATAS_FOTO - fotoSaya.length;
    if (berkas.length > sisa) { galatFoto(`Hanya ${sisa} foto lagi yang muat. Foto pertama dipilih, sisanya dilewati.`); }
    let sukses = 0;
    for (const [i, b] of berkas.slice(0, Math.max(0, sisa)).entries()) {
      q('#status-foto').textContent = `Mengecilkan dan mengunggah foto ${i + 1} dari ${Math.min(berkas.length, sisa)}…`;
      try {
        const jpg = await kecilkanFoto(b);
        const path = `${id}/${crypto.randomUUID()}.jpg`;
        const { error: eu } = await supa.storage.from('arsip').upload(path, jpg, { contentType: 'image/jpeg', upsert: false });
        if (eu) throw new Error('Unggah gagal. Periksa koneksi lalu coba lagi.');
        const { data: fid, error: ec } = await supa.rpc('tambah_foto_arsip', { p_arsip: id, p_path: path, p_ukuran: jpg.size, p_keterangan: '' });
        if (ec) { await supa.storage.from('arsip').remove([path]); throw new Error(pesanGalat(ec)); }
        fotoSaya.push({ id: fid, path, keterangan: '' }); sukses++;
      } catch (err) { galatFoto(err.message || 'Foto belum berhasil diunggah.'); break; }
    }
    q('#status-foto').textContent = sukses ? `${sukses} foto tersimpan.` : '';
    await gambarFoto();
  });

  q('#kisi').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-hapus]'); if (!b) return;
    if (!confirm('Hapus foto ini?')) return;
    b.disabled = true;
    const { data: path, error } = await supa.rpc('hapus_foto_arsip', { p_id: b.dataset.hapus });
    if (error) { b.disabled = false; galatFoto(pesanGalat(error)); return; }
    if (path) await supa.storage.from('arsip').remove([path]);
    fotoSaya = fotoSaya.filter((x) => x.id !== b.dataset.hapus); await gambarFoto();
  });
}
