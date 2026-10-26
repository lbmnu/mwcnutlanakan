import { supa } from '../lib/supa.js';
import { layar } from '../lib/kerangka.js';
import { bisaSetujui, adalahPengurus } from '../state.js';
import { esc } from '../lib/util.js';
import { sesiAktif, judulSesi, ambilKartu } from '../lib/absen.js';
import { bisaPindai, bukaPemindai } from '../lib/pindai.js';

const CARA = { majelis: 'QR/kode majelis', kartu: 'Kartu Saya', manual: 'Manual' };
const jam = (iso) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });

// Pengurus: pindai Kartu Saya warga, catat manual, dan lihat siapa saja yang sudah hadir.
export async function tampil(el, ctx) {
  const saya = ctx.state.profil;
  if (!adalahPengurus(saya)) { ctx.pindah('/dasbor'); return; }
  const isi = layar(el, saya, {
    aktif: 'panel',
    kecil: 'Pencatatan oleh pengurus',
    judul: 'Kehadiran Rutinan',
    peran: false,
    isi: '<section class="bagian"><p class="kosong">Memuat…</p></section>'
  });
  let hidup = true;
  const sesi = await sesiAktif();
  if (!hidup) return;
  if (!sesi || sesi.status !== 'buka') {
    isi.innerHTML = `<section class="bagian"><h2>Sesi belum dibuka</h2><p class="kosong">Pencatatan hanya bisa dilakukan saat sesi absen dibuka (oleh Ketua, Wakil Ketua, Sekretaris, atau admin dari Panel).</p></section><a class="tombol tombol-hijau" href="#/dasbor">Ke Panel</a>`;
    return;
  }

  let warga = []; let hadir = new Map(); let tab = 'pindai';
  async function muat() {
    const [w, a] = await Promise.all([
      supa.from('profil').select('id,nama,wa,ranting(nama)').eq('status', 'aktif').order('nama', { ascending: true }),
      supa.from('absensi').select('profil_id,cara,waktu').eq('sesi_id', sesi.id).order('waktu', { ascending: false })
    ]);
    if (w.error || a.error) return false;
    warga = w.data; hadir = new Map(a.data.map((x) => [x.profil_id, x]));
    return true;
  }
  const namaDari = (id) => warga.find((x) => x.id === id)?.nama || 'Warga';

  function rangka() {
    isi.innerHTML = `
      <section class="bagian">
        <div class="baris-judul"><h2>${esc(judulSesi(sesi))}</h2><span class="tag" id="jml">${hadir.size} hadir</span></div>
        <div class="tab" role="tablist" style="margin-top:12px">
          <button type="button" role="tab" data-t="pindai" aria-selected="${tab === 'pindai'}">Pindai Kartu</button>
          <button type="button" role="tab" data-t="manual" aria-selected="${tab === 'manual'}">Catat Manual</button>
          <button type="button" role="tab" data-t="hadir" aria-selected="${tab === 'hadir'}">Hadir <b>${hadir.size}</b></button>
        </div>
      </section>
      <div id="badan"></div>`;
    isi.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.t; rangka(); isi_tab(); }));
  }

  function isi_tab() {
    const badan = isi.querySelector('#badan');
    if (tab === 'pindai') {
      badan.innerHTML = `
        <section class="bagian">
          <h2>Pindai Kartu Saya</h2>
          <p class="kosong">Minta warga membuka <b>Profil → Kartu Saya</b> lalu arahkan kamera ke QR-nya. Bisa memindai berurutan.</p>
          <button type="button" class="tombol tombol-hijau" id="buka-kamera" style="margin-top:12px">Buka Kamera</button>
          <p class="kosong" id="p-info"${bisaPindai() ? ' hidden' : ''}>Pemindai belum didukung HP ini. Gunakan tab <b>Catat Manual</b>.</p>
        </section>`;
      badan.querySelector('#buka-kamera').addEventListener('click', () => {
        if (!bisaPindai()) { badan.querySelector('#p-info').hidden = false; return; }
        const pem = bukaPemindai({
          judul: 'Pindai Kartu Saya', petunjuk: 'Arahkan kamera ke QR di Kartu Saya milik warga.',
          saatBaca: async (teks) => {
            const k = ambilKartu(teks);
            if (!k) return 'Bukan QR Kartu Saya. Coba lagi.';
            const { data, error } = await supa.rpc('absen_kartu', { p_profil: k.id, p_kode: k.kode });
            if (error) return 'Belum berhasil. Periksa koneksi.';
            if (data === 'ok') { await muat(); pem.pesan(`✓ ${namaDari(k.id)} tercatat hadir. Pindai warga berikutnya.`); return undefined; }
            if (data === 'sudah') return `${namaDari(k.id)} sudah tercatat sebelumnya.`;
            if (data === 'terkunci') return 'Terlalu banyak salah. Tunggu 10 menit.';
            return 'Kartu kedaluwarsa. Minta warga memuat ulang Kartu Saya.';
          }
        });
      });
    } else if (tab === 'manual') {
      badan.innerHTML = `
        <section class="bagian">
          <h2>Catat Manual</h2>
          <div class="kolom" style="margin-top:8px"><label for="cari" class="judul-kolom">Cari nama atau nomor WA</label><input id="cari" type="text" autocomplete="off" placeholder="Ketik minimal 2 huruf"></div>
          <p class="galat" id="m-galat" hidden></p>
          <div id="hasil"></div>
        </section>`;
      const cari = badan.querySelector('#cari'); const hasil = badan.querySelector('#hasil');
      const gambar = () => {
        const q = cari.value.trim().toLowerCase().replace(/^\+/, '');
        if (q.length < 2) { hasil.innerHTML = ''; return; }
        const cocok = warga.filter((x) => x.nama.toLowerCase().includes(q) || x.wa.includes(q.replace(/^0/, '62'))).slice(0, 8);
        hasil.innerHTML = cocok.length ? cocok.map((x) => `
          <div class="baris" data-id="${esc(x.id)}">
            <div class="teks"><strong>${esc(x.nama)}</strong><small>${x.ranting?.nama ? 'Ranting NU ' + esc(x.ranting.nama) : ''}</small></div>
            <div class="aksi">${hadir.has(x.id) ? '<span class="tag tag-hadir">Hadir ✓</span>' : '<button type="button" class="tombol tombol-hijau tombol-kecil" data-h>Hadirkan</button>'}</div>
          </div>`).join('') : '<p class="kosong">Tidak ada akun aktif yang cocok.</p>';
      };
      cari.addEventListener('input', gambar);
      hasil.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-h]'); if (!b) return;
        const id = b.closest('.baris').dataset.id; b.disabled = true;
        const { data, error } = await supa.rpc('absen_manual', { p_profil: id });
        const gal = badan.querySelector('#m-galat');
        if (error || (data !== 'ok' && data !== 'sudah')) { b.disabled = false; gal.textContent = 'Belum berhasil dicatat. Coba lagi.'; gal.hidden = false; return; }
        gal.hidden = true; await muat(); gambar(); isi.querySelector('#jml').textContent = `${hadir.size} hadir`;
      });
    } else {
      const daftar = [...hadir.entries()];
      badan.innerHTML = `
        <section class="bagian">
          <h2>Sudah hadir</h2>
          ${daftar.length ? daftar.map(([id, a]) => `
            <div class="baris" data-id="${esc(id)}">
              <div class="teks"><strong>${esc(namaDari(id))}</strong><small>${esc(CARA[a.cara] || a.cara)} · ${esc(jam(a.waktu))}</small></div>
              ${bisaSetujui(saya) ? '<div class="aksi"><button type="button" class="tombol tombol-garis tombol-kecil" style="color:var(--bata)" data-b>Batalkan</button></div>' : ''}
            </div>`).join('') : '<p class="kosong">Belum ada yang tercatat.</p>'}
        </section>`;
      badan.onclick = async (e) => {
        const b = e.target.closest('[data-b]'); if (!b) return;
        const id = b.closest('.baris').dataset.id;
        if (!confirm(`Batalkan kehadiran ${namaDari(id)}?`)) return;
        b.disabled = true;
        const { error } = await supa.rpc('batalkan_absen', { p_profil: id });
        if (error) { b.disabled = false; alert('Belum berhasil. Coba lagi.'); return; }
        await muat(); rangka(); isi_tab();
      };
    }
  }

  if (!(await muat())) { isi.innerHTML = '<section class="bagian"><p class="galat">Data belum bisa dimuat. Periksa koneksi lalu coba lagi.</p></section>'; return; }
  rangka(); isi_tab();
  return () => { hidup = false; };
}
