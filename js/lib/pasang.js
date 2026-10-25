// Tombol "Tambahkan ke Layar Utama".
// Android (Chrome): peramban mengirim sinyal beforeinstallprompt, lalu tombol kita memicu pemasangan.
// iPhone (Safari): tidak ada sinyal itu, jadi ditampilkan petunjuk manual.
let sinyal = null;

// Kartu ini boleh diabaikan: setelah ditutup, tidak muncul lagi selama 14 hari (di halaman mana pun).
const KUNCI_TUTUP = 'lbm-tutup-pasang';
const HARI_TUTUP = 14;
const sudahDitutup = () => {
  try { const t = Number(localStorage.getItem(KUNCI_TUTUP)); return !!t && Date.now() - t < HARI_TUTUP * 864e5; } catch (_) { return false; }
};
const catatTutup = () => { try { localStorage.setItem(KUNCI_TUTUP, String(Date.now())); } catch (_) {} };
const tombolTutup = '<button type="button" class="tutup-kartu" aria-label="Tutup, jangan tampilkan dulu">×</button>';
const pendengar = new Set();

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  sinyal = e;
  pendengar.forEach((f) => f());
});
window.addEventListener('appinstalled', () => {
  sinyal = null;
  pendengar.forEach((f) => f());
});

export const sudahTerpasang = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

const iPhone = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Mengisi elemen kontainer dengan kartu pasang bila relevan; mengembalikan fungsi pembersih.
export function pasangKartu(kontainer) {
  const gambar = () => {
    kontainer.innerHTML = '';
    if (sudahTerpasang() || sudahDitutup()) return;
    const pasangTutup = () => kontainer.querySelector('.tutup-kartu')?.addEventListener('click', () => { catatTutup(); pendengar.forEach((f) => f()); });
    if (sinyal) {
      kontainer.innerHTML = `<div class="pasang"><p>Pasang di layar utama HP agar terbuka seperti aplikasi.</p><button type="button" class="tombol tombol-emas tombol-kecil" data-pasang>Tambahkan ke Layar Utama</button>${tombolTutup}</div>`;
      pasangTutup();
      kontainer.querySelector('[data-pasang]').addEventListener('click', async () => {
        const s = sinyal;
        if (!s) return;
        s.prompt();
        await s.userChoice.catch(() => null);
        sinyal = null;
        gambar();
      });
    } else if (iPhone()) {
      kontainer.innerHTML = `<div class="pasang"><p>Untuk memasang di iPhone: buka lewat Safari, ketuk tombol Bagikan, lalu pilih <b>Tambah ke Layar Utama</b>.</p>${tombolTutup}</div>`;
      pasangTutup();
    }
  };
  pendengar.add(gambar);
  gambar();
  return () => pendengar.delete(gambar);
}
