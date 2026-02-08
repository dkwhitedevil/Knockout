import { supabase } from '@/integrations/supabase/client';

export type ProfileRow = {
  id: string;
  display_name: string;
  ens_name: string;
  avatar_url: string | null;
  total_matches: number | null;
  wins: number | null;
  total_earnings: number | null;
  total_spent: number | null;
};

export async function getProfileById(id: string): Promise<ProfileRow | null> {
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('id, display_name, ens_name, avatar_url, total_matches, wins, total_earnings, total_spent')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as ProfileRow | null;
}
