// app/tournaments/TournamentsClient.tsx
'use client';

import { useState } from 'react';
import { joinTournament } from '@/lib/actions/tournaments';
import { Trophy, Users, Award, Clock, Sparkles, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

interface Tournament {
  id: string;
  title: string;
  description: string;
  game_type: string;
  entry_fee_sfp: number;
  prize_pool_sfp: number;
  end_time: string;
  status: string;
  tournament_participants: { id: string; user_id: string; score: number }[];
}

interface LeaderboardEntry {
  user_id: string;
  sfp_balance: number;
}

interface TournamentsClientProps {
  tournaments: Tournament[];
  globalLeaderboard: LeaderboardEntry[];
  currentUserId?: string;
}

export function TournamentsClient({ tournaments, globalLeaderboard, currentUserId }: TournamentsClientProps) {
  const [activeTab, setActiveTab] = useState<'tournaments' | 'leaderboard'>('tournaments');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleJoin = async (tournamentId: string) => {
    setJoiningId(tournamentId);
    setMessage(null);

    const res = await joinTournament(tournamentId);
    setJoiningId(null);

    if (res.success) {
      setMessage({ type: 'success', text: 'Successfully joined the tournament! Start playing to earn points.' });
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to join tournament' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest">
          <Sparkles size={14} /> Competitive Arena
        </div>
        <h1 className="text-4xl font-black text-white">Tournaments & Leaderboards</h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Compete against players worldwide, claim top positions, and win massive SFP reward pools.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex justify-center border-b border-slate-800 pb-4">
        <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'tournaments'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy size={16} /> Live Tournaments
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award size={16} /> Global Leaderboard
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm max-w-2xl mx-auto ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tournaments Grid */}
      {activeTab === 'tournaments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-slate-900/50 border border-slate-800 rounded-3xl">
              <Trophy className="mx-auto text-slate-600 mb-3" size={48} />
              <h3 className="text-lg font-bold text-white mb-1">No Active Tournaments</h3>
              <p className="text-slate-400 text-xs">Check back soon for new competitive events!</p>
            </div>
          ) : (
            tournaments.map((tourney) => {
              const isJoined = tourney.tournament_participants.some((p) => p.user_id === currentUserId);
              return (
                <div
                  key={tourney.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/30 transition-all space-y-6"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-full uppercase">
                        {tourney.game_type}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Users size={14} />
                        <span>{tourney.tournament_participants.length} Joined</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-white mb-2">{tourney.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4">{tourney.description}</p>

                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800/80 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-extrabold block">Prize Pool</span>
                        <span className="text-amber-400 font-black text-sm">🏆 {tourney.prize_pool_sfp} SFP</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-extrabold block">Entry Fee</span>
                        <span className="text-white font-black text-sm">
                          {tourney.entry_fee_sfp > 0 ? `${tourney.entry_fee_sfp} SFP` : 'FREE'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleJoin(tourney.id)}
                    disabled={isJoined || joiningId === tourney.id}
                    className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      isJoined
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/10'
                    }`}
                  >
                    {isJoined ? (
                      <>
                        <ShieldCheck size={16} />
                        <span>Registered</span>
                      </>
                    ) : joiningId === tourney.id ? (
                      <span>Joining...</span>
                    ) : (
                      <span>Join Tournament</span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Global Leaderboard Table */}
      {activeTab === 'leaderboard' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Trophy className="text-amber-400" size={20} />
              <span>SFP Whales & Champions</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Top 10 Players</span>
          </div>

          <div className="divide-y divide-slate-800">
            {globalLeaderboard.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = entry.user_id === currentUserId;

              return (
                <div
                  key={entry.user_id}
                  className={`py-4 px-4 flex items-center justify-between transition-all rounded-xl ${
                    isCurrentUser ? 'bg-amber-500/10 border border-amber-500/30' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                        rank === 1
                          ? 'bg-amber-400 text-slate-950'
                          : rank === 2
                          ? 'bg-slate-300 text-slate-950'
                          : rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {rank}
                    </div>
                    <div>
                      <span className="text-white font-bold text-sm block">
                        Player #{entry.user_id.slice(0, 8)}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[10px] text-amber-400 font-extrabold uppercase">You</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-amber-400 font-black text-base">{entry.sfp_balance.toLocaleString()} SFP</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
