// app/games/statuswheel/WheelClient.tsx
'use client';

import { useState } from 'react';
import { executeWheelSpin } from '@/lib/actions/wheel';
import { WHEEL_SLICES } from '@/lib/engine/games/StatusWheelEngine';
import { Sparkles, Coins, Trophy } from 'lucide-react';

export default function WheelClient() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winResult, setWinResult] = useState<{ sfpWon: number; label: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSpin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setErrorMessage(null);
    setWinResult(null);

    const res = await executeWheelSpin();

    if (!res.success || res.winningSliceId === undefined) {
      setErrorMessage(res.error || 'Spin failed');
      setIsSpinning(false);
      return;
    }

    // Calculate rotation angle to align winning slice with top indicator
    const sliceAngle = 360 / WHEEL_SLICES.length;
    const targetSliceAngle = res.winningSliceId * sliceAngle;
    const extraRounds = 5 * 360; // 5 full rotations for animation
    const nextRotation = rotation + extraRounds + (360 - (rotation % 360)) - targetSliceAngle;

    setRotation(nextRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWinResult({ sfpWon: res.sfpWon, label: res.label });
    }, 4000);
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-center">
      <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-xl mb-6">
        <Sparkles size={24} />
        <span>StatusWheel</span>
      </div>

      {/* Wheel Visual Container */}
      <div className="relative w-64 h-64 mx-auto mb-8 flex items-center justify-center">
        {/* Pointer */}
        <div className="absolute -top-3 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-400 drop-shadow-md" />

        {/* Spinning Wheel */}
        <div
          className="w-full h-full rounded-full border-4 border-slate-700 relative overflow-hidden transition-all duration-[4000ms] cubic-bezier(0.15, 0.90, 0.20, 1.00)"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {WHEEL_SLICES.map((slice, index) => {
            const angle = (360 / WHEEL_SLICES.length) * index;
            return (
              <div
                key={slice.id}
                className="absolute top-0 left-1/2 w-1/2 h-full origin-left flex items-center justify-end pr-4 text-xs font-black text-slate-100"
                style={{
                  transform: `rotate(${angle}deg)`,
                  backgroundColor:
                    slice.tier === 'legendary'
                      ? '#7c3aed'
                      : slice.tier === 'rare'
                      ? '#2563eb'
                      : '#1e293b',
                }}
              >
                <span className="transform -rotate-90 block">{slice.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Winner Display */}
      {winResult && (
        <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold flex items-center justify-center gap-2">
          <Trophy size={20} />
          <span>Won {winResult.label}! (+{winResult.sfpWon} SFP)</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">
          {errorMessage}
        </div>
      )}

      <button
        onClick={handleSpin}
        disabled={isSpinning}
        className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-lg rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Coins size={20} />
        <span>{isSpinning ? 'Spinning...' : 'SPIN WHEEL (100 SFP)'}</span>
      </button>
    </div>
  );
}
