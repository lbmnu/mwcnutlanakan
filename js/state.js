import { supa } from './lib/supa.js';

export const state = { session: null, profil: null, galatProfil: null };

export async function muatProfil() {
  state.galatProfil = null;
  if (!supa || !state.session) { state.profil = null; return; }
  const { data, error } = await supa
    .from('profil')
    .select('*, ranting(nama)')
    .eq('id', state.session.user.id)
    .maybeSingle();
  if (error) { state.profil = null; state.galatProfil = error; return; }
  state.profil = data; // null bila trigger pendaftaran belum membuat baris profil
}

export const bisaSetujui = (p) =>
  !!p && p.status === 'aktif' && (p.peran === 'admin' || ['ketua', 'wakil_ketua', 'sekretaris'].includes(p.jabatan_lbm));

export const labelPeran = (p) => {
  if (!p) return '';
  if (p.peran === 'admin') return 'Admin';
  const j = { ketua: 'Ketua', wakil_ketua: 'Wakil Ketua', sekretaris: 'Sekretaris', bendahara: 'Bendahara', anggota: 'Pengurus' }[p.jabatan_lbm];
  if (j) return `${j} LBM`;
  if (p.tipe === 'pengurus_struktural') return p.jabatan_lembaga ? `${p.jabatan_lembaga}${p.lembaga ? ' · ' + p.lembaga : ''}` : 'Pengurus Struktural';
  return p.ranting?.nama ? `Ranting ${p.ranting.nama}` : 'Warga NU';
};

export const adalahPengurus = (p) => !!p && p.status === 'aktif' && (p.peran === 'pengurus' || p.peran === 'admin');

// Keterangan di bawah nama pada kepala halaman, mis. "Warga Ranting NU Tlanakan".
export const labelKepala = (p) => {
  if (!p) return '';
  if (adalahPengurus(p)) {
    const j = { ketua: 'Ketua', wakil_ketua: 'Wakil Ketua', sekretaris: 'Sekretaris', bendahara: 'Bendahara' }[p.jabatan_lbm];
    const dasar = j ? `Pengurus LBM · ${j}` : 'Pengurus LBM';
    return p.peran === 'admin' ? `${dasar} · Admin` : dasar;
  }
  if (p.tipe === 'pengurus_struktural') return ['Pengurus Struktural', p.jabatan_lembaga].filter(Boolean).join(' · ');
  return p.ranting?.nama ? `Warga Ranting NU ${p.ranting.nama}` : 'Warga NU';
};
