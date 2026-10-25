import { pasangKartu } from '../lib/pasang.js';
import { layar, segeraHadir } from '../lib/kerangka.js';
import { esc, tanggalId, RUBRIK, JENIS } from '../lib/util.js';
import { jawabanTerbaru } from '../lib/data.js';
import { ringkasRubrik } from './rubrik.js';

// Beranda untuk warga (dan untuk pengurus lewat menu "Beranda").
export function tampil(el, ctx) {
  const p = ctx.state.profil;
  const isi = layar(el, p, {
    aktif: 'beranda',
    kecil: 'Selamat datang,',
    judul: p.nama,
    isi: `
      <div id="pasang"></div>
      <section class="bagian kartu-gelap" id="terbaru"><p class="kosong">Memuat…</p></section>
      ${segeraHadir('Tingkat Partisipasi', 'Skor keaktifan Anda (absen rutinan, musyawarah, tulisan) akan tampil di sini. Hanya Anda yang melihatnya.')}
      ${segeraHadir('Absen Bulanan', 'Pindai QR atau masukkan kode 6 digit di majelis rutinan. Fitur ini menyusul pada tahap berikutnya.')}
      <section class="bagian">
        <div class="baris-judul"><h2>Rubrik</h2><a class="tautan-hijau" href="#/rubrik">Lihat semua</a></div>
        <div class="kisi-rubrik">
          ${RUBRIK.map((r) => `<a href="#/jawaban?r=${encodeURIComponent(r)}"><span class="inisial" aria-hidden="true">${esc(ringkasRubrik(r))}</span>${esc(r)}</a>`).join('')}
        </div>
      </section>
      <section class="bagian">
        <h2>Kirim Pertanyaan Fikih</h2>
        <p class="kosong">Tulis persoalan fikih harian, muamalah, atau amaliyah yang ingin dijawab LBM. Jawaban terbit tanpa menyebut nama dan ranting Anda.</p>
        <div class="dua-tombol" style="margin-top:12px">
          <a class="tombol tombol-hijau" href="#/tanya">Tulis Pertanyaan</a>
          <a class="tombol tombol-garis" href="#/profil" style="color:var(--hijau-tengah)">Riwayat Tanya</a>
        </div>
      </section>
      ${segeraHadir('Kirim Tulisan', 'Khotbah Jumat, artikel turats, atau esai ke-NU-an. Naskah akan disunting Tim Penyunting sebelum terbit.')}`
  });
  const bersihPasang = pasangKartu(isi.querySelector('#pasang'));
  muatTerbaru(isi.querySelector('#terbaru'));
  return bersihPasang;
}

async function muatTerbaru(kotak) {
  const [j] = await jawabanTerbaru(1);
  if (!j) { kotak.innerHTML = '<span class="tag">Jawaban Terbaru</span><p class="kosong" style="color:rgba(255,255,255,.85)">Belum ada jawaban yang terbit.</p>'; return; }
  kotak.innerHTML = `
    <span class="tag">Jawaban Terbaru</span>
    <h2>${esc(j.judul)}</h2>
    <small>${esc(JENIS[j.jenis] || '')} · ${esc(tanggalId(j.diterbitkan_pada))}</small>
    <a class="tombol tombol-emas tombol-kecil" href="#/jawaban/${esc(j.id)}">Baca</a>`;
}
