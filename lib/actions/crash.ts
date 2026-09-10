// lib/actions/crash.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { getGameEngine } from '@/lib/engine/Registry';
import { SessionManager } from '@/lib/engine/SessionManager';
import { revalidatePath } from 'next/cache';

/**
 * Starts a new StatusCrash session and locks in the SFP wager.
 */
export async function startCrashSession(wagerSFP: number) {
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!wagerSFP || wagerSFP <= 0) {
    return { success: false, error: 'Invalid wager amount' };
  }

  // 2. Check active SFP wallet balance
  const { data: wallet, error: walletError } = await supabase
    .from('wallet_accounts')
    .select('sfp_balance')
    .eq('user_id', user.id)
    .single();

  if (walletError || !wallet || wallet.sfp_balance < wagerSFP) {
    return { success: false, error: 'Insufficient SFP balance' };
  }

  // 3. Prevent duplicate active sessions
  const { data: existingSession } = await supabase
    .from('game_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('game_type', 'statuscrash')
    .eq('status', 'active')
    .maybeSingle();

  if (existingSession) {
    return { success: false, error: 'An active crash round is already in progress' };
  }

  // 4. Initialize engine state securely on server
  const crashEngine = getGameEngine('statuscrash');
  const { initialState } = await crashEngine.initializeSession(user.id, { wagerSFP });

  // 5. Create database game session record
  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .insert({
      user_id: user.id,
      game_type: 'statuscrash',
      status: 'active',
      config: { wagerSFP },
      state: initialState,
    })
    .select()
    .single();

  if (sessionError || !session) {
    return { success: false, error: 'Failed to create game session' };
  }

  // 6. Deduct wager SFP from user's wallet
  const { error: wagerDeductError } = await supabase
    .from('wallet_accounts')
    .update({ sfp_balance: wallet.sfp_balance - wagerSFP })
    .eq('user_id', user.id);

  if (wagerDeductError) {
    // Rollback session if wager deduction fails
    await supabase.from('game_sessions').delete().eq('id', session.id);
    return { success: false, error: 'Failed to deduct wager SFP' };
  }

  revalidatePath('/games/statuscrash');

  return {
    success: true,
    sessionId: session.id,
  };
}

/**
 * Validates player cash-out request against the server's hidden crash point.
 */
export async function cashOutCrashSession(sessionId: string, cashOutMultiplier: number) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Fetch session
  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (sessionError || !session || session.status !== 'active') {
    return { success: false, error: 'Session expired or invalid' };
  }

  const crashEngine = getGameEngine('statuscrash');
  
  // Validate cash-out logic
  const isValid = await crashEngine.validateAction(session, {
    type: 'cashout',
    payload: { cashOutMultiplier },
  });

  if (!isValid) {
    return { success: false, error: 'Invalid cash-out attempt' };
  }

  // Process cash-out multiplier calculation
  const { updatedState, actionResult } = await crashEngine.processAction(session, {
    type: 'cashout',
    payload: { cashOutMultiplier },
  });

  // Finalize session state
  const finalStatus = updatedState.status === 'cashed_out' ? 'completed' : 'abandoned';
  await supabase
    .from('game_sessions')
    .update({ status: finalStatus, state: updatedState })
    .eq('id', sessionId);

  // If successfully cashed out, credit payout via reward pipeline
  if (actionResult.success) {
    const rewardOutcome = await crashEngine['computeRawReward']({
      ...session,
      state: updatedState,
    });

    const rewardResult = await SessionManager.runRewardPipeline(
      user.id,
      sessionId,
      'statuscrash',
      rewardOutcome
    );

    revalidatePath('/games/statuscrash');

    return {
      success: true,
      cashedOut: true,
      multiplier: cashOutMultiplier,
      sfpWon: rewardOutcome.sfpAmount,
      transactionId: rewardResult.transactionId,
    };
  }

  revalidatePath('/games/statuscrash');

  return {
    success: true,
    cashedOut: false,
    reason: 'Round crashed before cash-out',
  };
}
