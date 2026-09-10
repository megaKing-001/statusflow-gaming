// lib/actions/wheel.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { getGameEngine } from '@/lib/engine/Registry';
import { SessionManager } from '@/lib/engine/SessionManager';
import { revalidatePath } from 'next/cache';

const WHEEL_ENTRY_FEE = 100; // SFP per spin

export async function executeWheelSpin() {
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Check SFP wallet balance
  const { data: wallet, error: walletError } = await supabase
    .from('wallet_accounts')
    .select('sfp_balance')
    .eq('user_id', user.id)
    .single();

  if (walletError || !wallet || wallet.sfp_balance < WHEEL_ENTRY_FEE) {
    return { success: false, error: 'Insufficient SFP balance (100 SFP required)' };
  }

  // 3. Deduct entry fee
  const { error: deductError } = await supabase
    .from('wallet_accounts')
    .update({ sfp_balance: wallet.sfp_balance - WHEEL_ENTRY_FEE })
    .eq('user_id', user.id);

  if (deductError) {
    return { success: false, error: 'Failed to process spin entry fee' };
  }

  // 4. Create active session
  const wheelEngine = getGameEngine('statuswheel');
  const { initialState } = await wheelEngine.initializeSession(user.id, { entryFeeSFP: WHEEL_ENTRY_FEE });

  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .insert({
      user_id: user.id,
      game_type: 'statuswheel',
      status: 'active',
      config: { entryFeeSFP: WHEEL_ENTRY_FEE },
      state: initialState,
    })
    .select()
    .single();

  if (sessionError || !session) {
    return { success: false, error: 'Failed to initialize spin session' };
  }

  // 5. Process spin calculation immediately on server
  const { updatedState, actionResult } = await wheelEngine.processAction(session, {
    type: 'spin',
    payload: {},
  });

  // 6. Complete session & trigger atomic reward pipeline
  await supabase
    .from('game_sessions')
    .update({ status: 'completed', state: updatedState })
    .eq('id', session.id);

  const rewardOutcome = await wheelEngine['computeRawReward']({
    ...session,
    state: updatedState,
  });

  const rewardResult = await SessionManager.runRewardPipeline(
    user.id,
    session.id,
    'statuswheel',
    rewardOutcome
  );

  revalidatePath('/games/statuswheel');

  return {
    success: true,
    winningSliceId: actionResult.winningSliceId,
    sfpWon: rewardOutcome.sfpAmount,
    label: actionResult.label,
    rewardSuccess: rewardResult.success,
  };
}
