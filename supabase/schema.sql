-- =========================================================
-- Extreme Demons List - Esquema de base de datos (Supabase)
-- Pega este archivo completo en el SQL Editor de Supabase
-- =========================================================

-- ---------- EXTENSIONES ----------
create extension if not exists "uuid-ossp";

-- ---------- TABLA: profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  gd_username text,
  avatar_url text,
  country_code text,
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  total_points int not null default 0,
  completed_demons_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists country_code text;
alter table public.profiles add column if not exists total_points int not null default 0;
alter table public.profiles add column if not exists completed_demons_count int not null default 0;

-- ---------- TABLA: demons ----------
create table if not exists public.demons (
  id uuid primary key default uuid_generate_v4(),
  position int not null,
  name text not null,
  creator text not null,
  level_id text not null,
  difficulty text not null default 'Extreme Demon'
    check (difficulty in ('Easy Demon','Medium Demon','Hard Demon','Insane Demon','Extreme Demon')),
  thumbnail_url text,
  verification_video_url text,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.demons add column if not exists updated_at timestamptz not null default now();
alter table public.demons add column if not exists background_url text;
alter table public.demons add column if not exists extreme_demon_icon_url text;
alter table public.demons add column if not exists points int not null default 100;

create index if not exists demons_position_idx on public.demons(position);
create index if not exists demons_name_idx on public.demons(name);

-- ---------- TABLA: submissions ----------
create table if not exists public.submissions (
  id uuid primary key default uuid_generate_v4(),
  demon_id uuid not null references public.demons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  gd_username text not null,
  video_url text not null,
  fps int,
  refresh_rate int,
  comment text,
  raw_complete_url text,
  mod_menu text,
  device text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists submissions_status_idx on public.submissions(status);
create index if not exists submissions_user_idx on public.submissions(user_id);
create index if not exists submissions_demon_idx on public.submissions(demon_id);

create unique index if not exists submissions_unique_active
  on public.submissions(demon_id, user_id)
  where status in ('pending','approved');

-- ---------- TABLA: moderation_logs ----------
create table if not exists public.moderation_logs (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  moderator_id uuid not null references public.profiles(id),
  action text not null check (action in ('approved','rejected')),
  reason text,
  created_at timestamptz not null default now()
);

-- ---------- TABLA: point_history ----------
create table if not exists public.point_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  submission_id uuid not null references public.submissions(id) on delete cascade,
  demon_id uuid not null references public.demons(id) on delete cascade,
  points int not null,
  action text not null check (action in ('add','remove')),
  created_at timestamptz not null default now()
);

create index if not exists point_history_user_idx on public.point_history(user_id);
create index if not exists point_history_submission_idx on public.point_history(submission_id);

-- ---------- TABLA: demon_images ----------
create table if not exists public.demon_images (
  id uuid primary key default uuid_generate_v4(),
  demon_id uuid not null references public.demons(id) on delete cascade,
  url text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists demon_images_demon_idx on public.demon_images(demon_id);

-- ---------- TABLA: demon_edits ----------
create table if not exists public.demon_edits (
  id uuid primary key default uuid_generate_v4(),
  demon_id uuid not null references public.demons(id) on delete cascade,
  edited_by uuid not null references public.profiles(id),
  previous_values jsonb not null,
  new_values jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists demon_edits_demon_idx on public.demon_edits(demon_id);

-- ---------- TABLA: demon_tags ----------
create table if not exists public.demon_tags (
  id uuid primary key default uuid_generate_v4(),
  demon_id uuid not null references public.demons(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique(demon_id, tag)
);

create index if not exists demon_tags_demon_idx on public.demon_tags(demon_id);

-- ---------- TABLA: completion_notes ----------
create table if not exists public.completion_notes (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  content text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists completion_notes_submission_idx on public.completion_notes(submission_id);

-- ---------- VISTA: completions aprobadas ----------
create or replace view public.completions as
select
  s.id,
  s.demon_id,
  s.user_id,
  s.gd_username,
  s.video_url,
  s.fps,
  s.refresh_rate,
  s.comment,
  s.reviewed_by,
  s.reviewed_at,
  s.created_at,
  d.name as demon_name,
  d.position as demon_position
from public.submissions s
join public.demons d on d.id = s.demon_id
where s.status = 'approved';

-- ---------- VISTA: moderation_dashboard ----------
create or replace view public.moderation_dashboard as
select
  s.id,
  s.demon_id,
  s.user_id,
  s.gd_username,
  s.video_url,
  s.fps,
  s.refresh_rate,
  s.comment,
  s.status,
  s.rejection_reason,
  s.reviewed_by,
  s.reviewed_at,
  s.created_at,
  d.name as demon_name,
  d.position as demon_position,
  d.thumbnail_url,
  p.username as submitter_username
from public.submissions s
join public.demons d on d.id = s.demon_id
join public.profiles p on p.id = s.user_id
where s.status in ('pending', 'approved', 'rejected');

-- ---------- VISTA: global_leaderboard ----------
create or replace view public.global_leaderboard as
select
  p.id,
  p.username,
  p.avatar_url,
  p.country_code,
  p.total_points,
  p.completed_demons_count,
  row_number() over (order by p.total_points desc, p.completed_demons_count desc) as rank
from public.profiles p
where p.completed_demons_count > 0;

-- ---------- VISTA: country_leaderboard ----------
create or replace view public.country_leaderboard as
select
  p.country_code,
  p.id,
  p.username,
  p.avatar_url,
  p.total_points,
  p.completed_demons_count,
  row_number() over (partition by p.country_code order by p.total_points desc, p.completed_demons_count desc) as rank
from public.profiles p
where p.completed_demons_count > 0
  and p.country_code is not null
  and p.country_code <> '';

-- =========================================================
-- FUNCIONES AUXILIARES
-- =========================================================

create or replace function public.is_staff(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role in ('moderator','admin')
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, username, gd_username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'gd_username', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.log_moderation()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status in ('approved','rejected') and old.status = 'pending' then
    insert into public.moderation_logs (submission_id, moderator_id, action, reason)
    values (
      new.id,
      new.reviewed_by,
      new.status,
      new.rejection_reason
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_submission_reviewed on public.submissions;
create trigger on_submission_reviewed
  after update on public.submissions
  for each row execute procedure public.log_moderation();

create or replace function public.update_demon_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists demons_updated_at on public.demons;
create trigger demons_updated_at
  before update on public.demons
  for each row execute procedure public.update_demon_updated_at();

create or replace function public.update_profile_stats(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set
    total_points = (
      select coalesce(sum(d.points), 0)
      from public.submissions s
      join public.demons d on d.id = s.demon_id
      where s.user_id = p_user_id
        and s.status = 'approved'
    ),
    completed_demons_count = (
      select count(*)
      from public.submissions s
      where s.user_id = p_user_id
        and s.status = 'approved'
    )
  where id = p_user_id;
end;
$$;

create or replace function public.add_points_for_approval()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status = 'approved' and old.status = 'pending' then
    insert into public.point_history (user_id, submission_id, demon_id, points, action)
    values (
      new.user_id,
      new.id,
      new.demon_id,
      (select points from public.demons where id = new.demon_id),
      'add'
    );
    perform public.update_profile_stats(new.user_id);
  elsif new.status = 'rejected' and old.status = 'approved' then
    insert into public.point_history (user_id, submission_id, demon_id, points, action)
    values (
      new.user_id,
      new.id,
      new.demon_id,
      (select points from public.demons where id = new.demon_id),
      'remove'
    );
    perform public.update_profile_stats(new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_submission_points on public.submissions;
create trigger on_submission_points
  after update on public.submissions
  for each row execute procedure public.add_points_for_approval();

drop index if exists public.demons_position_idx;

create index if not exists demons_position_idx on public.demons(position);

create or replace function public.reorder_demons(from_position int, to_position int)
returns void
language plpgsql
security definer
as $$
begin
  if from_position = to_position then
    return;
  end if;

  if from_position < to_position then
    update public.demons
    set position = -position
    where position = from_position;

    update public.demons
    set position = position - 1
    where position > from_position and position <= to_position;

    update public.demons
    set position = to_position
    where position = -from_position;
  else
    update public.demons
    set position = -position
    where position = from_position;

    update public.demons
    set position = position + 1
    where position >= to_position and position < from_position;

    update public.demons
    set position = to_position
    where position = -from_position;
  end if;
end;
$$;

revoke all on function public.reorder_demons(int, int) from public, anon, authenticated;
grant execute on function public.reorder_demons(int, int) to authenticated;

create or replace function public.enforce_single_primary_image()
returns trigger
language plpgsql
as $$
begin
  if new.is_primary then
    update public.demon_images
    set is_primary = false
    where demon_id = new.demon_id and id <> new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_single_primary_image on public.demon_images;
create trigger enforce_single_primary_image
  before insert or update on public.demon_images
  for each row execute procedure public.enforce_single_primary_image();

create or replace function public.get_moderation_stats()
returns table (
  pending bigint,
  approved_today bigint,
  rejected_today bigint,
  total bigint
)
language plpgsql
security definer
stable
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'No autorizado';
  end if;

  return query
  select
    count(*) filter (where status = 'pending') as pending,
    count(*) filter (where status = 'approved' and reviewed_at >= current_date) as approved_today,
    count(*) filter (where status = 'rejected' and reviewed_at >= current_date) as rejected_today,
    count(*) as total
  from public.submissions;
end;
$$;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.profiles enable row level security;
alter table public.demons enable row level security;
alter table public.submissions enable row level security;
alter table public.moderation_logs enable row level security;
alter table public.demon_images enable row level security;
alter table public.demon_edits enable row level security;
alter table public.demon_tags enable row level security;
alter table public.completion_notes enable row level security;

-- ---------- profiles ----------
drop policy if exists "Los perfiles son públicos para lectura" on public.profiles;
create policy "Los perfiles son públicos para lectura"
  on public.profiles for select
  using (true);

drop policy if exists "El usuario puede actualizar su propio perfil (no su rol)" on public.profiles;
create policy "El usuario puede actualizar su propio perfil (no su rol)"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
  );

drop policy if exists "Los admins pueden actualizar cualquier perfil (incluido el rol)" on public.profiles;
create policy "Los admins pueden actualizar cualquier perfil (incluido el rol)"
  on public.profiles for update
  using (public.is_staff(auth.uid()) and (select role from public.profiles where id = auth.uid()) = 'admin');

-- ---------- demons ----------
drop policy if exists "La lista de demons es pública" on public.demons;
create policy "La lista de demons es pública"
  on public.demons for select
  using (true);

drop policy if exists "Solo staff puede crear demons" on public.demons;
create policy "Solo staff puede crear demons"
  on public.demons for insert
  with check (public.is_staff(auth.uid()));

drop policy if exists "Solo staff puede editar demons" on public.demons;
create policy "Solo staff puede editar demons"
  on public.demons for update
  using (public.is_staff(auth.uid()));

drop policy if exists "Solo staff puede borrar demons" on public.demons;
create policy "Solo staff puede borrar demons"
  on public.demons for delete
  using (public.is_staff(auth.uid()));

-- ---------- submissions ----------
drop policy if exists "Ver submissions aprobadas, propias, o si eres staff" on public.submissions;
create policy "Ver submissions aprobadas, propias, o si eres staff"
  on public.submissions for select
  using (
    status = 'approved'
    or user_id = auth.uid()
    or public.is_staff(auth.uid())
  );

drop policy if exists "Crear tu propia submission" on public.submissions;
create policy "Crear tu propia submission"
  on public.submissions for insert
  with check (user_id = auth.uid());

drop policy if exists "Solo staff puede revisar submissions ajenas" on public.submissions;
drop policy if exists "Solo staff puede revisar submissions" on public.submissions;
create policy "Solo staff puede revisar submissions"
  on public.submissions for update
  using (
    public.is_staff(auth.uid())
    and (
      user_id <> auth.uid()
      or (select role from public.profiles where id = auth.uid()) = 'admin'
    )
  )
  with check (
    public.is_staff(auth.uid())
    and (
      user_id <> auth.uid()
      or (select role from public.profiles where id = auth.uid()) = 'admin'
    )
  );

-- ---------- moderation_logs ----------
drop policy if exists "Solo staff puede ver los logs de moderación" on public.moderation_logs;
create policy "Solo staff puede ver los logs de moderación"
  on public.moderation_logs for select
  using (public.is_staff(auth.uid()));

drop policy if exists "El log se inserta como el propio moderador" on public.moderation_logs;
create policy "El log se inserta como el propio moderador"
  on public.moderation_logs for insert
  with check (moderator_id = auth.uid() and public.is_staff(auth.uid()));

-- ---------- point_history ----------
drop policy if exists "Users can view their own point history" on public.point_history;
create policy "Users can view their own point history"
  on public.point_history for select
  using (user_id = auth.uid() or public.is_staff(auth.uid()));

drop policy if exists "System can insert point history" on public.point_history;
create policy "System can insert point history"
  on public.point_history for insert
  with check (true);

-- ---------- demon_images ----------
drop policy if exists "Las imágenes de demons son públicas para lectura" on public.demon_images;
create policy "Las imágenes de demons son públicas para lectura"
  on public.demon_images for select
  using (true);

drop policy if exists "Solo staff puede crear imágenes de demons" on public.demon_images;
create policy "Solo staff puede crear imágenes de demons"
  on public.demon_images for insert
  with check (public.is_staff(auth.uid()));

drop policy if exists "Solo staff puede editar imágenes de demons" on public.demon_images;
create policy "Solo staff puede editar imágenes de demons"
  on public.demon_images for update
  using (public.is_staff(auth.uid()));

drop policy if exists "Solo staff puede borrar imágenes de demons" on public.demon_images;
create policy "Solo staff puede borrar imágenes de demons"
  on public.demon_images for delete
  using (public.is_staff(auth.uid()));

-- ---------- demon_edits ----------
drop policy if exists "Solo staff puede ver el historial de ediciones" on public.demon_edits;
create policy "Solo staff puede ver el historial de ediciones"
  on public.demon_edits for select
  using (public.is_staff(auth.uid()));

drop policy if exists "Solo staff puede registrar ediciones" on public.demon_edits;
create policy "Solo staff puede registrar ediciones"
  on public.demon_edits for insert
  with check (public.is_staff(auth.uid()));

-- ---------- demon_tags ----------
drop policy if exists "Las etiquetas de demons son públicas para lectura" on public.demon_tags;
create policy "Las etiquetas de demons son públicas para lectura"
  on public.demon_tags for select
  using (true);

drop policy if exists "Solo staff puede crear etiquetas" on public.demon_tags;
create policy "Solo staff puede crear etiquetas"
  on public.demon_tags for insert
  with check (public.is_staff(auth.uid()));

drop policy if exists "Solo staff puede editar etiquetas" on public.demon_tags;
create policy "Solo staff puede editar etiquetas"
  on public.demon_tags for update
  using (public.is_staff(auth.uid()));

drop policy if exists "Solo staff puede borrar etiquetas" on public.demon_tags;
create policy "Solo staff puede borrar etiquetas"
  on public.demon_tags for delete
  using (public.is_staff(auth.uid()));

-- ---------- completion_notes ----------
drop policy if exists "Staff ve todas las notas, usuario ve las suyas" on public.completion_notes;
create policy "Staff ve todas las notas, usuario ve las suyas"
  on public.completion_notes for select
  using (
    public.is_staff(auth.uid())
    or created_by = auth.uid()
  );

drop policy if exists "Usuario o staff puede crear notas" on public.completion_notes;
create policy "Usuario o staff puede crear notas"
  on public.completion_notes for insert
  with check (
    created_by = auth.uid()
    and (
      public.is_staff(auth.uid())
      or exists (
        select 1 from public.submissions
        where id = submission_id and user_id = auth.uid()
      )
    )
  );

-- =========================================================
-- DATOS DE EJEMPLO (opcional, bórralo si no lo quieres)
-- =========================================================

insert into public.demons (position, name, creator, level_id, difficulty, thumbnail_url, points)
values
  (1, 'Tidal Wave', 'OniLink', '54332187', 'Extreme Demon', null, 100),
  (2, 'Acheron', 'Zoink', '78900123', 'Extreme Demon', null, 100),
  (3, 'Slaughterhouse', 'Vermillion', '65432109', 'Extreme Demon', null, 100)
on conflict do nothing;

update public.profiles set role = 'admin' where username = 'fabb';

update public.demons
set extreme_demon_icon_url = 'https://znezztvtzlvhvgdamhcz.supabase.co/storage/v1/object/public/demon-images/extreme_demon_icon_url.png'
where extreme_demon_icon_url is null;

-- Corrige duplicados de posición si existen
WITH duplicates AS (
  SELECT id, position,
         ROW_NUMBER() OVER (PARTITION BY position ORDER BY created_at) AS rn
  FROM public.demons
)
UPDATE public.demons d
SET position = (SELECT COALESCE(MAX(position), 0) + 1 FROM public.demons)
FROM duplicates dup
WHERE d.id = dup.id AND dup.rn > 1;
