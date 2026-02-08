import { supabase } from '@/integrations/supabase/client';

export type IdentityLink = {
  sui_address: string;
  eth_address: string | null;
  ens_name: string | null;
  ens_avatar: string | null;
  created_at?: string | null;
};


export async function getIdentityBySui(suiAddress: string) {
  const { data, error } = await (supabase as any)
    .from('identity_links')
    .select('sui_address, eth_address, ens_name, ens_avatar, created_at')
    .eq('sui_address', suiAddress)
    .maybeSingle();

  if (error) throw error;
  return data as IdentityLink | null;
}


export async function linkIdentity(payload: IdentityLink) {
  // Use upsert to ensure we don't create duplicate rows for the same Sui address.
  // This prevents PostgREST errors like PGRST116 when multiple rows exist.
  // The generated `Database` typing for the Supabase client may not include
  // the `identity_links` table; cast `supabase` to `any` for this call to
  // avoid TypeScript errors while preserving runtime behavior.
  const { data, error } = await (supabase as any)
    .from('identity_links')
    .upsert({ ...payload }, { onConflict: 'sui_address' })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as IdentityLink;
}


export async function upsertIdentity(payload: IdentityLink) {
  const { data, error } = await (supabase as any)
    .from('identity_links')
    .upsert({ ...payload }, { onConflict: 'sui_address' })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as IdentityLink;
}
