import { esc } from './util.js';
import { adalahPengurus, labelKepala } from '../state.js';

const IK = {
  beranda: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  rubrik: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  kas: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 15h2"/>',
  profil: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  panel: '<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>'
};
Object.assign(IK, {
  timbangan: '<path d="M12 4v16M6 20h12M5 7h14"/><path d="M7 7l-3 6a3 3 0 0 0 6 0zM17 7l-3 6a3 3 0 0 0 6 0z"/>',
  tanya: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01"/>',
  dokumen: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
  koin: '<circle cx="12" cy="12" r="9"/><path d="M9 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h5M12 7v2.5M12 15.5V17"/>',
  orang: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  buku: '<path d="M3 5.5C6 4 9.5 4 12 6c2.5-2 6-2 9-.5V19c-3-1.5-6.5-1.5-9 .5-2.5-2-6-2-9-.5z"/><path d="M12 6v13.5"/>',
  qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM18 14h2M14 18h2"/>',
  kode: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>',
  masuk: '<path d="M17 7L7 17M7 9v8h8"/>',
  keluar: '<path d="M7 17L17 7M9 7h8v8"/>',
  pena: '<path d="M4 20l4-1 11-11-3-3L5 16z"/>'
});
const svg = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IK[n]}</svg>`;

export const ikonSvg = svg;
export const IKON_RUBRIK = { 'Bahtsul Masail': 'timbangan', 'Tanya Fikih': 'tanya', 'Fikih Harian': 'dokumen', 'Fikih Muamalah': 'koin', 'Amaliyah Aswaja': 'orang', 'Kajian Kitab': 'buku' };
export const ubin = (nama) => `<span class="ubin" aria-hidden="true">${svg(nama)}</span>`;

// Menu bawah. Pengurus: Panel (halaman awal), Beranda, Pustaka, Kas, Profil. Warga: Beranda, Pustaka, Kas, Profil.
export function menuBawah(profil, aktif) {
  const item = (kunci, href, teks, ikonKunci) =>
    `<a href="${href}" class="${aktif === kunci ? 'on' : ''}"${aktif === kunci ? ' aria-current="page"' : ''}>${svg(ikonKunci)}<span>${teks}</span></a>`;
  const p = adalahPengurus(profil);
  return `<nav class="nav-bawah" aria-label="Menu utama">
    ${p ? item('panel', '#/dasbor', 'Panel', 'panel') : ''}
    ${item('beranda', p ? '#/beranda' : '#/dasbor', 'Beranda', 'beranda')}
    ${item('rubrik', '#/pustaka', 'Pustaka', 'rubrik')}
    ${item('kas', '#/kas', 'Kas', 'kas')}
    ${item('profil', '#/profil', 'Profil', 'profil')}
  </nav>`;
}

// Menambahkan menu bawah ke layar .dalam-krem yang sudah digambar.
export function pasangMenu(el, profil, aktif) {
  const kotak = el.querySelector('.dalam-krem');
  if (!kotak || !profil || profil.status !== 'aktif') return;
  kotak.classList.add('ada-menu');
  kotak.insertAdjacentHTML('beforeend', menuBawah(profil, aktif));
}

// Layar penuh dengan kepala hijau + menu bawah. Mengembalikan elemen <main>.
export function layar(el, profil, { aktif, kecil, judul, peran = true, kanan = '', isi = '' }) {
  el.innerHTML = `
  <div class="dalam-krem ada-menu">
    <header class="bilah-hijau">
      <div class="salam">
        <small>${esc(kecil)}</small>
        <strong>${esc(judul)}</strong>
        ${peran ? `<span class="peran">(${esc(labelKepala(profil))})</span>` : ''}
      </div>
      ${kanan}
    </header>
    <main class="isi">${isi}</main>
    ${menuBawah(profil, aktif)}
  </div>`;
  return el.querySelector('main.isi');
}

export const KATEGORI_KAS = {
  masuk: ['Infaq rutinan', 'Infaq maslahah', 'I’anah Khidmah Ranting'],
  keluar: ['Operasional', 'Lain-lain']
};

export const segeraHadir = (judul, uraian) => `
  <section class="bagian segera">
    <div class="baris-judul"><h2>${esc(judul)}</h2><span class="tag tag-garis">Segera hadir</span></div>
    <p class="kosong">${esc(uraian)}</p>
  </section>`;
