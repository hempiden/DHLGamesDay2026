import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Match } from './types';

let supabaseInstance: SupabaseClient | null = null;

// Initialize Supabase Client dynamically
export function getSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  const finalUrl = url || localStorage.getItem('dhl_supabase_url') || 'https://yaabfbyzvcqmnlzlribl.supabase.co';
  const finalKey = anonKey || localStorage.getItem('dhl_supabase_anon_key') || 'sb_publishable_UG2etT68udwph9BSHi_ciw_ydzIUjLR';

  if (!finalUrl || !finalKey || finalUrl.includes('YOUR_PROJECT_ID') || finalKey.includes('YOUR_ANON_KEY')) {
    supabaseInstance = null;
    return null;
  }

  try {
    if (!supabaseInstance) {
      supabaseInstance = createClient(finalUrl, finalKey);
    }
    return supabaseInstance;
  } catch (error) {
    console.error('Supabase Initialization Error:', error);
    return null;
  }
}

// Check database connection
export async function testSupabaseConnection(url: string, key: string): Promise<boolean> {
  try {
    const client = createClient(url, key);
    // Simple query to verify keys
    const { error } = await client.from('matches').select('id').limit(1);
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      // PGRST116 means empty result, 42P01 means table does not exist but keys are authorized
      console.warn('Supabase Auth warning:', error);
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

// Push local matches state to remote database
export async function syncLocalToSupabase(matches: Match[], client: SupabaseClient): Promise<void> {
  for (const match of matches) {
    const dbMatch = {
      sport_name: match.sport_name,
      match_label: match.match_label,
      team_a: match.team_a,
      team_b: match.team_b,
      score_a: match.score_a,
      score_b: match.score_b,
      status: match.status,
    };

    // Upsert by sport and teams if we are mapping
    const { error } = await client
      .from('matches')
      .upsert({ ...dbMatch, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    
    if (error) {
      console.error(`Sync error for match ${match.id}:`, error.message);
    }
  }
}
