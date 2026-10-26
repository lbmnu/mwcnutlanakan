// Pembuat kode QR (mode byte, koreksi galat M, versi 1 sampai 10). Tanpa pustaka luar.
// Dipakai untuk layar majelis dan "Kartu Saya". Mengikuti ISO/IEC 18004.

const ECC_PER_BLOK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const JUMLAH_BLOK = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];

// ---------- Aritmetika GF(256) dan Reed-Solomon ----------
function kaliGF(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}
function pembagiRS(derajat) {
  const hasil = new Array(derajat).fill(0);
  hasil[derajat - 1] = 1;
  let akar = 1;
  for (let i = 0; i < derajat; i++) {
    for (let j = 0; j < derajat; j++) {
      hasil[j] = kaliGF(hasil[j], akar);
      if (j + 1 < derajat) hasil[j] ^= hasil[j + 1];
    }
    akar = kaliGF(akar, 0x02);
  }
  return hasil;
}
function sisaRS(data, pembagi) {
  const hasil = pembagi.map(() => 0);
  for (const b of data) {
    const faktor = b ^ hasil.shift();
    hasil.push(0);
    pembagi.forEach((koef, i) => { hasil[i] ^= kaliGF(koef, faktor); });
  }
  return hasil;
}

// ---------- Ukuran dan kapasitas ----------
const modulDataMentah = (v) => {
  let n = (16 * v + 128) * v + 64;
  if (v >= 2) {
    const a = Math.floor(v / 7) + 2;
    n -= (25 * a - 10) * a - 55;
    if (v >= 7) n -= 36;
  }
  return n;
};
const kodeDataTersedia = (v) => Math.floor(modulDataMentah(v) / 8) - ECC_PER_BLOK[v] * JUMLAH_BLOK[v];

function posisiPenyelaras(v) {
  if (v === 1) return [];
  const n = Math.floor(v / 7) + 2;
  const langkah = Math.floor((v * 8 + n * 3 + 5) / (n * 4 - 4)) * 2;
  const hasil = [6];
  for (let pos = v * 4 + 10; hasil.length < n; pos -= langkah) hasil.splice(1, 0, pos);
  return hasil;
}

// ---------- Matriks ----------
function bangunKerangka(v) {
  const ukuran = v * 4 + 17;
  const modul = Array.from({ length: ukuran }, () => new Array(ukuran).fill(false));
  const fungsi = Array.from({ length: ukuran }, () => new Array(ukuran).fill(false));
  const set = (x, y, gelap) => { modul[y][x] = gelap; fungsi[y][x] = true; };

  for (let i = 0; i < ukuran; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const pencari = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx; const y = cy + dy;
      if (x < 0 || x >= ukuran || y < 0 || y >= ukuran) continue;
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      set(x, y, d !== 2 && d !== 4);
    }
  };
  pencari(3, 3); pencari(ukuran - 4, 3); pencari(3, ukuran - 4);

  const pos = posisiPenyelaras(v);
  pos.forEach((cx, i) => pos.forEach((cy, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === pos.length - 1) || (i === pos.length - 1 && j === 0)) return;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }));

  // Tempat format dan versi: tandai dulu, isi setelah masker dipilih.
  for (let i = 0; i < 9; i++) { fungsi[8][i] = true; fungsi[i][8] = true; }
  for (let i = 0; i < 8; i++) { fungsi[8][ukuran - 1 - i] = true; fungsi[ukuran - 1 - i][8] = true; }
  set(8, ukuran - 8, true);
  if (v >= 7) for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { fungsi[ukuran - 11 + j][i] = true; fungsi[i][ukuran - 11 + j] = true; }
  return { ukuran, modul, fungsi };
}

function gambarFormat(m, mask) {
  const { ukuran, modul } = m;
  const data = (0 << 3) | mask; // koreksi galat M = 00
  let sisa = data;
  for (let i = 0; i < 10; i++) sisa = (sisa << 1) ^ ((sisa >>> 9) * 0x537);
  const bits = ((data << 10) | sisa) ^ 0x5412;
  const bit = (i) => ((bits >>> i) & 1) !== 0;
  for (let i = 0; i <= 5; i++) modul[i][8] = bit(i);
  modul[7][8] = bit(6); modul[8][8] = bit(7); modul[8][7] = bit(8);
  for (let i = 9; i < 15; i++) modul[8][14 - i] = bit(i);
  for (let i = 0; i < 8; i++) modul[8][ukuran - 1 - i] = bit(i);
  for (let i = 8; i < 15; i++) modul[ukuran - 15 + i][8] = bit(i);
  modul[ukuran - 8][8] = true;
}

function gambarVersi(m, v) {
  if (v < 7) return;
  let sisa = v;
  for (let i = 0; i < 12; i++) sisa = (sisa << 1) ^ ((sisa >>> 11) * 0x1f25);
  const bits = (v << 12) | sisa;
  for (let i = 0; i < 18; i++) {
    const b = ((bits >>> i) & 1) !== 0;
    const a = m.ukuran - 11 + (i % 3); const c = Math.floor(i / 3);
    m.modul[c][a] = b; m.modul[a][c] = b;
  }
}

function tempatkanKode(m, kode) {
  const { ukuran, modul, fungsi } = m;
  let i = 0;
  for (let kanan = ukuran - 1; kanan >= 1; kanan -= 2) {
    if (kanan === 6) kanan = 5;
    for (let vert = 0; vert < ukuran; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = kanan - j;
        const naik = ((kanan + 1) & 2) === 0;
        const y = naik ? ukuran - 1 - vert : vert;
        if (!fungsi[y][x] && i < kode.length * 8) {
          modul[y][x] = ((kode[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
          i++;
        }
      }
    }
  }
}

const MASKER = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x, y) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
];

function terapkanMasker(m, mask) {
  for (let y = 0; y < m.ukuran; y++) for (let x = 0; x < m.ukuran; x++) {
    if (!m.fungsi[y][x] && MASKER[mask](x, y)) m.modul[y][x] = !m.modul[y][x];
  }
}

function penalti(m) {
  const { ukuran: n, modul } = m;
  let skor = 0;
  const garis = (ambil) => {
    let jalan = 1;
    for (let i = 1; i < n; i++) {
      if (ambil(i) === ambil(i - 1)) { jalan++; } else { if (jalan >= 5) skor += jalan - 2; jalan = 1; }
    }
    if (jalan >= 5) skor += jalan - 2;
    // pola mirip pencari 1:1:3:1:1 dengan ruang kosong 4 modul
    for (let i = 0; i + 10 < n; i++) {
      const w = [];
      for (let k = 0; k < 11; k++) w.push(ambil(i + k) ? 1 : 0);
      const s = w.join('');
      if (s === '10111010000' || s === '00001011101') skor += 40;
    }
  };
  for (let y = 0; y < n; y++) garis((i) => modul[y][i]);
  for (let x = 0; x < n; x++) garis((i) => modul[i][x]);
  for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) {
    const c = modul[y][x];
    if (c === modul[y][x + 1] && c === modul[y + 1][x] && c === modul[y + 1][x + 1]) skor += 3;
  }
  let gelap = 0;
  for (const baris of modul) for (const c of baris) if (c) gelap++;
  const total = n * n;
  skor += (Math.ceil(Math.abs(gelap * 20 - total * 10) / total) - 1) * 10;
  return skor;
}

// ---------- Data ----------
function kodekanTeks(teks) {
  return Array.from(new TextEncoder().encode(teks));
}

export function buatMatriksQR(teks) {
  const byte = kodekanTeks(teks);
  let v = 1;
  const butuhBit = (ver) => 4 + (ver < 10 ? 8 : 16) + byte.length * 8;
  while (v <= 10 && butuhBit(v) > kodeDataTersedia(v) * 8) v++;
  if (v > 10) throw new Error('Teks terlalu panjang untuk kode QR');

  // Aliran bit data
  const bit = [];
  const tulis = (nilai, jumlah) => { for (let i = jumlah - 1; i >= 0; i--) bit.push((nilai >>> i) & 1); };
  tulis(0x4, 4);
  tulis(byte.length, v < 10 ? 8 : 16);
  byte.forEach((b) => tulis(b, 8));
  const kapasitas = kodeDataTersedia(v) * 8;
  tulis(0, Math.min(4, kapasitas - bit.length));
  while (bit.length % 8) bit.push(0);
  for (let pad = 0xec; bit.length < kapasitas; pad ^= 0xec ^ 0x11) tulis(pad, 8);
  const data = [];
  for (let i = 0; i < bit.length; i += 8) data.push(bit.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));

  // Bagi ke blok, tambah koreksi galat, lalu selang-seling
  const nBlok = JUMLAH_BLOK[v]; const panjangEcc = ECC_PER_BLOK[v];
  const mentah = Math.floor(modulDataMentah(v) / 8);
  const nPendek = nBlok - (mentah % nBlok);
  const panjangPendek = Math.floor(mentah / nBlok);
  const pembagi = pembagiRS(panjangEcc);
  const blok = [];
  for (let i = 0, k = 0; i < nBlok; i++) {
    const dat = data.slice(k, k + panjangPendek - panjangEcc + (i < nPendek ? 0 : 1));
    k += dat.length;
    const ecc = sisaRS(dat, pembagi);
    if (i < nPendek) dat.push(0);
    blok.push(dat.concat(ecc));
  }
  const kode = [];
  for (let i = 0; i < blok[0].length; i++) {
    blok.forEach((b, j) => { if (i !== panjangPendek - panjangEcc || j >= nPendek) kode.push(b[i]); });
  }

  // Gambar dan pilih masker terbaik
  let terbaik = null; let skorTerbaik = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const m = bangunKerangka(v);
    tempatkanKode(m, kode);
    terapkanMasker(m, mask);
    gambarFormat(m, mask);
    gambarVersi(m, v);
    const s = penalti(m);
    if (s < skorTerbaik) { skorTerbaik = s; terbaik = m; }
  }
  return terbaik.modul;
}

// SVG siap tempel (latar putih, ruang tepi 4 modul sesuai standar).
export function qrSvg(teks, { ukuran = 280, gelap = '#0B3024', terang = '#FFFFFF' } = {}) {
  const m = buatMatriksQR(teks);
  const n = m.length; const tepi = 4; const total = n + tepi * 2;
  let jalur = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (m[y][x]) jalur += `M${x + tepi},${y + tepi}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${ukuran}" height="${ukuran}" shape-rendering="crispEdges" role="img" aria-label="Kode QR"><rect width="${total}" height="${total}" fill="${terang}"/><path d="${jalur}" fill="${gelap}"/></svg>`;
}
