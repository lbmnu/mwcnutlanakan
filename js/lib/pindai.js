// Pemindai QR memakai kamera. Hanya jalan di peramban yang mendukung BarcodeDetector
// (Chrome di Android). Di tempat lain, pengguna memakai kamera bawaan HP atau mengetik kode.
export const bisaPindai = () => 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia;

// saatBaca(teks) mengembalikan true untuk berhenti, atau teks pesan yang ditampilkan lalu pemindaian lanjut.
export function bukaPemindai({ judul = 'Pindai kode QR', petunjuk = 'Arahkan kamera ke kode QR.', saatBaca }) {
  const lap = document.createElement('div');
  lap.className = 'pemindai';
  lap.setAttribute('role', 'dialog');
  lap.setAttribute('aria-modal', 'true');
  lap.setAttribute('aria-label', judul);
  lap.innerHTML = `
    <div class="pemindai-atas"><strong>${judul}</strong><button type="button" class="pemindai-tutup" aria-label="Tutup pemindai">Tutup</button></div>
    <video class="pemindai-video" playsinline muted></video>
    <div class="pemindai-bingkai" aria-hidden="true"></div>
    <p class="pemindai-pesan" role="status">${petunjuk}</p>`;
  document.body.appendChild(lap);
  document.body.style.overflow = 'hidden';
  const video = lap.querySelector('video');
  const pesan = lap.querySelector('.pemindai-pesan');
  let aliran = null; let timer = null; let tutup = false; let sibuk = false; let terakhir = ''; let waktuTerakhir = 0;

  const selesai = () => {
    if (tutup) return;
    tutup = true;
    clearInterval(timer);
    if (aliran) aliran.getTracks().forEach((t) => t.stop());
    lap.remove();
    document.body.style.overflow = '';
  };
  lap.querySelector('.pemindai-tutup').addEventListener('click', selesai);

  (async () => {
    try {
      const detektor = new window.BarcodeDetector({ formats: ['qr_code'] });
      aliran = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (tutup) { aliran.getTracks().forEach((t) => t.stop()); return; }
      video.srcObject = aliran;
      await video.play();
      timer = setInterval(async () => {
        if (sibuk || tutup || video.readyState < 2) return;
        sibuk = true;
        try {
          const hasil = await detektor.detect(video);
          const teks = hasil[0]?.rawValue;
          if (teks && !(teks === terakhir && Date.now() - waktuTerakhir < 4000)) {
            terakhir = teks; waktuTerakhir = Date.now();
            const r = await saatBaca(teks);
            if (r === true) { selesai(); return; }
            if (typeof r === 'string') pesan.textContent = r;
          }
        } catch (_) { /* bingkai gagal dibaca: coba lagi */ }
        sibuk = false;
      }, 300);
    } catch (e) {
      pesan.textContent = e && e.name === 'NotAllowedError'
        ? 'Izin kamera ditolak. Izinkan kamera di pengaturan peramban, atau ketik kode secara manual.'
        : 'Kamera tidak bisa dibuka. Ketik kode secara manual.';
    }
  })();

  return { tutup: selesai, pesan: (t) => { pesan.textContent = t; } };
}
