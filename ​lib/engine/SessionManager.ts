// lib/engine/SessionManager.ts
import { createClient } from '@/lib/supabase/server';
import { GameSession, RewardOutcome } from './types';

export class SessionManager {
  /**
   * Credits earned SFP rewards to the user's wallet via atomic RPC.
   */
  static async runRewardPipeline(
    userId: string,
    sessionId: string,
    gameSlug: string,
    reward: RewardOutcome
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    if (reward.sfpAmount <= 0) {
      return { success: true };
    }

    const supabase = await createClient();
    const idempotencyKey = `sfp_reward:${gameSlug}:${sessionId}`;

    const { data, error } = await supabase.rpc('credit_sfp_reward', {
      p_user_id: userId,
      p_amount: reward.sfpAmount,
      p_idempotency_key: idempotencyKey,
      p_game_slug: gameSlug,
      p_session_id: sessionId,
    });

    if (error) {
      console.error('[SessionManager] Reward RPC Error:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      transactionId: data?.transaction_id,
    };
  }
}
