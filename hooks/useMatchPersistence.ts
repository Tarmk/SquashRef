'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { saveNewMatch, updateMatch, completeMatch, MatchData } from '../src/lib/matchService';
import { isFirebaseConfigured } from '../src/lib/firebase';

interface UseMatchPersistenceParams {
  player1: string;
  player2: string;
  matchFormat: string;
  gameHistory: Array<{
    gameNumber: number;
    points: Array<{
      scorer: string;
      score: string;
      isHandout: boolean;
      servingSide: 'left' | 'right';
      server: string;
    }>;
    winner: string;
    finalScore: string;
    duration: number;
    startTime: Date;
    endTime: Date;
  }>;
  currentGameState: {
    gameNumber: number;
    player1Score: number;
    player2Score: number;
    player1Games: number;
    player2Games: number;
    currentServer: string;
    lastServingSide: 'left' | 'right';
    currentGamePoints: Array<{
      scorer: string;
      score: string;
      isHandout: boolean;
      servingSide: 'left' | 'right';
      server: string;
    }>;
  };
  isComplete: boolean;
  matchWinner?: string;
  totalDuration: number;
  matchStartTime: Date;
}

export function useMatchPersistence(params: UseMatchPersistenceParams) {
  const { currentUser } = useAuth();
  const matchIdRef = useRef<string | null>(null);
  const completedRef = useRef(false);
  // The game page passes fresh objects (and a ticking duration) on every render.
  // Keep the latest values in a ref so the effects below only run when they should,
  // instead of writing to Firestore on every one-second timer tick.
  const latest = useRef(params);
  useEffect(() => {
    latest.current = params;
  });

  const enabled = !!currentUser && isFirebaseConfigured();
  const userId = currentUser?.uid;

  const saveProgress = useCallback(async () => {
    const id = matchIdRef.current;
    if (!id || completedRef.current) return;
    const p = latest.current;
    try {
      await updateMatch(id, {
        gameHistory: p.gameHistory,
        currentGameState: p.currentGameState,
        totalDuration: p.totalDuration,
      });
    } catch (error) {
      console.error('Error updating match:', error);
    }
  }, []);

  // Create the match document once per signed-in user.
  useEffect(() => {
    if (!enabled || !userId || matchIdRef.current) return;
    const p = latest.current;
    const newMatchData: Omit<MatchData, 'createdAt' | 'updatedAt'> = {
      userId,
      player1: p.player1,
      player2: p.player2,
      matchFormat: p.matchFormat,
      matchStartTime: p.matchStartTime,
      gameHistory: [],
      currentGameState: p.currentGameState,
      isComplete: false,
      totalDuration: 0,
    };
    saveNewMatch(newMatchData)
      .then((id) => {
        matchIdRef.current = id;
      })
      .catch((error) => console.error('Error creating match:', error));
  }, [enabled, userId]);

  // Save every 30 seconds while the match is running...
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(saveProgress, 30_000);
    return () => clearInterval(interval);
  }, [enabled, saveProgress]);

  // ...and straight away whenever a game finishes.
  const gamesPlayed = params.gameHistory.length;
  useEffect(() => {
    if (enabled && gamesPlayed > 0) saveProgress();
  }, [enabled, gamesPlayed, saveProgress]);

  // Mark the match complete exactly once.
  useEffect(() => {
    const id = matchIdRef.current;
    if (!enabled || !params.isComplete || !id || completedRef.current) return;
    completedRef.current = true;
    const p = latest.current;
    completeMatch(id, p.gameHistory, p.matchWinner ?? '', p.totalDuration).catch((error) => {
      completedRef.current = false;
      console.error('Error completing match:', error);
    });
  }, [enabled, params.isComplete]);

  return {
    matchId: matchIdRef.current,
    isUserLoggedIn: enabled,
  };
}
