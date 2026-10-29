import { supa } from '../lib/supa.js';
import { normalisasiWa, emailDariWa, pesanGalat, esc } from '../lib/util.js';

export async function tampil(el, ctx) {
  let tipe = 'warga';
  let ranting = [];
  const gambarKerangka = () => {
    el.innerHTML = `
    <main class="gelap">
      <a href="#/masuk" class="tautan-emas" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:#fff;font-weight:600;font-size:14px">← Masuk</a>
      <h1 style="margin:10px 0 0;font-size:26px;line-height:1.3;font-weight:800">Daftar Akun</h1>
      <p style="margin:8px 0 0;font-size:14px;line-height:1.5;color:rgba(255,255,255,.9)">Data Anda akan diverifikasi pengurus untuk menjaga keabsahan data warga.</p>

      <form class="kaca form" id="f" style="margin-top:20px" novalidate>
        <div class="kolom">
          <span class="judul-kolom" id="lbl-tipe">Saya mendaftar sebagai</span>
          <div class="pilih-dua" role="group" aria-labelledby="lbl-tipe">
            <button type="button" data-tipe="warga" aria-pressed="true">Warga NU</button>
            <button type="button" data-tipe="pengurus_struktural" aria-pressed="false">Pengurus Struktural</button>
          </div>
          <p class="petunjuk">Hanya keterangan, tidak mengubah hak akses. Akun pengurus LBM dibuatkan oleh admin.</p>
        </div>
        <div class="kolom"><label for="nama">Nama lengkap</label><input id="nama" name="nama" type="text" autocomplete="name" placeholder="Contoh: Ahmad Fauzi (nama, bukan nomor KTP)" required></div>
        <div class="kolom"><label for="wa">Nomor WhatsApp</label><input id="wa" name="wa" type="tel" inputmode="tel" autocomplete="username" placeholder="08xx, 628xx, atau +62 8xx" required></div>
        <div class="kolom"><label for="ranting">Ranting NU</label><select id="ranting" name="ranting" required><option value="">Pilih ranting</option></select></div>
        <div id="tambahan" hidden class="form">
          <div class="kolom"><label for="lembaga">Lembaga, banom, atau ranting</label>
            <select id="lembaga" name="lembaga">
              <option value="">Pilih kepengurusan</option>
              <option>Pengurus Ranting NU</option>
              <option>Lainnya</option>
            </select>
          </div>
          <div class="kolom"><label for="jabatan">Jabatan</label><input id="jabatan" name="jabatan" type="text" placeholder="Contoh: Sekretaris"></div>
        </div>
        <div class="kolom"><label for="sandi">Kata sandi</label><input id="sandi" name="sandi" type="password" autocomplete="new-password" placeholder="Minimal 8 karakter" required></div>
        <label class="centang"><input id="setuju" name="setuju" type="checkbox"><span>Saya setuju nomor WhatsApp dan data kehadiran saya dicatat, dan pengurus boleh menghubungi saya untuk silaturahmi.</span></label>
        <p id="pesan" class="galat" role="alert" hidden></p>
        <button class="tombol tombol-emas" type="submit">Kirim Pendaftaran</button>
      </form>
    </main>`;
  };
  gambarKerangka();

  const f = el.querySelector('#f');
  const pesan = el.querySelector('#pesan');
  const tombol = f.querySelector('button[type=submit]');
  const tambahan = el.querySelector('#tambahan');
  const tampilkanGalat = (t) => { pesan.textContent = t; pesan.hidden = !t; if (t) pesan.scrollIntoView({ block: 'nearest' }); };

  f.querySelectorAll('[data-tipe]').forEach((b) => b.addEventListener('click', () => {
    tipe = b.dataset.tipe;
    f.querySelectorAll('[data-tipe]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    tambahan.hidden = tipe !== 'pengurus_struktural';
  }));

  // Daftar ranting dari database (terbuka untuk umum).
  if (ctx.siap) {
    const { data } = await supa.from('ranting').select('id,nama').order('nama');
    ranting = data || [];
    f.ranting.innerHTML = '<option value="">Pilih ranting</option>' + ranting.map((r) => `<option value="${r.id}">Ranting NU ${esc(r.nama)}</option>`).join('');
  }

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    tampilkanGalat('');
    if (!ctx.siap) return tampilkanGalat('Situs belum dihubungkan ke database. ' + ctx.alasanBelumSiap);
    const nama = f.nama.value.trim().replace(/\s+/g, ' ');
    const wa = normalisasiWa(f.wa.value);
    if (nama.length < 2) return tampilkanGalat('Nama lengkap belum diisi.');
    if (!/\p{L}/u.test(nama) || /^[\d\s.\-]+$/.test(nama)) return tampilkanGalat('Tulis nama lengkap dengan huruf, bukan nomor (NIK/KTP).');
    if (!wa) return tampilkanGalat('Nomor WhatsApp tidak valid. Boleh ditulis 08xx, 628xx, atau +62 8xx.');
    if (!f.ranting.value) return tampilkanGalat('Ranting NU belum dipilih.');
    if (tipe === 'pengurus_struktural' && (!f.lembaga.value || !f.jabatan.value.trim())) return tampilkanGalat('Lengkapi kepengurusan dan jabatan Anda.');
    if (f.sandi.value.length < 8) return tampilkanGalat('Kata sandi minimal 8 karakter.');
    if (!f.setuju.checked) return tampilkanGalat('Centang persetujuan pencatatan data terlebih dahulu.');

    tombol.disabled = true; tombol.textContent = 'Mengirim…';
    const { data: hasilDaftar, error } = await supa.auth.signUp({
      email: emailDariWa(wa),
      password: f.sandi.value,
      options: {
        data: {
          nama, wa,
          ranting_id: f.ranting.value,
          tipe,
          lembaga: tipe === 'pengurus_struktural' ? f.lembaga.value : '',
          jabatan_lembaga: tipe === 'pengurus_struktural' ? f.jabatan.value.trim() : ''
        }
      }
    });
    if (error) {
      tombol.disabled = false; tombol.textContent = 'Kirim Pendaftaran';
      return tampilkanGalat(pesanGalat(error));
    }
    // Kode pemulihan dibuat sekarang, ditampilkan sekali di layar berikutnya.
    if (hasilDaftar?.session) {
      const { data: kode } = await supa.rpc('buat_kode_pemulihan');
      if (kode) ctx.state.kodeBaru = kode;
    }
    // Bila konfirmasi email dimatikan (sesuai README), sesi langsung aktif dan layar "menunggu" tampil.
    await ctx.segarkan();
  });
}
