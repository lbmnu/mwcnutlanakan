-- =====================================================================
-- LBM MWCNU Tlanakan : skema database tahap 1 (akun, peran, persetujuan)
-- Jalankan SEKALI di Supabase: SQL Editor > New query > tempel > Run.
-- Aman dijalankan ulang (memakai "if not exists" / "create or replace").
-- =====================================================================

-- ---------- 1. Ranting NU (17) ----------
create table if not exists public.ranting (
  id   smallint generated always as identity primary key,
  nama text not null unique
);

insert into public.ranting (nama) values
  ('Ambat'), ('Bandaran'), ('Branta Pasisir'), ('Branta Tinggi'), ('Bukek'),
  ('Ceguk'), ('Dabuan'), ('Gugul'), ('Kramat'), ('Larangan Slampar'),
  ('Larangan Tokol'), ('Mangar'), ('Panglegur'), ('Taro''an'), ('Terrak'),
  ('Tlanakan'), ('Tlesah')
on conflict (nama) do nothing;

-- ---------- 2. Profil pengguna ----------
-- Satu baris per akun. peran/status TIDAK PERNAH diambil dari isian pendaftar.
create table if not exists public.profil (
  id                uuid primary key references auth.users (id) on delete cascade,
  nama              text        not null check (char_length(nama) between 2 and 100),
  wa                text        not null unique check (wa ~ '^62[0-9]{8,13}$'),
  ranting_id        smallint    references public.ranting (id),
  tipe              text        not null default 'warga'
                    check (tipe in ('warga', 'pengurus_struktural')),
  lembaga           text        not null default '' check (char_length(lembaga) <= 100),
  jabatan_lembaga   text        not null default '' check (char_length(jabatan_lembaga) <= 100),
  status            text        not null default 'menunggu'
                    check (status in ('menunggu', 'aktif', 'ditolak', 'nonaktif')),
  peran             text        not null default 'warga'
                    check (peran in ('warga', 'pengurus', 'admin')),
  jabatan_lbm       text        check (jabatan_lbm in ('ketua', 'wakil_ketua', 'sekretaris', 'bendahara', 'anggota')),
  tim_penjawab      boolean     not null default false,
  tim_penyunting    boolean     not null default false,
  wajib_ganti_sandi boolean     not null default false,
  disetujui_oleh    uuid        references public.profil (id) on delete set null,
  disetujui_pada    timestamptz,
  dibuat_pada       timestamptz not null default now()
);

create index if not exists profil_status_idx on public.profil (status, dibuat_pada);

-- ---------- 3. Catatan aksi (siapa menyetujui/menolak siapa) ----------
create table if not exists public.log_aksi (
  id       bigint generated always as identity primary key,
  waktu    timestamptz not null default now(),
  pelaku   uuid references public.profil (id) on delete set null,
  aksi     text not null,
  sasaran  uuid,
  rincian  jsonb not null default '{}'::jsonb
);

-- ---------- 4. Fungsi bantu (security definer: berjalan dengan hak pemilik) ----------
-- Pengurus aktif = peran pengurus/admin dan status aktif.
create or replace function public.adalah_pengurus()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profil p
    where p.id = auth.uid() and p.status = 'aktif' and p.peran in ('pengurus', 'admin')
  );
$$;

-- Boleh menyetujui pendaftar: admin, Ketua, Wakil Ketua, Sekretaris.
create or replace function public.bisa_setujui()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profil p
    where p.id = auth.uid() and p.status = 'aktif'
      and (p.peran = 'admin' or p.jabatan_lbm in ('ketua', 'wakil_ketua', 'sekretaris'))
  );
$$;

-- ---------- 5. Pendaftaran otomatis membuat profil ----------
-- Dipanggil database setiap ada akun baru. Data dari formulir hanya dipakai untuk
-- nama, ranting, tipe, lembaga, jabatan. Peran dan status SELALU nilai awal (warga, menunggu).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  meta      jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_wa      text;
  v_ranting smallint;
  v_tipe    text;
begin
  -- Nomor WA diambil dari alamat internal (62xxxx@domain), bukan dari isian pendaftar.
  v_wa := substring(new.email from '^([0-9]+)@');
  if v_wa is null or v_wa !~ '^62[0-9]{8,13}$' then
    raise exception 'Nomor WhatsApp tidak valid';
  end if;

  begin
    v_ranting := nullif(meta ->> 'ranting_id', '')::smallint;
  exception when others then
    v_ranting := null;
  end;
  if v_ranting is not null and not exists (select 1 from public.ranting r where r.id = v_ranting) then
    v_ranting := null;
  end if;

  v_tipe := case when meta ->> 'tipe' = 'pengurus_struktural' then 'pengurus_struktural' else 'warga' end;

  insert into public.profil (id, nama, wa, ranting_id, tipe, lembaga, jabatan_lembaga)
  values (
    new.id,
    left(btrim(coalesce(nullif(meta ->> 'nama', ''), 'Tanpa nama')), 100),
    v_wa,
    v_ranting,
    v_tipe,
    case when v_tipe = 'pengurus_struktural' then left(btrim(coalesce(meta ->> 'lembaga', '')), 100) else '' end,
    case when v_tipe = 'pengurus_struktural' then left(btrim(coalesce(meta ->> 'jabatan_lembaga', '')), 100) else '' end
  );
  return new;
end;
$$;

drop trigger if exists saat_akun_baru on auth.users;
create trigger saat_akun_baru
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 6. Aksi persetujuan (lewat fungsi, bukan tulis langsung) ----------
create or replace function public.setujui_pendaftar(p_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.bisa_setujui() then
    raise exception 'Tidak berwenang';
  end if;
  update public.profil
     set status = 'aktif', disetujui_oleh = auth.uid(), disetujui_pada = now()
   where id = p_id and status = 'menunggu';
  if not found then
    raise exception 'Pendaftar tidak ditemukan atau sudah diproses';
  end if;
  insert into public.log_aksi (pelaku, aksi, sasaran) values (auth.uid(), 'setujui_pendaftar', p_id);
end;
$$;

create or replace function public.tolak_pendaftar(p_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.bisa_setujui() then
    raise exception 'Tidak berwenang';
  end if;
  update public.profil
     set status = 'ditolak', disetujui_oleh = auth.uid(), disetujui_pada = now()
   where id = p_id and status = 'menunggu';
  if not found then
    raise exception 'Pendaftar tidak ditemukan atau sudah diproses';
  end if;
  insert into public.log_aksi (pelaku, aksi, sasaran) values (auth.uid(), 'tolak_pendaftar', p_id);
end;
$$;

-- Dipanggil pengguna sendiri setelah mengganti kata sandi sementara.
create or replace function public.sudah_ganti_sandi()
returns void
language sql security definer set search_path = ''
as $$
  update public.profil set wajib_ganti_sandi = false where id = auth.uid();
$$;

-- ---------- 7. Row Level Security: siapa boleh melihat apa ----------
alter table public.ranting  enable row level security;
alter table public.profil   enable row level security;
alter table public.log_aksi enable row level security;

drop policy if exists ranting_baca_semua on public.ranting;
create policy ranting_baca_semua on public.ranting
  for select to anon, authenticated using (true);

drop policy if exists profil_baca_sendiri on public.profil;
create policy profil_baca_sendiri on public.profil
  for select to authenticated using (id = auth.uid());

drop policy if exists profil_baca_pengurus on public.profil;
create policy profil_baca_pengurus on public.profil
  for select to authenticated using (public.adalah_pengurus());

drop policy if exists log_baca_penyetuju on public.log_aksi;
create policy log_baca_penyetuju on public.log_aksi
  for select to authenticated using (public.bisa_setujui());

-- Tidak ada kebijakan insert/update/delete: aplikasi tidak bisa menulis langsung.
-- Semua perubahan lewat trigger pendaftaran dan fungsi di atas.

-- ---------- 8. Hak akses tingkat tabel dan fungsi ----------
revoke all on public.ranting, public.profil, public.log_aksi from anon, authenticated;
grant select on public.ranting to anon, authenticated;
grant select on public.profil, public.log_aksi to authenticated;

revoke execute on function public.handle_new_user()          from public, anon, authenticated;
revoke execute on function public.adalah_pengurus()          from public, anon;
revoke execute on function public.bisa_setujui()             from public, anon;
revoke execute on function public.setujui_pendaftar(uuid)    from public, anon;
revoke execute on function public.tolak_pendaftar(uuid)      from public, anon;
revoke execute on function public.sudah_ganti_sandi()        from public, anon;

grant execute on function public.adalah_pengurus()          to authenticated;
grant execute on function public.bisa_setujui()             to authenticated;
grant execute on function public.setujui_pendaftar(uuid)    to authenticated;
grant execute on function public.tolak_pendaftar(uuid)      to authenticated;
grant execute on function public.sudah_ganti_sandi()        to authenticated;
