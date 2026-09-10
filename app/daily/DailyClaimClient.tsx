// app/daily/DailyClaimClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { checkDailyClaimStatus, claimDailySfpBonus } from '@/lib/actions/daily';
import { Calendar, Gift, Sparkles, CheckCircle2 } from 'lucide-react';

export default function DailyClaimClient() {
  const [claimedToday, setClaimedToday] = useState<boolean | null>(null);
  const [rewardAmount, setRewardAmount] = useState<number>(250);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [claimedSuccess, setClaimedSuccess] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      const res = await checkDailyClaimStatus();
      setClaimedToday(res.claimedToday);
      if (res.rewardAmount) setRewardAmount(res.rewardAmount);
      setLoading(false);
    }
    loadStatus();
  }, []);

  const handleClaim = async () => {
    if (claimedToday || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await claimDailySfpBonus();
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to claim daily reward');
      return;
    }

    setClaimedToday(true);
    setClaimedSuccess(true);
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400">
        Checking daily bonus availability...
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-center">
      <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Gift size={32} />
      </div>

      <h2 className="text-2xl font-black text-white mb-1">Daily SFP Bonus</h2>
      <p className="text-slate-400 text-xs mb-6">
        Log in every 24 hours to collect free StatusFlow Points.
      </p>

      {/* Bonus Box */}
      <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 mb-6 flex flex-col items-center justify-center">
        <div className="flex items-center gap-2 text-amber-400 font-extrabold text-3xl mb-1">
          <Sparkles size={28} />
          <span>+{rewardAmount} SFP</span>
        </div>
        <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">
          Free Daily Login Reward
        </span>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">
          {errorMessage}
        </div>
      )}

      {claimedToday ? (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-xl flex items-center justify-center gap-2">
          <CheckCircle2 size={20} />
          <span>{claimedSuccess ? 'Bonus Claimed! Come back tomorrow.' : 'Already Claimed Today'}</span>
        </div>
      ) : (
        <button
          onClick={handleClaim}
          disabled={isSubmitting}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-lg rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Calendar size={20} />
          <span>{isSubmitting ? 'Claiming...' : 'CLAIM FREE SFP'}</span>
        </button>
      )}
    </div>
  );
}
