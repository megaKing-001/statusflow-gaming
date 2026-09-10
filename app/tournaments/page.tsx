// app/tournaments/page.tsx
import { createClient } from '@/lib/supabase/server';
import { getActiveTournaments, getGlobalLeaderboard } from '@/lib/actions/tournaments';
import { TournamentsClient } from './TournamentsClient';

export const revalidate = 0;

export default async function TournamentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const tournaments = await getActiveTournaments();
  const globalLeaderboard = await getGlobalLeaderboard();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <TournamentsClient
        tournaments={tournaments}
        globalLeaderboard={globalLeaderboard}
        currentUserId={user?.id}
      />
    </main>
  );
}
