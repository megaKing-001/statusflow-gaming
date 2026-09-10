// lib/actions/daily.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const DAILY_REWARD_SFP = 250;

/**
 * Checks if the current user has already claimed today's daily SFP reward.
 */
export async function checkDailyClaimStatus() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { claimedToday: false, error: 'Unauthorized' };
  }

  // Generate UTC date key (e.g., "2026-09-10")
  const todayStr = new Date().toISOString().split('T')[0];
  const idempotencyKey = `daily:claim:${user.id}:${todayStr}`;

  // Check if a transaction with this idempotency key already exists
  const { data: existingTx } = await supabase
    .from('wallet_transactions')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  return {
    claimedToday: !!existingTx,
    rewardAmount: DAILY_REWARD_SFP,
  };
}

/**
 * Atomically credits daily SFP reward to user's wallet.
 */
export async function claimDailySfpBonus() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const idempotencyKey = `daily:claim:${user.id}:${todayStr}`;

  // Atomic ledger credit using stored procedure
  const { data: txId, error: rpcError } = await supabase.rpc('credit_sfp_reward', {
    p_user_id: user.id,
    p_amount: DAILY_REWARD_SFP,
    p_reason: `Daily Login Bonus (${todayStr})`,
    p_idempotency_key: idempotencyKey,
  });

  if (rpcError) {
    return { success: false, error: 'Already claimed today or wallet error' };
  }

  revalidatePath('/daily');

  return {
    success: true,
    sfpAmount: DAILY_REWARD_SFP,
    transactionId: txId,
  };
}
