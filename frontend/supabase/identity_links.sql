-- identity_links table for multichain identity linking
-- Run this on your Supabase project's SQL editor or via psql/supabase CLI

create table if not exists public.identity_links (
  sui_address text primary key,
  eth_address text,
  ens_name text,
  ens_avatar text,
  created_at timestamptz default timezone('utc'::text, now())
);

create index if not exists idx_identity_links_eth_address on public.identity_links (eth_address);
create index if not exists idx_identity_links_ens_name on public.identity_links (ens_name);
