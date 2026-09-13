'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';

function friendlyError(error: { message: string } | null): string {
  if (!error) return 'Something went wrong. Please try again.';
  if (error.message.includes('insufficient balance')) return 'Insufficient SFP balance';
  if (error.message.includes('match no longer open')) return 'Lobby is no longer available';
  if (error.message.includes('match is not pending')) return 'Lobby is no longer available';
  if (error.message.includes('cannot join your own match')) return 'You cannot play against yourself';
  if (error.message.includes('match not found')) return 'Lobby not found or already started';
  if (error.message.includes('no wallet_accounts row')) return 'Wallet not found';
  console.error('football-pvp.ts RPC error:', error.message);
  return 'Something went wrong. Please try again.';
}

// 1. Create a PvP Match Challenge
export async function createPvPLobby(stakeSFP: number, idempotencyKey: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  if (stakeSFP <= 0) return { success: false, error: 'Enter a valid stake' };

  const admin = createServiceClient();
  const { data, error } = await admin
    .rpc('create_football_match', {
      p_host_id: user.id,
      p_stake_sfp: stakeSFP,
      p_idempotency_key: idempotencyKey,
    })
    .single();

  if (error || !data) return { success: false, error: friendlyError(error) };

  revalidatePath('/games/statusfootball');
  return {
    success: true,
    matchId: data.match_id,
    newBalance: data.new_available_balance,
    wasDuplicate: data.was_duplicate,
  };
}

// 2. Accept Challenge and Resolve Match
export async function acceptAndResolvePvPMatch(matchId: string, idempotencyKey: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: match } = await supabase
    .from('football_matches')
    .select('host_user_id')
    .eq('id', matchId)
    .single();

  if (match?.host_user_id === user.id) {
    return { success: false, error: 'You cannot play against yourself' };
  }

  const hostScore = Math.floor(Math.random() * 4);
  let opponentScore = Math.floor(Math.random() * 4);
  if (hostScore === opponentScore) {
    opponentScore += 1;
  }

  const admin = createServiceClient();
  const { data, error } = await admin
    .rpc('join_and_settle_football_match', {
      p_match_id: matchId,
      p_opponent_id: user.id,
      p_host_score: hostScore,
      p_opponent_score: opponentScore,
      p_idempotency_key: idempotencyKey,
    })
    .single();

  if (error || !data) return { success: false, error: friendlyError(error) };

  revalidatePath('/games/statusfootball');

  return {
    success: true,
    hostScore,
    opponentScore,
    winnerUserId: data.winner_user_id,
    pot: data.payout_sfp,
    isUserWinner: data.winner_user_id === user.id,
    wasDuplicate: data.was_duplicate,
  };
}

// 3. Cancel Open Lobby (Refund Host)
export async function cancelPvPLobby(matchId: string, idempotencyKey: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const admin = createServiceClient();
  const { data, error } = await admin
    .rpc('cancel_football_match', {
      p_match_id: matchId,
      p_host_id: user.id,
      p_idempotency_key: idempotencyKey,
    })
    .single();

  if (error || !data) return { success: false, error: friendlyError(error) };

  revalidatePath('/games/statusfootball');
  return { success: true, newBalance: data.new_available_balance, wasDuplicate: data.was_duplicate };
}
