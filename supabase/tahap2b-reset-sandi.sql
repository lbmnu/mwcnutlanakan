-- =====================================================================
-- LBM MWCNU Tlanakan : reset kata sandi mandiri lewat KODE PEMULIHAN
-- Jalankan SEKALI di Supabase SQL Editor (setelah schema.sql dan tahap2).
-- Aman dijalankan ulang.
--
-- Cara kerja:
--  * Tiap akun punya satu kode pemulihan (12 huruf/angka) yang hanya ditampilkan
--    SEKALI saat dibuat. Database hanya menyimpan sidik (hash), bukan kodenya.
--  * Lupa sandi: masukkan nomor WA + kode pemulihan + sandi baru.
--  * Salah 5 kali dalam 1 jam, pemulihan akun itu dikunci 1 jam.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.kode_pemulihan (
  profil_id   uuid primary key references public.profil (id) on delete cascade,
  hash        text not null,
  dibuat_pada timestamptz not null default now()
);

create table if not exists public.percobaan_reset (
  wa     text primary key,
  gagal  int not null default 0,
  mulai  timestamptz not null default now()
);

alter table public.kode_pemulihan enable row level security;
alter table public.percobaan_reset enable row level security;
revoke all on public.kode_pemulihan, public.percobaan_reset from anon, authenticated;

-- Membuat (atau mengganti) kode pemulihan milik sendiri. Kode lama langsung tidak berlaku.
create or replace function public.buat_kode_pemulihan()
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  abjad constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- 32 huruf/angka, tanpa I, O, 0, 1
  v_kode text := '';
  i int;
begin
  if auth.uid() is null or not exists (select 1 from public.profil where id = auth.uid()) then
    raise exception 'Akun belum aktif';
  end if;
  for i in 1..12 loop
    v_kode := v_kode || substr(abjad, 1 + (get_byte(extensions.gen_random_bytes(1), 0) % 32), 1);
  end loop;
  insert into public.kode_pemulihan (profil_id, hash)
  values (auth.uid(), extensions.crypt(v_kode, extensions.gen_salt('bf', 10)))
  on conflict (profil_id) do update set hash = excluded.hash, dibuat_pada = now();
  return substr(v_kode, 1, 4) || '-' || substr(v_kode, 5, 4) || '-' || substr(v_kode, 9, 4);
end;
$$;

-- Kapan kode dibuat (kosong bila belum punya).
create or replace function public.status_kode_pemulihan()
returns timestamptz
language sql stable security definer set search_path = ''
as $$
  select dibuat_pada from public.kode_pemulihan where profil_id = auth.uid();
$$;

-- Reset sandi tanpa login. Mengembalikan 'ok', 'salah', atau 'terkunci'.
-- (Sengaja bukan exception: hitungan gagal harus tersimpan.)
create or replace function public.reset_sandi(p_wa text, p_kode text, p_sandi text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_kode text := upper(regexp_replace(coalesce(p_kode, ''), '[^A-Za-z0-9]', '', 'g'));
  v_id   uuid;
  v_hash text;
  r      public.percobaan_reset%rowtype;
begin
  if coalesce(p_wa, '') !~ '^62[0-9]{8,13}$' then return 'salah'; end if;
  if char_length(coalesce(p_sandi, '')) < 8 then raise exception 'Kata sandi minimal 8 karakter'; end if;

  select p.id, k.hash into v_id, v_hash
    from public.profil p
    join public.kode_pemulihan k on k.profil_id = p.id
   where p.wa = p_wa and p.status = 'aktif';

  if v_id is null then
    perform extensions.crypt(v_kode, extensions.gen_salt('bf', 10));  -- samakan waktu respons
    return 'salah';
  end if;

  insert into public.percobaan_reset (wa) values (p_wa) on conflict (wa) do nothing;
  select * into r from public.percobaan_reset where wa = p_wa for update;
  if r.mulai < now() - interval '1 hour' then
    update public.percobaan_reset set gagal = 0, mulai = now() where wa = p_wa;
    r.gagal := 0;
  end if;
  if r.gagal >= 5 then return 'terkunci'; end if;

  if extensions.crypt(v_kode, v_hash) <> v_hash then
    update public.percobaan_reset set gagal = gagal + 1 where wa = p_wa;
    return 'salah';
  end if;

  update auth.users
     set encrypted_password = extensions.crypt(p_sandi, extensions.gen_salt('bf', 10)),
         updated_at = now()
   where id = v_id;
  delete from auth.sessions where user_id = v_id;   -- keluarkan perangkat lain
  update public.profil set wajib_ganti_sandi = false where id = v_id;
  delete from public.percobaan_reset where wa = p_wa;
  insert into public.log_aksi (pelaku, aksi, sasaran) values (v_id, 'reset_sandi_mandiri', v_id);
  return 'ok';
end;
$$;

revoke execute on function public.buat_kode_pemulihan()                  from public, anon;
revoke execute on function public.status_kode_pemulihan()                from public, anon;
revoke execute on function public.reset_sandi(text, text, text)          from public;
grant  execute on function public.buat_kode_pemulihan()                  to authenticated;
grant  execute on function public.status_kode_pemulihan()                to authenticated;
grant  execute on function public.reset_sandi(text, text, text)          to anon, authenticated;
