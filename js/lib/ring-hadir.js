import { supa } from './supa.js';

// Cincin kehadiran pribadi: pertemuan yang dihadiri dari 6 sesi terakhir sejak akun dibuat.
export async function pasangRingHadir(kotak) {
  const { data, error } = await supa.rpc('kehadiran_saya');
  if (!kotak.isConnected) return;
  const b = Array.isArray(data) ? data[0] : data;
  if (error || !b) { kotak.innerHTML = '<p class="kosong">Kehadiran belum bisa dimuat.</p>'; return; }
  const { hadir, total } = b;
  const persen = total ? Math.round((hadir / total) * 100) : null;
  kotak.innerHTML = `
    <div class="ring${persen === null ? ' kosong-ring' : ''}" style="--p:${persen ?? 0}%" aria-hidden="true"><div><b>${persen === null ? '–' : persen}</b>${persen === null ? 'belum ada' : 'persen'}</div></div>
    <div class="batang-ring">
      <div class="baris-judul"><h2>Kehadiran Rutinan</h2></div>
      <small>${total ? `Hadir ${hadir} dari ${total} pertemuan terakhir` : 'Belum ada pertemuan tercatat sejak akun Anda dibuat'}</small>
      <i><u style="width:${persen ?? 0}%"></u></i>
      <small>Keaktifan musyawarah dan tulisan menyusul. Hanya Anda yang melihat ini.</small>
    </div>`;
}
