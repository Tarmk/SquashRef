import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  increment,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

export interface TournamentDraft {
  id?: string;
  name: string;
  type: 'public' | 'private';
  format: 'round-robin' | 'monrad';
  status: 'draft';
  hostId: string;
  hostName: string;
  startDate?: Date;
  endDate?: Date;
  venue?: string;
  playerCount: number;
  maxPlayers?: number;
  entryFee?: string;
  description?: string;
  contactInfo?: string;
  prizes?: string;
  rules?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  draftData: {
    step: 'type' | 'format' | 'info' | 'players';
    formData: Record<string, unknown>;
  };
}

const TEXT_FIELDS = ['name', 'description', 'venue', 'address', 'contactInfo', 'entryFee', 'prizes', 'rules'] as const;

/** The tournament details from an edit form that actually have a value (blank text is dropped). */
type EditableField = (typeof TEXT_FIELDS)[number] | 'maxPlayers' | 'startDate' | 'endDate';

export function filledTournamentFields(form: Partial<Pick<TournamentDraft, EditableField>>): Partial<TournamentDraft> {
  const fields: Partial<TournamentDraft> = {};
  for (const key of TEXT_FIELDS) {
    const value = form[key];
    if (typeof value === 'string' && value.trim()) fields[key] = value;
  }
  if (form.maxPlayers) fields.maxPlayers = form.maxPlayers;
  if (form.startDate) fields.startDate = form.startDate;
  if (form.endDate) fields.endDate = form.endDate;
  return fields;
}

// Helper function to clean undefined values from object
const cleanFirebaseData = (obj: Record<string, unknown>): Record<string, unknown> => {
  const cleaned: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value instanceof Date) {
        cleaned[key] = value;
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = cleanFirebaseData(value as Record<string, unknown>);
      } else {
        cleaned[key] = value;
      }
    }
  }
  
  return cleaned;
};

export const saveTournamentDraft = async (
  userId: string, 
  userName: string, 
  draftData: Partial<TournamentDraft>,
  draftId?: string
): Promise<string> => {
  const dbInstance = db();
  if (!dbInstance) throw new Error('Firebase not initialized');

  const baseData = {
    name: draftData.name || 'Untitled Tournament',
    type: draftData.type || 'private',
    format: draftData.format || 'round-robin',
    status: 'draft' as const,
    hostId: userId,
    hostName: userName,
    playerCount: 0,
    draftData: draftData.draftData || { step: 'type', formData: {} },
  };

  // Add optional fields only if they have values
  const optionalFields: Partial<TournamentDraft> = {};
  if (draftData.startDate) optionalFields.startDate = draftData.startDate;
  if (draftData.endDate) optionalFields.endDate = draftData.endDate;
  if (draftData.venue) optionalFields.venue = draftData.venue;
  if (draftData.address) optionalFields.address = draftData.address;
  if (draftData.description) optionalFields.description = draftData.description;
  if (draftData.contactInfo) optionalFields.contactInfo = draftData.contactInfo;
  if (draftData.entryFee) optionalFields.entryFee = draftData.entryFee;
  if (draftData.prizes) optionalFields.prizes = draftData.prizes;
  if (draftData.rules) optionalFields.rules = draftData.rules;
  if (draftData.maxPlayers) optionalFields.maxPlayers = draftData.maxPlayers;

  const tournamentData = {
    ...baseData,
    ...optionalFields,
  };

  // Clean the data to remove any undefined values
  const cleanedData = cleanFirebaseData(tournamentData);

  try {
    if (draftId) {
      // Update: write only what the caller passed. Filling in the defaults here
      // would turn a published tournament back into a private draft with 0 players.
      const draftRef = doc(dbInstance, 'tournaments', draftId);
      const updates: Record<string, unknown> = { ...optionalFields, hostName: userName };
      if (draftData.name !== undefined) updates.name = draftData.name || 'Untitled Tournament';
      if (draftData.type) updates.type = draftData.type;
      if (draftData.format) updates.format = draftData.format;
      if (draftData.draftData) updates.draftData = draftData.draftData;
      await updateDoc(draftRef, {
        ...cleanFirebaseData(updates),
        updatedAt: serverTimestamp(),
      });
      return draftId;
    } else {
      // Create new draft
      const draftRef = doc(collection(dbInstance, 'tournaments'));
      await setDoc(draftRef, {
        ...cleanedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return draftRef.id;
    }
  } catch (error) {
    console.error('Error saving tournament draft:', error);
    throw error;
  }
};

export const loadTournamentDraft = async (draftId: string): Promise<TournamentDraft | null> => {
  const dbInstance = db();
  if (!dbInstance) throw new Error('Firebase not initialized');

  try {
    const draftRef = doc(dbInstance, 'tournaments', draftId);
    const draftSnap = await getDoc(draftRef);
    
    if (draftSnap.exists()) {
      const data = draftSnap.data();
      return {
        id: draftSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
      } as TournamentDraft;
    }
    
    return null;
  } catch (error) {
    console.error('Error loading tournament draft:', error);
    throw error;
  }
};

export const deleteTournamentDraft = async (draftId: string): Promise<void> => {
  const dbInstance = db();
  if (!dbInstance) throw new Error('Firebase not initialized');

  try {
    const draftRef = doc(dbInstance, 'tournaments', draftId);
    await deleteDoc(draftRef);
  } catch (error) {
    console.error('Error deleting tournament draft:', error);
    throw error;
  }
};

export const finalizeTournamentDraft = async (
  draftId: string, 
  finalData: Partial<TournamentDraft>
): Promise<void> => {
  const dbInstance = db();
  if (!dbInstance) throw new Error('Firebase not initialized');

  try {
    const draftRef = doc(dbInstance, 'tournaments', draftId);
    
    // Clean the final data to remove undefined values
    const cleanedFinalData = cleanFirebaseData(finalData);
    
    await updateDoc(draftRef, {
      ...cleanedFinalData,
      status: 'registration',
      updatedAt: serverTimestamp(),
      // Remove draft data when finalizing
      draftData: null,
    });
  } catch (error) {
    console.error('Error finalizing tournament draft:', error);
    throw error;
  }
};

// Auto-save functionality with debouncing
let autoSaveTimeout: NodeJS.Timeout | null = null;

export const autoSaveDraft = (
  userId: string,
  userName: string,
  draftData: Partial<TournamentDraft>,
  draftId?: string,
  delay: number = 2000
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set new timeout
    autoSaveTimeout = setTimeout(async () => {
      try {
        const savedDraftId = await saveTournamentDraft(userId, userName, draftData, draftId);
        resolve(savedDraftId);
      } catch (error) {
        reject(error);
      }
    }, delay);
  });
}; 
/** The name shown to other users. Never the email address: tournament lists are public. */
export function publicName(user: { displayName: string | null } | null | undefined, fallback = 'Host'): string {
  const name = user?.displayName?.trim();
  return name || fallback;
}

// ---------------------------------------------------------------------------
// Player registration
//
// Players live in tournaments/{id}/players/{userId}, one document per player,
// so registering twice is impossible. The tournament's playerCount is changed
// in the same batch; firestore.rules only lets a player change that one field,
// by one, together with their own player document.
// ---------------------------------------------------------------------------

export interface TournamentPlayer {
  /** Firestore document id: the player's user id, or a generated id for players the host added by hand. */
  id: string;
  userId: string | null;
  name: string;
  joinedAt: Date | null;
  addedByHost: boolean;
}

export type RegistrationState = 'open' | 'joined' | 'full' | 'not-open' | 'closed';

/** Whether a user can join, given the tournament, how many players it has, and whether they are already in. */
export function registrationState(
  tournament: { status: string; maxPlayers?: number | null },
  playerCount: number,
  alreadyJoined: boolean,
): RegistrationState {
  if (alreadyJoined) return 'joined';
  if (tournament.status === 'draft') return 'not-open';
  if (tournament.status !== 'registration') return 'closed';
  if (tournament.maxPlayers && playerCount >= tournament.maxPlayers) return 'full';
  return 'open';
}

export const MAX_PLAYER_NAME = 60;

/** Trim and collapse whitespace in a player name; returns '' if nothing usable is left. */
export function cleanPlayerName(name: string): string {
  return name.replace(/\s+/g, ' ').trim().slice(0, MAX_PLAYER_NAME);
}

const playersCol = (tournamentId: string) => {
  const dbInstance = db();
  if (!dbInstance) throw new Error('Firebase not initialized');
  return collection(dbInstance, 'tournaments', tournamentId, 'players');
};

export const listTournamentPlayers = async (tournamentId: string): Promise<TournamentPlayer[]> => {
  const snap = await getDocs(query(playersCol(tournamentId), orderBy('joinedAt', 'asc')));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: (data.userId as string | undefined) ?? null,
      name: (data.name as string | undefined) ?? 'Player',
      joinedAt: data.joinedAt?.toDate?.() ?? null,
      addedByHost: Boolean(data.addedByHost),
    };
  });
};

/** Register the signed-in user. Throws 'already-joined' if they are already on the list. */
export const joinTournament = async (tournamentId: string, userId: string, name: string): Promise<void> => {
  const dbInstance = db();
  if (!dbInstance) throw new Error('Firebase not initialized');
  const playerName = cleanPlayerName(name);
  if (!playerName) throw new Error('empty-name');

  const playerRef = doc(playersCol(tournamentId), userId);
  if ((await getDoc(playerRef)).exists()) throw new Error('already-joined');

  const batch = writeBatch(dbInstance);
  batch.set(playerRef, { userId, name: playerName, joinedAt: serverTimestamp(), addedByHost: false });
  batch.update(doc(dbInstance, 'tournaments', tournamentId), { playerCount: increment(1) });
  await batch.commit();
};

/** The signed-in user leaves the tournament. */
export const leaveTournament = async (tournamentId: string, userId: string): Promise<void> => {
  await removeTournamentPlayer(tournamentId, userId);
};

/** Host: add a player who has no account (for example someone signing up at the desk). */
export const addPlayerAsHost = async (tournamentId: string, name: string): Promise<void> => {
  const dbInstance = db();
  if (!dbInstance) throw new Error('Firebase not initialized');
  const playerName = cleanPlayerName(name);
  if (!playerName) throw new Error('empty-name');

  const batch = writeBatch(dbInstance);
  batch.set(doc(playersCol(tournamentId)), { userId: null, name: playerName, joinedAt: serverTimestamp(), addedByHost: true });
  batch.update(doc(dbInstance, 'tournaments', tournamentId), { playerCount: increment(1) });
  await batch.commit();
};

/** Remove a player (the host removing anyone, or a player removing themselves). */
export const removeTournamentPlayer = async (tournamentId: string, playerId: string): Promise<void> => {
  const dbInstance = db();
  if (!dbInstance) throw new Error('Firebase not initialized');
  const playerRef = doc(playersCol(tournamentId), playerId);
  if (!(await getDoc(playerRef)).exists()) return;
  const batch = writeBatch(dbInstance);
  batch.delete(playerRef);
  batch.update(doc(dbInstance, 'tournaments', tournamentId), { playerCount: increment(-1) });
  await batch.commit();
};
