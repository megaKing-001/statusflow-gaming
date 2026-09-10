// app/games/statuscards/CardsClient.tsx
'use client';

import { useState } from 'react';
import { playCardsRound } from '@/lib/actions/cards';
import { ArrowUp, ArrowDown, Sparkles, Trophy, AlertCircle, RefreshCw } from 'lucide-react';

interface Card {
  rank: number;
  suit: string;
  label: string;
}

export function CardsClient() {
  const [wager, setWager] = useState<number>(100);
  const [currentCard, setCurrentCard] = useState<Card | null>({
    rank: 7,
    suit: '♠',
    label: '7♠',
  });
  const [nextCard, setNextCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{ isWin: boolean; sfpWon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async (prediction: 'higher' | 'lower') => {
    if (wager <= 0 || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setNextCard(null);

    try {
      const response = await playCardsRound(wager, prediction);

      if (!response.success) {
        setError(response.error || 'Failed to play round');
        setLoading(false);
        return;
      }

      setCurrentCard(response.initialCard);
      setNextCard(response.drawnCard);
      setResult({
        isWin: response.isWin,
        sfpWon: response.sfpWon,
      });
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getSuitColor = (suit: string) => {
    return suit === '♥' || suit === '♦' ? 'text-red-500' : 'text-slate-100';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Game Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest">
          <Sparkles size={14} /> High / Low Card Engine
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">StatusCards</h1>
        <p className="text-slate-400 text-xs sm:text-sm">
          Will the next card drawn be higher or lower in rank than the current card?
        </p>
      </div>

      {/* Cards Arena */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center min-h-[320px] relative overflow-hidden">
        {/* Error Alert */}
        {error && (
          <div className="w-full mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Display Cards Side-by-Side */}
        <div className="flex items-center justify-center gap-6 sm:gap-12 my-4">
          {/* Current Card */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Card</span>
            <div className="w-32 h-48 sm:w-40 sm:h-56 bg-slate-950 border-2 border-slate-700 rounded-2xl p-4 flex flex-col justify-between shadow-xl transition-all">
              <div className={`text-2xl sm:text-3xl font-black ${currentCard ? getSuitColor(currentCard.suit) : ''}`}>
                {currentCard?.label}
              </div>
              <div className={`text-5xl sm:text-6xl text-center font-bold ${currentCard ? getSuitColor(currentCard.suit) : ''}`}>
                {currentCard?.suit}
              </div>
              <div className={`text-2xl sm:text-3xl font-black text-right ${currentCard ? getSuitColor(currentCard.suit) : ''}`}>
                {currentCard?.label}
              </div>
            </div>
          </div>

          {/* VS Divider */}
          <div className="text-2xl font-black text-slate-600">VS</div>

          {/* Next Card / Drawn Card */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next Card</span>
            <div className={`w-32 h-48 sm:w-40 sm:h-56 bg-slate-950 border-2 ${
              nextCard ? (result?.isWin ? 'border-emerald-500/80' : 'border-red-500/80') : 'border-slate-800 border-dashed'
            } rounded-2xl p-4 flex flex-col justify-between shadow-xl transition-all`}>
              {nextCard ? (
                <>
                  <div className={`text-2xl sm:text-3xl font-black ${getSuitColor(nextCard.suit)}`}>
                    {nextCard.label}
                  </div>
                  <div className={`text-5xl sm:text-6xl text-center font-bold ${getSuitColor(nextCard.suit)}`}>
                    {nextCard.suit}
                  </div>
                  <div className={`text-2xl sm:text-3xl font-black text-right ${getSuitColor(nextCard.suit)}`}>
                    {nextCard.label}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-700 text-4xl font-black">
                  ?
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Outcome Banner */}
        {result && (
          <div className={`mt-6 p-4 rounded-xl text-center border w-full max-w-md ${
            result.isWin
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <p className="font-extrabold text-base flex items-center justify-center gap-2">
              {result.isWin ? <Trophy size={18} /> : null}
              {result.isWin ? `Correct! You won +${result.sfpWon} SFP` : 'Incorrect Prediction!'}
            </p>
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Wager Selection */}
        <div>
          <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
            Wager Amount (SFP)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={10}
              step={10}
              value={wager}
              onChange={(e) => setWager(Math.max(10, parseInt(e.target.value) || 0))}
              disabled={loading}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-lg focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => setWager((w) => w + 50)}
              disabled={loading}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all whitespace-nowrap"
            >
              +50
            </button>
            <button
              onClick={() => setWager((w) => w + 200)}
              disabled={loading}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all whitespace-nowrap"
            >
              +200
            </button>
          </div>
        </div>

        {/* Prediction Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handlePredict('higher')}
            disabled={loading}
            className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : (
              <>
                <ArrowUp size={24} />
                <span>HIGHER</span>
              </>
            )}
          </button>

          <button
            onClick={() => handlePredict('lower')}
            disabled={loading}
            className="py-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : (
              <>
                <ArrowDown size={24} />
                <span>LOWER</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
