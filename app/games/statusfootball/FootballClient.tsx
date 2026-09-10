// app/games/statusfootball/FootballClient.tsx
'use client';

import { useState } from 'react';
import { playPenaltyShootout, playAIMatch } from '@/lib/actions/football';
import { PenaltyZone, AI_CONFIGS } from '@/lib/engine/games/StatusFootballEngine';
import { Trophy, Target, Coins, Play, RefreshCw } from 'lucide-react';

interface FootballClientProps {
  initialBalance: number;
  recentMatches: any[];
}

export function FootballClient({ initialBalance, recentMatches }: FootballClientProps) {
  const [activeTab, setActiveTab] = useState<'penalty' | 'ai_match'>('penalty');
  const [stake, setStake] = useState<number>(100);
  const [loading, setLoading] = useState(false);

  // Penalty State
  const [selectedZone, setSelectedZone] = useState<PenaltyZone>('center');
  const [penaltyResult, setPenaltyResult] = useState<any | null>(null);

  // AI Match State
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [matchResult, setMatchResult] = useState<any | null>(null);

  const handlePlayPenalty = async () => {
    setLoading(true);
    setPenaltyResult(null);

    const res = await playPenaltyShootout(stake, selectedZone);
    setLoading(false);

    if (res.success) {
      setPenaltyResult(res);
    } else {
      alert(res.error);
    }
  };

  const handlePlayAIMatch = async () => {
    setLoading(true);
    setMatchResult(null);

    const res = await playAIMatch(stake, difficulty);
    setLoading(false);

    if (res.success) {
      setMatchResult(res);
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-slate-100">
      {/* Header & Wallet */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <Coins size={14} /> Balance: {initialBalance} SFP
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white">StatusFootball Arena</h1>
        <p className="text-slate-400 text-xs max-w-md mx-auto">
          Stake SFP in penalty shootouts or simulation matches against AI opponents.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 max-w-sm mx-auto">
        <button
          onClick={() => { setActiveTab('penalty'); setPenaltyResult(null); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'penalty'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Target size={16} /> Penalty (1.9x)
        </button>
        <button
          onClick={() => { setActiveTab('ai_match'); setMatchResult(null); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'ai_match'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy size={16} /> Match Arena
        </button>
      </div>

      {/* Main Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-3">
            Select Your SFP Stake
          </label>
          <div className="grid grid-cols-4 gap-3 mb-3">
            {[50, 100, 250, 500].map((amt) => (
              <button
                key={amt}
                onClick={() => setStake(amt)}
                className={`py-3 rounded-2xl font-black text-sm transition-all border ${
                  stake === amt
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {amt} SFP
              </button>
            ))}
          </div>
          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(Math.max(1, parseInt(e.target.value) || 0))}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-amber-400"
            placeholder="Custom SFP Amount..."
          />
        </div>

        {/* Penalty Mode */}
        {activeTab === 'penalty' && (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-3">
                Target Zone (Beat Keeper for 1.9x)
              </label>
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto aspect-[3/2] bg-slate-950 border-2 border-slate-800 rounded-2xl p-3">
                {(['top_left', 'center', 'top_right', 'bottom_left', 'center', 'bottom_right'] as PenaltyZone[]).map((zone, idx) => {
                  if (idx === 4) return null;
                  return (
                    <button
                      key={`${zone}-${idx}`}
                      onClick={() => setSelectedZone(zone)}
                      className={`rounded-xl border flex items-center justify-center font-black text-xs transition-all uppercase ${
                        selectedZone === zone
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {zone.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>

            {penaltyResult && (
              <div className={`p-6 rounded-2xl border text-center space-y-2 animate-fade-in ${
                penaltyResult.outcome.isGoal
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                <div className="text-2xl font-black uppercase">
                  {penaltyResult.outcome.isGoal ? 'GOAL! ⚽' : 'SAVED! 🧤'}
                </div>
                <p className="text-xs font-bold text-slate-300">
                  Keeper dived to: <span className="uppercase text-amber-400">{penaltyResult.outcome.keeperDive.replace('_', ' ')}</span>
                </p>
                <p className="text-sm font-black">
                  {penaltyResult.outcome.isGoal ? `Won +${penaltyResult.payout} SFP!` : `Lost ${stake} SFP`}
                </p>
              </div>
            )}

            <button
              onClick={handlePlayPenalty}
              disabled={loading || stake <= 0}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} />}
              <span>{loading ? 'Taking Penalty...' : `Take Shot (${stake} SFP)`}</span>
            </button>
          </div>
        )}

        {/* AI Match Mode */}
        {activeTab === 'ai_match' && (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-3">
                Opponent Difficulty
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      difficulty === diff
                        ? 'bg-amber-500/10 border-amber-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase block text-slate-400">
                      {AI_CONFIGS[diff].label}
                    </span>
                    <span className="text-xl font-black text-amber-400 block my-1">
                      {AI_CONFIGS[diff].multiplier}x
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {matchResult && (
              <div className={`p-6 rounded-2xl border text-center space-y-3 animate-fade-in ${
                matchResult.outcome.isWin
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : matchResult.outcome.isDraw
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="text-4xl font-black text-white tracking-wider">
                  YOU {matchResult.outcome.userGoals} - {matchResult.outcome.aiGoals} AI
                </div>
                <p className="text-sm font-bold">
                  {matchResult.outcome.isWin ? (
                    <span className="text-emerald-400">VICTORY! Won +{matchResult.payout} SFP!</span>
                  ) : matchResult.outcome.isDraw ? (
                    <span className="text-amber-400">DRAW! Stake refunded ({matchResult.payout} SFP).</span>
                  ) : (
                    <span className="text-red-400">DEFEAT! Lost {stake} SFP.</span>
                  )}
                </p>
              </div>
            )}

            <button
              onClick={handlePlayAIMatch}
              disabled={loading || stake <= 0}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} />}
              <span>{loading ? 'Simulating...' : `Stake ${stake} SFP & Play`}</span>
            </button>
          </div>
        )}
      </div>

      {/* Match History Table */}
      {recentMatches.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">
            Recent Matches
          </h3>
          <div className="space-y-2">
            {recentMatches.map((m) => (
              <div key={m.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300 uppercase">{m.match_type.replace('_', ' ')}</span>
                <span className="font-mono text-slate-400">{m.host_score} - {m.opponent_score}</span>
                <span className={`font-black ${m.payout_sfp > m.stake_sfp ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {m.payout_sfp > 0 ? `+${m.payout_sfp} SFP` : `-${m.stake_sfp} SFP`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
