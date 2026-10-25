import { esc } from './util.js';
import { adalahPengurus, labelKepala } from '../state.js';

const IK = {
  beranda: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  rubrik: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  kas: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 15h2"/>',
  profil: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  panel: '<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>'
};
const svg = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IK[n]}</svg>`;

// Menu bawah. Pengurus: Panel (halaman awal), Beranda, Rubrik, Kas, Profil. Warga: Beranda, Rubrik, Kas, Profil.
export function menuBawah(profil, aktif) {
  const item = (kunci, href, teks, ikonKunci) =>
    `<a href="${href}" class="${aktif === kunci ? 'on' : ''}"${aktif === kunci ? ' aria-current="page"' : ''}>${svg(ikonKunci)}<span>${teks}</span></a>`;
  const p = adalahPengurus(profil);
  return `<nav class="nav-bawah" aria-label="Menu utama">
    ${p ? item('panel', '#/dasbor', 'Panel', 'panel') : ''}
    ${item('beranda', p ? '#/beranda' : '#/dasbor', 'Beranda', 'beranda')}
    ${item('rubrik', '#/rubrik', 'Rubrik', 'rubrik')}
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
