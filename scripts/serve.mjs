// Server lokal sederhana untuk mencoba situs di laptop: npm start, lalu buka http://localhost:8080
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const jenis = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const port = Number(process.env.PORT) || 8080;

createServer(async (req, res) => {
  try {
    let jalur = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (jalur.endsWith('/')) jalur += 'index.html';
    const berkas = normalize(resolve(akar, '.' + jalur));
    if (!berkas.startsWith(akar)) { res.writeHead(403).end(); return; }
    const isi = await readFile(berkas);
    res.writeHead(200, { 'Content-Type': jenis[extname(berkas)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(isi);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Tidak ditemukan'); }
}).listen(port, () => console.log(`Situs berjalan di http://localhost:${port}`));
