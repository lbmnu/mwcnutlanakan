import { supa } from '../lib/supa.js';
import { esc, tanggalId, STATUS_TANYA } from '../lib/util.js';

const ringkas = (t, n = 150) => { const s = String(t || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n).trimEnd() + '…' : s; };
const HARI = 86400000;

export async function tampil(el, ctx) {
  const saya = ctx.state.profil;
  if (!saya?.tim_penjawab) { ctx.pindah('/dasbor'); return; }

  el.innerHTML = `
  <div class="dalam-krem">
    <header class="bilah-hijau">
      <div class="salam"><small>Khusus Tim Penjawab</small><strong>Pertanyaan Warga</strong></div>
      <a class="lencana" href="#/dasbor">Dasbor</a>
    </header>
    <main class="isi">
      <section class="bagian">
        <div class="tab" role="tablist" aria-label="Status pertanyaan" id="tab">
          <button type="button" role="tab" data-t="belum" aria-selected="true">Belum Dijawab <b id="n-belum">0</b></button>
          <button type="button" role="tab" data-t="draf" aria-selected="false">Draf <b id="n-draf">0</b></button>
          <button type="button" role="tab" data-t="terbit" aria-selected="false">Terbit <b id="n-terbit">0</b></button>
        </div>
      </section>
      <div id="hasil"><p class="kosong">Memuat…</p></div>
    </main>
  </div>`;

  const hasil = el.querySelector('#hasil');
  let semua = { belum: [], draf: [], terbit: [] };
  let tab = 'belum';

  function gambarDaftar() {
    const isi = semua[tab];
    if (!isi.length) {
      const t = { belum: 'Tidak ada pertanyaan yang menunggu.', draf: 'Belum ada draf jawaban.', terbit: 'Belum ada jawaban yang terbit.' }[tab];
      hasil.innerHTML = `<div class="bagian"><p class="kosong">${t}</p></div>`;
      return;
    }
    hasil.innerHTML = isi.map(({ q, j }) => {
      const umur = Date.now() - new Date(q.dibuat_pada).getTime();
      let penanda = '';
      if (tab === 'belum') {
        if (umur > 7 * HARI) penanda = '<span class="status status-lama">Lebih dari 7 hari</span>';
        else if (umur < 2 * HARI) penanda = '<span class="status status-baru">Baru</span>';
      }
      if (tab === 'draf' && j?.minta_tinjauan_id) penanda = `<span class="status status-ditelaah">${j.minta_tinjauan_id === saya.id ? 'Menunggu tinjauan Anda' : 'Menunggu tinjauan'}</span>`;
      const penangan = q.penangan?.nama ? `Ditangani: ${esc(q.penangan.nama)}` : 'Ditangani: belum ada';
      return `<a class="kartu-tautan" href="#/panel/jawab/${esc(q.id)}">
        <span class="tag-baris"><span class="tag">${esc(q.rubrik)}</span>${penanda}</span>
        <strong class="isi-ringkas">${esc(ringkas(j?.judul || q.isi))}</strong>
        ${j?.judul ? `<span class="ringkas">${esc(ringkas(q.isi, 110))}</span>` : ''}
        <small>${penangan} · diterima ${esc(tanggalId(q.dibuat_pada, true))}${q.penanya?.nama ? ` · ${esc(q.penanya.nama)}${q.penanya.ranting?.nama ? ', Ranting NU ' + esc(q.penanya.ranting.nama) : ''}` : ''}</small>
      </a>`;
    }).join('');
  }

  const [rq, rj] = await Promise.all([
    supa.from('pertanyaan')
      .select('id,rubrik,isi,status,dibuat_pada,penanya:profil!penanya_id(nama,wa,ranting(nama)),penangan:profil!ditangani_oleh(nama)')
      .order('dibuat_pada', { ascending: true }),
    supa.from('jawaban').select('id,pertanyaan_id,status,judul,minta_tinjauan_id,diterbitkan_pada')
  ]);
  if (rq.error || rj.error) { hasil.innerHTML = '<p class="galat">Daftar belum bisa dimuat. Periksa koneksi lalu coba lagi.</p>'; return; }

  const jawabanDari = new Map(rj.data.map((j) => [j.pertanyaan_id, j]));
  for (const q of rq.data) {
    const j = jawabanDari.get(q.id);
    if (j?.status === 'terbit') semua.terbit.push({ q, j });
    else if (j) semua.draf.push({ q, j });
    else semua.belum.push({ q, j });
  }
  semua.terbit.sort((a, b) => new Date(b.j.diterbitkan_pada) - new Date(a.j.diterbitkan_pada));
  for (const k of ['belum', 'draf', 'terbit']) el.querySelector(`#n-${k}`).textContent = String(semua[k].length);

  el.querySelectorAll('#tab [data-t]').forEach((b) => b.addEventListener('click', () => {
    tab = b.dataset.t;
    el.querySelectorAll('#tab [data-t]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    gambarDaftar();
  }));
  gambarDaftar();
}
