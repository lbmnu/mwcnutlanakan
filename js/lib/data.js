import { supa } from './supa.js';

// Jawaban terbit dibaca dari tampilan publik "jawaban_publik": tanpa nama, nomor, atau ranting penanya.
export async function jawabanTerbaru(n = 1) {
  if (!supa) return [];
  const { data, error } = await supa
    .from('jawaban_publik')
    .select('id,judul,rubrik,jenis,diterbitkan_pada')
    .order('diterbitkan_pada', { ascending: false })
    .limit(n);
  return error ? [] : data;
}
