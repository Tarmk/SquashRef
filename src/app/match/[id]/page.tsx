'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import GameDetailModal from '@/components/GameDetailModal';
import Header from '@/components/Header';

interface MatchData {
  id: string;
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
      isFault?: boolean;
      faultType?: 'let' | 'stroke' | 'no-let';
      faultAgainst?: string;
      faultReason?: string;
    }>;
    winner: string;
    finalScore: string;
    duration: number;
    startTime: Date;
    endTime: Date;
  }>;
  isComplete: boolean;
  matchWinner?: string;
  totalDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function MatchDetailsPage() {
  const { currentUser } = useAuth();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<MatchData['gameHistory'][0] | null>(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const router = useRouter();
  const params = useParams();
  const matchId = params.id as string;

  useEffect(() => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    fetchMatch();
  }, [currentUser, matchId, router]);

  async function fetchMatch() {
    if (!currentUser || !matchId) return;

    const dbInstance = db();
    if (!dbInstance) return;

    try {
      const matchRef = doc(dbInstance, 'matches', matchId);
      const matchSnap = await getDoc(matchRef);
      
      if (matchSnap.exists()) {
        const data = matchSnap.data();
        
        // Check if user owns this match
        if (data.userId !== currentUser.uid) {
          setError('You do not have permission to view this match.');
          setLoading(false);
          return;
        }

        const matchData: MatchData = {
          id: matchSnap.id,
          ...(data as Omit<MatchData, 'id' | 'matchStartTime' | 'gameHistory' | 'createdAt' | 'updatedAt'>),
          matchStartTime: data.matchStartTime?.toDate() || new Date(),
          gameHistory: data.gameHistory?.map((game: any) => ({
            ...game,
            startTime: game.startTime?.toDate() || new Date(),
            endTime: game.endTime?.toDate() || new Date(),
          })) || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
        
        setMatch(matchData);
      } else {
        setError('Match not found.');
      }
    } catch (error) {
      console.error('Error fetching match:', error);
      setError('Failed to load match details.');
    } finally {
      setLoading(false);
    }
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString([], { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const printMatchTranscript = () => {
    if (!match) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Match Transcript - ${match.player1} vs ${match.player2}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.6; 
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #333; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .match-info { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 20px; 
            }
            .match-summary { 
              background: #e8f5e8; 
              padding: 20px; 
              border-radius: 8px; 
              margin-bottom: 30px; 
              border-left: 5px solid #28a745; 
            }
            .game-section { 
              margin-bottom: 40px; 
              page-break-inside: avoid; 
            }
            .game-header { 
              background: #f8f9fa; 
              padding: 10px; 
              border-radius: 5px; 
              margin-bottom: 15px; 
              border-left: 3px solid #007bff; 
            }
            .points-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px; 
              font-size: 12px; 
            }
            .points-table th, .points-table td { 
              border: 1px solid #ddd; 
              padding: 6px; 
              text-align: center; 
            }
            .points-table th { 
              background-color: #f2f2f2; 
              font-weight: bold; 
            }
            .handout { 
              background-color: #fff3cd; 
            }
            .fault {
              background-color: #f8d7da;
              border-left: 3px solid #dc3545;
            }
            .stroke-point {
              background-color: #d4edda;
              border-left: 3px solid #28a745;
            }
            .let-point {
              background-color: #cce7ff;
              border-left: 3px solid #007bff;
            }
            @media print { 
              body { margin: 0; } 
              .game-section { page-break-inside: avoid; } 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Complete Squash Match Transcript</h1>
            <h2>${match.player1} vs ${match.player2}</h2>
          </div>
          
          <div class="match-info">
            <div><strong>Match Format:</strong> ${match.matchFormat}</div>
            <div><strong>Date:</strong> ${formatDate(match.matchStartTime)}</div>
            <div><strong>Time:</strong> ${formatTime(match.matchStartTime)}</div>
          </div>
          
          <div class="match-summary">
            <h3>Match Result</h3>
            ${match.isComplete ? `<p><strong>Winner:</strong> ${match.matchWinner}</p>` : '<p><strong>Status:</strong> In Progress</p>'}
            <p><strong>Total Duration:</strong> ${formatDuration(match.totalDuration)}</p>
            <p><strong>Games Played:</strong> ${match.gameHistory.length}</p>
            <p><strong>Total Points:</strong> ${match.gameHistory.reduce((total, game) => total + game.points.length, 0)}</p>
          </div>
          
          ${match.gameHistory.map(game => `
            <div class="game-section">
              <div class="game-header">
                <h3>Game ${game.gameNumber} - Winner: ${game.winner} (${game.finalScore}) - Duration: ${formatDuration(game.duration)}</h3>
              </div>
              
              <table class="points-table">
                <thead>
                  <tr>
                    <th>Point #</th>
                    <th>Scorer</th>
                    <th>Score</th>
                    <th>Server</th>
                    <th>Side</th>
                    <th>Handout</th>
                    <th>Referee Decision</th>
                  </tr>
                </thead>
                <tbody>
                  ${game.points.map((point, index) => `
                    <tr class="${point.isHandout ? 'handout' : ''} ${point.isFault ? 'fault' : ''}">
                      <td>${index + 1}</td>
                      <td><strong>${point.scorer}</strong></td>
                      <td>${point.score}</td>
                      <td>${point.server}</td>
                      <td>${point.servingSide}</td>
                      <td>${point.isHandout ? '✓' : ''}</td>
                      <td>${point.isFault ? `<strong style="color: ${point.faultType === 'stroke' ? '#28a745' : point.faultType === 'let' ? '#007bff' : '#dc3545'}">${point.faultReason || point.faultType?.toUpperCase()}</strong>` : ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
          
          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            Generated by Squash Ref Support App on ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleGameClick = (game: MatchData['gameHistory'][0]) => {
    setSelectedGame(game);
    setShowGameModal(true);
  };

  const closeGameModal = () => {
    setShowGameModal(false);
    setSelectedGame(null);
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-2xl text-gray-600">Loading match details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-2xl text-red-600 mb-4">{error}</div>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-2xl text-gray-600">Match not found</div>
        </div>
      </div>
    );
  }

  const totalPoints = match.gameHistory.reduce((total, game) => total + game.points.length, 0);
  const handouts = match.gameHistory.reduce((total, game) => 
    total + game.points.filter(point => point.isHandout).length, 0
  );
  const strokes = match.gameHistory.reduce((total, game) => 
    total + game.points.filter(point => point.faultType === 'stroke').length, 0
  );
  const lets = match.gameHistory.reduce((total, game) => 
    total + game.points.filter(point => point.faultType === 'let').length, 0
  );
  const noLets = match.gameHistory.reduce((total, game) => 
    total + game.points.filter(point => point.faultType === 'no-let').length, 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header 
        showBackButton={true} 
        backUrl="/dashboard" 
        title={`${match.player1} vs ${match.player2}`}
      />
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Match Details
            </h1>
            <p className="text-xl text-gray-600">
              {match.player1} vs {match.player2}
            </p>
          </div>
          <button
            onClick={printMatchTranscript}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            📄 Print Transcript
          </button>
        </div>

        {/* Match Overview */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Match Result */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Match Result</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${match.isComplete ? 'text-green-600' : 'text-yellow-600'}`}>
                  {match.isComplete ? '✅ Completed' : '⏳ In Progress'}
                </span>
              </div>
              {match.isComplete && match.matchWinner && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Winner:</span>
                  <span className="font-bold text-green-600">🏆 {match.matchWinner}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Format:</span>
                <span className="font-medium text-gray-900">{match.matchFormat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium text-gray-900">⏱️ {formatDuration(match.totalDuration)}</span>
              </div>
              
              {/* Match Progress Bar */}
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">Match Progress</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  {match.matchFormat === 'best-of-3' ? (
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(match.gameHistory.length / 3) * 100}%` }}
                    ></div>
                  ) : (
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(match.gameHistory.length / 5) * 100}%` }}
                    ></div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {match.gameHistory.length}/{match.matchFormat === 'best-of-3' ? '3' : '5'} games played
                </div>
              </div>
            </div>
          </div>

          {/* Match Statistics */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Games Played:</span>
                <span className="font-medium text-gray-900">🎮 {match.gameHistory.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Points:</span>
                <span className="font-medium text-gray-900">🎯 {totalPoints}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Handouts:</span>
                <span className="font-medium text-gray-900">🔄 {handouts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Strokes:</span>
                <span className="font-medium text-gray-900">⚡ {strokes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Lets:</span>
                <span className="font-medium text-gray-900">🔄 {lets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total No-lets:</span>
                <span className="font-medium text-gray-900">❌ {noLets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Points/Game:</span>
                <span className="font-medium text-gray-900">
                  📊 {match.gameHistory.length > 0 ? Math.round(totalPoints / match.gameHistory.length) : 0}
                </span>
              </div>
              
              {/* Games Won Breakdown */}
              {match.gameHistory.length > 0 && (
                <div className="mt-4 pt-2 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">Games Won</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">{match.player1}:</span>
                      <span className="font-medium text-blue-600">
                        {match.gameHistory.filter(g => g.winner === match.player1).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">{match.player2}:</span>
                      <span className="font-medium text-green-600">
                        {match.gameHistory.filter(g => g.winner === match.player2).length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Match Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Match Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium text-gray-900">📅 {formatDate(match.matchStartTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Start Time:</span>
                <span className="font-medium text-gray-900">🕐 {formatTime(match.matchStartTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium text-gray-900">🔄 {formatTime(match.updatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Match ID:</span>
                <span className="font-mono text-sm text-gray-700">#{match.id.slice(-8)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Results */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-semibold text-gray-900">Game Results</h3>
            <div className="text-sm text-gray-500 text-right">
              <div>🏸 Standard Squash Scoring</div>
              <div>Games to 11 points (win by 2, max 15)</div>
            </div>
          </div>
          
          {match.gameHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No games completed yet
            </div>
          ) : (
            <div className="grid gap-4">
              {match.gameHistory.map((game, index) => (
                <div 
                  key={index} 
                  className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleGameClick(game)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Game {game.gameNumber}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Duration: {formatDuration(game.duration)}</span>
                        <span>Points: {game.points.length}</span>
                        <span>Handouts: {game.points.filter(p => p.isHandout).length}</span>
                        {game.points.some(p => p.isFault) && (
                          <>
                            <span>⚡ {game.points.filter(p => p.faultType === 'stroke').length}</span>
                            <span>🔄 {game.points.filter(p => p.faultType === 'let').length}</span>
                            <span>❌ {game.points.filter(p => p.faultType === 'no-let').length}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {game.finalScore}
                      </div>
                      <div className="text-sm font-medium text-green-700">
                        Winner: {game.winner}
                      </div>
                      <div className="text-xs text-blue-600 mt-2">
                        Click for details →
                      </div>
                    </div>
                  </div>

                  {/* Point-by-point breakdown (first few points) */}
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-900 mb-2">Point Progression Preview:</h5>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-auto gap-2 text-xs">
                        {game.points.slice(0, 15).map((point, pointIndex) => (
                          <span
                            key={pointIndex}
                            className={`
                              px-2 py-1 rounded font-medium text-xs
                              ${point.isFault && point.faultType === 'stroke' 
                                ? 'bg-green-100 text-green-800 border border-green-300' 
                                : point.isFault && point.faultType === 'let'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : point.isFault && point.faultType === 'no-let'
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : point.isHandout 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-gray-100 text-gray-800'
                              }
                            `}
                            title={point.isFault ? point.faultReason : undefined}
                          >
                            {point.isFault 
                              ? `${point.faultType === 'stroke' ? '⚡' : point.faultType === 'let' ? '🔄' : '❌'} ${point.score}` 
                              : `${point.score} ${point.isHandout ? '(H)' : ''}`
                            }
                          </span>
                        ))}
                        {game.points.length > 15 && (
                          <span className="px-2 py-1 text-gray-500">
                            +{game.points.length - 15} more...
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Games to 11 points (win by 2, max 15) • (H) = Handout • Click card for full details
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Game Detail Modal */}
        {selectedGame && (
          <GameDetailModal
            game={selectedGame}
            player1={match.player1}
            player2={match.player2}
            isOpen={showGameModal}
            onClose={closeGameModal}
          />
        )}

        {/* Actions */}
        <div className="text-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors mr-4"
          >
            Back to Dashboard
          </Link>
          {!match.isComplete && (
            <button
              onClick={() => {/* TODO: Implement resume functionality */}}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              Resume Match
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 