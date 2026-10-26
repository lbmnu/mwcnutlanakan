import { esc, tanggalId } from './util.js';
import { sesiAktif, judulSesi, kirimKode, ambilKode } from './absen.js';
import { bisaPindai, bukaPemindai } from './pindai.js';
import { ubin } from './kerangka.js';

// Kartu "Absen" di Beranda: tampil sesuai keadaan sesi bulan ini.
export async function pasangKartuAbsen(kotak, saatCatat = () => {}) {
  kotak.innerHTML = '<p class="kosong">Memuat…</p>';
  const s = await sesiAktif();
  if (!kotak.isConnected) return;
  if (s === undefined) { kotak.innerHTML = '<h2>Absen Bulanan</h2><p class="galat">Status absen belum bisa dimuat.</p>'; return; }
  if (!s) {
    kotak.innerHTML = `<div class="baris-judul"><h2>Absen Bulanan</h2><span class="tag tag-garis">Belum dibuka</span></div>
      <p class="kosong">Sesi absen dibuka pengurus saat rutinan. Setelah dibuka, pindai QR atau ketik kode 6 digit di layar majelis.</p>`;
    return;
  }
  if (s.sudah) {
    kotak.innerHTML = `<div class="baris-judul"><h2>${esc(judulSesi(s))}</h2><span class="tag tag-hadir">Hadir ✓</span></div>
      <p class="kosong">Absen Anda tercatat${s.waktu ? ' pada ' + esc(tanggalId(s.waktu)) : ''}. Absen cukup sekali sebulan.</p>`;
    return;
  }
  if (s.status !== 'buka') {
    kotak.innerHTML = `<div class="baris-judul"><h2>${esc(judulSesi(s))}</h2><span class="tag tag-garis">Ditutup</span></div>
      <p class="kosong">Sesi bulan ini sudah ditutup dan Anda belum tercatat hadir. Bila Anda hadir, minta pengurus mencatat langsung.</p>`;
    return;
  }

  kotak.innerHTML = `
    <div class="baris-judul"><h2>${esc(judulSesi(s))}</h2><span class="tag status-ditelaah">Belum absen</span></div>
    <p class="kosong">Pindai QR di layar majelis, atau ketik kode 6 digit yang tampil di layar. Sekali sebulan.</p>
    <div class="dua-tombol" style="margin-top:12px">
      <button type="button" class="tombol tombol-hijau" id="pindai">${ubin('qr').replace('class="ubin"', 'class="ubin ubin-kecil"')} Pindai QR</button>
      <button type="button" class="tombol tombol-garis" id="ketik" style="color:var(--hijau-tengah)">${ubin('kode').replace('class="ubin"', 'class="ubin ubin-kecil"')} Ketik Kode</button>
    </div>
    <form class="kotak-ketik" id="form-kode" hidden novalidate>
      <label for="kode-absen" class="judul-kolom">Kode 6 digit di layar majelis</label>
      <div class="baris-ketik"><input id="kode-absen" inputmode="numeric" autocomplete="one-time-code" maxlength="7" placeholder="123456"><button class="tombol tombol-hijau tombol-kecil" type="submit">Catat</button></div>
    </form>
    <p class="galat" id="pesan-absen" role="alert" hidden></p>
    <a class="tautan-hijau" href="#/kartu" style="display:inline-block;margin-top:10px">Tampilkan Kartu Saya untuk dipindai pengurus</a>`;

  const pesan = kotak.querySelector('#pesan-absen');
  const form = kotak.querySelector('#form-kode');
  const tampilPesan = (r) => {
    pesan.className = r.jenis === 'sukses' || r.jenis === 'info' ? 'sukses' : 'galat';
    pesan.textContent = r.teks; pesan.hidden = false;
    if (r.status === 'ok' || r.status === 'sudah') { saatCatat(); setTimeout(() => pasangKartuAbsen(kotak, saatCatat), 800); }
  };

  kotak.querySelector('#ketik').addEventListener('click', () => { form.hidden = !form.hidden; if (!form.hidden) form.querySelector('input').focus(); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const kode = form.querySelector('input').value.replace(/\D/g, '');
    if (kode.length !== 6) { tampilPesan({ jenis: 'galat', teks: 'Kode terdiri dari 6 angka.' }); return; }
    const t = form.querySelector('button'); t.disabled = true;
    const r = await kirimKode(kode);
    t.disabled = false;
    tampilPesan(r);
  });
  kotak.querySelector('#pindai').addEventListener('click', () => {
    if (!bisaPindai()) {
      tampilPesan({ jenis: 'info', teks: 'Pemindai di dalam aplikasi belum didukung HP ini. Buka kamera bawaan HP lalu arahkan ke QR di layar majelis, atau tekan Ketik Kode.' });
      return;
    }
    bukaPemindai({
      judul: 'Pindai QR Majelis',
      petunjuk: 'Arahkan kamera ke kode QR di layar majelis.',
      saatBaca: async (teks) => {
        const kode = ambilKode(teks);
        if (!kode) return 'Bukan QR absen LBM. Coba lagi.';
        const r = await kirimKode(kode);
        if (r.status === 'salah') return 'Kode sudah kedaluwarsa. Pindai ulang QR terbaru.';
        tampilPesan(r);
        return true;
      }
    });
  });
}
