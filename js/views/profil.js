import { supa } from '../lib/supa.js';
import { pasangKartu } from '../lib/pasang.js';
import { layar, segeraHadir } from '../lib/kerangka.js';
import { kotakKode, pasangSalin, statusKode, teksStatus } from '../lib/pemulihan.js';
import { adalahPengurus } from '../state.js';
import { esc, tanggalId, STATUS_TANYA } from '../lib/util.js';

const ringkas = (t, n = 120) => { const s = String(t || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n).trimEnd() + '…' : s; };

export function tampil(el, ctx) {
  const p = ctx.state.profil;
  const isi = layar(el, p, {
    aktif: 'profil',
    kecil: 'Profil',
    judul: p.nama,
    kanan: `<span class="lencana lencana-isi">${adalahPengurus(p) ? 'Pengurus Aktif' : 'Warga Aktif'}</span>`,
    isi: `
      <div id="pasang"></div>
      <section class="bagian kartu-ring segera" aria-label="Tingkat Partisipasi">
        <div class="ring kosong-ring" aria-hidden="true"><div><b>–</b>dari 100</div></div>
        <div class="batang-ring">
          <div class="baris-judul"><h2>Tingkat Partisipasi</h2><span class="tag tag-garis">Segera hadir</span></div>
          <small>Hanya Anda yang akan melihat statistik ini.</small>
        </div>
      </section>
      <section class="bagian">
        <div class="baris-judul"><h2>Riwayat Pertanyaan</h2><a class="tautan-hijau" href="#/tanya">Tanya baru</a></div>
        <div id="riwayat"><p class="kosong">Memuat…</p></div>
      </section>
      ${segeraHadir('Tulisan Saya', 'Naskah yang Anda kirim dan statusnya akan tampil di sini.')}
      <section class="bagian">
        <h2>Akun</h2>
        <div class="rincian"><span>Nomor WhatsApp</span><b>+${esc(p.wa)}</b></div>
        ${p.ranting?.nama ? `<div class="rincian"><span>Ranting</span><b>NU ${esc(p.ranting.nama)}</b></div>` : ''}
      </section>
      <section class="bagian" id="kode-pemulihan">
        <h2>Kode Pemulihan</h2>
        <p class="kosong" id="status-kode">Memuat…</p>
        <div id="hasil-kode"></div>
        <button type="button" class="tombol tombol-garis" id="buat-kode" style="margin-top:12px;color:var(--hijau-tengah)" hidden>Buat kode baru</button>
      </section>
      <button type="button" class="tombol tombol-garis" id="keluar">Keluar</button>`
  });

  const bersihPasang = pasangKartu(isi.querySelector('#pasang'));
  isi.querySelector('#keluar').addEventListener('click', async () => { await supa.auth.signOut(); location.hash = '#/'; ctx.segarkan(); });
  muatRiwayat(isi.querySelector('#riwayat'));
  kodePemulihan(isi);
  return bersihPasang;
}

async function muatRiwayat(kotak) {
  const { data, error } = await supa.rpc('riwayat_saya');
  if (error) { kotak.innerHTML = '<p class="galat">Riwayat belum bisa dimuat. Coba lagi nanti.</p>'; return; }
  if (!data.length) { kotak.innerHTML = '<p class="kosong">Belum ada pertanyaan. Pertanyaan yang Anda kirim akan tampil di sini beserta statusnya.</p>'; return; }
  kotak.innerHTML = data.map((q) => `
    <div class="baris baris-atas">
      <div class="teks">
        <span class="tag-baris"><span class="tag">${esc(q.rubrik)}</span><span class="status status-${esc(q.status)}">● ${esc(STATUS_TANYA[q.status] || q.status)}</span></span>
        <strong class="isi-ringkas">${esc(ringkas(q.isi))}</strong>
        <small>${q.status === 'terjawab' && q.diterbitkan_pada ? `Terbit ${esc(tanggalId(q.diterbitkan_pada))}` : `Dikirim ${esc(tanggalId(q.dibuat_pada))}`}</small>
        ${q.jawaban_id ? `<a class="tautan-hijau" href="#/jawaban/${esc(q.jawaban_id)}">Baca jawaban</a>` : ''}
      </div>
    </div>`).join('');
}

async function kodePemulihan(isi) {
  const status = isi.querySelector('#status-kode');
  const tombol = isi.querySelector('#buat-kode');
  const hasil = isi.querySelector('#hasil-kode');
  const s = await statusKode();
  if (s === undefined) { status.textContent = 'Status kode belum bisa dimuat.'; return; }
  status.textContent = 'Kode ini dipakai bila Anda lupa kata sandi. ' + (s ? '' : 'Anda belum punya kode. ') + teksStatus(s);
  tombol.hidden = false;
  tombol.textContent = s ? 'Buat kode baru' : 'Buat kode pemulihan';
  tombol.addEventListener('click', async () => {
    if (s && !confirm('Kode lama tidak akan berlaku lagi. Lanjutkan?')) return;
    tombol.disabled = true;
    const { data, error } = await supa.rpc('buat_kode_pemulihan');
    tombol.disabled = false;
    if (error || !data) { hasil.innerHTML = '<p class="galat">Kode belum bisa dibuat. Coba lagi nanti.</p>'; return; }
    hasil.innerHTML = kotakKode(data);
    pasangSalin(hasil);
    status.textContent = 'Kode baru sudah dibuat. Simpan sekarang.';
    tombol.hidden = true;
  });
}
