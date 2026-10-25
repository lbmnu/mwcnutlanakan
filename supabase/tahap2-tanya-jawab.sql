-- =====================================================================
-- LBM MWCNU Tlanakan : tahap 2, tanya-jawab
-- Jalankan SEKALI di Supabase SQL Editor, SETELAH schema.sql.
-- Aman dijalankan ulang.
--
-- Aturan pokok:
--  * Pertanyaan asli dan identitas penanya hanya terlihat oleh penanya dan Tim Penjawab.
--  * Jawaban yang terbit dibaca publik lewat tampilan "jawaban_publik",
--    yang tidak pernah memuat nama, nomor, atau ranting penanya.
--  * Semua penulisan lewat fungsi, bukan tulis langsung ke tabel.
-- =====================================================================

-- ---------- 1. Tabel ----------
create table if not exists public.pertanyaan (
  id             uuid primary key default gen_random_uuid(),
  penanya_id     uuid not null references public.profil (id) on delete cascade,
  rubrik         text not null check (rubrik in
                   ('Bahtsul Masail', 'Tanya Fikih', 'Fikih Harian', 'Fikih Muamalah', 'Amaliyah Aswaja', 'Kajian Kitab')),
  isi            text not null check (char_length(isi) between 10 and 2000),
  status         text not null default 'menunggu' check (status in ('menunggu', 'ditelaah', 'terjawab')),
  ditangani_oleh uuid references public.profil (id) on delete set null,
  dibuat_pada    timestamptz not null default now()
);
create index if not exists pertanyaan_penanya_idx on public.pertanyaan (penanya_id, dibuat_pada desc);
create index if not exists pertanyaan_status_idx  on public.pertanyaan (status, dibuat_pada);

create table if not exists public.jawaban (
  id                uuid primary key default gen_random_uuid(),
  pertanyaan_id     uuid not null unique references public.pertanyaan (id) on delete cascade,
  jenis             text not null default 'jawaban_tim' check (jenis in ('jawaban_tim', 'hasil_musyawarah')),
  judul             text not null default '' check (char_length(judul) <= 200),
  pertanyaan_netral text not null default '' check (char_length(pertanyaan_netral) <= 2000),
  isi               text not null default '' check (char_length(isi) <= 20000),
  rujukan_arab      text not null default '' check (char_length(rujukan_arab) <= 5000),
  rujukan_sumber    text not null default '' check (char_length(rujukan_sumber) <= 500),
  status            text not null default 'draf' check (status in ('draf', 'terbit')),
  penyusun_id       uuid references public.profil (id) on delete set null,
  minta_tinjauan_id uuid references public.profil (id) on delete set null,
  terbit_oleh       uuid references public.profil (id) on delete set null,
  diterbitkan_pada  timestamptz,
  dibuat_pada       timestamptz not null default now(),
  diperbarui_pada   timestamptz not null default now()
);
create index if not exists jawaban_terbit_idx on public.jawaban (status, diterbitkan_pada desc);

-- ---------- 2. Fungsi bantu ----------
create or replace function public.adalah_tim_penjawab()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profil p
    where p.id = auth.uid() and p.status = 'aktif' and p.tim_penjawab
  );
$$;

-- ---------- 3. Tampilan publik: hanya jawaban terbit, tanpa identitas penanya ----------
create or replace view public.jawaban_publik with (security_invoker = off) as
select j.id,
       j.jenis,
       j.judul,
       q.rubrik,
       j.pertanyaan_netral as pertanyaan,
       j.isi,
       j.rujukan_arab,
       j.rujukan_sumber,
       j.diterbitkan_pada
  from public.jawaban j
  join public.pertanyaan q on q.id = j.pertanyaan_id
 where j.status = 'terbit';

-- ---------- 4. Aksi lewat fungsi ----------
-- Warga/pengurus aktif mengirim pertanyaan.
create or replace function public.kirim_pertanyaan(p_rubrik text, p_isi text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_isi text := btrim(coalesce(p_isi, ''));
  v_id  uuid;
begin
  if auth.uid() is null
     or not exists (select 1 from public.profil where id = auth.uid() and status = 'aktif') then
    raise exception 'Akun belum aktif';
  end if;
  if char_length(v_isi) < 10 then raise exception 'Pertanyaan terlalu pendek'; end if;
  if char_length(v_isi) > 2000 then raise exception 'Pertanyaan terlalu panjang'; end if;
  if (select count(*) from public.pertanyaan where penanya_id = auth.uid() and status <> 'terjawab') >= 5 then
    raise exception 'Masih ada 5 pertanyaan yang belum terjawab';
  end if;
  if (select count(*) from public.pertanyaan where penanya_id = auth.uid() and dibuat_pada > now() - interval '1 day') >= 10 then
    raise exception 'Batas kiriman harian tercapai';
  end if;

  insert into public.pertanyaan (penanya_id, rubrik, isi)
  values (auth.uid(), p_rubrik, v_isi)
  returning id into v_id;
  return v_id;
end;
$$;

-- Tim Penjawab menyimpan draf (atau mengubah jawaban yang sudah terbit).
create or replace function public.simpan_jawaban(
  p_pertanyaan uuid, p_jenis text, p_judul text, p_netral text,
  p_isi text, p_arab text, p_sumber text, p_tinjauan uuid
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id     uuid;
  v_status text;
begin
  if not public.adalah_tim_penjawab() then raise exception 'Tidak berwenang'; end if;
  if not exists (select 1 from public.pertanyaan where id = p_pertanyaan) then
    raise exception 'Pertanyaan tidak ditemukan';
  end if;
  if p_tinjauan is not null then
    if p_tinjauan = auth.uid() then raise exception 'Pilih anggota Tim lain untuk meninjau'; end if;
    if not exists (select 1 from public.profil where id = p_tinjauan and status = 'aktif' and tim_penjawab) then
      raise exception 'Peninjau harus anggota Tim Penjawab';
    end if;
  end if;

  select status into v_status from public.jawaban where pertanyaan_id = p_pertanyaan;

  insert into public.jawaban as j
    (pertanyaan_id, jenis, judul, pertanyaan_netral, isi, rujukan_arab, rujukan_sumber, penyusun_id, minta_tinjauan_id)
  values
    (p_pertanyaan, p_jenis, btrim(coalesce(p_judul, '')), btrim(coalesce(p_netral, '')), btrim(coalesce(p_isi, '')),
     btrim(coalesce(p_arab, '')), btrim(coalesce(p_sumber, '')), auth.uid(), p_tinjauan)
  on conflict (pertanyaan_id) do update set
    jenis = excluded.jenis,
    judul = excluded.judul,
    pertanyaan_netral = excluded.pertanyaan_netral,
    isi = excluded.isi,
    rujukan_arab = excluded.rujukan_arab,
    rujukan_sumber = excluded.rujukan_sumber,
    minta_tinjauan_id = case when j.status = 'draf' then excluded.minta_tinjauan_id else j.minta_tinjauan_id end,
    diperbarui_pada = now()
  returning j.id into v_id;

  update public.pertanyaan
     set ditangani_oleh = coalesce(ditangani_oleh, auth.uid()),
         status = case when status = 'menunggu' then 'ditelaah' else status end
   where id = p_pertanyaan;

  if v_status = 'terbit' then
    insert into public.log_aksi (pelaku, aksi, sasaran) values (auth.uid(), 'ubah_jawaban_terbit', v_id);
  end if;
  return v_id;
end;
$$;

-- Tim Penjawab menerbitkan. Bila tinjauan diminta, hanya peninjau yang dipilih yang boleh menerbitkan.
create or replace function public.terbitkan_jawaban(p_pertanyaan uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  j public.jawaban%rowtype;
begin
  if not public.adalah_tim_penjawab() then raise exception 'Tidak berwenang'; end if;
  select * into j from public.jawaban where pertanyaan_id = p_pertanyaan for update;
  if not found then raise exception 'Simpan draf jawaban dulu'; end if;
  if j.status = 'terbit' then raise exception 'Jawaban sudah terbit'; end if;
  if j.judul = '' or j.isi = '' or j.pertanyaan_netral = '' then
    raise exception 'Judul, pertanyaan netral, dan jawaban wajib diisi';
  end if;
  if j.minta_tinjauan_id is not null and j.minta_tinjauan_id <> auth.uid() then
    raise exception 'Menunggu tinjauan anggota Tim yang dipilih';
  end if;

  update public.jawaban
     set status = 'terbit', terbit_oleh = auth.uid(), diterbitkan_pada = now(), diperbarui_pada = now()
   where id = j.id;
  update public.pertanyaan set status = 'terjawab' where id = p_pertanyaan;
  insert into public.log_aksi (pelaku, aksi, sasaran) values (auth.uid(), 'terbitkan_jawaban', j.id);
  return j.id;
end;
$$;

-- Riwayat pertanyaan milik sendiri, lengkap dengan tautan ke jawaban terbit.
create or replace function public.riwayat_saya()
returns table (id uuid, rubrik text, isi text, status text, dibuat_pada timestamptz, jawaban_id uuid, diterbitkan_pada timestamptz)
language sql stable security definer set search_path = ''
as $$
  select q.id, q.rubrik, q.isi, q.status, q.dibuat_pada,
         j.id, j.diterbitkan_pada
    from public.pertanyaan q
    left join public.jawaban j on j.pertanyaan_id = q.id and j.status = 'terbit'
   where q.penanya_id = auth.uid()
   order by q.dibuat_pada desc;
$$;

-- ---------- 5. Row Level Security ----------
alter table public.pertanyaan enable row level security;
alter table public.jawaban    enable row level security;

drop policy if exists pertanyaan_baca_sendiri on public.pertanyaan;
create policy pertanyaan_baca_sendiri on public.pertanyaan
  for select to authenticated using (penanya_id = auth.uid());

drop policy if exists pertanyaan_baca_tim on public.pertanyaan;
create policy pertanyaan_baca_tim on public.pertanyaan
  for select to authenticated using (public.adalah_tim_penjawab());

drop policy if exists jawaban_baca_tim on public.jawaban;
create policy jawaban_baca_tim on public.jawaban
  for select to authenticated using (public.adalah_tim_penjawab());

-- ---------- 6. Hak akses ----------
revoke all on public.pertanyaan, public.jawaban, public.jawaban_publik from anon, authenticated;
grant select on public.pertanyaan, public.jawaban to authenticated;
grant select on public.jawaban_publik to anon, authenticated;

revoke execute on function public.adalah_tim_penjawab()                                   from public, anon;
revoke execute on function public.kirim_pertanyaan(text, text)                            from public, anon;
revoke execute on function public.simpan_jawaban(uuid, text, text, text, text, text, text, uuid) from public, anon;
revoke execute on function public.terbitkan_jawaban(uuid)                                 from public, anon;
revoke execute on function public.riwayat_saya()                                          from public, anon;

grant execute on function public.adalah_tim_penjawab()                                   to authenticated;
grant execute on function public.kirim_pertanyaan(text, text)                            to authenticated;
grant execute on function public.simpan_jawaban(uuid, text, text, text, text, text, text, uuid) to authenticated;
grant execute on function public.terbitkan_jawaban(uuid)                                 to authenticated;
grant execute on function public.riwayat_saya()                                          to authenticated;
