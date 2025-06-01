'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveNewMatch, updateMatch, completeMatch, MatchData } from '../lib/matchService';
import { Timestamp } from 'firebase/firestore';

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
  const { currentUser, isFirebaseConfigured } = useAuth();
  const matchIdRef = useRef<string | null>(null);
  const initialSaveRef = useRef(false);
  const matchParamsRef = useRef<{
    player1: string;
    player2: string;
    matchFormat: string;
    matchStartTime: Date;
  } | null>(null);
  const isCreatingMatchRef = useRef(false);

  // Save new match when user is logged in and match starts (ONLY ONCE)
  useEffect(() => {
    // Only proceed if we have the required conditions and haven't created a match yet
    if (!currentUser || !isFirebaseConfigured || initialSaveRef.current || isCreatingMatchRef.current) return;

    // Only create a new match if this is truly a new match (different parameters)
    const currentParams = {
      player1: params.player1,
      player2: params.player2,
      matchFormat: params.matchFormat,
      matchStartTime: params.matchStartTime,
    };

    // Check if this is the same match as before
    if (matchParamsRef.current && 
        matchParamsRef.current.player1 === currentParams.player1 &&
        matchParamsRef.current.player2 === currentParams.player2 &&
        matchParamsRef.current.matchFormat === currentParams.matchFormat &&
        Math.abs(matchParamsRef.current.matchStartTime.getTime() - currentParams.matchStartTime.getTime()) < 60000) { // Within 1 minute
      console.log('Skipping match creation - same match detected');
      return;
    }

    // Set flag to prevent concurrent creation
    isCreatingMatchRef.current = true;

    const saveInitialMatch = async () => {
      try {
        console.log('Creating new match...', currentParams);
        const matchData: Omit<MatchData, 'createdAt' | 'updatedAt'> = {
          userId: currentUser.uid,
          player1: params.player1,
          player2: params.player2,
          matchFormat: params.matchFormat,
          matchStartTime: params.matchStartTime,
          gameHistory: [],
          currentGameState: params.currentGameState,
          isComplete: false,
          totalDuration: 0,
        };

        const matchId = await saveNewMatch(matchData);
        matchIdRef.current = matchId;
        initialSaveRef.current = true;
        matchParamsRef.current = currentParams;
        console.log('✅ New match created with ID:', matchId, 'for', currentParams.player1, 'vs', currentParams.player2);
      } catch (error) {
        console.error('❌ Error saving initial match:', error);
      } finally {
        isCreatingMatchRef.current = false;
      }
    };

    saveInitialMatch();
  }, [currentUser?.uid, isFirebaseConfigured, params.player1, params.player2, params.matchFormat]); // More specific dependencies

  // Update match state periodically
  useEffect(() => {
    if (!currentUser || !isFirebaseConfigured || !matchIdRef.current) return;

    const updateMatchState = async () => {
      try {
        const updateData: Partial<MatchData> = {
          gameHistory: params.gameHistory,
          currentGameState: params.currentGameState,
          totalDuration: params.totalDuration,
        };

        await updateMatch(matchIdRef.current!, updateData);
        console.log('📝 Match updated:', matchIdRef.current);
      } catch (error) {
        console.error('Error updating match:', error);
      }
    };

    // Update every 30 seconds or when game state changes significantly
    const interval = setInterval(updateMatchState, 30000);
    
    // Also update immediately when game history changes (new game completed)
    if (params.gameHistory.length > 0) {
      updateMatchState();
    }

    return () => clearInterval(interval);
  }, [currentUser, isFirebaseConfigured, params.gameHistory, params.currentGameState, params.totalDuration]);

  // Complete match when match ends
  useEffect(() => {
    if (!currentUser || !isFirebaseConfigured || !matchIdRef.current || !params.isComplete) return;

    const completeMatchState = async () => {
      try {
        await completeMatch(
          matchIdRef.current!,
          params.gameHistory,
          params.matchWinner!,
          params.totalDuration
        );
        console.log('🏆 Match completed and saved:', matchIdRef.current);
      } catch (error) {
        console.error('Error completing match:', error);
      }
    };

    completeMatchState();
  }, [currentUser, isFirebaseConfigured, params.isComplete, params.gameHistory, params.matchWinner, params.totalDuration]);

  return {
    matchId: matchIdRef.current,
    isUserLoggedIn: !!currentUser && isFirebaseConfigured,
  };
} 