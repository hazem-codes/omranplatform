-- ===========================================================================
-- Omran Platform — Marketplace V2 (template purchases + richer template fields)
-- Run this ONCE in your Supabase SQL Editor.
-- It is fully idempotent (safe to re-run any number of times).
-- It avoids hard foreign keys that may break on legacy/inconsistent rows.
-- ===========================================================================

-- 1) Optional richer template fields for nicer marketplace cards --------------
alter table public.templates
  add column if not exists preview_image_url text;

alter table public.templates
  add column if not exists included_files text;


-- 2) template_purchases: real "order" row created on every Buy Now ------------
-- We intentionally do NOT use ON DELETE CASCADE foreign keys here so that
-- legacy or partially-seeded data cannot block table creation. Referential
-- integrity is enforced at the application layer.
create table if not exists public.template_purchases (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null,
  client_id   uuid not null,
  office_id   uuid,
  status text not null default 'paid',          -- paid | delivered | cancelled
  purchase_price numeric not null default 0,
  -- snapshots: keep the order meaningful even if the source template changes
  title_snapshot          text,
  category_snapshot       text,
  sub_category_snapshot   text,
  file_url_snapshot       text,
  preview_image_snapshot  text,
  created_at timestamptz not null default now()
);

create index if not exists template_purchases_client_idx
  on public.template_purchases (client_id);
create index if not exists template_purchases_office_idx
  on public.template_purchases (office_id);
create index if not exists template_purchases_template_idx
  on public.template_purchases (template_id);


-- 3) Row Level Security -------------------------------------------------------
alter table public.template_purchases enable row level security;

-- Drop and recreate every policy so re-running the script always converges to
-- the latest definition.
drop policy if exists tp_select_own_client on public.template_purchases;
drop policy if exists tp_select_own_office on public.template_purchases;
drop policy if exists tp_select_supervisor on public.template_purchases;
drop policy if exists tp_insert_own_client on public.template_purchases;
drop policy if exists tp_update_own_client on public.template_purchases;
drop policy if exists tp_update_own_office on public.template_purchases;

-- Clients can read their own purchases
create policy tp_select_own_client on public.template_purchases
  for select to authenticated
  using (auth.uid() = client_id);

-- Offices can read purchases of their own templates
create policy tp_select_own_office on public.template_purchases
  for select to authenticated
  using (auth.uid() = office_id);

-- Supervisors can read everything (only if helper function exists)
do $$
begin
  if exists (select 1 from pg_proc where proname = 'is_supervisor') then
    execute $p$
      create policy tp_select_supervisor on public.template_purchases
        for select to authenticated
        using (public.is_supervisor())
    $p$;
  end if;
end$$;

-- Clients can insert their own purchase
create policy tp_insert_own_client on public.template_purchases
  for insert to authenticated
  with check (auth.uid() = client_id);

-- Clients can update their own purchase (e.g. cancel)
create policy tp_update_own_client on public.template_purchases
  for update to authenticated
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);

-- Office can update purchases of their own templates (e.g. mark delivered)
create policy tp_update_own_office on public.template_purchases
  for update to authenticated
  using (auth.uid() = office_id)
  with check (auth.uid() = office_id);


-- 4) Done. Verify with:
--    select * from public.template_purchases limit 1;
