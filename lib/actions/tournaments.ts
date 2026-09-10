// lib/actions/tournaments.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getActiveTournaments() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      *,
      tournament_participants (
        id,
        user_id,
        score
      )
    `)
    .order('end_time', { ascending: true });

  if (error) {
    console.error('Failed to fetch tournaments:', error);
    return [];
  }

  return data || [];
}

export async function joinTournament(tournamentId: string) {
  const supabase = await createClient();

  // 1. Authenticate User
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  // 2. Fetch Tournament details
  const { data: tournament, error: tourneyError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single();

  if (tourneyError || !tournament) {
    return { success: false, error: 'Tournament not found' };
  }

  if (tournament.status !== 'active') {
    return { success: false, error: 'Tournament is not active' };
  }

  // 3. Check if entry fee is required
  if (tournament.entry_fee_sfp > 0) {
    const { data: wallet } = await supabase
      .from('wallet_accounts')
      .select('sfp_balance')
      .eq('user_id', user.id)
      .single();

    if (!wallet || wallet.sfp_balance < tournament.entry_fee_sfp) {
      return { success: false, error: 'Insufficient SFP balance for entry fee' };
    }

    // Deduct entry fee
    await supabase
      .from('wallet_accounts')
      .update({ sfp_balance: wallet.sfp_balance - tournament.entry_fee_sfp })
      .eq('user_id', user.id);
  }

  // 4. Register Participant
  const { error: joinError } = await supabase
    .from('tournament_participants')
    .insert({
      tournament_id: tournamentId,
      user_id: user.id,
      score: 0,
    });

  if (joinError) {
    if (joinError.code === '23505') {
      return { success: false, error: 'You are already registered in this tournament' };
    }
    return { success: false, error: 'Failed to join tournament' };
  }

  revalidatePath('/tournaments');
  return { success: true };
}

export async function getGlobalLeaderboard() {
  const supabase = await createClient();

  // Fetch top SFP balances for global leaderboard
  const { data, error } = await supabase
    .from('wallet_accounts')
    .select('user_id, sfp_balance, updated_at')
    .order('sfp_balance', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Failed to fetch leaderboard:', error);
    return [];
  }

  return data || [];
}
