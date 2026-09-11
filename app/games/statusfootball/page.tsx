// app/games/statusfootball/page.tsx
import { createClient } from '@/lib/supabase/server';
import { FootballClient } from './FootballClient';

export const revalidate = 0;

export default async function StatusFootballPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 text-center space-y-4">
        <h2 className="text-xl font-black text-white">Sign In Required</h2>
        <p className="text-slate-400 text-xs">Please sign in to access the SFP Wager Arena.</p>
      </div>
    );
  }

  // Fetch Wallet Balance
  const { data: wallet } = await supabase
    .from('wallet_accounts')
    .select('sfp_balance')
    .eq('user_id', user.id)
    .single();

  // Fetch Recent Matches
  const { data: matches } = await supabase
    .from('football_matches')
    .select('*')
    .eq('host_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <FootballClient 
      initialBalance={wallet?.sfp_balance || 0} 
      recentMatches={matches || []} 
    />
  );
}
