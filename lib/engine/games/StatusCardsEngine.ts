// lib/engine/games/StatusCardsEngine.ts
import { BaseGameEngine } from '../BaseGameEngine';
import { GameSession, GameAction, RewardOutcome } from '../types';
import crypto from 'crypto';

export type Suit = '♠' | '♥' | '♦' | '♣';
export type Card = {
  rank: number; // 2 to 14 (11=J, 12=Q, 13=K, 14=A)
  suit: Suit;
  label: string;
};

export interface CardsConfig {
  wagerSFP: number;
}

export interface CardsState {
  currentCard: Card;
  nextCard?: Card;
  guess?: 'higher' | 'lower';
  isWin?: boolean;
  status: 'active' | 'completed';
}

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const RANK_LABELS: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

export class StatusCardsEngine extends BaseGameEngine<CardsConfig, CardsState, any> {
  readonly slug = 'statuscards';

  private drawRandomCard(): Card {
    const rank = Math.floor(Math.random() * 13) + 2; // 2 to 14
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    return {
      rank,
      suit,
      label: `${RANK_LABELS[rank]}${suit}`,
    };
  }

  async initializeSession(
    userId: string,
    config: CardsConfig
  ): Promise<{ initialState: CardsState; safeClientState: Partial<CardsState> }> {
    const initialCard = this.drawRandomCard();
    const initialState: CardsState = {
      currentCard: initialCard,
      status: 'active',
    };

    return {
      initialState,
      safeClientState: {
        currentCard: initialCard,
        status: 'active',
      },
    };
  }

  async validateAction(session: GameSession<CardsState>, action: GameAction<any>): Promise<boolean> {
    if (session.status !== 'active' || session.state.status !== 'active') return false;
    if (action.type !== 'predict') return false;
    const choice = action.payload?.choice;
    return choice === 'higher' || choice === 'lower';
  }

  async processAction(
    session: GameSession<CardsState>,
    action: GameAction<any>
  ): Promise<{ updatedState: CardsState; actionResult: any }> {
    const guess: 'higher' | 'lower' = action.payload.choice;
    let nextCard = this.drawRandomCard();

    // Prevent identical card draw for cleaner UX
    while (nextCard.rank === session.state.currentCard.rank) {
      nextCard = this.drawRandomCard();
    }

    const currentRank = session.state.currentCard.rank;
    const nextRank = nextCard.rank;

    const isWin =
      (guess === 'higher' && nextRank > currentRank) ||
      (guess === 'lower' && nextRank < currentRank);

    const updatedState: CardsState = {
      currentCard: session.state.currentCard,
      nextCard,
      guess,
      isWin,
      status: 'completed',
    };

    return {
      updatedState,
      actionResult: {
        nextCard,
        isWin,
        multiplier: isWin ? 1.8 : 0,
      },
    };
  }

  protected async computeRawReward(session: GameSession<CardsState>): Promise<RewardOutcome> {
    if (!session.state.isWin) {
      return { sfpAmount: 0, reason: 'StatusCards Loss' };
    }

    const wager = session.config.wagerSFP || 100;
    const payout = Math.floor(wager * 1.8);

    return {
      sfpAmount: payout,
      reason: `StatusCards Win (${session.state.guess?.toUpperCase()} correctly predicted)`,
    };
  }
}
