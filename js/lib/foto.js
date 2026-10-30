// Mengecilkan foto di HP sebelum diunggah: JPEG, sisi terpanjang maks. 1600 px, ukuran sekitar 300 KB.
// Foto kamera HP bisa 3-8 MB; tanpa ini Storage gratis cepat penuh dan unggahan lambat.
const TARGET = 300 * 1024;
const BATAS_KERAS = 600 * 1024;

async function muatBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (_) { /* coba cara lain */ }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((ok, gagal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => gagal(new Error('Berkas ini bukan gambar yang bisa dibaca')); i.src = url; });
  } finally { setTimeout(() => URL.revokeObjectURL(url), 2000); }
}

const keBlob = (kanvas, mutu) => new Promise((ok) => kanvas.toBlob(ok, 'image/jpeg', mutu));

export async function kecilkanFoto(file) {
  if (!/^image\//.test(file.type || '')) throw new Error('Berkas harus berupa foto (JPG, PNG, atau HEIC dari HP)');
  const bmp = await muatBitmap(file);
  const w0 = bmp.width || bmp.naturalWidth; const h0 = bmp.height || bmp.naturalHeight;
  let sisi = 1600;
  for (let putaran = 0; putaran < 4; putaran++) {
    const skala = Math.min(1, sisi / Math.max(w0, h0));
    const k = document.createElement('canvas');
    k.width = Math.max(1, Math.round(w0 * skala)); k.height = Math.max(1, Math.round(h0 * skala));
    const c = k.getContext('2d');
    c.fillStyle = '#fff'; c.fillRect(0, 0, k.width, k.height);
    c.drawImage(bmp, 0, 0, k.width, k.height);
    for (const mutu of [0.82, 0.72, 0.62, 0.52, 0.42]) {
      const b = await keBlob(k, mutu);
      if (b && b.size <= TARGET) { if (bmp.close) bmp.close(); return b; }
      if (b && mutu === 0.42 && b.size <= BATAS_KERAS && putaran === 3) { if (bmp.close) bmp.close(); return b; }
    }
    sisi = Math.round(sisi * 0.75);
  }
  if (bmp.close) bmp.close();
  throw new Error('Foto ini terlalu rumit untuk dikecilkan. Coba foto lain.');
}
export const BATAS_FOTO = 6;
