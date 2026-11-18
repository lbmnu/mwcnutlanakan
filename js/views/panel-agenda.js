import { supa } from '../lib/supa.js';
import { pasangMenu } from '../lib/kerangka.js';
import { esc, ikon, pesanGalat, hariTanggal, hurufButir, hariIniWib, teksBagikanAgenda, tautanWa } from '../lib/util.js';
import { bisaAgenda } from '../state.js';

// Kelola agenda rutinan: pengumuman acara dan draf soal. Draf hanya terlihat pengelola.
export async function tampil(el, ctx) {
  el.innerHTML = `
  <div class="dalam-krem">
    <header class="bilah-hijau">
      <div class="salam"><small>Panel pengurus</small><strong id="judul-layar">Agenda Rutinan</strong></div>
      <a class="lencana" href="#/agenda">Lihat umum</a>
    </header>
    <main class="isi" id="isi"></main>
  </div>`;
  pasangMenu(el, ctx.state.profil, 'panel');
  const isi = el.querySelector('#isi');
  if (!bisaAgenda(ctx.state.profil)) {
    isi.innerHTML = '<div class="bagian"><h2>Khusus pengelola</h2><p class="kosong">Agenda dikelola oleh Ketua, Wakil Ketua, Sekretaris, admin, dan Tim Penjawab.</p><a class="tombol tombol-hijau" href="#/dasbor" style="margin-top:12px">Kembali</a></div>';
    return;
  }
  const judul = el.querySelector('#judul-layar');
  let daftar = [];

  async function muatDaftar() {
    isi.innerHTML = '<div class="bagian"><p class="kosong">Memuat…</p></div>';
    judul.textContent = 'Agenda Rutinan';
    const { data, error } = await supa.from('agenda_rutinan').select('*').order('tanggal', { ascending: false }).limit(60);
    if (!el.isConnected) return;
    if (error) { isi.innerHTML = '<p class="galat">Agenda belum bisa dimuat. Periksa koneksi lalu coba lagi.</p>'; return; }
    daftar = data;
    gambarDaftar();
  }

  function gambarDaftar() {
    const draf = daftar.filter((a) => a.status === 'draf');
    const terbit = daftar.filter((a) => a.status === 'terbit');
    const baris = (a) => `
      <div class="baris baris-atas" data-id="${esc(a.id)}">
        <div class="teks">
          <span class="tag-baris"><span class="status ${a.status === 'terbit' ? 'status-terjawab' : 'status-ditelaah'}">${a.status === 'terbit' ? 'Terbit' : 'Draf'}</span></span>
          <strong>${esc(a.judul)}</strong>
          <small>${esc(hariTanggal(a.tanggal))} · ${a.pertanyaan.length} butir soal</small>
          <small>${esc(a.tempat || 'Tempat belum diisi')}</small>
          <div class="aksi" style="flex-wrap:wrap;margin-top:8px">
            <button type="button" class="tombol tombol-garis tombol-kecil" style="color:var(--hijau-tengah)" data-aksi="sunting">Sunting</button>
            ${a.status === 'draf'
              ? '<button type="button" class="tombol tombol-hijau tombol-kecil" data-aksi="terbitkan">Terbitkan</button>'
              : `<button type="button" class="tombol tombol-garis tombol-kecil" style="color:var(--hijau-tengah)" data-aksi="tarik">Tarik ke draf</button>
                 <a class="tombol tombol-hijau tombol-kecil" target="_blank" rel="noopener" href="${esc(tautanWa(teksBagikanAgenda(a)))}">${ikon('wa')} Bagikan</a>`}
            ${a.status === 'draf' ? '<button type="button" class="tombol tombol-garis tombol-kecil" style="color:var(--bata)" data-aksi="hapus">Hapus</button>' : ''}
          </div>
        </div>
      </div>`;
    isi.innerHTML = `
      <button type="button" class="tombol tombol-hijau" id="baru">Agenda Baru</button>
      <p class="galat" id="pesan" role="alert" hidden></p>
      <section class="bagian"><h2>Draf (${draf.length})</h2>${draf.length ? draf.map(baris).join('') : '<p class="kosong">Tidak ada draf. Tulis draf soal lebih dulu, terbitkan bila sudah siap.</p>'}</section>
      <section class="bagian"><h2>Sudah terbit (${terbit.length})</h2>${terbit.length ? terbit.map(baris).join('') : '<p class="kosong">Belum ada agenda terbit.</p>'}</section>`;
    isi.querySelector('#baru').addEventListener('click', () => gambarForm(null));
    isi.querySelectorAll('[data-aksi]').forEach((b) => b.addEventListener('click', () => aksi(b)));
  }

  async function aksi(b) {
    const id = b.closest('[data-id]').dataset.id;
    const a = daftar.find((x) => x.id === id);
    const pesan = isi.querySelector('#pesan');
    pesan.hidden = true;
    const jenis = b.dataset.aksi;
    if (jenis === 'sunting') { gambarForm(a); return; }
    if (jenis === 'hapus' && !confirm(`Hapus draf "${a.judul}"? Tidak bisa dibatalkan.`)) return;
    if (jenis === 'tarik' && !confirm('Tarik agenda ini dari tampilan umum? Tautan yang sudah dibagikan tidak akan terbuka sampai diterbitkan lagi.')) return;
    isi.querySelectorAll('button').forEach((x) => (x.disabled = true));
    const { error } = jenis === 'hapus'
      ? await supa.rpc('hapus_agenda', { p_id: id })
      : await supa.rpc('atur_status_agenda', { p_id: id, p_status: jenis === 'terbitkan' ? 'terbit' : 'draf' });
    if (error) { isi.querySelectorAll('button').forEach((x) => (x.disabled = false)); pesan.textContent = pesanGalat(error); pesan.hidden = false; return; }
    muatDaftar();
  }

  function gambarForm(a) {
    judul.textContent = a ? 'Sunting Agenda' : 'Agenda Baru';
    const butir = a && a.pertanyaan.length ? [...a.pertanyaan] : [''];
    isi.innerHTML = `
      <form class="form" id="f" novalidate>
        <div class="kolom"><label for="tgl">Tanggal acara (Masehi)</label><input id="tgl" type="date" value="${esc(a?.tanggal || hariIniWib())}"></div>
        <div class="kolom"><label for="hij">Tanggal Hijriah</label><input id="hij" type="text" maxlength="60" autocomplete="off" placeholder="Mis. 05 Jumadal Akhir 1448 H" value="${esc(a?.hijriah || '')}"></div>
        <div class="kolom"><label for="wkt">Waktu (boleh dikosongkan)</label><input id="wkt" type="text" maxlength="60" autocomplete="off" placeholder="Mis. Ba’da Ashar, atau 13.30 WIB" value="${esc(a?.waktu || '')}"></div>
        <div class="kolom"><label for="tmp">Tempat</label><textarea id="tmp" rows="2" maxlength="250" placeholder="Nama tempat dan alamat">${esc(a?.tempat || '')}</textarea></div>
        <div class="kolom"><label for="jdl">Judul masalah</label><input id="jdl" type="text" maxlength="150" autocomplete="off" placeholder="Mis. Titipan Meresahkan" value="${esc(a?.judul || '')}"></div>
        <div class="kolom"><label for="dsk">Deskripsi masalah</label><textarea id="dsk" rows="9" maxlength="6000" placeholder="Tempel deskripsi masalah dari panitia. Baris kosong = paragraf baru.">${esc(a?.deskripsi || '')}</textarea></div>
        <div class="kolom"><label for="sail">Sā’il (penanya)</label><input id="sail" type="text" maxlength="150" autocomplete="off" placeholder="Mis. Panitia" value="${esc(a?.sail || '')}"></div>
        <div class="kolom"><label>Butir pertanyaan</label><div id="butir"></div>
          <button type="button" class="tombol tombol-garis tombol-kecil" id="tambah" style="color:var(--hijau-tengah);margin-top:8px">+ Tambah butir</button></div>
        <div class="kolom"><label for="cat">Catatan panitia (boleh dikosongkan)</label><textarea id="cat" rows="3" maxlength="1500" placeholder="Mis. Mohon membawa kitab rujukan">${esc(a?.catatan || '')}</textarea></div>
        <p id="pesan" class="galat" role="alert" hidden></p>
        <button class="tombol tombol-hijau" type="submit" id="simpan">Simpan${a?.status === 'terbit' ? ' perubahan' : ' draf'}</button>
        ${!a || a.status === 'draf' ? '<button class="tombol tombol-emas" type="button" id="simpan-terbit">Simpan dan Terbitkan</button>' : ''}
        <button class="tombol tombol-garis" type="button" id="batal" style="color:var(--hijau-tengah)">Batal</button>
      </form>`;
    const kotak = isi.querySelector('#butir');
    const gambarButir = () => {
      kotak.innerHTML = butir.map((t, i) => `
        <div class="butir-baris"><span class="huruf">${esc(hurufButir(i))}</span>
          <textarea rows="3" maxlength="1500" data-i="${i}" aria-label="Butir pertanyaan ${i + 1}" placeholder="Tulis pertanyaan">${esc(t)}</textarea>
          ${butir.length > 1 ? `<button type="button" class="tombol tombol-garis tombol-kecil" data-hapus="${i}" aria-label="Hapus butir ${i + 1}" style="color:var(--bata)">×</button>` : ''}
        </div>`).join('');
      kotak.querySelectorAll('textarea').forEach((t) => t.addEventListener('input', () => { butir[Number(t.dataset.i)] = t.value; }));
      kotak.querySelectorAll('[data-hapus]').forEach((x) => x.addEventListener('click', () => { butir.splice(Number(x.dataset.hapus), 1); gambarButir(); }));
    };
    gambarButir();
    isi.querySelector('#tambah').addEventListener('click', () => { if (butir.length >= 12) return; butir.push(''); gambarButir(); kotak.querySelector('.butir-baris:last-child textarea').focus(); });
    isi.querySelector('#batal').addEventListener('click', muatDaftar);

    const f = isi.querySelector('#f'); const pesan = isi.querySelector('#pesan');
    const q = (s) => isi.querySelector(s);
    async function simpan(terbitkan) {
      pesan.hidden = true;
      const tampilGalat = (t) => { pesan.textContent = t; pesan.hidden = false; };
      if (!q('#tgl').value) { tampilGalat('Isi tanggal acara.'); q('#tgl').focus(); return; }
      if (q('#jdl').value.trim().length < 3) { tampilGalat('Judul masalah terlalu pendek.'); q('#jdl').focus(); return; }
      if (terbitkan && !q('#tmp').value.trim()) { tampilGalat('Isi tempat acara sebelum menerbitkan.'); q('#tmp').focus(); return; }
      if (terbitkan && !butir.some((t) => t.trim())) { tampilGalat('Tulis minimal satu butir pertanyaan sebelum menerbitkan.'); return; }
      isi.querySelectorAll('button').forEach((x) => (x.disabled = true));
      let { data: id, error } = await supa.rpc('simpan_agenda', {
        p_id: a?.id || null, p_tanggal: q('#tgl').value, p_hijriah: q('#hij').value.trim(), p_waktu: q('#wkt').value.trim(),
        p_tempat: q('#tmp').value.trim(), p_judul: q('#jdl').value.trim(), p_deskripsi: q('#dsk').value.trim(),
        p_sail: q('#sail').value.trim(), p_pertanyaan: butir.map((t) => t.trim()).filter(Boolean), p_catatan: q('#cat').value.trim()
      });
      if (!error && terbitkan) ({ error } = await supa.rpc('atur_status_agenda', { p_id: id, p_status: 'terbit' }));
      if (error) { isi.querySelectorAll('button').forEach((x) => (x.disabled = false)); tampilGalat(pesanGalat(error)); return; }
      muatDaftar();
    }
    f.addEventListener('submit', (e) => { e.preventDefault(); simpan(false); });
    const st = isi.querySelector('#simpan-terbit');
    if (st) st.addEventListener('click', () => simpan(true));
  }

  muatDaftar();
}
