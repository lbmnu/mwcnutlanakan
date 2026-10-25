import { supa } from '../lib/supa.js';
import { bisaSetujui, labelPeran } from '../state.js';
import { pasangKartu } from '../lib/pasang.js';
import { esc, ikon, tanggalId } from '../lib/util.js';
import { jawabanTerbaru } from '../lib/data.js';

const namaTipe = (t) => (t === 'pengurus_struktural' ? 'Pengurus Struktural' : 'Warga NU');

export function tampil(el, ctx) {
  const p = ctx.state.profil;
  const setujui = bisaSetujui(p);
  el.innerHTML = `
  <div class="dalam-krem">
    <header class="bilah-hijau">
      <div class="salam"><small>Assalamu’alaikum,</small><strong>${esc(p.nama)}</strong></div>
      <span class="lencana">${esc(labelPeran(p))}</span>
    </header>
    <main class="isi">
      <div id="pasang"></div>
      ${setujui ? `
      <section class="bagian" aria-labelledby="h-menunggu">
        <h2 id="h-menunggu">Pendaftar menunggu</h2>
        <div class="garis"></div>
        <div id="daftar-menunggu"><p class="kosong">Memuat…</p></div>
      </section>` : ''}
      ${p.tim_penjawab ? `
      <section class="bagian" aria-labelledby="h-tanya-warga">
        <h2 id="h-tanya-warga">Pertanyaan Warga</h2>
        <p class="kosong" id="hitung-tanya">Memuat…</p>
        <a class="tombol tombol-hijau" href="#/panel" style="margin-top:12px">Buka Daftar Pertanyaan</a>
      </section>` : ''}
      <section class="bagian" aria-labelledby="h-terbaru">
        <h2 id="h-terbaru">Jawaban Terbaru</h2>
        <div id="terbaru"><p class="kosong">Memuat…</p></div>
        <a class="tautan-hijau" href="#/jawaban" style="display:inline-block;margin-top:10px">Lihat semua jawaban</a>
      </section>
      <section class="bagian" aria-labelledby="h-kirim">
        <h2 id="h-kirim">Kirim Pertanyaan</h2>
        <p class="kosong">Jawaban terbit tanpa menyebut nama Anda. Pantau statusnya di Riwayat Pertanyaan.</p>
        <a class="tombol tombol-hijau" href="#/tanya" style="margin-top:12px">Tanya Fikih</a>
      </section>
      <section class="bagian">
        <h2>Segera hadir</h2>
        <p class="kosong">Absen majelis, laporan kas, dan kiriman tulisan akan muncul di sini pada tahap berikutnya.</p>
      </section>
      <div style="flex:1"></div>
      <button type="button" class="tombol tombol-garis" id="keluar">Keluar</button>
    </main>
  </div>`;

  const bersihPasang = pasangKartu(el.querySelector('#pasang'));
  el.querySelector('#keluar').addEventListener('click', async () => { await supa.auth.signOut(); location.hash = '#/'; ctx.segarkan(); });

  if (setujui) muatMenunggu(el.querySelector('#daftar-menunggu'));
  muatTerbaru(el.querySelector('#terbaru'));
  if (p.tim_penjawab) muatHitungTanya(el.querySelector('#hitung-tanya'));
  return bersihPasang;
}

async function muatMenunggu(kotak) {
  const { data, error } = await supa
    .from('profil')
    .select('id,nama,wa,tipe,lembaga,jabatan_lembaga,dibuat_pada,ranting(nama)')
    .eq('status', 'menunggu')
    .order('dibuat_pada', { ascending: true });
  if (error) { kotak.innerHTML = '<p class="galat">Daftar belum bisa dimuat. Coba lagi nanti.</p>'; return; }
  if (!data.length) { kotak.innerHTML = '<p class="kosong">Tidak ada pendaftar yang menunggu.</p>'; return; }

  kotak.innerHTML = data.map((r) => {
    const rincian = [r.ranting?.nama ? `Ranting NU ${r.ranting.nama}` : '', namaTipe(r.tipe), r.tipe === 'pengurus_struktural' ? [r.lembaga, r.jabatan_lembaga].filter(Boolean).join(', ') : ''].filter(Boolean).join(' · ');
    const pesan = encodeURIComponent(`Assalamu’alaikum Wr. Wb. Bapak/Ibu ${r.nama}, pendaftaran Anda di website LBM MWCNU Tlanakan sudah kami setujui. Silakan masuk dengan nomor WhatsApp ini. Wassalamu’alaikum Wr. Wb.`);
    return `<div class="baris" data-id="${esc(r.id)}">
      <div class="teks"><strong>${esc(r.nama)}</strong><small>${esc(rincian)}</small><small>+${esc(r.wa)}</small></div>
      <div class="aksi">
        <button type="button" class="tombol tombol-hijau tombol-kecil" data-aksi="setujui">Setujui</button>
        <button type="button" class="tombol tombol-garis tombol-kecil" data-aksi="tolak">Tolak</button>
      </div>
      <a hidden class="kabari" href="https://wa.me/${esc(r.wa)}?text=${pesan}"></a>
    </div>`;
  }).join('');

  kotak.querySelectorAll('[data-aksi]').forEach((b) => b.addEventListener('click', async () => {
    const baris = b.closest('.baris');
    const aksi = b.dataset.aksi;
    if (aksi === 'tolak' && !confirm('Tolak pendaftaran ini?')) return;
    baris.querySelectorAll('button').forEach((x) => (x.disabled = true));
    const { error: e } = await supa.rpc(aksi === 'setujui' ? 'setujui_pendaftar' : 'tolak_pendaftar', { p_id: baris.dataset.id });
    if (e) { baris.querySelectorAll('button').forEach((x) => (x.disabled = false)); alert('Belum berhasil. Coba lagi.'); return; }
    if (aksi === 'setujui') {
      baris.innerHTML = `<div class="teks"><strong>Disetujui</strong><small>Kabari warga agar bisa masuk.</small></div><div class="aksi"><a class="tombol tombol-hijau tombol-kecil" href="${baris.querySelector('.kabari')?.href || '#'}">${ikon('wa')} Kabari</a></div>`;
    } else {
      baris.remove();
    }
  }));
}

async function muatTerbaru(kotak) {
  const [j] = await jawabanTerbaru(1);
  if (!j) { kotak.innerHTML = '<p class="kosong">Belum ada jawaban yang terbit.</p>'; return; }
  kotak.innerHTML = `<a class="kartu-tautan kartu-datar" href="#/jawaban/${esc(j.id)}">
    <strong>${esc(j.judul)}</strong>
    <small>${esc(j.rubrik)} · ${esc(tanggalId(j.diterbitkan_pada, true))}</small>
  </a>`;
}

async function muatHitungTanya(kotak) {
  const { count, error } = await supa.from('pertanyaan').select('id', { count: 'exact', head: true }).neq('status', 'terjawab');
  kotak.textContent = error ? 'Jumlah belum bisa dimuat.' : count === 0 ? 'Tidak ada pertanyaan yang menunggu.' : `${count} pertanyaan belum terjawab.`;
}
