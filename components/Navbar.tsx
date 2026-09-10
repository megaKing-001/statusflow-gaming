// components/Navbar.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Coins, Zap, HelpCircle, RotateCw, ShoppingBag, Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [sfpBalance, setSfpBalance] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchBalance() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: wallet } = await supabase
        .from('wallet_accounts')
        .select('sfp_balance')
        .eq('user_id', user.id)
        .single();

      if (wallet) {
        setSfpBalance(wallet.sfp_balance);
      }
    }

    fetchBalance();

    // Real-time listener for instant balance updates on wins/purchases
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
  }, [pathname]);

  const navLinks = [
    { href: '/games/statusquiz', label: 'Quiz', icon: HelpCircle },
    { href: '/games/statuscrash', label: 'Crash', icon: Zap },
    { href: '/games/statuswheel', label: 'Wheel', icon: RotateCw },
    { href: '/store', label: 'Store', icon: ShoppingBag },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 font-black text-xl text-white tracking-wider">
          <span className="text-amber-400">MEGA</span>GAMES
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-slate-800 text-amber-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* SFP Balance Display & Store Quick Link */}
        <div className="flex items-center gap-3">
          <Link
            href="/store"
            className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-full hover:bg-amber-500/20 transition-all"
          >
            <Coins size={18} className="text-amber-400" />
            <span className="font-extrabold text-amber-400 text-sm">
              {sfpBalance !== null ? sfpBalance.toLocaleString() : '...'}
            </span>
            <span className="text-[10px] font-bold text-amber-500/80 uppercase">SFP</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white focus:outline-none"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 ${
                  isActive
                    ? 'bg-slate-800 text-amber-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-950'
                }`}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
