// Pengaturan situs. Kedua nilai Supabase di bawah AMAN berada di kode publik:
// keamanan data dijaga oleh aturan akses (Row Level Security) di database, bukan oleh kerahasiaan kunci ini.
// JANGAN PERNAH menaruh kunci "service_role" di berkas ini.
export const SUPABASE_URL = 'https://xyxsyyqzlkzeqihrpjdk.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_CIK8FeePerWSQSqu0Y9Nqg_djH4XZqL'; // kunci publik (publishable); aman di kode publik

// Nomor WA ditulis sebagai alamat email internal agar fitur login bawaan bisa dipakai tanpa email asli.
// Domain ini tidak pernah dipakai mengirim surat. Harus sama dengan di scripts/seed-pengurus.mjs.
export const DOMAIN_AKUN = 'akun.lbm-tlanakan.id';

// Kontak WA untuk tombol "Kabari Pengurus" (format 62..., tanpa + dan tanpa spasi).
// Langsung ke Ketua dan Wakil Ketua. Mengganti nomor cukup mengubah di sini.
export const KONTAK_PENGURUS = [
  { peran: 'Ketua', nama: 'Ust. Syaifuddin', wa: '6285236548383' },
  { peran: 'Wakil Ketua', nama: 'Ust. Subhan', wa: '6282336144472' }
];

export const terkonfigurasi = !SUPABASE_URL.startsWith('GANTI') && !SUPABASE_ANON_KEY.startsWith('GANTI');
