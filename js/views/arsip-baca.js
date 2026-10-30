import { supa } from '../lib/supa.js';
import { pasangMenu } from '../lib/kerangka.js';
import { bisaSetujui, adalahAdmin } from '../state.js';
import { esc, tanggalId, paragraf, pesanGalat } from '../lib/util.js';

export async function tampil(el, ctx) {
  const id = ctx.params.id;
  const boleh = bisaSetujui(ctx.state.profil);
  el.innerHTML = `
  <div class="dalam-krem ada-menu">
    <header class="bilah-hijau">
      <div class="salam"><small>Arsip Rutinan</small><strong id="judul-arsip">Memuat…</strong></div>
      <a class="lencana" href="#/arsip">Semua arsip</a>
    </header>
    <main class="isi"><div id="badan"><p class="kosong">Memuat…</p></div></main>
  </div>
  <div class="lihat-foto" id="lihat" hidden><button type="button" class="tutup-foto" id="tutup-foto" aria-label="Tutup foto">×</button><img id="foto-besar" alt=""></div>`;
  pasangMenu(el, ctx.state.profil, 'beranda');
  const badan = el.querySelector('#badan');
  const { data, error } = await supa.rpc('arsip_detail', { p_id: id });
  if (error) { badan.innerHTML = '<p class="galat">Arsip belum bisa dimuat. Periksa koneksi lalu coba lagi.</p>'; return; }
  const a = data && data[0];
  if (!a) { el.querySelector('#judul-arsip').textContent = 'Tidak ditemukan'; badan.innerHTML = '<section class="bagian"><p class="kosong">Arsip ini tidak ada atau sudah dihapus.</p></section>'; return; }
  el.querySelector('#judul-arsip').textContent = a.judul;

  const r = a.rekap;
  const rekap = r ? `
    <section class="bagian">
      <h2>Kehadiran</h2>
      <div class="kas-mini"><b>${r.total_hadir}</b><small>warga hadir dari ${r.total_warga} warga terdaftar</small></div>
      ${(r.ranting || []).map((x) => { const p = x.warga ? Math.round((x.hadir / x.warga) * 100) : 0; return `<div class="batang"><span>${esc(x.nama)}</span><i style="--w:${p}%"></i><b>${p}%</b></div>`; }).join('')}
      <p class="kosong">Persentase warga tiap ranting yang hadir. Rekap dihitung saat arsip disimpan.</p>
    </section>` : '';

  badan.innerHTML = `
    <section class="bagian">
      <small>${esc(tanggalId(a.tanggal))}${a.tempat ? ' · ' + esc(a.tempat) : ''}</small>
      ${a.ringkasan ? `<div class="teks-baca">${paragraf(a.ringkasan)}</div>` : '<p class="kosong">Belum ada ringkasan.</p>'}
      <small>Diarsipkan oleh ${esc(a.pembuat || '—')}</small>
      ${boleh ? `<div class="baris-tombol" style="margin-top:8px"><a class="tombol tombol-garis tombol-kecil" style="color:var(--hijau-tengah)" href="#/panel/arsip/${esc(a.id)}">Ubah arsip dan foto</a>${adalahAdmin(ctx.state.profil) ? '<button type="button" class="tautan-tombol tautan-bata" id="hapus">Hapus arsip</button>' : ''}</div><p class="galat" id="galat" hidden></p>` : ''}
    </section>
    ${a.foto.length ? `<section class="bagian"><h2>Foto (${a.foto.length})</h2><div class="kisi-foto" id="kisi"></div></section>` : ''}
    ${rekap}`;

  if (a.foto.length) {
    const { data: tanda, error: eg } = await supa.storage.from('arsip').createSignedUrls(a.foto.map((f) => f.path), 3600);
    const peta = new Map((tanda || []).map((t) => [t.path, t.signedUrl]));
    const kisi = badan.querySelector('#kisi');
    if (eg || !tanda) kisi.innerHTML = '<p class="galat">Foto belum bisa dimuat.</p>';
    else kisi.innerHTML = a.foto.map((f, i) => { const u = peta.get(f.path); return u ? `<button type="button" class="kotak-foto" data-i="${i}" aria-label="Buka foto ${i + 1}"><img src="${esc(u)}" alt="Foto rutinan ${i + 1}" loading="lazy"></button>` : ''; }).join('');
    kisi.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]'); if (!b) return;
      el.querySelector('#foto-besar').src = b.querySelector('img').src; el.querySelector('#lihat').hidden = false;
    });
  }
  el.querySelector('#lihat').addEventListener('click', () => { el.querySelector('#lihat').hidden = true; });

  badan.querySelector('#hapus')?.addEventListener('click', async (e) => {
    if (!confirm('Hapus arsip ini beserta semua fotonya? Tidak bisa dikembalikan.')) return;
    e.target.disabled = true;
    const { data: paths, error: eh } = await supa.rpc('hapus_arsip', { p_id: id });
    if (eh) { e.target.disabled = false; const g = badan.querySelector('#galat'); g.textContent = pesanGalat(eh); g.hidden = false; return; }
    if (paths && paths.length) await supa.storage.from('arsip').remove(paths);
    ctx.pindah('/arsip');
  });
}
