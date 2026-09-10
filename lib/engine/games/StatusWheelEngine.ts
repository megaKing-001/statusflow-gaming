// lib/engine/games/StatusWheelEngine.ts
import { BaseGameEngine } from '../BaseGameEngine';
import { GameSession, GameAction, RewardOutcome } from '../types';
import crypto from 'crypto';

export interface WheelSlice {
  id: number;
  label: string;
  sfpReward: number;
  tier: 'common' | 'rare' | 'legendary';
  weight: number; // Higher weight = higher probability
}

export const WHEEL_SLICES: WheelSlice[] = [
  { id: 0, label: '50 SFP', sfpReward: 50, tier: 'common', weight: 40 },
  { id: 1, label: '100 SFP', sfpReward: 100, tier: 'common', weight: 30 },
  { id: 2, label: '250 SFP', sfpReward: 250, tier: 'rare', weight: 15 },
  { id: 3, label: '500 SFP', sfpReward: 500, tier: 'rare', weight: 10 },
  { id: 4, label: '1,000 SFP', sfpReward: 1000, tier: 'legendary', weight: 4 },
  { id: 5, label: '2,500 SFP', sfpReward: 2500, tier: 'legendary', weight: 1 },
];

export interface WheelConfig {
  entryFeeSFP: number;
}

export interface WheelState {
  winningSliceId?: number;
  status: 'idle' | 'spun';
}

export class StatusWheelEngine extends BaseGameEngine<WheelConfig, WheelState, any> {
  readonly slug = 'statuswheel';

  /**
   * Deterministically selects a slice based on server-side weighted probabilities.
   */
  private selectWeightedSlice(): WheelSlice {
    const totalWeight = WHEEL_SLICES.reduce((acc, slice) => acc + slice.weight, 0);
    const randomHex = crypto.randomBytes(4).toString('hex');
    const randomValue = (parseInt(randomHex, 16) % totalWeight) + 1;

    let cumulative = 0;
    for (const slice of WHEEL_SLICES) {
      cumulative += slice.weight;
      if (randomValue <= cumulative) {
        return slice;
      }
    }
    return WHEEL_SLICES[0];
  }

  async initializeSession(
    userId: string,
    config: WheelConfig
  ): Promise<{ initialState: WheelState; safeClientState: Partial<WheelState> }> {
    return {
      initialState: { status: 'idle' },
      safeClientState: { status: 'idle' },
    };
  }

  async validateAction(session: GameSession<WheelState>, action: GameAction<any>): Promise<boolean> {
    return session.status === 'active' && session.state.status === 'idle';
  }

  async processAction(
    session: GameSession<WheelState>,
    action: GameAction<any>
  ): Promise<{ updatedState: WheelState; actionResult: any }> {
    const winningSlice = this.selectWeightedSlice();

    const updatedState: WheelState = {
      winningSliceId: winningSlice.id,
      status: 'spun',
    };

    return {
      updatedState,
      actionResult: {
        winningSliceId: winningSlice.id,
        rewardSfp: winningSlice.sfpReward,
        label: winningSlice.label,
      },
    };
  }

  protected async computeRawReward(session: GameSession<WheelState>): Promise<RewardOutcome> {
    if (session.state.winningSliceId === undefined) {
      return { sfpAmount: 0, reason: 'StatusWheel Invalid Spin' };
    }

    const slice = WHEEL_SLICES.find((s) => s.id === session.state.winningSliceId);
    const reward = slice ? slice.sfpReward : 0;

    return {
      sfpAmount: reward,
      reason: `StatusWheel Prize (${slice?.label || '0 SFP'})`,
    };
  }
}
