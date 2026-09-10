// lib/actions/football.ts
'server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { 
  PenaltyZone, 
  resolvePenaltyShot, 
  resolveAIMatch 
} from '@/lib/engine/games/StatusFootballEngine';

// --- Penalty Shootout Action ---
export async function playPenaltyShootout(wagerSFP: number, targetZone: PenaltyZone) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  if (wagerSFP <= 0) return { success: false, error: 'Enter a valid wager' };

  // 1. Fetch wallet & verify balance
  const { data: wallet } = await supabase
    .from('wallet_accounts')
    .select('sfp_balance')
    .eq('user_id', user.id)
    .single();

  if (!wallet || wallet.sfp_balance < wagerSFP) {
    return { success: false, error: 'Insufficient SFP balance' };
  }

  // 2. Deduct initial wager
  await supabase
    .from('wallet_accounts')
    .update({ sfp_balance: wallet.sfp_balance - wagerSFP })
    .eq('user_id', user.id);

  // 3. Resolve outcome via Engine
  const outcome = resolvePenaltyShot(targetZone);
  const payout = Math.floor(wagerSFP * outcome.payoutMultiplier);

  // 4. Credit payout if won
  if (payout > 0) {
    const { data: currentWallet } = await supabase
      .from('wallet_accounts')
      .select('sfp_balance')
      .eq('user_id', user.id)
      .single();

    if (currentWallet) {
      await supabase
        .from('wallet_accounts')
        .update({ sfp_balance: currentWallet.sfp_balance + payout })
        .eq('user_id', user.id);
    }
  }

  // 5. Record match in database
  await supabase.from('football_matches').insert({
    host_user_id: user.id,
    match_type: 'penalty',
    stake_sfp: wagerSFP,
    payout_sfp: payout,
    host_score: outcome.isGoal ? 1 : 0,
    opponent_score: outcome.isGoal ? 0 : 1,
    status: 'completed',
    winner_user_id: outcome.isGoal ? user.id : null,
  });

  revalidatePath('/games/statusfootball');

  return {
    success: true,
    outcome,
    payout,
    profit: payout - wagerSFP,
  };
}

// --- Match Wager Action ---
export async function playAIMatch(wagerSFP: number, difficulty: 'easy' | 'medium' | 'hard') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  if (wagerSFP <= 0) return { success: false, error: 'Enter a valid wager' };

  // 1. Fetch wallet & verify balance
  const { data: wallet } = await supabase
    .from('wallet_accounts')
    .select('sfp_balance')
    .eq('user_id', user.id)
    .single();

  if (!wallet || wallet.sfp_balance < wagerSFP) {
    return { success: false, error: 'Insufficient SFP balance' };
  }

  // 2. Deduct initial wager
  await supabase
    .from('wallet_accounts')
    .update({ sfp_balance: wallet.sfp_balance - wagerSFP })
    .eq('user_id', user.id);

  // 3. Resolve outcome via Engine
  const outcome = resolveAIMatch(difficulty);
  const payout = Math.floor(wagerSFP * outcome.multiplier);

  // 4. Credit payout if won/draw refund
  if (payout > 0) {
    const { data: currentWallet } = await supabase
      .from('wallet_accounts')
      .select('sfp_balance')
      .eq('user_id', user.id)
      .single();

    if (currentWallet) {
      await supabase
        .from('wallet_accounts')
        .update({ sfp_balance: currentWallet.sfp_balance + payout })
        .eq('user_id', user.id);
    }
  }

  // 5. Record match in database
  await supabase.from('football_matches').insert({
    host_user_id: user.id,
    match_type: 'ai_wager',
    stake_sfp: wagerSFP,
    payout_sfp: payout,
    host_score: outcome.userGoals,
    opponent_score: outcome.aiGoals,
    status: 'completed',
    winner_user_id: outcome.isWin ? user.id : null,
  });

  revalidatePath('/games/statusfootball');

  return {
    success: true,
    outcome,
    payout,
    profit: payout - wagerSFP,
  };
}
