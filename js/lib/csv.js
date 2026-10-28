// Ekspor CSV untuk cadangan data. Dibuka rapi di Excel/Google Sheets (BOM UTF-8, pemisah titik koma
// sesuai pengaturan Indonesia). Teks yang diawali = + - @ diberi tanda ' agar tidak dibaca sebagai rumus.
import { supa } from './supa.js';

const sel = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  let s = String(v).replace(/\r?\n/g, ' ').trim();
  if (/^[=+\-@\t]/.test(s)) s = "'" + s;
  return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
export const buatCsv = (baris) => '﻿' + baris.map((b) => b.map(sel).join(';')).join('\r\n') + '\r\n';

export function unduhCsv(nama, baris) {
  const blob = new Blob([buatCsv(baris)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nama; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const wib = (iso) => (iso ? new Date(iso).toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }) : '');
// Nomor WA ditulis dengan spasi (62 852 3654 8383) agar Excel tidak mengubahnya menjadi angka ilmiah
// dan tidak dibaca sebagai rumus.
const fmtWa = (wa) => { const d = String(wa || '').replace(/\D/g, ''); return d.startsWith('62') && d.length > 9 ? ['62', d.slice(2, 5), d.slice(5, 9), d.slice(9)].filter(Boolean).join(' ') : d; };
const stamp = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });

// Membaca semua baris tabel/tampilan (pecah per 1000 baris).
async function semua(buat) {
  const hasil = [];
  for (let dari = 0; ; dari += 1000) {
    const { data, error } = await buat().range(dari, dari + 999);
    if (error) throw error;
    hasil.push(...data);
    if (data.length < 1000) break;
  }
  return hasil;
}

export const EKSPOR = {
  kas: {
    judul: 'Kas (semua catatan)',
    async jalankan() {
      const baris = [];
      for (let lewat = 0; ; lewat += 100) {
        const { data, error } = await supa.rpc('kas_daftar', { p_bulan: null, p_jenis: null, p_batas: 100, p_lewat: lewat });
        if (error) throw error;
        baris.push(...data);
        if (data.length < 100) break;
      }
      return [`kas-lbm-${stamp()}.csv`, [['Tanggal', 'Jenis', 'Kategori', 'Jumlah (Rp)', 'Asal/Penerima', 'Keterangan', 'Status', 'Alasan batal', 'Dicatat oleh']]
        .concat(baris.map((k) => [k.tanggal, k.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran', k.kategori, k.jumlah, k.asal, k.keterangan, k.batal ? 'Dibatalkan' : 'Sah', k.alasan_batal || '', k.pencatat]))];
    }
  },
  kehadiran: {
    judul: 'Kehadiran rutinan (semua bulan)',
    async jalankan() {
      const [a, w, r] = await Promise.all([
        semua(() => supa.from('absensi').select('profil_id,cara,waktu').order('waktu', { ascending: true })),
        semua(() => supa.from('profil').select('id,nama,wa,ranting_id').order('nama', { ascending: true })),
        supa.from('ranting').select('id,nama')
      ]);
      if (r.error) throw r.error;
      const rn = new Map(r.data.map((x) => [x.id, x.nama])); const wm = new Map(w.map((x) => [x.id, x]));
      return [`kehadiran-lbm-${stamp()}.csv`, [['Bulan', 'Waktu (WIB)', 'Nama', 'Ranting NU', 'Nomor WA', 'Cara absen']]
        .concat(a.map((x) => { const p = wm.get(x.profil_id) || {}; const t = wib(x.waktu); return [t.slice(0, 7), t, p.nama || '', rn.get(p.ranting_id) || '', fmtWa(p.wa), { majelis: 'Pindai layar majelis', kartu: 'Kartu dipindai pengurus', manual: 'Dicatat manual' }[x.cara] || x.cara]; }))];
    }
  },
  warga: {
    judul: 'Daftar warga dan pengurus',
    async jalankan() {
      const [w, r] = await Promise.all([
        semua(() => supa.from('profil').select('nama,wa,tipe,lembaga,jabatan_lembaga,status,peran,jabatan_lbm,ranting_id,dibuat_pada').order('nama', { ascending: true })),
        supa.from('ranting').select('id,nama')
      ]);
      if (r.error) throw r.error;
      const rn = new Map(r.data.map((x) => [x.id, x.nama]));
      return [`warga-lbm-${stamp()}.csv`, [['Nama', 'Nomor WA', 'Ranting NU', 'Status pendaftaran', 'Jenis', 'Lembaga/banom', 'Jabatan di lembaga', 'Peran di web', 'Jabatan LBM', 'Terdaftar (WIB)']]
        .concat(w.map((x) => [x.nama, fmtWa(x.wa), rn.get(x.ranting_id) || '', x.status, x.tipe === 'pengurus_struktural' ? 'Pengurus struktural' : 'Warga NU', x.lembaga || '', x.jabatan_lembaga || '', x.peran, x.jabatan_lbm || '', wib(x.dibuat_pada)]))];
    }
  },
  jawaban: {
    judul: 'Jawaban yang sudah terbit',
    async jalankan() {
      const d = await semua(() => supa.from('jawaban_publik').select('*').order('diterbitkan_pada', { ascending: true }));
      return [`jawaban-terbit-lbm-${stamp()}.csv`, [['Terbit (WIB)', 'Rubrik', 'Jenis', 'Judul', 'Pertanyaan', 'Jawaban', 'Rujukan (Arab)', 'Rujukan (sumber)']]
        .concat(d.map((x) => [wib(x.diterbitkan_pada), x.rubrik, x.jenis === 'hasil_musyawarah' ? 'Hasil musyawarah' : 'Jawaban Tim', x.judul, x.pertanyaan, x.isi, x.rujukan_arab, x.rujukan_sumber]))];
    }
  },
  tulisan: {
    judul: 'Tulisan yang sudah terbit',
    async jalankan() {
      const d = await semua(() => supa.from('tulisan_publik').select('*').order('diterbitkan_pada', { ascending: true }));
      return [`tulisan-terbit-lbm-${stamp()}.csv`, [['Terbit (WIB)', 'Bentuk', 'Judul', 'Penulis', 'Ranting NU', 'Isi', 'Rujukan']]
        .concat(d.map((x) => [wib(x.diterbitkan_pada), x.bentuk, x.judul, x.penulis || '', x.ranting || '', x.isi, x.rujukan]))];
    }
  }
};
