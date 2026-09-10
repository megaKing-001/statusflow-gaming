// lib/engine/games/StatusFootballEngine.ts

export type PenaltyZone = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'center';

export interface PenaltyResult {
  userChoice: PenaltyZone;
  keeperDive: PenaltyZone;
  isGoal: boolean;
  payoutMultiplier: number;
}

export interface AIDifficultyConfig {
  label: string;
  multiplier: number;
  winProbability: number;
}

export const AI_CONFIGS: Record<'easy' | 'medium' | 'hard', AIDifficultyConfig> = {
  easy: { label: 'Rookie AI', multiplier: 1.5, winProbability: 0.60 },
  medium: { label: 'Pro AI', multiplier: 2.0, winProbability: 0.45 },
  hard: { label: 'Legend AI', multiplier: 3.2, winProbability: 0.30 },
};

const PENALTY_ZONES: PenaltyZone[] = ['top_left', 'top_right', 'bottom_left', 'bottom_right', 'center'];

/**
 * Resolves a penalty kick wager.
 * 1.9x payout if keeper dives away from target.
 */
export function resolvePenaltyShot(targetZone: PenaltyZone): PenaltyResult {
  const keeperDive = PENALTY_ZONES[Math.floor(Math.random() * PENALTY_ZONES.length)];
  const isGoal = targetZone !== keeperDive;

  return {
    userChoice: targetZone,
    keeperDive,
    isGoal,
    payoutMultiplier: isGoal ? 1.9 : 0,
  };
}

/**
 * Resolves an AI match wager based on difficulty odds.
 */
export function resolveAIMatch(difficulty: 'easy' | 'medium' | 'hard') {
  const config = AI_CONFIGS[difficulty];
  const roll = Math.random();

  const isWin = roll < config.winProbability;
  const isDraw = !isWin && roll < (config.winProbability + 0.20);

  let userGoals = 0;
  let aiGoals = 0;
  let multiplier = 0;

  if (isWin) {
    multiplier = config.multiplier;
    userGoals = Math.floor(Math.random() * 3) + 2;
    aiGoals = Math.floor(Math.random() * userGoals);
  } else if (isDraw) {
    multiplier = 1.0; // Stake refund
    userGoals = Math.floor(Math.random() * 2) + 1;
    aiGoals = userGoals;
  } else {
    multiplier = 0;
    aiGoals = Math.floor(Math.random() * 3) + 2;
    userGoals = Math.floor(Math.random() * aiGoals);
  }

  return {
    isWin,
    isDraw,
    userGoals,
    aiGoals,
    multiplier,
  };
}
