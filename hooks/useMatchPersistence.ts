'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveNewMatch, updateMatch, completeMatch, MatchData } from '../lib/matchService';
import { Timestamp } from 'firebase/firestore';
import { isFirebaseConfigured } from '../lib/firebase';

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

  // Create new match when the hook is first used
  useEffect(() => {
    if (!currentUser || !isFirebaseConfigured()) return;

    const createNewMatch = async () => {
      try {
        const newMatchData: Omit<MatchData, 'createdAt' | 'updatedAt'> = {
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

        const matchId = await saveNewMatch(newMatchData);
        matchIdRef.current = matchId;
        console.log('🆕 Created new match:', matchId);
      } catch (error) {
        console.error('Error creating match:', error);
        // Don't throw error to prevent app crash if Firebase isn't configured
      }
    };

    // Only create match if we don't already have one
    if (!matchIdRef.current) {
      createNewMatch();
    }
  }, [currentUser, params.player1, params.player2, params.matchFormat]); // More specific dependencies

  // Update match state periodically
  useEffect(() => {
    if (!currentUser || !isFirebaseConfigured() || !matchIdRef.current) return;

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
        // Don't throw error to prevent app crash
      }
    };

    // Update every 30 seconds or when game state changes significantly
    const interval = setInterval(updateMatchState, 30000);
    
    // Also update immediately when game history changes (new game completed)
    if (params.gameHistory.length > 0) {
      updateMatchState();
    }

    return () => clearInterval(interval);
  }, [currentUser, params.gameHistory, params.currentGameState, params.totalDuration]);

  // Complete match when match ends
  useEffect(() => {
    if (!currentUser || !isFirebaseConfigured() || !matchIdRef.current || !params.isComplete) return;

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
        // Don't throw error to prevent app crash
      }
    };

    completeMatchState();
  }, [currentUser, params.isComplete, params.gameHistory, params.matchWinner, params.totalDuration]);

  return {
    matchId: matchIdRef.current,
    isUserLoggedIn: !!currentUser && isFirebaseConfigured(),
  };
} 