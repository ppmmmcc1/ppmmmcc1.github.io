-- =====================================================================
-- Phillip Castro portfolio — Supabase schema, security, and storage.
-- Run this in the Supabase dashboard → SQL Editor → New query → Run.
-- Safe to re-run (idempotent). See supabase/README.md for full setup.
--
-- Security model:
--   * Anyone (anon) can READ only PUBLISHED projects.
--   * Only the OWNER (matched by login email) can read drafts and
--     create / edit / delete projects and upload / remove files.
--   * Public sign-ups are disabled in the dashboard; the owner account
--     is created by hand. The anon key shipped in the site is public by
--     design — Row-Level Security below is what actually protects data.
-- =====================================================================

-- IMPORTANT: set this to the email you will log in with.
-- It is used by the is_owner() check below.
-- (Change it here AND keep it in sync if you ever change your login email.)

-- ---------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------
create table if not exists public.projects (
    id           uuid primary key default gen_random_uuid(),
    slug         text unique not null,
    title        text not null,
    subtitle     text,
    status       text not null default 'project' check (status in ('project','concept')),
    tags         text[] not null default '{}',
    summary      text,
    why_md       text,
    how_md       text,
    problems_md  text,
    hero_image   text,
    gallery      jsonb not null default '[]'::jsonb,   -- [{ "url": "...", "alt": "..." }]
    stl_url      text,
    specs        jsonb not null default '[]'::jsonb,   -- [{ "label": "...", "value": "..." }]
    published    boolean not null default false,
    sort_order   int not null default 0,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

create index if not exists projects_listing_idx
    on public.projects (status, published, sort_order, created_at desc);

-- keep updated_at current on every update
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_projects_updated on public.projects;
create trigger trg_projects_updated
    before update on public.projects
    for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2. Owner check  ——  EDIT THE EMAIL ON THE NEXT LINE
-- ---------------------------------------------------------------------
create or replace function public.is_owner()
returns boolean language sql stable as $$
    select coalesce(auth.jwt() ->> 'email', '') = 'phillipcastro0@gmail.com';
$$;

-- ---------------------------------------------------------------------
-- 3. Row-Level Security on the table
-- ---------------------------------------------------------------------
alter table public.projects enable row level security;

drop policy if exists "public read published" on public.projects;
create policy "public read published" on public.projects
    for select using (published = true);

drop policy if exists "owner read all" on public.projects;
create policy "owner read all" on public.projects
    for select using (public.is_owner());

drop policy if exists "owner insert" on public.projects;
create policy "owner insert" on public.projects
    for insert with check (public.is_owner());

drop policy if exists "owner update" on public.projects;
create policy "owner update" on public.projects
    for update using (public.is_owner()) with check (public.is_owner());

drop policy if exists "owner delete" on public.projects;
create policy "owner delete" on public.projects
    for delete using (public.is_owner());

-- ---------------------------------------------------------------------
-- 4. Storage buckets (public read) + owner-only writes
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
    values ('images', 'images', true)
    on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
    values ('models', 'models', true)
    on conflict (id) do update set public = true;

-- public READ is granted by the buckets being public; below restrict WRITES.
drop policy if exists "owner upload media" on storage.objects;
create policy "owner upload media" on storage.objects
    for insert to authenticated
    with check (bucket_id in ('images','models') and public.is_owner());

drop policy if exists "owner update media" on storage.objects;
create policy "owner update media" on storage.objects
    for update to authenticated
    using (bucket_id in ('images','models') and public.is_owner())
    with check (bucket_id in ('images','models') and public.is_owner());

drop policy if exists "owner delete media" on storage.objects;
create policy "owner delete media" on storage.objects
    for delete to authenticated
    using (bucket_id in ('images','models') and public.is_owner());
