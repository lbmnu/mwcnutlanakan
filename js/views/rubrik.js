import { layar, ubin, IKON_RUBRIK } from '../lib/kerangka.js';
import { esc, RUBRIK } from '../lib/util.js';

const URAIAN = {
  'Bahtsul Masail': 'Hasil musyawarah dan keputusan bersama.',
  'Tanya Fikih': 'Pertanyaan warga yang dijawab Tim Penjawab.',
  'Fikih Harian': 'Ibadah dan urusan sehari-hari.',
  'Fikih Muamalah': 'Jual beli, utang piutang, dan transaksi.',
  'Amaliyah Aswaja': 'Amalan warga dan dalilnya.',
  'Kajian Kitab': 'Telaah teks dari kitab rujukan.'
};

export function tampil(el, ctx) {
  layar(el, ctx.state.profil, {
    aktif: 'rubrik',
    kecil: 'Pilih ruang yang Anda butuhkan',
    judul: 'Rubrik',
    peran: false,
    isi: RUBRIK.map((r) => `
      <a class="kartu-rubrik" href="#/jawaban?r=${encodeURIComponent(r)}">
        ${ubin(IKON_RUBRIK[r])}
        <span class="isi-rubrik"><strong>${esc(r)}</strong><small>${esc(URAIAN[r])}</small></span>
      </a>`).join('')
  });
}
