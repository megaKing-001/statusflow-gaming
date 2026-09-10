// app/games/statuscrash/CrashClient.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { startCrashSession, cashOutCrashSession } from '@/lib/actions/crash';
import { Zap, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function CrashClient() {
  const [wager, setWager] = useState<number>(100);
  const [status, setStatus] = useState<'idle' | 'running' | 'cashed_out' | 'crashed'>('idle');
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [winData, setWinData] = useState<{ sfpWon: number; mult: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const multiplierRef = useRef(1.00);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startAnimation = () => {
    startTimeRef.current = Date.now();
    multiplierRef.current = 1.00;
    setMultiplier(1.00);

    const update = () => {
      if (!startTimeRef.current) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const currentMult = parseFloat((1.0 + 0.05 * Math.pow(elapsed, 1.8)).toFixed(2));
      
      multiplierRef.current = currentMult;
      setMultiplier(currentMult);

      animFrameRef.current = requestAnimationFrame(update);
    };

    animFrameRef.current = requestAnimationFrame(update);
  };

  const stopAnimation = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  const handleStartRound = async () => {
    if (wager <= 0 || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setWinData(null);

    const res = await startCrashSession(wager);
    setIsSubmitting(false);

    if (!res.success || !res.sessionId) {
      setErrorMessage(res.error || 'Failed to start round');
      return;
    }

    setSessionId(res.sessionId);
    setStatus('running');
    startAnimation();
  };

  const handleCashOut = async () => {
    if (status !== 'running' || !sessionId || isSubmitting) return;
    setIsSubmitting(true);

    const targetMult = multiplierRef.current;
    stopAnimation();

    const res = await cashOutCrashSession(sessionId, targetMult);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Cash out failed');
      setStatus('crashed');
      return;
    }

    if (res.cashedOut) {
      setStatus('cashed_out');
      setWinData({ sfpWon: res.sfpWon || 0, mult: res.multiplier || targetMult });
    } else {
      setStatus('crashed');
    }
  };

  useEffect(() => {
    return () => stopAnimation();
  }, []);

  return (
    <div className="max-w-xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
          <Zap size={22} className="fill-amber-400" />
          <span>StatusCrash</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Provably Fair</span>
        </div>
      </div>

      {/* Multiplier Screen */}
      <div className={`relative h-64 rounded-xl flex flex-col items-center justify-center border transition-all mb-6 overflow-hidden ${
        status === 'crashed' 
          ? 'bg-rose-950/20 border-rose-500/30' 
          : status === 'cashed_out'
          ? 'bg-emerald-950/20 border-emerald-500/30'
          : 'bg-slate-950 border-slate-800'
      }`}>
        {status === 'crashed' && (
          <div className="absolute top-4 text-rose-500 font-bold uppercase tracking-widest text-xs flex items-center gap-1">
            <AlertTriangle size={14} /> Round Crashed
          </div>
        )}

        <div className={`text-6xl font-black tracking-tight ${
          status === 'crashed'
            ? 'text-rose-500'
            : status === 'cashed_out'
            ? 'text-emerald-400'
            : status === 'running'
            ? 'text-amber-400 animate-pulse'
            : 'text-slate-600'
        }`}>
          {multiplier.toFixed(2)}x
        </div>

        {winData && (
          <div className="mt-4 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 font-bold text-sm">
            +{winData.sfpWon} SFP Earned
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Action Controls */}
      {status === 'running' ? (
        <button
          onClick={handleCashOut}
          disabled={isSubmitting}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
        >
          {isSubmitting ? 'Cashing Out...' : `CASH OUT (${(wager * multiplier).toFixed(0)} SFP)`}
        </button>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Wager Amount (SFP)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[50, 100, 250, 500].map((val) => (
                <button
                  key={val}
                  onClick={() => setWager(val)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    wager === val
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {val} SFP
                </button>
              ))}
            </div>
            <input
              type="number"
              value={wager}
              onChange={(e) => setWager(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={handleStartRound}
            disabled={isSubmitting || wager <= 0}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-lg rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? 'Starting Round...' : 'START ROUND'}
          </button>
        </div>
      )}
    </div>
  );
}
