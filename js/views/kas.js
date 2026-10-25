import { layar, segeraHadir, KATEGORI_KAS } from '../lib/kerangka.js';
import { esc } from '../lib/util.js';

export function tampil(el, ctx) {
  layar(el, ctx.state.profil, {
    aktif: 'kas',
    kecil: 'Transparansi lembaga',
    judul: 'Laporan Kas LBM',
    peran: false,
    isi: `
      ${segeraHadir('Saldo, pemasukan, dan pengeluaran', 'Laporan kas akan dicatat Bendahara dan ditampilkan di sini pada tahap berikutnya. Belum ada angka yang ditampilkan.')}
      <section class="bagian">
        <h2>Kategori yang akan dicatat</h2>
        <div class="baris-kategori"><b>Pemasukan</b>${KATEGORI_KAS.masuk.map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</div>
        <div class="baris-kategori"><b>Pengeluaran</b>${KATEGORI_KAS.keluar.map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</div>
      </section>`
  });
}
