import { supa } from '../lib/supa.js';
import { layar } from '../lib/kerangka.js';
import { qrSvg } from '../lib/qr.js';
import { esc } from '../lib/util.js';

// "Kartu Saya": QR pribadi yang berganti tiap menit; dipindai pengurus untuk mencatat absen.
export function tampil(el, ctx) {
  const p = ctx.state.profil;
  const isi = layar(el, p, {
    aktif: 'profil',
    kecil: 'Untuk dipindai pengurus',
    judul: 'Kartu Saya',
    peran: false,
    isi: `
      <section class="bagian kartu-qr" id="kartu">
        <p class="kosong">Memuat…</p>
      </section>
      <section class="bagian"><p class="kosong">Tunjukkan kode ini kepada pengurus di majelis. Kode berganti tiap menit supaya tidak bisa dipinjamkan. Jangan kirim tangkapan layarnya kepada siapa pun.</p></section>
      <a class="tombol tombol-garis" href="#/dasbor" style="color:var(--hijau-tengah)">Kembali</a>`
  });
  const kotak = isi.querySelector('#kartu');
  let sisa = 0; let timer = null; let ambilLagi = false;

  async function ambil() {
    if (ambilLagi) return; ambilLagi = true;
    const { data, error } = await supa.rpc('token_kartu');
    ambilLagi = false;
    if (!kotak.isConnected) return;
    const baris = Array.isArray(data) ? data[0] : data;
    if (error) { kotak.innerHTML = '<p class="galat">Kartu belum bisa dimuat. Periksa koneksi.</p>'; return; }
    if (!baris) { sisa = 0; kotak.innerHTML = '<h2>Belum ada sesi absen</h2><p class="kosong">Kartu hanya tampil saat sesi absen sedang dibuka oleh pengurus.</p>'; return; }
    sisa = baris.sisa;
    kotak.innerHTML = `
      <div class="qr-kotak">${qrSvg(`LBMK:${p.id}:${baris.kode}`, { ukuran: 260 })}</div>
      <strong class="qr-nama">${esc(p.nama)}</strong>
      <small>${p.ranting?.nama ? 'Ranting NU ' + esc(p.ranting.nama) : ''}</small>
      <small class="qr-sisa">Berganti dalam <b id="sisa">${sisa}</b> detik</small>`;
  }
  ambil();
  timer = setInterval(() => {
    if (!kotak.querySelector('#sisa')) return;
    sisa -= 1;
    if (sisa <= 0) { ambil(); return; }
    kotak.querySelector('#sisa').textContent = String(sisa);
  }, 1000);
  return () => clearInterval(timer);
}
