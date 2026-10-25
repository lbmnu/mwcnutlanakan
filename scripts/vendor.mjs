// Menyalin pustaka dan font dari node_modules ke dalam situs, supaya situs
// tidak bergantung pada server luar saat dibuka warga.
// Jalankan:  npm install  lalu  npm run vendor
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const daftar = [
  ['node_modules/@supabase/supabase-js/dist/umd/supabase.js', 'vendor/supabase.js'],
  ['node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2', 'fonts/plus-jakarta-sans-latin-wght.woff2'],
  ['node_modules/@fontsource/montserrat/files/montserrat-latin-600-normal.woff2', 'fonts/montserrat-latin-600.woff2'],
  ['node_modules/@fontsource/montserrat/files/montserrat-latin-900-normal.woff2', 'fonts/montserrat-latin-900.woff2']
];

let gagal = 0;
for (const [dari, ke] of daftar) {
  const asal = resolve(akar, dari);
  const tujuan = resolve(akar, ke);
  if (!existsSync(asal)) { console.error('TIDAK ADA :', dari); gagal++; continue; }
  mkdirSync(dirname(tujuan), { recursive: true });
  copyFileSync(asal, tujuan);
  console.log('disalin   :', ke);
}
if (gagal) { console.error(`\n${gagal} berkas tidak ditemukan. Jalankan "npm install" dulu.`); process.exit(1); }
console.log('\nSelesai.');
