import { useState, useRef } from 'react';
import { playPenaltyShootout, playAIMatch } from '@/lib/actions/football';
// ...rest of imports unchanged

export function FootballClient({ currentUserId, initialBalance, recentMatches }: FootballClientProps) {
  // ...existing state unchanged...

  const penaltyKeyRef = useRef<string | null>(null);
  const aiMatchKeyRef = useRef<string | null>(null);

  const handlePlayPenalty = async () => {
    setLoading(true);
    setPenaltyResult(null);

    if (!penaltyKeyRef.current) penaltyKeyRef.current = crypto.randomUUID();
    const key = penaltyKeyRef.current;

    try {
      const res = await playPenaltyShootout(stake, selectedZone, key);
      if (res.success) {
        penaltyKeyRef.current = null;
        setPenaltyResult(res);
      } else {
        penaltyKeyRef.current = null;
        alert(res.error);
      }
    } catch {
      alert('Connection issue — please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAIMatch = async () => {
    setLoading(true);
    setMatchResult(null);

    if (!aiMatchKeyRef.current) aiMatchKeyRef.current = crypto.randomUUID();
    const key = aiMatchKeyRef.current;

    try {
      const res = await playAIMatch(stake, difficulty, key);
      if (res.success) {
        aiMatchKeyRef.current = null;
        setMatchResult(res);
      } else {
        aiMatchKeyRef.current = null;
        alert(res.error);
      }
    } catch {
      alert('Connection issue — please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ...rest of the component (JSX) is completely unchanged
