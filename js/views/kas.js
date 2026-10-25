import { layar, ikonSvg, KATEGORI_KAS } from '../lib/kerangka.js';
import { esc } from '../lib/util.js';

const baris = (ikonNama, kelas, nama, jenis) => `
  <div class="transaksi">
    <span class="ubin-bulat ${kelas}" aria-hidden="true">${ikonSvg(ikonNama)}</span>
    <div><strong>${esc(nama)}</strong><small>${jenis}</small></div>
    <b class="angka-kosong">Rp –</b>
  </div>`;

export function tampil(el, ctx) {
  layar(el, ctx.state.profil, {
    aktif: 'kas',
    kecil: 'Transparansi lembaga',
    judul: 'Laporan Kas LBM',
    peran: false,
    isi: `
      <section class="bagian kartu-gelap kartu-saldo">
        <div class="baris-judul"><small>Saldo kas saat ini</small><span class="tag">Segera hadir</span></div>
        <h2 class="saldo">Rp –</h2>
        <small>Laporan akan dicatat Bendahara. Belum ada angka yang ditampilkan.</small>
      </section>
      <div class="dua-angka">
        <div class="bagian"><small>Total Pemasukan</small><b class="masuk-kas">Rp –</b></div>
        <div class="bagian"><small>Total Pengeluaran</small><b class="keluar-kas">Rp –</b></div>
      </div>
      <section class="bagian segera">
        <div class="baris-judul"><h2>Rincian Transaksi</h2><span class="tag tag-garis">Segera hadir</span></div>
        <p class="kosong">Contoh tampilan setelah pencatatan dimulai. Kategori sudah ditetapkan:</p>
        ${KATEGORI_KAS.masuk.map((k) => baris('masuk', 'hijau', k, 'Pemasukan')).join('')}
        ${KATEGORI_KAS.keluar.map((k) => baris('keluar', 'merah', k, 'Pengeluaran')).join('')}
      </section>`
  });
}
