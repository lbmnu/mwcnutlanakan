import { DOMAIN_AKUN } from '../config.js';

// Mengubah penulisan nomor apa pun menjadi format 62xxxxxxxxxx. Mengembalikan null bila tidak masuk akal.
export function normalisasiWa(masukan) {
  let d = String(masukan || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8')) d = '62' + d;
  if (!/^62\d{8,13}$/.test(d)) return null;
  return d;
}

export const emailDariWa = (wa) => `${wa}@${DOMAIN_AKUN}`;

export function esc(teks) {
  return String(teks ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Pesan dari fungsi database sudah berbahasa Indonesia dan aman ditampilkan apa adanya.
const PESAN_SERVER = /Pertanyaan terlalu|Masih ada 5 pertanyaan|Batas kiriman harian|Akun belum aktif|Menunggu tinjauan|Simpan draf jawaban|wajib diisi|Peninjau harus|Pilih anggota Tim|Jawaban sudah terbit|Tidak berwenang|Sesi tidak sedang dibuka|Pertanyaan tidak ditemukan|Kata sandi minimal 8 karakter|Gunakan menu Profil|Akun tidak ditemukan|Nominal tidak valid|Tanggal tidak valid|Kategori tidak sesuai|Keterangan wajib|Alasan pembatalan|Catatan tidak ditemukan/;

export function pesanGalat(err) {
  const asli = String(err?.message || err || '');
  const cocok = asli.match(PESAN_SERVER);
  if (cocok) return asli;
  const m = asli.toLowerCase();
  if (m.includes('invalid login')) return 'Nomor WhatsApp atau kata sandi salah.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Nomor ini sudah terdaftar. Silakan masuk, atau hubungi pengurus bila lupa kata sandi.';
  if (m.includes('password') && m.includes('characters')) return 'Kata sandi minimal 8 karakter.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Terlalu banyak percobaan. Mohon tunggu beberapa menit.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'Tidak ada koneksi internet. Periksa sinyal lalu coba lagi.';
  return 'Terjadi kendala. Mohon coba lagi.';
}

export function ikon(nama) {
  const p = {
    masuk: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>',
    cek: '<path d="M5 12l5 5 9-10"/>',
    wa: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z"/>',
    unduh: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    salin: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    panah: '<path d="M9 6l6 6-6 6"/>'
  }[nama] || '';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

// ---------- Tanggal, teks, dan berbagi ----------
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export function tanggalId(iso, singkat = false) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const b = BULAN[d.getMonth()];
  return `${d.getDate()} ${singkat ? b.slice(0, 3) : b} ${d.getFullYear()}`;
}

// "2026-10-01" -> "Oktober 2026"
export function bulanTahun(tglIso) {
  const [t, b] = String(tglIso || '').split('-').map(Number);
  return t && b ? `${BULAN[b - 1]} ${t}` : '';
}

// Memecah teks menjadi paragraf aman (baris kosong = paragraf baru).
export function paragraf(teks) {
  return String(teks || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
}

export const RUBRIK = ['Bahtsul Masail', 'Tanya Fikih', 'Fikih Harian', 'Fikih Muamalah', 'Amaliyah Aswaja', 'Kajian Kitab'];
export const JENIS = { jawaban_tim: 'Jawaban Tim', hasil_musyawarah: 'Hasil Musyawarah' };
export const STATUS_TANYA = { menunggu: 'Menunggu Jawaban', ditelaah: 'Sedang Ditelaah', terjawab: 'Terjawab' };

export const tautanJawaban = (id) => `${location.origin}${location.pathname}#/jawaban/${id}`;

export function teksBagikan(j) {
  const baru = j.jenis === 'hasil_musyawarah' ? 'hasil musyawarah terbaru' : 'jawaban terbaru';
  return `Assalamu’alaikum Wr. Wb.\n\nAlhamdulillah, telah terbit ${baru} LBM MWCNU Tlanakan dengan pembahasan:\n\n${j.judul}\n\nMari simak ulasan dan dasar rujukannya secara lengkap melalui tautan berikut: ${tautanJawaban(j.id)}\n\nSemoga bermanfaat.\nWassalamu’alaikum Wr. Wb.`;
}

export const tautanWa = (teks, nomor = '') => `https://wa.me/${nomor}?text=${encodeURIComponent(teks)}`;

// Menyalin teks. Mengembalikan true bila berhasil.
export async function salin(teks) {
  try { await navigator.clipboard.writeText(teks); return true; } catch (_) {}
  try {
    const t = document.createElement('textarea');
    t.value = teks; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    const ok = document.execCommand('copy'); t.remove(); return ok;
  } catch (_) { return false; }
}

// ---------- Rupiah dan tanggal WIB ----------
export const rp = (n) => `Rp ${Math.abs(Number(n) || 0).toLocaleString('id-ID')}`;
export const rpTanda = (n) => `${Number(n) < 0 ? '−' : ''}${rp(n)}`;
// Tanggal hari ini menurut WIB, bentuk "2026-10-26" (cocok untuk <input type=date>).
export function hariIniWib() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
