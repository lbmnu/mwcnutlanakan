// Pengaturan situs. Kedua nilai Supabase di bawah AMAN berada di kode publik:
// keamanan data dijaga oleh aturan akses (Row Level Security) di database, bukan oleh kerahasiaan kunci ini.
// JANGAN PERNAH menaruh kunci "service_role" di berkas ini.
export const SUPABASE_URL = 'https://xyxsyyqzlkzeqihrpjdk.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_CIK8FeePerWSQSqu0Y9Nqg_djH4XZqL'; // kunci publik (publishable); aman di kode publik

// Nomor WA ditulis sebagai alamat email internal agar fitur login bawaan bisa dipakai tanpa email asli.
// Domain ini tidak pernah dipakai mengirim surat. Harus sama dengan di scripts/seed-pengurus.mjs.
export const DOMAIN_AKUN = 'akun.lbm-tlanakan.id';

// Nomor WA pengurus untuk tombol "Kabari Pengurus" (format 62...). Isi setelah dikonfirmasi.
export const KONTAK_WA = '';

export const terkonfigurasi = !SUPABASE_URL.startsWith('GANTI') && !SUPABASE_ANON_KEY.startsWith('GANTI');
