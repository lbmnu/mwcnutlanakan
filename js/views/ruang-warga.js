import { pasangKartu } from '../lib/pasang.js';
import { layar, ubin, IKON_RUBRIK } from '../lib/kerangka.js';
import { ajakanKode } from '../lib/pemulihan.js';
import { esc, tanggalId, RUBRIK, JENIS } from '../lib/util.js';
import { jawabanTerbaru } from '../lib/data.js';
import { pasangKartuAbsen } from '../lib/kartu-absen.js';
import { pasangRingHadir } from '../lib/ring-hadir.js';

// Beranda untuk warga (dan untuk pengurus lewat menu "Beranda").
export function tampil(el, ctx) {
  const p = ctx.state.profil;
  const isi = layar(el, p, {
    aktif: 'beranda',
    kecil: 'Selamat datang,',
    judul: p.nama,
    isi: `
      <div id="pasang"></div>
      <div id="ajakan-kode"></div>
      <section class="bagian kartu-ring" id="ring-hadir" aria-label="Kehadiran rutinan"><p class="kosong">Memuat…</p></section>
      <section class="bagian kartu-gelap" id="terbaru"><p class="kosong">Memuat…</p></section>
      <section class="bagian" id="kartu-absen"></section>
      <div class="baris-judul judul-luar"><h2>Rubrik</h2><a class="tautan-hijau" href="#/rubrik">Lihat semua</a></div>
      <div class="kisi-rubrik">
        ${RUBRIK.map((r) => `<a href="#/jawaban?r=${encodeURIComponent(r)}">${ubin(IKON_RUBRIK[r])}${esc(r)}</a>`).join('')}
      </div>
      <section class="bagian">
        <h2>Kirim Pertanyaan</h2>
        <p class="kosong">Tulis persoalan fikih harian, muamalah, atau amaliyah yang ingin dijawab LBM. Jawaban terbit tanpa menyebut nama dan ranting Anda.</p>
        <div class="dua-tombol" style="margin-top:12px">
          <a class="tombol tombol-hijau" href="#/tanya">Tulis Pertanyaan</a>
          <a class="tombol tombol-garis" href="#/profil" style="color:var(--hijau-tengah)">Riwayat Tanya</a>
        </div>
      </section>
      <section class="bagian segera kartu-tulisan">
        <div>
          <div class="baris-judul"><h2>Kirim Tulisan</h2><span class="tag tag-garis">Segera hadir</span></div>
          <p class="kosong">Khotbah Jumat, artikel turats, atau esai ke-NU-an. Naskah disunting Tim Penyunting sebelum terbit.</p>
        </div>
        ${ubin('pena')}
      </section>`
  });
  const bersihPasang = pasangKartu(isi.querySelector('#pasang'));
  ajakanKode(isi.querySelector('#ajakan-kode'));
  muatTerbaru(isi.querySelector('#terbaru'));
  const ring = () => pasangRingHadir(isi.querySelector('#ring-hadir'));
  pasangKartuAbsen(isi.querySelector('#kartu-absen'), ring);
  ring();
  return bersihPasang;
}

async function muatTerbaru(kotak) {
  const [j] = await jawabanTerbaru(1);
  if (!j) { kotak.innerHTML = '<div><span class="tag">Jawaban Terbaru</span><p class="kosong" style="color:rgba(255,255,255,.85)">Belum ada jawaban yang terbit.</p></div>'; return; }
  kotak.innerHTML = `
    <div>
      <span class="tag">Jawaban Terbaru</span>
      <h2>${esc(j.judul)}</h2>
      <small>${esc(JENIS[j.jenis] || '')} · ${esc(tanggalId(j.diterbitkan_pada))}</small>
    </div>
    <a class="tombol tombol-emas tombol-kecil" href="#/jawaban/${esc(j.id)}">Baca</a>`;
}
