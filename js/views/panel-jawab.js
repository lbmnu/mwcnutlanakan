import { supa } from '../lib/supa.js';
import { adalahAdmin } from '../state.js';
import { esc, ikon, pesanGalat, tanggalId, salin, tautanJawaban, teksBagikan, tautanWa, RUBRIK } from '../lib/util.js';

export async function tampil(el, ctx) {
  const saya = ctx.state.profil;
  if (!saya?.tim_penjawab) { ctx.pindah('/dasbor'); return; }
  const id = ctx.params.id;

  el.innerHTML = `
  <div class="dalam-krem">
    <header class="bilah-hijau">
      <div class="salam"><small>Khusus anggota Tim Penjawab</small><strong>Jawab Pertanyaan</strong></div>
      <a class="lencana" href="#/panel">Daftar</a>
    </header>
    <main class="isi" id="badan"><div class="bagian"><p class="kosong">Memuat…</p></div></main>
  </div>`;
  const badan = el.querySelector('#badan');

  const [rq, rj, rt] = await Promise.all([
    supa.from('pertanyaan')
      .select('id,rubrik,isi,status,alasan_tolak,dibuat_pada,penanya:profil!penanya_id(nama,wa,ranting(nama)),penangan:profil!ditangani_oleh(nama)')
      .eq('id', id).maybeSingle(),
    supa.from('jawaban').select('*').eq('pertanyaan_id', id).maybeSingle(),
    supa.from('profil').select('id,nama').eq('status', 'aktif').eq('tim_penjawab', true).neq('id', saya.id).order('nama')
  ]);
  if (rq.error || rj.error || rt.error) { badan.innerHTML = '<p class="galat">Pertanyaan belum bisa dimuat. Periksa koneksi lalu coba lagi.</p>'; return; }
  const q = rq.data;
  if (!q) { badan.innerHTML = '<div class="bagian"><h2>Pertanyaan tidak ditemukan</h2><a class="tombol tombol-hijau" href="#/panel" style="margin-top:12px">Kembali ke daftar</a></div>'; return; }
  let j = rj.data;
  const rekan = rt.data || [];
  const nama = (uid) => (uid === saya.id ? 'Anda' : rekan.find((r) => r.id === uid)?.nama || 'anggota Tim');

  function gambar() {
    if (q.status === 'ditolak') { gambarDitolak(); return; }
    const terbit = j?.status === 'terbit';
    const peninjau = j?.minta_tinjauan_id || '';
    const sayaPeninjau = peninjau === saya.id;
    const netral = j?.pertanyaan_netral || q.isi;

    badan.innerHTML = `
      <section class="bagian">
        <span class="tag-baris"><span class="tag">${esc(q.rubrik)}</span>${terbit ? '<span class="status status-terjawab">Terbit</span>' : j ? '<span class="status status-ditelaah">Draf</span>' : '<span class="status status-menunggu">Belum dijawab</span>'}</span>
        <h2 style="margin-top:10px">Pertanyaan asli</h2>
        <div class="teks-baca">${q.isi.split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join('')}</div>
        <p class="catatan" style="margin-top:8px">Dari ${esc(q.penanya?.nama || 'penanya')}${q.penanya?.ranting?.nama ? ', Ranting NU ' + esc(q.penanya.ranting.nama) : ''} · ${esc(tanggalId(q.dibuat_pada))}. Nama dan ranting hanya terlihat oleh Tim Penjawab dan tidak ikut terbit.</p>
      </section>

      <form class="form bagian" id="f" novalidate>
        <div class="kolom"><label for="netral">Pertanyaan (redaksi netral, tampil publik)</label>
          <textarea id="netral" rows="4" maxlength="2000">${esc(netral)}</textarea>
          <p class="petunjuk">Hapus nama, ranting, atau hal yang bisa mengenali penanya.</p></div>
        <div class="kolom"><span class="judul-kolom" id="lbl-jenis">Jenis jawaban</span>
          <div class="pilih-dua" role="group" aria-labelledby="lbl-jenis">
            <button type="button" data-jenis="jawaban_tim" aria-pressed="${(j?.jenis || 'jawaban_tim') === 'jawaban_tim'}">Jawaban Tim</button>
            <button type="button" data-jenis="hasil_musyawarah" aria-pressed="${j?.jenis === 'hasil_musyawarah'}">Hasil Musyawarah</button>
          </div></div>
        <div class="kolom"><label for="judul">Judul jawaban</label>
          <input id="judul" type="text" maxlength="200" value="${esc(j?.judul || '')}" placeholder="Contoh: Hukum jual beli dengan sistem pesan"></div>
        <div class="kolom"><label for="isi">Jawaban</label>
          <textarea id="isi" rows="10" maxlength="20000" placeholder="Tulis jawaban. Pisahkan paragraf dengan satu baris kosong.">${esc(j?.isi || '')}</textarea></div>
        <div class="kolom"><label for="arab">Dasar rujukan (ibarat kitab)</label>
          <textarea id="arab" class="isi-arab" rows="4" maxlength="5000" dir="rtl" lang="ar" placeholder="عبارة الكتاب">${esc(j?.rujukan_arab || '')}</textarea></div>
        <div class="kolom"><label for="sumber">Sumber rujukan</label>
          <input id="sumber" type="text" maxlength="500" value="${esc(j?.rujukan_sumber || '')}" placeholder="Nama kitab, juz, halaman"></div>

        ${terbit ? '' : `
        <div class="kolom"><label for="tinjau">Tinjauan anggota Tim lain (opsional)</label>
          <select id="tinjau"><option value="">Tanpa tinjauan, saya terbitkan sendiri</option>
            ${rekan.map((r) => `<option value="${esc(r.id)}"${r.id === peninjau ? ' selected' : ''}>${esc(r.nama)}</option>`).join('')}</select>
          <p class="petunjuk" id="info-tinjau">${peninjau && !sayaPeninjau ? `Menunggu tinjauan ${esc(nama(peninjau))}. Hanya beliau yang dapat menerbitkan.` : sayaPeninjau ? 'Anda diminta meninjau jawaban ini. Anda boleh menerbitkannya.' : 'Disarankan untuk Hasil Musyawarah.'}</p></div>`}

        <p id="pesan" class="galat" role="alert" hidden></p>
        <p id="sukses" class="sukses" role="status" hidden></p>
        <div class="dua-tombol">
          <button type="button" class="tombol tombol-garis" id="simpan">${terbit ? 'Simpan Perubahan' : 'Simpan Draf'}</button>
          ${terbit ? '' : `<button type="button" class="tombol tombol-hijau" id="terbit">${peninjau && !sayaPeninjau ? 'Simpan dan Minta Tinjauan' : 'Terbitkan'}</button>`}
        </div>
        ${terbit ? '' : '<p class="catatan">Setelah terbit, jawaban terbuka untuk umum dan tampil sebagai jawaban terbaru. Status di riwayat penanya berubah menjadi Terjawab.</p>'}
      </form>
      ${terbit ? panelBagikan() : ''}
      ${panelTindakan(terbit)}`;
    pasang();
    pasangTindakan();
  }

  function panelBagikan() {
    const tampung = { id: j.id, judul: j.judul, jenis: j.jenis };
    const teks = teksBagikan(tampung);
    const kabari = `Assalamu’alaikum Wr. Wb. Bapak/Ibu ${q.penanya?.nama || ''}, pertanyaan Anda telah dijawab Tim Penjawab LBM MWCNU Tlanakan. Jawabannya dapat dibaca di: ${tautanJawaban(j.id)}\n\nSemoga bermanfaat. Wassalamu’alaikum Wr. Wb.`;
    return `
      <section class="bagian">
        <h2>Bagikan ke WhatsApp</h2>
        <pre class="pratinjau-wa">${esc(teks)}</pre>
        <div class="dua-tombol">
          <button type="button" class="tombol tombol-garis" id="salin-teks">${ikon('salin')} <span>Salin Teks</span></button>
          <a class="tombol tombol-hijau" target="_blank" rel="noopener" href="${esc(tautanWa(teks))}">${ikon('wa')} Buka WhatsApp</a>
        </div>
        <p class="catatan" style="margin-top:8px">Tempel di satu grup atau channel WA warga (satu arah).</p>
      </section>
      <section class="bagian">
        <h2>Kabari penanya</h2>
        <p class="kosong">Membuka chat WhatsApp ke penanya dengan teks siap kirim.</p>
        ${q.penanya?.wa ? `<a class="tombol tombol-hijau" style="margin-top:12px" target="_blank" rel="noopener" href="${esc(tautanWa(kabari, q.penanya.wa))}">${ikon('wa')} Kirim WA</a>` : ''}
        <a class="tombol tombol-garis" style="margin-top:10px" href="#/jawaban/${esc(j.id)}">Lihat tampilan publik</a>
      </section>`;
  }

  function pasang() {
    const f = badan.querySelector('#f');
    const pesan = badan.querySelector('#pesan');
    const sukses = badan.querySelector('#sukses');
    let jenis = j?.jenis || 'jawaban_tim';
    const tampilGalat = (t) => { pesan.textContent = t; pesan.hidden = !t; sukses.hidden = true; };
    const tampilSukses = (t) => { sukses.textContent = t; sukses.hidden = false; pesan.hidden = true; };

    f.querySelectorAll('[data-jenis]').forEach((b) => b.addEventListener('click', () => {
      jenis = b.dataset.jenis;
      f.querySelectorAll('[data-jenis]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    }));

    const tinjau = f.querySelector('#tinjau');
    const tombolTerbit = f.querySelector('#terbit');
    if (tinjau && tombolTerbit) {
      tinjau.addEventListener('change', () => {
        tombolTerbit.textContent = tinjau.value ? 'Simpan dan Minta Tinjauan' : 'Terbitkan';
      });
    }

    async function simpan() {
      const p = {
        p_pertanyaan: id,
        p_jenis: jenis,
        p_judul: f.judul.value,
        p_netral: f.netral.value,
        p_isi: f.isi.value,
        p_arab: f.arab.value,
        p_sumber: f.sumber.value,
        p_tinjauan: tinjau && tinjau.value && tinjau.value !== saya.id ? tinjau.value : null
      };
      const { error } = await supa.rpc('simpan_jawaban', p);
      if (error) throw error;
      const { data } = await supa.from('jawaban').select('*').eq('pertanyaan_id', id).maybeSingle();
      j = data;
    }

    const kunci = (b) => f.querySelectorAll('button').forEach((x) => (x.disabled = b));

    f.querySelector('#simpan').addEventListener('click', async () => {
      kunci(true); tampilGalat('');
      try { await simpan(); gambar(); badan.querySelector('#sukses').textContent = 'Tersimpan.'; badan.querySelector('#sukses').hidden = false; }
      catch (e) { kunci(false); tampilGalat(pesanGalat(e)); }
    });

    if (tombolTerbit) tombolTerbit.addEventListener('click', async () => {
      kunci(true); tampilGalat('');
      try {
        await simpan();
        const minta = tinjau && tinjau.value;
        if (minta) { gambar(); badan.querySelector('#sukses').textContent = 'Draf tersimpan. Menunggu tinjauan anggota Tim yang dipilih.'; badan.querySelector('#sukses').hidden = false; return; }
        const { error } = await supa.rpc('terbitkan_jawaban', { p_pertanyaan: id });
        if (error) throw error;
        const { data } = await supa.from('jawaban').select('*').eq('pertanyaan_id', id).maybeSingle();
        j = data; q.status = 'terjawab';
        gambar(); window.scrollTo(0, 0);
        const s = badan.querySelector('#sukses'); if (s) { s.textContent = 'Jawaban terbit. Bagikan ke WhatsApp di bawah.'; s.hidden = false; }
      } catch (e) { kunci(false); tampilGalat(pesanGalat(e)); }
    });

    const salinTeks = badan.querySelector('#salin-teks');
    if (salinTeks) salinTeks.addEventListener('click', async () => {
      const ok = await salin(teksBagikan({ id: j.id, judul: j.judul, jenis: j.jenis }));
      salinTeks.querySelector('span').textContent = ok ? 'Teks tersalin' : 'Salin manual dari kotak';
      setTimeout(() => { salinTeks.querySelector('span').textContent = 'Salin Teks'; }, 2200);
    });
  }


  // ---------- Menolak, menurunkan, menghapus ----------
  function galatTindakan(t) { const g = badan.querySelector('#galat-tindakan'); if (g) { g.textContent = t; g.hidden = !t; } }

  function panelTindakan(terbit) {
    return `
      <section class="bagian" id="tindakan">
        <h2>Tindakan lain</h2>
        ${terbit
          ? '<p class="kosong">Menurunkan jawaban menyembunyikannya dari umum dan mengembalikannya menjadi draf.</p><button type="button" class="tombol tombol-garis" id="turunkan" style="color:var(--bata);margin-top:10px">Turunkan dari terbit</button>'
          : `<p class="kosong">Bila pertanyaan di luar arah LBM, tolak dengan alasan agar penanya tahu.</p>
             <div class="kolom" style="margin-top:10px"><label for="alasan">Alasan penolakan</label><input id="alasan" type="text" maxlength="500" autocomplete="off" placeholder="Mis. di luar lingkup bahtsul masail LBM"></div>
             <button type="button" class="tombol tombol-garis" id="tolak" style="color:var(--bata);margin-top:10px">Tolak Pertanyaan</button>`}
        ${adalahAdmin(saya) ? '<button type="button" class="tautan-tombol tautan-bata" id="hapus" style="margin-top:14px">Hapus permanen (khusus admin)</button>' : ''}
        <p class="galat" id="galat-tindakan" role="alert" hidden></p>
      </section>`;
  }

  function gambarDitolak() {
    badan.innerHTML = `
      <section class="bagian">
        <span class="tag-baris"><span class="tag">${esc(q.rubrik)}</span><span class="status status-lama">Ditolak</span></span>
        <h2 style="margin-top:10px">Pertanyaan</h2>
        <div class="teks-baca">${q.isi.split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join('')}</div>
        <p class="catatan" style="margin-top:8px">Dari ${esc(q.penanya?.nama || 'penanya')} · ${esc(tanggalId(q.dibuat_pada))}</p>
      </section>
      <section class="bagian" id="tindakan">
        <h2>Ditolak</h2>
        <div class="catatan-sunting"><b>Alasan yang dilihat penanya</b><p>${esc(q.alasan_tolak || '')}</p></div>
        <button type="button" class="tombol tombol-hijau" id="buka-kembali" style="margin-top:12px">Buka Kembali</button>
        ${adalahAdmin(saya) ? '<button type="button" class="tautan-tombol tautan-bata" id="hapus" style="margin-top:14px">Hapus permanen (khusus admin)</button>' : ''}
        <p class="galat" id="galat-tindakan" role="alert" hidden></p>
      </section>`;
    pasangTindakan();
  }

  async function muatJawabanLagi() {
    const { data } = await supa.from('jawaban').select('*').eq('pertanyaan_id', id).maybeSingle();
    j = data;
  }

  function pasangTindakan() {
    const ke = (s) => badan.querySelector(s);
    ke('#tolak')?.addEventListener('click', async () => {
      galatTindakan('');
      const alasan = ke('#alasan').value.trim();
      if (alasan.length < 3) { galatTindakan('Tulis alasan penolakan.'); return; }
      if (!confirm('Tolak pertanyaan ini? Draf jawaban (bila ada) ikut dihapus dan penanya melihat alasannya.')) return;
      const { error } = await supa.rpc('tolak_pertanyaan', { p_id: id, p_alasan: alasan });
      if (error) { galatTindakan(pesanGalat(error)); return; }
      q.status = 'ditolak'; q.alasan_tolak = alasan; j = null; gambar();
    });
    ke('#buka-kembali')?.addEventListener('click', async () => {
      galatTindakan('');
      const { error } = await supa.rpc('buka_kembali_pertanyaan', { p_id: id });
      if (error) { galatTindakan(pesanGalat(error)); return; }
      q.status = 'menunggu'; q.alasan_tolak = null; gambar();
    });
    ke('#turunkan')?.addEventListener('click', async () => {
      galatTindakan('');
      if (!confirm('Turunkan jawaban ini dari rubrik? Jawaban kembali menjadi draf.')) return;
      const { error } = await supa.rpc('turunkan_jawaban', { p_pertanyaan: id });
      if (error) { galatTindakan(pesanGalat(error)); return; }
      q.status = 'ditelaah'; await muatJawabanLagi(); gambar();
    });
    ke('#hapus')?.addEventListener('click', async () => {
      galatTindakan('');
      if (!confirm('Hapus PERMANEN pertanyaan ini beserta drafnya? Tindakan ini tidak bisa dibatalkan.')) return;
      const { error } = await supa.rpc('hapus_pertanyaan', { p_id: id });
      if (error) { galatTindakan(pesanGalat(error)); return; }
      ctx.pindah('/panel');
    });
  }

  gambar();
}
