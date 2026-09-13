'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import {
  PenaltyZone,
  resolvePenaltyShot,
  resolveAIMatch,
} from '@/lib/engine/games/StatusFootballEngine';

function friendlyError(error: { message: string } | null): string {
  if (!error) return 'Something went wrong. Please try again.';
  if (error.message.includes('insufficient balance')) return 'Insufficient SFP balance';
  if (error.message.includes('no wallet_accounts row')) return 'Wallet not found';
  console.error('football.ts RPC error:', error.message);
  return 'Something went wrong. Please try again.';
}

// --- Penalty Shootout Action ---
export async function playPenaltyShootout(wagerSFP: number, targetZone: PenaltyZone) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  if (wagerSFP <= 0) return { success: false, error: 'Enter a valid wager' };

  // Outcome resolved server-side, before touching the wallet — the browser
  // never sees or influences this calculation.
  const outcome = resolvePenaltyShot(targetZone);
  const payout = Math.floor(wagerSFP * outcome.payoutMultiplier);

  const admin = createServiceClient();
  const { data, error } = await admin
    .rpc('play_football_solo_wager', {
      p_user_id: user.id,
      p_match_type: 'penalty',
      p_wager_sfp: wagerSFP,
      p_payout_sfp: payout,
      p_host_score: outcome.isGoal ? 1 : 0,
      p_opponent_score: outcome.isGoal ? 0 : 1,
      p_idempotency_key: crypto.randomUUID(),
    })
    .single();

  if (error || !data) return { success: false, error: friendlyError(error) };

  revalidatePath('/games/statusfootball');

  return {
    success: true,
    outcome,
    payout,
    profit: payout - wagerSFP,
    newBalance: data.new_balance,
  };
}

// --- AI Match Wager Action ---
export async function playAIMatch(wagerSFP: number, difficulty: 'easy' | 'medium' | 'hard') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  if (wagerSFP <= 0) return { success: false, error: 'Enter a valid wager' };

  const outcome = resolveAIMatch(difficulty);
  const payout = Math.floor(wagerSFP * outcome.multiplier);

  const admin = createServiceClient();
  const { data, error } = await admin
    .rpc('play_football_solo_wager', {
      p_user_id: user.id,
      p_match_type: 'ai_wager',
      p_wager_sfp: wagerSFP,
      p_payout_sfp: payout,
      p_host_score: outcome.userGoals,
      p_opponent_score: outcome.aiGoals,
      p_idempotency_key: crypto.randomUUID(),
    })
    .single();

  if (error || !data) return { success: false, error: friendlyError(error) };

  revalidatePath('/games/statusfootball');

  return {
    success: true,
    outcome,
    payout,
    profit: payout - wagerSFP,
    newBalance: data.new_balance,
  };
}
