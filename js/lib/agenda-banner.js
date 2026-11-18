import { esc, hariTanggal } from './util.js';
import { agendaTerdekat } from './data.js';

// Kartu "Agenda Rutinan" di beranda warga. Menampilkan acara terdekat yang sudah diumumkan.
export async function pasangBannerAgenda(kotak) {
  const [a] = await agendaTerdekat(1);
  if (!kotak.isConnected) return;
  kotak.innerHTML = a
    ? `<div class="baris-judul"><h2>Agenda Rutinan</h2><a class="tautan-hijau" href="#/agenda">Semua agenda</a></div>
       <a class="kartu-tautan kartu-dalam" href="#/agenda/${esc(a.id)}">
         <span class="tag-baris"><span class="tag">${esc(hariTanggal(a.tanggal, true))}</span>${a.hijriah ? `<span class="tag tag-garis">${esc(a.hijriah)}</span>` : ''}</span>
         <strong>${esc(a.judul)}</strong>
         <small>${esc(a.tempat)}</small>
       </a>`
    : '<div class="baris-judul"><h2>Agenda Rutinan</h2><a class="tautan-hijau" href="#/agenda">Buka</a></div><p class="kosong">Belum ada acara yang diumumkan.</p>';
}
