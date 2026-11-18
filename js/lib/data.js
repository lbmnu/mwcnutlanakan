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

// Tulisan terbit terbaru (tampilan publik "tulisan_publik").
export async function tulisanTerbaru(n = 1) {
  if (!supa) return [];
  const { data, error } = await supa
    .from('tulisan_publik')
    .select('id,bentuk,judul,penulis,ranting,diterbitkan_pada')
    .order('diterbitkan_pada', { ascending: false })
    .limit(n);
  return error ? [] : data;
}

// Agenda rutinan terbit yang akan datang (atau baru lewat dua hari), paling dekat dulu.
export async function agendaTerdekat(n = 1) {
  if (!supa) return [];
  const batas = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
  const { data, error } = await supa
    .from('agenda_publik')
    .select('id,tanggal,hijriah,waktu,tempat,judul')
    .gte('tanggal', batas)
    .order('tanggal', { ascending: true })
    .limit(n);
  return error ? [] : data;
}
