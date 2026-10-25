// Membuat akun pengurus LBM dari data/pengurus.csv (berkas ini TIDAK ikut ke GitHub).
// Dijalankan di laptop pengelola, bukan di situs. Memakai kunci "service_role" yang RAHASIA.
//
//   export SUPABASE_URL="https://xxxx.supabase.co"
//   export SUPABASE_SERVICE_ROLE_KEY="..."        # Project Settings > API > service_role
//   npm run seed
//
// Hasil: hasil-sandi-sementara.csv (kata sandi sementara untuk dibagikan lewat WA satu per satu).
// Setiap pengurus WAJIB mengganti kata sandi saat pertama masuk.
import { readFileSync, writeFileSync } from 'node:fs';
import { randomInt } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const URL_PROYEK = process.env.SUPABASE_URL;
const KUNCI = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DOMAIN_AKUN = process.env.DOMAIN_AKUN || 'akun.lbm-tlanakan.id'; // samakan dengan js/config.js
if (!URL_PROYEK || !KUNCI) { console.error('Isi dulu SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.'); process.exit(1); }

const sb = createClient(URL_PROYEK, KUNCI, { auth: { autoRefreshToken: false, persistSession: false } });

// Petakan jabatan di CSV ke hak di situs.
// Tambahkan "+ Admin" untuk merangkap admin, contoh: "Wakil Ketua + Admin".
function petakan(jabatan) {
  const j = jabatan.trim().toLowerCase();
  const rangkapAdmin = /(^|\s|\+)admin\s*$/.test(j);
  const dasar = j.replace(/\s*\+?\s*admin\s*$/, '').trim();
  let hak;
  if (dasar === '') hak = { peran: 'pengurus', jabatan_lbm: null, tim_penjawab: true, tim_penyunting: true }; // hanya "Admin"
  else if (dasar === 'ketua') hak = { peran: 'pengurus', jabatan_lbm: 'ketua', tim_penjawab: true, tim_penyunting: true };
  else if (dasar === 'wakil ketua') hak = { peran: 'pengurus', jabatan_lbm: 'wakil_ketua', tim_penjawab: true, tim_penyunting: true };
  else if (dasar === 'sekretaris') hak = { peran: 'pengurus', jabatan_lbm: 'sekretaris', tim_penjawab: false, tim_penyunting: false };
  else if (dasar === 'bendahara') hak = { peran: 'pengurus', jabatan_lbm: 'bendahara', tim_penjawab: false, tim_penyunting: false };
  else if (dasar.startsWith('tim ahli') || dasar.startsWith("tim ta'bir") || dasar.startsWith('tim tabir'))
    hak = { peran: 'pengurus', jabatan_lbm: 'anggota', tim_penjawab: true, tim_penyunting: false };
  else throw new Error(`Jabatan tidak dikenal: "${jabatan}"`);
  if (rangkapAdmin) hak.peran = 'admin';
  return hak;
}

// Kata sandi sementara 10 karakter tanpa huruf yang mirip (0/O, 1/l/I).
const HURUF = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const sandiSementara = () => Array.from({ length: 10 }, () => HURUF[randomInt(HURUF.length)]).join('');

// CSV sederhana yang mendukung tanda kutip.
function bacaCsv(teks) {
  const baris = []; let sel = ''; let rec = []; let kutip = false;
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (kutip) { if (c === '"') { if (teks[i + 1] === '"') { sel += '"'; i++; } else kutip = false; } else sel += c; }
    else if (c === '"') kutip = true;
    else if (c === ',') { rec.push(sel); sel = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && teks[i + 1] === '\n') i++; rec.push(sel); sel = ''; if (rec.some((x) => x !== '')) baris.push(rec); rec = []; }
    else sel += c;
  }
  if (sel !== '' || rec.length) { rec.push(sel); baris.push(rec); }
  const [kepala, ...isi] = baris;
  return isi.map((r) => Object.fromEntries(kepala.map((k, i) => [k.trim(), (r[i] ?? '').trim()])));
}
const kutip = (s) => `"${String(s).replace(/"/g, '""')}"`;

const rows = bacaCsv(readFileSync(new URL('../data/pengurus.csv', import.meta.url), 'utf8'));
const hasil = [['nama', 'jabatan', 'wa', 'sandi_sementara', 'keterangan']];
let gagal = 0;

for (const r of rows) {
  const wa = (r.wa_normal || '').replace(/\D/g, '');
  try {
    if (!/^62\d{8,13}$/.test(wa)) throw new Error('nomor WA tidak valid (kolom wa_normal)');
    const hak = petakan(r.jabatan);
    const sandi = sandiSementara();

    const { data, error } = await sb.auth.admin.createUser({
      email: `${wa}@${DOMAIN_AKUN}`,
      password: sandi,
      email_confirm: true,
      user_metadata: { nama: r.nama, wa, tipe: 'pengurus_struktural', lembaga: 'LBM MWCNU Tlanakan', jabatan_lembaga: r.jabatan }
    });
    if (error) throw error;

    const { error: e2 } = await sb.from('profil').update({
      status: 'aktif', wajib_ganti_sandi: true, disetujui_pada: new Date().toISOString(), ...hak
    }).eq('id', data.user.id);
    if (e2) throw e2;

    hasil.push([r.nama, r.jabatan, wa, sandi, 'dibuat']);
    console.log('dibuat  :', r.nama, '-', r.jabatan);
  } catch (e) {
    gagal++;
    const sudah = /already|registered|exists/i.test(String(e.message));
    hasil.push([r.nama, r.jabatan, wa, '', sudah ? 'SUDAH ADA (dilewati)' : 'GAGAL: ' + e.message]);
    console.error(sudah ? 'dilewati :' : 'GAGAL   :', r.nama, '-', e.message);
  }
}

writeFileSync(new URL('../hasil-sandi-sementara.csv', import.meta.url), hasil.map((r) => r.map(kutip).join(',')).join('\n') + '\n', { mode: 0o600 });
console.log(`\nSelesai. Berkas hasil-sandi-sementara.csv dibuat (RAHASIA, jangan diunggah). Bermasalah: ${gagal}.`);
