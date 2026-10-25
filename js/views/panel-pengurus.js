import { supa } from '../lib/supa.js';
import { pasangKartu } from '../lib/pasang.js';
import { layar, segeraHadir } from '../lib/kerangka.js';
import { bisaSetujui } from '../state.js';
import { esc, ikon, tanggalId } from '../lib/util.js';

const namaTipe = (t) => (t === 'pengurus_struktural' ? 'Pengurus Struktural' : 'Warga NU');
const ringkas = (t, n = 110) => { const s = String(t || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n).trimEnd() + '…' : s; };
const JABATAN = { ketua: 'Ketua', wakil_ketua: 'Wakil Ketua', sekretaris: 'Sekretaris', bendahara: 'Bendahara', anggota: 'Anggota' };

export function tampil(el, ctx) {
  const p = ctx.state.profil;
  const setujui = bisaSetujui(p);
  const tim = !!p.tim_penjawab;
  const isi = layar(el, p, {
    aktif: 'panel',
    kecil: 'Selamat datang,',
    judul: p.nama,
    isi: `
      <div id="pasang"></div>
      <div class="tiga-angka" aria-label="Ringkasan">
        <div><b id="st-warga">…</b><small>Warga aktif</small></div>
        <div><b id="st-menunggu">…</b><small>Menunggu persetujuan</small></div>
        <div><b id="st-tanya">${tim ? '…' : '–'}</b><small>Pertanyaan belum dijawab</small></div>
      </div>
      ${segeraHadir('Sesi Absen Bulanan', 'Pembukaan sesi, kode 6 digit, dan QR majelis menyusul pada tahap berikutnya.')}
      <section class="bagian">
        <div class="baris-judul"><h2>Menunggu Persetujuan</h2><span class="tag" id="lencana-menunggu">…</span></div>
        ${setujui ? '<div id="daftar-menunggu"><p class="kosong">Memuat…</p></div>' : '<p class="kosong">Persetujuan pendaftar dilakukan oleh Ketua, Wakil Ketua, Sekretaris, atau admin.</p>'}
      </section>
      ${tim ? `
      <section class="bagian">
        <div class="baris-judul"><h2>Antrean Pertanyaan</h2><a class="tautan-hijau" href="#/panel">Buka semua</a></div>
        <div id="antrean"><p class="kosong">Memuat…</p></div>
      </section>` : ''}
      <section class="bagian">
        <h2>Struktur Pengurus LBM</h2>
        <div id="struktur"><p class="kosong">Memuat…</p></div>
      </section>
      <section class="bagian">
        <div class="baris-judul"><h2>Warga per Ranting</h2><button type="button" class="tautan-hijau tautan-tombol" id="semua-ranting" hidden>Lihat 17 ranting</button></div>
        <div id="ranting"><p class="kosong">Memuat…</p></div>
        <p class="kosong">Partisipasi (absen, musyawarah, tulisan) per ranting menyusul pada tahap berikutnya.</p>
      </section>`
  });

  const bersihPasang = pasangKartu(isi.querySelector('#pasang'));
  const muatSemua = () => muatAngka(isi, tim);
  muatSemua();
  if (setujui) muatMenunggu(isi.querySelector('#daftar-menunggu'), muatSemua);
  if (tim) muatAntrean(isi.querySelector('#antrean'));
  muatStruktur(isi.querySelector('#struktur'));
  muatRanting(isi);
  return bersihPasang;
}

async function jumlah(q) {
  const { count, error } = await q;
  return error ? null : count;
}

async function muatAngka(isi, tim) {
  const hitung = (status, peran) => {
    let q = supa.from('profil').select('id', { count: 'exact', head: true }).eq('status', status);
    if (peran) q = q.eq('peran', peran);
    return jumlah(q);
  };
  const [warga, menunggu, tanya] = await Promise.all([
    hitung('aktif', 'warga'),
    hitung('menunggu'),
    tim ? jumlah(supa.from('pertanyaan').select('id', { count: 'exact', head: true }).neq('status', 'terjawab')) : Promise.resolve(null)
  ]);
  const tulis = (id, n) => { const e = isi.querySelector(id); if (e) e.textContent = n === null ? '–' : String(n); };
  tulis('#st-warga', warga);
  tulis('#st-menunggu', menunggu);
  if (tim) tulis('#st-tanya', tanya);
  const l = isi.querySelector('#lencana-menunggu');
  if (l) l.textContent = menunggu === null ? '–' : `${menunggu} pendaftar`;
}

async function muatMenunggu(kotak, sesudah) {
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
        <button type="button" class="tombol tombol-hijau tombol-kecil" data-aksi="setujui" aria-label="Setujui ${esc(r.nama)}">Setujui</button>
        <button type="button" class="tombol tombol-garis tombol-kecil" data-aksi="tolak" aria-label="Tolak ${esc(r.nama)}">Tolak</button>
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
      if (!kotak.querySelector('.baris')) kotak.innerHTML = '<p class="kosong">Tidak ada pendaftar yang menunggu.</p>';
    }
    sesudah();
  }));
}

async function muatAntrean(kotak) {
  const { data, error } = await supa
    .from('pertanyaan')
    .select('id,rubrik,isi,status,dibuat_pada,penangan:profil!ditangani_oleh(nama)')
    .neq('status', 'terjawab')
    .order('dibuat_pada', { ascending: true })
    .limit(5);
  if (error) { kotak.innerHTML = '<p class="galat">Antrean belum bisa dimuat. Coba lagi nanti.</p>'; return; }
  if (!data.length) { kotak.innerHTML = '<p class="kosong">Tidak ada pertanyaan yang menunggu.</p>'; return; }
  kotak.innerHTML = data.map((q) => `
    <a class="baris baris-atas baris-tautan" href="#/panel/jawab/${esc(q.id)}">
      <div class="teks">
        <span class="tag-baris"><span class="tag">${esc(q.rubrik)}</span><span class="status status-${esc(q.status)}">${q.status === 'ditelaah' ? 'Ditelaah' : 'Baru'}</span></span>
        <strong class="isi-ringkas">${esc(ringkas(q.isi))}</strong>
        <small>${q.penangan?.nama ? `Ditangani: ${esc(q.penangan.nama)}` : 'Belum ada penangan'} · diterima ${esc(tanggalId(q.dibuat_pada, true))}</small>
      </div>
    </a>`).join('');
}

async function muatStruktur(kotak) {
  const { data, error } = await supa
    .from('profil')
    .select('id,nama,wa,peran,jabatan_lbm,tim_penjawab,tim_penyunting')
    .eq('status', 'aktif')
    .in('peran', ['pengurus', 'admin'])
    .order('nama', { ascending: true });
  if (error) { kotak.innerHTML = '<p class="galat">Daftar pengurus belum bisa dimuat.</p>'; return; }
  if (!data.length) { kotak.innerHTML = '<p class="kosong">Belum ada pengurus aktif.</p>'; return; }
  const urutan = ['ketua', 'wakil_ketua', 'sekretaris', 'bendahara', 'anggota'];
  data.sort((a, b) => urutan.indexOf(a.jabatan_lbm) - urutan.indexOf(b.jabatan_lbm) || a.nama.localeCompare(b.nama, 'id'));
  kotak.innerHTML = data.map((r) => {
    const peran = [JABATAN[r.jabatan_lbm] || 'Pengurus', r.tim_penjawab ? 'Tim Penjawab' : '', r.tim_penyunting ? 'Tim Penyunting' : ''].filter(Boolean).join(' · ');
    return `<div class="baris">
      <div class="teks"><strong>${esc(r.nama)}</strong><small>${esc(peran)}</small></div>
      <a class="tombol tombol-garis tombol-kecil" style="color:var(--hijau-tengah)" href="https://wa.me/${esc(r.wa)}" aria-label="Hubungi ${esc(r.nama)} lewat WhatsApp">${ikon('wa')} WA</a>
    </div>`;
  }).join('');
}

async function muatRanting(isi) {
  const kotak = isi.querySelector('#ranting');
  const tombol = isi.querySelector('#semua-ranting');
  const [r, w] = await Promise.all([
    supa.from('ranting').select('id,nama').order('nama'),
    supa.from('profil').select('ranting_id').eq('status', 'aktif')
  ]);
  if (r.error || w.error) { kotak.innerHTML = '<p class="galat">Data ranting belum bisa dimuat.</p>'; return; }
  const n = new Map();
  for (const x of w.data) n.set(x.ranting_id, (n.get(x.ranting_id) || 0) + 1);
  const baris = r.data.map((x) => ({ nama: x.nama, n: n.get(x.id) || 0 })).sort((a, b) => b.n - a.n || a.nama.localeCompare(b.nama, 'id'));
  const maks = Math.max(1, ...baris.map((x) => x.n));
  let semua = false;
  const gambar = () => {
    const tampil = semua ? baris : baris.slice(0, 5);
    kotak.innerHTML = tampil.map((x) => `<div class="batang"><span>${esc(x.nama)}</span><i style="--w:${Math.round((x.n / maks) * 100)}%"></i><b>${x.n}</b></div>`).join('');
    tombol.textContent = semua ? 'Ringkas' : `Lihat ${baris.length} ranting`;
  };
  tombol.hidden = baris.length <= 5;
  tombol.addEventListener('click', () => { semua = !semua; gambar(); });
  gambar();
}
