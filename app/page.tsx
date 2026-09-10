// app/page.tsx
import Link from 'next/link';
import { HelpCircle, Zap, RotateCw, Gift, ShoppingBag, ShieldCheck, Trophy, Sparkles, ArrowRight } from 'lucide-react';

export const revalidate = 0;

export default function HomePage() {
  const games = [
    {
      slug: 'statusquiz',
      title: 'StatusQuiz',
      description: 'Test your knowledge in fast-paced trivia rounds to earn SFP rewards.',
      icon: HelpCircle,
      color: 'border-blue-500/30 text-blue-400',
      badge: 'Skill Based',
      href: '/games/statusquiz',
    },
    {
      slug: 'statuscrash',
      title: 'StatusCrash',
      description: 'Watch the multiplier climb and cash out before the crash hits.',
      icon: Zap,
      color: 'border-amber-500/30 text-amber-400',
      badge: 'High Stakes',
      href: '/games/statuscrash',
    },
    {
      slug: 'statuswheel',
      title: 'StatusWheel',
      description: 'Spin the weighted wheel for a chance at legendary SFP jackpots.',
      icon: RotateCw,
      color: 'border-purple-500/30 text-purple-400',
      badge: 'Instant Win',
      href: '/games/statuswheel',
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-widest mb-6">
            <Sparkles size={14} /> Zero-Trust Gaming Ledger
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Play Games. Earn Rewards. <span className="text-amber-400">Zero Trust.</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mb-8 leading-relaxed">
            Welcome to MegaGames. Play server-authoritative games, test your skill or luck, and manage your SFP rewards in real time.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/games/statuscrash"
              className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 text-sm"
            >
              <span>Play StatusCrash</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/daily"
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2 text-sm"
            >
              <Gift size={18} className="text-amber-400" />
              <span>Daily Bonus</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Provably Fair</h4>
            <p className="text-slate-400 text-xs">Server-authoritative engine logic</p>
          </div>
        </div>
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Trophy size={24} />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Atomic SFP Ledger</h4>
            <p className="text-slate-400 text-xs">Instant idempotent payouts</p>
          </div>
        </div>
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <ShoppingBag size={24} />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Dual Currency Store</h4>
            <p className="text-slate-400 text-xs">Top up in ₦ NGN or $ USD</p>
          </div>
        </div>
      </div>

      {/* Featured Game Engines */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-white">Featured Games</h2>
          <p className="text-slate-400 text-xs sm:text-sm">Select an engine and start earning SFP</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {games.map((game) => {
            const Icon = game.icon;
            return (
              <div
                key={game.slug}
                className={`p-6 rounded-2xl border bg-slate-900/80 flex flex-col justify-between transition-all hover:scale-[1.01] ${game.color}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <Icon size={24} />
                    </div>
                    <span className="px-2.5 py-1 bg-slate-950/80 text-xs font-bold rounded-full border border-slate-800 text-slate-300">
                      {game.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">{game.title}</h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                    {game.description}
                  </p>
                </div>

                <Link
                  href={game.href}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Play Now</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Store Callout Banner */}
      <section className="p-8 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-black text-white mb-1">Running low on SFP?</h3>
          <p className="text-slate-400 text-xs sm:text-sm">
            Top up your balance instantly using Paystack with Naira or USD.
          </p>
        </div>
        <Link
          href="/store"
          className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap"
        >
          Visit SFP Store
        </Link>
      </section>
    </main>
  );
}
