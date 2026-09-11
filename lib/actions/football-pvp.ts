// lib/actions/football-pvp.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// 1. Create a PvP Match Challenge
export async function createPvPLobby(stakeSFP: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  if (stakeSFP <= 0) return { success: false, error: 'Enter a valid stake' };

  // Verify and deduct host stake
  const { data: wallet } = await supabase
    .from('wallet_accounts')
    .select('sfp_balance')
    .eq('user_id', user.id)
    .single();

  if (!wallet || wallet.sfp_balance < stakeSFP) {
    return { success: false, error: 'Insufficient SFP balance' };
  }

  await supabase
    .from('wallet_accounts')
    .update({ sfp_balance: wallet.sfp_balance - stakeSFP })
    .eq('user_id', user.id);

  // Insert pending lobby record
  const { data: match, error } = await supabase
    .from('football_matches')
    .insert({
      host_user_id: user.id,
      match_type: 'pvp_wager',
      stake_sfp: stakeSFP,
      status: 'pending',
    })
    .select()
    .single();

  if (error) return { success: false, error: 'Failed to create lobby' };

  revalidatePath('/games/statusfootball');
  return { success: true, matchId: match.id };
}

// 2. Accept Challenge and Resolve Match
export async function acceptAndResolvePvPMatch(matchId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Fetch match details
  const { data: match } = await supabase
    .from('football_matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (!match || match.status !== 'pending') {
    return { success: false, error: 'Lobby is no longer available' };
  }

  if (match.host_user_id === user.id) {
    return { success: false, error: 'You cannot play against yourself' };
  }

  // Verify and deduct opponent stake
  const { data: wallet } = await supabase
    .from('wallet_accounts')
    .select('sfp_balance')
    .eq('user_id', user.id)
    .single();

  if (!wallet || wallet.sfp_balance < match.stake_sfp) {
    return { success: false, error: 'Insufficient SFP balance' };
  }

  await supabase
    .from('wallet_accounts')
    .update({ sfp_balance: wallet.sfp_balance - match.stake_sfp })
    .eq('user_id', user.id);

  // Resolve server match (Winner Takes All Pot)
  const hostScore = Math.floor(Math.random() * 4);
  let opponentScore = Math.floor(Math.random() * 4);
  
  // Guarantee a winner for non-draw direct winner takes all
  if (hostScore === opponentScore) {
    opponentScore += 1;
  }

  const isHostWinner = hostScore > opponentScore;
  const winnerUserId = isHostWinner ? match.host_user_id : user.id;
  const totalPot = match.stake_sfp * 2;

  // Credit full pot to winner
  const { data: winnerWallet } = await supabase
    .from('wallet_accounts')
    .select('sfp_balance')
    .eq('user_id', winnerUserId)
    .single();

  if (winnerWallet) {
    await supabase
      .from('wallet_accounts')
      .update({ sfp_balance: winnerWallet.sfp_balance + totalPot })
      .eq('user_id', winnerUserId);
  }

  // Update match status to completed
  await supabase
    .from('football_matches')
    .update({
      opponent_user_id: user.id,
      host_score: hostScore,
      opponent_score: opponentScore,
      payout_sfp: totalPot,
      winner_user_id: winnerUserId,
      status: 'completed',
    })
    .eq('id', matchId);

  revalidatePath('/games/statusfootball');

  return {
    success: true,
    hostScore,
    opponentScore,
    winnerUserId,
    pot: totalPot,
    isUserWinner: winnerUserId === user.id,
  };
}

// 3. Cancel Open Lobby (Refund Host)
export async function cancelPvPLobby(matchId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: match } = await supabase
    .from('football_matches')
    .select('*')
    .eq('id', matchId)
    .eq('host_user_id', user.id)
    .eq('status', 'pending')
    .single();

  if (!match) return { success: false, error: 'Lobby not found or already started' };

  // Refund host SFP
  const { data: wallet } = await supabase
    .from('wallet_accounts')
    .select('sfp_balance')
    .eq('user_id', user.id)
    .single();

  if (wallet) {
    await supabase
      .from('wallet_accounts')
      .update({ sfp_balance: wallet.sfp_balance + match.stake_sfp })
      .eq('user_id', user.id);
  }

  await supabase
    .from('football_matches')
    .update({ status: 'cancelled' })
    .eq('id', matchId);

  revalidatePath('/games/statusfootball');
  return { success: true };
}
