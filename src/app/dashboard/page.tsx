'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { cleanupOrphanedMatches } from '../../../lib/matchService';

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

export default function DashboardPage() {
  const { currentUser, logout } = useAuth();
  const [matches, setMatches] = useState<SavedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    fetchMatches();
    
    // Clean up any orphaned matches automatically
    cleanupOrphanedMatches(currentUser.uid).catch(error => {
      console.warn('Failed to cleanup orphaned matches:', error);
    });
  }, [currentUser, router]);

  async function fetchMatches() {
    if (!currentUser) return;

    try {
      const matchesRef = collection(db, 'matches');
      const q = query(
        matchesRef,
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedMatches: SavedMatch[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedMatches.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as SavedMatch);
      });
      
      fetchedMatches.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      
      setMatches(fetchedMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch {
      console.error('Failed to log out');
    }
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🏸 Squash Ref Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Welcome back, {currentUser.displayName || currentUser.email}
            </p>
          </div>
          <div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
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
            href="/tournament"
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

        {/* Match History */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Match History</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading matches...</div>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">No matches found</div>
              <p className="text-sm text-gray-400">
                Start your first match to see it here!
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {matches.map((match) => (
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
                          <span className="font-medium">Date:</span> {match.updatedAt.toLocaleDateString()}
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
      </div>
    </div>
  );
} 