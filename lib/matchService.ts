import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc,
  serverTimestamp,
  Timestamp,
  query,
  where,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface MatchData {
  userId: string;
  player1: string;
  player2: string;
  matchFormat: string;
  matchStartTime: Date;
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
  currentGameState?: {
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
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export async function saveNewMatch(matchData: Omit<MatchData, 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'matches'), {
      ...matchData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving match:', error);
    throw error;
  }
}

export async function updateMatch(matchId: string, matchData: Partial<MatchData>): Promise<void> {
  try {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, {
      ...matchData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating match:', error);
    throw error;
  }
}

export async function getMatch(matchId: string): Promise<MatchData | null> {
  try {
    const matchRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchRef);
    
    if (matchSnap.exists()) {
      const data = matchSnap.data();
      return {
        ...data,
        matchStartTime: data.matchStartTime?.toDate() || new Date(),
        gameHistory: data.gameHistory?.map((game: any) => ({
          ...game,
          startTime: game.startTime?.toDate() || new Date(),
          endTime: game.endTime?.toDate() || new Date(),
        })) || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as MatchData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting match:', error);
    throw error;
  }
}

export async function completeMatch(
  matchId: string, 
  finalGameHistory: MatchData['gameHistory'],
  matchWinner: string,
  totalDuration: number
): Promise<void> {
  try {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, {
      gameHistory: finalGameHistory,
      isComplete: true,
      matchWinner,
      totalDuration,
      currentGameState: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error completing match:', error);
    throw error;
  }
}

export async function cleanupOrphanedMatches(userId: string): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  try {
    const matchesRef = collection(db, 'matches');
    const q = query(
      matchesRef,
      where('userId', '==', userId),
      where('isComplete', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const orphanedMatches: { id: string; data: any }[] = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const createdAt = data.createdAt?.toDate() || new Date();
      const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
      const minutesSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60);
      
      // Consider matches orphaned if:
      // 1. They're incomplete and older than 2 hours with no games (original condition)
      // 2. They're incomplete and older than 30 minutes with 0 duration and 0 games (recent orphans)
      const isOldOrphan = hoursSinceCreation > 2 && (!data.gameHistory || data.gameHistory.length === 0);
      const isRecentOrphan = minutesSinceCreation > 30 && 
                            (!data.gameHistory || data.gameHistory.length === 0) && 
                            (data.totalDuration === 0 || !data.totalDuration);
      
      if (isOldOrphan || isRecentOrphan) {
        orphanedMatches.push({ id: docSnap.id, data });
      }
    });
    
    // Delete orphaned matches
    for (const match of orphanedMatches) {
      await deleteDoc(doc(db, 'matches', match.id));
      console.log(`🧹 Cleaned up orphaned match: ${match.data.player1} vs ${match.data.player2} (created: ${match.data.createdAt?.toDate?.()?.toLocaleString() || 'unknown'})`);
    }
    
    if (orphanedMatches.length > 0) {
      console.log(`✨ Cleaned up ${orphanedMatches.length} orphaned matches`);
    } else {
      console.log('🔍 No orphaned matches found');
    }
  } catch (error) {
    console.error('Error cleaning up orphaned matches:', error);
    throw error;
  }
} 