import { SUPABASE_URL, SUPABASE_ANON_KEY, terkonfigurasi } from '../config.js';

// window.supabase berasal dari vendor/supabase.js (diisi oleh: npm run vendor).
const pustakaAda = typeof window !== 'undefined' && window.supabase && window.supabase.createClient;

export const siap = terkonfigurasi && !!pustakaAda;
export const alasanBelumSiap = !pustakaAda
  ? 'Pustaka Supabase belum terpasang. Jalankan "npm run vendor".'
  : 'Alamat dan kunci Supabase belum diisi di js/config.js.';

export const supa = siap
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    })
  : null;
