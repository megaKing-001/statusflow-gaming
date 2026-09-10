// components/Navbar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Trophy, 
  Gamepad2, 
  Gift, 
  ShoppingBag, 
  Zap, 
  Menu, 
  X, 
  Coins, 
  ChevronDown,
  HelpCircle,
  RotateCw,
  Sparkles
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sfpBalance, setSfpBalance] = useState<number | null>(null);
  const [isGamesDropdownOpen, setIsGamesDropdownOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // 1. Fetch initial wallet balance
    const fetchBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('wallet_accounts')
        .select('sfp_balance')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setSfpBalance(data.sfp_balance);
      }
    };

    fetchBalance();

    // 2. Subscribe to real-time wallet updates
    const channel = supabase
      .channel('wallet_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'wallet_accounts' },
        (payload) => {
          if (payload.new && typeof payload.new.sfp_balance === 'number') {
            setSfpBalance(payload.new.sfp_balance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const games = [
    { name: 'StatusQuiz', href: '/games/statusquiz', icon: HelpCircle },
    { name: 'StatusCrash', href: '/games/statuscrash', icon: Zap },
    { name: 'StatusWheel', href: '/games/statuswheel', icon: RotateCw },
    { name: 'StatusCards', href: '/games/statuscards', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 font-black text-xl text-white tracking-tight">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Gamepad2 size={22} />
            </div>
            <span>Status<span className="text-amber-400">Flow</span></span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`text-xs font-extrabold uppercase tracking-wider transition-colors ${
                pathname === '/' ? 'text-amber-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              Home
            </Link>

            {/* Games Dropdown */}
            <div className="relative" onMouseLeave={() => setIsGamesDropdownOpen(false)}>
              <button
                onMouseEnter={() => setIsGamesDropdownOpen(true)}
                onClick={() => setIsGamesDropdownOpen(!isGamesDropdownOpen)}
                className={`text-xs font-extrabold uppercase tracking-wider transition-colors flex items-center gap-1 py-2 ${
                  pathname.startsWith('/games') ? 'text-amber-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>Games</span>
                <ChevronDown size={14} className={`transition-transform ${isGamesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isGamesDropdownOpen && (
                <div className="absolute top-full left-0 w-48 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl space-y-1">
                  {games.map((game) => {
                    const Icon = game.icon;
                    return (
                      <Link
                        key={game.href}
                        href={game.href}
                        onClick={() => setIsGamesDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition-all"
                      >
                        <Icon size={16} className="text-amber-400" />
                        <span>{game.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tournaments & Leaderboard Link */}
            <Link
              href="/tournaments"
              className={`text-xs font-extrabold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                pathname === '/tournaments' ? 'text-amber-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Trophy size={16} className="text-amber-400" />
              <span>Tournaments</span>
            </Link>

            {/* Daily Streak */}
            <Link
              href="/daily"
              className={`text-xs font-extrabold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                pathname === '/daily' ? 'text-amber-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Gift size={16} className="text-amber-400" />
              <span>Daily Bonus</span>
            </Link>

            {/* Store */}
            <Link
              href="/store"
              className={`text-xs font-extrabold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                pathname === '/store' ? 'text-amber-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShoppingBag size={16} className="text-amber-400" />
              <span>Store</span>
            </Link>
          </nav>

          {/* Right Side Balance Chip & Mobile Toggle */}
          <div className="flex items-center gap-3">
            {/* Realtime SFP Balance Badge */}
            <div className="flex items-center gap-2 bg-slate-900 border border-amber-500/30 px-3.5 py-1.5 rounded-full shadow-inner">
              <Coins size={16} className="text-amber-400 animate-pulse" />
              <span className="text-xs font-black text-amber-400 tracking-wide">
                {sfpBalance !== null ? `${sfpBalance.toLocaleString()} SFP` : '--- SFP'}
              </span>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-bold text-slate-300 hover:text-amber-400"
          >
            Home
          </Link>
          <div className="space-y-1 pl-2 border-l border-slate-800">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
              Games
            </span>
            {games.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-1.5 text-xs font-bold text-slate-300 hover:text-amber-400"
              >
                <g.icon size={14} className="text-amber-400" />
                <span>{g.name}</span>
              </Link>
            ))}
          </div>
          <Link
            href="/tournaments"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-bold text-slate-300 hover:text-amber-400"
          >
            <Trophy size={16} className="text-amber-400" />
            <span>Tournaments</span>
          </Link>
          <Link
            href="/daily"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-bold text-slate-300 hover:text-amber-400"
          >
            <Gift size={16} className="text-amber-400" />
            <span>Daily Bonus</span>
          </Link>
          <Link
            href="/store"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-bold text-slate-300 hover:text-amber-400"
          >
            <ShoppingBag size={16} className="text-amber-400" />
            <span>SFP Store</span>
          </Link>
        </div>
      )}
    </header>
  );
}
