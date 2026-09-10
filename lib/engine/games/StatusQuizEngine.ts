// lib/engine/games/StatusQuizEngine.ts
import { BaseGameEngine } from '../BaseGameEngine';
import { GameSession, GameAction, GameResult, RewardOutcome } from '../types';

export interface QuizConfig {
  questionCount: number;
  timeLimitSeconds: number;
}

export interface QuizQuestionSafe {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizState {
  questions: QuizQuestionSafe[];
  answers: Record<string, { selectedOption: string; isCorrect: boolean; points: number }>;
  score: number;
}

export class StatusQuizEngine extends BaseGameEngine<QuizConfig, QuizState, any> {
  readonly slug = 'statusquiz';

  async initializeSession(
    userId: string,
    config: QuizConfig
  ): Promise<{ initialState: QuizState; safeClientState: Partial<QuizState> }> {
    // Note: Question fetching and random assignment occur securely inside the Server Action / RPC wrapper
    const initialState: QuizState = {
      questions: [],
      answers: {},
      score: 0,
    };

    return {
      initialState,
      safeClientState: {
        questions: [], // Exposes sanitized questions array (no correct_option)
      },
    };
  }

  async validateAction(session: GameSession<QuizState>, action: GameAction<any>): Promise<boolean> {
    if (session.status !== 'active') return false;
    
    // Enforce strict server-side deadline (timeLimitSeconds + 3s grace for network latency)
    const startTime = new Date(session.createdAt).getTime();
    const maxDurationMs = (session.config.timeLimitSeconds + 3) * 1000;
    if (Date.now() - startTime > maxDurationMs) {
      return false;
    }

    return true;
  }

  async processAction(
    session: GameSession<QuizState>,
    action: GameAction<{ questionId: string; selectedOption: string }>
  ): Promise<{ updatedState: QuizState; actionResult: any }> {
    // Execution handled during answer validation step
    return { updatedState: session.state, actionResult: { status: 'recorded' } };
  }

  protected async computeRawReward(session: GameSession<QuizState>): Promise<RewardOutcome> {
    const score = session.state.score || 0;
    let sfp = 0;

    // Strict SFP Tier Structure
    if (score >= 80) sfp = 30;
    else if (score >= 60) sfp = 20;
    else if (score >= 40) sfp = 10;
    else if (score >= 20) sfp = 5;

    return {
      sfpAmount: sfp,
      reason: `StatusQuiz Completion Reward (Score: ${score})`,
    };
  }
}
