import { supa } from '../lib/supa.js';
import { pasangMenu } from '../lib/kerangka.js';
import { esc, pesanGalat, tanggalId, RUBRIK, STATUS_TANYA } from '../lib/util.js';

const ringkas = (t, n = 120) => { const s = String(t || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n).trimEnd() + '…' : s; };

export function tampil(el, ctx) {
  el.innerHTML = `
  <div class="dalam-krem">
    <header class="bilah-hijau">
      <div class="salam"><small>Tim Penjawab LBM</small><strong>Tanya Fikih</strong></div>
      <a class="lencana" href="#/profil">Riwayat</a>
    </header>
    <main class="isi">
      <form class="form" id="f" novalidate>
        <div class="kolom"><label for="rubrik">Rubrik</label>
          <select id="rubrik" name="rubrik">${RUBRIK.map((r) => `<option${r === 'Tanya Fikih' ? ' selected' : ''}>${esc(r)}</option>`).join('')}</select>
        </div>
        <div class="kolom"><label for="isi">Pertanyaan Anda</label>
          <textarea id="isi" name="isi" rows="6" maxlength="2000" placeholder="Tulis pertanyaan dengan jelas. Sertakan keadaan yang menyebabkan pertanyaan itu muncul."></textarea>
          <p class="petunjuk"><span id="hitung">0</span> dari 2000 huruf. Jawaban terbit di Kabar Terbaru tanpa menyebut nama dan ranting Anda.</p>
        </div>
        <p id="pesan" class="galat" role="alert" hidden></p>
        <p id="sukses" class="sukses" role="status" hidden>Pertanyaan terkirim dan masuk antrean Tim Penjawab.</p>
        <button class="tombol tombol-hijau" type="submit">Kirim</button>
      </form>
      <section class="bagian">
        <h2>Riwayat Pertanyaan</h2>
        <div id="riwayat"><p class="kosong">Memuat…</p></div>
      </section>
    </main>
  </div>`;

  const f = el.querySelector('#f');
  const pesan = el.querySelector('#pesan');
  const sukses = el.querySelector('#sukses');
  const riwayat = el.querySelector('#riwayat');
  const tombol = f.querySelector('button[type=submit]');
  f.isi.addEventListener('input', () => { el.querySelector('#hitung').textContent = String(f.isi.value.length); });

  async function muatRiwayat() {
    const { data, error } = await supa.rpc('riwayat_saya');
    if (error) { riwayat.innerHTML = '<p class="galat">Riwayat belum bisa dimuat. Coba lagi nanti.</p>'; return; }
    if (!data.length) { riwayat.innerHTML = '<p class="kosong">Belum ada pertanyaan. Pertanyaan yang Anda kirim akan tampil di sini beserta statusnya.</p>'; return; }
    riwayat.innerHTML = data.map((q) => `
      <div class="baris baris-atas">
        <div class="teks">
          <span class="tag-baris"><span class="tag">${esc(q.rubrik)}</span><span class="status status-${esc(q.status)}">${esc(STATUS_TANYA[q.status] || q.status)}</span></span>
          <strong class="isi-ringkas">${esc(ringkas(q.isi))}</strong>
          <small>${q.status === 'terjawab' && q.diterbitkan_pada ? `Terbit ${esc(tanggalId(q.diterbitkan_pada))}` : `Dikirim ${esc(tanggalId(q.dibuat_pada))}`}</small>
          ${q.jawaban_id ? `<a class="tautan-hijau" href="#/jawaban/${esc(q.jawaban_id)}">Baca jawaban</a>` : ''}
        </div>
      </div>`).join('');
  }

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    pesan.hidden = true; sukses.hidden = true;
    const isi = f.isi.value.trim();
    if (isi.length < 10) { pesan.textContent = 'Pertanyaan terlalu pendek. Tulis minimal 10 huruf.'; pesan.hidden = false; return; }
    tombol.disabled = true; tombol.textContent = 'Mengirim…';
    const { error } = await supa.rpc('kirim_pertanyaan', { p_rubrik: f.rubrik.value, p_isi: isi });
    tombol.disabled = false; tombol.textContent = 'Kirim';
    if (error) { pesan.textContent = pesanGalat(error); pesan.hidden = false; return; }
    f.isi.value = ''; el.querySelector('#hitung').textContent = '0';
    sukses.hidden = false;
    muatRiwayat();
  });

  pasangMenu(el, ctx.state.profil, 'beranda');
  muatRiwayat();
}
