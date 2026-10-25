import { supa } from './supa.js';
import { esc, salin, tanggalId } from './util.js';

// Kotak yang menampilkan kode pemulihan baru (hanya sekali) beserta tombol Salin.
export function kotakKode(kode) {
  return `<div class="kotak-kode">
    <p class="kode-huruf" id="kode-huruf" aria-label="Kode pemulihan">${esc(kode)}</p>
    <button type="button" class="tombol tombol-garis tombol-kecil" id="salin-kode">Salin kode</button>
    <p class="petunjuk-kode">Simpan di catatan HP atau tulis di kertas. Kode ini <b>tidak akan ditampilkan lagi</b>. Jangan diberikan kepada siapa pun, termasuk pengurus.</p>
  </div>`;
}

export function pasangSalin(akar) {
  const t = akar.querySelector('#salin-kode');
  if (!t) return;
  t.addEventListener('click', async () => {
    const ok = await salin(akar.querySelector('#kode-huruf').textContent.trim());
    t.textContent = ok ? 'Tersalin ✓' : 'Salin manual dengan menekan lama kode';
  });
}

// Tanggal kode dibuat, atau null bila belum punya.
export async function statusKode() {
  if (!supa) return undefined;
  const { data, error } = await supa.rpc('status_kode_pemulihan');
  return error ? undefined : data || null;
}

// Ajakan membuat kode bila akun belum punya. Boleh ditutup 7 hari.
const KUNCI = 'lbm-tutup-kode';
const ditutup = () => { try { const t = Number(localStorage.getItem(KUNCI)); return !!t && Date.now() - t < 7 * 864e5; } catch (_) { return false; } };
export async function ajakanKode(kotak) {
  if (ditutup()) return;
  const s = await statusKode();
  if (s !== null || !kotak.isConnected) return; // undefined = gagal memuat: jangan ganggu
  kotak.innerHTML = `<div class="pasang ajakan"><p><b>Buat kode pemulihan.</b> Bila lupa kata sandi, kode ini satu-satunya cara masuk lagi tanpa bantuan pengurus.</p><a class="tombol tombol-emas tombol-kecil" href="#/profil">Buat kode</a><button type="button" class="tutup-kartu" aria-label="Tutup">×</button></div>`;
  kotak.querySelector('.tutup-kartu').addEventListener('click', () => { try { localStorage.setItem(KUNCI, String(Date.now())); } catch (_) {} kotak.innerHTML = ''; });
}

export const teksStatus = (s) => (s ? `Dibuat ${tanggalId(s)}. Kode lama tidak bisa dilihat lagi; buat kode baru bila hilang.` : 'Belum dibuat.');
