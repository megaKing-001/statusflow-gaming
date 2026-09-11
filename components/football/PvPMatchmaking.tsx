// components/football/PvPMatchmaking.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createPvPLobby, acceptAndResolvePvPMatch, cancelPvPLobby } from '@/lib/actions/football-pvp';
import { Users, Swords, Plus, RefreshCw, XCircle, Trophy } from 'lucide-react';

interface MatchLobby {
  id: string;
  host_user_id: string;
  stake_sfp: number;
  created_at: string;
}

export function PvPMatchmaking({ currentUserId }: { currentUserId: string }) {
  const [lobbies, setLobbies] = useState<MatchLobby[]>([]);
  const [stakeInput, setStakeInput] = useState<number>(100);
  const [isCreating, setIsCreating] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [pvpResult, setPvpResult] = useState<any | null>(null);

  const supabase = createClient();

  // Fetch active pending lobbies & listen for real-time changes
  useEffect(() => {
    const fetchLobbies = async () => {
      const { data } = await supabase
        .from('football_matches')
        .select('*')
        .eq('match_type', 'pvp_wager')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (data) setLobbies(data as MatchLobby[]);
    };

    fetchLobbies();

    // Subscribe to changes in football_matches
    const channel = supabase
      .channel('pvp_lobbies')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'football_matches' },
        () => {
          fetchLobbies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleCreateLobby = async () => {
    setIsCreating(true);
    setPvpResult(null);

    const res = await createPvPLobby(stakeInput);
    setIsCreating(false);

    if (!res.success) alert(res.error);
  };

  const handleJoinLobby = async (matchId: string) => {
    setProcessingId(matchId);
    setPvpResult(null);

    const res = await acceptAndResolvePvPMatch(matchId);
    setProcessingId(null);

    if (res.success) {
      setPvpResult(res);
    } else {
      alert(res.error);
    }
  };

  const handleCancelLobby = async (matchId: string) => {
    setProcessingId(matchId);
    const res = await cancelPvPLobby(matchId);
    setProcessingId(null);

    if (!res.success) alert(res.error);
  };

  return (
    <div className="space-y-6">
      {/* Create Challenge Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Swords size={18} className="text-amber-400" />
          <span>Host a PvP Challenge</span>
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="number"
            value={stakeInput}
            onChange={(e) => setStakeInput(Math.max(10, parseInt(e.target.value) || 0))}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-amber-400"
            placeholder="Stake SFP Amount..."
          />
          <button
            onClick={handleCreateLobby}
            disabled={isCreating || stakeInput <= 0}
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            {isCreating ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
            <span>Host Lobby</span>
          </button>
        </div>
      </div>

      {/* Match Outcome Banner */}
      {pvpResult && (
        <div className={`p-6 rounded-2xl border text-center space-y-2 animate-fade-in ${
          pvpResult.isUserWinner
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <div className="text-3xl font-black uppercase">
            {pvpResult.isUserWinner ? 'PvP Victory! 🏆' : 'PvP Defeat! ❌'}
          </div>
          <p className="text-sm font-bold text-white">
            Final Score: {pvpResult.hostScore} - {pvpResult.opponentScore}
          </p>
          <p className="text-xs font-black">
            {pvpResult.isUserWinner ? `You won the full pot of +${pvpResult.pot} SFP!` : 'Better luck next time!'}
          </p>
        </div>
      )}

      {/* Open Lobbies List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Users size={18} className="text-amber-400" />
          <span>Live Player Challenges ({lobbies.length})</span>
        </h3>

        {lobbies.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No open challenges right now. Host one above!</p>
        ) : (
          <div className="space-y-3">
            {lobbies.map((lobby) => {
              const isHost = lobby.host_user_id === currentUserId;
              return (
                <div
                  key={lobby.id}
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex justify-between items-center"
                >
                  <div>
                    <span className="text-xs font-black text-white block">
                      {isHost ? 'Your Lobby' : 'Challenger Lobby'}
                    </span>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Trophy size={12} /> Pot: {lobby.stake_sfp * 2} SFP ({lobby.stake_sfp} SFP each)
                    </span>
                  </div>

                  {isHost ? (
                    <button
                      onClick={() => handleCancelLobby(lobby.id)}
                      disabled={processingId === lobby.id}
                      className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold uppercase transition-all flex items-center gap-1"
                    >
                      <XCircle size={14} /> Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinLobby(lobby.id)}
                      disabled={processingId === lobby.id}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase transition-all flex items-center gap-1"
                    >
                      {processingId === lobby.id ? <RefreshCw size={14} className="animate-spin" /> : <Swords size={14} />}
                      <span>Match Stake</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
