import { supa } from './supa.js';
import { bulanTahun } from './util.js';

// Sesi absen yang sedang buka (atau yang terakhir), beserta status absen pemanggil. null bila belum ada.
export async function sesiAktif() {
  if (!supa) return undefined;
  const { data, error } = await supa.rpc('sesi_absen_aktif');
  if (error) return undefined; // gagal memuat
  const baris = Array.isArray(data) ? data[0] : data;
  return baris || null;
}

export const judulSesi = (s) => `Absen ${bulanTahun(s.bulan)}`;

export const PESAN_ABSEN = {
  ok: ['sukses', 'Absen tercatat. Terima kasih, semoga berkah.'],
  sudah: ['info', 'Anda sudah tercatat hadir bulan ini.'],
  salah: ['galat', 'Kode salah atau sudah kedaluwarsa. Lihat kode terbaru di layar majelis.'],
  terkunci: ['galat', 'Terlalu banyak percobaan. Tunggu 10 menit, atau minta pengurus mencatat langsung.'],
  tutup: ['galat', 'Sesi absen belum dibuka atau sudah ditutup.']
};

export async function kirimKode(kode) {
  const { data, error } = await supa.rpc('absen_kode', { p_kode: kode });
  if (error) return { jenis: 'galat', teks: 'Absen belum berhasil. Periksa koneksi lalu coba lagi.', status: 'galat' };
  const [jenis, teks] = PESAN_ABSEN[data] || ['galat', 'Terjadi kendala. Coba lagi.'];
  return { jenis, teks, status: data };
}

// Mengambil kode 6 digit dari isi QR (tautan #/absen?k=123456) atau dari angka polos.
export function ambilKode(teks) {
  const t = String(teks || '').trim();
  const m = t.match(/[?&]k=(\d{6})\b/);
  if (m) return m[1];
  return /^\d{6}$/.test(t) ? t : null;
}

// Isi QR "Kartu Saya": LBMK:<id>:<kode 8 digit>
export const ambilKartu = (teks) => {
  const m = String(teks || '').trim().match(/^LBMK:([0-9a-fA-F-]{36}):(\d{8})$/);
  return m ? { id: m[1], kode: m[2] } : null;
};

// Tautan yang dimuat QR layar majelis.
export const tautanAbsen = (kode) => `${location.origin}${location.pathname}#/absen?k=${kode}`;
