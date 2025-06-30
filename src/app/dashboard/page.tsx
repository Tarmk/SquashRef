'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { cleanupOrphanedMatches } from '@/lib/matchService';
import { deleteTournamentDraft } from '@/lib/tournamentService';
import Header from '@/components/Header';

interface SavedMatch {
  id: string;
  player1: string;
  player2: string;
  matchFormat: string;
  matchWinner?: string;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalDuration: number;
  gameHistory: any[];
}

interface Tournament {
  id: string;
  name: string;
  type: 'public' | 'private';
  format: 'round-robin' | 'monrad';
  status: 'draft' | 'registration' | 'active' | 'completed';
  hostId: string;
  hostName: string;
  startDate?: Date;
  endDate?: Date;
  venue?: string;
  playerCount: number;
  maxPlayers?: number;
  entryFee?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  // Draft-specific fields
  draftData?: {
    step: 'type' | 'format' | 'info' | 'players';
    formData: any;
  };
}

type ActiveTab = 'matches' | 'hosted-tournaments' | 'active-tournaments';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [savedMatches, setSavedMatches] = useState<SavedMatch[]>([]);
  const [hostedTournaments, setHostedTournaments] = useState<Tournament[]>([]);
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('matches');
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    fetchData();
  }, [currentUser, router]);

  async function fetchData() {
    if (!currentUser) return;

    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      console.warn('Firebase is not configured, no saved data available');
      setLoading(false);
      return;
    }

    const dbInstance = db();
    if (!dbInstance) {
      console.warn('Firebase database not available');
      setLoading(false);
      return;
    }

    try {
      // Clean up orphaned matches first
      await cleanupOrphanedMatches(currentUser.uid);

      // Fetch matches
      await fetchSavedMatches(dbInstance);
      
      // Fetch tournaments
      await fetchTournaments(dbInstance);
      
    } catch (error: any) {
      console.error('Error fetching data:', error);
      
      // Provide more specific error messages
      if (error?.code === 'permission-denied') {
        setError('Permission denied. Please check your Firestore security rules or contact support.');
      } else if (error?.code === 'unauthenticated') {
        setError('Authentication required. Please sign in again.');
      } else if (error?.message?.includes('network')) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(`Failed to load data: ${error?.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchSavedMatches(dbInstance: any) {
    const matchesRef = collection(dbInstance, 'matches');
    const q = query(matchesRef, where('userId', '==', currentUser!.uid));
    const querySnapshot = await getDocs(q);
    
    const matches: SavedMatch[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      matches.push({
        id: doc.id,
        player1: data.player1,
        player2: data.player2,
        matchFormat: data.matchFormat,
        matchWinner: data.matchWinner,
        isComplete: data.isComplete,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        totalDuration: data.totalDuration || 0,
        gameHistory: data.gameHistory || [],
      });
    });

    // Sort by most recent first
    matches.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    setSavedMatches(matches);
  }

  async function fetchTournaments(dbInstance: any) {
    const tournamentsRef = collection(dbInstance, 'tournaments');
    
    // Fetch hosted tournaments
    const hostedQuery = query(tournamentsRef, where('hostId', '==', currentUser!.uid));
    const hostedSnapshot = await getDocs(hostedQuery);
    
    const hosted: Tournament[] = [];
    hostedSnapshot.forEach((doc) => {
      const data = doc.data();
      hosted.push({
        id: doc.id,
        name: data.name,
        type: data.type,
        format: data.format,
        status: data.status,
        hostId: data.hostId,
        hostName: data.hostName,
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
        venue: data.venue,
        playerCount: data.playerCount || 0,
        maxPlayers: data.maxPlayers,
        entryFee: data.entryFee,
        description: data.description,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    // Fetch all active tournaments (public ones that are not completed)
    const activeQuery = query(
      tournamentsRef, 
      where('type', '==', 'public'),
      where('status', 'in', ['registration', 'active'])
    );
    const activeSnapshot = await getDocs(activeQuery);
    
    const active: Tournament[] = [];
    activeSnapshot.forEach((doc) => {
      const data = doc.data();
      // Don't include tournaments hosted by current user (they're already in hosted)
      if (data.hostId !== currentUser!.uid) {
        active.push({
          id: doc.id,
          name: data.name,
          type: data.type,
          format: data.format,
          status: data.status,
          hostId: data.hostId,
          hostName: data.hostName,
          startDate: data.startDate?.toDate(),
          endDate: data.endDate?.toDate(),
          venue: data.venue,
          playerCount: data.playerCount || 0,
          maxPlayers: data.maxPlayers,
          entryFee: data.entryFee,
          description: data.description,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      }
    });

    // Sort by most recent first
    hosted.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    active.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    setHostedTournaments(hosted);
    setActiveTournaments(active);
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'registration':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };



  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-2xl text-gray-600">Loading...</div>
          <p className="text-gray-500 mt-2">Please wait while we verify your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <div className="max-w-6xl mx-auto p-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Welcome back, {currentUser.displayName || currentUser.email}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/match-format"
            className="block p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-blue-300"
          >
            <div className="text-center">
              <div className="text-4xl mb-3">🆕</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start New Match
              </h3>
              <p className="text-gray-600">
                Begin refereeing a new squash match
              </p>
            </div>
          </Link>

          <Link
            href="/tournament/create"
            className="block p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-purple-300"
          >
            <div className="text-center">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Tournament Mode
              </h3>
              <p className="text-gray-600">
                Manage tournament brackets and competitions
              </p>
            </div>
          </Link>
        </div>

        {/* Tabbed Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('matches')}
              className={`
                flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors
                ${activeTab === 'matches'
                  ? 'bg-white text-blue-600 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              📋 Match History ({savedMatches.length})
            </button>
            <button
              onClick={() => setActiveTab('hosted-tournaments')}
              className={`
                flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors
                ${activeTab === 'hosted-tournaments'
                  ? 'bg-white text-blue-600 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              🏆 My Tournaments ({hostedTournaments.length})
            </button>
            <button
              onClick={() => setActiveTab('active-tournaments')}
              className={`
                flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors
                ${activeTab === 'active-tournaments'
                  ? 'bg-white text-blue-600 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              🌟 Active Tournaments ({activeTournaments.length})
            </button>
          </div>

          {/* Tab Content */}
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500">{error}</div>
            </div>
          ) : (
            <>
              {/* Match History Tab */}
              {activeTab === 'matches' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Match History</h2>
                  {savedMatches.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500 mb-4">No matches found</div>
                      <p className="text-sm text-gray-400">
                        Start your first match to see it here!
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {savedMatches.map((match) => (
                        <div
                          key={match.id}
                          className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {match.player1} vs {match.player2}
                                </h3>
                                <span className={`
                                  px-3 py-1 rounded-full text-sm font-medium
                                  ${match.isComplete 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                  }
                                `}>
                                  {match.isComplete ? 'Completed' : 'In Progress'}
                                </span>
                              </div>
                              
                              <div className="grid md:grid-cols-4 gap-4 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Format:</span> {match.matchFormat}
                                </div>
                                <div>
                                  <span className="font-medium">Duration:</span> {formatDuration(match.totalDuration)}
                                </div>
                                <div>
                                  <span className="font-medium">Games:</span> {match.gameHistory?.length || 0}
                                </div>
                                <div>
                                  <span className="font-medium">Date:</span> {formatDate(match.updatedAt)}
                                </div>
                              </div>
                              
                              {match.isComplete && match.matchWinner && (
                                <div className="mt-2">
                                  <span className="text-sm font-medium text-green-700">
                                    Winner: {match.matchWinner}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <Link
                                href={`/match/${match.id}`}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                View Details
                              </Link>
                              {!match.isComplete && (
                                <button
                                  onClick={() => {/* Resume match */}}
                                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                  Resume
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Hosted Tournaments Tab */}
              {activeTab === 'hosted-tournaments' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">My Tournaments</h2>
                    <Link
                      href="/tournament/create"
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      + Create New Tournament
                    </Link>
                  </div>
                  
                  {hostedTournaments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500 mb-4">No tournaments hosted yet</div>
                      <p className="text-sm text-gray-400">
                        Create your first tournament to manage competitions!
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {hostedTournaments.map((tournament) => (
                        <div
                          key={tournament.id}
                          className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {tournament.name}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tournament.status)}`}>
                                  {tournament.status === 'draft' ? '📝 DRAFT' :
                                   tournament.status === 'registration' ? 'Registration Open' : 
                                   tournament.status === 'active' ? 'Active' : 'Completed'}
                                </span>
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                  {tournament.type.toUpperCase()}
                                </span>
                              </div>
                              
                              <div className="grid md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                                <div>
                                  <span className="font-medium">Format:</span> {tournament.format === 'round-robin' ? 'Round Robin' : 'Monrad'}
                                </div>
                                <div>
                                  <span className="font-medium">Players:</span> {tournament.playerCount}{tournament.maxPlayers ? `/${tournament.maxPlayers}` : ''}
                                </div>
                                <div>
                                  <span className="font-medium">Entry:</span> {tournament.entryFee || 'Free'}
                                </div>
                                <div>
                                  <span className="font-medium">Created:</span> {formatDate(tournament.createdAt)}
                                </div>
                              </div>

                              {tournament.venue && (
                                <div className="text-sm text-gray-600 mb-2">
                                  <span className="font-medium">Venue:</span> {tournament.venue}
                                </div>
                              )}

                              {tournament.description && (
                                <p className="text-sm text-gray-600 mt-2">{tournament.description}</p>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              {tournament.status === 'draft' ? (
                                <Link
                                  href={`/tournament/create/${tournament.draftData?.step || 'type'}?draft=${tournament.id}`}
                                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                  📝 Continue Editing
                                </Link>
                              ) : (
                                <Link
                                  href={`/tournament/${tournament.id}`}
                                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                  Manage
                                </Link>
                              )}
                              {tournament.status === 'registration' && (
                                <button
                                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/tournament/join/${tournament.id}`)}
                                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                  Share Link
                                </button>
                              )}
                              {tournament.status === 'draft' && (
                                <button
                                  onClick={async () => {
                                    if (confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
                                      try {
                                        await deleteTournamentDraft(tournament.id);
                                        // Refresh tournaments list
                                        fetchData();
                                      } catch (error) {
                                        console.error('Failed to delete draft:', error);
                                        alert('Failed to delete draft. Please try again.');
                                      }
                                    }
                                  }}
                                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                  🗑️ Delete Draft
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Active Tournaments Tab */}
              {activeTab === 'active-tournaments' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Public Tournaments</h2>
                  
                  {activeTournaments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500 mb-4">No active tournaments available</div>
                      <p className="text-sm text-gray-400">
                        Check back later for new tournament opportunities!
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {activeTournaments.map((tournament) => (
                        <div
                          key={tournament.id}
                          className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {tournament.name}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tournament.status)}`}>
                                  {tournament.status === 'registration' ? 'Registration Open' : 'Active'}
                                </span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                  PUBLIC
                                </span>
                              </div>
                              
                              <div className="grid md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                                <div>
                                  <span className="font-medium">Host:</span> {tournament.hostName}
                                </div>
                                <div>
                                  <span className="font-medium">Format:</span> {tournament.format === 'round-robin' ? 'Round Robin' : 'Monrad'}
                                </div>
                                <div>
                                  <span className="font-medium">Players:</span> {tournament.playerCount}{tournament.maxPlayers ? `/${tournament.maxPlayers}` : ''}
                                </div>
                                <div>
                                  <span className="font-medium">Entry:</span> {tournament.entryFee || 'Free'}
                                </div>
                              </div>

                              {tournament.venue && (
                                <div className="text-sm text-gray-600 mb-2">
                                  <span className="font-medium">Venue:</span> {tournament.venue}
                                </div>
                              )}

                              {tournament.startDate && (
                                <div className="text-sm text-gray-600 mb-2">
                                  <span className="font-medium">Start Date:</span> {formatDate(tournament.startDate)}
                                </div>
                              )}

                              {tournament.description && (
                                <p className="text-sm text-gray-600 mt-2">{tournament.description}</p>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <Link
                                href={`/tournament/${tournament.id}`}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                View Details
                              </Link>
                              {tournament.status === 'registration' && (
                                <Link
                                  href={`/tournament/join/${tournament.id}`}
                                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                  Join Tournament
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 