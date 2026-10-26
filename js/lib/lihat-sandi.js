// Menambahkan tombol "Lihat" / "Sembunyi" pada setiap kolom kata sandi, di semua halaman.
function tambah(input) {
  if (input.dataset.lihat) return;
  input.dataset.lihat = '1';
  const bungkus = document.createElement('div');
  bungkus.className = 'kolom-sandi';
  input.parentNode.insertBefore(bungkus, input);
  bungkus.appendChild(input);
  const t = document.createElement('button');
  t.type = 'button';
  t.className = 'lihat-sandi';
  t.textContent = 'Lihat';
  t.setAttribute('aria-label', 'Tampilkan kata sandi');
  t.setAttribute('aria-pressed', 'false');
  t.addEventListener('click', () => {
    const buka = input.type === 'password';
    input.type = buka ? 'text' : 'password';
    t.textContent = buka ? 'Sembunyi' : 'Lihat';
    t.setAttribute('aria-label', buka ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
    t.setAttribute('aria-pressed', String(buka));
  });
  bungkus.appendChild(t);
}

export function pasangLihatSandi(akar) {
  const pindai = () => akar.querySelectorAll('input[type=password]:not([data-lihat])').forEach(tambah);
  new MutationObserver(pindai).observe(akar, { childList: true, subtree: true });
  pindai();
}
