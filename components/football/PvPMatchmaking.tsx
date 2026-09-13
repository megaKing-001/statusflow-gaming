'use client';

import { useState, useEffect, useRef } from 'react';
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

  // One key per in-flight attempt. Create is a single slot (only one
  // "host a lobby" attempt happens at a time from this form). Join/cancel
  // are keyed per matchId since a user could retry against different
  // lobbies independently.
  const createKeyRef = useRef<string | null>(null);
  const joinKeysRef = useRef<Record<string, string>>({});
  const cancelKeysRef = useRef<Record<string, string>>({});

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

    if (!createKeyRef.current) createKeyRef.current = crypto.randomUUID();
    const key = createKeyRef.current;

    try {
      const res = await createPvPLobby(stakeInput, key);
      if (res.success) {
        createKeyRef.current = null;
      } else {
        createKeyRef.current = null;
        alert(res.error);
      }
    } catch {
      alert('Connection issue — please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinLobby = async (matchId: string) => {
    setProcessingId(matchId);
    setPvpResult(null);

    if (!joinKeysRef.current[matchId]) joinKeysRef.current[matchId] = crypto.randomUUID();
    const key = joinKeysRef.current[matchId];

    try {
      const res = await acceptAndResolvePvPMatch(matchId, key);
      if (res.success) {
        delete joinKeysRef.current[matchId];
        setPvpResult(res);
      } else {
        delete joinKeysRef.current[matchId];
        alert(res.error);
      }
    } catch {
      alert('Connection issue — please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelLobby = async (matchId: string) => {
    setProcessingId(matchId);

    if (!cancelKeysRef.current[matchId]) cancelKeysRef.current[matchId] = crypto.randomUUID();
    const key = cancelKeysRef.current[matchId];

    try {
      const res = await cancelPvPLobby(matchId, key);
      if (res.success) {
        delete cancelKeysRef.current[matchId];
      } else {
        delete cancelKeysRef.current[matchId];
        alert(res.error);
      }
    } catch {
      alert('Connection issue — please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    // ...JSX completely unchanged from the original — omitted here for
    // brevity, but nothing in the render tree needs to change...
  );
}
