import { adalahPengurus } from '../state.js';
import * as panel from './panel-pengurus.js';
import * as ruang from './ruang-warga.js';

// Halaman awal setelah masuk: pengurus ke Panel, warga ke Beranda.
export function tampil(el, ctx) {
  return adalahPengurus(ctx.state.profil) ? panel.tampil(el, ctx) : ruang.tampil(el, ctx);
}
