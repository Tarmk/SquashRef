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
import { db, isFirebaseConfigured } from './firebase';

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
  if (!isFirebaseConfigured()) {
    console.warn('Firebase is not configured, cannot save match');
    return 'local-match-' + Date.now(); // Return a local ID for guest mode
  }

  const dbInstance = db();
  if (!dbInstance) {
    console.warn('Firestore database is not available');
    return 'local-match-' + Date.now();
  }

  try {
    const docRef = await addDoc(collection(dbInstance, 'matches'), {
      ...matchData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('🆕 New match created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving match:', error);
    return 'local-match-' + Date.now(); // Fallback to local ID
  }
}

export async function updateMatch(matchId: string, updateData: Partial<MatchData>): Promise<void> {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase is not configured, cannot update match');
    return;
  }

  const dbInstance = db();
  if (!dbInstance) {
    console.warn('Firestore database is not available');
    return;
  }

  // Don't update local matches
  if (matchId.startsWith('local-match-')) {
    return;
  }

  try {
    const matchRef = doc(dbInstance, 'matches', matchId);
    await updateDoc(matchRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating match:', error);
    // Don't throw error, just log it
  }
}

export async function getMatch(matchId: string): Promise<MatchData | null> {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const dbInstance = db();
  if (!dbInstance) {
    return null;
  }

  try {
    const matchRef = doc(dbInstance, 'matches', matchId);
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
    return null;
  }
}

export async function completeMatch(
  matchId: string, 
  finalGameHistory: MatchData['gameHistory'],
  matchWinner: string,
  totalDuration: number
): Promise<void> {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase not available, cannot complete match');
    return;
  }

  const dbInstance = db();
  if (!dbInstance) {
    console.warn('Firebase not available, cannot complete match');
    return;
  }

  // Don't update local matches
  if (matchId.startsWith('local-match-')) {
    return;
  }

  try {
    const matchRef = doc(dbInstance, 'matches', matchId);
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
    // Don't throw error, just log it for graceful degradation
  }
}

export async function cleanupOrphanedMatches(userId: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase is not configured, skipping cleanup');
    return;
  }

  const dbInstance = db();
  if (!dbInstance) {
    throw new Error('Firestore database is not available');
  }

  try {
    const matchesRef = collection(dbInstance, 'matches');
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
      await deleteDoc(doc(dbInstance, 'matches', match.id));
      console.log(`🧹 Cleaned up orphaned match: ${match.data.player1} vs ${match.data.player2} (created: ${match.data.createdAt?.toDate?.()?.toLocaleString() || 'unknown'})`);
    }
    
    if (orphanedMatches.length > 0) {
      console.log(`✨ Cleaned up ${orphanedMatches.length} orphaned matches`);
    } else {
      console.log('🔍 No orphaned matches found');
    }
  } catch (error) {
    console.error('Error cleaning up orphaned matches:', error);
  }
} 