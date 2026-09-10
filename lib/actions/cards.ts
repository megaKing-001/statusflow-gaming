// lib/actions/cards.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { getGameEngine } from '@/lib/engine/Registry';
import { SessionManager } from '@/lib/engine/SessionManager';
import { revalidatePath } from 'next/cache';

export async function playCardsRound(wagerSFP: number, prediction: 'higher' | 'lower') {
  const supabase = await createClient();

  // 1. Authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!wagerSFP || wagerSFP <= 0) {
    return { success: false, error: 'Invalid wager amount' };
  }

  // 2. Check SFP Wallet
  const { data: wallet, error: walletError } = await supabase
    .from('wallet_accounts')
    .select('sfp_balance')
    .eq('user_id', user.id)
    .single();

  if (walletError || !wallet || wallet.sfp_balance < wagerSFP) {
    return { success: false, error: 'Insufficient SFP balance' };
  }

  // 3. Deduct Wager SFP
  const { error: deductError } = await supabase
    .from('wallet_accounts')
    .update({ sfp_balance: wallet.sfp_balance - wagerSFP })
    .eq('user_id', user.id);

  if (deductError) {
    return { success: false, error: 'Failed to process wager' };
  }

  // 4. Initialize Engine & Session
  const cardsEngine = getGameEngine('statuscards');
  const { initialState } = await cardsEngine.initializeSession(user.id, { wagerSFP });

  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .insert({
      user_id: user.id,
      game_type: 'statuscards',
      status: 'active',
      config: { wagerSFP },
      state: initialState,
    })
    .select()
    .single();

  if (sessionError || !session) {
    return { success: false, error: 'Failed to start card round' };
  }

  // 5. Process Prediction
  const { updatedState, actionResult } = await cardsEngine.processAction(session, {
    type: 'predict',
    payload: { choice: prediction },
  });

  // 6. Complete Session & Credit Reward
  await supabase
    .from('game_sessions')
    .update({ status: 'completed', state: updatedState })
    .eq('id', session.id);

  const rewardOutcome = await cardsEngine['computeRawReward']({
    ...session,
    state: updatedState,
  });

  if (rewardOutcome.sfpAmount > 0) {
    await SessionManager.runRewardPipeline(
      user.id,
      session.id,
      'statuscards',
      rewardOutcome
    );
  }

  revalidatePath('/games/statuscards');

  return {
    success: true,
    initialCard: initialState.currentCard,
    drawnCard: actionResult.nextCard,
    isWin: actionResult.isWin,
    sfpWon: rewardOutcome.sfpAmount,
  };
}
