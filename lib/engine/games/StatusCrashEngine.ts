// lib/engine/games/StatusCrashEngine.ts
import { BaseGameEngine } from '../BaseGameEngine';
import { GameSession, GameAction, RewardOutcome } from '../types';
import crypto from 'crypto';

export interface CrashConfig {
  wagerSFP: number; // SFP amount risked for the round
}

export interface CrashState {
  crashPoint: number; // e.g. 2.45x
  cashedOutMultiplier?: number;
  status: 'running' | 'cashed_out' | 'crashed';
}

export class StatusCrashEngine extends BaseGameEngine<CrashConfig, CrashState, any> {
  readonly slug = 'statuscrash';

  /**
   * Generates a provably fair crash multiplier between 1.00x and 100.00x
   */
  private generateCrashPoint(): number {
    const randomHex = crypto.randomBytes(4).toString('hex');
    const intVal = parseInt(randomHex, 16);
    // Exponential distribution curve favoring lower multipliers
    const rawMultiplier = 99 / (1 + (intVal % 99)) + 0.01;
    const clamped = Math.max(1.0, Math.min(100.0, rawMultiplier));
    return parseFloat(clamped.toFixed(2));
  }

  async initializeSession(
    userId: string,
    config: CrashConfig
  ): Promise<{ initialState: CrashState; safeClientState: Partial<CrashState> }> {
    const crashPoint = this.generateCrashPoint();

    const initialState: CrashState = {
      crashPoint,
      status: 'running',
    };

    return {
      initialState,
      safeClientState: {
        status: 'running', // Explicitly hide crashPoint from the client
      },
    };
  }

  async validateAction(session: GameSession<CrashState>, action: GameAction<{ cashOutMultiplier: number }>): Promise<boolean> {
    if (session.status !== 'active' || session.state.status !== 'running') {
      return false;
    }

    const { cashOutMultiplier } = action.payload;

    // Reject invalid multiplier attempts
    if (!cashOutMultiplier || cashOutMultiplier < 1.0) {
      return false;
    }

    return true;
  }

  async processAction(
    session: GameSession<CrashState>,
    action: GameAction<{ cashOutMultiplier: number }>
  ): Promise<{ updatedState: CrashState; actionResult: any }> {
    const { cashOutMultiplier } = action.payload;
    const { crashPoint } = session.state;

    if (cashOutMultiplier <= crashPoint) {
      // Successful Cash Out
      const updatedState: CrashState = {
        ...session.state,
        cashedOutMultiplier: cashOutMultiplier,
        status: 'cashed_out',
      };
      return { updatedState, actionResult: { success: true, multiplier: cashOutMultiplier } };
    } else {
      // Player attempted to cash out after the server crash point
      const updatedState: CrashState = {
        ...session.state,
        status: 'crashed',
      };
      return { updatedState, actionResult: { success: false, reason: 'crashed' } };
    }
  }

  protected async computeRawReward(session: GameSession<CrashState>): Promise<RewardOutcome> {
    if (session.state.status !== 'cashed_out' || !session.state.cashedOutMultiplier) {
      return { sfpAmount: 0, reason: 'StatusCrash Round Lost' };
    }

    const wager = session.config.wagerSFP || 0;
    const profitSFP = Math.floor(wager * session.state.cashedOutMultiplier);

    return {
      sfpAmount: profitSFP,
      reason: `StatusCrash Win (${session.state.cashedOutMultiplier}x on ${wager} SFP)`,
    };
  }
}
