import { pasangKartu } from '../lib/pasang.js';
import { layar, ubin } from '../lib/kerangka.js';
import { ajakanKode } from '../lib/pemulihan.js';
import { esc, tanggalId, JENIS } from '../lib/util.js';
import { jawabanTerbaru, tulisanTerbaru } from '../lib/data.js';
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
      <section class="bagian" id="tulisan-terbaru"><p class="kosong">Memuat…</p></section>
      <section class="bagian">
        <h2>Kirim Pertanyaan</h2>
        <p class="kosong">Tulis persoalan fikih harian, muamalah, atau amaliyah yang ingin dijawab LBM. Jawaban terbit tanpa menyebut nama dan ranting Anda.</p>
        <div class="dua-tombol" style="margin-top:12px">
          <a class="tombol tombol-hijau" href="#/tanya">Tulis Pertanyaan</a>
          <a class="tombol tombol-garis" href="#/profil" style="color:var(--hijau-tengah)">Riwayat Tanya</a>
        </div>
      </section>
      <section class="bagian">
        <div class="kartu-tulisan">
          <div>
            <h2>Kirim Tulisan</h2>
            <p class="kosong">Khotbah Jumat, artikel turats, atau esai ke-NU-an. Naskah disunting Tim Penyunting sebelum terbit, dan nama Anda dicantumkan sebagai penulis.</p>
          </div>
          ${ubin('pena')}
        </div>
        <div class="dua-tombol" style="margin-top:12px">
          <a class="tombol tombol-hijau" href="#/tulis">Tulis Sekarang</a>
          <a class="tombol tombol-garis" href="#/tulisan" style="color:var(--hijau-tengah)">Baca Tulisan</a>
        </div>
      </section>`
  });
  const bersihPasang = pasangKartu(isi.querySelector('#pasang'));
  ajakanKode(isi.querySelector('#ajakan-kode'));
  muatTerbaru(isi.querySelector('#terbaru'));
  muatTulisanTerbaru(isi.querySelector('#tulisan-terbaru'));
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

async function muatTulisanTerbaru(kotak) {
  const [t] = await tulisanTerbaru(1);
  kotak.innerHTML = t
    ? `<div class="baris-judul"><h2>Tulisan Terbaru</h2><a class="tautan-hijau" href="#/pustaka">Buka Pustaka</a></div>
       <a class="kartu-tautan kartu-dalam" href="#/tulisan/${esc(t.id)}">
         <span class="tag-baris"><span class="tag">${esc(t.bentuk)}</span></span>
         <strong>${esc(t.judul)}</strong>
         <small>${t.penulis ? esc(t.penulis) + ' · ' : ''}Terbit ${esc(tanggalId(t.diterbitkan_pada))}</small>
       </a>`
    : '<div class="baris-judul"><h2>Pustaka</h2><a class="tautan-hijau" href="#/pustaka">Buka</a></div><p class="kosong">Baca jawaban LBM dan tulisan warga di Pustaka.</p>';
}
