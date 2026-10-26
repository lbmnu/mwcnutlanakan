import { supa } from '../lib/supa.js';
import { layar, ikonSvg, KATEGORI_KAS } from '../lib/kerangka.js';
import { bisaKas } from '../state.js';
import { esc, pesanGalat, rp, rpTanda, hariIniWib, bulanTahun, tanggalId, tautanWa } from '../lib/util.js';

const BATAS = 40;
const tgl = (iso) => tanggalId(`${iso}T12:00:00`, true);

function barisKas(t, boleh) {
  const masuk = t.jenis === 'masuk';
  const asal = t.asal ? `${esc(t.asal)} · ` : '';
  return `
  <div class="transaksi${t.batal ? ' batal' : ''}" data-id="${esc(t.id)}">
    <span class="ubin-bulat ${masuk ? 'hijau' : 'merah'}" aria-hidden="true">${ikonSvg(masuk ? 'masuk' : 'keluar')}</span>
    <div>
      <strong>${esc(t.kategori)}</strong>
      <small>${asal}${esc(tgl(t.tanggal))}</small>
      ${t.keterangan ? `<small>${esc(t.keterangan)}</small>` : ''}
      ${t.batal ? `<small class="alasan-batal">Dibatalkan: ${esc(t.alasan_batal || '-')}</small>` : `<small class="pencatat">Dicatat ${esc(t.pencatat)}</small>`}
      ${boleh && !t.batal ? `<button type="button" class="tautan-tombol tautan-bata" data-batal="${esc(t.id)}">Batalkan</button>` : ''}
      <div class="form-batal" hidden></div>
    </div>
    <b class="${masuk ? 'masuk-kas' : 'keluar-kas'}">${masuk ? '+' : '−'}${esc(rp(t.jumlah))}</b>
  </div>`;
}

export function tampil(el, ctx) {
  const saya = ctx.state.profil;
  const boleh = bisaKas(saya);
  const isi = layar(el, saya, {
    aktif: 'kas',
    kecil: 'Transparansi lembaga',
    judul: 'Laporan Kas LBM',
    peran: false,
    isi: `
      <section class="bagian kartu-gelap kartu-saldo">
        <div class="baris-judul"><small>Saldo kas saat ini</small></div>
        <h2 class="saldo" id="saldo">Rp …</h2>
        <small id="catatan-saldo">Memuat…</small>
      </section>
      <div class="dua-angka">
        <div class="bagian"><small>Total Pemasukan</small><b class="masuk-kas" id="tot-masuk">Rp …</b></div>
        <div class="bagian"><small>Total Pengeluaran</small><b class="keluar-kas" id="tot-keluar">Rp …</b></div>
      </div>
      ${boleh ? `
      <section class="bagian" id="catat">
        <div class="baris-judul"><h2>Catat Kas</h2><button type="button" class="tombol tombol-hijau tombol-kecil" id="buka-form" aria-expanded="false">Catat</button></div>
        <form class="form-kas" id="form-kas" novalidate hidden>
          <div class="tab" role="tablist">
            <button type="button" role="tab" data-jenis="masuk" aria-selected="true">Pemasukan</button>
            <button type="button" role="tab" data-jenis="keluar" aria-selected="false">Pengeluaran</button>
          </div>
          <div class="kolom"><label for="k-kategori">Kategori</label><select id="k-kategori"></select></div>
          <div class="kolom"><label for="k-tanggal">Tanggal</label><input id="k-tanggal" type="date" required></div>
          <div class="kolom"><label for="k-jumlah">Nominal (Rupiah)</label><input id="k-jumlah" type="text" inputmode="numeric" autocomplete="off" placeholder="Mis. 150.000"></div>
          <div class="kolom"><label for="k-asal" id="l-asal">Diterima dari (boleh dikosongkan)</label><input id="k-asal" type="text" maxlength="80" list="daftar-ranting" autocomplete="off" placeholder="Mis. Rutinan Ranting Ambat"><datalist id="daftar-ranting"></datalist></div>
          <div class="kolom"><label for="k-ket" id="l-ket">Keterangan (boleh dikosongkan)</label><input id="k-ket" type="text" maxlength="200" autocomplete="off"></div>
          <p class="galat" id="k-galat" role="alert" hidden></p>
          <button type="submit" class="tombol tombol-hijau" id="k-simpan">Simpan Catatan</button>
          <p class="petunjuk-kas">Catatan tidak bisa dihapus. Bila keliru, tekan Batalkan pada catatannya agar riwayat tetap utuh dan terbuka untuk warga.</p>
        </form>
        <p class="sukses" id="k-sukses" role="status" hidden>Catatan tersimpan.</p>
      </section>` : ''}
      <section class="bagian" id="rekap">
        <div class="baris-judul"><h2>Rekap per Bulan</h2><button type="button" class="tautan-hijau tautan-tombol" id="semua-bulan" hidden>Semua bulan</button></div>
        <div id="isi-rekap"><p class="kosong">Memuat…</p></div>
      </section>
      <section class="bagian">
        <div class="baris-judul"><h2 id="judul-rincian">Rincian Transaksi</h2>${boleh ? '<button type="button" class="tautan-hijau tautan-tombol" id="bagikan">Bagikan ke WA</button>' : ''}</div>
        <div class="tab" role="tablist" style="margin-top:10px">
          <button type="button" role="tab" data-saring="" aria-selected="true">Semua</button>
          <button type="button" role="tab" data-saring="masuk" aria-selected="false">Pemasukan</button>
          <button type="button" role="tab" data-saring="keluar" aria-selected="false">Pengeluaran</button>
        </div>
        <div id="daftar"><p class="kosong">Memuat…</p></div>
        <button type="button" class="tombol tombol-garis" id="lagi" hidden style="margin-top:10px">Muat lebih banyak</button>
      </section>`
  });

  const q = (s) => isi.querySelector(s);
  let ringkas = null; let rekap = []; let bulan = null; let jenis = ''; let lewat = 0;

  // ---------- Ringkasan dan rekap ----------
  async function muatRingkasan() {
    const [r, b] = await Promise.all([supa.rpc('kas_ringkasan'), supa.rpc('kas_rekap_bulanan')]);
    if (r.error || b.error || !r.data?.[0]) {
      q('#catatan-saldo').textContent = 'Laporan belum bisa dimuat. Periksa sinyal lalu muat ulang.';
      q('#isi-rekap').innerHTML = '<p class="galat">Rekap belum bisa dimuat.</p>';
      return false;
    }
    ringkas = r.data[0]; rekap = b.data || [];
    q('#saldo').textContent = rpTanda(ringkas.saldo);
    q('#tot-masuk').textContent = rp(ringkas.masuk);
    q('#tot-keluar').textContent = rp(ringkas.keluar);
    q('#catatan-saldo').textContent = ringkas.jumlah_catatan > 0
      ? `Bulan ini: masuk ${rp(ringkas.masuk_bulan)}, keluar ${rp(ringkas.keluar_bulan)}`
      : 'Belum ada catatan kas.';
    gambarRekap();
    return true;
  }

  function gambarRekap() {
    const w = q('#isi-rekap');
    q('#semua-bulan').hidden = !bulan;
    if (!rekap.length) { w.innerHTML = '<p class="kosong">Belum ada catatan. Rekap bulanan muncul setelah Bendahara mulai mencatat.</p>'; return; }
    w.innerHTML = rekap.map((m) => `
      <button type="button" class="rekap-baris" data-bulan="${esc(m.bulan)}" aria-pressed="${bulan === m.bulan}">
        <strong>${esc(bulanTahun(m.bulan))}</strong>
        <span class="masuk-kas">+${esc(rp(m.masuk))}</span>
        <span class="keluar-kas">−${esc(rp(m.keluar))}</span>
      </button>`).join('');
  }

  // ---------- Daftar transaksi ----------
  async function muatDaftar(tambah = false) {
    const wadah = q('#daftar');
    if (!tambah) { lewat = 0; wadah.innerHTML = '<p class="kosong">Memuat…</p>'; }
    q('#judul-rincian').textContent = bulan ? `Transaksi ${bulanTahun(bulan)}` : 'Rincian Transaksi';
    const { data, error } = await supa.rpc('kas_daftar', { p_bulan: bulan, p_jenis: jenis || null, p_batas: BATAS, p_lewat: lewat });
    if (error) { if (!tambah) wadah.innerHTML = '<p class="galat">Rincian belum bisa dimuat. Coba lagi nanti.</p>'; return; }
    const html = (data || []).map((t) => barisKas(t, boleh)).join('');
    if (!tambah) wadah.innerHTML = html || '<p class="kosong">Tidak ada catatan untuk pilihan ini.</p>';
    else wadah.insertAdjacentHTML('beforeend', html);
    lewat += (data || []).length;
    q('#lagi').hidden = (data || []).length < BATAS;
  }

  const segarkan = async () => { await muatRingkasan(); await muatDaftar(); };

  isi.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.bulan) { bulan = bulan === b.dataset.bulan ? null : b.dataset.bulan; gambarRekap(); muatDaftar(); return; }
    if (b.id === 'semua-bulan') { bulan = null; gambarRekap(); muatDaftar(); return; }
    if (b.dataset.saring !== undefined) {
      jenis = b.dataset.saring;
      isi.querySelectorAll('[data-saring]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      muatDaftar(); return;
    }
    if (b.id === 'lagi') { b.disabled = true; await muatDaftar(true); b.disabled = false; return; }
    if (b.id === 'bagikan') { bagikan(); return; }
    if (b.dataset.batal) { bukaFormBatal(b); }
  });

  // ---------- Batalkan ----------
  function bukaFormBatal(tombol) {
    const baris = tombol.closest('.transaksi');
    const f = baris.querySelector('.form-batal');
    tombol.hidden = true; f.hidden = false;
    f.innerHTML = `
      <label class="judul-kolom" for="al-${esc(tombol.dataset.batal)}">Alasan pembatalan</label>
      <input type="text" id="al-${esc(tombol.dataset.batal)}" maxlength="200" autocomplete="off" placeholder="Mis. salah nominal">
      <p class="galat" role="alert" hidden></p>
      <div class="baris-tombol"><button type="button" class="tombol tombol-hijau tombol-kecil" data-yakin>Batalkan catatan</button><button type="button" class="tombol tombol-garis tombol-kecil" data-urung>Urungkan</button></div>`;
    const input = f.querySelector('input'); input.focus();
    f.querySelector('[data-urung]').addEventListener('click', () => { f.hidden = true; f.innerHTML = ''; tombol.hidden = false; });
    f.querySelector('[data-yakin]').addEventListener('click', async (ev) => {
      const galat = f.querySelector('.galat'); galat.hidden = true;
      if (input.value.trim().length < 3) { galat.textContent = 'Alasan pembatalan wajib diisi.'; galat.hidden = false; return; }
      ev.target.disabled = true;
      const { error } = await supa.rpc('batalkan_kas', { p_id: tombol.dataset.batal, p_alasan: input.value.trim() });
      if (error) { galat.textContent = pesanGalat(error); galat.hidden = false; ev.target.disabled = false; return; }
      segarkan();
    });
  }

  // ---------- Bagikan ke WA ----------
  function bagikan() {
    if (!ringkas) return;
    const m = bulan ? rekap.find((x) => x.bulan === bulan) : null;
    const masuk = m ? m.masuk : ringkas.masuk;
    const keluar = m ? m.keluar : ringkas.keluar;
    const teks = [
      'Assalamu’alaikum Wr. Wb.',
      '',
      '*Laporan Kas LBM MWCNU Tlanakan*',
      `Periode: ${bulan ? bulanTahun(bulan) : 'Seluruhnya'}`,
      `Pemasukan: ${rp(masuk)}`,
      `Pengeluaran: ${rp(keluar)}`,
      `Saldo kas saat ini: ${rpTanda(ringkas.saldo)}`,
      '',
      `Rincian lengkap (perlu masuk): ${location.origin}${location.pathname}#/kas`,
      '',
      'Wassalamu’alaikum Wr. Wb.'
    ].join('\n');
    window.open(tautanWa(teks), '_blank', 'noopener');
  }

  // ---------- Form catat (Bendahara, Ketua, Wakil Ketua, admin) ----------
  if (boleh) {
    const f = q('#form-kas'); const tombolBuka = q('#buka-form');
    let jenisForm = 'masuk';
    const kategori = q('#k-kategori'); const jumlah = q('#k-jumlah'); const galat = q('#k-galat'); const sukses = q('#k-sukses');
    q('#k-tanggal').value = hariIniWib(); q('#k-tanggal').max = hariIniWib();

    function aturJenis() {
      f.querySelectorAll('[data-jenis]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.jenis === jenisForm)));
      kategori.innerHTML = KATEGORI_KAS[jenisForm].map((k) => `<option>${esc(k)}</option>`).join('');
      q('#l-asal').textContent = jenisForm === 'masuk' ? 'Diterima dari (boleh dikosongkan)' : 'Dibayarkan kepada (boleh dikosongkan)';
      q('#k-asal').placeholder = jenisForm === 'masuk' ? 'Mis. Rutinan Ranting Ambat' : 'Mis. Toko ATK';
      aturKet();
    }
    function aturKet() {
      const wajib = kategori.value === 'Lain-lain';
      q('#l-ket').textContent = wajib ? 'Keterangan (wajib untuk Lain-lain)' : 'Keterangan (boleh dikosongkan)';
    }
    aturJenis();
    f.querySelectorAll('[data-jenis]').forEach((b) => b.addEventListener('click', () => { jenisForm = b.dataset.jenis; aturJenis(); }));
    kategori.addEventListener('change', aturKet);
    jumlah.addEventListener('input', () => {
      const angka = jumlah.value.replace(/\D/g, '').slice(0, 12);
      jumlah.value = angka ? Number(angka).toLocaleString('id-ID') : '';
    });
    tombolBuka.addEventListener('click', () => {
      f.hidden = !f.hidden; tombolBuka.setAttribute('aria-expanded', String(!f.hidden));
      tombolBuka.textContent = f.hidden ? 'Catat' : 'Tutup';
      sukses.hidden = true;
      if (!f.hidden) jumlah.focus();
    });
    supa.from('ranting').select('nama').order('nama', { ascending: true }).then(({ data }) => {
      q('#daftar-ranting').innerHTML = (data || []).map((r) => `<option value="Ranting NU ${esc(r.nama)}"></option>`).join('');
    });

    f.addEventListener('submit', async (e) => {
      e.preventDefault(); galat.hidden = true; sukses.hidden = true;
      const nominal = Number(jumlah.value.replace(/\D/g, ''));
      const tanggal = q('#k-tanggal').value;
      if (!nominal) { galat.textContent = 'Isi nominal dalam Rupiah.'; galat.hidden = false; jumlah.focus(); return; }
      if (!tanggal) { galat.textContent = 'Pilih tanggal.'; galat.hidden = false; return; }
      if (kategori.value === 'Lain-lain' && !q('#k-ket').value.trim()) { galat.textContent = 'Keterangan wajib diisi untuk pengeluaran Lain-lain.'; galat.hidden = false; q('#k-ket').focus(); return; }
      const tombol = q('#k-simpan'); tombol.disabled = true; tombol.textContent = 'Menyimpan…';
      const { error } = await supa.rpc('catat_kas', {
        p_tanggal: tanggal, p_jenis: jenisForm, p_kategori: kategori.value, p_jumlah: nominal,
        p_asal: q('#k-asal').value.trim(), p_keterangan: q('#k-ket').value.trim()
      });
      tombol.disabled = false; tombol.textContent = 'Simpan Catatan';
      if (error) { galat.textContent = pesanGalat(error); galat.hidden = false; return; }
      jumlah.value = ''; q('#k-asal').value = ''; q('#k-ket').value = '';
      sukses.textContent = `Tersimpan: ${jenisForm === 'masuk' ? 'pemasukan' : 'pengeluaran'} ${rp(nominal)}.`;
      sukses.hidden = false;
      segarkan();
    });
  }

  segarkan();
}
