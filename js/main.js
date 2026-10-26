import { supa, siap, alasanBelumSiap } from './lib/supa.js';
import { state, muatProfil } from './state.js';
import * as beranda from './views/beranda.js';
import * as masuk from './views/masuk.js';
import * as daftar from './views/daftar.js';
import * as menunggu from './views/menunggu.js';
import * as dasbor from './views/dasbor.js';
import * as gantisandi from './views/gantisandi.js';
import * as jawabanDaftar from './views/jawaban-daftar.js';
import * as jawabanBaca from './views/jawaban-baca.js';
import * as tanya from './views/tanya.js';
import * as panelPertanyaan from './views/panel-pertanyaan.js';
import * as panelJawab from './views/panel-jawab.js';
import * as ruangWarga from './views/ruang-warga.js';
import * as rubrik from './views/rubrik.js';
import * as kas from './views/kas.js';
import * as profil from './views/profil.js';
import * as lupaSandi from './views/lupa-sandi.js';
import * as absen from './views/absen.js';
import * as kartu from './views/kartu.js';
import * as majelis from './views/majelis.js';
import * as kehadiran from './views/kehadiran.js';
import * as tulis from './views/tulis.js';
import * as tulisanSaya from './views/tulisan-saya.js';
import * as tulisanDaftar from './views/tulisan-daftar.js';
import * as tulisanBaca from './views/tulisan-baca.js';
import * as panelTulisan from './views/panel-tulisan.js';
import * as panelSunting from './views/panel-sunting.js';
import { pasangLihatSandi } from './lib/lihat-sandi.js';

const app = document.getElementById('app');
pasangLihatSandi(app);
const JUDUL = 'LBM MWCNU Tlanakan';
const UUID = '([0-9a-fA-F-]{36})';

// jenis: tamu = hanya untuk yang belum masuk; bebas = terbuka untuk siapa saja;
//        khusus = layar peralihan (menunggu, ganti sandi); dalam = hanya untuk akun aktif.
const daftarRute = [
  { pola: /^\/$/, modul: beranda, jenis: 'tamu' },
  { pola: /^\/masuk$/, modul: masuk, jenis: 'tamu' },
  { pola: /^\/daftar$/, modul: daftar, jenis: 'tamu' },
  { pola: /^\/lupa-sandi$/, modul: lupaSandi, jenis: 'tamu' },
  { pola: /^\/jawaban$/, modul: jawabanDaftar, jenis: 'bebas' },
  { pola: new RegExp(`^/jawaban/${UUID}$`), modul: jawabanBaca, jenis: 'bebas' },
  { pola: /^\/tulisan$/, modul: tulisanDaftar, jenis: 'bebas' },
  { pola: new RegExp(`^/tulisan/${UUID}$`), modul: tulisanBaca, jenis: 'bebas' },
  { pola: /^\/menunggu$/, modul: menunggu, jenis: 'khusus' },
  { pola: /^\/ganti-sandi$/, modul: gantisandi, jenis: 'khusus' },
  { pola: /^\/dasbor$/, modul: dasbor, jenis: 'dalam' },
  { pola: /^\/beranda$/, modul: ruangWarga, jenis: 'dalam' },
  { pola: /^\/rubrik$/, modul: rubrik, jenis: 'dalam' },
  { pola: /^\/kas$/, modul: kas, jenis: 'dalam' },
  { pola: /^\/profil$/, modul: profil, jenis: 'dalam' },
  { pola: /^\/absen$/, modul: absen, jenis: 'dalam' },
  { pola: /^\/kartu$/, modul: kartu, jenis: 'dalam' },
  { pola: /^\/majelis$/, modul: majelis, jenis: 'dalam' },
  { pola: /^\/kehadiran$/, modul: kehadiran, jenis: 'dalam' },
  { pola: /^\/tanya$/, modul: tanya, jenis: 'dalam' },
  { pola: /^\/tulis$/, modul: tulis, jenis: 'dalam' },
  { pola: /^\/tulisan-saya$/, modul: tulisanSaya, jenis: 'dalam' },
  { pola: /^\/panel\/tulisan$/, modul: panelTulisan, jenis: 'dalam' },
  { pola: new RegExp(`^/panel/tulisan/${UUID}$`), modul: panelSunting, jenis: 'dalam' },
  { pola: /^\/panel$/, modul: panelPertanyaan, jenis: 'dalam' },
  { pola: new RegExp(`^/panel/jawab/${UUID}$`), modul: panelJawab, jenis: 'dalam' }
];

let bersihkan = null;
let siapMemuat = false;

const jalurSaatIni = () => (location.hash.replace(/^#/, '') || '/').split('?')[0];
const cocokkan = (jalur) => {
  for (const r of daftarRute) {
    const m = jalur.match(r.pola);
    if (m) return { ...r, params: { id: m[1] } };
  }
  return null;
};

// Menentukan jalur yang boleh dibuka sesuai keadaan akun.
function jaga(jalur) {
  const r = cocokkan(jalur);
  if (r && r.jenis === 'bebas') return jalur;
  if (!siap) return r && r.jenis === 'tamu' ? jalur : '/';
  if (!state.session) {
    // Tautan QR absen dibuka sebelum masuk: ingat, lalu lanjutkan setelah masuk.
    if (jalur === '/absen') { try { sessionStorage.setItem('lbm-lanjut', location.hash); } catch (_) {} }
    return r && r.jenis === 'tamu' ? jalur : '/masuk';
  }
  if (!state.profil || state.profil.status !== 'aktif') return '/menunggu';
  if (state.profil.wajib_ganti_sandi) return '/ganti-sandi';
  if (!r || r.jenis === 'tamu' || r.jenis === 'khusus') return '/dasbor';
  return jalur;
}

function gambar() {
  if (!siapMemuat) { app.innerHTML = '<div class="gelap"><div class="tengah"><p>Memuat…</p></div></div>'; return; }
  const diminta = jalurSaatIni();
  const tujuan = jaga(diminta);
  if (tujuan !== diminta && tujuan === '/dasbor' && state.profil?.status === 'aktif') {
    // Setelah masuk: lanjutkan ke tautan absen yang tertunda (bila ada).
    let lanjut = null;
    try { lanjut = sessionStorage.getItem('lbm-lanjut'); sessionStorage.removeItem('lbm-lanjut'); } catch (_) {}
    if (lanjut && /^#\/absen\?k=\d{6}$/.test(lanjut)) { location.replace(lanjut); return; }
  }
  if (tujuan !== diminta) { location.replace('#' + tujuan); return; }
  if (bersihkan) { try { bersihkan(); } catch (_) {} bersihkan = null; }
  document.title = JUDUL;
  window.scrollTo(0, 0);
  const r = cocokkan(tujuan);
  const konteks = { state, params: r.params, siap, alasanBelumSiap, segarkan, pindah: (j) => { location.hash = '#' + j; } };
  bersihkan = r.modul.tampil(app, konteks) || null;
}

// Dipanggil setelah masuk, keluar, atau perubahan data akun.
async function segarkan() {
  if (supa) {
    const { data } = await supa.auth.getSession();
    state.session = data.session;
    await muatProfil();
  }
  gambar();
}

window.addEventListener('hashchange', gambar);

(async function mulai() {
  if (siap) {
    const { data } = await supa.auth.getSession();
    state.session = data.session;
    await muatProfil();
    supa.auth.onAuthStateChange(async (peristiwa, sesi) => {
      if (peristiwa === 'TOKEN_REFRESHED') return;
      const lama = state.session?.user?.id;
      state.session = sesi;
      if (sesi?.user?.id !== lama || peristiwa === 'SIGNED_OUT') {
        // supabase-js melarang memanggil API di dalam callback ini; tunda dengan setTimeout.
        setTimeout(async () => { await muatProfil(); gambar(); }, 0);
      }
    });
  }
  siapMemuat = true;
  gambar();
})();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
