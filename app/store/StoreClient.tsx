// app/store/StoreClient.tsx
'use client';

import { useState } from 'react';
import { Coins, Sparkles, Check, CreditCard, ShieldCheck } from 'lucide-react';

interface SfpBundle {
  id: string;
  sfpAmount: number;
  bonusSfp: number;
  priceNgn: number;
  priceUsd: number;
  isPopular?: boolean;
}

const BUNDLES: SfpBundle[] = [
  {
    id: 'starter_pack',
    sfpAmount: 1000,
    bonusSfp: 0,
    priceNgn: 1000,
    priceUsd: 0.99,
  },
  {
    id: 'pro_pack',
    sfpAmount: 5000,
    bonusSfp: 500, // +10% bonus
    priceNgn: 4500,
    priceUsd: 3.99,
    isPopular: true,
  },
  {
    id: 'whale_pack',
    sfpAmount: 15000,
    bonusSfp: 3000, // +20% bonus
    priceNgn: 12000,
    priceUsd: 9.99,
  },
];

export default function StoreClient() {
  const [selectedCurrency, setSelectedCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [loadingBundleId, setLoadingBundleId] = useState<string | null>(null);

  const handlePurchase = async (bundle: SfpBundle) => {
    setLoadingBundleId(bundle.id);
    
    // Payment Gateway Hook Placeholder (Paystack / Stripe)
    setTimeout(() => {
      alert(`Initiating checkout for ${bundle.sfpAmount + bundle.bonusSfp} SFP at ${
        selectedCurrency === 'NGN' ? `₦${bundle.priceNgn.toLocaleString()}` : `$${bundle.priceUsd}`
      }`);
      setLoadingBundleId(null);
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
      {/* Top Banner & Currency Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xl mb-1">
            <Coins size={24} />
            <span>SFP Store</span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">
            Top up your StatusFlow Points to keep playing in high-stake rooms.
          </p>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setSelectedCurrency('NGN')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedCurrency === 'NGN'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ₦ NGN
          </button>
          <button
            onClick={() => setSelectedCurrency('USD')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedCurrency === 'USD'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            $ USD
          </button>
        </div>
      </div>

      {/* Bundles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {BUNDLES.map((bundle) => {
          const totalPoints = bundle.sfpAmount + bundle.bonusSfp;
          const displayPrice =
            selectedCurrency === 'NGN'
              ? `₦${bundle.priceNgn.toLocaleString()}`
              : `$${bundle.priceUsd.toFixed(2)}`;

          return (
            <div
              key={bundle.id}
              className={`relative flex flex-col justify-between p-6 rounded-2xl border transition-all ${
                bundle.isPopular
                  ? 'bg-gradient-to-b from-slate-850 to-slate-900 border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {bundle.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-full flex items-center gap-1">
                  <Sparkles size={12} /> Best Value
                </div>
              )}

              <div>
                <div className="w-12 h-12 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Coins size={24} />
                </div>

                <h3 className="text-xl font-black text-white mb-1">
                  {totalPoints.toLocaleString()} <span className="text-amber-400 text-sm font-semibold">SFP</span>
                </h3>

                {bundle.bonusSfp > 0 ? (
                  <div className="inline-block px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full mb-4">
                    Includes +{bundle.bonusSfp.toLocaleString()} Bonus SFP
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 mb-4">Standard Top-Up</div>
                )}
              </div>

              <div>
                <div className="text-2xl font-black text-white mb-4">{displayPrice}</div>

                <button
                  onClick={() => handlePurchase(bundle)}
                  disabled={loadingBundleId === bundle.id}
                  className={`w-full py-3 px-4 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 ${
                    bundle.isPopular
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  <CreditCard size={16} />
                  <span>{loadingBundleId === bundle.id ? 'Processing...' : 'Buy Now'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Footer */}
      <div className="flex items-center justify-center gap-2 text-slate-500 text-xs pt-4 border-t border-slate-800/60">
        <ShieldCheck size={16} className="text-emerald-400" />
        <span>Instant SFP Ledger Credit via Secure Payment Gateways</span>
      </div>
    </div>
  );
}
