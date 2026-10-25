// Tombol "Tambahkan ke Layar Utama".
// Android (Chrome): peramban mengirim sinyal beforeinstallprompt, lalu tombol kita memicu pemasangan.
// iPhone (Safari): tidak ada sinyal itu, jadi ditampilkan petunjuk manual.
let sinyal = null;
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
    if (sudahTerpasang()) return;
    if (sinyal) {
      kontainer.innerHTML = `<div class="pasang"><p>Pasang di layar utama HP agar terbuka seperti aplikasi.</p><button type="button" class="tombol tombol-emas tombol-kecil">Tambahkan ke Layar Utama</button></div>`;
      kontainer.querySelector('button').addEventListener('click', async () => {
        const s = sinyal;
        if (!s) return;
        s.prompt();
        await s.userChoice.catch(() => null);
        sinyal = null;
        gambar();
      });
    } else if (iPhone()) {
      kontainer.innerHTML = `<div class="pasang"><p>Untuk memasang di iPhone: buka lewat Safari, ketuk tombol Bagikan, lalu pilih <b>Tambah ke Layar Utama</b>.</p></div>`;
    }
  };
  pendengar.add(gambar);
  gambar();
  return () => pendengar.delete(gambar);
}
