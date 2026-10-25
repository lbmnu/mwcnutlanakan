import { layar } from '../lib/kerangka.js';
import { esc, RUBRIK } from '../lib/util.js';

const URAIAN = {
  'Bahtsul Masail': 'Hasil musyawarah LBM atas persoalan keagamaan.',
  'Tanya Fikih': 'Pertanyaan warga yang dijawab Tim Penjawab.',
  'Fikih Harian': 'Hukum ibadah dan urusan sehari-hari.',
  'Fikih Muamalah': 'Jual beli, utang piutang, dan transaksi.',
  'Amaliyah Aswaja': 'Tradisi dan amaliyah warga NU.',
  'Kajian Kitab': 'Telaah ibarat kitab para ulama.'
};

// Huruf awal untuk lencana rubrik, mis. "Fikih Muamalah" -> "FM".
export const ringkasRubrik = (r) => r.split(/\s+/).map((k) => k[0]).join('').slice(0, 2).toUpperCase();

export function tampil(el, ctx) {
  layar(el, ctx.state.profil, {
    aktif: 'rubrik',
    kecil: 'Ruang kajian',
    judul: 'Rubrik',
    peran: false,
    isi: `
      <section class="bagian"><p class="kosong" style="padding:0">Pilih ruang kajian dan bahtsul masail LBM MWCNU Tlanakan.</p></section>
      ${RUBRIK.map((r) => `
        <a class="kartu-tautan kartu-rubrik" href="#/jawaban?r=${encodeURIComponent(r)}">
          <span class="inisial" aria-hidden="true">${esc(ringkasRubrik(r))}</span>
          <span class="isi-rubrik"><strong>${esc(r)}</strong><small>${esc(URAIAN[r])}</small></span>
        </a>`).join('')}`
  });
}
